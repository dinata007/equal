# Migrasi database

Aplikasi PowerBuilder lama masih memakai database yang sama, jadi aturannya:

1. **Tabel lama tidak diubah.** Tidak ada `ALTER`/`DROP`/rename pada tabel, kolom, trigger, atau procedure milik aplikasi lama.
2. **Struktur baru milik aplikasi web ada di `dbo` dengan awalan `App`** (PascalCase tunggal, mis. `dbo.AppUser`, `dbo.AppUserMenu`; view/procedure juga `App…`), sehingga mudah dibedakan dari objek lama. Cek dulu di `docs/database/schema.md` bahwa namanya belum dipakai.
3. **Setiap script idempoten**: aman dijalankan berulang kali di database mana pun (`SENJA_DEMO` maupun live). Script yang sudah pernah jalan tidak mengubah apa-apa.

Nama constraint & index: `pk_<Tabel>`, `fk_<Tabel>_<kolom>`, `df_<Tabel>_<kolom>`, `ux_`/`ix_<Tabel>_<kolom>`.

## Penamaan

`NNN_deskripsi-singkat.sql`, nomor urut tiga digit, dijalankan berurutan: `001_app-auth.sql`, `002_salin-user-lama.sql`, … (`000_pindah-dari-schema-web.sql` memindahkan tabel versi awal dari schema `web` lama; di database baru tidak melakukan apa-apa.)

## Pola idempoten

```sql
-- tabel
IF OBJECT_ID('dbo.AppSession', 'U') IS NULL
CREATE TABLE dbo.AppSession (
  id        char(64)     NOT NULL CONSTRAINT pk_AppSession PRIMARY KEY,
  user_id   varchar(20)  NOT NULL,
  expires   datetime2(0) NOT NULL
);
GO

-- kolom baru (hanya di tabel App*)
IF COL_LENGTH('dbo.AppSession', 'ip') IS NULL
ALTER TABLE dbo.AppSession ADD ip varchar(45) NULL;
GO

-- index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_AppSession_user' AND object_id = OBJECT_ID('dbo.AppSession'))
CREATE INDEX ix_AppSession_user ON dbo.AppSession (user_id);
GO

-- view / procedure / function: CREATE OR ALTER (SQL Server 2016 SP1+)
CREATE OR ALTER VIEW dbo.AppContoh AS SELECT 1 AS x;
GO
```

## Menjalankan

Paling mudah: `npm run db:migrate` (menjalankan semua script berurutan ke database di `.env`). Di SSMS: buka script lalu Execute (F5), berurutan sesuai nomor. Di command line:

```bash
sqlcmd -S SERVER -d SENJA_DEMO -U user -P "password" -b -i db/migrations/001_app-auth.sql
```

Setiap script diawali `SET QUOTED_IDENTIFIER ON` (dibutuhkan index bersyarat). Script baru juga harus begitu.

Jalankan dulu di `SENJA_DEMO`, uji aplikasinya, baru jalankan script yang sama di database live.
