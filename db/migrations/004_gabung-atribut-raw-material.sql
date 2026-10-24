-- 004 · Menu "Atribut Raw Material" digabung ke menu Raw Material (tab Induk, Jenis, Tipe, …).
-- Pengguna yang punya akses atribut saja tetap bisa mengelolanya lewat menu Raw Material. Idempoten.

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

INSERT INTO dbo.AppUserMenu (user_id, menu_path)
SELECT a.user_id, '/material/master/raw-material'
FROM dbo.AppUserMenu a
WHERE a.menu_path = '/material/master/atribut-material'
	AND NOT EXISTS (SELECT 1 FROM dbo.AppUserMenu b WHERE b.user_id = a.user_id AND b.menu_path = '/material/master/raw-material');
GO

DELETE FROM dbo.AppUserMenu WHERE menu_path = '/material/master/atribut-material';
GO
