// Membuat paket deploy server Windows: deploy/paket/ + deploy/equal-deploy-<tanggal>.zip (lihat deploy/BACA-DULU.txt).
// Isi: build produksi, node_modules runtime (tanpa npm install di server), .env, migrasi, pasang.ps1 (+ berhenti.bat, update.bat,
// otomatis.ps1), VERSION (commit git), EQUAL (penanda paket Equal, agar paket Senja/Equal tidak tertukar di server).
// Tanpa Caddy: HTTPS memakai Caddy milik Senja di server yang sama (pasang.ps1 menulis C:\ProgramData\Caddy\sites\equal.caddy).
// Paket berisi .env (password database) → deploy/paket & zip tidak ikut git.
//   npm run deploy:pack
//   npm run deploy:pack -- --ci   tanpa .env (server memakai .env miliknya), nama zip + commit; dipakai GitHub Actions
import { execFileSync, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUT = 'deploy/paket';
const CI = process.argv.includes('--ci');
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
// tar bawaan Windows (bsdtar: bisa membuat & membuka zip), bukan tar GNU dari Git Bash
const TAR = `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\tar.exe`;

if (!CI && !existsSync('.env')) throw new Error('.env tidak ada: paket butuh koneksi database (salin dari .env.example)');

console.log('1/4 build produksi');
run('npm run build');

console.log('2/4 salin file');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const p of ['build', 'db/migrations', 'scripts/db-migrate.mjs', 'src/lib/server/db-config.js', 'package.json', 'package-lock.json', '.npmrc', ...(CI ? [] : ['.env']), 'deploy/pasang.ps1', 'deploy/otomatis.ps1', 'deploy/berhenti.bat', 'deploy/update.bat', 'deploy/BACA-DULU.txt'])
	cpSync(p, `${OUT}/${p.replace(/^deploy\//, '')}`, { recursive: true });
// commit paket: otomatis.ps1 membandingkannya dengan commit terbaru di main
const sha = process.env.GITHUB_SHA || execSync('git rev-parse HEAD').toString().trim();
writeFileSync(`${OUT}/VERSION`, sha + '\n');
writeFileSync(`${OUT}/EQUAL`, 'Paket Equal (bukan Senja). Pasang di folder tersendiri, mis. D:\\Equal.\n');

console.log('3/4 node_modules runtime (dependencies saja)');
run('npm ci --omit=dev --ignore-scripts --no-audit --no-fund', { cwd: OUT });

console.log('4/4 zip');
const zip = `deploy/equal-deploy-${new Date().toLocaleDateString('sv-SE')}${CI ? '-' + sha.slice(0, 7) : ''}.zip`;
rmSync(zip, { force: true });
execFileSync(TAR, ['-a', '-cf', zip, '-C', OUT, ...readdirSync(OUT)], { stdio: 'inherit' });
const mb = (readFileSync(zip).length / 1048576).toFixed(1);
console.log(`\nSelesai: ${zip} (${mb} MB). Salin ke server lalu jalankan pasang.ps1 (lihat deploy/BACA-DULU.txt).`);
