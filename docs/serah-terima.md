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

## Status Fase 1 — login & hak akses: **selesai** (lihat PR "Fase 1")

- `db/migrations/001_web-auth.sql` (web.users, sessions, user_menus, user_scopes, audit_log) & `002_salin-user-lama.sql`; setiap script diawali `SET QUOTED_IDENTIFIER ON` (dibutuhkan index bersyarat; sqlcmd defaultnya OFF).
- `npm run db:migrate` (runner, aman diulang) & `npm run db:admin` (buat/pulihkan admin interaktif).
- Server: `src/lib/server/auth/` — scrypt N=2^17; sesi cookie httpOnly berisi token acak, DB hanya menyimpan hash SHA-256; idle 12 jam / maks 7 hari; kunci 15 menit setelah 5× salah; maks 50 login gagal per IP per 15 menit (login sukses tidak dihitung); audit log. `src/hooks.server.ts` mewajibkan login untuk `/api`, menolak Origin asing, memasang header keamanan; endpoint `/api/auth/*` & `/api/users*` (admin-only dicek di server).
- Klien: `auth.svelte.ts` membaca sesi dari `src/routes/+layout.server.ts`; `auth.can(path)` = admin atau menu aktif. Halaman login, `/ganti-password` (wajib untuk password sementara), menu Pengguna & Hak Akses lewat API.
- Diuji end-to-end (30 skenario) ke SQL Server 2019 sementara: login/salah password, cookie httpOnly, akun salinan SYS_USER, atur menu & brand, password sementara → wajib ganti, pembatasan menu & API non-admin, nonaktifkan akun mencabut sesi di semua perangkat, admin tak bisa mencabut dirinya, logout, kunci akun, batas per IP, Origin asing ditolak; smoke test 56 halaman; build.

Belum: brand di `web.user_scopes` baru disimpan — **diterapkan sebagai filter data mulai Fase 2** (master & transaksi dari database). Bila aplikasi dipasang di balik reverse proxy, set `ADDRESS_HEADER` (lihat README).

## Status Fase 2a — master sederhana dari database: **selesai** (branch `fase-2-master`)

Keputusan pemilik (23/10/2026): web **menulis langsung** ke tabel master lama dengan aturan PowerBuilder; replikasi PowerBuilder ke database ke-2 (`sqlcb`, ServerName2/Database2 di DXI.INI) **tidak dipakai** di produksi → diabaikan.

- 8 master: Supplier `M_SUPPLIER` (W_01_M02), Ekspedisi `M_EKSPEDISI` (W_01_M03), Toko `M_TOKO` (W_02_M01), Customer `M_CUSTOMER` (W_02B_M01), Bank `M_BANK` (W_02B_M02), COA `gl_coa` (W_GL_01), Site `gl_site` (W_GL_01_T_01), Kas Bank `cb_master` (W_CB_01). Field form = kolom yang ada di DataWindow entry PowerBuilder; key field di `defs/masters.ts` = nama kolom.
- Server `src/lib/server/master/`: `registry.ts` (tabel, kunci gabungan, brand, penomoran, cek pemakaian), `lookups.ts` (dropdown, mengikuti `dddw_*`), `service.ts`. Tipe/panjang kolom dibaca dari INFORMATION_SCHEMA. API `/api/master/[resource]` (GET/POST/PUT/PATCH/DELETE, butuh hak menu) & `/api/lookup/[name]` (semua pengguna login; hanya kode+nama).
- Penomoran meniru PB, dalam transaksi dengan `UPDLOCK, HOLDLOCK`: supplier `S`+3 digit, ekspedisi `E`+2, toko `T`+3, bank 3 digit, customer site+YY+3 digit per site. COA/site/kas-bank kodenya diketik pengguna.
- Brand: supplier & kas-bank disaring `brand_id`; toko brand `%`/kosong terlihat semua; **COA tidak disaring saat dibaca** (aplikasi lama menyimpan hampir semua akun di brand A, dipakai bersama), tapi menambah/mengubah COA tetap hanya untuk brand pengguna. Nilai lookup (brand, site, akun, …) divalidasi di server sesuai cakupan.
- Ubah data: browser hanya mengirim isian yang diganti, server hanya meng-UPDATE kolom yang berubah (tidak menimpa perubahan dari aplikasi lama). Kunci (kode, brand, site) tidak bisa diubah. `usrupd/usrtgl` diisi `legacy_user_id` (atau username web).
- Hapus hanya bila belum dipakai (lebih ketat dari PB yang menghapus tanpa cek); selain itu Nonaktifkan. Semua perubahan tercatat di `web.audit_log` (`master.create/update/delete`).
- Belum diterapkan: pembatasan **site** per pengguna seperti `gs_usersite` PB (model akses web hanya admin/menu/brand).
- Transisi: halaman **transaksi & report prototipe masih memakai data contoh** (`seed.ts`) untuk supplier/toko/COA/dst. sampai Fase 3.
- Diuji: 79 skenario API ke SENJA_DEMO (hak menu, brand, validasi, penomoran, ganda, kolom tidak tertimpa, cek pemakaian, audit; data uji dihapus lagi) + screenshot semua halaman di 390/768/1280 px. Responsif report diperbaiki (filter periode satu baris, tabel jadi daftar kartu di HP).
- `npm run legacy:extract` mengekstrak source PowerBuilder dari `.pbl` ke `legacy/src/` (gitignored). Nama window per menu ada di `dbo.SYS_PROGRAM`.

## Status Fase 2b — produk: **selesai** (branch `fase-2b-produk`, PR ke main)

- Menu baru **Inventory › Master › Atribut Produk** (`/inventory/master/atribut-produk`, satu menu bertab seperti tombol di window produk PB): Brand `M_PRODUK_BRAND`, Gender, Grup Dept `M_PRODUK_DEPT`, Department `M_PRODUK_DEPT2`, Bahan, Warna, Size, Aplikasi `M_APLIKASI`, Jenis, Tipe. Pengguna lama perlu diberi akses menu ini.
  Kode: brand/gender/grup dept/warna/size diketik; bahan/aplikasi/jenis/tipe diketik **atau** kosong = nomor berikutnya (di PB diketik, datanya selalu angka berurut); department = huruf grup + 3 digit (setelah 999 → AAA, AAB, … seperti w_m_dept). Brand & tipe disaring cakupan brand.
- Menu **Produk** (`/inventory/master/produk`) = halaman khusus `pages/custom/Products.svelte`: daftar model per brand + status (seperti window lama; brand B ±7.300 model ≈ 2 detik), sheet bertab **Model · Warna & Size · Artikel**.
  - Kode model (W_01_M01_ENTRY pb_save) = brand + gender + dept (4) + bahan (3) + nomor (3) + YY + huruf bulan (Jan = A); nomor kosong = maks+1 per brand+gender+dept+bahan & tahun-bulan (999 → 001, lompati yang terpakai). Model produk = `brand+YY-grup_dept2-singkatan dept-bahan-jenis-aplikasi` + 4 digit urut; nama & nama pendek kosong = model produk; rasio bawaan pembilang/penyebut dari diskon grup dept; harga barcode = grosir + grosir × pembilang/penyebut; harga mall kosong = harga barcode; `sls_tgl` = periode. Kolom pembentuk kode terkunci setelah simpan (seperti `protect` di DataWindow).
  - Status aktif model ikut ke semua artikelnya (pb_save). Hapus model: hanya bila artikelnya belum dipakai transaksi (16 tabel `produk_id` + T_BELI1/T_PO_PRINT/T_PRO_PLAN1/ob_bahan_kirim_hdr per `model_id`), lalu artikel, MODEL2/3, MODEL_SIZE & MODELX ikut terhapus dalam satu transaksi.
  - Proses artikel (W_01_M01_ENTRY_B, `server/master/artikel.ts`, `/api/artikel/[model]`): warna → `M_PRODUK_MODEL2`, size → `M_PRODUK_MODEL3`, harga per size baru → `M_PRODUK_MODEL_SIZE`, artikel `M_PRODUK` = model + warna + size untuk kombinasi yang belum ada. Seperti PB: artikel & harga size yang sudah tersimpan tidak diubah, melepas warna/size tidak menghapus artikel. Beda dari PB (bug): harga mall size baru diisi dari model, bukan 0.
  - Artikel: ubah nama, nama pendek, nama retail, kode mall, harga barcode & mall (W_01_M01_B); hapus per artikel bila belum dipakai. Daftar artikel wajib per model (233 ribu baris).
  - `M_PRODUK_MODELX` tidak diisi (PB lama mengisinya, tapi data terakhir Okt 2024 → aplikasi produksi tidak memakainya lagi).
- Kerangka master diperluas (`registry.ts`): `filters` (saringan daftar, `required` untuk tabel besar), `slim` (daftar ringkas + `GET ?id=` untuk satu baris lengkap), `noCreate`, `cascade`, `afterUpdate`, `usedIn` berupa fungsi; ubah & hapus kini dalam transaksi; brand baris baru dicek ke cakupan pengguna; tanggal dibaca/ditulis sebagai tanggal lokal. `auto` = kode dibuat server saat tambah; terkunci saat ubah hanya bila `lockOnEdit`.
- Diuji: 65 skenario API produk + 18 regresi master Fase 2a ke SENJA_DEMO (data uji dihapus lagi), alur UI lengkap (tambah model → warna/size → proses artikel → ubah artikel → hapus) dan screenshot 390/1280 px tanpa error konsol; `npm run check` & build bersih.

## Langkah berikutnya

1. Di lokal: `npm run db:migrate` → `npm run db:admin` → atur pengguna (sekali saja per database); beri akses menu **Atribut Produk** ke pengguna yang mengelola produk.
2. Fase 2b lanjutan — **Raw Material** (W_10_M01–M08, `m_bahan_*`). Fase 2c — HR (Pegawai W_MS_08, UMR W_100_07, Tunjangan W_100_06).
3. Fase 3 — transaksi (setelah membaca source PowerBuilder untuk penomoran & jurnal). Pola nomor bukti per `tipe_trans` ada di `docs/database/schema.md` (bagian "Pola nomor … per jenis").
4. Fase 4 — laporan (VIEW / stored procedure). Rumus stok lama: saldo awal bulanan `S_AWAL_GUDANG`/`S_AWAL_TOKO` + mutasi bulan berjalan (lihat `sp_Dashboard_Stok` di `docs/database/objects.sql`).

Catatan teknis: SvelteKit 3 — variabel env dideklarasikan di `src/env.ts` dan dibaca dari `$app/env/private`; tipe hook dari `@sveltejs/kit/hooks`. `mssql` 12 butuh Node.js ≥ 22. Password `.env` yang mengandung `#` harus diapit tanda kutip.
