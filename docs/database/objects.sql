-- Definisi view, procedure, function & trigger di SENJA_DEMO (dibuat 23/10/2026, 05.35.58)
-- PERIKSA sebelum di-commit: hapus password / connection string bila ada.

-- ===== SQL_INLINE_TABLE_VALUED_FUNCTION: dbo.Get_Awal_Coa
CREATE FUNCTION dbo.Get_Awal_Coa(
	@Site	VARCHAR(2),
	@Tahun	INT,
	@Bulan	INT,
	@Coa	VARCHAR(30)
)
RETURNS TABLE
AS
RETURN	
	SELECT 	a.site_id,
			a.account_id,   
			a.account_desc,
			a.flag_dk,
			isnull(awal.debit,0) +  isnull(awal2.debit,0) as awal_debit,
			isnull(awal.credit,0) + isnull(awal2.credit,0) as awal_credit
	FROM 	gl_coa a WITH(NOLOCK)
			LEFT JOIN
			(
				SELECT 	gl_balance.account_id,   
						sum(debet) as debit,   
						sum(kredit) as credit  
				FROM 	gl_balance  
				WHERE 	year(gl_balance.periode) = @Tahun and
						gl_balance.site_id = @Site and
						(gl_balance.account_id = @Coa)
				GROUP BY gl_balance.account_id   
			) awal ON a.account_id = awal.account_id
			LEFT JOIN
			(
				SELECT 	gl_journal_detail.account_id,   
						sum(debet) as debit,   
						sum(kredit) as credit  
				FROM 	gl_journal,   
						gl_journal_detail  
				WHERE 	( gl_journal_detail.site_id = gl_journal.site_id ) and  
						( gl_journal_detail.voucher = gl_journal.voucher ) and  
						( ( month(gl_journal.voucher_periode) < @Bulan ) and 
						( year(gl_journal.voucher_periode) = @Tahun ) ) and
						( gl_journal.site_id = @Site ) and
						( gl_journal_detail.account_id = @Coa )
				GROUP BY gl_journal_detail.account_id   
			) awal2 ON a.account_id = awal2.account_id
	WHERE 	(a.flag_active = 'Y') and
			(a.site_id = @Site )
GO

-- ===== SQL_SCALAR_FUNCTION: dbo.fn_diagramobjects
CREATE FUNCTION dbo.fn_diagramobjects() 
	RETURNS int
	WITH EXECUTE AS N'dbo'
	AS
	BEGIN
		declare @id_upgraddiagrams		int
		declare @id_sysdiagrams			int
		declare @id_helpdiagrams		int
		declare @id_helpdiagramdefinition	int
		declare @id_creatediagram	int
		declare @id_renamediagram	int
		declare @id_alterdiagram 	int 
		declare @id_dropdiagram		int
		declare @InstalledObjects	int

		select @InstalledObjects = 0

		select 	@id_upgraddiagrams = object_id(N'dbo.sp_upgraddiagrams'),
			@id_sysdiagrams = object_id(N'dbo.sysdiagrams'),
			@id_helpdiagrams = object_id(N'dbo.sp_helpdiagrams'),
			@id_helpdiagramdefinition = object_id(N'dbo.sp_helpdiagramdefinition'),
			@id_creatediagram = object_id(N'dbo.sp_creatediagram'),
			@id_renamediagram = object_id(N'dbo.sp_renamediagram'),
			@id_alterdiagram = object_id(N'dbo.sp_alterdiagram'), 
			@id_dropdiagram = object_id(N'dbo.sp_dropdiagram')

		if @id_upgraddiagrams is not null
			select @InstalledObjects = @InstalledObjects + 1
		if @id_sysdiagrams is not null
			select @InstalledObjects = @InstalledObjects + 2
		if @id_helpdiagrams is not null
			select @InstalledObjects = @InstalledObjects + 4
		if @id_helpdiagramdefinition is not null
			select @InstalledObjects = @InstalledObjects + 8
		if @id_creatediagram is not null
			select @InstalledObjects = @InstalledObjects + 16
		if @id_renamediagram is not null
			select @InstalledObjects = @InstalledObjects + 32
		if @id_alterdiagram  is not null
			select @InstalledObjects = @InstalledObjects + 64
		if @id_dropdiagram is not null
			select @InstalledObjects = @InstalledObjects + 128
		
		return @InstalledObjects 
	END
GO

-- ===== SQL_SCALAR_FUNCTION: dbo.SALDO
CREATE FUNCTION SALDO
	(@tgl datetime , @norek varchar(15))
RETURNS decimal AS  
BEGIN 
	declare @hasil decimal
	set @hasil = 
	(
	select 	sum(isnull(T_TABUNGAN.masuk,0)) - sum(isnull(T_TABUNGAN.keluar,0))
	from	T_TABUNGAN
	where 	( T_TABUNGAN.tgl < @tgl ) and
		( T_TABUNGAN.norek = @norek )
	)
	if @hasil = null  
	begin
		set @hasil = 0 
	end
	return @hasil
END
GO

-- ===== SQL_SCALAR_FUNCTION: dbo.stok_produk
CREATE FUNCTION [dbo].[stok_produk]
   (@arg_article varchar(25))
RETURNS decimal(12,2) 
AS
BEGIN
  DECLARE @awal decimal(12,2)
  DECLARE @arg_periode datetime

   set @arg_periode  = (SELECT getdate() FROM sys_SETUP )

   set @awal = ( 

		SELECT 	isnull(AWAL.qty,0) + ( isnull(qty_beli,0) + isnull(qty_retur_jual,0) + isnull(qty_krp,0) + isnull(qty_retur_TOKO_KRM,0)) -  (isnull(qty_jual,0) + isnull(qty_retur,0) + isnull(qty_krm,0) + isnull(qty_TOKO_KRM,0)) as saldo
		
		FROM 	M_PRODUK
					LEFT OUTER JOIN
					(
						SELECT	produk_id, qty
						FROM		S_AWAL_GUDANG
						WHERE	year(periode) = year(@arg_periode)and 
								month(periode) = month(@arg_periode)
					) AWAL ON M_PRODUK.produk_id = AWAL.produk_id
		
					LEFT OUTER JOIN
					(
						SELECT		T_GUDANG2.produk_id as 'produk_id',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'TERIMA' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_beli',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'RETUR' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_retur',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'KIRIM TOKO' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_TOKO_KRM',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'RETUR TOKO' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_retur_TOKO_KRM',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'KIRIM PENJUALAN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_jual',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'RETUR PENJUALAN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_retur_jual',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'KOREKSI PLUS' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_krp',
										SUM(CASE T_GUDANG1.tipe_trans WHEN 'KOREKSI MIN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_krm'
						FROM			T_GUDANG1 INNER JOIN T_GUDANG2 ON T_GUDANG1.bukti = T_GUDANG2.bukti
						WHERE		year( T_GUDANG1.tgl)=year(@arg_periode) and
								month( T_GUDANG1.tgl)=month(@arg_periode)
						GROUP BY 	T_GUDANG2.produk_id
					) GUDANG ON M_PRODUK.produk_id = GUDANG.produk_id
		WHERE	M_PRODUK.produk_id = @arg_article
		)
   RETURN ( @awal )
END
GO

-- ===== SQL_SCALAR_FUNCTION: dbo.uf_eom
CREATE FUNCTION dbo.uf_eom
(
	-- Add the parameters for the function here
	@arg_periode datetime
)
RETURNS datetime
AS
BEGIN
	-- Declare the return variable here
	DECLARE @xHasil datetime

	-- Add the T-SQL statements to compute the return value here
	select @xHasil = DATEADD(s,-1,DATEADD(mm, DATEDIFF(m,0,@arg_periode)+1,0)) 

	-- Return the result of the function
	RETURN @xHasil
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_alterdiagram
CREATE PROCEDURE dbo.sp_alterdiagram
	(
		@diagramname 	sysname,
		@owner_id	int	= null,
		@version 	int,
		@definition 	varbinary(max)
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
	
		declare @theId 			int
		declare @retval 		int
		declare @IsDbo 			int
		
		declare @UIDFound 		int
		declare @DiagId			int
		declare @ShouldChangeUID	int
	
		if(@diagramname is null)
		begin
			RAISERROR ('Invalid ARG', 16, 1)
			return -1
		end
	
		execute as caller;
		select @theId = DATABASE_PRINCIPAL_ID();	 
		select @IsDbo = IS_MEMBER(N'db_owner'); 
		if(@owner_id is null)
			select @owner_id = @theId;
		revert;
	
		select @ShouldChangeUID = 0
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname 
		
		if(@DiagId IS NULL or (@IsDbo = 0 and @theId <> @UIDFound))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1);
			return -3
		end
	
		if(@IsDbo <> 0)
		begin
			if(@UIDFound is null or USER_NAME(@UIDFound) is null) -- invalid principal_id
			begin
				select @ShouldChangeUID = 1 ;
			end
		end

		-- update dds data			
		update dbo.sysdiagrams set definition = @definition where diagram_id = @DiagId ;

		-- change owner
		if(@ShouldChangeUID = 1)
			update dbo.sysdiagrams set principal_id = @theId where diagram_id = @DiagId ;

		-- update dds version
		if(@version is not null)
			update dbo.sysdiagrams set version = @version where diagram_id = @DiagId ;

		return 0
	END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Attend_Insert
CREATE PROCEDURE [dbo].[sp_Attend_Insert]
	@NIK	varchar(50),
	@Cust	varchar(10),
	@Shift	int,
	@Foto	varchar(50),
	@Face	varchar(max)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @Absen		datetime
	DECLARE @Tgl		DATETIME
	DECLARE @Nama		VARCHAR(50)
	DECLARE @CustName	VARCHAR(50)
	DECLARE @JamMasuk	datetime
	DECLARE @JamMasuk2	datetime
	DECLARE @JamKeluar	datetime
	DECLARE @JamKeluar2	DATETIME
	DECLARE	@Aten		BIGINT
	DECLARE @hari		VARCHAR(30)
	DECLARE @Status		VARCHAR(5)
	DECLARE @Telat		INT
	DECLARE @TelatMin	INT
	DECLARE @TelatMax	INT
	DECLARE @TelatRp	INT

	SET @Absen = GETDATE()
	SET @Tgl = @Absen

	SELECT @Nama = nama FROM M_PEGAWAI WHERE nik = @NIK
	SELECT @CustName = cust_name FROM M_Customer WHERE cust_id = @Cust

	SELECT	@JamMasuk = CONVERT(datetime, FORMAT(@Tgl, 'yyyy-MM-dd ') + jam_masuk)
			,@JamMasuk2 = CONVERT(datetime, FORMAT(@Tgl, 'yyyy-MM-dd ') + jam_masuk2)
			,@JamKeluar = CONVERT(datetime, FORMAT(@Tgl, 'yyyy-MM-dd ') + jam_keluar)
			,@JamKeluar2 = CONVERT(datetime, FORMAT(@Tgl, 'yyyy-MM-dd ') + jam_keluar2)
	FROM 	M_PEGAWAI_SHIFT 
	WHERE	shift_id = @Shift;

	IF FORMAT(@JamMasuk, 'HH:mm') = '00:00'
		BEGIN
			IF DATEDIFF(HOUR, @JamMasuk, @Tgl) < 8 SET @JamMasuk = DATEADD(DAY, -1, @JamMasuk)
		END

	IF DATEDIFF(HOUR, @JamMasuk, @Tgl) > 4 SET @Status = 'OUT'
	ELSE SET @Status = 'IN'

	SELECT @hari = FORMAT(@JamMasuk, 'dddd')
	SELECT @Aten = isnull(attend_id,0) FROM attend WHERE tgl = CONVERT(DATETIME, FORMAT(@JamMasuk, 'yyyy-MM-dd')) AND nik = @NIK
	if @Aten is null set @Aten = 0

	--SELECT ISNULL(@Aten,0) atend_id, @Status status, @JamMasuk, @Tgl, DATEDIFF(HOUR, @JamMasuk, @Tgl)

	IF ISNULL(@Aten,0) = 0
		BEGIN
			IF @Status = 'IN'
				BEGIN
					SELECT 	@Telat = DATEDIFF(MINUTE, FORMAT(@JamMasuk, 'HH:mm'), FORMAT(@Absen, 'HH:mm'))
							,@TelatMin = isnull(min_telat,0)
							,@TelatMax = isnull(max_telat,0)
							,@TelatRp = isnull(pot_absen_telat,0)
					FROM	M_GAJI_UMR
					WHERE 	cust_id = @Cust;
					IF NOT (@Telat >= @TelatMin) -- AND @Telat < @TelatMax)
					BEGIN
                    	SET @Telat = 0
						SET @TelatRp = 0
                    END
						

					BEGIN TRANSACTION;
					INSERT INTO attend (tgl, hari, tipe_id, inn, inn2, telat, pot_telat, nik, nama, cust_id, cust_name, shift_id, 
										jam_masuk, jam_masuk2, jam_keluar, jam_keluar2, foto_in, created_at, face_id_in)
					SELECT 	CONVERT(DATETIME, FORMAT(@JamMasuk, 'yyyy-MM-dd')), @hari, 25, FORMAT(@Absen, 'HH:mm'), @Absen, @Telat, @TelatRp, @NIK, @Nama, @Cust, @CustName, shift_id
							,jam_masuk, jam_masuk2, jam_keluar, jam_keluar2
							,@Foto, GETDATE(), @Face
					FROM	M_PEGAWAI_SHIFT
					WHERE	shift_id = @Shift;
					COMMIT TRANSACTION;
				END
			ELSE
				BEGIN
					BEGIN TRANSACTION;
					INSERT INTO attend (tgl, hari, tipe_id, ou, ou2, nik, nama, cust_id, cust_name, shift_id, jam_masuk, jam_masuk2, jam_keluar, jam_keluar2, foto_out, created_at, face_id_out)
					SELECT 	CONVERT(DATETIME, FORMAT(@JamMasuk, 'yyyy-MM-dd')), @hari, 25, FORMAT(@Absen, 'HH:mm'), @Absen, @NIK, @Nama, @Cust, @CustName, shift_id
							,jam_masuk, jam_masuk2, jam_keluar, jam_keluar2
							,@Foto, GETDATE(), @Face
					FROM	M_PEGAWAI_SHIFT
					WHERE	shift_id = @Shift;
					COMMIT TRANSACTION;
				END
		END
	ELSE
		IF @Status = 'OUT'
		BEGIN
			BEGIN TRANSACTION
    		UPDATE	attend
			SET		ou = FORMAT(@Absen, 'HH:mm')
					,ou2 = @Absen
					,foto_out = @Foto
					,face_id_out = @Face
					,updated_at = GETDATE()
			WHERE	attend_id = @Aten;
			IF @@rowcount > 0 
				BEGIN
					COMMIT TRANSACTION;
					exec sp_Attend_Update_Baru @Aten;
				END
			ELSE ROLLBACK TRANSACTION;
		END

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Attend_Insert_Izin
CREATE PROCEDURE [dbo].[sp_Attend_Insert_Izin]
	@IzinID	bigint
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @JmlHari	int
	DECLARE @JmlMnt		int
	DECLARE @TelatID	INT
	DECLARE @MntTelat	DECIMAL(10)
	DECLARE @Per		DECIMAL(10)
	DECLARE @PotPokok	DECIMAL(10) = 0
	DECLARE @Tipe		int
	DECLARE @i			INT = 0
	DECLARE @Tgl		DATETIME
	DECLARE	@Tgl1		DATETIME
	DECLARE @Tgl2		DATETIME
	DECLARE	@NIK		VARCHAR(15)
	DECLARE @Cnt		INT

	SELECT	@Tipe = tipe_id FROM T_PEGAWAI_IZIN WHERE izin_id = @IzinID;

--	Izin Lembur
	if @Tipe IN (13) 
	BEGIN		
		BEGIN TRANSACTION
		INSERT INTO attend (tgl, hari, tipe_id, lembur_menit, remark, nik, nama, created_at, izin_id)		
		SELECT	CONVERT(DATETIME, FORMAT(a.tgl1, 'yyyy-MM-dd 00:00:00')) tgl
				,FORMAT(a.tgl1, 'dddd') hari
				,a.tipe_id tipe_id, a.jml_mnt
				,CONCAT(FORMAT(a.tgl1, 'HH:mm'), ' - ', FORMAT(a.tgl2, 'HH:mm'), ', ', keterangan) remark, a.nik nik, b.nama nama, GETDATE(), izin_id izin_id
		FROM	T_PEGAWAI_IZIN a
				LEFT JOIN View_Pegawai_Kontrak b ON a.peg_id = b.peg_id
				LEFT JOIN M_PEGAWAI_TUNJANGAN c ON a.peg_id = c.peg_id
		WHERE	a.izin_id = @IzinID;
		
		IF @@error = 0 COMMIT ELSE ROLLBACK;
	END	

	if @Tipe not in (16,17,20,21,23,13)
	begin
		SELECT	@JmlHari = a.jml_hari
		FROM 	T_PEGAWAI_IZIN a LEFT JOIN M_PEGAWAI_IZIN_TIPE b ON a.tipe_id = b.id
		WHERE	a.izin_id = @IzinID;

		set @i = 0
		while @i < @JmlHari
		begin
			INSERT INTO attend (tgl, hari, tipe_id, remark, status, nik, nama, cust_id, cust_name, created_at, izin_id)
			SELECT	CONVERT(DATETIME, FORMAT(DATEADD(DAY, @i, a.tgl1), 'yyyy-MM-dd 00:00:00'))
					,FORMAT(CONVERT(DATETIME, FORMAT(DATEADD(DAY, @i, a.tgl1), 'yyyy-MM-dd 00:00:00')), 'dddd')
					,a.tipe_id, keterangan, 1, a.nik, b.nama, a.cust_id, b.cust_name, GETDATE(), izin_id
			FROM	T_PEGAWAI_IZIN a
					LEFT JOIN View_Pegawai_Kontrak b ON a.peg_id = b.peg_id
			WHERE	a.izin_id = @IzinID;
			set @i = @i + 1
		end

	end
	
--	Izin Masuk Setengah Hari - Datang Terlambat/Pulang Cepat
	if @Tipe IN (16, 17) 
	BEGIN
		SELECT	@JmlHari = a.jml_hari
		FROM 	T_PEGAWAI_IZIN a LEFT JOIN M_PEGAWAI_IZIN_TIPE b ON a.tipe_id = b.id
		WHERE	a.izin_id = @IzinID;

		SELECT TOP 1 
				@TelatID = telat_id,
				@MntTelat = menit,
				@Per = per
		FROM M_tipe_telat
		WHERE menit <= @JmlMnt
		ORDER BY menit DESC

		IF ISNULL(@MntTelat, 0) >= 61 SET @PotPokok = ROUND((@JmlMnt - 60) / 60, 0)
		
		BEGIN TRANSACTION
		INSERT INTO attend (tgl, hari, tipe_id, mnt_premi, pot_premi, jam_pokok, pot_pokok, remark, status, nik, nama, created_at, izin_id, app)		
		SELECT	CONVERT(DATETIME, FORMAT(a.tgl1, 'yyyy-MM-dd 00:00:00')) tgl
				,FORMAT(a.tgl1, 'dddd') hari
				,a.tipe_id tipe_id, @JmlMnt mnt_premi, ROUND((ISNULL(@Per, 0) / 100) * ISNULL(c.hr_premi,0), 0) pot_premi
				,@PotPokok jam_pokok, @PotPokok * ISNULL(c.jam_gapok, 0) pot_pokok
				,CONCAT(FORMAT(a.tgl1, 'HH:mm'), ' - ', FORMAT(a.tgl2, 'HH:mm'), ', ', keterangan) remark, 1 status, a.nik nik, b.nama nama, GETDATE(), izin_id izin_id, 1
		FROM	T_PEGAWAI_IZIN a
				LEFT JOIN View_Pegawai_Kontrak b ON a.peg_id = b.peg_id
				LEFT JOIN M_PEGAWAI_TUNJANGAN c ON a.peg_id = c.peg_id
		WHERE	a.izin_id = @IzinID;
		
		IF @@error = 0 COMMIT ELSE ROLLBACK;
	END	

--	Sakit Tanpa Surat Dokter
	if @Tipe = 20	
	BEGIN
		SELECT	@JmlHari = DATEDIFF(DAY, a.tgl1, a.tgl2), @Tgl = CONVERT(DATETIME, FORMAT(a.tgl1, 'yyyy-MM-dd 00:00:00'))
		FROM 	T_PEGAWAI_IZIN a LEFT JOIN M_PEGAWAI_IZIN_TIPE b ON a.tipe_id = b.id
		WHERE	a.izin_id = @IzinID;

		WHILE @i <= @JmlHari BEGIN
			BEGIN TRANSACTION
			INSERT INTO attend (tgl, hari, tipe_id, hari_kerja, pot_premi, remark, status, nik, nama, created_at, izin_id, app)
			SELECT	@Tgl tgl
					,FORMAT(@Tgl, 'dddd') hari
					,a.tipe_id tipe_id, 1 hari_kerja
					,ISNULL(c.hr_premi,0) pot_premi
					,keterangan remark, 1 status, a.nik nik, b.nama nama, GETDATE(), izin_id izin_id, 1
			FROM	T_PEGAWAI_IZIN a
					LEFT JOIN View_Pegawai_Kontrak b ON a.peg_id = b.peg_id
					LEFT JOIN M_PEGAWAI_TUNJANGAN c ON a.peg_id = c.peg_id
			WHERE	a.izin_id = @IzinID;
			
			IF @@error = 0 COMMIT ELSE ROLLBACK;
			SET @i = @i + 1
			SET @Tgl = DATEADD(DAY, 1, @Tgl)
		END
	END
	
--	Sakit Surat Dokter
	if @Tipe = 21
	BEGIN
		SELECT	@JmlHari = DATEDIFF(DAY, a.tgl1, a.tgl2), @Tgl = CONVERT(DATETIME, FORMAT(a.tgl1, 'yyyy-MM-dd 00:00:00'))
		FROM 	T_PEGAWAI_IZIN a LEFT JOIN M_PEGAWAI_IZIN_TIPE b ON a.tipe_id = b.id
		WHERE	a.izin_id = @IzinID;

		WHILE @i <= @JmlHari BEGIN
			BEGIN TRANSACTION
			INSERT INTO attend (tgl, hari, tipe_id, hari_kerja, remark, status, nik, nama, created_at, izin_id, app)
			SELECT	@Tgl tgl
					,FORMAT(@Tgl, 'dddd') hari
					,a.tipe_id tipe_id, 1 hari_kerja
					,keterangan remark, 1 status, a.nik nik, b.nama nama, GETDATE(), izin_id izin_id, 1
			FROM	T_PEGAWAI_IZIN a
					LEFT JOIN View_Pegawai_Kontrak b ON a.peg_id = b.peg_id
			WHERE	a.izin_id = @IzinID;
			
			IF @@error = 0 COMMIT ELSE ROLLBACK;
			SET @i = @i + 1
			SET @Tgl = DATEADD(DAY, 1, @Tgl)
        END
	END

--	Lupa Absen Masuk
	if @Tipe = 23
	BEGIN
		SELECT	@Tgl = CONVERT(DATETIME, FORMAT(a.tgl1, 'yyyy-MM-dd 00:00:00'))
				,@NIK = a.nik
		FROM 	T_PEGAWAI_IZIN a LEFT JOIN M_PEGAWAI_IZIN_TIPE b ON a.tipe_id = b.id
		WHERE	a.izin_id = @IzinID;
		
		IF DAY(@Tgl) = 26
			BEGIN
				SET @Tgl1 = CONVERT(DATETIME, FORMAT(@Tgl, 'yyyy-MM' + '-26'))
				SET @Tgl2 = DATEADD(MONTH, 1, CONVERT(DATETIME, FORMAT(@Tgl, 'yyyy-MM' + '-25')))
			END
		ELSE
			BEGIN
				IF DAY(@Tgl) > 26
					BEGIN
						SET @Tgl1 = CONVERT(DATETIME, FORMAT(@Tgl, 'yyyy-MM' + '-26'))
						SET @Tgl2 = DATEADD(MONTH, 1, CONVERT(DATETIME, FORMAT(@Tgl, 'yyyy-MM' + '-25')))
					END
				ELSE
					BEGIN
						SET @Tgl1 = DATEADD(MONTH, -1, CONVERT(DATETIME, FORMAT(@Tgl, 'yyyy-MM' + '-26')))
						SET @Tgl2 = CONVERT(DATETIME, FORMAT(@Tgl, 'yyyy-MM' + '-25'))
					END
			END

		SELECT 	@Cnt = COUNT(attend_id)
		FROM	attend
		WHERE 	nik = @NIK 
				AND tipe_id = @Tipe
				AND (tgl BETWEEN @Tgl1 AND @Tgl2)

			BEGIN TRANSACTION
			INSERT INTO attend (tgl, hari, tipe_id, hari_kerja, pot_premi, remark, status, nik, nama, created_at, izin_id, app)
			SELECT	@Tgl tgl
					,FORMAT(@Tgl, 'dddd') hari
					,a.tipe_id tipe_id, 1 hari_kerja
					,CASE WHEN @Cnt > 2 THEN c.hr_premi ELSE 0 END pot_premi
					,keterangan remark, 1 status, a.nik nik, b.nama nama, GETDATE(), izin_id izin_id, 1 app
			FROM	T_PEGAWAI_IZIN a
					LEFT JOIN View_Pegawai_Kontrak b ON a.peg_id = b.peg_id
					LEFT JOIN M_PEGAWAI_TUNJANGAN c ON a.peg_id = c.peg_id
			WHERE	a.izin_id = @IzinID;
			
			IF @@error = 0 COMMIT ELSE ROLLBACK;
	END


END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Attend_Update_Baru
CREATE PROCEDURE [dbo].[sp_Attend_Update_Baru]
	@AttendID	bigint
AS
BEGIN
	SET NOCOUNT ON;

	declare @wrk		varchar(10)
	declare @over		varchar(10)
	declare @hari		varchar(15)
	declare	@shift		int
	declare @hari_kerja	decimal(5,2)
	declare @hari_in	varchar(10)
	declare @hari_out	varchar(10)
	declare @jam_masuk	varchar(10)
	declare @jam_keluar	varchar(10)
	declare @jam_kerja	varchar(10)
	declare @pot_jam	varchar(10)
	declare @In			datetime
	declare @Out		datetime
	declare @Cust		varchar(15)
	declare @LemburRp	numeric(15,0)
	DECLARE	@JmlLembur	DECIMAL(10,1)
	declare @PotLembur	bit
	declare @OverLembur	varchar(10)
	declare @Ada		int = 0
	declare @Divisi		varchar(5)
	declare @over2		varchar(10)

	DECLARE @jam_masuk_dt	DATETIME
	DECLARE @jam_keluar_dt	DATETIME

	select @Ada = COUNT	(*) from attend where attend_id = @AttendID and ou2 is null;
	if @Ada > 0 return

	SELECT	@In = inn2,
			@Out = ou2,
			@jam_masuk = CASE WHEN UPPER(hari) = 'SATURDAY' THEN a.jam_masuk2 ELSE a.jam_masuk END,
			@jam_keluar = CASE WHEN UPPER(hari) = 'SATURDAY' THEN a.jam_keluar2 ELSE a.jam_keluar END,
			@Divisi = b.divisi_id
	FROM	attend a JOIN View_Pegawai_Kontrak b ON a.nik = b.nik
	WHERE	a.attend_id = @AttendID;

	IF @jam_masuk > @jam_keluar SET @jam_masuk_dt = CONVERT(DATETIME, FORMAT(@In, 'yyyy-MM-dd ') + @jam_masuk)
	ELSE SET @jam_masuk_dt = CONVERT(DATETIME, FORMAT(@In, 'yyyy-MM-dd ') + @jam_masuk)
	
	IF @jam_masuk > @jam_keluar SET @jam_keluar_dt = CONVERT(DATETIME, FORMAT(DATEADD(DAY, 1, @In), 'yyyy-MM-dd ') + @jam_keluar)
	ELSE SET @jam_keluar_dt = CONVERT(DATETIME, FORMAT(@In, 'yyyy-MM-dd ') + @jam_keluar)

	SELECT	@over = CASE WHEN ou2 < @jam_keluar_dt THEN '00:00'
					ELSE FORMAT(ou2 - @jam_keluar_dt, 'HH:mm') END,
			@hari = hari,
			@shift = shift_id,
			@pot_jam = isnull(pot_jam, '00:00'),
			@Cust = cust_id
	FROM	attend 
	WHERE	attend_id = @AttendID;

	-- hari kerja
	if @In <= @jam_masuk_dt
		select @hari_in = @jam_masuk
	else
		select @hari_in = FORMAT(@In, 'HH:mm')

	if @Out >= @jam_keluar_dt
		select @hari_out = @jam_keluar
	else
		select @hari_out = FORMAT(@Out, 'HH:mm')

	select @hari_kerja = dbo.uf_GetHariKerja_Baru(@shift, @hari, Format((CONVERT(datetime, Format(@Out, 'yyyy-MM-dd ')) + @hari_out) - (CONVERT(datetime, Format(@In, 'yyyy-MM-dd ')) + @hari_in) -
												(CONVERT(datetime, Format(@In, 'yyyy-MM-dd ')) + @pot_jam), 'HH:mm'))

	-- total kerja
	set @jam_kerja = FORMAT(DATEDIFF(HOUR, @hari_in, @hari_out), '00:') + '00'
	set @wrk = Format((CONVERT(datetime, Format(@Out, 'yyyy-MM-dd ')) + @hari_out) - (CONVERT(datetime, Format(@In, 'yyyy-MM-dd ')) + @hari_in), 'HH:mm')
	if @wrk >= @jam_kerja AND @hari_out > @jam_keluar select @wrk = @jam_kerja

	-- lembur
	SELECT @LemburRp = isnull(uang_lembur,0), @PotLembur = isnull(pot_lembur,0) FROM M_GAJI_UMR
	WHERE cust_id = @Cust;
	if @LemburRp = null set @LemburRp = 0;
	if (@PotLembur = 1 and @over >= '03:30') set @OverLembur = FORMAT(DATEADD(MINUTE, -30, @over), 'hh:mm')
	else set @OverLembur = @over

	
	SET @over2 = FORMAT(@jam_masuk_dt - @In, 'HH:mm')
	IF @Divisi = '018' --SECURITY
		BEGIN
			IF @over2 >= '00:50' SET @over2 = '01:00' ELSE SET @over2 = '00:00'
			SET @OverLembur = FORMAT(CONVERT(DATETIME, @OverLembur) + CONVERT(DATETIME, @over2), 'HH:mm')
		END

	IF @Divisi = '019' --SUPIR
		BEGIN
			IF @over2 >= '01:30' SET @over2 = '01:30' 
			ELSE IF @over2 >= '01:00' SET @over2 = '01:00'
			ELSE SET @over2 = '00:00'
			SET @OverLembur = FORMAT(CONVERT(DATETIME, @OverLembur) + CONVERT(DATETIME, @over2), 'HH:mm')
		END

	IF @Divisi NOT IN ('018','019') SET @OverLembur = FORMAT(CONVERT(DATETIME, @OverLembur), 'HH:mm')

	SELECT @JmlLembur = jumlah FROM M_PEGAWAI_LEMBUR WHERE @OverLembur BETWEEN jam1 AND jam2;
	IF @JmlLembur IS NULL SET @JmlLembur = 0
	SET @LemburRp = @JmlLembur * @LemburRp

	begin transaction
	update	attend 
	set		wrk = @wrk,
			overtime = @OverLembur,
			hari_kerja = @hari_kerja,
			lembur_rp = @LemburRp
	where	attend_id = @AttendID;

	if @@ERROR = 0
		begin
			commit transaction
			return @@ERROR
		end
	else
		begin
			rollback transaction
			return @@ERROR
		end

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_creatediagram
CREATE PROCEDURE dbo.sp_creatediagram
	(
		@diagramname 	sysname,
		@owner_id		int	= null, 	
		@version 		int,
		@definition 	varbinary(max)
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
	
		declare @theId int
		declare @retval int
		declare @IsDbo	int
		declare @userName sysname
		if(@version is null or @diagramname is null)
		begin
			RAISERROR (N'E_INVALIDARG', 16, 1);
			return -1
		end
	
		execute as caller;
		select @theId = DATABASE_PRINCIPAL_ID(); 
		select @IsDbo = IS_MEMBER(N'db_owner');
		revert; 
		
		if @owner_id is null
		begin
			select @owner_id = @theId;
		end
		else
		begin
			if @theId <> @owner_id
			begin
				if @IsDbo = 0
				begin
					RAISERROR (N'E_INVALIDARG', 16, 1);
					return -1
				end
				select @theId = @owner_id
			end
		end
		-- next 2 line only for test, will be removed after define name unique
		if EXISTS(select diagram_id from dbo.sysdiagrams where principal_id = @theId and name = @diagramname)
		begin
			RAISERROR ('The name is already used.', 16, 1);
			return -2
		end
	
		insert into dbo.sysdiagrams(name, principal_id , version, definition)
				VALUES(@diagramname, @theId, @version, @definition) ;
		
		select @retval = @@IDENTITY 
		return @retval
	END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Dashboard_COA
CREATE PROCEDURE [dbo].[sp_Dashboard_COA]
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @Periode	DATETIME = CONVERT(DATETIME, FORMAT(GETDATE(), 'yyyy-01-01'))
	DECLARE @Site		VARCHAR(5) = '01'
	DECLARE @Coa1		VARCHAR(30) = '50.01%'
	DECLARE @Coa2		VARCHAR(30) = '81.%'
	DECLARE @Coa3		VARCHAR(30) = '82.%'

	;WITH a AS
	(
		SELECT 	a.periode,
				a.site_id,
				a.account_id,   
				a.account_desc,
				a.flag_dk,
				CASE LEFT(a.account_id, 1)
					WHEN '5' THEN 'PENJUALAN' 
					WHEN '8' THEN 'BIAYA'
				END group_coa,
				--isnull(b.debit,0) + isnull(c.debit,0) as awal_debit,
				--isnull(b.credit,0) + isnull(c.credit,0) as awal_credit,
				isnull(d.debit,0) as mutasi_debit,
				isnull(d.credit,0) as mutasi_credit
		FROM 	(
					SELECT 	a.site_id
						   ,a.account_id
						   ,a.account_desc
						   ,a.flag_dk
						   ,b.periode
					FROM 	gl_coa a WITH(NOLOCK)
							CROSS JOIN
							(
								SELECT 	DISTINCT CONVERT(DATETIME, FORMAT(a.voucher_periode, 'yyyy-MM-01')) periode
								FROM	gl_journal a
										JOIN gl_journal_detail b ON a.site_id = b.site_id AND a.voucher = b.voucher
								WHERE	a.voucher_periode >= @Periode
							) b
					WHERE	ISNULL(a.flag_active, 'N') = 'Y'
							AND (a.account_id like @Coa1 OR a.account_id like @Coa2 OR a.account_id like @Coa3)
							AND a.site_id = @Site
				) a
				--LEFT JOIN
				--(
				--	SELECT 	gl_balance.account_id,
				--			sum(debet) as debit,
				--			sum(kredit) as credit
				--	FROM 	gl_balance  
				--	WHERE 	year(periode) = YEAR(@Periode)
				--			AND site_id = @Site
				--	GROUP BY gl_balance.account_id   
				--) b ON a.account_id = b.account_id
				--LEFT JOIN
				--(
				--	SELECT 	b.account_id,
				--			a.voucher_periode periode,
				--			sum(debet) as debit,
				--			sum(kredit) as credit  
				--	FROM 	gl_journal a
				--			JOIN gl_journal_detail b ON a.site_id = b.site_id AND a.voucher = b.voucher
				--	WHERE 	a.site_id = @Site
				--			AND YEAR(voucher_periode) = YEAR(@Periode)
				--	GROUP BY b.account_id, a.voucher_periode
				--) c ON a.account_id = c.account_id AND c.periode < a.periode
				LEFT JOIN
				(
					SELECT 	gl_journal_detail.account_id,
							CONVERT(DATETIME, FORMAT(voucher_periode, 'yyyy-MM-01')) periode,
							sum(debet) as debit,   
							sum(kredit) as credit  
					FROM 	gl_journal,   
							gl_journal_detail  
					WHERE 	( gl_journal_detail.site_id = gl_journal.site_id ) and  
							( gl_journal_detail.voucher = gl_journal.voucher ) and  
							( gl_journal.voucher_periode >= @Periode ) and 
							( gl_journal.site_id = @Site ) and
							( gl_journal_detail.account_id like @Coa1 OR gl_journal_detail.account_id LIKE @Coa2 OR gl_journal_detail.account_id like @Coa3 )
					GROUP BY gl_journal_detail.account_id, CONVERT(DATETIME, FORMAT(voucher_periode, 'yyyy-MM-01'))
				) d ON a.account_id = d.account_id AND a.periode = d.periode
	)	
		SELECT	periode
				,account_id
				,account_desc
				,group_coa
				,(mutasi_debit - mutasi_credit) * CASE WHEN flag_dk = 'D' THEN 1 ELSE -1 END nilai
				,SUM(mutasi_debit - mutasi_credit * CASE WHEN flag_dk = 'D' THEN 1 ELSE -1 END) OVER(PARTITION BY group_coa) tot_nilai
		FROM	a
		where not (mutasi_debit - mutasi_credit) =0
--		WHERE	account_id IN ('50.01.01.000','82.23.02.002')
		ORDER BY account_id ASC, periode ASC

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Dashboard_Sales
CREATE PROCEDURE dbo.sp_Dashboard_Sales
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @Tanggal	DATETIME =  DATEADD(YEAR, -1, GETDATE())
	SET @Tanggal = CONVERT(DATETIME, FORMAT(@Tanggal, 'yyyy-01-01'))

	SELECT 	c.nama Toko
			,d.grup Dept
			,CONVERT(DATETIME, FORMAT(a.tgl, 'yyyy-MM-01')) Periode
			,DAY(a.tgl) Tanggal
			,SUM(ISNULL(b.qty, 0)) Qty
			,SUM(ISNULL(b.total, 0)) Nilai
	FROM	T_GUDANG1 a
			JOIN T_GUDANG2 b ON a.bukti = b.bukti
			JOIN M_TOKO c ON a.toko_id = c.toko_id
			LEFT JOIN View_produk d ON b.produk_id = d.produk_id
	WHERE	a.tgl >= @Tanggal
			AND status = 'OUT' 
			AND tipe_trans = 'KIRIM PENJUALAN'
	GROUP BY c.nama, d.grup, CONVERT(DATETIME, FORMAT(a.tgl, 'yyyy-MM-01')), DAY(a.tgl)
	ORDER BY Toko, Tanggal

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Dashboard_Sales_Online
CREATE PROCEDURE dbo.sp_Dashboard_Sales_Online
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @Tanggal	DATETIME =  DATEADD(YEAR, -1, GETDATE())
	SET @Tanggal = CONVERT(DATETIME, FORMAT(@Tanggal, 'yyyy-01-01'))

	SELECT 	c.nama Toko
			,d.grup Dept
			,CONVERT(DATETIME, FORMAT(a.tgl, 'yyyy-MM-01')) Periode
			,DAY(a.tgl) Tanggal
			,SUM(ISNULL(b.qty, 0)) Qty
			,SUM(ISNULL(b.total, 0)) Nilai
	FROM	T_SALES3 a
			JOIN T_SALES4 b ON a.bukti = b.bukti
			JOIN M_TOKO2 c ON a.toko_id = c.toko_id2
			LEFT JOIN View_produk d ON b.produk_id = d.produk_id
	WHERE	a.tgl >= @Tanggal
	GROUP BY c.nama, d.grup, CONVERT(DATETIME, FORMAT(a.tgl, 'yyyy-MM-01')), DAY(a.tgl)
	ORDER BY Toko, Tanggal

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Dashboard_Stok
CREATE PROCEDURE [dbo].[sp_Dashboard_Stok]
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @Tanggal	DATETIME = GETDATE()

	DECLARE @Tgl0 DATETIME = CONVERT(DATETIME, FORMAT(@Tanggal, 'yyyy-MM-01'))
	DECLARE @Tgl1 DATETIME = CONVERT(DATETIME, FORMAT(@Tanggal, 'yyyy-MM-01'))
	DECLARE @Tgl2 DATETIME = dbo.uf_eom(@Tgl1)

	;WITH a AS
	(
		SELECT 	M_PRODUK.produk_id as 'produk_id',(select brand_id +' - ' + nama from m_produk_brand where m_produk_brand.brand_id=M_PRODUK.brand_id)as brand,
				(select m_produk_dept.nama from m_produk_dept where m_produk_dept.grup_dept=M_PRODUK.grup_dept)as dept,
				M_PRODUK.nama as 'nama',(select m_supplier.nama from m_supplier,m_produk_model where m_supplier.supp_id=m_produk_model.supp_id and m_produk_model.model_id=m_produk.model_id)as supplier,
				(select max(tgl) from T_GUDANG1,T_GUDANG2 where T_GUDANG1.bukti=T_GUDANG2.bukti and T_GUDANG2.produk_id=M_PRODUK.produk_id and tipe_trans='terima' and status='IN')as tgl,
				(select datediff(day,max(tgl),getdate()) from T_GUDANG1,T_GUDANG2 where T_GUDANG1.bukti=T_GUDANG2.bukti and T_GUDANG2.produk_id=M_PRODUK.produk_id and tipe_trans='terima' and status='IN')as umur,
				case when (select max(T_BELI1.tipe_produk) from t_beli1 left join t_beli2 on t_beli1.bukti=t_beli2.bukti where t_beli2.produk_id=M_PRODUK.produk_id) ='R' then 'Retail' else 'Grosir' end as 'tipe_produk',
				isnull(AWAL.qty,0) + isnull(AWAL_GUDANG.qty_masuk,0) - isnull(AWAL_GUDANG.qty_keluar,0) as 'awal',
				isnull(GUDANG.qty_beli,0) as 'qty_beli',
				isnull(GUDANG.qty_retur,0) as 'qty_retur',
				isnull(GUDANG.qty_TOKO_KRM,0) as 'qty_TOKO_KRM',
				isnull(GUDANG.qty_retur_TOKO_KRM,0) as 'qty_retur_TOKO_KRM',
				isnull(GUDANG.qty_jual,0) as 'qty_jual',
				isnull(GUDANG.qty_retur_jual,0) as 'qty_retur_jual',
				isnull(GUDANG.qty_krp,0) as 'qty_krp',
				isnull(GUDANG.qty_krm,0) as 'qty_krm',
				(	select max(isnull(bukti_ref,'')) 
					from t_gudang1 
							left join t_gudang2 on t_gudang1.bukti=t_gudang2.bukti
					where t_gudang2.produk_id=M_PRODUK.produk_id and left(isnull(bukti_ref,''),2)='PO')as no_spk
		FROM 	M_PRODUK
				LEFT OUTER JOIN
				(
					SELECT	produk_id, qty
					FROM		S_AWAL_GUDANG
					WHERE	periode = @Tgl0
				) AWAL ON M_PRODUK.produk_id = AWAL.produk_id
		
				LEFT OUTER JOIN
				(
					SELECT		T_GUDANG2.produk_id as 'produk_id',
									SUM(CASE T_GUDANG1.status WHEN 'IN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_masuk',
									SUM(CASE T_GUDANG1.status WHEN 'OUT' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_keluar'
					FROM			T_GUDANG1 INNER JOIN T_GUDANG2 ON T_GUDANG1.bukti = T_GUDANG2.bukti
					WHERE		( T_GUDANG1.tgl >= @Tgl0 and T_GUDANG1.tgl < @Tgl1 )
					GROUP BY 	T_GUDANG2.produk_id
				) AWAL_GUDANG ON M_PRODUK.produk_id = AWAL_GUDANG.produk_id
		
				LEFT OUTER JOIN
				(
					SELECT		T_GUDANG2.produk_id as 'produk_id',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'TERIMA' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_beli',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'RETUR' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_retur',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'KIRIM TOKO' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_TOKO_KRM',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'RETUR TOKO' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_retur_TOKO_KRM',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'KIRIM PENJUALAN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_jual',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'RETUR PENJUALAN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_retur_jual',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'KOREKSI PLUS' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_krp',
									SUM(CASE T_GUDANG1.tipe_trans WHEN 'KOREKSI MIN' THEN T_GUDANG2.qty ELSE 0 END ) as 'qty_krm'
					FROM			T_GUDANG1 INNER JOIN T_GUDANG2 ON T_GUDANG1.bukti = T_GUDANG2.bukti
					WHERE		( T_GUDANG1.tgl between @Tgl1 and @Tgl2 )
					GROUP BY 	T_GUDANG2.produk_id
				) GUDANG ON M_PRODUK.produk_id = GUDANG.produk_id
		WHERE	NOT
					(
						isnull(AWAL.qty,0) + isnull(AWAL_GUDANG.qty_masuk,0) - isnull(AWAL_GUDANG.qty_keluar,0) = 0 AND
						isnull(GUDANG.qty_beli,0) = 0 AND
						isnull(GUDANG.qty_retur,0) = 0 AND
						isnull(GUDANG.qty_TOKO_KRM,0) = 0 AND
						isnull(GUDANG.qty_retur_TOKO_KRM,0) = 0 AND
						isnull(GUDANG.qty_jual,0) = 0 AND
						isnull(GUDANG.qty_retur_jual,0) = 0 AND
						isnull(GUDANG.qty_krp,0) = 0 AND
						isnull(GUDANG.qty_krm,0) = 0
					)
	)	SELECT 	brand,@Tgl1,@Tgl2
				,dept
				--,SUM(awal + qty_beli + qty_retur_jual + qty_krp+ qty_retur_toko_krm - (qty_jual + qty_retur + qty_krm+ qty_toko_krm)) stok
				,sum( (awal )+ (qty_beli + qty_retur_jual + qty_krp+ qty_retur_toko_krm ) - ( qty_jual + qty_retur + qty_krm+ qty_toko_krm ))stok
		FROM 	a
		--where brand='A - EQUALTREV'
		GROUP BY brand, dept, CONVERT(DATETIME, FORMAT(a.tgl, 'yyyy-MM-01')), DAY(a.tgl)
		--HAVING	SUM(awal + qty_beli + qty_retur_jual + qty_krp+ qty_retur_toko_krm - (qty_jual + qty_retur + qty_krm+ qty_toko_krm)) <> 0
		HAVING SUM(awal + qty_beli + qty_retur_jual + qty_krp+ qty_retur_toko_krm - (qty_jual + qty_retur + qty_krm+ qty_toko_krm)) <> 0
		
		ORDER BY brand, dept

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Desty_Generate_Sales
CREATE PROCEDURE dbo.sp_Desty_Generate_Sales
AS
BEGIN
	SET TEXTSIZE -1;
	SET NOCOUNT ON;
	DECLARE @Token			NVARCHAR(MAX)
	DECLARE @hr				INT
	DECLARE @Object			AS INT
	DECLARE @json 			TABLE(Json_Table NVARCHAR(MAX))
	DECLARE @Success 		BIT;
	DECLARE @Code 			VARCHAR(50);
	DECLARE @Msg			NVARCHAR(MAX)
	DECLARE @JsonBody		NVARCHAR(MAX)
	DECLARE @APIUrl			NVARCHAR(300)
	DECLARE @ResponseText 	AS NVARCHAR(MAX)
	DECLARE @OrderID		BIGINT
	DECLARE @OrderSn		VARCHAR(50)
	DECLARE @StatusOrder	VARCHAR(50)
	DECLARE @TglOrder		DATETIME
	DECLARE @Ada			INT
	DECLARE @Prefix 		VARCHAR(25)
	DECLARE @Max 			VARCHAR(25)
	DECLARE @Bukti 			VARCHAR(25)
	DECLARE @Store			VARCHAR(50)
	DECLARE @HasError		INT = 0
	DECLARE @LastErrorMessage NVARCHAR(MAX)
/*
	MAPPING ONLINE M_TOKO
	0124559	BLIBLI		blibli
	0121215	LAZADA		lazada
	0121212	SHOPEE		shopee
	0122015	TIKTOK		tiktok
	0121213	TOKOPEDIA	tokopedia
	0121214	ZALORA		zalora
*/

	-- Create the OLE object
	EXEC @hr = sp_OACreate 'MSXML2.ServerXMLHTTP.6.0', @Object OUT;
    
    DECLARE cur CURSOR FAST_FORWARD READ_ONLY LOCAL FOR
    	SELECT 	orderId, orderSn, orderStatusList, orderCreateTime, storeName
    	FROM	Desty_ListOrder
		WHERE	ISNULL(FlagProses, 0) = 0
--		WHERE 	orderId = 2051919422491299842
		ORDER BY orderCreateTime
    
    OPEN cur
    
    FETCH NEXT FROM cur INTO @OrderID, @OrderSn, @StatusOrder, @TglOrder, @Store
    
    WHILE @@FETCH_STATUS = 0 BEGIN
    
    	SELECT @Ada = COUNT(*) FROM T_SALES3 WHERE bukti_reff = @OrderSn
		IF @Ada > 0 
		BEGIN
			UPDATE Desty_ListOrder SET FlagProses = 1, ProsesDate = GETDATE()
			WHERE orderId = @OrderID
		END
		ELSE IF @StatusOrder LIKE '%cancel%'
		BEGIN
			UPDATE Desty_ListOrder SET FlagProses = 1, ProsesDate = GETDATE()
			WHERE orderId = @OrderID
		END
		ELSE 
		BEGIN
			EXEC sp_Desty_RegenToken @Token OUTPUT
			SET @Token = 'Bearer ' + @Token

--			-- Open the connection
			SET @APIUrl = 'https://api.desty.app/api/order/detail?orderId=' + CAST(@OrderID AS VARCHAR);
			EXEC @hr = sp_OAMethod @Object, 'open', NULL, 'GET', @APIUrl, 'false';
			
			-- Param Headers
			EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Authorization', @Token;
			EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Content-Type', 'application/json';
			
			-- Send the request
			EXEC @hr = sp_OAMethod @Object, 'send', NULL, NULL;
			
			DELETE FROM @json

			-- Get the response text
			INSERT INTO @json (Json_Table)
			EXEC @hr = sp_OAMethod @Object, 'responseText';
			SELECT TOP 1 @ResponseText = Json_Table FROM @json;
			SELECT 	@Success = JSON_VALUE(@ResponseText, '$.success'),
	            	@Code = JSON_VALUE(@ResponseText, '$.code'),
	           	 	@Msg = JSON_VALUE(@ResponseText, '$.msg');

--			SELECT @ResponseText
				
			IF @Success = 1 AND ISJSON(JSON_QUERY(@ResponseText, '$.data')) = 1
	        BEGIN
				IF OBJECT_ID('tempdb.dbo.#Order1') IS NOT NULL DROP TABLE #Order1;
				SELECT 	*
						,CASE a.platformName
							WHEN 'shopee' THEN 'T01302'
							WHEN 'tokopedia' THEN 'T01303'
							WHEN 'zalora' THEN 'T01304'
							WHEN 'lazada' THEN 'T01305'
							WHEN 'tiktok' THEN 'T01307'
							WHEN 'blibli' THEN 'T01308'
						 END AS toko_id
				INTO	#Order1
				FROM 	OPENJSON(@ResponseText, '$.data')
				WITH 	(
							platformName NVARCHAR(30) '$.platformName',
							cust_name NVARCHAR(50) '$.customerInfo.name',
							cust_phone NVARCHAR(30) '$.customerInfo.phone',
							cust_email NVARCHAR(50) '$.customerInfo.email',
							shippingFullName NVARCHAR(50) '$.itemList[0].shippingDetail.shippingFullName',
							shippingAddress NVARCHAR(300) '$.itemList[0].shippingDetail.shippingAddress',
							shippingArea NVARCHAR(50) '$.itemList[0].shippingDetail.shippingArea',
							shippingCity NVARCHAR(50) '$.itemList[0].shippingDetail.shippingCity',
							shippingProvince NVARCHAR(50) '$.itemList[0].shippingDetail.shippingProvince',
							shippingPostCode NVARCHAR(50) '$.itemList[0].shippingDetail.shippingPostCode',
							shippingPhone NVARCHAR(50) '$.itemList[0].shippingDetail.shippingPhone',
							trackingNumber NVARCHAR(50) '$.itemList[0].shippingDetail.trackingNumber',
							courier NVARCHAR(50) '$.itemList[0].shippingDetail.courier',
							shipper NVARCHAR(50) '$.itemList[0].shippingDetail.shipper',
							includeTax BIT '$.includeTax',
							subTotal NUMERIC '$.subTotal',
							discount NUMERIC '$.discount',
							tax NUMERIC '$.tax',
							totalPrice NUMERIC '$.totalPrice',
							totalSales NUMERIC '$.totalSales',
							insuranceCost NUMERIC '$.insuranceCost',
							paymentMethod NVARCHAR(30) '$.paymentMethod',
							refundAmount NUMERIC '$.refundAmount',
							totalInvoice NUMERIC '$.totalInvoice',
							finalShippingFee NUMERIC '$.finalShippingFee',
							serviceFee NUMERIC '$.serviceFee',
							escrowAmount NUMERIC '$.escrowAmount',
							sellerDiscount NUMERIC '$.sellerDiscount',
							otherCost NUMERIC '$.otherCost'
						) AS a;

				IF OBJECT_ID('tempdb.dbo.#Order2') IS NOT NULL DROP TABLE #Order2;
				SELECT	ISNULL(a.itemCode, a.itemExternalCode) AS itemCode
						,a.itemName, a.harga
						,ISNULL(a.quantity, 0) quantity
						,ISNULL(a.sellPrice, 0) sellPrice
--						,ISNULL(a.harga, 0) - ISNULL(a.sellPrice, 0) disc_rp
--						,ROUND(((ISNULL(a.harga, 0) - ISNULL(a.sellPrice, 0)) / NULLIF(a.harga, 0)) * 100, 2) disc
--						,ROW_NUMBER() OVER(ORDER BY a.itemOrderId) urut
				INTO	#Order2
				FROM 	OPENJSON(@ResponseText, '$.data.itemList')
				WITH 	(
							itemOrderId NVARCHAR(50) '$.itemOrderId',
							itemCode NVARCHAR(50) '$.itemCode',
							itemExternalCode NVARCHAR(50) '$.itemExternalCode',
							itemName NVARCHAR(100) '$.itemName',
							harga DECIMAL(15,2) '$.price',
							quantity INT '$.quantity',
							sellPrice DECIMAL(15,2) '$.sellPrice'
						) AS a;

--				SELECT *, @OrderID FROM #Order1;
--				SELECT *, @OrderID FROM #Order2;
--
--				WITH a AS(
--					SELECT	itemCode produk_id
--							,ROW_NUMBER() OVER(ORDER BY itemCode) urut
--							,harga
--							,SUM(quantity) qty
--							,SUM(quantity * harga) Total
--							,SUM(harga - sellPrice) Value_Disc
--					FROM	#Order2
--					GROUP BY itemCode, harga
--				)
--					SELECT	*
--							,ROUND((Value_Disc / NULLIF(Total, 0)) * 100, 2) AS Disc
--							,0 AS Promo
--							,Total - Value_Disc AS Nett
--					FROM	a
--
--				RETURN
				
				BEGIN TRY
			        BEGIN TRANSACTION;

					SET @Prefix = 'SLM21' + FORMAT(GETDATE(), 'yyMM');
					SELECT 	@Max = ISNULL(MAX(CAST(RIGHT(bukti, 6) AS INT)), 0)
					FROM 	T_SALES3 WITH(UPDLOCK, HOLDLOCK)
					WHERE 	LEFT(bukti, LEN(@Prefix)) = @Prefix;
					IF @Max IS NULL
						SET @Bukti = @Prefix + '000001'
					ELSE
						SET @Bukti = @Prefix + FORMAT(CONVERT(INT, @Max) + 1, '000000')
	
					INSERT INTO Desty_Order1 (orderId, orderSn, tgl, platformName, cust_name, cust_phone, cust_email, shippingAddress, shippingArea, shippingCity, shippingProvince, shippingPostCode, shippingPhone, trackingNumber, courier, shipper, 
											includeTax, subTotal, discount, tax, totalPrice, totalSales, insuranceCost, paymentMethod, refundAmount, totalInvoice, finalShippingFee, serviceFee, escrowAmount, sellerDiscount, otherCost, LinkBukti)
					SELECT	@OrderID orderId, @OrderSn orderSn, @TglOrder tgl, platformName, ISNULL(cust_name, shippingFullName), cust_phone, cust_email, shippingAddress, shippingArea, shippingCity, shippingProvince, shippingPostCode, shippingPhone, trackingNumber, courier, shipper, 
							includeTax, subTotal, discount, tax, totalPrice, totalSales, insuranceCost, paymentMethod, refundAmount, totalInvoice, finalShippingFee, serviceFee, escrowAmount, sellerDiscount, otherCost, @Bukti
					FROM	#Order1
					WHERE	NOT EXISTS(SELECT 1 FROM Desty_Order1 WHERE orderId = @OrderID)
	
					INSERT INTO Desty_Order2 (orderId, itemCode, itemName, harga, quantity, sellPrice, LinkBukti)
					SELECT	@OrderID, itemCode, itemName, harga, quantity, sellPrice, @Bukti
					FROM	#Order2 a
					WHERE	NOT EXISTS(SELECT 1 FROM Desty_Order2 b WHERE b.orderId = @OrderID AND b.itemCode = a.itemCode)
	
					INSERT INTO T_SALES3 (site_id, bukti, toko_id, tgl, bukti_reff, No_Resi, Ekspedisi, flag_sj, subtotal, total, user_entry, tgl_entry, flag_batal)
					SELECT 	'21' site_id, @Bukti bukti, toko_id, CONVERT(DATE, @TglOrder) tgl, @OrderSn bukti_reff, trackingNumber No_Resi, courier Ekspedisi, 0, subTotal, totalInvoice, 'SYSTEM', GETDATE(), 0
					FROM 	#Order1;
					IF @@ROWCOUNT = 0 THROW 50001, 'Data #Order1 kosong, skip ke CATCH', 1;
	
					WITH a AS(
						SELECT	itemCode produk_id
								,ROW_NUMBER() OVER(ORDER BY itemCode) urut
								,harga
								,SUM(quantity) qty
								,SUM(quantity * harga) Total
								,SUM(harga - sellPrice) Value_Disc
						FROM	#Order2
						GROUP BY itemCode, harga
					)
						INSERT INTO T_SALES4 (site_id, bukti, produk_id, urut, harga, qty, Total, Disc, Value_Disc, Promo, Nett)
						SELECT	'21', @Bukti AS bukti, produk_id, urut, harga, qty, Total
								,ROUND((Value_Disc / NULLIF(Total, 0)) * 100, 2) AS Disc, Value_Disc, 0 AS Promo, Total - Value_Disc AS Nett
						FROM	a;
					IF @@ROWCOUNT = 0 THROW 50002, 'Data #Order2 kosong, skip ke CATCH', 1;

					UPDATE Desty_ListOrder SET FlagProses = 1, ProsesDate = GETDATE()
					WHERE orderId = @OrderID;
			
			        COMMIT TRANSACTION;
			    END TRY
			    BEGIN CATCH
			        -- Cek jika ada transaksi yang menggantung, lalu batalkan
			        IF @@trancount > 0 ROLLBACK TRANSACTION;
			        
					INSERT INTO Desty_LogError (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage)
				    VALUES (ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), @OrderSn + ': ' + ERROR_MESSAGE());

					SET @HasError = 1; -- Tandai kalau ada yang gagal
        			SET @LastErrorMessage = ERROR_MESSAGE();
			    END CATCH

				DROP TABLE #Order1;
				DROP TABLE #Order2;
				
	        END
			ELSE
			BEGIN
				INSERT INTO Desty_LogError (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage)
			    VALUES (0, 0, 0, 'DestyAPI', 0, @Code + ': ' + ISNULL(@Msg, 'API Request Failed'));
			END

		END

    	FETCH NEXT FROM cur INTO @OrderID, @OrderSn, @StatusOrder, @TglOrder, @Store
    
    END
    
    CLOSE cur
    DEALLOCATE cur

	-- Destroy the OLE object
	EXEC @hr = sp_OADestroy @Object;

	IF @HasError = 1 RAISERROR('Job Selesai tapi ada eyyoyyy. Silakan cek tabel ErrorLog. Pesan terakhir: %s', 16, 1, @LastErrorMessage);

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Desty_Generate_Sales_Update
CREATE PROCEDURE dbo.sp_Desty_Generate_Sales_Update
AS
BEGIN
	SET TEXTSIZE -1;
	SET NOCOUNT ON;
	DECLARE @Tgl			DATETIME
	DECLARE @Token			NVARCHAR(MAX)
	DECLARE @hr				INT
	DECLARE @Object			AS INT
	DECLARE @json 			TABLE(Json_Table NVARCHAR(MAX))
	DECLARE @Success 		BIT;
	DECLARE @Code 			VARCHAR(50);
	DECLARE @Msg			NVARCHAR(MAX)
	DECLARE @JsonBody		NVARCHAR(MAX)
	DECLARE @APIUrl			NVARCHAR(300)
	DECLARE @ResponseText 	AS NVARCHAR(MAX)
	DECLARE @OrderID		BIGINT
	DECLARE @OrderSn		VARCHAR(50)
	DECLARE @Ada			INT = 0
	DECLARE @HasError		INT = 0
	DECLARE @LastErrorMessage NVARCHAR(MAX)

	DECLARE @temp TABLE
    (
		orderId BIGINT PRIMARY KEY,
		orderSn NVARCHAR(100) INDEX IX_OrderSn,
		trackingNumber NVARCHAR(50),
    	courier NVARCHAR(50),
    	shipper VARCHAR(50)
    )
    
	SELECT @Tgl = DATEADD(DAY, -3, MAX(CONVERT(DATE, orderUpdateTime))) FROM Desty_ListOrder WHERE FlagProses = 1
--	SELECT @Tgl

	EXEC sp_Desty_RegenToken @Token OUTPUT
	SET @Token = 'Bearer ' + @Token

	-- Create the OLE object
	EXEC @hr = sp_OACreate 'MSXML2.ServerXMLHTTP.6.0', @Object OUT;
    
    DECLARE cur CURSOR FAST_FORWARD READ_ONLY LOCAL FOR
    	SELECT 	orderId, orderSn
    	FROM	Desty_ListOrder
		WHERE	ISNULL(FlagProses, 0) = 1
				AND orderUpdateTime >= @Tgl
		ORDER BY orderCreateTime
    
    OPEN cur
    
    FETCH NEXT FROM cur INTO @OrderID, @OrderSn
    
    WHILE @@FETCH_STATUS = 0 BEGIN
		-- Open the connection
		SET @APIUrl = 'https://api.desty.app/api/order/detail?orderId=' + CAST(@OrderID AS VARCHAR);
		EXEC @hr = sp_OAMethod @Object, 'open', NULL, 'GET', @APIUrl, 'false';
		
		-- Param Headers
		EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Authorization', @Token;
		EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Content-Type', 'application/json';
		
		-- Send the request
		EXEC @hr = sp_OAMethod @Object, 'send', NULL, NULL;
		
		DELETE FROM @json

		-- Get the response text
		INSERT INTO @json (Json_Table)
		EXEC @hr = sp_OAMethod @Object, 'responseText';
		SELECT TOP 1 @ResponseText = Json_Table FROM @json;
		SELECT 	@Success = JSON_VALUE(@ResponseText, '$.success'),
            	@Code = JSON_VALUE(@ResponseText, '$.code'),
           	 	@Msg = JSON_VALUE(@ResponseText, '$.msg');

--		SELECT @ResponseText
				
		IF @Success = 1 AND ISJSON(JSON_QUERY(@ResponseText, '$.data')) = 1
        BEGIN
			INSERT INTO @temp (orderId, orderSn, trackingNumber, courier, shipper)
			SELECT 	@OrderID, @OrderSn, a.trackingNumber, a.courier, a.shipper
			FROM 	OPENJSON(@ResponseText, '$.data')
			WITH 	(
						trackingNumber NVARCHAR(50) '$.itemList[0].shippingDetail.trackingNumber',
						courier NVARCHAR(50) '$.itemList[0].shippingDetail.courier',
						shipper NVARCHAR(50) '$.itemList[0].shippingDetail.courier'
					) AS a;
        END
		ELSE
		BEGIN
			INSERT INTO Desty_LogError (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage)
		    VALUES (0, 0, 0, 'DestyAPI', 0, @Code + ': ' + ISNULL(@Msg, 'API Request Failed'));
		END
	
	    FETCH NEXT FROM cur INTO @OrderID, @OrderSn
    
    END
    
    CLOSE cur
    DEALLOCATE cur

	-- Destroy the OLE object
	EXEC @hr = sp_OADestroy @Object;

	IF @HasError = 1 RAISERROR('Job Selesai tapi ada eyyoyyy. Silakan cek tabel ErrorLog. Pesan terakhir: %s', 16, 1, @LastErrorMessage);

--	SELECT 	a.*
--			,b.trackingNumber, b.courier, b.shipper
	UPDATE	b SET trackingNumber = a.trackingNumber, courier = a.courier, shipper = a.shipper
	FROM 	@temp a
			JOIN Desty_Order1 b ON a.orderId = b.orderId
	WHERE 	EXISTS (
			    SELECT a.trackingNumber, a.courier, a.shipper 
			    EXCEPT 
			    SELECT b.trackingNumber, b.courier, b.shipper
			);

--	SELECT 	a.*
--			,b.No_Resi, b.Ekspedisi
--			,CASE WHEN a.trackingNumber <> b.No_Resi THEN 1 ELSE 0 END AS BedaResi
--			,CASE WHEN a.courier <> b.Ekspedisi THEN 1 ELSE 0 END AS BedaKurir
	UPDATE	b SET No_Resi = a.trackingNumber, Ekspedisi = a.courier
	FROM 	@temp a
			JOIN T_SALES3 b ON a.orderSn = b.bukti_reff
	WHERE 	EXISTS (
			    SELECT a.trackingNumber, a.courier
			    EXCEPT 
			    SELECT b.No_Resi, b.Ekspedisi
			);

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Desty_GetOrder
/*
sp_configure 'show advanced options', 1;
RECONFIGURE;
GO

sp_configure 'Ole Automation Procedures', 1;
RECONFIGURE;
GO
*/

CREATE PROCEDURE dbo.sp_Desty_GetOrder
AS
BEGIN
	SET TEXTSIZE -1;
	SET NOCOUNT ON;
	DECLARE @Token				NVARCHAR(MAX)
	DECLARE @hr					INT
	DECLARE @Object				AS INT
	DECLARE @json 				TABLE(Json_Table NVARCHAR(MAX))
	DECLARE @jsonDtl			TABLE(Json_Table NVARCHAR(MAX))
	DECLARE @Page				INT = 1
	DECLARE @TotPage			INT
	DECLARE @Success 			BIT;
	DECLARE @Code 				VARCHAR(50);
	DECLARE @Msg				NVARCHAR(MAX)
	DECLARE @JsonBody			NVARCHAR(MAX)
	DECLARE @APIUrl				NVARCHAR(300)
	DECLARE @ResponseText 		AS NVARCHAR(MAX)
	DECLARE @Platform			VARCHAR(50) --= '"platform": "shopee"'	-- Marketplace name: lazada, tokopedia, shopee, tiktok, blibli, zalora, destyStore, destyPos
	DECLARE @StatusOrder		VARCHAR(50) --= '"status": "Ready_To_Ship"'	-- Order status: Unpaid, New_Orders, Ready_To_Ship, Shipping, Completed, Cancellations, Returns

	DECLARE @TglStart 	DATETIME
	DECLARE @TglUnix	BIGINT

	SELECT @TglStart = MAX(orderCreateTime) FROM Desty_ListOrder
	IF @TglStart IS NULL SET @TglStart = '2026-4-1' ELSE SET @TglStart = DATEADD(DAY, -7, CONVERT(DATE, @TglStart))

	SET @TglStart = CAST(@TglStart AT TIME ZONE 'SE Asia Standard Time' AT TIME ZONE 'UTC' AS DATETIME2)

	SET @TglUnix = DATEDIFF_BIG(MILLISECOND, '1970-01-01', @TglStart)
--	SELECT @TglStart, @TglUnix
--	RETURN

	EXEC sp_Desty_RegenToken @Token OUTPUT
	SET @Token = 'Bearer ' + @Token
--	SELECT @Token

	IF OBJECT_ID('tempdb.dbo.#ListOrder') IS NOT NULL DROP TABLE #ListOrder
	CREATE TABLE #ListOrder (
	    orderId 				bigint,
	    orderSn 				nvarchar(100),
	    orderCreateTime 		datetime,
	    orderUpdateTime 		datetime,
	    createTime 				datetime,
	    orderStatusList 		nvarchar(max),
	    platformOrderStatusList nvarchar(max),
	    platformName 			nvarchar(50),
	    storeId 				nvarchar(50),
	    storeName 				nvarchar(50),
	    trackingNumberList 		nvarchar(max),
	    ParamStart 				bigint,
	    ParamPage 				int,
	    ParamTotPage 			INT
	)


	-- Create the OLE object
	EXEC @hr = sp_OACreate 'MSXML2.ServerXMLHTTP.6.0', @Object OUT;

	WHILE @Page <= ISNULL(@TotPage, 1)
	BEGIN
		-- clear data json
		DELETE FROM @json;

		SET @JsonBody = '{' + CONCAT_WS(',', @Platform, '"startDate":' + CAST(@TglUnix AS VARCHAR), @StatusOrder, '"pageNumber":' + CAST(@Page AS VARCHAR)) + '}'
--		SELECT @JsonBody

		-- Open the connection
		SET @APIUrl = 'https://api.desty.app/api/order/page';
		EXEC @hr = sp_OAMethod @Object, 'open', NULL, 'POST', @APIUrl, 'false';
		
		-- Param Headers
		EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Authorization', @Token;
		EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Content-Type', 'application/json';
		
		-- Send the request
		EXEC @hr = sp_OAMethod @Object, 'send', NULL, @JsonBody;
		
--		-- Get the response text
		INSERT INTO @json (Json_Table)
		EXEC @hr = sp_OAMethod @Object, 'responseText';
		SELECT TOP 1 @ResponseText = Json_Table FROM @json;

--		EXEC @hr = sp_OADestroy @Object;
--		SELECT @ResponseText
--		RETURN

		IF ISJSON(@ResponseText) = 1
    	BEGIN
			SELECT 	@Success = JSON_VALUE(@ResponseText, '$.success'),
	            	@Code = JSON_VALUE(@ResponseText, '$.code'),
	           	 	@Msg = JSON_VALUE(@ResponseText, '$.msg');
--			SELECT @Success, @Code, @Msg, @ResponseText
	
	        IF @Success = 0 OR @Code <> '0'
	        BEGIN
	            PRINT @Code + ', ERROR di Halaman ' + CAST(@Page AS VARCHAR(10)) + ': ' + ISNULL(@Msg, 'API Request Failed');
	            -- Opsional: Gunakan BREAK untuk menghentikan seluruh proses, atau CONTINUE untuk lanjut ke halaman berikutnya
	            BREAK; 
	        END
	        
	        -- Cek apakah ada data di halaman ini sebelum parsing
	        IF JSON_VALUE(@ResponseText, '$.data.totalCount') = 0 AND @Page = 1
	        BEGIN
	            PRINT 'Tidak ada data sama sekali. Proses berhenti.';
	            BREAK; -- Hentikan total jika totalCount 0 di halaman 1
	        END

            
			INSERT INTO #ListOrder (orderId, orderSn, orderCreateTime, orderUpdateTime, createTime, orderStatusList, platformOrderStatusList, platformName, storeId, storeName, trackingNumberList, ParamStart, ParamPage, ParamTotPage)
			SELECT 	orderId, orderSn
					,DATEADD(HOUR, 7, DATEADD(SECOND, orderCreateTime / 1000, '1970-01-01')) orderCreateTime
					,DATEADD(HOUR, 7, DATEADD(SECOND, orderUpdateTime / 1000, '1970-01-01')) orderUpdateTime
					,DATEADD(HOUR, 7, DATEADD(SECOND, createTime / 1000, '1970-01-01')) createTime
					,(SELECT STRING_AGG(value, ', ') FROM OPENJSON(orderStatusList)) AS orderStatusList
					,(SELECT STRING_AGG(value, ', ') FROM OPENJSON(platformOrderStatusList)) AS platformOrderStatusList
					,a.platformName, a.storeId, a.storeName
					,(SELECT STRING_AGG(value, ', ') FROM OPENJSON(trackingNumberList)) AS trackingNumberList
					,@TglUnix ParamStart, @Page ParamPage, @TotPage ParamTotPage
			FROM 	OPENJSON(@ResponseText, '$.data.results')
			WITH 	(
						orderId BIGINT '$.orderId',
						orderSn NVARCHAR(100) '$.orderSn',
						orderCreateTime BIGINT '$.orderCreateTime',
						orderUpdateTime BIGINT '$.orderUpdateTime',
						createTime BIGINT '$.createTime',
						orderStatusList NVARCHAR(MAX) '$.orderStatusList' AS JSON,
						platformOrderStatusList NVARCHAR(MAX) '$.platformOrderStatusList' AS JSON,
						platformName NVARCHAR(50) '$.platformName',
						storeId NVARCHAR(50) '$.storeId',
						storeName NVARCHAR(50) '$.storeName',
						trackingNumberList NVARCHAR(MAX) '$.trackingNumberList' AS JSON
					) AS a


			IF @Page = 1 SELECT @TotPage = totalPages FROM OPENJSON(@ResponseText, '$.data') WITH (totalPages INT '$.totalPages');
	        SET @Page = @Page + 1;
		END
		ELSE BREAK
	END

	UPDATE #ListOrder SET ParamTotPage = @TotPage
	WHERE ParamStart = @TglUnix AND ParamTotPage IS NULL;

	DELETE FROM Desty_ListOrder
	WHERE	ISNULL(FlagProses, 0) = 0
			AND EXISTS (
			    SELECT 1
			    FROM #ListOrder
			    WHERE orderId = Desty_ListOrder.orderId
			);

	INSERT INTO Desty_ListOrder (orderId, orderSn, orderCreateTime, orderUpdateTime, createTime, orderStatusList, platformOrderStatusList, platformName, 
								storeId, storeName, trackingNumberList, ParamStart, ParamPage, ParamTotPage, FlagProses)
	SELECT 	orderId, orderSn, orderCreateTime, orderUpdateTime, createTime, orderStatusList, platformOrderStatusList, platformName, 
			storeId, storeName, trackingNumberList, ParamStart, ParamPage, ParamTotPage, 0 FlagProses
	FROM 	#ListOrder
	WHERE	trackingNumberList IS NOT NULL
			AND NOT EXISTS (
			    SELECT 	1
			    FROM 	Desty_ListOrder
			    WHERE	FlagProses = 1 AND orderId = #ListOrder.orderId
			)
	ORDER BY orderCreateTime;

--	SELECT * FROM #ListOrder
	DROP TABLE #ListOrder

	-- Destroy the OLE object
	EXEC @hr = sp_OADestroy @Object;
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Desty_RegenToken
CREATE PROCEDURE dbo.sp_Desty_RegenToken
	@Token NVARCHAR(MAX) OUTPUT
AS 
BEGIN
	SET TEXTSIZE -1;
	SET NOCOUNT ON;
	DECLARE @hr				INT
	DECLARE @Object			AS INT
	DECLARE @json 			TABLE(Json_Table NVARCHAR(MAX))
	DECLARE @JsonBody		NVARCHAR(MAX)
	DECLARE @APIUrl			NVARCHAR(300)
	DECLARE @ResponseText	AS NVARCHAR(MAX)
	DECLARE	@TokenExp		DATETIME
	
	SELECT @Token = DestyToken, @TokenExp = DestyTokenExp FROM SYS_SETUP;
	IF @TokenExp >= DATEADD(MINUTE, -5, GETDATE()) RETURN

	SET @JsonBody = '{"applyId": "bcc5bbb4-344b-46a4-acb9-f522cfd5e6e1","username": "+6282177717800","mobile": "+6282177717800"}';
	
	-- Create the OLE object
	EXEC @hr = sp_OACreate 'MSXML2.ServerXMLHTTP.6.0', @Object OUT;

	-- Open the connection
	SET @APIUrl = 'https://api.desty.app/api/auth/token';
	EXEC @hr = sp_OAMethod @Object, 'open', NULL, 'POST', @APIUrl, 'false';
	
	-- Param Headers
	EXEC @hr = sp_OAMethod @Object, 'setRequestHeader', NULL, 'Content-Type', 'application/json';
	
	-- Send the request
	EXEC @hr = sp_OAMethod @Object, 'send', NULL, @JsonBody;
	
	-- Get the response text
	INSERT INTO @json (Json_Table)
	EXEC @hr = sp_OAMethod @Object, 'responseText';
	SELECT TOP 1 @ResponseText = Json_Table FROM @json;

	SELECT	@Token = accessToken, @TokenExp = DATEADD(HOUR, 7, DATEADD(SECOND, expireTime / 1000, '1970-01-01'))
	FROM OPENJSON(@ResponseText, '$.data')
	WITH (
		accessToken NVARCHAR(MAX) '$.accessToken',
    	expireTime	BIGINT  '$.expireTime'
	);

	UPDATE SYS_SETUP SET DestyToken = @Token, DestyTokenExp = @TokenExp;
	
	EXEC @hr = sp_OADestroy @Object;
	SELECT @ResponseText

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_dropdiagram
CREATE PROCEDURE dbo.sp_dropdiagram
	(
		@diagramname 	sysname,
		@owner_id	int	= null
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
		declare @theId 			int
		declare @IsDbo 			int
		
		declare @UIDFound 		int
		declare @DiagId			int
	
		if(@diagramname is null)
		begin
			RAISERROR ('Invalid value', 16, 1);
			return -1
		end
	
		EXECUTE AS CALLER;
		select @theId = DATABASE_PRINCIPAL_ID();
		select @IsDbo = IS_MEMBER(N'db_owner'); 
		if(@owner_id is null)
			select @owner_id = @theId;
		REVERT; 
		
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname 
		if(@DiagId IS NULL or (@IsDbo = 0 and @UIDFound <> @theId))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1)
			return -3
		end
	
		delete from dbo.sysdiagrams where diagram_id = @DiagId;
	
		return 0;
	END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_generate_sales_Marketplace
CREATE PROCEDURE dbo.sp_generate_sales_Marketplace
	@Site Varchar(2),
	@User varchar(50)
AS
BEGIN
--	DECLARE @Site Varchar(2) = '21'
--	DECLARE @User varchar(50) = 'X'

	SET NOCOUNT ON;
	declare @TokoID Varchar(10)
	declare @PembeliID Varchar(10)
	declare @NamaAccount varchar(50)
	declare @Nama varchar(50)
	declare @Alamat varchar(300)
	declare @Kota varchar(50)
	declare @Kode_Pos varchar(50)
	declare @Telp varchar(25)
	declare @Prefix varchar(25)
	declare @Max varchar(25)
	declare @Bukti varchar(25)
	declare @Bukti_Reff varchar(50)
	declare @NoResi varchar(50)
	declare @Ekspedisi varchar(50)
	declare @Tanggal datetime
	declare @Urut int
	declare @Produk varchar(20)
	declare @Harga decimal(15,0)
	declare @Qty decimal(15,0)
	declare @Total decimal(15,2)
	declare @Disc decimal(15,2)
	declare @ValueDisc decimal(15,2)
	declare @Promo decimal(15,2)
	declare @Nett decimal(15,2)
	declare @TotalNett decimal(15,2)

	--Create data pembeli
	--declare cursor_pembeli cursor
	--for
	--SELECT  DISTINCT	a.toko_id, a.Nama_Account, a.Pembeli, a.Alamat, a.Kota, a.Kode_Pos, a.Tlp
	--FROM	T_SALES_UPLOAD a
	--		LEFT JOIN M_TOKO3 b ON a.toko_id = b.toko_id2 AND a.Nama_Account = b.Nama_Account AND a.Pembeli = b.nama AND a.Alamat = b.alamat AND b.site_id = @Site
	--WHERE	b.pembeli_id IS NULL AND
	--		isnull(flag_proses,0) = 0

	--open cursor_pembeli;
	--fetch next from cursor_pembeli into @TokoID, @NamaAccount, @Nama, @Alamat, @Kota, @Kode_Pos, @Telp;
	--while @@FETCH_STATUS = 0
	--begin
	--	select @Prefix = FORMAT(getdate(),'yyMM')
	--	select @Max = max(RIGHT(pembeli_id,4)) from M_TOKO3 where left(pembeli_id,len(@Prefix)) = @Prefix and site_id = @Site and toko_id2 = @TokoID;
	--	if (@Max is null) select @Max = @Prefix + '0000'
	--	select @PembeliID = @Prefix + right('0000' + convert(varchar(4),convert(int,right(@Max,4)) + 1),4);

	--	begin transaction;
	--	INSERT INTO M_TOKO3 (site_id, toko_id, toko_id2, pembeli_id, Nama_Account, nama, alamat, kota, kode_pos, telp, user_entry, tgl_entry)
	--	VALUES (@Site, left(@TokoID,4), @TokoID, @PembeliID, @NamaAccount, @Nama, @Alamat, @Kota, @Kode_Pos, @Telp, @User, GETDATE())
	--	if @@ERROR = 0
	--		commit transaction;
	--	else
	--		rollback transaction;

	--	fetch next from cursor_pembeli into @TokoID, @NamaAccount, @Nama, @Alamat, @Kota, @Kode_Pos, @Telp;
	--end
	--close cursor_pembeli;
	--deallocate cursor_pembeli;

	----update pembeli di table upload
--	begin transaction;
--	UPDATE	T_SALES_UPLOAD SET pembeli_id = b.pembeli_id
--	FROM	T_SALES_UPLOAD a
--			LEFT JOIN M_TOKO3 b ON a.toko_id = b.toko_id2 AND a.Nama_Account = b.Nama_Account AND a.Pembeli = b.nama AND a.Alamat = b.alamat AND b.site_id = @Site
--	WHERE	a.pembeli_id IS NULL;
--	commit transaction;

    -- Create Header
	declare cursor_header cursor
	for
		SELECT DISTINCT NoInvoice, a.No_Resi, a.Ekspedisi, a.toko_id , CONVERT(DATE, Tanggal) Tanggal
		FROM	T_SALES_UPLOAD a
				--INNER JOIN M_TOKO3 b ON a.pembeli_id = b.pembeli_id AND b.site_id = @Site AND a.toko_id = b.toko_id2
				LEFT JOIN T_SALES3 c ON a.NoInvoice = c.bukti_reff
		WHERE	flag_proses = 0 AND c.bukti_reff IS NULL
		ORDER BY NoInvoice;

	open cursor_header;
	fetch next from cursor_header into @Bukti_Reff, @NoResi, @Ekspedisi, @TokoID, @Tanggal;
	while @@FETCH_STATUS = 0
	begin
		--Create BuktiID
		select @Prefix = 'SLM' + @Site + FORMAT(getdate(),'yyMM')
		SELECT @Max = MAX(RIGHT(bukti, 5)) FROM T_SALES3 WHERE LEFT(bukti, LEN(@Prefix)) = @Prefix;
		IF (@Max is null) SELECT @Max = '00000'
		SELECT @Bukti = @Prefix + FORMAT(CONVERT(INT, @Max) + 1, '00000')

		begin transaction
		INSERT INTO T_SALES3 (site_id, bukti, toko_id, tgl, bukti_reff, No_Resi, Ekspedisi, user_entry, tgl_entry)
		VALUES (@Site, @Bukti, @TokoID, @Tanggal, @Bukti_Reff, @NoResi, @Ekspedisi, @User, GETDATE());

		-- Create Detail
			declare cursor_detail cursor 
			for
				SELECT ROW_NUMBER() OVER(ORDER BY Artikel)
						,Artikel
						,SUM(ISNULL(Harga,0))
						,SUM(ISNULL(QTY, 0)) AS QTY
						,SUM(ISNULL(Harga, 0) * ISNULL(QTY,0))
						,SUM(ISNULL(Disc, 0))
						,SUM(ISNULL(Value_Disc, 0))
						,SUM(ISNULL(Promo, 0))
				FROM	T_SALES_UPLOAD
				WHERE	flag_proses = 0
						AND NoInvoice = @Bukti_Reff
						AND toko_id = @TokoID
						--AND pembeli_id = @PembeliID
				GROUP BY Artikel;

			open cursor_detail;
			fetch next from cursor_detail into @Urut, @Produk, @Harga, @Qty, @Total, @Disc, @ValueDisc, @Promo;
			while @@FETCH_STATUS = 0
			begin
				if ISNULL(@Disc,0) = 0 select @Disc = (@ValueDisc / @Total) * 100
				if ISNULL(@ValueDisc,0) = 0 select @ValueDisc = 0.01 * @Disc * @Total
				select @Nett = @Total - @ValueDisc - @Promo

				INSERT INTO T_SALES4 (site_id, bukti, produk_id, urut, harga, qty, Total, Disc, Value_Disc, Promo, Nett)
				VALUES (@Site, @Bukti, @Produk, @Urut, @Harga, @Qty, @Total, @Disc, @ValueDisc, @Promo, @Nett);

				fetch next from cursor_detail into @Urut, @Produk, @Harga, @Qty, @Total, @Disc, @ValueDisc, @Promo;
			end
			close cursor_detail;
			deallocate cursor_detail;

		--- end detail ---
			select @TotalNett = sum(isnull(Nett,0)) from T_SALES4 where bukti = @Bukti and site_id = @Site;
			update	T_SALES3
			set		subtotal = @TotalNett, total = @TotalNett
			where	bukti = @Bukti and site_id = @Site;

		if @@ERROR = 0
			commit transaction;
		else
			rollback transaction;

		fetch next from cursor_header into @Bukti_Reff, @NoResi, @Ekspedisi, @TokoID, @Tanggal;
	end
	close cursor_header;
	deallocate cursor_header;

	--Update Status Proses Upload
	begin transaction;
	update	T_SALES_UPLOAD
	set		flag_proses = 1 
	from	T_SALES_UPLOAD a left join T_SALES3 b on a.NoInvoice = b.bukti_reff;
	commit transaction;
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_generate_sales_Marketplacex
create PROCEDURE [dbo].[sp_generate_sales_Marketplacex]
	@Site Varchar(2),
	@User varchar(50)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	declare @TokoID Varchar(10)
	declare @PembeliID Varchar(10)
	declare @NamaAccount varchar(50)
	declare @Nama varchar(50)
	declare @Alamat varchar(300)
	declare @Kota varchar(50)
	declare @Kode_Pos varchar(50)
	declare @Telp varchar(25)
	declare @Prefix varchar(25)
	declare @Max varchar(25)
	declare @Bukti varchar(25)
	declare @Bukti_Reff varchar(50)
	declare @NoResi varchar(50)
	declare @Ekspedisi varchar(50)
	declare @Tanggal datetime
	declare @Urut int
	declare @Produk varchar(20)
	declare @Harga decimal(15,0)
	declare @Qty decimal(15,0)
	declare @Total decimal(15,2)
	declare @Disc decimal(15,2)
	declare @ValueDisc decimal(15,2)
	declare @Promo decimal(15,2)
	declare @Nett decimal(15,2)
	declare @TotalNett decimal(15,2)

	--Create data pembeli
	declare cursor_pembeli cursor
	for
	SELECT  DISTINCT	a.toko_id, a.Nama_Account, a.Pembeli, a.Alamat, a.Kota, a.Kode_Pos, a.Tlp
	FROM	T_SALES_UPLOAD a
			LEFT JOIN M_TOKO3 b ON a.toko_id = b.toko_id2 AND a.Nama_Account = b.Nama_Account AND a.Pembeli = b.nama AND a.Alamat = b.alamat AND b.site_id = @Site
	WHERE	b.pembeli_id IS NULL AND
			isnull(flag_proses,0) = 0

	open cursor_pembeli;
	fetch next from cursor_pembeli into @TokoID, @NamaAccount, @Nama, @Alamat, @Kota, @Kode_Pos, @Telp;
	while @@FETCH_STATUS = 0
	begin
		select @Prefix = FORMAT(getdate(),'yyMM')
		select @Max = max(RIGHT(pembeli_id,4)) from M_TOKO3 where left(pembeli_id,len(@Prefix)) = @Prefix and site_id = @Site and toko_id2 = @TokoID;
		if (@Max is null) select @Max = @Prefix + '0000'
		select @PembeliID = @Prefix + right('0000' + convert(varchar(4),convert(int,right(@Max,4)) + 1),4);

		begin transaction;
		INSERT INTO M_TOKO3 (site_id, toko_id, toko_id2, pembeli_id, Nama_Account, nama, alamat, kota, kode_pos, telp, user_entry, tgl_entry)
		VALUES (@Site, left(@TokoID,4), @TokoID, @PembeliID, @NamaAccount, @Nama, @Alamat, @Kota, @Kode_Pos, @Telp, @User, GETDATE())
		if @@ERROR = 0
			commit transaction;
		else
			rollback transaction;

		fetch next from cursor_pembeli into @TokoID, @NamaAccount, @Nama, @Alamat, @Kota, @Kode_Pos, @Telp;
	end
	close cursor_pembeli;
	deallocate cursor_pembeli;

	--update pembeli di table upload
	begin transaction;
	UPDATE	T_SALES_UPLOAD SET pembeli_id = b.pembeli_id
	FROM	T_SALES_UPLOAD a
			LEFT JOIN M_TOKO3 b ON a.toko_id = b.toko_id2 AND a.Nama_Account = b.Nama_Account AND a.Pembeli = b.nama AND a.Alamat = b.alamat AND b.site_id = @Site
	WHERE	a.pembeli_id IS NULL;
	commit transaction;

    -- Create Header
	declare cursor_header cursor
	for
		SELECT DISTINCT NoInvoice, a.No_Resi, a.Ekspedisi, a.toko_id, a.pembeli_id, Tanggal
		FROM	T_SALES_UPLOAD a
				INNER JOIN M_TOKO3 b ON a.pembeli_id = b.pembeli_id AND b.site_id = @Site AND a.toko_id = b.toko_id2
				LEFT JOIN T_SALES3 c ON a.NoInvoice = c.bukti_reff
		WHERE	flag_proses = 0 AND c.bukti_reff IS NULL
		ORDER BY NoInvoice;

	open cursor_header;
	fetch next from cursor_header into @Bukti_Reff, @NoResi, @Ekspedisi, @TokoID, @PembeliID, @Tanggal;
	while @@FETCH_STATUS = 0
	begin
		--Create BuktiID
		select @Prefix = 'SLM' + @Site + FORMAT(getdate(),'yyMM')
		select @Max = max(bukti) from T_SALES3 where left(bukti,len(@Prefix)) = @Prefix;
		if (@Max is null) select @Max = @Prefix + '0000'
		select @Bukti = @Prefix + right('0000' + convert(varchar(4),convert(int,right(@Max,4)) + 1),4);

		begin transaction
		INSERT INTO T_SALES3 (site_id, bukti, toko_id, pembeli_id, tgl, bukti_reff, No_Resi, Ekspedisi, user_entry, tgl_entry)
		VALUES (@Site, @Bukti, @TokoID, @PembeliID, @Tanggal, @Bukti_Reff, @NoResi, @Ekspedisi, @User, GETDATE());

		-- Create Detail
			declare cursor_detail cursor 
			for
				SELECT ROW_NUMBER() OVER(ORDER BY Artikel)
						,Artikel
						,SUM(ISNULL(Harga,0))
						,SUM(ISNULL(QTY, 0)) AS QTY
						,SUM(ISNULL(Harga, 0) * ISNULL(QTY,0))
						,SUM(ISNULL(Disc, 0))
						,SUM(ISNULL(Value_Disc, 0))
						,SUM(ISNULL(Promo, 0))
				FROM	T_SALES_UPLOAD
				WHERE	flag_proses = 0
						AND NoInvoice = @Bukti_Reff
						AND toko_id = @TokoID
						AND pembeli_id = @PembeliID
				GROUP BY Artikel;

			open cursor_detail;
			fetch next from cursor_detail into @Urut, @Produk, @Harga, @Qty, @Total, @Disc, @ValueDisc, @Promo;
			while @@FETCH_STATUS = 0
			begin
				if ISNULL(@Disc,0) = 0 select @Disc = (@ValueDisc / @Total) * 100
				if ISNULL(@ValueDisc,0) = 0 select @ValueDisc = 0.01 * @Disc * @Total
				select @Nett = @Total - @ValueDisc - @Promo

				INSERT INTO T_SALES4 (site_id, bukti, produk_id, urut, harga, qty, Total, Disc, Value_Disc, Promo, Nett)
				VALUES (@Site, @Bukti, @Produk, @Urut, @Harga, @Qty, @Total, @Disc, @ValueDisc, @Promo, @Nett);

				fetch next from cursor_detail into @Urut, @Produk, @Harga, @Qty, @Total, @Disc, @ValueDisc, @Promo;
			end
			close cursor_detail;
			deallocate cursor_detail;

		--- end detail ---
			select @TotalNett = sum(isnull(Nett,0)) from T_SALES4 where bukti = @Bukti and site_id = @Site;
			update	T_SALES3
			set		subtotal = @TotalNett, total = @TotalNett
			where	bukti = @Bukti and site_id = @Site;

		if @@ERROR = 0
			commit transaction;
		else
			rollback transaction;

		fetch next from cursor_header into @Bukti_Reff, @NoResi, @Ekspedisi, @TokoID, @PembeliID, @Tanggal;
	end
	close cursor_header;
	deallocate cursor_header;

	--Update Status Proses Upload
	begin transaction;
	update	T_SALES_UPLOAD
	set		flag_proses = 1 
	from	T_SALES_UPLOAD a left join T_SALES3 b on a.NoInvoice = b.bukti_reff;
	commit transaction;
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_helpdiagramdefinition
CREATE PROCEDURE dbo.sp_helpdiagramdefinition
	(
		@diagramname 	sysname,
		@owner_id	int	= null 		
	)
	WITH EXECUTE AS N'dbo'
	AS
	BEGIN
		set nocount on

		declare @theId 		int
		declare @IsDbo 		int
		declare @DiagId		int
		declare @UIDFound	int
	
		if(@diagramname is null)
		begin
			RAISERROR (N'E_INVALIDARG', 16, 1);
			return -1
		end
	
		execute as caller;
		select @theId = DATABASE_PRINCIPAL_ID();
		select @IsDbo = IS_MEMBER(N'db_owner');
		if(@owner_id is null)
			select @owner_id = @theId;
		revert; 
	
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname;
		if(@DiagId IS NULL or (@IsDbo = 0 and @UIDFound <> @theId ))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1);
			return -3
		end

		select version, definition FROM dbo.sysdiagrams where diagram_id = @DiagId ; 
		return 0
	END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_helpdiagrams
CREATE PROCEDURE dbo.sp_helpdiagrams
	(
		@diagramname sysname = NULL,
		@owner_id int = NULL
	)
	WITH EXECUTE AS N'dbo'
	AS
	BEGIN
		DECLARE @user sysname
		DECLARE @dboLogin bit
		EXECUTE AS CALLER;
			SET @user = USER_NAME();
			SET @dboLogin = CONVERT(bit,IS_MEMBER('db_owner'));
		REVERT;
		SELECT
			[Database] = DB_NAME(),
			[Name] = name,
			[ID] = diagram_id,
			[Owner] = USER_NAME(principal_id),
			[OwnerID] = principal_id
		FROM
			sysdiagrams
		WHERE
			(@dboLogin = 1 OR USER_NAME(principal_id) = @user) AND
			(@diagramname IS NULL OR name = @diagramname) AND
			(@owner_id IS NULL OR principal_id = @owner_id)
		ORDER BY
			4, 5, 1
	END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Model_Prioritas_Update
CREATE PROCEDURE dbo.sp_Model_Prioritas_Update
	@model	 	VARCHAR(20),
	@prio		VARCHAR(15)
AS
BEGIN
	SET NOCOUNT ON;
	
	UPDATE 	M_PRODUK_MODEL
	SET 	prioritas = @prio
	WHERE	model_id = @model;


END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_PRO_Insert
CREATE PROCEDURE dbo.sp_PRO_Insert
	@tgl		DATETIME,
	@model	 	VARCHAR(20),
	@LineID		BIGINT,
	@User		VARCHAR(15),
	@json		nvarchar(max)
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @Period		varchar(15)
	DECLARE	@Bukti		VARCHAR(15)
	DECLARE	@supp_id	VARCHAR(15)
	DECLARE	@Ada		INT
	DECLARE @Row		INT
	DECLARE @temp TABLE
		(
			model_id varchar(15),
			produk_id varchar(20),
			qty DECIMAL(10),
			ket VARCHAR(70)
		)

	INSERT INTO @temp
	SELECT *
	FROM OPENJSON(@json)
	WITH (	model_id varchar(15),
			produk_id varchar(20),
			qty DECIMAL(10),
			ket VARCHAR(70)
		 )

	SELECT @Ada = COUNT(*) FROM @temp a JOIN M_PRODUK b ON a.produk_id = b.produk_id WHERE	ISNULL(qty, 0) > 0
	IF @Ada < 1 RETURN

	set @Period = FORMAT(GETDATE(), 'yyMM')
	select	@Bukti = max(right(bukti,4)) 
	from	T_PRO_PLAN2
	where	left(bukti,4) = @Period;
	
	if @Bukti is null set @Bukti = @Period + '0001'
	else set @Bukti = @Period + FORMAT(convert(int, @Bukti) + 1 , '0000')

	select @supp_id = supp_id from users where nik= @User ;

	BEGIN TRANSACTION
	INSERT INTO T_PRO_PLAN2 (bukti, tgl, brand_id, model_id, produk_id, supp_id, line_id, qty, tgl_selesai, user_upd, tgl_upd, flag_proses, ket)
	SELECT 	@Bukti, CONVERT(DATETIME, FORMAT(GETDATE(), 'yyyy-MM-dd')), b.brand_id, a.model_id, a.produk_id, @supp_id, @LineID, qty, @tgl ,@User, GETDATE(), 0, CASE WHEN ISNULL(a.ket, '') = '' THEN NULL ELSE CONCAT(b.warna, '-', b.size, '-', a.ket) END ket
	FROM 	@temp a
			LEFT JOIN View_produk b ON a.produk_id = b.produk_id
	WHERE	ISNULL(qty, 0) > 0
	ORDER BY b.warna, b.urut_size;

	SELECT @Row = @@rowcount;
	IF @Row = @Ada
		BEGIN
			COMMIT TRANSACTION
			SELECT 'OK' as result,'-' as pesanError;
		END
	ELSE
		BEGIN
			ROLLBACK TRANSACTION
			SELECT 'NOK' as result, 'Insert Data Gagal' as pesanError;
		END

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_renamediagram
CREATE PROCEDURE dbo.sp_renamediagram
	(
		@diagramname 		sysname,
		@owner_id		int	= null,
		@new_diagramname	sysname
	
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
		declare @theId 			int
		declare @IsDbo 			int
		
		declare @UIDFound 		int
		declare @DiagId			int
		declare @DiagIdTarg		int
		declare @u_name			sysname
		if((@diagramname is null) or (@new_diagramname is null))
		begin
			RAISERROR ('Invalid value', 16, 1);
			return -1
		end
	
		EXECUTE AS CALLER;
		select @theId = DATABASE_PRINCIPAL_ID();
		select @IsDbo = IS_MEMBER(N'db_owner'); 
		if(@owner_id is null)
			select @owner_id = @theId;
		REVERT;
	
		select @u_name = USER_NAME(@owner_id)
	
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname 
		if(@DiagId IS NULL or (@IsDbo = 0 and @UIDFound <> @theId))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1)
			return -3
		end
	
		-- if((@u_name is not null) and (@new_diagramname = @diagramname))	-- nothing will change
		--	return 0;
	
		if(@u_name is null)
			select @DiagIdTarg = diagram_id from dbo.sysdiagrams where principal_id = @theId and name = @new_diagramname
		else
			select @DiagIdTarg = diagram_id from dbo.sysdiagrams where principal_id = @owner_id and name = @new_diagramname
	
		if((@DiagIdTarg is not null) and  @DiagId <> @DiagIdTarg)
		begin
			RAISERROR ('The name is already used.', 16, 1);
			return -2
		end		
	
		if(@u_name is null)
			update dbo.sysdiagrams set [name] = @new_diagramname, principal_id = @theId where diagram_id = @DiagId
		else
			update dbo.sysdiagrams set [name] = @new_diagramname where diagram_id = @DiagId
		return 0
	END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Retrieve_List_Plan
CREATE PROCEDURE [dbo].[sp_Retrieve_List_Plan]
	@Brand	VARCHAR(1),
	@Dept	VARCHAR(5),
	@Beres  VARCHAR(1)
AS
BEGIN
	select distinct a.model_id model_id
       ,a.foto
	   ,d.nama brand
	   ,c.nama dept
	   ,a.model_id_lama model_designer
	   ,a.prioritas
		   ,a.nama nama_model
		   ,e.tgl tgl
		   ,b.nama_supplier
		   ,b.prod
		   ,b.tgl_selesai
		   ,b.qty
		   ,b.ket,case when isnull(a.beres,'')='' then 'Proses' else 'Finish' end beres
	FROM 	M_PRODUK_MODEL a join m_produk on a.model_id=m_produk.model_id
			LEFT JOIN M_PRODUK_DEPT c on a.grup_dept=c.grup_dept
			LEFT JOIN 
			(
				SELECT  a.model_id
						,d.nama nama_supplier
						,c.nama prod
						,a.tgl_selesai
						,a.prioritas
						,e.ket
						,sum(qty) as qty
				FROM 	T_PRO_PLAN2 a
						JOIN 
						(
							SELECT model_id,MAX(BUKTI)AS BUKTI
							FROM T_PRO_PLAN2 
							GROUP BY MODEL_ID
						) b ON A.BUKTI=b.BUKTI and A.MODEL_ID=b.MODEL_ID
						LEFT join m_table_pro c on  a.line_id=c.line_id
						LEFT JOIN M_SUPPLIER0 d ON a.supp_id = d.supp_id
						LEFT JOIN
						(
							SELECT 	bukti, STRING_AGG(ket, ', ') ket
							FROM 	T_PRO_PLAN2 
							WHERE 	ISNULL(ket, '') <> ''
							GROUP BY bukti
						) e ON A.bukti = e.bukti
				GROUP BY a.model_id, d.nama, c.nama, a.tgl_selesai, e.ket, a.prioritas
			) b on a.model_id=b.model_id
			LEFT JOIN M_PRODUK_BRAND d ON a.brand_id = d.brand_id
			 join 
			(
			select tgl,M_PRODUK.model_id
			from T_BELI1 join T_BELI2 on T_BELI1.bukti=T_BELI2.bukti
						left join M_PRODUK on T_BELI2.produk_id=M_PRODUK.produk_id
			where  datediff(month,getdate(),tgl)>= -6 
			)e on a.model_id=e.model_id

	WHERE isnull(a.beres,0) like @Beres
			AND a.brand_id LIKE @Brand 
			AND a.grup_dept LIKE @Dept
			and  a.model_id not in (	select distinct isnull(M_PRODUK.produk_id,'')
											from T_GUDANG1 left join T_GUDANG2 on T_GUDANG1.bukti=T_GUDANG2.bukti
															left join  M_PRODUK on T_GUDANG2.produk_id=M_PRODUK.produk_id
											where tipe_trans='TERIMA')
	order by brand, dept, tgl desc
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Retrieve_List_Plan_Detail
CREATE PROCEDURE dbo.sp_Retrieve_List_Plan_Detail
	@model VARCHAR(15)
AS
BEGIN
	SELECT 	 a.model_id
			,a.produk_id
			,a.model_id_lama model_designer
			,a.nama
			,a.warna
			,a.size
			,b.qty
			,' ' ket
	FROM 	view_produk a
        LEFT JOIN
        (
          SELECT  c.produk_id, c.qty
          FROM    T_BELI1 a
                  JOIN
                  (
                    SELECT  bukti, model_id, MAX(tgl) OVER(PARTITION BY model_id) flag_max
                    FROM    T_BELI1
                    WHERE   model_id = @model
                  ) b ON a.bukti = b.bukti AND a.model_id = b.model_id AND a.tgl = b.flag_max
                  JOIN T_BELI2 c ON a.bukti = c.bukti
        ) b ON a.produk_id = b.produk_id
	WHERE 	a.model_id = @model
	order by left(a.produk_id,17),a.urut_size
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Rpt_ProPlan
CREATE PROCEDURE [dbo].[sp_Rpt_ProPlan]
	@Brand	VARCHAR(1),
	@Dept	VARCHAR(5),
	@Tgl1	DATETIME,
	@Tgl2	DATETIME,
	@Beres VARCHAR(1)
AS
BEGIN
	SELECT 	b.nama Supplier
			,d.model_id_lama model_designer
			,d.prioritas
			,f.nama nama_dept
			,g.nama brand
			,a.model_id Model
			,d.nama NamaModel
			,d.nama_pendek2 nama_pendek
			,d.foto
			,c.nama TipeProses
			,h.sts sts
			,a.tgl_selesai TglSelesai, case when isnull(d.beres,'')='' then 'Proses' else 'Finish' end beres
			,(select sum(isnull(qty,0)) from T_PRO_PLAN2 where T_PRO_PLAN2.bukti=a.bukti) Qty
			--,SUM(ISNULL(a.qty, 0)) Qty
	FROM 	T_PRO_PLAN2 a
			LEFT JOIN M_SUPPLIER0 b ON a.supp_id = b.supp_id
			LEFT JOIN M_TABLE_PRO c ON a.line_id = c.line_id
			LEFT JOIN M_PRODUK_MODEL d ON a.model_id = d.model_id
			LEFT join M_PRODUK_DEPT f on d.grup_dept = f.grup_dept
			JOIN
			(
				SELECT 	MAX(bukti) bukti, a.model_id
				FROM 	T_PRO_PLAN2 a
						JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
				WHERE 	a.brand_id LIKE @Brand
						AND (b.period BETWEEN @Tgl1 AND @Tgl2)
				GROUP BY a.model_id
			) e ON a.bukti = e.bukti
			LEFT JOIN M_PRODUK_BRAND g ON a.brand_id = g.brand_id
			left join 
			(
			select a.model_id,case when isnull(tipe_produk,'G')='G' then 'GROSIR' else 'RETAIL' end sts
			from T_BELI1 
					JOIN T_BELI2 ON T_BELI1.BUKTI=T_BELI2.BUKTI
					join m_produk a on T_BELI2.produk_id=a.produk_id
					join 
					(
					select max(t_beli1.bukti)bukti,a.model_id
					from T_BELI1 JOIN T_BELI2 ON T_BELI1.BUKTI=T_BELI2.BUKTI
							join m_produk a on T_BELI2.produk_id=a.produk_id
					group by a.model_id
					)b on T_BELI1.bukti=b.bukti and a.model_id=b.model_id
			)h on a.model_id=h.model_id
			 join 
			(
			select tgl,M_PRODUK.model_id
			from T_BELI1 join T_BELI2 on T_BELI1.bukti=T_BELI2.bukti
						left join M_PRODUK on T_BELI2.produk_id=M_PRODUK.produk_id
			where  (tgl BETWEEN @Tgl1 AND @Tgl2) --datediff(month,getdate(),tgl)>= -6 
			)j on a.model_id=j.model_id
	WHERE	a.brand_id LIKE @Brand and isnull(d.beres,0) like @Beres
			AND d.grup_dept LIKE @Dept
			--AND (d.period BETWEEN @Tgl1 AND @Tgl2)
	GROUP BY b.nama ,a.bukti
			,f.nama
			,g.nama
			,a.model_id
			,d.nama
			,d.nama_pendek2
			,d.foto
			,c.nama
			,a.tgl_selesai
			,d.model_id_lama
			,d.prioritas, d.beres,h.sts
	order by brand, nama_dept, Supplier, Model, nama_pendek
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Rpt_ProPlan_Detail
CREATE PROCEDURE [dbo].[sp_Rpt_ProPlan_Detail]
	@Brand	VARCHAR(1),
	@Dept	VARCHAR(5),
	@Tgl1	DATETIME,
	@Tgl2	DATETIME,
	@Beres VARCHAR(1)
AS
BEGIN
	SELECT 	a.bukti NoBukti
			,d.prioritas
			,b.nama Supplier
			,f.nama nama_dept
			,g.nama brand
			,a.model_id Model
			,d.nama NamaModel
			,d.nama_pendek2 nama_pendek
			,d.model_id_lama model_designer
			,d.foto
			,c.nama TipeProses
			,a.produk_id ProdukID
			,e.warna Warna
			,e.size Size
			,a.tgl_selesai TglSelesai , case when isnull(d.beres,'')='' then 'Proses' else 'Finish' end beres
			,a.qty Qty
	FROM 	T_PRO_PLAN2 a
			LEFT JOIN M_SUPPLIER0 b ON a.supp_id = b.supp_id
			LEFT JOIN M_TABLE_PRO c ON a.line_id = c.line_id
			LEFT JOIN M_PRODUK_MODEL d ON a.model_id = d.model_id
			LEFT JOIN View_produk e ON a.produk_id = e.produk_id
			LEFT join M_PRODUK_DEPT f on e.grup_dept = f.grup_dept
			LEFT JOIN M_PRODUK_BRAND g ON a.brand_id = g.brand_id
	WHERE	a.brand_id LIKE @Brand and isnull(d.beres,0) like @Beres
			AND d.grup_dept LIKE @Dept
			AND (tgl_selesai BETWEEN @Tgl1 AND @Tgl2)
	ORDER BY brand, nama_dept, NoBukti, Model, nama_pendek, Warna, Size
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Rpt_ProPlan2
CREATE PROCEDURE [dbo].[sp_Rpt_ProPlan2]
	@Brand	VARCHAR(1),
	@Dept	VARCHAR(5),
	@Tgl1	DATETIME,
	@Tgl2	DATETIME,
	@Beres VARCHAR(1)
AS
BEGIN
	SELECT	b.nama Supplier
			,a.model_id_lama model_designer
			,a.prioritas
			,c.nama nama_dept
			,d.nama brand
			,a.model_id Model
			,a.nama NamaModel
			,a.nama_pendek2 nama_pendek
			,a.foto
			,f.qty, case when isnull(a.beres,'')='' then 'Proses' else 'Finish' end beres
	FROM	M_PRODUK_MODEL a
			LEFT JOIN M_SUPPLIER0 b ON a.supp_id = b.supp_id
			LEFT JOIN M_PRODUK_DEPT c ON a.grup_dept = c.grup_dept
			LEFT JOIN M_PRODUK_BRAND d ON a.brand_id = d.brand_id
			LEFT JOIN T_PRO_PLAN2 e ON a.model_id = e.model_id
			LEFT JOIN
			(
				SELECT  a.model_id, SUM(ISNULL(c.qty, 0)) qty
				FROM    T_BELI1 a
				        JOIN
				        (
				          SELECT  bukti, model_id, MAX(tgl) OVER(PARTITION BY model_id) flag_max
				          FROM    T_BELI1
				        ) b ON a.bukti = b.bukti AND a.model_id = b.model_id AND a.tgl = b.flag_max
				        JOIN T_BELI2 c ON a.bukti = c.bukti
				GROUP BY a.model_id
			) f ON a.model_id = f.model_id
			 join 
			(
			select tgl,M_PRODUK.model_id
			from T_BELI1 join T_BELI2 on T_BELI1.bukti=T_BELI2.bukti
						left join M_PRODUK on T_BELI2.produk_id=M_PRODUK.produk_id
			where  (tgl BETWEEN @Tgl1 AND @Tgl2) --datediff(month,getdate(),tgl)>= -6 
			)j on a.model_id=j.model_id
	WHERE	e.bukti IS NULL
			--AND (a.period BETWEEN @Tgl1 AND @Tgl2)
			AND a.brand_id LIKE @Brand
			AND a.grup_dept LIKE @Dept

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Rpt_ProPlan3
create PROCEDURE [dbo].[sp_Rpt_ProPlan3]
	@Brand	VARCHAR(1),
	@Dept	VARCHAR(5),
	@Tgl1	DATETIME,
	@Tgl2	DATETIME,
	@Beres VARCHAR(1)
AS
BEGIN
select a.model_id
		,a.model_id_lama model_designer
		,a.prioritas
		,a.nama NamaModel
		,a.nama_pendek2 nama_pendek
		,a.foto
		,b1.Supplier b1sup
		,b1.tgl_selesai b1tgl 
		,b1.qty b1qty

		,b2.Supplier b2sup
		,b2.tgl_selesai b2tgl
		,b2.qty b2qty

		,b3.Supplier b3sup
		,b3.tgl_selesai b3tgl
		,b3.qty b3qty

		,b4.Supplier b4sup
		,b4.tgl_selesai b4tgl
		,b4.qty b4qty

		,b5.Supplier b5sup
		,b5.tgl_selesai b5tgl
		,b5.qty b5qty

		,b6.Supplier b6sup
		,b6.tgl_selesai b6tgl
		,b6.qty b6qty

		,b7.Supplier b7sup
		,b7.tgl_selesai b7tgl
		,b7.qty b7qty

		,b8.Supplier b8sup
		,b8.tgl_selesai b8tgl
		,b8.qty b8qty

		,b9.Supplier b9sup
		,b9.tgl_selesai b9tgl
		,b9.qty b9qty

		,b10.Supplier b10sup
		,b10.tgl_selesai b10tgl
		,b10.qty b10qty

		,b11.Supplier b11sup
		,b11.tgl_selesai b11tgl
		,b11.qty b11qty

		,b12.Supplier b12sup
		,b12.tgl_selesai b12tgl
		,b12.qty b12qty
			
		, case when isnull(a.beres,'')='' then 'Proses' else 'Finish' end beres
FROM M_PRODUK_MODEL a
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,a1.tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=1
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=1
				group by a1.model_id,a2.nama,tgl_selesai
			) b1 ON a.model_id = b1.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=2
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=2
				group by a1.model_id,a2.nama,tgl_selesai
			) b2 ON a.model_id = b2.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=3
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=3 
				group by a1.model_id,a2.nama,tgl_selesai
			) b3 ON a.model_id = b3.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=4
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=4
				group by a1.model_id,a2.nama,tgl_selesai
			) b4 ON a.model_id = b4.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=7
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=7
				group by a1.model_id,a2.nama,tgl_selesai
			) b5 ON a.model_id = b5.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=8
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=8
				group by a1.model_id,a2.nama,tgl_selesai
			) b6 ON a.model_id = b6.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=10
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=10
				group by a1.model_id,a2.nama,tgl_selesai
			) b7 ON a.model_id = b7.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=12
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=12
				group by a1.model_id,a2.nama,tgl_selesai
			) b8 ON a.model_id = b8.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=13
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=13
				group by a1.model_id,a2.nama,tgl_selesai
			) b9 ON a.model_id = b9.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=15
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=15
				group by a1.model_id,a2.nama,tgl_selesai
			) b10 ON a.model_id = b10.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=16
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=16
				group by a1.model_id,a2.nama,tgl_selesai
			) b11 ON a.model_id = b11.model_id
			left outer JOIN
			(
				select a1.model_id, a2.nama Supplier,tgl_selesai,SUM(ISNULL(a1.qty, 0)) Qty
				from T_PRO_PLAN2 a1
						left join M_SUPPLIER0 a2 ON a1.supp_id = a2.supp_id
						 join 
						(
						SELECT 	MAX(bukti) bukti, a.model_id
						FROM 	T_PRO_PLAN2 a
								JOIN M_PRODUK_MODEL b ON a.model_id = b.model_id
						WHERE 	b.brand_id LIKE @Brand and line_id=17
								AND (b.period BETWEEN @Tgl1 AND @Tgl2)
						GROUP BY a.model_id
						)a3 on a1.bukti = a3.bukti
				where a1.brand_id LIKE @Brand and a1.line_id=17
				group by a1.model_id,a2.nama,tgl_selesai
			) b12 ON a.model_id = b12.model_id

	WHERE	(a.period BETWEEN @Tgl1 AND @Tgl2) and isnull(a.beres,0) like @Beres
			AND a.brand_id LIKE @Brand
			AND a.grup_dept LIKE @Dept

END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_Rpt_Tes
CREATE PROCEDURE dbo.sp_Rpt_Tes
AS
BEGIN
	SELECT 	gl_journal.voucher voucher
			,gl_journal.voucher_date voucher_date
			,gl_journal_detail.account_id account_id
			,gl_journal_detail.debet debet
			,gl_journal_detail.kredit kredit
	FROM 	gl_journal 			
			INNER JOIN gl_journal_detail ON gl_journal.voucher = gl_journal_detail.voucher
			INNER JOIN gl_coa ON gl_journal_detail.account_id = gl_coa.account_id AND gl_journal.site_id = gl_coa.site_id 
	WHERE 	( gl_journal.site_id = '01') 
			AND ( gl_journal.voucher_date >= '2025-01-01 00:00:00'  )
			AND ( gl_journal.voucher_date <= '2025-09-28 23:59:59'  )
END
GO

-- ===== SQL_STORED_PROCEDURE: dbo.sp_upgraddiagrams
CREATE PROCEDURE dbo.sp_upgraddiagrams
	AS
	BEGIN
		IF OBJECT_ID(N'dbo.sysdiagrams') IS NOT NULL
			return 0;
	
		CREATE TABLE dbo.sysdiagrams
		(
			name sysname NOT NULL,
			principal_id int NOT NULL,	-- we may change it to varbinary(85)
			diagram_id int PRIMARY KEY IDENTITY,
			version int,
	
			definition varbinary(max)
			CONSTRAINT UK_principal_name UNIQUE
			(
				principal_id,
				name
			)
		);


		/* Add this if we need to have some form of extended properties for diagrams */
		/*
		IF OBJECT_ID(N'dbo.sysdiagram_properties') IS NULL
		BEGIN
			CREATE TABLE dbo.sysdiagram_properties
			(
				diagram_id int,
				name sysname,
				value varbinary(max) NOT NULL
			)
		END
		*/

		IF OBJECT_ID(N'dbo.dtproperties') IS NOT NULL
		begin
			insert into dbo.sysdiagrams
			(
				[name],
				[principal_id],
				[version],
				[definition]
			)
			select	 
				convert(sysname, dgnm.[uvalue]),
				DATABASE_PRINCIPAL_ID(N'dbo'),			-- will change to the sid of sa
				0,							-- zero for old format, dgdef.[version],
				dgdef.[lvalue]
			from dbo.[dtproperties] dgnm
				inner join dbo.[dtproperties] dggd on dggd.[property] = 'DtgSchemaGUID' and dggd.[objectid] = dgnm.[objectid]	
				inner join dbo.[dtproperties] dgdef on dgdef.[property] = 'DtgSchemaDATA' and dgdef.[objectid] = dgnm.[objectid]
				
			where dgnm.[property] = 'DtgSchemaNAME' and dggd.[uvalue] like N'_EA3E6268-D998-11CE-9454-00AA00A3F36E_' 
			return 2;
		end
		return 1;
	END
GO

-- ===== VIEW: dbo.View_Pegawai
CREATE VIEW [dbo].[View_Pegawai] AS SELECT dbo.M_PEGAWAI.peg_id, dbo.M_PEGAWAI.nama, dbo.M_PEGAWAI.nik, dbo.M_PEGAWAI.tipe_id, dbo.M_PEGAWAI.alamat, dbo.M_PEGAWAI.tgl_lahir, dbo.M_PEGAWAI.tempat_lahir, dbo.M_PEGAWAI.kelamin, dbo.M_PEGAWAI.status, 
                  dbo.M_PEGAWAI.pendidikan, dbo.M_PEGAWAI.telepon, dbo.M_PEGAWAI.no_ktp, dbo.M_PEGAWAI.npwp, dbo.M_PEGAWAI.norek, dbo.M_PEGAWAI.nama_rek, dbo.M_PEGAWAI.nobpjs, dbo.M_PEGAWAI.jab_id, 
                  dbo.M_PEGAWAI_JABATAN.jab_desc, dbo.M_PEGAWAI.divisi_id, dbo.M_DIVISI.divisi_desc, dbo.M_PEGAWAI.shift_id, dbo.M_PEGAWAI_SHIFT.nama AS nama_shift, dbo.M_PEGAWAI.user_entry, dbo.M_PEGAWAI.tgl_entry, 
                  dbo.M_PEGAWAI.group_peg_id, dbo.M_PEGAWAI_GROUP.nama AS nama_group
FROM     dbo.M_PEGAWAI LEFT OUTER JOIN
                  dbo.M_PEGAWAI_GROUP ON dbo.M_PEGAWAI.group_peg_id = dbo.M_PEGAWAI_GROUP.group_peg_id LEFT OUTER JOIN
                  dbo.M_PEGAWAI_JABATAN ON dbo.M_PEGAWAI.jab_id = dbo.M_PEGAWAI_JABATAN.jab_id LEFT OUTER JOIN
                  dbo.M_DIVISI ON dbo.M_PEGAWAI.divisi_id = dbo.M_DIVISI.divisi_id LEFT OUTER JOIN
                  dbo.M_PEGAWAI_SHIFT ON dbo.M_PEGAWAI.shift_id = dbo.M_PEGAWAI_SHIFT.shift_id
WHERE  (ISNULL(dbo.M_PEGAWAI.flag_active, 'N') = 'Y')
GO

-- ===== VIEW: dbo.View_Pegawai_Kontrak
CREATE VIEW dbo.View_Pegawai_Kontrak
AS
SELECT a.peg_id, a.nik, b.nama, a.cust_id, c.nama AS cust_name, a.divisi_id, d.divisi_desc, a.jab_id, e.jab_desc, a.tipe_id, f.tipe_desc, b.shift_id, g.nama AS nama_shift, c.jam_masuk, c.jam_masuk2, c.jam_keluar, c.jam_keluar2, b.tipe_gaji_id, b.bpjs_rp, b.status, b.tgl_lahir, b.tempat_lahir, 
             b.kelamin, b.pendidikan, b.telepon, b.no_ktp, b.norek, b.nama_rek, a.tgl_awal, a.tgl_akhir, b.flag_active, b.flag_gaji, b.group_gaji, b.group_peg_id, h.nama AS nama_group, h.premi, b.foto, b.face_id, ISNULL(a.status_aktif, 0) AS status_aktif
FROM   dbo.M_PEGAWAI_KONTRAK AS a LEFT OUTER JOIN
             dbo.M_PEGAWAI AS b ON a.peg_id = b.peg_id LEFT OUTER JOIN
             dbo.M_CUSTOMER AS c ON a.cust_id = c.cust_id LEFT OUTER JOIN
             dbo.M_DIVISI AS d ON a.divisi_id = d.divisi_id LEFT OUTER JOIN
             dbo.M_PEGAWAI_JABATAN AS e ON b.jab_id = e.jab_id LEFT OUTER JOIN
             dbo.M_TIPE_PEGAWAI AS f ON a.tipe_id = f.tipe_id LEFT OUTER JOIN
             dbo.M_PEGAWAI_SHIFT AS g ON b.shift_id = g.shift_id LEFT OUTER JOIN
             dbo.M_PEGAWAI_GROUP AS h ON b.group_peg_id = h.group_peg_id
WHERE (ISNULL(a.status_pegangan, 0) = 0) AND (ISNULL(a.status_aktif, 0) = 1)
GO

-- ===== VIEW: dbo.View_Pegawai_Kontrak_Gaji
CREATE VIEW [dbo].[View_Pegawai_Kontrak_Gaji] AS SELECT a.peg_id, b.nik, b.nama, a2.cust_id, c.cust_name, a2.divisi_id, d.divisi_desc, a2.jab_id, e.jab_desc, a2.tipe_id, f.tipe_desc, b.shift_id, g.nama AS nama_shift, c.jam_masuk, c.jam_masuk2, c.jam_keluar, c.jam_keluar2, b.tipe_gaji_id, b.bpjs_rp, 
                  b.status, b.tgl_lahir, b.tempat_lahir, b.kelamin, b.pendidikan, b.telepon, b.no_ktp, b.norek, b.nama_rek, a2.tgl_awal, a2.tgl_akhir, b.flag_active, b.flag_gaji, b.group_gaji, b.group_peg_id, h.nama AS nama_group, h.premi, b.foto, b.face_id
FROM     (SELECT peg_id, MAX(kontrak_id) AS kontrak_id
                  FROM      dbo.M_PEGAWAI_KONTRAK
                  GROUP BY peg_id) AS a LEFT OUTER JOIN
                  dbo.M_PEGAWAI_KONTRAK AS a2 ON a.kontrak_id = a2.kontrak_id LEFT OUTER JOIN
                  dbo.M_PEGAWAI AS b ON a.peg_id = b.peg_id LEFT OUTER JOIN
                  dbo.M_Customer AS c ON a2.cust_id = c.cust_id LEFT OUTER JOIN
                  dbo.M_DIVISI AS d ON a2.divisi_id = d.divisi_id LEFT OUTER JOIN
                  dbo.M_PEGAWAI_JABATAN AS e ON b.jab_id = e.jab_id LEFT OUTER JOIN
                  dbo.M_TIPE_PEGAWAI AS f ON a2.tipe_id = f.tipe_id LEFT OUTER JOIN
                  dbo.M_PEGAWAI_SHIFT AS g ON b.shift_id = g.shift_id LEFT OUTER JOIN
                  dbo.M_PEGAWAI_GROUP AS h ON b.group_peg_id = h.group_peg_id
WHERE  (ISNULL(b.flag_gaji, 'N') = 'Y')
GO

-- ===== VIEW: dbo.View_produk
CREATE VIEW dbo.View_produk
AS
SELECT a.produk_id, a.nama, a.nama_pendek, a.nama_pendek2, a.hbeli, a.hjual, a.hgrosir, a.pembilang, a.penyebut, a.hjual_barcode, a.mall_barcode, a.brand_id, b.nama AS brand, a.gender_id, c.nama AS gender, a.grup_dept, d.nama AS grup, a.dept_id, e.nama AS dept, a.bahan_id, 
             f.nama AS bahan, a.nomor, a.period, a.model_id, a.warna_id, g.nama AS warna, a.size_id, h.nama AS size, h.urut AS urut_size, a.qty_barcode, a.produk_id_lama, a.usrupd, a.usrtgl, a.supp_id, a.tipe_id, a.jenis_id, i.nama AS jenis, a.model_produk, a.aps_id, j.nama AS aplikasi, 
             ISNULL(a.flag_aktif, 0) AS flag_aktif, a.kode_mall, DATEDIFF(day, a1.period, GETDATE()) / 30 AS umur, a1.model_id_lama
FROM   dbo.M_PRODUK AS a WITH (NOLOCK) LEFT OUTER JOIN
             dbo.M_PRODUK_MODEL AS a1 WITH (NOLOCK) ON a.model_id = a1.model_id AND a1.flag_aktif = 1 LEFT OUTER JOIN
             dbo.M_PRODUK_BRAND AS b WITH (NOLOCK) ON a.brand_id = b.brand_id LEFT OUTER JOIN
             dbo.M_PRODUK_GENDER AS c WITH (NOLOCK) ON a.gender_id = c.gender_id LEFT OUTER JOIN
             dbo.M_PRODUK_DEPT AS d WITH (NOLOCK) ON a.grup_dept = d.grup_dept LEFT OUTER JOIN
             dbo.M_PRODUK_DEPT2 AS e WITH (NOLOCK) ON a.grup_dept = e.grup_dept AND a.dept_id = e.dept_id LEFT OUTER JOIN
             dbo.M_PRODUK_BAHAN AS f WITH (NOLOCK) ON a.bahan_id = f.bahan_id LEFT OUTER JOIN
             dbo.M_PRODUK_WARNA AS g WITH (NOLOCK) ON a.warna_id = g.warna_id LEFT OUTER JOIN
             dbo.M_PRODUK_SIZE AS h WITH (NOLOCK) ON a.size_id = h.size_id LEFT OUTER JOIN
             dbo.M_PRODUK_JENIS AS i WITH (NOLOCK) ON a.jenis_id = i.jenis_id LEFT OUTER JOIN
             dbo.M_APLIKASI AS j WITH (NOLOCK) ON a.aps_id = j.aps_id
WHERE (ISNULL(a1.flag_aktif, 1) = 1)
GO
