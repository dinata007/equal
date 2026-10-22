-- 002 · Salin akun aplikasi lama (dbo.SYS_USER) ke web.users. Idempoten: hanya menambah akun yang belum ada.
-- Password lama TIDAK disalin. Akun hasil salinan belum bisa login sampai admin membuat
-- password sementara (menu Pengguna & Hak Akses), lalu pengguna wajib menggantinya saat login pertama.
-- Hak akses tidak disalin; admin mengaturnya di aplikasi web (bisa disalin dari pengguna lain).

IF OBJECT_ID('dbo.SYS_USER', 'U') IS NOT NULL
INSERT INTO web.users (username, name, legacy_user_id, toko_id, active, must_change_password, created_by)
SELECT	LTRIM(RTRIM(s.user_id)),
		LEFT(COALESCE(NULLIF(LTRIM(RTRIM(s.user_name)), ''), LTRIM(RTRIM(s.user_id))), 80),
		LTRIM(RTRIM(s.user_id)),
		NULLIF(LTRIM(RTRIM(s.toko_id)), ''),
		CASE WHEN s.flag_active = 'Y' THEN 1 ELSE 0 END,
		1,
		'migrasi'
FROM	dbo.SYS_USER s
WHERE	NULLIF(LTRIM(RTRIM(s.user_id)), '') IS NOT NULL
		AND NOT EXISTS (
			SELECT 1 FROM web.users u
			WHERE u.legacy_user_id = LTRIM(RTRIM(s.user_id)) OR u.username = LTRIM(RTRIM(s.user_id))
		);
GO
