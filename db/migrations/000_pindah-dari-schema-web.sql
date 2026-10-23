-- 000 · Pindahkan tabel login dari schema web lama ke dbo berawalan App (web.users → dbo.AppUser, dst.).
-- Hanya berpengaruh di database yang dimigrasi sebelum 24/10/2026; di database baru tidak melakukan apa-apa.
-- Data, index, constraint & relasi ikut pindah utuh. Harus jalan sebelum 001 agar 001 tidak membuat tabel kosong.

-- opsi sesi yang wajib untuk index bersyarat (sqlcmd defaultnya OFF; SSMS & db:migrate sudah ON)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- rename di dalam schema web dulu (nama dbo.users sudah dipakai aplikasi lama), baru pindah ke dbo
DECLARE @map TABLE (old_name sysname, new_name sysname);
INSERT INTO @map VALUES
	('users', 'AppUser'), ('sessions', 'AppSession'), ('user_menus', 'AppUserMenu'),
	('user_scopes', 'AppUserScope'), ('audit_log', 'AppAuditLog');

DECLARE @o sysname, @n sysname, @s nvarchar(400);
DECLARE c CURSOR LOCAL FAST_FORWARD FOR SELECT old_name, new_name FROM @map;
OPEN c;
FETCH NEXT FROM c INTO @o, @n;
WHILE @@FETCH_STATUS = 0
BEGIN
	IF OBJECT_ID(N'web.' + @o, 'U') IS NOT NULL AND OBJECT_ID(N'dbo.' + @n, 'U') IS NULL
	BEGIN
		SET @s = N'web.' + @o;
		EXEC sp_rename @s, @n;
		SET @s = N'ALTER SCHEMA dbo TRANSFER web.' + QUOTENAME(@n);
		EXEC (@s);
	END
	FETCH NEXT FROM c INTO @o, @n;
END
CLOSE c;
DEALLOCATE c;
GO

-- nama constraint & index mengikuti nama tabel baru (001 mengecek index berdasarkan nama)
DECLARE @ren TABLE (tbl sysname, old_name sysname, new_name sysname, is_index bit);
INSERT INTO @ren VALUES
	('AppUser', 'pk_web_users', 'pk_AppUser', 0),
	('AppUser', 'df_web_users_must_change', 'df_AppUser_must_change', 0),
	('AppUser', 'df_web_users_is_admin', 'df_AppUser_is_admin', 0),
	('AppUser', 'df_web_users_active', 'df_AppUser_active', 0),
	('AppUser', 'df_web_users_failed', 'df_AppUser_failed', 0),
	('AppUser', 'df_web_users_created', 'df_AppUser_created', 0),
	('AppUser', 'ux_web_users_username', 'ux_AppUser_username', 1),
	('AppUser', 'ux_web_users_legacy', 'ux_AppUser_legacy', 1),
	('AppSession', 'pk_web_sessions', 'pk_AppSession', 0),
	('AppSession', 'fk_web_sessions_user', 'fk_AppSession_user', 0),
	('AppSession', 'df_web_sessions_created', 'df_AppSession_created', 0),
	('AppSession', 'df_web_sessions_seen', 'df_AppSession_seen', 0),
	('AppSession', 'ix_web_sessions_user', 'ix_AppSession_user', 1),
	('AppUserMenu', 'pk_web_user_menus', 'pk_AppUserMenu', 0),
	('AppUserMenu', 'fk_web_menus_user', 'fk_AppUserMenu_user', 0),
	('AppUserScope', 'pk_web_user_scopes', 'pk_AppUserScope', 0),
	('AppUserScope', 'fk_web_scope_user', 'fk_AppUserScope_user', 0),
	('AppAuditLog', 'pk_web_audit_log', 'pk_AppAuditLog', 0),
	('AppAuditLog', 'df_web_audit_at', 'df_AppAuditLog_at', 0),
	('AppAuditLog', 'ix_web_audit_at', 'ix_AppAuditLog_at', 1);

DECLARE @t sysname, @o sysname, @n sysname, @i bit, @s nvarchar(400);
DECLARE c CURSOR LOCAL FAST_FORWARD FOR SELECT tbl, old_name, new_name, is_index FROM @ren;
OPEN c;
FETCH NEXT FROM c INTO @t, @o, @n, @i;
WHILE @@FETCH_STATUS = 0
BEGIN
	IF @i = 1 AND EXISTS (SELECT 1 FROM sys.indexes WHERE name = @o AND object_id = OBJECT_ID(N'dbo.' + @t))
	BEGIN
		SET @s = N'dbo.' + @t + N'.' + @o;
		EXEC sp_rename @s, @n, 'INDEX';
	END
	ELSE IF @i = 0 AND OBJECT_ID(N'dbo.' + @o) IS NOT NULL
	BEGIN
		SET @s = N'dbo.' + @o;
		EXEC sp_rename @s, @n, 'OBJECT';
	END
	FETCH NEXT FROM c INTO @t, @o, @n, @i;
END
CLOSE c;
DEALLOCATE c;
GO

IF SCHEMA_ID('web') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.objects WHERE schema_id = SCHEMA_ID('web'))
EXEC('DROP SCHEMA web');
GO
