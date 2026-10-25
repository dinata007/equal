// Membuat paket deploy server Windows: deploy/paket/ + deploy/senja-deploy-<tanggal>.zip (lihat deploy/BACA-DULU.txt).
// Isi: build produksi, node_modules runtime (tanpa npm install di server), .env, Caddy (HTTPS), migrasi, pasang.ps1.
// Paket berisi .env (password database) → deploy/paket, zip & caddy.exe tidak ikut git.
//   npm run deploy:pack
import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const CADDY = '2.11.7';
const OUT = 'deploy/paket';
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
// tar bawaan Windows (bsdtar: bisa membuat & membuka zip), bukan tar GNU dari Git Bash
const TAR = `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\tar.exe`;

if (!existsSync('.env')) throw new Error('.env tidak ada: paket butuh koneksi database (salin dari .env.example)');

console.log('1/5 build produksi');
run('npm run build');

console.log('2/5 salin file');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const p of ['build', 'db/migrations', 'scripts/db-migrate.mjs', 'src/lib/server/db-config.js', 'package.json', 'package-lock.json', '.npmrc', '.env', 'deploy/pasang.ps1', 'deploy/BACA-DULU.txt'])
	cpSync(p, `${OUT}/${p.replace(/^deploy\//, '')}`, { recursive: true });

console.log('3/5 node_modules runtime (dependencies saja)');
run('npm ci --omit=dev --ignore-scripts --no-audit --no-fund', { cwd: OUT });

console.log(`4/5 Caddy ${CADDY}`);
if (!existsSync('deploy/caddy.exe') || !execFileSync('deploy/caddy.exe', ['version']).toString().startsWith(`v${CADDY} `)) {
	const base = `https://github.com/caddyserver/caddy/releases/download/v${CADDY}`;
	const name = `caddy_${CADDY}_windows_amd64.zip`;
	const zip = Buffer.from(await (await fetch(`${base}/${name}`)).arrayBuffer());
	const sums = await (await fetch(`${base}/caddy_${CADDY}_checksums.txt`)).text();
	const want = sums.split('\n').find((l) => l.trim().endsWith(name))?.split(/\s+/)[0];
	if (!want || createHash('sha512').update(zip).digest('hex') !== want) throw new Error('checksum Caddy tidak cocok');
	writeFileSync('deploy/caddy.zip', zip);
	execFileSync(TAR, ['-xf', 'deploy/caddy.zip', '-C', 'deploy', 'caddy.exe'], { stdio: 'inherit' });
	rmSync('deploy/caddy.zip');
}
cpSync('deploy/caddy.exe', `${OUT}/caddy.exe`);

console.log('5/5 zip');
const zip = `deploy/senja-deploy-${new Date().toLocaleDateString('sv-SE')}.zip`;
rmSync(zip, { force: true });
execFileSync(TAR, ['-a', '-cf', zip, '-C', OUT, ...readdirSync(OUT)], { stdio: 'inherit' });
const mb = (readFileSync(zip).length / 1048576).toFixed(1);
console.log(`\nSelesai: ${zip} (${mb} MB). Salin ke server lalu jalankan pasang.ps1 (lihat deploy/BACA-DULU.txt).`);
