# Catatan serah terima (untuk sesi Claude berikutnya)

Ringkasan keputusan & status agar pekerjaan bisa dilanjutkan tanpa riwayat percakapan sebelumnya.

## Konteks

- Aplikasi web ini menggantikan **aplikasi desktop PowerBuilder** secara bertahap. Keduanya memakai database SQL Server 2019 yang sama; aplikasi lama **masih dipakai** selama transisi.
- Pengembangan memakai salinan restore bernama **`SENJA_DEMO`**. Struktur database ada di `docs/database/` (dibuat `npm run db:schema`; 222 tabel, multi-brand `brand_id` A/B/C/H, multi-site).
- Logika posting/penomoran aplikasi lama ada di **kode PowerBuilder** (tidak ada trigger; hampir tidak ada stored procedure transaksi). Source PowerBuilder akan ditaruh di `legacy/powerbuilder/` (repo private) — baca sebelum memetakan transaksi.

## Keputusan yang sudah disepakati

- **Tabel lama tidak diubah.** Struktur baru hanya berupa tabel `dbo` berawalan `App` (mis. `dbo.AppUser`), lewat script migrasi **idempoten** di `db/migrations/` (lihat README di folder itu). Script yang sama nanti dijalankan ke database live.
- **Keamanan login harus yang paling aman.** Tidak memakai `SYS_USER.user_psw` (teks biasa). Akun lama disalin ke `dbo.AppUser` **tanpa** password; admin membuat password sementara, pengguna wajib menggantinya.
- **Hak akses sama dengan prototipe:** admin = akses penuh; pengguna lain **menu on/off** (menu aktif = semua aksi). Tidak ada rincian per aksi (lihat/tambah/ubah/hapus/cetak).
- **Brand** diatur per pengguna (ada yang boleh beberapa brand) → `dbo.AppUserScope` scope `brand`, nilai `*` = semua.
- **Urutan pengerjaan:** login & hak akses → per modul: **master dulu, lalu transaksi, terakhir laporan**.
- Angka di dashboard tanpa "Rp" (format ringkas `short()`).
- Alur kerja git (sejak 24/10/2026): **git lokal saja**, langsung commit di `main`; tanpa remote GitHub, tanpa branch/PR. Repo lama di github.com/DexyM/Senja hanya arsip (sampai PR #9).

## Status Fase 1 — login & hak akses: **selesai** (lihat PR "Fase 1")

- `db/migrations/001_app-auth.sql` (`AppUser`, `AppSession`, `AppUserMenu`, `AppUserScope`, `AppAuditLog`; versi awal di schema `web` dipindah oleh `000_pindah-dari-schema-web.sql`) & `002_salin-user-lama.sql`; setiap script diawali `SET QUOTED_IDENTIFIER ON` (dibutuhkan index bersyarat; sqlcmd defaultnya OFF).
- `npm run db:migrate` (runner, aman diulang) & `npm run db:admin` (buat/pulihkan admin interaktif).
- Server: `src/lib/server/auth/` — scrypt N=2^17; sesi cookie httpOnly berisi token acak, DB hanya menyimpan hash SHA-256; idle 12 jam / maks 7 hari; kunci 15 menit setelah 5× salah; maks 50 login gagal per IP per 15 menit (login sukses tidak dihitung); audit log. `src/hooks.server.ts` mewajibkan login untuk `/api`, menolak Origin asing, memasang header keamanan; endpoint `/api/auth/*` & `/api/users*` (admin-only dicek di server).
- Klien: `auth.svelte.ts` membaca sesi dari `src/routes/+layout.server.ts`; `auth.can(path)` = admin atau menu aktif. Halaman login, `/ganti-password` (wajib untuk password sementara), menu Pengguna & Hak Akses lewat API.
- Diuji end-to-end (30 skenario) ke SQL Server 2019 sementara: login/salah password, cookie httpOnly, akun salinan SYS_USER, atur menu & brand, password sementara → wajib ganti, pembatasan menu & API non-admin, nonaktifkan akun mencabut sesi di semua perangkat, admin tak bisa mencabut dirinya, logout, kunci akun, batas per IP, Origin asing ditolak; smoke test 56 halaman; build.

Belum: brand di `dbo.AppUserScope` baru disimpan — **diterapkan sebagai filter data mulai Fase 2** (master & transaksi dari database). Bila aplikasi dipasang di balik reverse proxy, set `ADDRESS_HEADER` (lihat README).

## Status Fase 2a — master sederhana dari database: **selesai** (branch `fase-2-master`)

Keputusan pemilik (23/10/2026): web **menulis langsung** ke tabel master lama dengan aturan PowerBuilder; replikasi PowerBuilder ke database ke-2 (`sqlcb`, ServerName2/Database2 di DXI.INI) **tidak dipakai** di produksi → diabaikan.

- 8 master: Supplier `M_SUPPLIER` (W_01_M02), Ekspedisi `M_EKSPEDISI` (W_01_M03), Toko `M_TOKO` (W_02_M01), Customer `M_CUSTOMER` (W_02B_M01), Bank `M_BANK` (W_02B_M02), COA `gl_coa` (W_GL_01), Site `gl_site` (W_GL_01_T_01), Kas Bank `cb_master` (W_CB_01). Field form = kolom yang ada di DataWindow entry PowerBuilder; key field di `domain/defs/masters.ts` = nama kolom.
- Server `src/lib/server/master/`: `registry.ts` (tabel, kunci gabungan, brand, penomoran, cek pemakaian), `lookups.ts` (dropdown, mengikuti `dddw_*`), `service.ts`. Tipe/panjang kolom dibaca dari INFORMATION_SCHEMA. API `/api/master/[resource]` (GET/POST/PUT/PATCH/DELETE, butuh hak menu) & `/api/lookup/[name]` (semua pengguna login; hanya kode+nama).
- Penomoran meniru PB, dalam transaksi dengan `UPDLOCK, HOLDLOCK`: supplier `S`+3 digit, ekspedisi `E`+2, toko `T`+3, bank 3 digit, customer site+YY+3 digit per site. COA/site/kas-bank kodenya diketik pengguna.
- Brand: supplier & kas-bank disaring `brand_id`; toko brand `%`/kosong terlihat semua; **COA tidak disaring saat dibaca** (aplikasi lama menyimpan hampir semua akun di brand A, dipakai bersama), tapi menambah/mengubah COA tetap hanya untuk brand pengguna. Nilai lookup (brand, site, akun, …) divalidasi di server sesuai cakupan.
- Ubah data: browser hanya mengirim isian yang diganti, server hanya meng-UPDATE kolom yang berubah (tidak menimpa perubahan dari aplikasi lama). Kunci (kode, brand, site) tidak bisa diubah. `usrupd/usrtgl` diisi `legacy_user_id` (atau username web).
- Hapus hanya bila belum dipakai (lebih ketat dari PB yang menghapus tanpa cek); selain itu Nonaktifkan. Semua perubahan tercatat di `dbo.AppAuditLog` (`master.create/update/delete`).
- Belum diterapkan: pembatasan **site** per pengguna seperti `gs_usersite` PB (model akses web hanya admin/menu/brand).
- Transisi: halaman **transaksi & report prototipe masih memakai data contoh** (`seed.ts`) untuk supplier/toko/COA/dst. sampai Fase 3.
- Diuji: 79 skenario API ke SENJA_DEMO (hak menu, brand, validasi, penomoran, ganda, kolom tidak tertimpa, cek pemakaian, audit; data uji dihapus lagi) + screenshot semua halaman di 390/768/1280 px. Responsif report diperbaiki (filter periode satu baris, tabel jadi daftar kartu di HP).
- `npm run legacy:extract` mengekstrak source PowerBuilder dari `.pbl` ke `legacy/src/` (gitignored). Nama window per menu ada di `dbo.SYS_PROGRAM`.

## Status Fase 2b — produk: **selesai** (branch `fase-2b-produk`, PR ke main)

- Atribut produk ada di menu **Inventory › Master › Produk** (bertab seperti tombol di window produk PB; tab pertama = model; menu Atribut Produk digabung ke sini, migrasi `005`): Brand `M_PRODUK_BRAND`, Gender, **Department** = master-detail Grup Dept `M_PRODUK_DEPT` → Department `M_PRODUK_DEPT2` seperti w_m_dept (`pages/produk/Department.svelte`: pilih grup, department baru otomatis masuk grup itu), Bahan, Warna, Size, Aplikasi `M_APLIKASI`, Jenis, Tipe.
  Kode: brand/gender/grup dept/warna/size diketik; bahan/aplikasi/jenis/tipe diketik **atau** kosong = nomor berikutnya (di PB diketik, datanya selalu angka berurut); department = huruf grup + 3 digit (setelah 999 → AAA, AAB, … seperti w_m_dept). Brand & tipe disaring cakupan brand.
- Menu **Produk** (`/inventory/master/produk`) = tab pertama, halaman khusus `pages/produk/Produk.svelte`: daftar model per brand + status (seperti window lama; brand B ±7.300 model ≈ 2 detik), sheet bertab **Model · Warna & Size · Artikel**.
  - Kode model (W_01_M01_ENTRY pb_save) = brand + gender + dept (4) + bahan (3) + nomor (3) + YY + huruf bulan (Jan = A); nomor kosong = maks+1 per brand+gender+dept+bahan & tahun-bulan (999 → 001, lompati yang terpakai). Model produk = `brand+YY-grup_dept2-singkatan dept-bahan-jenis-aplikasi` + 4 digit urut; nama & nama pendek kosong = model produk; rasio bawaan pembilang/penyebut dari diskon grup dept; harga barcode = grosir + grosir × pembilang/penyebut; harga mall kosong = harga barcode; `sls_tgl` = periode. Kolom pembentuk kode terkunci setelah simpan (seperti `protect` di DataWindow).
  - Status aktif model ikut ke semua artikelnya (pb_save). Hapus model: hanya bila artikelnya belum dipakai transaksi (16 tabel `produk_id` + T_BELI1/T_PO_PRINT/T_PRO_PLAN1/ob_bahan_kirim_hdr per `model_id`), lalu artikel, MODEL2/3, MODEL_SIZE & MODELX ikut terhapus dalam satu transaksi.
  - Proses artikel (W_01_M01_ENTRY_B, `server/master/artikel.ts`, `/api/artikel/[model]`): warna → `M_PRODUK_MODEL2`, size → `M_PRODUK_MODEL3`, harga per size baru → `M_PRODUK_MODEL_SIZE`, artikel `M_PRODUK` = model + warna + size untuk kombinasi yang belum ada. Seperti PB: artikel & harga size yang sudah tersimpan tidak diubah, melepas warna/size tidak menghapus artikel. Beda dari PB (bug): harga mall size baru diisi dari model, bukan 0.
  - Artikel: ubah nama, nama pendek, nama retail, kode mall, harga barcode & mall (W_01_M01_B); hapus per artikel bila belum dipakai. Daftar artikel wajib per model (233 ribu baris).
  - `M_PRODUK_MODELX` tidak diisi (PB lama mengisinya, tapi data terakhir Okt 2024 → aplikasi produksi tidak memakainya lagi).
- Kerangka master diperluas (`registry.ts`): `filters` (saringan daftar, `required` untuk tabel besar), `slim` (daftar ringkas + `GET ?id=` untuk satu baris lengkap), `noCreate`, `cascade`, `afterUpdate`, `usedIn` berupa fungsi; ubah & hapus kini dalam transaksi; brand baris baru dicek ke cakupan pengguna; tanggal dibaca/ditulis sebagai tanggal lokal. `auto` = kode dibuat server saat tambah; terkunci saat ubah hanya bila `lockOnEdit`.
- Diuji: 65 skenario API produk + 18 regresi master Fase 2a ke SENJA_DEMO (data uji dihapus lagi), alur UI lengkap (tambah model → warna/size → proses artikel → ubah artikel → hapus) dan screenshot 390/1280 px tanpa error konsol; `npm run check` & build bersih.

## Status Fase 2c — raw material: **selesai** (branch `fase-2c-material`, di atas `fase-2b-produk`)

- **Material › Master › Raw Material** = article `m_bahan_art` (W_10_M07), form MasterPage bertajuk seksi. Kode (pb_save) = brand + 3 digit akhir supplier + induk + jenis (2) + tipe + 2 digit tahun + warna (2) + urut (3); urut = maks+1 per 12 karakter awal. Baru: supplier & jenis COA harus milik brand article, `supp_desc` dari nama supplier, `acc_ap_id` = jenis COA (tombol COA PB mengisi keduanya). Harga 1 = per satuan kecil (`sat_id`), harga 2 = per satuan besar (`sat_id2`), `con_sat` = isi; harga saling dihitung saat diketik (itemchanged). Pembentuk kode, dept, isi & harga terkunci setelah simpan (seperti `protect` DW; induk juga dikunci karena bagian kode). Tombol **Salin jadi baru** = mode "C" PB. Hapus hanya bila belum dipakai (PO/terima/roll/kirim/pakai/jual/costing material, saldo awal, opname, aset).
- **Material › Master › Raw Material** (bertab; tab pertama article, lalu atribut — menu Atribut Raw Material digabung ke sini, migrasi `004`): Induk `m_bahan_induk` (brand + 5 akun COA + barang aset; daftar lintas brand, ubah hanya brand sendiri), Dept, Jenis, Tipe, Warna, Jenis COA `m_bahan_acc` (per brand), Satuan. **Warna = `M_PRODUK_WARNA`** (W_10_M04 memang memakai tabel warna produk; `m_bahan_warna` tidak dipakai form PB, tombol hapus PB-nya keliru ke tabel itu). Kode satuan & dept boleh kosong = nomor berikutnya.
- Kerangka: halaman atribut bertab umum `pages/master/Atribut.svelte` (daftar tab: `ATTRIBUTES` di `domain/defs/masters.ts`); MasterPage memuat ulang baris dari database saat dibuka, mendukung `section` (judul kelompok isian), `decimals`, `copyable`, `derive` (isian turunan); `kodeUrut` pindah ke `server/master/codes.ts`.
- Diuji: 45 skenario API raw material + cek ulang produk/master Fase 2a, alur UI (tambah dengan hitung harga, salin jadi baru, hapus) & halaman atribut tanpa error konsol; `npm run check` & build bersih.

## Status Fase 2d — HR: **selesai** (sudah di `main`)

- **HR › Master › Pegawai** (`M_PEGAWAI`, W_MS_08) = MasterPage + tab **Kontrak** (`pages/pegawai/Pegawai.svelte`, `pages/pegawai/KontrakPanel.svelte`). NIK (cb_save) = `SJ` + yyMM tanggal masuk + 2 digit urut per bulan (`gs_sing` PB: site 01/semua = SJ, 11 = GG, lainnya EQ — web tanpa site, semua data SJ); `pt_id` = 1. NIK & tanggal masuk terkunci setelah simpan. Hapus pegawai hanya bila belum dipakai (absensi, izin, cuti, tunjangan, customer pegangan); riwayat kontraknya ikut terhapus.
- **Kontrak** (`M_PEGAWAI_KONTRAK`, W_MS_08_ENTRY2, `server/master/kontrak.ts`, `/api/pegawai/[id]/kontrak`): JOIN / PERPANJANG / ROLLING / RESIGN, isian bawaan dari kontrak terakhir (perpanjang mulai dari akhir kontrak lama). Aturan PB: JOIN ditolak bila masih ada JOIN aktif, tipe lain ditolak bila belum pernah JOIN; PERPANJANG/ROLLING menutup kontrak lama (aktif 0, pegangan 1) & pegawai aktif; RESIGN menutup kontrak lama (aktif 0), kontrak resign pegangan 1, pegawai nonaktif. Tambahan web (PB tidak mengecek karena logika null): tanggal akhir wajib untuk PKWT & harus setelah tanggal awal, akhir perpanjangan harus melewati akhir kontrak lama; JOIN ulang mengaktifkan pegawai lagi. `user_entry` = nama pengguna (seperti `gs_user_name`).
- **UMR** (`M_GAJI_UMR`, W_100_07) & **Tunjangan Pegawai** (`M_PEGAWAI_TUNJANGAN`, W_100_06): rumus editchanged PB lewat `derive` (upah/hari = UMR ÷ hari, upah/jam = upah/hari ÷ jam kerja; gapok/premi = gaji total × persen, per hari ÷ hari kerja, per jam ÷ 8). NIK tunjangan disalin dari pegawai.
- **HR › Master › Atribut Pegawai** (menu baru, bertab): Jabatan, Divisi (kode maks+1), Group Premi, Shift (jam weekday/weekend), Lembur. `w_ms_tipe_peg` (status kontrak) tidak bisa diekstrak (biner) → belum ada.
- Kerangka: kunci IDENTITY (`identity` di registry, INSERT … OUTPUT), kunci angka dari id baris dikonversi ke tipe kolom, kode lookup berkolom angka dibaca sebagai teks, `tabs` di MasterPage (panel data terkait di form ubah), `prefix` id di Field (dua form tampil bersamaan). Perbaikan `DateInput`: tahun yang belum selesai diketik ("202") tidak lagi membuat kalender error.
- Diuji: 46 skenario API HR, alur UI (pegawai baru → kontrak JOIN → hapus, rumus UMR & tunjangan, atribut) di 1280/390 px tanpa error konsol; `npm run check` & build bersih. Data uji dihapus lagi.

## Tabel App* & profil pengguna (24/10/2026)

- Tabel aplikasi web pindah dari schema `web` ke `dbo` berawalan `App` (`AppUser`, `AppSession`, `AppUserMenu`, `AppUserScope`, `AppAuditLog`); migrasi `000` memindahkan data lama. Tabel baru `AppUserProfile` (`003`): foto (biner, maks 512 KB) & preferensi tampilan (JSON).
- Waktu di tabel App* disimpan UTC, sedangkan koneksi `useUTC: false` (demi tabel lama) → baca lewat `utcIso()` di `server/db.ts` (memperbaiki "terakhir login" yang tadinya bergeser 7 jam).
- **Profil** (`routes/(app)/profil`): foto profil dengan crop/zoom/rotate di browser (`AvatarEditor.svelte`, hasil 512 px WebP; bisa zoom out sampai seluruh gambar masuk lingkaran) lewat klik, drag & drop, atau paste; tampil di Topbar, Sidebar, daftar Pengguna (`Avatar.svelte`, `/api/avatar/{id}?v=`). **Tampilan**: Light/Dark/System (animasi lingkaran View Transitions) & 4 ukuran teks (pilihan warna aksen, font & kurangi animasi sempat dibuat lalu dihapus atas permintaan pemilik — font tetap Source Sans 3 + Alegreya Sans); disimpan ke akun (`appearance.svelte.ts`, `prefs.ts`) & disalin ke localStorage untuk skrip anti-kedip di `app.html`. **Keamanan**: perangkat aktif + logout per perangkat / semua lainnya, riwayat aktivitas dari audit log.
- **Install App** (`pwa.svelte.ts`, `InstallAppButton.svelte`): event install ditangkap sejak halaman pertama; tombol di Topbar & Login, kartu Aplikasi di profil. iPhone/iPad & Safari Mac → panduan langkah; tersembunyi bila sudah ter-install / Firefox desktop / bukan HTTPS (install PWA wajib HTTPS di server live).
- Istilah umum aplikasi tidak diterjemahkan (Login/Logout, Install App, Upload, Light/Dark, Zoom, Crop…).
- **Export** (`util/export.ts`, `components/data/ExportMenu.svelte`): menu Excel / CSV / PDF di semua laporan (`ReportShell` prop `exportTable`), MasterPage, daftar transaksi, dan bar baris terpilih DataTable (ikut baris total bila kolom ber-`sum`). Excel = .xlsx asli buatan sendiri + `fflate` (angka & tanggal tetap bernilai, header freeze + AutoFilter, lebar kolom otomatis, judul/periode/pengekspor); PDF = `jspdf` + `jspdf-autotable` (landscape bila > 6 kolom, header berulang, nomor halaman, font standar → karakter non-Latin-1 diganti). Library dimuat saat dipakai. Tipe kolom ditebak dari isi bila tidak disebut (`tableOf(nama, header, baris)`).

## Dashboard (beranda) — data langsung dari database (29/10/2026)

- **Dashboard 2 (pengganti Stimulsoft) dihapus** atas keputusan bisnis; beranda (dulu "Dashboard 1") kini bernama **Dashboard** dan memakai data asli SQL Server, bukan mock. Hanya baca; transaksi masih di aplikasi lama.
- Endpoint (hak menu & cakupan brand dicek di server, cache 5 menit, tombol Refresh paling cepat tiap 15 detik): `/api/penjualan` (`server/penjualan.ts`), `/api/stok` (`server/stok.ts`), `/api/pembelian` (`server/pembelian.ts`). Semua penjumlahan & filter di browser (`pages/beranda/`).
- **Penjualan kotor** = transaksi toko dari `T_TOKO1/2`: `JUAL`, `JUAL OL`, dan marketplace `KIRIM MP`; transaksi retur tidak mengurangi angka jual. Nama pelanggan diambil dari `M_CUSTOMER` dengan kunci `site_id` + `cust_id`; grosir (`grosir=1`) tampil sebagai "Grosir / Corporate". Tidak memakai `T_GUDANG1` untuk angka penjualan. Dokumen dengan total 0 dikeluarkan kecuali BOOKING (NULL/BOOKING), yang nilainya dihitung dari detail `T_TOKO2`. Di UI istilahnya **Toko**, bukan "channel".
- Filter **Jenis bayar** memakai `T_TOKO1.tipe_bayar`; nilai NULL atau yang jika di-uppercase sama dengan `BOOKING` dikelompokkan sebagai `BOOKING`, nilai lain ditampilkan sesuai nilai aslinya.
- **Stok Toko & Nilai Persediaan** = saldo awal (`S_AWAL_TOKO`) + mutasi `TERIMA` (+), `RETUR` (-), `JUAL` (- bila bukan BATAL), dan `RETUR JUAL` (+ bila bukan BATAL), mengikuti laporan PowerBuilder `w_02b_r01_acc` / `d_02b_r01_acc`. Nilai akhir = qty × `M_PRODUK.hjual` (DataWindow menamai kolom ini `hbeli`). Menggunakan toko-toko yang tersedia pada saldo awal periode, serta dibatasi cakupan brand pengguna. Tampil bila pengguna punya menu Inventory dan saldo awal periode tersedia. Detail per kategori menggunakan `M_PRODUK_DEPT`.
- **Report Toko → Mutasi Stok & Kartu Stok** membaca langsung `S_AWAL_TOKO` dan `T_TOKO1/2` dengan rumus mutasi yang sama seperti dashboard/PowerBuilder. Nilai persediaan memakai `M_PRODUK.hjual`; filter toko, tanggal, cakupan brand, dan pengecualian transaksi `BATAL` diterapkan di server. Kartu Stok menampilkan saldo awal pada awal rentang, mutasi dokumen, saldo berjalan, dan nilai saldo akhir.
- **Pembelian** (pembanding Tren Penjualan, tombol "vs Pembelian") = penerimaan barang gudang (`T_GUDANG` TERIMA, status IN) pada tanggal terima, bukan tanggal PO (`T_BELI1`); retur ke supplier tidak dikurangkan. Alternatif bila bisnis menganggap pembelian = PO: ganti sumber di `server/pembelian.ts`.
- Periode dipilih lewat pemilih rentang tanggal (`components/ui/DateRangePicker.svelte`, maks. 190 hari, data sejak 1 Juli 2020); pembanding = rentang sepanjang itu tepat sebelumnya ("Bulan ini" dibanding bulan lalu s.d. tanggal sama). Kartu Total Penjualan bisa diklik → rincian per kategori (`KategoriSheet.svelte`).
- Belum dari database (sengaja disembunyikan sampai laporan/transaksi dikerjakan): segmentasi pelanggan, kas/piutang/utang, stok menipis, tugas & notifikasi, laba kotor. Laporan Material/Inventory dan Analisa Penjualan masih data mock.

## Identitas Senja (29/10/2026)

- Nama aplikasi **Senja** (bukan "ruangSenja"). Logo tulisan dari `SENJA_2.bmp`, ikon dari `i_exe.ico`; sumber di `brand/`, dibuat ulang dengan `node scripts/gen-icons.mjs`. Aksen UI jingga-koral (`--color-brand-*` di `src/app.css`); pratinjau opsi warna: `brand/pratinjau-warna.html`.

## Langkah berikutnya

1. Di lokal: `npm run db:migrate` → `npm run db:admin` → atur pengguna (sekali saja per database); beri akses menu **Produk**, **Raw Material** & **Atribut Pegawai** ke pengguna yang mengelolanya.
2. Fase 2 master selesai → Fase 3 transaksi.
3. Fase 3 — transaksi (setelah membaca source PowerBuilder untuk penomoran & jurnal). Pola nomor bukti per `tipe_trans` ada di `docs/database/schema.md` (bagian "Pola nomor … per jenis").
4. Fase 4 — laporan (VIEW / stored procedure). Report Mutasi/Kartu Stok Toko sudah tersambung ke DB; laporan lain menyusul. Rumus stok lama: saldo awal bulanan `S_AWAL_GUDANG`/`S_AWAL_TOKO` + mutasi bulan berjalan (lihat `sp_Dashboard_Stok` di `docs/database/objects.sql`).
5. Sebelum deploy ke live: jalankan `npm audit`. Per 24/10/2026 ada 2 temuan high di `@azure/msal-node` < 7.1.0 (GHSA-xcx6-jx8p-x3h5, alur authorization code / `acquireTokenByCode`). Paket ini ikut terpasang lewat `mssql` → `tedious` → `@azure/identity`, tapi tidak terjangkau karena koneksi memakai login SQL/NTLM, bukan Azure AD. Belum bisa diperbaiki: semua versi `@azure/identity` (terakhir 4.14.0) masih meminta `msal-node ^6`, dan `npm audit fix` tidak mengubah apa pun. Begitu ada `@azure/identity` yang memakai `msal-node` ≥ 7.1, cukup `npm update` lalu tes koneksi database & login. Jangan dipaksa lewat `overrides` (kombinasi versi belum dirilis Microsoft).

Catatan teknis: SvelteKit 3 — variabel env dideklarasikan di `src/env.ts` dan dibaca dari `$app/env/private`; tipe hook dari `@sveltejs/kit/hooks`. `mssql` 12 butuh Node.js ≥ 22. Password `.env` yang mengandung `#` harus diapit tanda kutip.
