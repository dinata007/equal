// Membuat / memulihkan akun admin aplikasi web (web.users) secara interaktif.
//   npm run db:admin
// Bila username sudah ada: dijadikan admin, diaktifkan, dibuka kuncinya, dan password diganti.
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import sql from 'mssql';
import { dbConfig, dbLabel } from '../src/lib/server/db-config.js';
import { hashPassword, passwordProblem } from '../src/lib/server/auth/password.js';

if (existsSync('.env')) process.loadEnvFile('.env');

// satu readline untuk seluruh sesi (beberapa readline berturut-turut bisa kehilangan input yang ditempel/dipipe)
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let muted = false;
const write = rl._writeToOutput?.bind(rl);
// saat mengetik password, karakter tidak ditampilkan
rl._writeToOutput = (s) => write?.(muted ? s.replace(/[^\r\n]/g, '') : s);
const lines = rl[Symbol.asyncIterator]();

/** pertanyaan biasa / tersembunyi (password tidak ditampilkan saat diketik) */
async function ask(question, hidden = false) {
	process.stdout.write(question);
	muted = hidden;
	const { value } = await lines.next();
	muted = false;
	if (hidden && process.stdin.isTTY) process.stdout.write('\n');
	return String(value ?? '').trim();
}

console.log(`Akun admin aplikasi web di ${dbLabel(process.env)}\n`);
const username = (await ask('Username [admin]: ')) || 'admin';
if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) throw new Error('Username 3–30 karakter: huruf, angka, titik, minus, garis bawah');

const pool = await new sql.ConnectionPool(dbConfig(process.env)).connect();
if (!(await pool.request().query("SELECT OBJECT_ID('web.users', 'U') AS id")).recordset[0].id) {
	console.error('Tabel web.users belum ada. Jalankan dulu: npm run db:migrate');
	rl.close();
	process.exit(1);
}
const existing = (await pool.request().input('u', sql.VarChar(30), username).query('SELECT id, name FROM web.users WHERE username = @u')).recordset[0];
const name = existing ? existing.name : (await ask('Nama lengkap: ')) || username;

let password = '';
for (;;) {
	password = await ask('Password baru: ', true);
	const problem = passwordProblem(password, username);
	if (problem) {
		console.log(`  ${problem}`);
		continue;
	}
	if ((await ask('Ulangi password: ', true)) !== password) {
		console.log('  Password tidak sama');
		continue;
	}
	break;
}
const hash = await hashPassword(password);
const r = pool.request().input('u', sql.VarChar(30), username).input('n', sql.NVarChar(80), name).input('h', sql.VarChar(255), hash);
if (existing) {
	await r.query(`UPDATE web.users SET password_hash = @h, is_admin = 1, active = 1, must_change_password = 0, failed_attempts = 0, locked_until = NULL,
		password_changed_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME(), updated_by = 'db:admin' WHERE username = @u;
		DELETE FROM web.sessions WHERE user_id = (SELECT id FROM web.users WHERE username = @u);`);
} else {
	await r.query(`INSERT INTO web.users (username, name, password_hash, is_admin, active, must_change_password, password_changed_at, created_by)
		VALUES (@u, @n, @h, 1, 1, 0, SYSUTCDATETIME(), 'db:admin')`);
}
await pool.request().input('u', sql.VarChar(30), username).query(`INSERT INTO web.audit_log (user_id, username, event, detail)
	SELECT id, username, 'admin_cli', 'Admin dibuat/dipulihkan lewat npm run db:admin' FROM web.users WHERE username = @u`);
await pool.close();
rl.close();
console.log(`\n✓ ${existing ? 'Akun dipulihkan sebagai admin' : 'Admin dibuat'}: ${username}`);
