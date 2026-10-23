-- 001 · Login & hak akses aplikasi web (schema web). Idempoten: aman dijalankan berulang.
-- Tidak mengubah tabel aplikasi lama. Semua waktu disimpan dalam UTC.

-- opsi sesi yang wajib untuk index bersyarat (sqlcmd defaultnya OFF; SSMS & db:migrate sudah ON)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF SCHEMA_ID('web') IS NULL EXEC('CREATE SCHEMA web');
GO

-- Akun pengguna web. Password disimpan sebagai hash scrypt (bukan teks asli).
IF OBJECT_ID('web.users', 'U') IS NULL
CREATE TABLE web.users (
	id                   int IDENTITY(1, 1) NOT NULL CONSTRAINT pk_web_users PRIMARY KEY,
	username             varchar(30)   NOT NULL,
	name                 nvarchar(80)  NOT NULL,
	password_hash        varchar(255)  NULL,              -- NULL = belum punya password (mis. hasil migrasi akun lama)
	must_change_password bit           NOT NULL CONSTRAINT df_web_users_must_change DEFAULT (1),
	is_admin             bit           NOT NULL CONSTRAINT df_web_users_is_admin DEFAULT (0),
	active               bit           NOT NULL CONSTRAINT df_web_users_active DEFAULT (1),
	toko_id              varchar(10)   NULL,              -- toko default (dbo.M_TOKO.toko_id)
	legacy_user_id       varchar(15)   NULL,              -- asal akun di aplikasi lama (dbo.SYS_USER.user_id)
	failed_attempts      int           NOT NULL CONSTRAINT df_web_users_failed DEFAULT (0),
	locked_until         datetime2(0)  NULL,
	password_changed_at  datetime2(0)  NULL,
	last_login_at        datetime2(0)  NULL,
	created_at           datetime2(0)  NOT NULL CONSTRAINT df_web_users_created DEFAULT (SYSUTCDATETIME()),
	created_by           varchar(30)   NULL,
	updated_at           datetime2(0)  NULL,
	updated_by           varchar(30)   NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_web_users_username' AND object_id = OBJECT_ID('web.users'))
CREATE UNIQUE INDEX ux_web_users_username ON web.users (username);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_web_users_legacy' AND object_id = OBJECT_ID('web.users'))
CREATE UNIQUE INDEX ux_web_users_legacy ON web.users (legacy_user_id) WHERE legacy_user_id IS NOT NULL;
GO

-- Sesi login. Yang disimpan hanya hash SHA-256 dari token cookie.
IF OBJECT_ID('web.sessions', 'U') IS NULL
CREATE TABLE web.sessions (
	id                  char(64)      NOT NULL CONSTRAINT pk_web_sessions PRIMARY KEY,
	user_id             int           NOT NULL CONSTRAINT fk_web_sessions_user REFERENCES web.users (id) ON DELETE CASCADE,
	created_at          datetime2(0)  NOT NULL CONSTRAINT df_web_sessions_created DEFAULT (SYSUTCDATETIME()),
	last_seen_at        datetime2(0)  NOT NULL CONSTRAINT df_web_sessions_seen DEFAULT (SYSUTCDATETIME()),
	expires_at          datetime2(0)  NOT NULL,           -- habis bila tidak dipakai (idle)
	absolute_expires_at datetime2(0)  NOT NULL,           -- batas maksimum sejak login
	ip                  varchar(45)   NULL,
	user_agent          nvarchar(300) NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_web_sessions_user' AND object_id = OBJECT_ID('web.sessions'))
CREATE INDEX ix_web_sessions_user ON web.sessions (user_id);
GO

-- Hak akses: menu yang aktif per pengguna (menu aktif = boleh semua aksi di menu itu; admin tidak perlu diatur).
IF OBJECT_ID('web.user_menus', 'U') IS NULL
CREATE TABLE web.user_menus (
	user_id   int          NOT NULL CONSTRAINT fk_web_menus_user REFERENCES web.users (id) ON DELETE CASCADE,
	menu_path varchar(150) NOT NULL,     -- path menu aplikasi web, mis. /inventory/transaksi/order-pembelian
	CONSTRAINT pk_web_user_menus PRIMARY KEY (user_id, menu_path)
);
GO

-- Cakupan data per pengguna, mis. scope 'brand' value 'A'; value '*' = semua.
IF OBJECT_ID('web.user_scopes', 'U') IS NULL
CREATE TABLE web.user_scopes (
	user_id int         NOT NULL CONSTRAINT fk_web_scope_user REFERENCES web.users (id) ON DELETE CASCADE,
	scope   varchar(10) NOT NULL,
	value   varchar(20) NOT NULL,
	CONSTRAINT pk_web_user_scopes PRIMARY KEY (user_id, scope, value)
);
GO

-- Jejak keamanan: login, logout, ganti password, perubahan pengguna & hak akses.
IF OBJECT_ID('web.audit_log', 'U') IS NULL
CREATE TABLE web.audit_log (
	id       bigint IDENTITY(1, 1) NOT NULL CONSTRAINT pk_web_audit_log PRIMARY KEY,
	at       datetime2(0)  NOT NULL CONSTRAINT df_web_audit_at DEFAULT (SYSUTCDATETIME()),
	user_id  int           NULL,
	username varchar(30)   NULL,
	event    varchar(40)   NOT NULL,
	ip       varchar(45)   NULL,
	detail   nvarchar(500) NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_web_audit_at' AND object_id = OBJECT_ID('web.audit_log'))
CREATE INDEX ix_web_audit_at ON web.audit_log (at);
GO
