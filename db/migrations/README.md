# Migrasi database

Aplikasi PowerBuilder lama masih memakai database yang sama, jadi aturannya:

1. **Tabel lama tidak diubah.** Tidak ada `ALTER`/`DROP`/rename pada tabel, kolom, trigger, atau procedure milik aplikasi lama.
2. **Struktur baru milik aplikasi web masuk ke schema `web`** (mis. `web.sessions`), sehingga mudah dibedakan dan tidak bentrok dengan objek lama.
3. **Setiap script idempoten**: aman dijalankan berulang kali di database mana pun (`SENJA_DEMO` maupun live). Script yang sudah pernah jalan tidak mengubah apa-apa.

## Penamaan

`NNN_deskripsi-singkat.sql`, nomor urut tiga digit, dijalankan berurutan: `001_schema-web.sql`, `002_sesi-login.sql`, …

## Pola idempoten

```sql
-- schema
IF SCHEMA_ID('web') IS NULL EXEC('CREATE SCHEMA web');
GO

-- tabel
IF OBJECT_ID('web.sessions', 'U') IS NULL
CREATE TABLE web.sessions (
  id        char(64)     NOT NULL CONSTRAINT pk_web_sessions PRIMARY KEY,
  user_id   varchar(20)  NOT NULL,
  expires   datetime2(0) NOT NULL
);
GO

-- kolom baru (hanya di tabel schema web)
IF COL_LENGTH('web.sessions', 'ip') IS NULL
ALTER TABLE web.sessions ADD ip varchar(45) NULL;
GO

-- index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_web_sessions_user' AND object_id = OBJECT_ID('web.sessions'))
CREATE INDEX ix_web_sessions_user ON web.sessions (user_id);
GO

-- view / procedure / function: CREATE OR ALTER (SQL Server 2016 SP1+)
CREATE OR ALTER VIEW web.v_contoh AS SELECT 1 AS x;
GO
```

## Menjalankan

Di SSMS: buka script lalu Execute (F5), berurutan sesuai nomor. Di command line:

```bash
sqlcmd -S SERVER -d SENJA_DEMO -U user -P "password" -b -i db/migrations/001_schema-web.sql
```

Jalankan dulu di `SENJA_DEMO`, uji aplikasinya, baru jalankan script yang sama di database live.
