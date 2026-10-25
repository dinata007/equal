-- 005 · Menu "Atribut Produk" digabung ke menu Produk (tab Brand, Gender, Department, …).
-- Pengguna yang punya akses atribut saja tetap bisa mengelolanya lewat menu Produk. Idempoten.

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

INSERT INTO dbo.AppUserMenu (user_id, menu_path)
SELECT a.user_id, '/inventory/master/produk'
FROM dbo.AppUserMenu a
WHERE a.menu_path = '/inventory/master/atribut-produk'
	AND NOT EXISTS (SELECT 1 FROM dbo.AppUserMenu b WHERE b.user_id = a.user_id AND b.menu_path = '/inventory/master/produk');
GO

DELETE FROM dbo.AppUserMenu WHERE menu_path = '/inventory/master/atribut-produk';
GO
