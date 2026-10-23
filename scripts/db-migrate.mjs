// Menjalankan script migrasi db/migrations/NNN_*.sql berurutan ke database di .env.
// Semua script idempoten, jadi aman dijalankan ulang.
//   npm run db:migrate            jalankan semua
//   npm run db:migrate -- --list  hanya tampilkan daftar script
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import sql from 'mssql';
import { dbConfig, dbLabel } from '../src/lib/server/db-config.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const DIR = 'db/migrations';
const files = readdirSync(DIR).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();

if (process.argv.includes('--list')) {
	for (const f of files) console.log(f);
	process.exit(0);
}

console.log(`Migrasi ke ${dbLabel(process.env)} …`);
const pool = await new sql.ConnectionPool(dbConfig(process.env)).connect();
let failed = false;
for (const f of files) {
	// batch dipisah baris "GO" seperti di SSMS/sqlcmd
	const batches = readFileSync(`${DIR}/${f}`, 'utf8').split(/^\s*GO\s*;?\s*$/im).map((b) => b.trim()).filter(Boolean);
	try {
		let affected = 0;
		for (const b of batches) affected += (await pool.request().batch(b)).rowsAffected.reduce((a, n) => a + n, 0);
		console.log(`  ✓ ${f}${affected ? ` (${affected} baris)` : ''}`);
	} catch (e) {
		console.error(`  ✗ ${f}: ${e instanceof Error ? e.message : e}`);
		failed = true;
		break;
	}
}
await pool.close();
process.exit(failed ? 1 : 0);
