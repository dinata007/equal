-- 003 · Profil pengguna web: foto & preferensi tampilan (tema, warna aksen, font, ukuran teks).
-- Terpisah dari dbo.AppUser agar foto (biner) tidak ikut terbaca saat login/daftar pengguna. Idempoten.

-- opsi sesi yang wajib untuk index bersyarat (sqlcmd defaultnya OFF; SSMS & db:migrate sudah ON)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID('dbo.AppUserProfile', 'U') IS NULL
CREATE TABLE dbo.AppUserProfile (
	user_id     int            NOT NULL CONSTRAINT pk_AppUserProfile PRIMARY KEY
	                                    CONSTRAINT fk_AppUserProfile_user REFERENCES dbo.AppUser (id) ON DELETE CASCADE,
	avatar      varbinary(max) NULL,              -- foto persegi hasil crop di browser (webp/png/jpeg, maks 512 KB)
	avatar_type varchar(20)    NULL,
	avatar_ver  int            NOT NULL CONSTRAINT df_AppUserProfile_avatar_ver DEFAULT (0),  -- naik tiap ganti foto (cache browser)
	prefs       nvarchar(1000) NULL,              -- JSON preferensi tampilan, divalidasi server
	updated_at  datetime2(0)   NOT NULL CONSTRAINT df_AppUserProfile_updated DEFAULT (SYSUTCDATETIME())
);
GO
