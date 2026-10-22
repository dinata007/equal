# Catatan serah terima (untuk sesi Claude berikutnya)

Ringkasan keputusan & status agar pekerjaan bisa dilanjutkan tanpa riwayat percakapan sebelumnya.

## Konteks

- Aplikasi web ini menggantikan **aplikasi desktop PowerBuilder** secara bertahap. Keduanya memakai database SQL Server 2019 yang sama; aplikasi lama **masih dipakai** selama transisi.
- Pengembangan memakai salinan restore bernama **`SENJA_DEMO`**. Struktur database ada di `docs/database/` (dibuat `npm run db:schema`; 222 tabel, multi-brand `brand_id` A/B/C/H, multi-site).
- Logika posting/penomoran aplikasi lama ada di **kode PowerBuilder** (tidak ada trigger; hampir tidak ada stored procedure transaksi). Source PowerBuilder akan ditaruh di `legacy/powerbuilder/` (repo private) — baca sebelum memetakan transaksi.

## Keputusan yang sudah disepakati

- **Tabel lama tidak diubah.** Struktur baru hanya di schema `web`, lewat script migrasi **idempoten** di `db/migrations/` (lihat README di folder itu). Script yang sama nanti dijalankan ke database live.
- **Keamanan login harus yang paling aman.** Tidak memakai `SYS_USER.user_psw` (teks biasa). Akun lama disalin ke `web.users` **tanpa** password; admin membuat password sementara, pengguna wajib menggantinya.
- **Hak akses sama dengan prototipe:** admin = akses penuh; pengguna lain **menu on/off** (menu aktif = semua aksi). Tidak ada rincian per aksi (lihat/tambah/ubah/hapus/cetak).
- **Brand** diatur per pengguna (ada yang boleh beberapa brand) → `web.user_scopes` scope `brand`, nilai `*` = semua.
- **Urutan pengerjaan:** login & hak akses → per modul: **master dulu, lalu transaksi, terakhir laporan**.
- Angka di dashboard tanpa "Rp" (format ringkas `short()`).
- Alur kerja git: kerjakan di branch, buat PR per bagian; pemilik repo yang merge.

## Status Fase 1 — login & hak akses (di branch ini, belum di-PR)

Sudah dibuat:
- `db/migrations/001_web-auth.sql` (web.users, sessions, user_menus, user_scopes, audit_log) & `002_salin-user-lama.sql`.
- `npm run db:migrate` (runner, aman diulang) & `npm run db:admin` (buat/pulihkan admin interaktif).
- Server: `src/lib/server/auth/` (scrypt N=2^17, sesi cookie httpOnly berisi token acak — DB hanya menyimpan hash SHA-256, idle 12 jam / maks 7 hari, kunci 15 menit setelah 5× salah, batas percobaan per IP, audit log), `src/hooks.server.ts` (wajib login untuk `/api`, cek Origin, header keamanan), endpoint `/api/auth/*` & `/api/users*`.
- Klien: `auth.svelte.ts` membaca sesi dari `src/routes/+layout.server.ts`; halaman login, `/ganti-password`, menu Pengguna & Hak Akses lewat API (menu on/off, brand, toko default dari `M_TOKO`, password sementara tampil sekali).

Sudah diuji (SQL Server 2019 sementara dengan tabel tiruan): `npm run check` bersih; migrasi dijalankan 2× tanpa duplikasi; `db:admin` menolak password lemah & membuat admin; `/api/health` OK; `/api/users` tanpa login → 401.

**Belum diuji (lakukan di lokal dengan `SENJA_DEMO`):**
1. `npm run db:migrate` → `npm run db:admin` → `npm run dev`, login admin.
2. Salah password 5× → akun terkunci 15 menit; pesan tidak membocorkan username.
3. Pengguna & Hak Akses: atur menu + brand akun hasil salinan `SYS_USER`, **Buat password sementara**.
4. Login sebagai akun itu → wajib ke `/ganti-password`; sebelum ganti, `/api/*` lain → 403; setelah ganti → hanya menu yang diaktifkan tampil; buka `/pengaturan/pengguna` → akses ditolak; `GET /api/users` → 403.
5. Nonaktifkan akun saat masih login di perangkat lain → sesi langsung tidak berlaku.
6. `npm run build` lalu smoke test semua halaman.

## Langkah berikutnya

1. Selesaikan uji Fase 1 di atas, lalu buat PR.
2. Fase 2 — **master** dari database (produk/model/warna/size, brand, toko, supplier, customer, COA, kas/bank, ekspedisi, pegawai) menggantikan data contoh `seed.ts` / `db.svelte.ts`, dengan filter brand sesuai `web.user_scopes`.
3. Fase 3 — transaksi (setelah membaca source PowerBuilder untuk penomoran & jurnal). Pola nomor bukti per `tipe_trans` ada di `docs/database/schema.md` (bagian "Pola nomor … per jenis").
4. Fase 4 — laporan (VIEW / stored procedure). Rumus stok lama: saldo awal bulanan `S_AWAL_GUDANG`/`S_AWAL_TOKO` + mutasi bulan berjalan (lihat `sp_Dashboard_Stok` di `docs/database/objects.sql`).

Catatan teknis: SvelteKit 3 — variabel env dideklarasikan di `src/env.ts` dan dibaca dari `$app/env/private`; tipe hook dari `@sveltejs/kit/hooks`. `mssql` 12 butuh Node.js ≥ 22. Password `.env` yang mengandung `#` harus diapit tanda kutip.
