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

## Rencana tahap koneksi MSSQL

1. Skema tabel MSSQL mengikuti nama tabel di `seed.ts` (header + detail `_lines`), plus tabel `closings`, `roles`, `users`.
2. Ganti isi `db.svelte.ts` dengan pemanggilan server (remote functions / `+server.ts`) memakai paket `mssql` (pool koneksi di `src/lib/server/db.ts`).
3. Perhitungan di `ledger.ts` → VIEW / stored procedure (kartu stok, mutasi, saldo AR/AP).
4. Auth: password di-hash, sesi cookie httpOnly di `hooks.server.ts`, cek izin juga di server.
5. Penomoran dokumen via sequence/transaksi DB agar aman konkuren.
