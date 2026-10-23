/**
 * Baca & tulis master di tabel lama. Semua validasi di server: hak menu, cakupan brand, kolom
 * yang boleh diisi (hanya field di definisi form), tipe & panjang kolom (dari metadata database),
 * nilai lookup yang sah, dan pemakaian di transaksi sebelum hapus.
 *
 * Ubah data hanya menulis kolom yang benar-benar berubah, agar tidak menimpa isian kolom lain
 * yang sedang diubah aplikasi PowerBuilder.
 */
import type { FieldDef, LookupOption, SessionUser } from '#lib/erp/types.ts';
import { audit } from '../auth/audit.ts';
import { AuthError } from '../auth/users.ts';
import { getPool, request, sql } from '../db.ts';
import { lookupOf } from './lookups.ts';
import { resourceOf, type Resource, type Values } from './registry.ts';

/* ---------------- metadata kolom ---------------- */

interface ColMeta {
	type: string;
	length: number | null;
	precision: number | null;
	scale: number | null;
	nullable: boolean;
}
const metaCache = new Map<string, Promise<Map<string, ColMeta>>>();

function columns(table: string) {
	let p = metaCache.get(table);
	if (!p) {
		const [schema, name] = table.split('.');
		p = request()
			.then((r) =>
				r.input('s', sql.VarChar(128), schema).input('t', sql.VarChar(128), name).query(`
					SELECT COLUMN_NAME AS name, DATA_TYPE AS type, CHARACTER_MAXIMUM_LENGTH AS length, NUMERIC_PRECISION AS precision,
						NUMERIC_SCALE AS scale, CASE IS_NULLABLE WHEN 'YES' THEN 1 ELSE 0 END AS nullable
					FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @s AND TABLE_NAME = @t`)
			)
			.then((r) => new Map(r.recordset.map((c) => [String(c.name).toLowerCase(), { ...c, nullable: !!c.nullable } as ColMeta])));
		p.catch(() => metaCache.delete(table));
		metaCache.set(table, p);
	}
	return p;
}

function sqlType(m: ColMeta): sql.ISqlType | (() => sql.ISqlType) {
	const len = m.length === -1 ? sql.MAX : (m.length ?? 255);
	switch (m.type) {
		case 'varchar': return sql.VarChar(len);
		case 'nvarchar': return sql.NVarChar(len);
		case 'char': return sql.Char(len);
		case 'nchar': return sql.NChar(len);
		case 'bit': return sql.Bit;
		case 'int': return sql.Int;
		case 'smallint': return sql.SmallInt;
		case 'tinyint': return sql.TinyInt;
		case 'bigint': return sql.BigInt;
		case 'numeric':
		case 'decimal': return sql.Numeric(m.precision ?? 18, m.scale ?? 0);
		case 'datetime': return sql.DateTime;
		case 'smalldatetime': return sql.SmallDateTime;
		case 'date': return sql.Date;
		default: return sql.NVarChar(len);
	}
}
const isText = (m: ColMeta) => ['varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext'].includes(m.type);
const isNumber = (m: ColMeta) => ['int', 'smallint', 'tinyint', 'bigint', 'numeric', 'decimal', 'float', 'real', 'money'].includes(m.type);

/* ---------------- hak akses & brand ---------------- */

const canMenu = (u: SessionUser, path: string) => u.admin || u.menus.includes(path);

function requireMenu(u: SessionUser, res: Resource) {
	if (!canMenu(u, res.menu)) throw new AuthError('Anda tidak punya akses ke menu ini', 403);
}

/** null = semua brand */
const brandScope = (u: SessionUser) => (u.admin || u.brands.includes('*') ? null : u.brands);

function brandWhere(req: sql.Request, column: string, open: boolean | undefined, scope: string[] | null) {
	if (!scope) return '1 = 1';
	const ps = scope.map((b, i) => (req.input(`_b${i}`, sql.VarChar(10), b), `@_b${i}`));
	const list = ps.length ? `RTRIM(${column}) IN (${ps.join(', ')})` : '1 = 0';
	return open ? `(${list} OR ${column} IS NULL OR RTRIM(${column}) IN ('', '%'))` : list;
}

/* ---------------- lookup ---------------- */

export async function lookup(name: string, user: SessionUser): Promise<LookupOption[]> {
	const def = lookupOf(name);
	if (!def) throw new AuthError('Data tidak ditemukan', 404);
	const req = await request();
	const where = def.brand ? brandWhere(req, `x.${def.brand.column}`, def.brand.open, brandScope(user)) : '1 = 1';
	const r = await req.query(`SELECT * FROM (${def.sql}) x WHERE ${where} ORDER BY x.code`);
	return r.recordset.map((row) => {
		const o: Record<string, any> = {};
		for (const [k, v] of Object.entries(row)) o[k] = typeof v === 'string' ? v.trim() : v;
		return { ...o, id: String(o.id ?? ''), code: String(o.code ?? ''), name: String(o.name ?? ''), hint: o.hint ?? undefined, active: !!o.active } as LookupOption;
	});
}

/* ---------------- konversi nilai ---------------- */

const KEY_SEP = '|';
const rowId = (res: Resource, v: Values) => res.keys.map((k) => String(v[k] ?? '').trim()).join(KEY_SEP);

function parseId(res: Resource, id: unknown): Values {
	const parts = typeof id === 'string' ? id.split(KEY_SEP) : [];
	if (parts.length !== res.keys.length || parts.some((p) => !p || p.length > 50)) throw new AuthError('Data tidak ditemukan', 404);
	return Object.fromEntries(res.keys.map((k, i) => [k, parts[i]]));
}

/** nilai database → nilai form */
function decode(f: FieldDef | undefined, m: ColMeta, v: unknown) {
	if (f?.type === 'toggle') return m.type === 'bit' ? !!v : String(v ?? '').trim().toUpperCase() === 'Y';
	if (v == null) return isNumber(m) ? null : '';
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === 'string') return v.trimEnd();
	return v;
}

const optionValue = (o: string | { value: string }) => (typeof o === 'string' ? o : o.value);

/** nilai form → nilai database (melempar AuthError bila tidak sah) */
function encode(f: FieldDef, m: ColMeta, v: unknown) {
	if (f.type === 'toggle') return m.type === 'bit' ? !!v : v ? 'Y' : 'N';
	if (isNumber(m)) {
		if (v === '' || v == null) return null;
		const n = Number(v);
		if (!Number.isFinite(n)) throw new AuthError(`${f.label} harus berupa angka`);
		if (n < 0) throw new AuthError(`${f.label} tidak boleh negatif`);
		const max = 10 ** ((m.precision ?? 18) - (m.scale ?? 0));
		if (Math.abs(n) >= max) throw new AuthError(`${f.label} terlalu besar`);
		return m.scale ? Number(n.toFixed(m.scale)) : Math.round(n);
	}
	if (isText(m)) {
		if (v != null && typeof v !== 'string' && typeof v !== 'number') throw new AuthError(`${f.label} tidak valid`);
		const s = v == null ? '' : String(v).trim();
		if (!s) return m.nullable ? null : '';
		const max = Math.min(m.length && m.length > 0 ? m.length : Infinity, f.maxLength ?? Infinity);
		if (s.length > max) throw new AuthError(`${f.label} maksimal ${max} karakter`);
		if (f.type === 'select' && f.options && !f.options.some((o) => optionValue(o) === s)) throw new AuthError(`${f.label} tidak valid`);
		return s;
	}
	if (['datetime', 'smalldatetime', 'date'].includes(m.type)) {
		if (v === '' || v == null) return null;
		const d = new Date(String(v));
		if (Number.isNaN(d.getTime())) throw new AuthError(`${f.label} bukan tanggal yang valid`);
		return d;
	}
	throw new AuthError(`${f.label} tidak bisa disimpan`);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a instanceof Date ? a.toISOString() : a) === JSON.stringify(b instanceof Date ? b.toISOString() : b);

/* ---------------- baca ---------------- */

async function selectList(res: Resource) {
	const meta = await columns(res.table);
	const cols = new Set([...res.keys, ...res.def.fields.map((f) => f.key), ...(res.brand ? [res.brand.column] : [])]);
	for (const c of cols) if (!meta.has(c.toLowerCase())) throw new Error(`Kolom ${c} tidak ada di ${res.table}`);
	return { meta, cols: [...cols] };
}

function toRow(res: Resource, meta: Map<string, ColMeta>, cols: string[], raw: Record<string, unknown>) {
	const byKey = new Map(res.def.fields.map((f) => [f.key, f]));
	const out: Values = {};
	for (const c of cols) out[c] = decode(byKey.get(c), meta.get(c.toLowerCase())!, raw[c]);
	out.id = rowId(res, out);
	return out;
}

function resourceFor(name: string) {
	const res = resourceOf(name);
	if (!res) throw new AuthError('Data tidak ditemukan', 404);
	return res;
}

export async function list(name: string, user: SessionUser) {
	const res = resourceFor(name);
	requireMenu(user, res);
	const { meta, cols } = await selectList(res);
	const req = await request();
	const where = res.brand && res.brand.list !== false ? brandWhere(req, res.brand.column, res.brand.open, brandScope(user)) : '1 = 1';
	const r = await req.query(`SELECT ${cols.join(', ')} FROM ${res.table} WHERE ${where} ORDER BY ${res.order}`);
	return r.recordset.map((raw) => toRow(res, meta, cols, raw));
}

/** satu baris (dengan cakupan brand pengguna) atau 404 */
async function findOne(res: Resource, user: SessionUser, keys: Values, req: sql.Request) {
	const { meta, cols } = await selectList(res);
	const where = res.keys.map((k) => (req.input(`k_${k}`, sqlType(meta.get(k.toLowerCase())!), keys[k]), `${k} = @k_${k}`));
	if (res.brand) where.push(brandWhere(req, res.brand.column, res.brand.open, brandScope(user)));
	const r = await req.query(`SELECT ${cols.join(', ')} FROM ${res.table} WHERE ${where.join(' AND ')}`);
	if (!r.recordset[0]) throw new AuthError('Data tidak ditemukan atau di luar cakupan brand Anda', 404);
	return { meta, cols, raw: r.recordset[0] as Record<string, unknown>, row: toRow(res, meta, cols, r.recordset[0]) };
}

/* ---------------- tulis ---------------- */

/** nama pengguna aplikasi lama untuk kolom usrupd (akun salinan SYS_USER), selain itu username web */
async function legacyUser(user: SessionUser) {
	const r = await (await request()).input('id', sql.Int, user.id).query('SELECT legacy_user_id AS l FROM web.users WHERE id = @id');
	return String(r.recordset[0]?.l ?? user.username);
}

/**
 * Ambil isian dari browser: hanya field definisi form yang boleh diubah (bukan kode otomatis,
 * bukan kunci saat ubah), dikonversi & divalidasi sesuai kolom database.
 */
async function readInput(res: Resource, user: SessionUser, input: Values, base: Values | null) {
	const meta = await columns(res.table);
	const editing = !!base;
	const merged: Values = { ...(base ?? {}) };
	for (const f of res.def.fields) {
		if (f.auto && !editing) continue;
		if (editing && (f.lockOnEdit || f.auto || f.readonly)) continue;
		if (!(f.key in input)) {
			if (!editing) merged[f.key] = f.type === 'toggle' ? !!f.default : typeof f.default === 'function' ? '' : (f.default ?? '');
			continue;
		}
		merged[f.key] = input[f.key];
	}

	const out: Values = {};
	const lookups = new Map<string, Promise<Set<string>>>();
	const known = (src: string) => {
		if (!lookups.has(src)) lookups.set(src, lookup(src, user).then((os) => new Set(os.map((o) => o.id))));
		return lookups.get(src)!;
	};
	for (const f of res.def.fields) {
		if (f.auto && !editing) continue;
		const m = meta.get(f.key.toLowerCase())!;
		const visible = !f.showIf || f.showIf(merged);
		const v = encode(f, m, merged[f.key]);
		if (f.required && visible && (v === null || v === '')) throw new AuthError(`${f.label} wajib diisi`);
		if (f.source && visible && v != null && v !== '') {
			const changed = !editing || !same(encode(f, m, base![f.key]), v);
			if (changed && !(await known(f.source)).has(String(v))) throw new AuthError(`${f.label} "${v}" tidak ditemukan atau di luar cakupan Anda`);
		}
		if (res.keys.includes(f.key) && typeof v === 'string' && v.includes(KEY_SEP)) throw new AuthError(`${f.label} tidak boleh memuat karakter "${KEY_SEP}"`);
		out[f.key] = v;
	}
	return { meta, values: out };
}

function bind(req: sql.Request, meta: Map<string, ColMeta>, values: Values, prefix: string) {
	return Object.keys(values).map((c) => {
		req.input(`${prefix}${c}`, sqlType(meta.get(c.toLowerCase())!), values[c]);
		return `@${prefix}${c}`;
	});
}

async function stampValues(res: Resource, meta: Map<string, ColMeta>, user: SessionUser, values: Values) {
	if (!res.stamp) return;
	const len = meta.get(res.stamp.user.toLowerCase())?.length ?? 15;
	values[res.stamp.user] = (await legacyUser(user)).slice(0, len > 0 ? len : 15);
	values[res.stamp.time] = new Date();
}

export async function create(name: string, user: SessionUser, input: Values, ip: string) {
	const res = resourceFor(name);
	requireMenu(user, res);
	const { meta, values } = await readInput(res, user, input, null);
	const pool = await getPool();
	const msg = res.check && (await res.check(() => pool.request(), values));
	if (msg) throw new AuthError(msg);
	await stampValues(res, meta, user, values);

	const tx = new sql.Transaction(pool);
	await tx.begin();
	try {
		if (res.next) {
			const req = new sql.Request(tx);
			for (const k of res.keys) if (values[k] != null) req.input(k, sqlType(meta.get(k.toLowerCase())!), values[k]);
			await res.next(req, values);
		}
		for (const k of res.keys) if (values[k] == null || values[k] === '') throw new AuthError(`${res.def.fields.find((f) => f.key === k)?.label ?? k} wajib diisi`);
		const dup = new sql.Request(tx);
		const where = res.keys.map((k) => (dup.input(`k_${k}`, sqlType(meta.get(k.toLowerCase())!), values[k]), `${k} = @k_${k}`));
		const exists = await dup.query(`SELECT COUNT(*) AS n FROM ${res.table} WITH (UPDLOCK, HOLDLOCK) WHERE ${where.join(' AND ')}`);
		if (exists.recordset[0].n) throw new AuthError(`Data dengan kode ${rowId(res, values).replaceAll(KEY_SEP, ' / ')} sudah ada`, 409);
		const ins = new sql.Request(tx);
		const params = bind(ins, meta, values, 'v_');
		await ins.query(`INSERT INTO ${res.table} (${Object.keys(values).join(', ')}) VALUES (${params.join(', ')})`);
		await tx.commit();
	} catch (e) {
		await tx.rollback().catch(() => {});
		throw e;
	}
	const id = rowId(res, values);
	await audit('master.create', { userId: user.id, username: user.username, ip, detail: `${name} ${id}` });
	return (await findOne(res, user, parseId(res, id), await request())).row;
}

export async function update(name: string, user: SessionUser, id: unknown, input: Values, ip: string) {
	const res = resourceFor(name);
	requireMenu(user, res);
	const keys = parseId(res, id);
	const cur = await findOne(res, user, keys, await request());
	const { meta, values } = await readInput(res, user, input, cur.row);
	const merged = { ...cur.row, ...values };
	const pool = await getPool();
	const msg = res.check && (await res.check(() => pool.request(), merged));
	if (msg) throw new AuthError(msg);
	Object.assign(values, Object.fromEntries(Object.keys(values).map((k) => [k, merged[k]])));

	const byKey = new Map(res.def.fields.map((f) => [f.key, f]));
	const changed: Values = {};
	for (const [c, v] of Object.entries(values)) {
		const f = byKey.get(c)!;
		if (!same(encode(f, meta.get(c.toLowerCase())!, cur.row[c]), v)) changed[c] = v;
	}
	if (!Object.keys(changed).length) return cur.row;
	const cols = Object.keys(changed);
	await stampValues(res, meta, user, changed);

	const req = await request();
	const sets = bind(req, meta, changed, 'v_').map((p, i) => `${Object.keys(changed)[i]} = ${p}`);
	const where = res.keys.map((k) => (req.input(`k_${k}`, sqlType(meta.get(k.toLowerCase())!), keys[k]), `${k} = @k_${k}`));
	await req.query(`UPDATE ${res.table} SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`);
	await audit('master.update', { userId: user.id, username: user.username, ip, detail: `${name} ${cur.row.id}: ${cols.join(', ')}` });
	return (await findOne(res, user, keys, await request())).row;
}

/** label pemakaian pertama (transaksi/master lain) atau null bila belum dipakai */
async function usage(res: Resource, meta: Map<string, ColMeta>, keys: Values) {
	if (!res.usedIn?.length) return null;
	const req = await request();
	for (const k of res.keys) req.input(k, sqlType(meta.get(k.toLowerCase())!), keys[k]);
	const parts = res.usedIn.map(([label, from], i) => {
		req.input(`_u${i}`, sql.NVarChar(100), label);
		return `SELECT @_u${i} AS l WHERE EXISTS (SELECT 1 FROM ${from})`;
	});
	const r = await req.query(`SELECT TOP 1 l FROM (${parts.join(' UNION ALL ')}) x`);
	return (r.recordset[0]?.l as string | undefined) ?? null;
}

export async function remove(name: string, user: SessionUser, id: unknown, ip: string) {
	const res = resourceFor(name);
	requireMenu(user, res);
	const keys = parseId(res, id);
	const cur = await findOne(res, user, keys, await request());
	const used = await usage(res, cur.meta, keys);
	if (used) throw new AuthError(`Tidak bisa dihapus: sudah dipakai di ${used}.${res.def.activeField ? ' Nonaktifkan saja.' : ''}`, 409);
	const req = await request();
	const where = res.keys.map((k) => (req.input(`k_${k}`, sqlType(cur.meta.get(k.toLowerCase())!), keys[k]), `${k} = @k_${k}`));
	await req.query(`DELETE FROM ${res.table} WHERE ${where.join(' AND ')}`);
	await audit('master.delete', { userId: user.id, username: user.username, ip, detail: `${name} ${cur.row.id}` });
}

/** aktifkan / nonaktifkan banyak baris sekaligus */
export async function setActive(name: string, user: SessionUser, ids: unknown, active: boolean, ip: string) {
	const res = resourceFor(name);
	requireMenu(user, res);
	const field = res.def.fields.find((f) => f.key === res.def.activeField);
	if (!field) throw new AuthError('Data ini tidak punya status aktif');
	if (!Array.isArray(ids) || !ids.length || ids.length > 1000) throw new AuthError('Pilih data terlebih dahulu');
	const meta = await columns(res.table);
	const m = meta.get(field.key.toLowerCase())!;
	const tx = new sql.Transaction(await getPool());
	await tx.begin();
	let count = 0;
	try {
		for (const id of ids) {
			const keys = parseId(res, id);
			const req = new sql.Request(tx);
			req.input('v', sqlType(m), encode(field, m, active));
			const where = res.keys.map((k) => (req.input(`k_${k}`, sqlType(meta.get(k.toLowerCase())!), keys[k]), `${k} = @k_${k}`));
			if (res.brand) where.push(brandWhere(req, res.brand.column, res.brand.open, brandScope(user)));
			count += (await req.query(`UPDATE ${res.table} SET ${field.key} = @v WHERE ${where.join(' AND ')}`)).rowsAffected[0];
		}
		await tx.commit();
	} catch (e) {
		await tx.rollback().catch(() => {});
		throw e;
	}
	await audit('master.update', { userId: user.id, username: user.username, ip, detail: `${name}: ${count} data ${active ? 'diaktifkan' : 'dinonaktifkan'}` });
	return count;
}
