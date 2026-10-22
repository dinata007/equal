// Dokumentasi struktur database (tanpa isi data) → docs/database/
//   npm run db:schema               schema.md, schema.json, objects.sql
//   npm run db:schema -- --no-codes tanpa contoh nilai kode pendek (status/flag)
//   npm run db:schema -- --no-code  tanpa definisi view/procedure/trigger (objects.sql)
// Koneksi dibaca dari .env (lihat .env.example).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import sql from 'mssql';
import { dbConfig, dbLabel } from '../src/lib/server/db-config.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const env = process.env;
const withCodes = !process.argv.includes('--no-codes');
const withCode = !process.argv.includes('--no-code');
const OUT = 'docs/database';
/** tabel di atas batas ini tidak dihitung nilai kodenya (agar tidak membebani server) */
const CODE_ROW_LIMIT = 2_000_000;

const q = (s) => `[${String(s).replace(/]/g, ']]')}]`;
const md = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
const fmt = (n) => Number(n).toLocaleString('id-ID');

function typeOf(c) {
	const t = c.type;
	if (['varchar', 'char', 'varbinary', 'binary'].includes(t)) return `${t}(${c.max_length === -1 ? 'max' : c.max_length})`;
	if (['nvarchar', 'nchar'].includes(t)) return `${t}(${c.max_length === -1 ? 'max' : c.max_length / 2})`;
	if (['decimal', 'numeric'].includes(t)) return `${t}(${c.precision},${c.scale})`;
	if (['datetime2', 'time', 'datetimeoffset'].includes(t)) return `${t}(${c.scale})`;
	return t;
}
const charLen = (c) => (['nvarchar', 'nchar'].includes(c.type) ? c.max_length / 2 : c.max_length);

console.log(`Menghubungkan ke ${dbLabel(env)} …`);
const pool = await new sql.ConnectionPool(dbConfig(env)).connect();
const run = async (text) => (await pool.request().query(text)).recordset;

const [info] = await run(`SELECT DB_NAME() AS db, CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(32)) AS version, CAST(SERVERPROPERTY('Edition') AS nvarchar(128)) AS edition, DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS collation, (SELECT compatibility_level FROM sys.databases WHERE name = DB_NAME()) AS compat`);

const tables = await run(`
SELECT t.object_id AS id, s.name AS sch, t.name, t.create_date, t.modify_date,
  (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id = t.object_id AND p.index_id IN (0, 1)) AS rows,
  CAST(ep.value AS nvarchar(4000)) AS description
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
LEFT JOIN sys.extended_properties ep ON ep.major_id = t.object_id AND ep.minor_id = 0 AND ep.class = 1 AND ep.name = 'MS_Description'
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name`);

const columns = await run(`
SELECT c.object_id AS id, c.column_id, c.name, ty.name AS type, c.max_length, c.precision, c.scale, c.is_nullable, c.is_identity,
  dc.definition AS default_def, cc.definition AS computed_def, c.collation_name AS collation,
  CAST(ep.value AS nvarchar(4000)) AS description
FROM sys.columns c
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
JOIN sys.tables t ON t.object_id = c.object_id AND t.is_ms_shipped = 0
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
LEFT JOIN sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
LEFT JOIN sys.extended_properties ep ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.class = 1 AND ep.name = 'MS_Description'
ORDER BY c.object_id, c.column_id`);

const indexes = await run(`
SELECT i.object_id AS id, i.name, i.is_primary_key AS pk, i.is_unique AS uq, i.type_desc AS kind,
  STUFF((SELECT ', ' + c.name + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END
         FROM sys.index_columns ic JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
         WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
         ORDER BY ic.key_ordinal FOR XML PATH('')), 1, 2, '') AS cols
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id AND t.is_ms_shipped = 0
WHERE i.type > 0 AND i.is_hypothetical = 0
ORDER BY i.object_id, i.is_primary_key DESC, i.name`);

const fks = await run(`
SELECT f.parent_object_id AS id, f.name,
  STUFF((SELECT ', ' + COL_NAME(fc.parent_object_id, fc.parent_column_id) FROM sys.foreign_key_columns fc WHERE fc.constraint_object_id = f.object_id ORDER BY fc.constraint_column_id FOR XML PATH('')), 1, 2, '') AS cols,
  OBJECT_SCHEMA_NAME(f.referenced_object_id) AS ref_sch, OBJECT_NAME(f.referenced_object_id) AS ref_table,
  STUFF((SELECT ', ' + COL_NAME(fc.referenced_object_id, fc.referenced_column_id) FROM sys.foreign_key_columns fc WHERE fc.constraint_object_id = f.object_id ORDER BY fc.constraint_column_id FOR XML PATH('')), 1, 2, '') AS ref_cols,
  f.delete_referential_action_desc AS on_delete
FROM sys.foreign_keys f
ORDER BY f.parent_object_id, f.name`);

const objects = await run(`
SELECT o.type_desc AS kind, SCHEMA_NAME(o.schema_id) AS sch, o.name,
  OBJECT_SCHEMA_NAME(o.parent_object_id) AS parent_sch, OBJECT_NAME(o.parent_object_id) AS parent,
  CASE WHEN o.type = 'TR' THEN (SELECT STUFF((SELECT ', ' + te.type_desc FROM sys.trigger_events te WHERE te.object_id = o.object_id FOR XML PATH('')), 1, 2, '')) END AS events,
  CASE WHEN o.type = 'TR' THEN OBJECTPROPERTY(o.object_id, 'ExecIsTriggerDisabled') END AS disabled,
  ${withCode ? 'm.definition' : 'NULL'} AS definition, o.modify_date
FROM sys.objects o
LEFT JOIN sys.sql_modules m ON m.object_id = o.object_id
WHERE o.type IN ('V', 'P', 'FN', 'IF', 'TF', 'TR') AND o.is_ms_shipped = 0
ORDER BY o.type_desc, sch, o.name`);

// katalog PowerBuilder (extended attributes): label & judul kolom yang dipakai di layar aplikasi lama
const lower = (s) => String(s ?? '').trim().toLowerCase();
const pbCols = new Map();
const pbTables = new Map();
const hasTable = (n) => tables.some((t) => lower(t.name) === n);
if (hasTable('pbcatcol')) {
	for (const r of await run(`SELECT pbc_tnam, pbc_ownr, pbc_cnam, pbc_labl, pbc_hdr, pbc_cmnt FROM ${q(tables.find((t) => lower(t.name) === 'pbcatcol').sch)}.pbcatcol`)) {
		const label = [r.pbc_labl, r.pbc_hdr].map((v) => String(v ?? '').replace(/~[rnt]/gi, ' ').replace(/[~"]/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
		pbCols.set(`${lower(r.pbc_tnam)}.${lower(r.pbc_cnam)}`, { label: [...new Set(label)].join(' / '), comment: String(r.pbc_cmnt ?? '').trim() });
	}
}
if (hasTable('pbcattbl')) {
	for (const r of await run(`SELECT pbt_tnam, pbt_cmnt FROM ${q(tables.find((t) => lower(t.name) === 'pbcattbl').sch)}.pbcattbl`))
		if (String(r.pbt_cmnt ?? '').trim()) pbTables.set(lower(r.pbt_tnam), String(r.pbt_cmnt).trim());
}

const byId = (list) => {
	const m = new Map();
	for (const r of list) m.set(r.id, [...(m.get(r.id) ?? []), r]);
	return m;
};
const colsBy = byId(columns);
const idxBy = byId(indexes);
const fkBy = byId(fks);

// tabel katalog PowerBuilder sendiri bukan data aplikasi → cukup disebut, tidak dirinci
const isPbCatalog = (name) => /^pbcat(tbl|col|fmt|vld|edt)$/i.test(name);
const pbCatalog = tables.filter((t) => isPbCatalog(t.name)).map((t) => t.name);

const doc = {
	generatedAt: new Date().toISOString(),
	database: info.db,
	version: info.version,
	edition: info.edition,
	collation: info.collation,
	compatibilityLevel: info.compat,
	tables: []
};

let n = 0;
for (const t of tables.filter((x) => !isPbCatalog(x.name))) {
	n++;
	if (process.stdout.isTTY) process.stdout.write(`\r  tabel ${n}/${tables.length - pbCatalog.length}: ${t.sch}.${t.name}`.padEnd(70));
	const rows = Number(t.rows) || 0;
	const pk = (idxBy.get(t.id) ?? []).find((i) => i.pk);
	const cols = [];
	for (const c of colsBy.get(t.id) ?? []) {
		const pb = pbCols.get(`${lower(t.name)}.${lower(c.name)}`);
		const col = {
			name: c.name,
			type: typeOf(c),
			nullable: !!c.is_nullable,
			identity: !!c.is_identity,
			pk: !!pk?.cols.split(', ').some((x) => x.replace(/ DESC$/, '') === c.name),
			default: c.default_def ?? undefined,
			computed: c.computed_def ?? undefined,
			description: c.description || pb?.comment || undefined,
			pbLabel: pb?.label || undefined,
			codes: undefined
		};
		// nilai kode pendek (mis. status 'P'/'D', flag 'Y'/'N') untuk memahami arti kolom; bukan data transaksi
		if (withCodes && rows && rows <= CODE_ROW_LIMIT && ['char', 'varchar', 'nchar', 'nvarchar'].includes(c.type) && charLen(c) > 0 && charLen(c) <= 3 && !c.computed_def) {
			try {
				const vals = await run(`SELECT TOP 13 ${q(c.name)} AS v, COUNT_BIG(*) AS n FROM ${q(t.sch)}.${q(t.name)} WITH (NOLOCK) GROUP BY ${q(c.name)} ORDER BY n DESC`);
				col.codes = vals.slice(0, 12).map((v) => ({ value: v.v, count: Number(v.n) }));
				if (vals.length > 12) col.codes.push({ value: '…', count: 0 });
			} catch {
				/* abaikan kolom yang tidak bisa di-GROUP BY */
			}
		}
		cols.push(col);
	}
	doc.tables.push({
		schema: t.sch,
		name: t.name,
		rows,
		description: t.description || pbTables.get(lower(t.name)) || undefined,
		modified: t.modify_date,
		columns: cols,
		primaryKey: pk ? pk.cols.split(', ') : [],
		indexes: (idxBy.get(t.id) ?? []).filter((i) => !i.pk).map((i) => ({ name: i.name, unique: !!i.uq, columns: i.cols })),
		foreignKeys: (fkBy.get(t.id) ?? []).map((f) => ({ name: f.name, columns: f.cols, references: `${f.ref_sch}.${f.ref_table}(${f.ref_cols})`, onDelete: f.on_delete })),
		triggers: objects.filter((o) => o.kind === 'SQL_TRIGGER' && o.parent_sch === t.sch && o.parent === t.name).map((o) => ({ name: o.name, events: o.events, disabled: !!o.disabled }))
	});
}
if (process.stdout.isTTY) process.stdout.write('\r'.padEnd(72) + '\r');
doc.powerBuilderCatalog = pbCatalog;
doc.objects = objects.map((o) => ({ kind: o.kind, schema: o.sch, name: o.name, parent: o.parent ? `${o.parent_sch}.${o.parent}` : undefined, events: o.events ?? undefined, modified: o.modify_date }));
await pool.close();

/* ---------- tulis file ---------- */
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/schema.json`, JSON.stringify(doc, null, 1) + '\n');

const L = [];
L.push(`# Struktur database ${info.db}`, '');
L.push(`Dibuat otomatis oleh \`npm run db:schema\` pada ${new Date().toLocaleString('id-ID')}. Isi data tidak disertakan${withCodes ? ', kecuali contoh nilai kolom kode pendek (≤ 3 karakter, mis. status/flag) beserta jumlahnya' : ''}.`, '');
L.push(`- SQL Server ${info.version} (${info.edition}), compatibility level ${info.compat}, collation \`${info.collation}\``);
L.push(`- ${doc.tables.length} tabel, ${objects.filter((o) => o.kind === 'VIEW').length} view, ${objects.filter((o) => o.kind === 'SQL_STORED_PROCEDURE').length} stored procedure, ${objects.filter((o) => o.kind.includes('FUNCTION')).length} function, ${objects.filter((o) => o.kind === 'SQL_TRIGGER').length} trigger`);
if (pbCatalog.length) L.push(`- Katalog PowerBuilder (${pbCatalog.map((x) => '`' + x + '`').join(', ')}) tidak dirinci; label kolomnya (${fmt(pbCols.size)} entri) dipakai di kolom "Label / keterangan"`);
L.push('', '## Ringkasan tabel', '', '| Tabel | Baris | Kolom | Primary key | Relasi | Keterangan |', '|---|---:|---:|---|---:|---|');
for (const t of doc.tables)
	L.push(`| [${t.schema}.${t.name}](#${(t.schema + t.name).toLowerCase().replace(/[^a-z0-9_]/g, '')}) | ${fmt(t.rows)} | ${t.columns.length} | ${md(t.primaryKey.join(', ')) || '—'} | ${t.foreignKeys.length || ''} | ${md(t.description)} |`);

for (const t of doc.tables) {
	L.push('', `<a id="${(t.schema + t.name).toLowerCase().replace(/[^a-z0-9_]/g, '')}"></a>`, `## ${t.schema}.${t.name}`, '');
	L.push(`${fmt(t.rows)} baris${t.description ? ` · ${md(t.description)}` : ''}`, '');
	L.push('| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |', '|---|---|:-:|---|---|---|---|');
	for (const c of t.columns) {
		const key = [c.pk && 'PK', c.identity && 'IDENTITY', c.computed && `= ${c.computed}`].filter(Boolean).join(' ');
		const fk = t.foreignKeys.find((f) => f.columns.split(', ').includes(c.name));
		const codes = c.codes?.map((v) => `\`${v.value === null ? 'NULL' : md(v.value) === '' ? "''" : md(v.value)}\`${v.count ? ` ${fmt(v.count)}` : ''}`).join(', ') ?? '';
		L.push(`| ${md(c.name)} | ${c.type} | ${c.nullable ? '✓' : ''} | ${md([key, fk && `→ ${fk.references}`].filter(Boolean).join(' '))} | ${md(c.default)} | ${md([c.pbLabel, c.description].filter(Boolean).join(' — '))} | ${codes} |`);
	}
	if (t.indexes.length) L.push('', '**Index:** ' + t.indexes.map((i) => `\`${md(i.name)}\` (${md(i.columns)})${i.unique ? ' unik' : ''}`).join('; '));
	if (t.triggers.length) L.push('', '**Trigger:** ' + t.triggers.map((x) => `\`${md(x.name)}\` ${md(x.events)}${x.disabled ? ' (nonaktif)' : ''}`).join('; '));
}

const groups = [
	['VIEW', 'View'],
	['SQL_STORED_PROCEDURE', 'Stored procedure'],
	['SQL_SCALAR_FUNCTION', 'Function (skalar)'],
	['SQL_INLINE_TABLE_VALUED_FUNCTION', 'Function (tabel)'],
	['SQL_TABLE_VALUED_FUNCTION', 'Function (tabel)'],
	['SQL_TRIGGER', 'Trigger']
];
L.push('', '## Objek lain', '');
for (const [kind, label] of groups) {
	const list = doc.objects.filter((o) => o.kind === kind);
	if (list.length) L.push(`**${label} (${list.length}):** ` + list.map((o) => `\`${md(o.schema + '.' + o.name)}\`${o.parent ? ` (pada ${md(o.parent)}${o.events ? ' ' + md(o.events) : ''})` : ''}`).join(', '), '');
}
writeFileSync(`${OUT}/schema.md`, L.join('\n') + '\n');

if (withCode) {
	const S = [`-- Definisi view, procedure, function & trigger di ${info.db} (dibuat ${new Date().toLocaleString('id-ID')})`, '-- PERIKSA sebelum di-commit: hapus password / connection string bila ada.', ''];
	for (const o of objects) {
		S.push(`-- ===== ${o.kind}: ${o.sch}.${o.name}${o.parent ? ` (pada ${o.parent_sch}.${o.parent})` : ''}`);
		S.push(o.definition ? o.definition.trim() : '-- (definisi tidak tersedia: terenkripsi / tanpa izin VIEW DEFINITION)', 'GO', '');
	}
	writeFileSync(`${OUT}/objects.sql`, S.join('\n'));
}

console.log(`Selesai: ${doc.tables.length} tabel, ${objects.length} objek → ${OUT}/schema.md, schema.json${withCode ? ', objects.sql' : ''}`);
if (withCode) console.log('Periksa objects.sql sebelum di-commit (hapus password/connection string bila ada).');
