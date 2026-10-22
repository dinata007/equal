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

Akun demo (password = username + `123`): `admin`, `manager`, `gudang`, `kasir`, `finance`, `hrd`.
Reset data contoh: menu **Profil → Reset** (khusus Administrator).

## Modul

Material · Inventory · Sales · Toko · Akunting (AR, AP, Kas & Bank, GL) · HR · Pengaturan (Pengguna, Role & Hak Akses).

## Arsitektur (config-driven)

| Lokasi | Isi |
|---|---|
| `src/lib/erp/menu.ts` | **Sumber tunggal** struktur menu → routing, breadcrumb, command palette, kunci hak akses (path) |
| `src/lib/erp/defs/masters.ts` | Definisi field master (form, list, kartu mobile, validasi) |
| `src/lib/erp/defs/transactions.ts` | Definisi transaksi: header, detail, total/PPN, dokumen sumber, efek stok/AR/AP/kas, jurnal otomatis, scope closing |
| `src/lib/erp/ledger.ts` | Mesin perhitungan stok, piutang/hutang, kas-bank, jurnal, closing (dari dokumen *posted*) |
| `src/lib/erp/db.svelte.ts` | Lapisan data (satu-satunya titik akses data) |
| `src/lib/erp/auth.svelte.ts` | Sesi & otorisasi `can(path, action)` — aksi: lihat/tambah/ubah/hapus/posting |
| `src/lib/pages/*` | Halaman generik: `MasterPage`, `TransactionPage`, report & utilitas |
| `src/routes/(app)/[...path]` | Satu route dinamis me-render halaman sesuai menu |

Menambah menu baru cukup menambah node di `menu.ts` + definisinya — tanpa membuat route/halaman baru.

Alur dokumen: **Draft → Posting → (Batal)**. Validasi saat posting: field wajib, stok cukup, jurnal seimbang, periode belum di-closing, dokumen sumber tidak dipakai ganda.

## Koneksi database (SQL Server)

Aplikasi ini akan memakai **database aplikasi lama (PowerBuilder)** apa adanya. Selama pengembangan dipakai salinan hasil restore bernama `SENJA_DEMO`. Tanpa `.env`, aplikasi tetap berjalan sebagai prototipe dengan data di browser.

Butuh **Node.js 22** atau lebih baru.

1. Salin `.env.example` menjadi `.env`, lalu isi `DB_SERVER`, `DB_NAME=SENJA_DEMO`, `DB_USER`, `DB_PASSWORD`. Password yang mengandung `#` atau spasi harus diapit tanda kutip. File `.env` tidak ikut ke git.
2. Cek koneksi: jalankan `npm run dev`, login sebagai `admin`, buka **Profil**, lalu lihat baris **Server database**. Bisa juga lewat `http://localhost:5173/api/health`.
3. Dokumentasikan struktur database: `npm run db:schema` menulis `docs/database/schema.md`, `schema.json`, dan `objects.sql` (definisi view/procedure/trigger). Isi data tidak disertakan, kecuali contoh nilai kolom kode pendek seperti status/flag (matikan dengan `npm run db:schema -- --no-codes`). Periksa `objects.sql` sebelum di-commit.
4. Produksi: `npm run build` lalu `npm start` (membaca `.env` bila ada).

Struktur baru milik aplikasi web hanya ditambahkan lewat **script migrasi idempoten** di `db/migrations/` (schema `web`, tanpa mengubah tabel lama). Lihat `db/migrations/README.md`.

### Tahap berikutnya

1. Petakan tabel lama (dari `docs/database/schema.md`) ke definisi master/transaksi di `src/lib/erp/defs`.
2. Ganti isi `db.svelte.ts` dengan pemanggilan server (remote functions / `+server.ts`) memakai pool di `src/lib/server/db.ts`.
3. Login memakai tabel user aplikasi lama, sesi cookie httpOnly di `hooks.server.ts`, dan hak akses juga dicek di server.
4. Penomoran dokumen & posting di server dalam transaksi DB, mengikuti pola penomoran aplikasi lama.
5. Perhitungan di `ledger.ts` dipindah ke VIEW / stored procedure.
