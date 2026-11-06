# Senja ERP

ERP modern berbasis **SvelteKit 3 + Svelte 5 (runes) + Tailwind CSS 4**, PWA, mobile-first.
Tahap saat ini: **prototipe UI/UX** dengan data contoh di browser (localStorage). Tahap berikutnya: koneksi **MSSQL Server**.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:5173
npm run build && node build   # produksi (adapter-node)
npm run check        # type-check
```

Login memakai database (lihat **Koneksi database** di bawah). Data master & transaksi masih data contoh di browser; reset lewat **Profil → Reset** (khusus admin).

## Modul

Material · Inventory · Sales · Toko · Akunting (AR, AP, Kas & Bank, GL) · HR · Pengaturan (Pengguna & Hak Akses).

## Arsitektur (config-driven)

Peta lengkap folder & aturan penamaan: [docs/struktur-folder.md](docs/struktur-folder.md).

| Lokasi | Isi |
|---|---|
| `src/lib/domain/menu.ts` | **Sumber tunggal** struktur menu → routing, breadcrumb, command palette, kunci hak akses (path) |
| `src/lib/domain/defs/masters.ts` | Definisi field master (form, list, kartu mobile, validasi) |
| `src/lib/domain/defs/transactions.ts` | Definisi transaksi: header, detail, total/PPN, dokumen sumber, efek stok/AR/AP/kas, jurnal otomatis, scope closing |
| `src/lib/domain/ledger.ts` | Mesin perhitungan stok, piutang/hutang, kas-bank, jurnal, closing (dari dokumen *posted*) |
| `src/lib/dev-data/db.svelte.ts` | Data prototipe di browser untuk modul yang belum memakai database (satu-satunya titik akses data contoh) |
| `src/lib/state/auth.svelte.ts` | Sesi di browser & `can(path)` — admin = akses penuh, lainnya menu on/off |
| `src/lib/server/master/` | Master dari tabel lama: `registry.ts` (tabel, kunci, brand, penomoran & cek pemakaian meniru PowerBuilder), `lookups.ts` (pilihan dropdown), `service.ts` (baca/tulis + validasi). API: `/api/master/[resource]`, `/api/lookup/[name]` |
| `src/lib/server/auth/` | Login, sesi cookie httpOnly, hash password (scrypt), pengelolaan pengguna; dicek ulang di server untuk setiap `/api` |
| `src/lib/pages/*` | Halaman per kelompok menu: `master/` (MasterPage, Atribut), `transaksi/`, `laporan/`, `produk/`, `pegawai/`, `pengguna/`, … |
| `src/routes/(app)/[...path]` | Satu route dinamis me-render halaman sesuai menu |

Menambah menu baru cukup menambah node di `menu.ts` + definisinya — tanpa membuat route/halaman baru.

Alur dokumen: **Draft → Posting → (Batal)**. Validasi saat posting: field wajib, stok cukup, jurnal seimbang, periode belum di-closing, dokumen sumber tidak dipakai ganda.

## Koneksi database (SQL Server)

Aplikasi ini akan memakai **database aplikasi lama (PowerBuilder)** apa adanya. Selama pengembangan dipakai salinan hasil restore bernama `SENJA_DEMO`. Login & hak akses serta master Supplier, Ekspedisi, Toko, Customer, Bank, COA, Site & Kas Bank sudah memakai database (tabel lama, ditulis langsung); modul lain masih data contoh di browser sampai dipindahkan bertahap.

Butuh **Node.js 22** atau lebih baru.

1. Salin `.env.example` menjadi `.env`, lalu isi `DB_SERVER`, `DB_NAME=SENJA`, `DB_USER`, `DB_PASSWORD`. Password yang mengandung `#` atau spasi harus diapit tanda kutip. File `.env` tidak ikut ke git.
2. Siapkan tabel aplikasi web: `npm run db:migrate` (tabel `dbo.App*`; aman diulang). Script ini juga menyalin akun dari `SYS_USER` tanpa password lamanya.
3. Buat admin pertama: `npm run db:admin` (username & password ditanyakan; password diketik tidak tampil).
4. Jalankan `npm run dev`, login dengan admin tadi. Di **Pengaturan → Pengguna & Hak Akses**, atur menu & brand tiap pengguna lalu **Buat password sementara** (tampil sekali); pengguna wajib menggantinya saat login pertama. Status koneksi terlihat di **Profil → Server database** atau `http://localhost:5173/api/health`.
5. Dokumentasikan struktur database: `npm run db:schema` menulis `docs/database/schema.md`, `schema.json`, dan `objects.sql` (definisi view/procedure/trigger). Isi data tidak disertakan, kecuali contoh nilai kolom kode pendek seperti status/flag (matikan dengan `npm run db:schema -- --no-codes`). Periksa `objects.sql` sebelum di-commit.
6. Source PowerBuilder (`legacy/powerbuilder/*.pbl`, tidak ikut git): `npm run legacy:extract` menulis source teks (.srw/.srd/…) ke `legacy/src/` untuk dibaca saat memetakan master/transaksi.
7. Produksi: `npm run build` lalu `npm start` (membaca `.env` bila ada). Server Windows (senja.co.id): `npm run deploy:pack` membuat `deploy/senja-deploy-<tanggal>.zip` (build + node_modules runtime + `.env` + Caddy untuk HTTPS), lalu di server jalankan `pasang.ps1` — lihat `deploy/BACA-DULU.txt`. Gunakan HTTPS di produksi agar cookie sesi hanya dikirim lewat koneksi aman. Bila dipasang di balik reverse proxy (IIS/nginx), set `ADDRESS_HEADER=X-Forwarded-For` (dan `XFF_DEPTH`) agar batas percobaan login memakai IP asli pengguna, bukan IP proxy.

### Deploy otomatis ke Windows Server via GitHub Actions

1. Pasang **Self-hosted runner** Windows di server target (`runs-on: [self-hosted, windows, x64]`). Ikuti instruksi GitHub: **Settings → Actions → Runners → New self-hosted runner**.
2. Tambahkan repo secrets berikut di GitHub: `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DOMAIN`, `APP_DOMAIN`, `APP_PORT`, `WINDOWS_APP_DIR`.
3. `WINDOWS_APP_DIR` adalah folder aplikasi yang sudah ada di server, misalnya `D:\Web\Senja` (default workflow juga memakai `D:\Web\Senja` bila secret tidak diisi).
4. Setelah runner aktif, setiap push ke `main` otomatis menjalankan workflow `.github/workflows/deploy-windows-server.yml`, membangun paket deploy, lalu memanggil `pasang.ps1 -Update -Zip ...` di server target.
5. Untuk deploy manual: buka **Actions → Deploy to Windows Server → Run workflow**.

Workflow ini aman karena `.env` dibuat dari GitHub Secrets saat build, dan paket deploy dipindahkan ke server oleh runner Windows itu sendiri. Jangan pernah commit file `.env` ke repo.

**Keamanan login:** password di-hash scrypt (tidak bisa dikembalikan ke teks asli); 5× salah password → akun dikunci 15 menit, plus batas 50 login gagal per IP per 15 menit; sesi berakhir setelah 12 jam tidak dipakai atau maksimal 7 hari; ganti password / nonaktifkan akun langsung mencabut sesi di perangkat lain; semua kejadian penting tercatat di `dbo.AppAuditLog`.

Struktur baru milik aplikasi web hanya ditambahkan lewat **script migrasi idempoten** di `db/migrations/` (tabel `dbo` berawalan `App`, tanpa mengubah tabel lama). Lihat `db/migrations/README.md`.

### Tahap berikutnya

1. Petakan tabel lama (dari `docs/database/schema.md`) ke definisi master/transaksi di `src/lib/domain/defs`.
2. Ganti isi `db.svelte.ts` dengan pemanggilan server (remote functions / `+server.ts`) memakai pool di `src/lib/server/db.ts`.
3. Penomoran dokumen & posting di server dalam transaksi DB, mengikuti pola penomoran aplikasi lama.
4. Perhitungan di `ledger.ts` dipindah ke VIEW / stored procedure.
