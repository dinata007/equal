# Struktur folder

Peta folder aplikasi ruangSenja, isi setiap folder, dan aturan meletakkan kode baru.
Import dari `src/lib` memakai alias `#lib/…`, misalnya `import { auth } from '#lib/state/auth.svelte.ts'`.

## Akar repo

```
db/migrations/     script SQL tabel aplikasi web (dbo.App*), dijalankan `npm run db:migrate`
docs/              dokumen: serah terima, skema database, struktur folder (file ini)
scripts/           script Node: db:migrate, db:admin, db:schema, ikon PWA, ekstrak PBL
legacy/            sumber aplikasi PowerBuilder (rujukan saja, tidak masuk git)
static/            file publik: ikon, logo, manifest PWA, robots.txt
src/               kode aplikasi (lihat di bawah)
build/             hasil `npm run build` (tidak masuk git)
```

## src/routes — alamat URL

```
routes/
  +layout.svelte        akar: CSS, toast, dialog konfirmasi, tombol back (installBackClose)
  +layout.server.ts     data sesi pengguna & status database untuk setiap halaman
  login/, ganti-password/
  (app)/                semua halaman setelah login (sidebar, topbar, tab halaman)
    +page.svelte        Dashboard
    profil/             Profil & pengaturan akun
    [...path]/          SEMUA halaman menu — isinya ditentukan domain/menu.ts
  api/                  endpoint server (wajib login; dicek di hooks.server.ts)
    auth/  master/[resource]  lookup/[name]  users/  pegawai/  artikel/  profil/  avatar/  health/
```

Halaman menu tidak punya folder sendiri di `routes/`. Path menu (mis. `/material/master/raw-material`)
sekaligus menjadi kunci hak akses, dan halamannya dipilih dari definisi menu, jadi kodenya ada di `src/lib/pages/`.

## src/lib — kode bersama

```
lib/
  components/          komponen tampilan yang dipakai di banyak halaman
    ui/                komponen dasar: Select, DateInput, NumberInput, Field, Lookup, Switch,
                       Sheet, Popover, Menu, ConfirmDialog, Toaster, Avatar, Logo, StatusBadge, PeriodPresets
    data/              DataTable (+ grid/: filter & kolom), ExportMenu, PageHeader, types.ts (tipe kolom tabel)
    chart/             grafik: BarChart, BarList, TrendChart, Donut, Heatmap, Sparkline, StackBar, Delta
    shell/             kerangka aplikasi: Sidebar, MenuTree, Topbar, PageTabs, BottomNav, CommandPalette, InstallAppButton

  pages/               halaman, dikelompokkan seperti menu
    ModuleOverview     ringkasan modul (mis. /material)
    master/            MasterPage (halaman master generik), Atribut (menu bertab: Produk, Raw Material, atribut pegawai)
    transaksi/         TransactionPage (daftar), TxForm (form dokumen), LinesEditor (baris detail)
    laporan/           ReportShell + PeriodFilter (kerangka), MutasiStok, KartuStok, AnalisaPenjualan,
                       MutasiHutangPiutang, KartuHutangPiutang, BukuKasBank, Jurnal, Absensi
    produk/            Produk + ArtikelPanel, SkuPanel, Department (master-detail grup → dept)
    pegawai/           Pegawai + KontrakPanel
    pengguna/          Pengguna & Hak Akses + AccessMatrix, CopyAccessSheet
    profil/            AvatarEditor (dipakai routes/(app)/profil)
    utilitas/          ClosingStok

  state/               state aplikasi di browser (*.svelte.ts, memakai rune)
    auth               sesi & can(path)        appearance   mode gelap & ukuran teks
    lookups            pilihan dropdown dari server   tabs   tab halaman (desktop)
    pwa                pasang aplikasi         ui           toast, dialog konfirmasi, drawer/palette

  dom/                 helper DOM & attachment Svelte ({@attach …})
    tooltip, backClose (tombol back menutup lapisan), scrollTabs (deret tab geser),
    formNav (Enter pindah isian), floating (posisi popover), clipboard (salin), negative (angka minus merah)

  domain/              aturan & definisi aplikasi (dipakai browser dan server)
    menu.ts            SUMBER TUNGGAL menu → halaman, breadcrumb/tab, kunci hak akses
    defs/              definisi master (masters.ts) & transaksi (transactions.ts)
    types.ts           tipe bersama (MasterDef, TxDef, MenuNode, SessionUser, …)
    prefs.ts           preferensi tampilan yang boleh disimpan
    produk.ts          rumus produk (meniru PowerBuilder)
    ledger.ts          perhitungan stok, hutang/piutang, kas, jurnal, closing
    analytics.ts       angka dashboard

  util/                utilitas umum tanpa state
    api.ts             pemanggil /api (error → ApiError)
    format.ts          format angka, rupiah, tanggal
    export.ts          export Excel / CSV / PDF
    device.ts          nama perangkat dari user-agent (daftar sesi)

  dev-data/            data CONTOH di browser untuk modul yang belum memakai database
    db.svelte.ts, seed.ts   → dihapus setelah semua modul pindah ke database

  server/              kode yang hanya jalan di server (tidak boleh diimpor halaman)
    db.ts, db-config.js, http.ts
    auth/              login, sesi, password, pengguna, audit, profil
    master/            resource tabel lama: registry, service, lookups, material, produk, artikel, hr, kontrak, codes

  stubs/empty.js       modul kosong pengganti fitur jsPDF yang tidak dipakai (lihat vite.config.ts)
```

## Mau menambah kode, taruh di mana?

| Yang dibuat | Tempat |
|---|---|
| Menu baru berbasis tabel (master) | node di `domain/menu.ts` + definisi di `domain/defs/masters.ts` (+ resource di `server/master/`). Tanpa file halaman baru. |
| Transaksi baru | node di `domain/menu.ts` + definisi di `domain/defs/transactions.ts` |
| Laporan / halaman khusus baru | file di `pages/<kelompok>/NamaHalaman.svelte`, tambahkan kuncinya ke `ReportPage`/`CustomPage` di `domain/types.ts`, daftarkan di `routes/(app)/[...path]/+page.svelte`, lalu pakai `R('kunci')` / `C('kunci')` di menu |
| Komponen yang hanya dipakai satu halaman | di folder halaman itu (mis. `pages/pegawai/KontrakPanel.svelte`) |
| Komponen yang dipakai banyak halaman | `components/ui/` (dasar), `components/data/` (tabel), `components/chart/` (grafik) |
| State yang dibagi antar halaman | `state/nama.svelte.ts` |
| Attachment / helper yang menyentuh DOM | `dom/` |
| Fungsi murni (format, hitung) | `util/` (umum) atau `domain/` (aturan bisnis) |
| Kode database / rahasia | `server/` saja |

## Aturan penamaan

- **Hal bisnis memakai bahasa Indonesia**, sama dengan label menu dan tabel lama: folder halaman (`laporan/`, `pegawai/`) dan halaman (`MutasiStok.svelte`, `Pegawai.svelte`).
- **Kerangka teknis memakai bahasa Inggris**, istilah umum Svelte: `components/`, `state/`, `util/`, komponen dasar (`Select`, `DataTable`), dan kerangka halaman (`MasterPage`, `ReportShell`).
- Komponen Svelte memakai PascalCase (`KartuStok.svelte`). File TypeScript memakai camelCase (`scrollTabs.ts`). File berisi rune memakai akhiran `.svelte.ts`.
- Kunci halaman di menu memakai kebab-case sesuai nama filenya (`'kartu-stok'` → `KartuStok.svelte`). Kuncinya bertipe, jadi salah ketik tertangkap oleh `npm run check`.

## Catatan

- `server/db-config.js` dan `server/auth/password.js` sengaja `.js`, karena juga dipakai `scripts/*.mjs` yang jalan dengan Node biasa.
- `dev-data/` hanya untuk modul yang masih memakai data contoh (lihat README). Jangan menambah fitur baru di atasnya.
