/**
 * Proses artikel model produk (PowerBuilder W_01_M01_ENTRY_B): pilih warna (M_PRODUK_MODEL2) & size
 * (M_PRODUK_MODEL3 + harga per size M_PRODUK_MODEL_SIZE), lalu buat artikel M_PRODUK untuk setiap
 * kombinasi warna × size yang belum ada. Seperti aplikasi lama, artikel yang sudah ada tidak diubah
 * dan tidak dihapus walau warna/size-nya tidak dipilih lagi.
 */
import type { SessionUser } from '#lib/erp/types.ts';
import { audit } from '../auth/audit.ts';
import { AuthError } from '../auth/users.ts';
import { getPool, request, sql } from '../db.ts';
import { get, legacyUser } from './service.ts';

const PRICES = ['hbeli', 'hjual', 'hgrosir', 'pembilang', 'penyebut', 'hjual_barcode', 'mall_barcode'] as const;
type Prices = Record<(typeof PRICES)[number], number | null>;

export interface ArtikelWarna {
	id: string;
	nama: string;
	on: boolean;
	active: boolean;
}
export interface ArtikelSize extends Prices {
	id: string;
	nama: string;
	urut: number | null;
	on: boolean;
	active: boolean;
	/** harga per size sudah tersimpan (tidak diubah lagi oleh proses artikel) */
	saved: boolean;
}

/** model dalam cakupan menu & brand pengguna */
const modelOf = async (user: SessionUser, id: string) => (await get('produk', user, id)) as Record<string, any>;

export async function palette(user: SessionUser, modelId: string) {
	const model = await modelOf(user, modelId);
	const r = await (await request()).input('m', sql.VarChar(20), model.model_id).query(`
		SELECT RTRIM(w.warna_id) AS id, RTRIM(w.nama) AS nama, CAST(IIF(m2.warna_id IS NULL, 0, 1) AS bit) AS [on], CAST(ISNULL(w.flag_aktif, 0) AS bit) AS active
		FROM dbo.M_PRODUK_WARNA w LEFT JOIN dbo.M_PRODUK_MODEL2 m2 ON m2.warna_id = w.warna_id AND m2.model_id = @m
		WHERE w.flag_aktif = 1 OR m2.warna_id IS NOT NULL
		ORDER BY RTRIM(w.nama);

		SELECT RTRIM(s.size_id) AS id, RTRIM(s.nama) AS nama, s.urut, CAST(IIF(m3.size_id IS NULL, 0, 1) AS bit) AS [on],
			CAST(ISNULL(s.flag_aktif, 0) AS bit) AS active, CAST(IIF(ms.size_id IS NULL, 0, 1) AS bit) AS saved,
			ms.hbeli, ms.hjual, ms.hgrosir, ms.pembilang, ms.penyebut, ms.hjual_barcode, ms.mall_barcode
		FROM dbo.M_PRODUK_SIZE s
			LEFT JOIN dbo.M_PRODUK_MODEL3 m3 ON m3.size_id = s.size_id AND m3.model_id = @m
			LEFT JOIN dbo.M_PRODUK_MODEL_SIZE ms ON ms.size_id = s.size_id AND ms.model_id = @m
		WHERE s.flag_aktif = 1 OR m3.size_id IS NOT NULL OR ms.size_id IS NOT NULL
		ORDER BY ISNULL(s.urut, 999), s.size_id;

		SELECT RTRIM(warna_id) AS w, RTRIM(size_id) AS s FROM dbo.M_PRODUK WHERE model_id = @m`);
	const [warna, sizes, skus] = r.recordsets as unknown as [ArtikelWarna[], ArtikelSize[], { w: string; s: string }[]];
	// pb_retrieve: harga per size yang masih kosong diisi harga model
	for (const s of sizes) for (const k of PRICES) if (!s[k]) s[k] = model[k] ?? null;
	return { warna, sizes, skus: skus.map((x) => `${x.w}|${x.s}`) };
}

const num = (v: unknown, label: string, scale: number) => {
	if (v === '' || v == null) return null;
	const n = Number(v);
	if (!Number.isFinite(n) || n < 0 || n >= 1e13) throw new AuthError(`${label} tidak valid`);
	return Number(n.toFixed(scale));
};

export async function process(user: SessionUser, modelId: string, input: Record<string, unknown>, ip: string) {
	const model = await modelOf(user, modelId);
	const warna = Array.isArray(input.warna) ? [...new Set(input.warna.map(String))] : [];
	const sizes = Array.isArray(input.sizes) ? (input.sizes as Record<string, unknown>[]) : [];
	if (!warna.length) throw new AuthError('Pilih minimal satu warna');
	if (!sizes.length) throw new AuthError('Pilih minimal satu size');
	if (warna.length > 200 || sizes.length > 100) throw new AuthError('Pilihan terlalu banyak');
	const prices = new Map<string, Prices>();
	for (const s of sizes) {
		const id = String(s.id ?? '');
		if (!id || prices.has(id)) throw new AuthError('Size tidak valid');
		prices.set(id, Object.fromEntries(PRICES.map((k) => [k, num(s[k], `Harga size ${id}`, k === 'pembilang' || k === 'penyebut' ? 2 : 0)])) as Prices);
	}
	const usr = (await legacyUser(user)).slice(0, 15);
	const m = model.model_id as string;

	const tx = new sql.Transaction(await getPool());
	await tx.begin();
	let added = 0;
	try {
		const q = () => new sql.Request(tx).input('m', sql.VarChar(20), m).input('u', sql.VarChar(15), usr);
		const raw = (await q().query('SELECT * FROM dbo.M_PRODUK_MODEL WITH (UPDLOCK) WHERE model_id = @m')).recordset[0];
		if (!raw) throw new AuthError('Model tidak ditemukan', 404);

		// nama warna & size dari master; yang dipilih harus aktif atau sudah terpasang di model ini
		const w = await q().query(`SELECT RTRIM(w.warna_id) AS id, RTRIM(w.nama) AS nama FROM dbo.M_PRODUK_WARNA w
			WHERE w.flag_aktif = 1 OR EXISTS (SELECT 1 FROM dbo.M_PRODUK_MODEL2 x WHERE x.model_id = @m AND x.warna_id = w.warna_id)`);
		const s = await q().query(`SELECT RTRIM(s.size_id) AS id, RTRIM(s.nama) AS nama,
				CAST(IIF(EXISTS (SELECT 1 FROM dbo.M_PRODUK_MODEL_SIZE x WHERE x.model_id = @m AND x.size_id = s.size_id), 1, 0) AS bit) AS saved
			FROM dbo.M_PRODUK_SIZE s
			WHERE s.flag_aktif = 1 OR EXISTS (SELECT 1 FROM dbo.M_PRODUK_MODEL3 x WHERE x.model_id = @m AND x.size_id = s.size_id)`);
		const wName = new Map(w.recordset.map((x) => [x.id as string, x.nama as string]));
		const sRow = new Map(s.recordset.map((x) => [x.id as string, x as { nama: string; saved: boolean }]));
		for (const id of warna) if (!wName.has(id)) throw new AuthError(`Warna ${id} tidak ditemukan atau nonaktif`);
		for (const id of prices.keys()) if (!sRow.has(id)) throw new AuthError(`Size ${id} tidak ditemukan atau nonaktif`);

		// warna & size terpilih model (M_PRODUK_MODEL2 / 3): yang tidak dipilih dilepas, yang baru ditambah
		async function sync(table: string, col: string, list: string[]) {
			const del = q();
			const a = list.map((v, i) => (del.input(`v${i}`, sql.VarChar(2), v), `@v${i}`));
			await del.query(`DELETE FROM ${table} WHERE model_id = @m AND ${col} NOT IN (${a.join(', ')})`);
			const ins = q();
			const b = list.map((v, i) => (ins.input(`v${i}`, sql.VarChar(2), v), `(@v${i})`));
			await ins.query(`INSERT INTO ${table} (model_id, ${col}, usrupd, usrtgl)
				SELECT @m, v.id, @u, GETDATE() FROM (VALUES ${b.join(', ')}) v(id)
				WHERE NOT EXISTS (SELECT 1 FROM ${table} x WHERE x.model_id = @m AND x.${col} = v.id)`);
		}
		await sync('dbo.M_PRODUK_MODEL2', 'warna_id', warna);
		await sync('dbo.M_PRODUK_MODEL3', 'size_id', [...prices.keys()]);

		// harga per size: hanya size yang belum punya harga (harga tersimpan tidak diubah, seperti PB)
		for (const [id, p] of prices) {
			if (sRow.get(id)!.saved) continue;
			const r = q().input('s', sql.VarChar(2), id);
			for (const k of PRICES) r.input(k, k === 'pembilang' || k === 'penyebut' ? sql.Numeric(15, 2) : sql.Numeric(15, 0), p[k]);
			await r.query(`INSERT INTO dbo.M_PRODUK_MODEL_SIZE (model_id, size_id, ${PRICES.join(', ')}) VALUES (@m, @s, ${PRICES.map((k) => '@' + k).join(', ')})`);
		}

		// artikel baru: kode = model + warna + size
		const existing = new Set((await q().query('SELECT RTRIM(warna_id) + \'|\' + RTRIM(size_id) AS k FROM dbo.M_PRODUK WHERE model_id = @m')).recordset.map((x) => x.k as string));
		for (const wid of warna) {
			for (const [sid, p] of prices) {
				if (existing.has(`${wid}|${sid}`)) continue;
				const r = q()
					.input('id', sql.VarChar(20), m + wid + sid)
					.input('nama', sql.VarChar(50), `${String(raw.nama ?? '').trim()} (${wName.get(wid)}/${sRow.get(sid)!.nama})`.slice(0, 50))
					.input('w', sql.VarChar(2), wid)
					.input('s', sql.VarChar(2), sid);
				for (const k of PRICES) r.input(k, k === 'pembilang' || k === 'penyebut' ? sql.Numeric(15, 2) : sql.Numeric(15, 0), p[k]);
				await r.query(`
					INSERT INTO dbo.M_PRODUK (produk_id, model_id, nama, nama_pendek, nama_pendek2, produk_id_lama, ${PRICES.join(', ')},
						flag_aktif, brand_id, gender_id, grup_dept, dept_id, bahan_id, nomor, period, warna_id, size_id, tipe_id, jenis_id, aps_id,
						model_produk, usrupd, usrtgl)
					SELECT @id, model_id, @nama, nama_pendek, nama_pendek2, model_id_lama, ${PRICES.map((k) => '@' + k).join(', ')},
						flag_aktif, brand_id, gender_id, grup_dept, dept_id, bahan_id, nomor, period, @w, @s, tipe_id, jenis_id, aps_id,
						model_produk, @u, GETDATE()
					FROM dbo.M_PRODUK_MODEL WHERE model_id = @m`);
				added++;
			}
		}
		await tx.commit();
	} catch (e) {
		await tx.rollback().catch(() => {});
		throw e;
	}
	await audit('master.update', { userId: user.id, username: user.username, ip, detail: `produk ${m}: proses artikel, ${added} artikel baru` });
	return { added, ...(await palette(user, m)) };
}
