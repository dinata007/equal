# Struktur database SENJA_DEMO

Dibuat otomatis oleh `npm run db:schema` pada 23/10/2026, 05.35.58. Isi data tidak disertakan, kecuali contoh nilai kolom kode pendek (≤ 3 karakter, mis. status/flag) beserta jumlahnya.

- SQL Server 15.0.2000.5 (Enterprise Edition (64-bit)), compatibility level 140, collation `SQL_Latin1_General_CP1_CI_AS`
- 222 tabel, 4 view, 29 stored procedure, 5 function, 0 trigger
- Katalog PowerBuilder (`pbcatcol`, `pbcatedt`, `pbcatfmt`, `pbcattbl`, `pbcatvld`) tidak dirinci; label kolomnya (0 entri) dipakai di kolom "Label / keterangan"

## Ringkasan tabel

| Tabel | Baris | Kolom | Primary key | Relasi | Keterangan |
|---|---:|---:|---|---:|---|
| [dbo.a_upt_hrg](#dboa_upt_hrg) | 761 | 3 | produk_id |  |  |
| [dbo.aa](#dboaa) | 26 | 5 | peg_id |  |  |
| [dbo.aaa](#dboaaa) | 3.315 | 2 | model_id |  |  |
| [dbo.aaaa](#dboaaaa) | 1.277 | 5 | id_baru |  |  |
| [dbo.aaaaaa](#dboaaaaaa) | 9.351 | 2 | model_id |  |  |
| [dbo.aabb](#dboaabb) | 9.354 | 2 | model_id |  |  |
| [dbo.ab](#dboab) | 0 | 3 | art_id, art_id2 |  |  |
| [dbo.ap_01db](#dboap_01db) | 5 | 4 | — |  |  |
| [dbo.ap_01sh](#dboap_01sh) | 30 | 41 | — |  |  |
| [dbo.ap_beli_dtl](#dboap_beli_dtl) | 2 | 9 | — |  |  |
| [dbo.ap_beli_hdr](#dboap_beli_hdr) | 6 | 15 | — |  |  |
| [dbo.ap_ccoa](#dboap_ccoa) | 71 | 4 | brand, supp_id |  |  |
| [dbo.ap_compro_master](#dboap_compro_master) | 10 | 6 | — |  |  |
| [dbo.ap_fak_dtl](#dboap_fak_dtl) | 0 | 10 | — |  |  |
| [dbo.ap_fak_hdr](#dboap_fak_hdr) | 0 | 20 | — |  |  |
| [dbo.ap_giro_detail](#dboap_giro_detail) | 0 | 15 | bukti_giro, bukti, brand_id |  |  |
| [dbo.ap_giro_master](#dboap_giro_master) | 0 | 19 | site_id, brand_id |  |  |
| [dbo.ap_ink_dtl](#dboap_ink_dtl) | 0 | 36 | — |  |  |
| [dbo.ap_ink_hdr](#dboap_ink_hdr) | 0 | 16 | — |  |  |
| [dbo.ap_lbm_dtl](#dboap_lbm_dtl) | 0 | 4 | — |  |  |
| [dbo.ap_lbm_hdr](#dboap_lbm_hdr) | 0 | 10 | — |  |  |
| [dbo.ap_minta_dtl](#dboap_minta_dtl) | 8 | 12 | — |  |  |
| [dbo.ap_minta_hdr](#dboap_minta_hdr) | 9 | 8 | — |  |  |
| [dbo.ap_po_bom](#dboap_po_bom) | 0 | 5 | — |  |  |
| [dbo.ap_po_componen](#dboap_po_componen) | 0 | 15 | — |  |  |
| [dbo.ap_po_dtl](#dboap_po_dtl) | 0 | 5 | — |  |  |
| [dbo.ap_po_hdr](#dboap_po_hdr) | 0 | 37 | — |  |  |
| [dbo.ap_po_problem](#dboap_po_problem) | 0 | 8 | — |  |  |
| [dbo.ap_po_progress](#dboap_po_progress) | 0 | 7 | — |  |  |
| [dbo.ap_rinci_po](#dboap_rinci_po) | 0 | 11 | — |  |  |
| [dbo.ap_supplier](#dboap_supplier) | 0 | 19 | — |  |  |
| [dbo.ap_supplierc](#dboap_supplierc) | 0 | 2 | — |  |  |
| [dbo.ap_trans1](#dboap_trans1) | 22.684 | 19 | bukti_ap, site_id, brand_id |  |  |
| [dbo.ap_trans1_awal](#dboap_trans1_awal) | 0 | 7 | — |  |  |
| [dbo.ap_trans1_awal1](#dboap_trans1_awal1) | 0 | 10 | — |  |  |
| [dbo.ar_trans1](#dboar_trans1) | 31.128 | 17 | bukti, site_id, brand_id |  |  |
| [dbo.attend](#dboattend) | 21.169 | 57 | attend_id |  |  |
| [dbo.attend_backup](#dboattend_backup) | 70 | 49 | att_id |  |  |
| [dbo.cb_close](#dbocb_close) | 20 | 10 | — |  |  |
| [dbo.cb_close_dt](#dbocb_close_dt) | 0 | 9 | — |  |  |
| [dbo.cb_journal](#dbocb_journal) | 8.587 | 32 | no_urut, site_id, brand_id |  |  |
| [dbo.cb_journal_detail](#dbocb_journal_detail) | 56.983 | 22 | no_urut, site_id, no_line, brand_id | 1 |  |
| [dbo.cb_master](#dbocb_master) | 13 | 10 | site_id, kd_bank, brand_id |  |  |
| [dbo.cb_pecahan](#dbocb_pecahan) | 0 | 3 | — |  |  |
| [dbo.Desty_ListOrder](#dbodesty_listorder) | 13.104 | 18 | LineID |  |  |
| [dbo.Desty_LogError](#dbodesty_logerror) | 9.273 | 8 | LogID |  |  |
| [dbo.Desty_Order1](#dbodesty_order1) | 12.748 | 33 | orderId |  |  |
| [dbo.Desty_Order2](#dbodesty_order2) | 14.378 | 11 | LineID | 1 |  |
| [dbo.failed_jobs](#dbofailed_jobs) | 0 | 7 | id |  |  |
| [dbo.gl_aset](#dbogl_aset) | 983 | 31 | bukti, site_id, brand_id |  |  |
| [dbo.gl_aset_dtl](#dbogl_aset_dtl) | 1.569 | 34 | bukti, site_id, brand_id, urut, bl_berjalan, tgl_berjalan |  |  |
| [dbo.gl_balance](#dbogl_balance) | 3.277 | 12 | site_id, periode, account_id, brand_id |  |  |
| [dbo.gl_budget](#dbogl_budget) | 2.124 | 4 | — |  |  |
| [dbo.gl_budget_cc](#dbogl_budget_cc) | 0 | 5 | — |  |  |
| [dbo.gl_budget_cf](#dbogl_budget_cf) | 0 | 4 | — |  |  |
| [dbo.gl_cc](#dbogl_cc) | 52 | 5 | cc_id, site_id, brand_id |  |  |
| [dbo.gl_cf](#dbogl_cf) | 11 | 5 | — |  |  |
| [dbo.gl_coa](#dbogl_coa) | 869 | 14 | site_id, account_id, brand_id |  |  |
| [dbo.gl_coa_alocation](#dbogl_coa_alocation) | 0 | 5 | — |  |  |
| [dbo.gl_coax](#dbogl_coax) | 447 | 14 | site_id, account_id, brand_id |  |  |
| [dbo.gl_currency](#dbogl_currency) | 0 | 3 | — |  |  |
| [dbo.gl_exchange](#dbogl_exchange) | 0 | 5 | — |  |  |
| [dbo.gl_journal](#dbogl_journal) | 66.523 | 13 | site_id, voucher, brand_id |  |  |
| [dbo.gl_journal_detail](#dbogl_journal_detail) | 237.260 | 17 | site_id, voucher, no_urut, account_id, brand_id | 1 |  |
| [dbo.gl_journal_form](#dbogl_journal_form) | 0 | 2 | — |  |  |
| [dbo.gl_journal_form_detail](#dbogl_journal_form_detail) | 0 | 7 | — |  |  |
| [dbo.gl_ledger](#dbogl_ledger) | 41 | 5 | — |  |  |
| [dbo.gl_report](#dbogl_report) | 2 | 5 | site_id, report_id, brand_id |  |  |
| [dbo.gl_report_detail](#dbogl_report_detail) | 80 | 16 | site_id, report_id, report_line, brand_id |  |  |
| [dbo.gl_site](#dbogl_site) | 18 | 5 | site_id |  |  |
| [dbo.gl_tipe](#dbogl_tipe) | 10 | 3 | — |  |  |
| [dbo.gl_tjournal](#dbogl_tjournal) | 3 | 5 | journal_id, site_id, brand_id |  |  |
| [dbo.im_roll_acc](#dboim_roll_acc) | 6 | 4 | merk_id1, merk_id2 |  |  |
| [dbo.M_APLIKASI](#dbom_aplikasi) | 20 | 4 | aps_id |  |  |
| [dbo.M_APLIKASIX](#dbom_aplikasix) | 12 | 2 | aps_id |  |  |
| [dbo.m_bahan_acc](#dbom_bahan_acc) | 10 | 5 | acc_ap_id, brand_id |  |  |
| [dbo.m_bahan_art](#dbom_bahan_art) | 3.045 | 39 | art_id, brand_id |  |  |
| [dbo.m_bahan_dept](#dbom_bahan_dept) | 13 | 3 | dept_id |  |  |
| [dbo.m_bahan_induk](#dbom_bahan_induk) | 15 | 12 | induk_id |  |  |
| [dbo.m_bahan_jenis](#dbom_bahan_jenis) | 108 | 9 | jenis_id |  |  |
| [dbo.m_bahan_sat](#dbom_bahan_sat) | 10 | 3 | sat_id |  |  |
| [dbo.m_bahan_tipe](#dbom_bahan_tipe) | 13 | 4 | tipe_id |  |  |
| [dbo.m_bahan_warna](#dbom_bahan_warna) | 35 | 4 | warna_id |  |  |
| [dbo.M_BANK](#dbom_bank) | 10 | 3 | bank_id |  |  |
| [dbo.M_CLOSING](#dbom_closing) | 4 | 2 | tipe |  |  |
| [dbo.M_CUSTOMER](#dbom_customer) | 2.519 | 24 | site_id, cust_id |  |  |
| [dbo.M_DIVISI](#dbom_divisi) | 6 | 2 | divisi_id |  |  |
| [dbo.M_DIVISI_GROUP](#dbom_divisi_group) | 0 | 2 | — |  |  |
| [dbo.M_EKSPEDISI](#dbom_ekspedisi) | 12 | 6 | ekspedisi_id |  |  |
| [dbo.M_GAJI_UMR](#dbom_gaji_umr) | 1 | 22 | umr_id |  |  |
| [dbo.M_PEGAWAI](#dbom_pegawai) | 62 | 52 | peg_id |  |  |
| [dbo.M_PEGAWAI_GROUP](#dbom_pegawai_group) | 6 | 3 | group_peg_id |  |  |
| [dbo.M_PEGAWAI_IZIN_TIPE](#dbom_pegawai_izin_tipe) | 27 | 8 | id |  |  |
| [dbo.M_PEGAWAI_JABATAN](#dbom_pegawai_jabatan) | 26 | 12 | jab_id |  |  |
| [dbo.M_PEGAWAI_JABATAN_LEVEL](#dbom_pegawai_jabatan_level) | 0 | 6 | level_id | 1 |  |
| [dbo.M_PEGAWAI_KONTRAK](#dbom_pegawai_kontrak) | 138 | 20 | kontrak_id | 1 |  |
| [dbo.M_PEGAWAI_LEMBUR](#dbom_pegawai_lembur) | 19 | 5 | lembur_id |  |  |
| [dbo.M_PEGAWAI_SHIFT](#dbom_pegawai_shift) | 2 | 7 | shift_id |  |  |
| [dbo.M_PEGAWAI_TUNJANGAN](#dbom_pegawai_tunjangan) | 19 | 17 | tunj_id |  |  |
| [dbo.M_PRODUK](#dbom_produk) | 232.985 | 32 | produk_id | 8 |  |
| [dbo.M_PRODUK_BAHAN](#dbom_produk_bahan) | 132 | 6 | bahan_id |  |  |
| [dbo.M_PRODUK_BAHANX](#dbom_produk_bahanx) | 82 | 2 | bahan_id |  |  |
| [dbo.M_PRODUK_BRAND](#dbom_produk_brand) | 8 | 6 | brand_id |  |  |
| [dbo.M_PRODUK_DEPT](#dbom_produk_dept) | 14 | 8 | grup_dept |  |  |
| [dbo.M_PRODUK_DEPT2](#dbom_produk_dept2) | 7.212 | 8 | grup_dept, dept_id | 1 |  |
| [dbo.M_PRODUK_DEPT2X](#dbom_produk_dept2x) | 7.114 | 2 | dept_id |  |  |
| [dbo.M_PRODUK_DEPT2XX](#dbom_produk_dept2xx) | 7.119 | 8 | grup_dept, dept_id |  |  |
| [dbo.M_PRODUK_DEPT2xxxx](#dbom_produk_dept2xxxx) | 666 | 8 | grup_dept, dept_id |  |  |
| [dbo.M_PRODUK_DEPTxxxx](#dbom_produk_deptxxxx) | 0 | 8 | grup_dept |  |  |
| [dbo.M_PRODUK_GENDER](#dbom_produk_gender) | 5 | 5 | gender_id |  |  |
| [dbo.M_PRODUK_JENIS](#dbom_produk_jenis) | 55 | 6 | jenis_id |  |  |
| [dbo.M_PRODUK_MODEL](#dbom_produk_model) | 33.586 | 35 | model_id |  |  |
| [dbo.M_PRODUK_MODEL_SIZE](#dbom_produk_model_size) | 74.507 | 9 | model_id, size_id |  |  |
| [dbo.M_produk_model_xxx](#dbom_produk_model_xxx) | 0 | 35 | model_id |  |  |
| [dbo.M_PRODUK_MODEL2](#dbom_produk_model2) | 66.133 | 4 | model_id, warna_id | 1 |  |
| [dbo.M_PRODUK_MODEL3](#dbom_produk_model3) | 109.137 | 4 | model_id, size_id | 1 |  |
| [dbo.M_PRODUK_MODELX](#dbom_produk_modelx) | 13.191 | 29 | model_id |  |  |
| [dbo.M_PRODUK_MODELXXX](#dbom_produk_modelxxx) | 9.871 | 26 | model_id |  |  |
| [dbo.M_PRODUK_SIZE](#dbom_produk_size) | 29 | 7 | size_id |  |  |
| [dbo.M_PRODUK_SLS_TIPE](#dbom_produk_sls_tipe) | 5 | 2 | sls_tipe |  |  |
| [dbo.M_PRODUK_TIPE](#dbom_produk_tipe) | 6 | 4 | tipe_id |  |  |
| [dbo.M_PRODUK_UPHARGA](#dbom_produk_upharga) | 0 | 5 | bukti, brand_id |  |  |
| [dbo.M_PRODUK_WARNA](#dbom_produk_warna) | 158 | 5 | warna_id |  |  |
| [dbo.M_produk_xxx](#dbom_produk_xxx) | 0 | 32 | produk_id |  |  |
| [dbo.M_REKENING](#dbom_rekening) | 1 | 3 | bank_id, norek | 1 |  |
| [dbo.M_Setup](#dbom_setup) | 1 | 1 | — |  |  |
| [dbo.m_status](#dbom_status) | 7 | 4 | status_id, brand_id |  |  |
| [dbo.M_SUPPLIER](#dbom_supplier) | 338 | 12 | supp_id, brand_id |  |  |
| [dbo.M_SUPPLIER0](#dbom_supplier0) | 8 | 12 | supp_id |  |  |
| [dbo.m_supplier2](#dbom_supplier2) | 0 | 5 | kd1, br, kd2 |  |  |
| [dbo.M_SUPPLIERx](#dbom_supplierx) | 116 | 15 | supp_id |  |  |
| [dbo.M_SUPPLIERxx](#dbom_supplierxx) | 116 | 12 | supp_id, brand_id |  |  |
| [dbo.M_TABLE_PRO](#dbom_table_pro) | 12 | 4 | line_id |  |  |
| [dbo.M_TIPE_GAJI](#dbom_tipe_gaji) | 3 | 2 | tipe_gaji_id |  |  |
| [dbo.M_TIPE_PEGAWAI](#dbom_tipe_pegawai) | 3 | 2 | tipe_id |  |  |
| [dbo.M_tipe_telat](#dbom_tipe_telat) | 6 | 3 | telat_id |  |  |
| [dbo.M_TOKO](#dbom_toko) | 17 | 20 | toko_id |  |  |
| [dbo.M_TOKO_DTL](#dbom_toko_dtl) | 4 | 3 | toko_id, brand_id |  |  |
| [dbo.M_TOKO2](#dbom_toko2) | 8 | 21 | toko_id, toko_id2 |  |  |
| [dbo.M_TOKO3](#dbom_toko3) | 4.310 | 17 | toko_id, toko_id2, pembeli_id |  |  |
| [dbo.M_USERS](#dbom_users) | 0 | 44 | peg_id |  |  |
| [dbo.mc_saldo_awal](#dbomc_saldo_awal) | 0 | 9 | — |  |  |
| [dbo.migrations](#dbomigrations) | 11 | 3 | id |  |  |
| [dbo.oauth_access_tokens](#dbooauth_access_tokens) | 3 | 9 | id |  |  |
| [dbo.oauth_auth_codes](#dbooauth_auth_codes) | 0 | 6 | id |  |  |
| [dbo.oauth_clients](#dbooauth_clients) | 4 | 11 | id |  |  |
| [dbo.oauth_personal_access_clients](#dbooauth_personal_access_clients) | 2 | 4 | id |  |  |
| [dbo.oauth_refresh_tokens](#dbooauth_refresh_tokens) | 0 | 4 | id |  |  |
| [dbo.ob_bahan_cost_dtl](#dboob_bahan_cost_dtl) | 98.356 | 9 | bukti, urut, art_id, brand_id | 1 |  |
| [dbo.ob_bahan_cost_hdr](#dboob_bahan_cost_hdr) | 30.829 | 19 | bukti, brand_id |  |  |
| [dbo.ob_bahan_gd_dtl](#dboob_bahan_gd_dtl) | 5.711 | 27 | bukti, urut, art_id, brand_id | 2 |  |
| [dbo.ob_bahan_gd_hdr](#dboob_bahan_gd_hdr) | 1.688 | 24 | bukti, brand_id |  |  |
| [dbo.ob_bahan_gdrol_dtl](#dboob_bahan_gdrol_dtl) | 1.118 | 24 | bukti, urut, art_id, brand_id | 1 |  |
| [dbo.ob_bahan_gdrol_hdr](#dboob_bahan_gdrol_hdr) | 874 | 18 | bukti, brand_id |  |  |
| [dbo.ob_bahan_jual_dtl](#dboob_bahan_jual_dtl) | 34.674 | 20 | bukti, urut, brand_id | 2 |  |
| [dbo.ob_bahan_jual_hdr](#dboob_bahan_jual_hdr) | 9.570 | 23 | bukti, brand_id |  |  |
| [dbo.ob_bahan_keluar_dtl](#dboob_bahan_keluar_dtl) | 0 | 28 | bukti, urut, art_id, brand_id | 2 |  |
| [dbo.ob_bahan_keluar_hdr](#dboob_bahan_keluar_hdr) | 0 | 27 | bukti, brand_id |  |  |
| [dbo.ob_bahan_kirim_dtl](#dboob_bahan_kirim_dtl) | 25.131 | 25 | bukti, urut, art_id, brand_id | 1 |  |
| [dbo.ob_bahan_kirim_hdr](#dboob_bahan_kirim_hdr) | 4.976 | 33 | bukti, brand_id |  |  |
| [dbo.ob_bahan_pakai_dtl](#dboob_bahan_pakai_dtl) | 1 | 18 | bukti, urut, brand_id | 1 |  |
| [dbo.ob_bahan_pakai_hdr](#dboob_bahan_pakai_hdr) | 1 | 18 | bukti, brand_id |  |  |
| [dbo.ob_bahan_po_dtl](#dboob_bahan_po_dtl) | 2.883 | 24 | bukti, art_id, urut | 1 |  |
| [dbo.ob_bahan_po_hdr](#dboob_bahan_po_hdr) | 1.006 | 35 | bukti |  |  |
| [dbo.ob_bahan_roll_dtl](#dboob_bahan_roll_dtl) | 562 | 24 | bukti, urut, art_id, art_id2, brand_id | 1 |  |
| [dbo.ob_bahan_roll_hdr](#dboob_bahan_roll_hdr) | 440 | 24 | bukti, brand_id |  |  |
| [dbo.ob_bahan_trans](#dboob_bahan_trans) | 19 | 4 | — |  |  |
| [dbo.password_resets](#dbopassword_resets) | 0 | 3 | — |  |  |
| [dbo.personal_access_tokens](#dbopersonal_access_tokens) | 0 | 9 | id |  |  |
| [dbo.S_AWAL_GUDANG](#dbos_awal_gudang) | 379.295 | 3 | periode, produk_id |  |  |
| [dbo.S_AWAL_TOKO](#dbos_awal_toko) | 47.945 | 5 | toko_id, periode, produk_id |  |  |
| [dbo.saldo_awal_art](#dbosaldo_awal_art) | 138.241 | 8 | brand_id, periode, art_id, sts_byr |  |  |
| [dbo.saldo_awal_art_supp](#dbosaldo_awal_art_supp) | 9.171 | 7 | supp_id, sts_byr, periode, art_id |  |  |
| [dbo.SYS_MODULE](#dbosys_module) | 11 | 5 | module_id |  |  |
| [dbo.SYS_PROGRAM](#dbosys_program) | 185 | 5 | module_id, submodule_id, program_id | 1 |  |
| [dbo.SYS_SETUP](#dbosys_setup) | 1 | 25 | company |  |  |
| [dbo.SYS_SETUP_DTL](#dbosys_setup_dtl) | 4 | 40 | brand_id |  |  |
| [dbo.SYS_SUBMODULE](#dbosys_submodule) | 0 | 3 | module_id, submodule_id |  |  |
| [dbo.SYS_USER](#dbosys_user) | 43 | 12 | user_id | 1 |  |
| [dbo.SYS_USERPROGRAM](#dbosys_userprogram) | 4.652 | 11 | user_id, module_id, submodule_id, program_id | 2 |  |
| [dbo.sysdiagrams](#dbosysdiagrams) | 14 | 5 | diagram_id |  |  |
| [dbo.T_BELI1](#dbot_beli1) | 30.246 | 55 | bukti, brand_id |  |  |
| [dbo.T_BELI2](#dbot_beli2) | 222.848 | 9 | bukti, produk_id, brand_id | 1 |  |
| [dbo.T_GIT1](#dbot_git1) | 31.654 | 13 | bukti |  |  |
| [dbo.T_GIT2](#dbot_git2) | 237.355 | 8 | bukti, produk_id | 1 |  |
| [dbo.T_GUDANG1](#dbot_gudang1) | 58.886 | 26 | bukti |  |  |
| [dbo.T_GUDANG2](#dbot_gudang2) | 438.727 | 13 | bukti, produk_id | 1 |  |
| [dbo.T_JUAL1](#dbot_jual1) | 27.844 | 13 | bukti |  |  |
| [dbo.T_JUAL2](#dbot_jual2) | 209.963 | 10 | bukti, produk_id | 1 |  |
| [dbo.T_OPNAME](#dbot_opname) | 31.791 | 6 | periode, produk_id |  |  |
| [dbo.T_OPNAME_RAW](#dbot_opname_raw) | 5.160 | 8 | periode, brand_id, art_id |  |  |
| [dbo.T_OPNAME_RAW_TEMP](#dbot_opname_raw_temp) | 1 | 2 | art_id |  |  |
| [dbo.T_OPNAME_TEMP](#dbot_opname_temp) | 2 | 4 | periode, noo, produk_id |  |  |
| [dbo.T_OPNAME_TOKO](#dbot_opname_toko) | 52.892 | 7 | toko_id, periode, produk_id |  |  |
| [dbo.T_PAYMENT](#dbot_payment) | 13.902 | 12 | site_id, bukti |  |  |
| [dbo.T_PEG_CUTI](#dbot_peg_cuti) | 95 | 6 | periode, peg_id |  |  |
| [dbo.T_PEGAWAI_IZIN](#dbot_pegawai_izin) | 3.658 | 22 | izin_id |  |  |
| [dbo.T_PENGGAJIAN](#dbot_penggajian) | 0 | 31 | gaji_id |  |  |
| [dbo.T_PO_PRINT](#dbot_po_print) | 30.462 | 145 | bukti, brand_id |  |  |
| [dbo.T_PRO_PLAN1](#dbot_pro_plan1) | 4 | 10 | bukti |  |  |
| [dbo.T_PRO_PLAN2](#dbot_pro_plan2) | 7.047 | 18 | bukti, model_id, produk_id |  |  |
| [dbo.T_ROLLGD1](#dbot_rollgd1) | 0 | 14 | site_id, bukti |  |  |
| [dbo.T_ROLLGD2](#dbot_rollgd2) | 0 | 25 | site_id, bukti, URUT |  |  |
| [dbo.T_ROLLING1](#dbot_rolling1) | 299 | 16 | site_id, bukti |  |  |
| [dbo.T_ROLLING2](#dbot_rolling2) | 14.811 | 8 | site_id, bukti, produk_id | 1 |  |
| [dbo.T_SALES_BYR](#dbot_sales_byr) | 54.044 | 13 | Urut |  |  |
| [dbo.T_SALES_BYR_TEMP](#dbot_sales_byr_temp) | 1 | 12 | Urut |  |  |
| [dbo.T_SALES_UPLOAD](#dbot_sales_upload) | 43.364 | 39 | Urut |  |  |
| [dbo.T_SALES3](#dbot_sales3) | 50.234 | 18 | site_id, bukti |  |  |
| [dbo.T_SALES4](#dbot_sales4) | 57.658 | 11 | site_id, bukti, produk_id, urut | 1 |  |
| [dbo.T_TOKO1](#dbot_toko1) | 106.583 | 54 | site_id, bukti |  |  |
| [dbo.T_TOKO1_BIAYA](#dbot_toko1_biaya) | 0 | 52 | site_id, bukti |  |  |
| [dbo.T_TOKO2](#dbot_toko2) | 1.798.583 | 19 | site_id, bukti, produk_id | 1 |  |
| [dbo.T_TOKO2_BIAYA](#dbot_toko2_biaya) | 0 | 19 | site_id, bukti, produk_id | 1 |  |
| [dbo.T_TOKO2XX](#dbot_toko2xx) | 751.395 | 19 | site_id, bukti, produk_id |  |  |
| [dbo.T_TOKOX1](#dbot_tokox1) | 10.227 | 31 | site_id, bukti |  |  |
| [dbo.T_TOKOX2](#dbot_tokox2) | 388.395 | 16 | site_id, bukti, produk_id |  |  |
| [dbo.T_TOKOXX1](#dbot_tokoxx1) | 10.843 | 31 | site_id, bukti |  |  |
| [dbo.T_TOKOXX2](#dbot_tokoxx2) | 414.873 | 16 | site_id, bukti, produk_id |  |  |
| [dbo.T_TOKOXXX1](#dbot_tokoxxx1) | 1.324 | 54 | bukti |  |  |
| [dbo.T_TOKOXXX2](#dbot_tokoxxx2) | 4.945 | 19 | bukti, produk_id |  |  |
| [dbo.users](#dbousers) | 28 | 15 | id |  |  |

<a id="dboa_upt_hrg"></a>
## dbo.a_upt_hrg

761 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| produk_id | varchar(50) |  | PK |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual_barcode_old | numeric(15,0) | ✓ |  | ((0)) |  |  |

<a id="dboaa"></a>
## dbo.aa

26 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| peg_id | bigint |  | PK |  |  |  |
| nik1 | varchar(20) | ✓ |  |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nik2 | varchar(20) | ✓ |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |

<a id="dboaaa"></a>
## dbo.aaa

3.315 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| model_produk | varchar(25) | ✓ |  |  |  |  |

<a id="dboaaaa"></a>
## dbo.aaaa

1.277 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id_baru | varchar(50) |  | PK |  |  |  |
| id_lama | varchar(50) | ✓ |  |  |  |  |
| qty | numeric(10,0) | ✓ |  |  |  |  |
| hgrosir | numeric(10,0) | ✓ |  |  |  |  |
| hbarcode | numeric(10,0) | ✓ |  |  |  |  |

<a id="dboaaaaaa"></a>
## dbo.aaaaaa

9.351 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| jenis_id | varchar(5) | ✓ |  |  |  |  |

<a id="dboaabb"></a>
## dbo.aabb

9.354 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  | `01` 3.884, `03` 3.285, `02` 668, `08` 448, `07` 301, `09` 287, `13` 194, `04` 168, `06` 42, `05` 35, `10` 31, `11` 11 |

<a id="dboab"></a>
## dbo.ab

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| art_id | varchar(25) |  | PK |  |  |  |
| art_id2 | varchar(25) |  | PK |  |  |  |
| qty | numeric(18,0) | ✓ |  |  |  |  |

<a id="dboap_01db"></a>
## dbo.ap_01db

5 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| db | varchar(20) | ✓ |  |  |  |  |
| sv | varchar(20) | ✓ |  |  |  |  |
| urut | varchar(1) |  |  |  |  | `E` 1, `D` 1, `C` 1, `B` 1, `A` 1 |
| ds_sh | varchar(20) | ✓ |  |  |  |  |

<a id="dboap_01sh"></a>
## dbo.ap_01sh

30 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| sh | varchar(20) | ✓ |  |  |  |  |
| kd_bukti | varchar(1) |  |  |  |  | `F` 1, `D` 1, `C` 1, `B` 1, `A` 1, `9` 1, `7` 1, `6` 1, `5` 1, `4` 1, `3` 1, `2` 1, `…` |
| flag | char(1) | ✓ |  |  |  | `NULL` 30 |
| ip | varchar(20) | ✓ |  |  |  |  |
| iphm | varchar(20) | ✓ |  |  |  |  |
| lgn | char(10) | ✓ |  |  |  |  |
| lgs | char(10) | ✓ |  |  |  |  |
| lgo | char(10) | ✓ |  |  |  |  |
| bbn | char(10) | ✓ |  |  |  |  |
| bbs | char(10) | ✓ |  |  |  |  |
| bbo | char(10) | ✓ |  |  |  |  |
| ndn | char(10) | ✓ |  |  |  |  |
| nds | char(10) | ✓ |  |  |  |  |
| ndo | char(10) | ✓ |  |  |  |  |
| btn | char(10) | ✓ |  |  |  |  |
| bts | char(10) | ✓ |  |  |  |  |
| bto | char(10) | ✓ |  |  |  |  |
| N5 | char(10) | ✓ |  |  |  |  |
| S5 | char(10) | ✓ |  |  |  |  |
| O5 | char(10) | ✓ |  |  |  |  |
| N6 | char(10) | ✓ |  |  |  |  |
| S6 | char(10) | ✓ |  |  |  |  |
| O6 | char(10) | ✓ |  |  |  |  |
| N7 | char(10) | ✓ |  |  |  |  |
| S7 | char(10) | ✓ |  |  |  |  |
| O7 | char(10) | ✓ |  |  |  |  |
| N8 | char(10) | ✓ |  |  |  |  |
| S8 | char(10) | ✓ |  |  |  |  |
| O8 | char(10) | ✓ |  |  |  |  |
| N9 | char(10) | ✓ |  |  |  |  |
| S9 | char(10) | ✓ |  |  |  |  |
| O9 | char(10) | ✓ |  |  |  |  |
| N10 | char(10) | ✓ |  |  |  |  |
| S10 | char(10) | ✓ |  |  |  |  |
| O10 | char(10) | ✓ |  |  |  |  |
| marginn | numeric(18,0) | ✓ |  |  |  |  |
| margins | numeric(18,0) | ✓ |  |  |  |  |
| margino | numeric(18,0) | ✓ |  |  |  |  |
| sts | char(10) | ✓ |  |  |  |  |
| sts_mem | char(1) | ✓ |  |  |  | `F` 3, `A` 2, `''` 2, `NULL` 2, `H` 2, `K` 2, `O` 2, `X` 2, `Z` 2, `L` 1, `J` 1, `I` 1, `…` |
| STS_NEW | char(1) | ✓ |  |  |  | `M` 3, `z` 3, `E` 2, `I` 2, `A` 2, `''` 2, `NULL` 2, `L` 2, `O` 2, `K` 1, `J` 1, `H` 1, `…` |

<a id="dboap_beli_dtl"></a>
## dbo.ap_beli_dtl

2 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(20) |  |  |  |  |  |
| kd_brg | varchar(20) |  |  |  |  |  |
| qty | numeric(18,0) | ✓ |  |  |  |  |
| spec | varchar(40) | ✓ |  |  |  |  |
| lb | numeric(14,2) | ✓ |  |  |  |  |
| pj | numeric(14,2) | ✓ |  |  |  |  |
| tg | numeric(14,2) | ✓ |  |  |  |  |
| hrg_beli | numeric(18,0) | ✓ |  |  |  |  |
| disc | numeric(18,0) | ✓ |  |  |  |  |

<a id="dboap_beli_hdr"></a>
## dbo.ap_beli_hdr

6 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(20) |  |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(20) | ✓ |  |  |  |  |
| bukti_ref | varchar(20) | ✓ |  |  |  |  |
| disc | numeric(18,0) | ✓ |  |  |  |  |
| flag_approval | char(1) | ✓ |  |  |  | `NULL` 6 |
| ket | varchar(40) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(20) | ✓ |  |  |  |  |
| flag_close | char(1) | ✓ |  |  |  | `NULL` 6 |
| flag_proses | char(1) | ✓ |  |  |  | `NULL` 6 |
| delivery_date | int | ✓ |  |  |  |  |
| top_payment | int | ✓ |  |  |  |  |
| qty | numeric(18,0) | ✓ |  |  |  |  |
| note | varchar(500) | ✓ |  |  |  |  |

<a id="dboap_ccoa"></a>
## dbo.ap_ccoa

71 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| brand | varchar(1) |  | PK |  |  | `B` 32, `A` 32, `C` 7 |
| supp_id | varchar(10) |  | PK |  |  |  |
| coa_h | varchar(20) | ✓ |  |  |  |  |
| coa_p | varchar(20) | ✓ |  |  |  |  |

<a id="dboap_compro_master"></a>
## dbo.ap_compro_master

10 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| flag | varchar(1) |  |  |  |  | `P` 9, `C` 1 |
| jenis_kd | varchar(5) |  |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |
| flag_qty | varchar(1) | ✓ |  |  |  | `Y` 10 |
| flag_problem | varchar(1) | ✓ |  |  |  | `Y` 10 |
| shield | varchar(1) | ✓ |  |  |  | `Y` 8, `N` 2 |

<a id="dboap_fak_dtl"></a>
## dbo.ap_fak_dtl

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_ap | varchar(15) |  |  |  |  |  |
| bukti_lbm | varchar(15) |  |  |  |  |  |
| article_id | varchar(15) |  |  |  |  |  |
| bukti_po | varchar(15) |  |  |  |  |  |
| qty | decimal(12,2) | ✓ |  |  |  |  |
| hrg_beli | decimal(14,2) | ✓ |  |  |  |  |
| disc | decimal(6,2) | ✓ |  |  |  |  |
| kotor | decimal(14,2) | ✓ |  |  |  |  |
| pot | decimal(14,2) | ✓ |  |  |  |  |
| dpp | decimal(14,2) | ✓ |  |  |  |  |

<a id="dboap_fak_hdr"></a>
## dbo.ap_fak_hdr

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_ap | varchar(15) |  |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| bukti_po | varchar(15) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| tipe_trans | varchar(2) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| tgl_ref | datetime | ✓ |  |  |  |  |
| flag_ppn | varchar(1) | ✓ |  |  |  |  |
| bukti_pajak | varchar(20) | ✓ |  |  |  |  |
| tgl_pajak | datetime | ✓ |  |  |  |  |
| kotor | decimal(14,2) | ✓ |  |  |  |  |
| pot | decimal(14,2) | ✓ |  |  |  |  |
| dpp | decimal(14,2) | ✓ |  |  |  |  |
| ppn | decimal(14,2) | ✓ |  |  |  |  |
| materai | decimal(14,2) | ✓ |  |  |  |  |
| netto | decimal(14,2) | ✓ |  |  |  |  |
| koreksi | decimal(14,2) | ✓ |  |  |  |  |
| dokumen | decimal(14,2) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |

<a id="dboap_giro_detail"></a>
## dbo.ap_giro_detail

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_giro | varchar(15) |  | PK |  |  |  |
| tgl_giro | datetime | ✓ |  |  |  |  |
| nama_bank | varchar(10) | ✓ |  |  |  |  |
| kd_cab | char(3) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| no_inkaso | varchar(15) | ✓ |  |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| bayar_giro | decimal(14,2) |  |  |  |  |  |
| flag_proses | char(1) | ✓ |  |  |  |  |
| bank_ac | varchar(20) | ✓ |  |  |  |  |
| status_user | decimal(4,0) | ✓ |  |  |  |  |
| diskon | numeric(13,0) | ✓ |  |  |  |  |
| lebih | numeric(13,0) | ✓ |  |  |  |  |
| kurang | numeric(13,0) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  |  |

<a id="dboap_giro_master"></a>
## dbo.ap_giro_master

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_giro | varchar(15) |  |  |  |  |  |
| site_id | varchar(4) |  | PK |  |  |  |
| tgl_giro | datetime | ✓ |  |  |  |  |
| nama_bank | varchar(10) | ✓ |  |  |  |  |
| kd_cab | char(3) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| nilai_giro | numeric(14,2) | ✓ |  |  |  |  |
| flag_awal | char(1) | ✓ |  |  |  |  |
| status_giro | char(1) | ✓ |  |  |  |  |
| tgl_status | datetime | ✓ |  |  |  |  |
| kd_bank | varchar(10) | ✓ |  |  |  |  |
| no_inkaso | varchar(15) | ✓ |  |  |  |  |
| bank_ac | varchar(20) | ✓ |  |  |  |  |
| status_user | decimal(4,0) | ✓ |  |  |  |  |
| flag_serahterima | varchar(1) | ✓ |  |  |  |  |
| tgl_serahterima | datetime | ✓ |  |  |  |  |
| user_serahterima | varchar(15) | ✓ |  |  |  |  |
| print_serahterima | int | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  |  |

<a id="dboap_ink_dtl"></a>
## dbo.ap_ink_dtl

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| no_inkaso | varchar(15) |  |  |  |  |  |
| bukti | varchar(15) |  |  |  |  |  |
| kd_cab | char(3) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| gab_cust_id | varchar(15) | ✓ |  |  |  |  |
| flag_bukti | char(1) | ✓ |  |  |  |  |
| tdokumen | numeric(14,2) | ✓ |  |  |  |  |
| flag_kembali | char(1) | ✓ |  |  |  |  |
| tgl_kembali | datetime | ✓ |  |  |  |  |
| bayar_tunai | numeric(14,2) | ✓ |  |  |  |  |
| bayar_transfer | numeric(14,2) | ✓ |  |  |  |  |
| bukti_transfer | varchar(15) | ✓ |  |  |  |  |
| tgl_transfer | datetime | ✓ |  |  |  |  |
| kd_bank | char(3) | ✓ |  |  |  |  |
| bayar_giro | numeric(14,2) | ✓ |  |  |  |  |
| bukti_giro | varchar(15) | ✓ |  |  |  |  |
| tgl_giro | datetime | ✓ |  |  |  |  |
| nama_bank | varchar(10) | ✓ |  |  |  |  |
| lebih_bayar | numeric(14,2) | ✓ |  |  |  |  |
| kurang_bayar | numeric(14,2) | ✓ |  |  |  |  |
| flag_proses | char(1) | ✓ |  |  |  |  |
| flag_tt | char(1) | ✓ |  |  |  |  |
| no_tt | varchar(15) | ✓ |  |  |  |  |
| flag_status | char(2) | ✓ |  |  |  |  |
| ex_inkaso | varchar(15) | ✓ |  |  |  |  |
| status_user | decimal(4,0) | ✓ |  |  |  |  |
| kolektor_id_kembali | char(6) | ✓ |  |  |  |  |
| user_entry | varchar(15) | ✓ |  |  |  |  |
| flag_harga | char(1) | ✓ |  |  |  |  |
| curr_id_jual | char(3) | ✓ |  |  |  |  |
| curr_id_bayar | char(3) | ✓ |  |  |  |  |
| curr_rate_jual | numeric(14,4) | ✓ |  |  |  |  |
| curr_rate_bayar | numeric(14,4) | ✓ |  |  |  |  |
| bayar_dolar | numeric(14,2) | ✓ |  |  |  |  |
| diskon_tunai | numeric(18,2) | ✓ |  |  |  |  |
| diskon_giro | numeric(18,2) | ✓ |  |  |  |  |

<a id="dboap_ink_hdr"></a>
## dbo.ap_ink_hdr

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| no_inkaso | varchar(15) |  |  |  |  |  |
| tgl_inkaso | datetime | ✓ |  |  |  |  |
| kd_cab | char(3) | ✓ |  |  |  |  |
| area_coll | char(3) | ✓ |  |  |  |  |
| salesman_id | char(15) | ✓ |  |  |  |  |
| flag_proses | char(1) | ✓ |  |  |  |  |
| counter_print | int | ✓ |  |  |  |  |
| kd_fakturis | char(3) | ✓ |  |  |  |  |
| tmp_fakturis | char(3) | ✓ |  |  |  |  |
| tmp_collector | char(3) | ✓ |  |  |  |  |
| flag_insentip | char(1) | ✓ |  |  |  |  |
| flag_inkaso | char(1) | ✓ |  |  |  |  |
| user_id | varchar(15) | ✓ |  |  |  |  |
| status_user | decimal(4,0) | ✓ |  |  |  |  |
| flag_bagian | char(1) | ✓ |  |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |

<a id="dboap_lbm_dtl"></a>
## dbo.ap_lbm_dtl

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_lbm | varchar(15) |  |  |  |  |  |
| article_id | varchar(15) |  |  |  |  |  |
| bukti_po | varchar(15) |  |  |  |  |  |
| qty | decimal(12,2) | ✓ |  |  |  |  |

<a id="dboap_lbm_hdr"></a>
## dbo.ap_lbm_hdr

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_lbm | varchar(15) |  |  |  |  |  |
| bukti_po | varchar(15) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| flag_trans | char(2) | ✓ |  |  |  |  |
| ket | varchar(250) | ✓ |  |  |  |  |
| bukti_ap | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |

<a id="dboap_minta_dtl"></a>
## dbo.ap_minta_dtl

8 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  |  |  |  |  |
| kd_brg | varchar(20) |  |  |  |  |  |
| kd_group | varchar(20) |  |  |  |  |  |
| spec | varchar(40) | ✓ |  |  |  |  |
| pj | numeric(14,2) | ✓ |  |  |  |  |
| lb | numeric(14,2) | ✓ |  |  |  |  |
| tg | numeric(14,2) | ✓ |  |  |  |  |
| qty | numeric(14,2) | ✓ |  |  |  |  |
| harga | numeric(18,0) | ✓ |  |  |  |  |
| sat | varchar(10) | ✓ |  |  |  |  |
| ket | varchar(40) | ✓ |  |  |  |  |
| bukti_po_ref | varchar(20) | ✓ |  |  |  |  |

<a id="dboap_minta_hdr"></a>
## dbo.ap_minta_hdr

9 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| kd_peg | varchar(20) | ✓ |  |  |  |  |
| flag_close | varchar(1) | ✓ |  |  |  | `O` 5, `NULL` 4 |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(20) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |
| acc | varchar(1) | ✓ |  |  |  | `Y` 6, `NULL` 3 |

<a id="dboap_po_bom"></a>
## dbo.ap_po_bom

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| rm_id | varchar(15) |  |  |  |  |  |
| qty | decimal(12,2) | ✓ |  |  |  |  |
| hpp | decimal(14,2) | ✓ |  |  |  |  |
| close_hpp | char(1) | ✓ |  |  |  |  |

<a id="dboap_po_componen"></a>
## dbo.ap_po_componen

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| jenis_kd | varchar(5) |  |  |  |  |  |
| noline | int |  |  |  |  |  |
| ket | varchar(150) |  |  |  |  |  |
| qty | decimal(14,2) | ✓ |  |  |  |  |
| flag_self | varchar(1) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| status_print | varchar(1) | ✓ |  |  |  |  |
| tgl_print | datetime | ✓ |  |  |  |  |
| satuan | varchar(15) | ✓ |  |  |  |  |
| tgl_mulai | datetime | ✓ |  |  |  |  |
| tgl_akhir | datetime | ✓ |  |  |  |  |
| harga | decimal(18,2) | ✓ |  |  |  |  |
| no_po | varchar(20) | ✓ |  |  |  |  |
| shield | varchar(1) | ✓ |  |  |  |  |

<a id="dboap_po_dtl"></a>
## dbo.ap_po_dtl

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| article_id | varchar(15) |  |  |  |  |  |
| qty | decimal(8,2) | ✓ |  |  |  |  |
| hrg_beli | decimal(10,2) | ✓ |  |  |  |  |
| disc | decimal(6,2) | ✓ |  |  |  |  |

<a id="dboap_po_hdr"></a>
## dbo.ap_po_hdr

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| disc | decimal(6,2) | ✓ |  |  |  |  |
| flag_approval | char(1) | ✓ |  |  |  |  |
| ket | varchar(250) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| flag_close | char(1) | ✓ |  |  |  |  |
| flag_proses | char(1) | ✓ |  |  |  |  |
| delivery_date | int | ✓ |  |  |  |  |
| top_payment | int | ✓ |  |  |  |  |
| qty | decimal(18,2) | ✓ |  |  |  |  |
| model_id | varchar(15) | ✓ |  |  |  |  |
| flag_baru | char(1) | ✓ |  |  |  |  |
| uk_s | int | ✓ |  |  |  |  |
| uk_sm | int | ✓ |  |  |  |  |
| uk_m | int | ✓ |  |  |  |  |
| uk_ml | int | ✓ |  |  |  |  |
| uk_l | int | ✓ |  |  |  |  |
| uk_ll | int | ✓ |  |  |  |  |
| uk_f | int | ✓ |  |  |  |  |
| uk_xl | int | ✓ |  |  |  |  |
| uk_xxl | int | ✓ |  |  |  |  |
| uk_xxx | int | ✓ |  |  |  |  |
| tgl_delivery | datetime | ✓ |  |  |  |  |
| hrg_jual | decimal(14,2) | ✓ |  |  |  |  |
| hrg_beli | decimal(14,2) | ✓ |  |  |  |  |
| jenis_rm | char(3) | ✓ |  |  |  |  |
| ongkos_jahit | decimal(14,2) | ✓ |  |  |  |  |
| flag_break | varchar(1) | ✓ |  |  |  |  |
| flag_print | int | ✓ |  |  |  |  |
| bukti_mc | varchar(20) | ✓ |  |  |  |  |
| bukti_cost | varchar(20) | ✓ |  |  |  |  |
| note3 | varchar(500) | ✓ |  |  |  |  |
| note | text | ✓ |  |  |  |  |

<a id="dboap_po_problem"></a>
## dbo.ap_po_problem

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| jenis_kd | varchar(5) |  |  |  |  |  |
| noline | int |  |  |  |  |  |
| urut | int |  |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| problem | varchar(150) | ✓ |  |  |  |  |
| action | varchar(150) | ✓ |  |  |  |  |
| status | varchar(1) | ✓ |  |  |  |  |

<a id="dboap_po_progress"></a>
## dbo.ap_po_progress

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| jenis_kd | varchar(5) |  |  |  |  |  |
| noline | int |  |  |  |  |  |
| urut | int |  |  |  |  |  |
| tgl | datetime |  |  |  |  |  |
| qty | decimal(14,2) | ✓ |  |  |  |  |
| article_id | varchar(15) | ✓ |  |  |  |  |

<a id="dboap_rinci_po"></a>
## dbo.ap_rinci_po

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_po | varchar(15) |  |  |  |  |  |
| po_note | varchar(15) |  |  |  |  |  |
| urut | int |  |  |  |  |  |
| pelaksana | varchar(15) | ✓ |  |  |  |  |
| tgl_terima_plan | datetime | ✓ |  |  |  |  |
| tgl_selesai_plan | datetime | ✓ |  |  |  |  |
| tgl_terima_actual | datetime | ✓ |  |  |  |  |
| tgl_selesai_actual | datetime | ✓ |  |  |  |  |
| delivery | int | ✓ |  |  |  |  |
| top_payment | int | ✓ |  |  |  |  |
| flag | char(1) | ✓ |  |  |  |  |

<a id="dboap_supplier"></a>
## dbo.ap_supplier

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(15) |  |  |  |  |  |
| supp_name | varchar(100) | ✓ |  |  |  |  |
| supp_address | varchar(150) | ✓ |  |  |  |  |
| ATTN | varchar(30) | ✓ |  |  |  |  |
| city | varchar(25) | ✓ |  |  |  |  |
| phone | varchar(15) | ✓ |  |  |  |  |
| address_tax | varchar(150) | ✓ |  |  |  |  |
| fax | varchar(100) | ✓ |  |  |  |  |
| npwp | varchar(20) | ✓ |  |  |  |  |
| tax_type | varchar(10) | ✓ |  |  |  |  |
| tax_date | char(1) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tgl_active | datetime | ✓ |  |  |  |  |
| supp_email | varchar(20) | ✓ |  |  |  |  |
| acc_ap | varchar(15) | ✓ |  |  |  |  |
| top_hari | int | ✓ |  |  |  |  |
| acc_sedia | varchar(15) | ✓ |  |  |  |  |
| aktif | char(1) | ✓ |  |  |  |  |

<a id="dboap_supplierc"></a>
## dbo.ap_supplierc

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(15) |  |  |  |  |  |
| supp_name | varchar(20) | ✓ |  |  |  |  |

<a id="dboap_trans1"></a>
## dbo.ap_trans1

22.684 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti_ap | varchar(25) |  | PK |  |  |  |
| site_id | varchar(4) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| tipe_trans | varchar(2) | ✓ |  |  |  | `01` 22.671, `78` 13 |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |
| dokumen | decimal(14,2) | ✓ |  |  |  |  |
| bayar | decimal(14,2) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| ttl_dpp | decimal(14,2) | ✓ |  |  |  |  |
| ttl_ppn | decimal(14,2) | ✓ |  |  |  |  |
| nopajak | varchar(20) | ✓ |  |  |  |  |
| tglpajak | datetime | ✓ |  |  |  |  |
| jenis_rm | char(1) | ✓ |  |  |  | `NULL` 22.671, `3` 13 |
| account_id | varchar(15) | ✓ |  |  |  |  |
| trans_desc | varchar(50) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 13.116, `A` 8.758, `C` 548, `H` 262 |

<a id="dboap_trans1_awal"></a>
## dbo.ap_trans1_awal

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  |  |  |  |  |
| supp_id | varchar(15) |  |  |  |  |  |
| saldo_awal | numeric(14,2) | ✓ |  |  |  |  |
| ap_trans | numeric(14,2) | ✓ |  |  |  |  |
| cb | numeric(14,2) | ✓ |  |  |  |  |
| giro | numeric(14,2) | ✓ |  |  |  |  |
| saldo_akhir | numeric(14,2) | ✓ |  |  |  |  |

<a id="dboap_trans1_awal1"></a>
## dbo.ap_trans1_awal1

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  |  |  |  |  |
| supp_id | varchar(15) |  |  |  |  |  |
| tipe_trans | varchar(2) | ✓ |  |  |  |  |
| dokumen | numeric(14,2) | ✓ |  |  |  |  |
| bayar | numeric(14,2) | ✓ |  |  |  |  |
| ttl_dpp | numeric(14,2) | ✓ |  |  |  |  |
| ttl_ppn | numeric(14,2) | ✓ |  |  |  |  |
| jenis_rm | char(1) | ✓ |  |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |

<a id="dboar_trans1"></a>
## dbo.ar_trans1

31.128 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| site_id | varchar(10) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| tipe_trans | varchar(2) | ✓ |  |  |  | `70` 30.801, `71` 327 |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| ttl_dok | decimal(14,2) | ✓ |  |  |  |  |
| ttl_dpp | decimal(14,2) | ✓ |  |  |  |  |
| ttl_ppn | decimal(14,2) | ✓ |  |  |  |  |
| ttl_byr | decimal(14,2) | ✓ |  |  |  |  |
| ttl_qty | decimal(14,2) | ✓ |  |  |  |  |
| nopajak | varchar(20) | ✓ |  |  |  |  |
| tglpajak | datetime | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 17.478, `A` 12.046, `C` 1.181, `H` 423 |

<a id="dboattend"></a>
## dbo.attend

21.169 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| attend_id | bigint |  | PK IDENTITY |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| hari | varchar(15) | ✓ |  |  |  |  |
| tipe_id | int | ✓ |  |  |  |  |
| inn | varchar(10) | ✓ |  |  |  |  |
| inn2 | datetime | ✓ |  |  |  |  |
| brea | varchar(10) | ✓ |  |  |  |  |
| ou | varchar(10) | ✓ |  |  |  |  |
| ou2 | datetime | ✓ |  |  |  |  |
| ot | varchar(10) | ✓ |  |  |  |  |
| done | varchar(10) | ✓ |  |  |  |  |
| hari_kerja | decimal(5,2) | ✓ |  |  |  |  |
| wrk | varchar(10) | ✓ |  |  |  |  |
| overtime | varchar(10) | ✓ |  |  |  |  |
| lembur_menit | smallint | ✓ |  |  |  |  |
| lembur_id | bigint | ✓ |  |  |  |  |
| lembur_rp | numeric(10,0) | ✓ |  |  |  |  |
| pot_telat | numeric(10,0) | ✓ |  |  |  |  |
| pot_izin | numeric(10,0) | ✓ |  |  |  |  |
| pot_jam | varchar(10) | ✓ |  |  |  |  |
| diffot | varchar(10) | ✓ |  |  |  |  |
| short | varchar(10) | ✓ |  |  |  |  |
| remark | char(30) | ✓ |  |  |  |  |
| tipe_gaji | varchar(30) | ✓ |  |  |  |  |
| status | varchar(10) | ✓ |  |  |  |  |
| pt_id | smallint | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| cust_name | varchar(100) | ✓ |  |  |  |  |
| shift_id | smallint | ✓ |  |  |  |  |
| tipe_id_kontrak | bigint | ✓ |  |  |  |  |
| jam_masuk | char(5) | ✓ |  |  |  |  |
| jam_masuk2 | char(5) | ✓ |  |  |  |  |
| jam_keluar | char(5) | ✓ |  |  |  |  |
| jam_keluar2 | char(5) | ✓ |  |  |  |  |
| kd_brand | varchar(15) | ✓ |  |  |  |  |
| nm_brand | varchar(50) | ✓ |  |  |  |  |
| latitude | varchar(20) | ✓ |  |  |  |  |
| longitude | varchar(20) | ✓ |  |  |  |  |
| foto_in | varchar(50) | ✓ |  |  |  |  |
| foto_out | varchar(50) | ✓ |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |
| face_id_in | varchar(max) | ✓ |  |  |  |  |
| face_id_out | varchar(max) | ✓ |  |  |  |  |
| izin_id | bigint | ✓ |  |  |  |  |
| telat | int | ✓ |  |  |  |  |
| asup | varchar(350) | ✓ |  |  |  |  |
| no_absen | int | ✓ |  |  |  |  |
| peg_id | bigint | ✓ |  |  |  |  |
| userid | bigint | ✓ |  |  |  |  |
| pot_pokok | numeric(10,0) | ✓ |  |  |  |  |
| pot_premi | numeric(10,0) | ✓ |  |  |  |  |
| app | bit | ✓ |  |  |  |  |
| jam_pokok | numeric(10,0) | ✓ |  |  |  |  |
| mnt_premi | numeric(10,0) | ✓ |  |  |  |  |

<a id="dboattend_backup"></a>
## dbo.attend_backup

70 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| att_id | bigint |  | PK IDENTITY |  |  |  |
| attend_id | bigint | ✓ |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| hari | varchar(15) | ✓ |  |  |  |  |
| tipe_id | int | ✓ |  |  |  |  |
| inn | varchar(10) | ✓ |  |  |  |  |
| inn2 | datetime | ✓ |  |  |  |  |
| brea | varchar(10) | ✓ |  |  |  |  |
| ou | varchar(10) | ✓ |  |  |  |  |
| ou2 | datetime | ✓ |  |  |  |  |
| ot | varchar(10) | ✓ |  |  |  |  |
| done | varchar(10) | ✓ |  |  |  |  |
| hari_kerja | decimal(5,2) | ✓ |  |  |  |  |
| wrk | varchar(10) | ✓ |  |  |  |  |
| overtime | varchar(10) | ✓ |  |  |  |  |
| lembur_id | bigint | ✓ |  |  |  |  |
| lembur_rp | numeric(10,0) | ✓ |  |  |  |  |
| pot_telat | numeric(10,0) | ✓ |  |  |  |  |
| pot_izin | numeric(10,0) | ✓ |  |  |  |  |
| pot_jam | varchar(10) | ✓ |  |  |  |  |
| remark | char(30) | ✓ |  |  |  |  |
| tipe_gaji | varchar(30) | ✓ |  |  |  |  |
| status | varchar(10) | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| cust_name | varchar(100) | ✓ |  |  |  |  |
| shift_id | smallint | ✓ |  |  |  |  |
| tipe_id_kontrak | bigint | ✓ |  |  |  |  |
| jam_masuk | char(5) | ✓ |  |  |  |  |
| jam_masuk2 | char(5) | ✓ |  |  |  |  |
| jam_keluar | char(5) | ✓ |  |  |  |  |
| jam_keluar2 | char(5) | ✓ |  |  |  |  |
| kd_brand | varchar(15) | ✓ |  |  |  |  |
| nm_brand | varchar(50) | ✓ |  |  |  |  |
| foto_in | varchar(50) | ✓ |  |  |  |  |
| foto_out | varchar(50) | ✓ |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |
| face_id_in | varchar(max) | ✓ |  |  |  |  |
| face_id_out | varchar(max) | ✓ |  |  |  |  |
| izin_id | bigint | ✓ |  |  |  |  |
| telat | int | ✓ |  |  |  |  |
| asup | varchar(350) | ✓ |  |  |  |  |
| no_absen | int | ✓ |  |  |  |  |
| peg_id | bigint | ✓ |  |  |  |  |
| userid | bigint | ✓ |  |  |  |  |
| user_update | varchar(15) | ✓ |  |  |  |  |
| tgl_update | datetime | ✓ |  |  |  |  |

<a id="dbocb_close"></a>
## dbo.cb_close

20 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  |  |  |  |  |
| kd_bank | varchar(3) |  |  |  |  | `12` 8, `11` 5, `13` 5, `14` 2 |
| tgl | datetime |  |  |  |  |  |
| saldo_akhir1 | decimal(18,4) |  |  |  |  |  |
| saldo_akhir2 | decimal(18,4) |  |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  | `IDR` 20 |
| rate_currency | decimal(18,4) | ✓ |  |  |  |  |
| selisih_kas | decimal(18,4) |  |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| user_entry | varchar(15) | ✓ |  |  |  |  |

<a id="dbocb_close_dt"></a>
## dbo.cb_close_dt

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  |  |  |  |  |
| kd_bank | varchar(3) |  |  |  |  |  |
| tgl | datetime |  |  |  |  |  |
| kd_pecahan | numeric(10,0) |  |  |  |  |  |
| qty_koin | numeric(10,0) |  |  |  |  |  |
| qty_kertas | numeric(10,0) |  |  |  |  |  |
| total_nilai | numeric(14,0) |  |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  |  |
| rate_currency | decimal(18,2) | ✓ |  |  |  |  |

<a id="dbocb_journal"></a>
## dbo.cb_journal

8.587 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| no_urut | varchar(50) |  | PK |  |  |  |
| site_id | varchar(4) |  | PK |  |  |  |
| kd_bank | varchar(3) |  |  |  |  | `12` 5.306, `14` 1.249, `13` 1.118, `11` 444, `16` 442, `15` 28 |
| tgl_trans | datetime | ✓ |  |  |  |  |
| no_bukti | char(30) | ✓ |  |  |  |  |
| nilai_trans | decimal(18,4) | ✓ |  |  |  |  |
| tipe_trans | char(2) | ✓ |  |  |  | `BK` 4.168, `BM` 2.387, `KK` 1.997, `KM` 35 |
| keterangan | varchar(100) | ✓ |  |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  | `IDR` 8.587 |
| rate_currency | decimal(10,4) | ✓ |  |  |  |  |
| nilai_currency | decimal(18,4) | ✓ |  |  |  |  |
| nilai_old_currency | decimal(18,4) | ✓ |  |  |  |  |
| rlfe | decimal(18,4) | ✓ |  |  |  |  |
| posttogl | char(1) | ✓ |  |  |  | `N` 8.587 |
| tipe_bukti | char(3) | ✓ |  |  |  | `NULL` 8.587 |
| kd_giro | varchar(20) | ✓ |  |  |  |  |
| tipe_bayar | char(2) | ✓ |  |  |  | `NULL` 8.587 |
| cf_id | varchar(10) | ✓ |  |  |  |  |
| cc_id | varchar(10) | ✓ |  |  |  |  |
| tgl_jth_tempo | datetime | ✓ |  |  |  |  |
| giro_ket | varchar(100) | ✓ |  |  |  |  |
| status_giro | char(1) | ✓ |  |  |  | `NULL` 8.587 |
| flag_approval | char(1) | ✓ |  |  |  | `Y` 8.435, `N` 152 |
| tgl_entry | datetime | ✓ |  |  |  |  |
| user_entry | varchar(15) | ✓ |  |  |  |  |
| ket_entry | varchar(30) | ✓ |  |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| flag_closing | varchar(1) | ✓ |  |  |  | `O` 8.587 |
| trans | char(1) | ✓ |  |  |  | `NULL` 8.587 |
| ket | text | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 6.223, `B` 1.827, `C` 320, `H` 217 |

<a id="dbocb_journal_detail"></a>
## dbo.cb_journal_detail

56.983 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| no_urut | varchar(50) |  | PK → dbo.cb_journal(no_urut, site_id, brand_id) |  |  |  |
| site_id | varchar(4) |  | PK → dbo.cb_journal(no_urut, site_id, brand_id) |  |  |  |
| no_line | int |  | PK |  |  |  |
| nilai_trans | decimal(15,4) | ✓ |  |  |  |  |
| tipe_trans | char(2) | ✓ |  |  |  | `AR` 28.639, `AP` 20.411, `LL` 7.933 |
| keterangan | varchar(100) | ✓ |  |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  | `IDR` 56.983 |
| rate_currency | decimal(10,4) | ✓ |  |  |  |  |
| nilai_currency | decimal(15,4) | ✓ |  |  |  |  |
| nilai_old_currency | decimal(15,4) | ✓ |  |  |  |  |
| rlfe | decimal(15,4) | ✓ |  |  |  |  |
| cf_id | varchar(10) | ✓ |  |  |  |  |
| cc_id | varchar(10) | ✓ |  |  |  |  |
| kd_plgsup | varchar(10) | ✓ |  |  |  |  |
| kd_fak | varchar(20) | ✓ |  |  |  |  |
| rlfe_avg | decimal(15,4) | ✓ |  |  |  |  |
| curr_debet | decimal(15,4) | ✓ |  |  |  |  |
| curr_kredit | decimal(15,4) | ✓ |  |  |  |  |
| base_debet | decimal(15,4) | ✓ |  |  |  |  |
| base_kredit | decimal(15,4) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.cb_journal(no_urut, site_id, brand_id) |  |  | `B` 27.961, `A` 27.116, `C` 1.364, `H` 542 |

<a id="dbocb_master"></a>
## dbo.cb_master

13 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| kd_bank | varchar(3) |  | PK |  |  | `13` 3, `12` 3, `11` 3, `14` 2, `16` 1, `15` 1 |
| nm_bank | varchar(50) | ✓ |  |  |  |  |
| bank_type | varchar(1) | ✓ |  |  |  | `B` 9, `K` 4 |
| currency_id | varchar(3) | ✓ |  |  |  | `IDR` 13 |
| account_id | varchar(15) | ✓ |  |  |  |  |
| kas_kecil | varchar(15) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 10, `B` 3 |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

<a id="dbocb_pecahan"></a>
## dbo.cb_pecahan

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| kd_pecahan | numeric(10,0) |  |  |  |  |  |
| keterangan | varchar(25) |  |  |  |  |  |
| status_pecahan | char(1) |  |  |  |  |  |

<a id="dbodesty_listorder"></a>
## dbo.Desty_ListOrder

13.104 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| LineID | bigint |  | PK IDENTITY |  |  |  |
| orderId | bigint |  |  |  |  |  |
| orderSn | nvarchar(100) |  |  |  |  |  |
| orderCreateTime | datetime | ✓ |  |  |  |  |
| orderUpdateTime | datetime | ✓ |  |  |  |  |
| createTime | datetime | ✓ |  |  |  |  |
| orderStatusList | nvarchar(255) | ✓ |  |  |  |  |
| platformOrderStatusList | nvarchar(255) | ✓ |  |  |  |  |
| platformName | nvarchar(50) | ✓ |  |  |  |  |
| storeId | nvarchar(50) | ✓ |  |  |  |  |
| storeName | nvarchar(50) | ✓ |  |  |  |  |
| trackingNumberList | nvarchar(255) | ✓ |  |  |  |  |
| ParamStart | bigint | ✓ |  |  |  |  |
| ParamPage | smallint | ✓ |  |  |  |  |
| ParamTotPage | smallint | ✓ |  |  |  |  |
| Created | datetime | ✓ |  | (getdate()) |  |  |
| FlagProses | bit | ✓ |  | ((0)) |  |  |
| ProsesDate | datetime | ✓ |  |  |  |  |

**Index:** `IDX_Desty_ListOrder` (orderId, orderSn, trackingNumberList, FlagProses)

<a id="dbodesty_logerror"></a>
## dbo.Desty_LogError

9.273 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| LogID | bigint |  | PK IDENTITY |  |  |  |
| ErrorTime | datetime | ✓ |  | (getdate()) |  |  |
| ErrorNumber | int | ✓ |  |  |  |  |
| ErrorSeverity | int | ✓ |  |  |  |  |
| ErrorState | int | ✓ |  |  |  |  |
| ErrorProcedure | nvarchar(200) | ✓ |  |  |  |  |
| ErrorLine | int | ✓ |  |  |  |  |
| ErrorMessage | nvarchar(max) | ✓ |  |  |  |  |

<a id="dbodesty_order1"></a>
## dbo.Desty_Order1

12.748 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| orderId | bigint |  | PK |  |  |  |
| orderSn | varchar(50) | ✓ |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| platformName | nvarchar(30) | ✓ |  |  |  |  |
| cust_name | nvarchar(50) | ✓ |  |  |  |  |
| cust_phone | nvarchar(30) | ✓ |  |  |  |  |
| cust_email | nvarchar(50) | ✓ |  |  |  |  |
| shippingAddress | nvarchar(300) | ✓ |  |  |  |  |
| shippingArea | nvarchar(50) | ✓ |  |  |  |  |
| shippingCity | nvarchar(50) | ✓ |  |  |  |  |
| shippingProvince | nvarchar(50) | ✓ |  |  |  |  |
| shippingPostCode | nvarchar(50) | ✓ |  |  |  |  |
| shippingPhone | nvarchar(50) | ✓ |  |  |  |  |
| trackingNumber | nvarchar(50) | ✓ |  |  |  |  |
| courier | nvarchar(50) | ✓ |  |  |  |  |
| shipper | nvarchar(50) | ✓ |  |  |  |  |
| includeTax | bit | ✓ |  |  |  |  |
| subTotal | decimal(15,2) | ✓ |  |  |  |  |
| discount | decimal(15,2) | ✓ |  |  |  |  |
| tax | decimal(10,2) | ✓ |  |  |  |  |
| totalPrice | decimal(15,2) | ✓ |  |  |  |  |
| totalSales | decimal(15,2) | ✓ |  |  |  |  |
| insuranceCost | decimal(15,2) | ✓ |  |  |  |  |
| paymentMethod | nvarchar(30) | ✓ |  |  |  |  |
| refundAmount | decimal(15,2) | ✓ |  |  |  |  |
| totalInvoice | decimal(15,2) | ✓ |  |  |  |  |
| finalShippingFee | decimal(15,2) | ✓ |  |  |  |  |
| serviceFee | decimal(15,2) | ✓ |  |  |  |  |
| escrowAmount | decimal(15,2) | ✓ |  |  |  |  |
| sellerDiscount | decimal(15,2) | ✓ |  |  |  |  |
| otherCost | decimal(15,2) | ✓ |  |  |  |  |
| LinkBukti | varchar(15) | ✓ |  |  |  |  |
| Created | datetime | ✓ |  | (getdate()) |  |  |

**Index:** `IDX_Desty_Order1_orderId` (orderId, orderSn, platformName, tgl, LinkBukti)

<a id="dbodesty_order2"></a>
## dbo.Desty_Order2

14.378 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| LineID | bigint |  | PK IDENTITY |  |  |  |
| orderId | bigint | ✓ | → dbo.Desty_Order1(orderId) |  |  |  |
| itemCode | nvarchar(50) | ✓ |  |  |  |  |
| itemName | nvarchar(100) | ✓ |  |  |  |  |
| harga | decimal(15,2) | ✓ |  |  |  |  |
| quantity | int | ✓ |  |  |  |  |
| sellPrice | decimal(15,2) | ✓ |  |  |  |  |
| disc_rp | decimal(16,2) | ✓ |  |  |  |  |
| disc | decimal(38,18) | ✓ |  |  |  |  |
| LinkBukti | varchar(15) | ✓ |  |  |  |  |
| Created | datetime | ✓ |  | (getdate()) |  |  |

<a id="dbofailed_jobs"></a>
## dbo.failed_jobs

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | bigint |  | PK IDENTITY |  |  |  |
| uuid | nvarchar(255) |  |  |  |  |  |
| connection | nvarchar(max) |  |  |  |  |  |
| queue | nvarchar(max) |  |  |  |  |  |
| payload | nvarchar(max) |  |  |  |  |  |
| exception | nvarchar(max) |  |  |  |  |  |
| failed_at | datetime |  |  | (getdate()) |  |  |

**Index:** `failed_jobs_uuid_unique` (uuid) unik

<a id="dbogl_aset"></a>
## dbo.gl_aset

983 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| site_id | varchar(4) |  | PK |  |  |  |
| brand_id | varchar(10) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| tgl_po | datetime | ✓ |  |  |  |  |
| tgl_terima | datetime | ✓ |  |  |  |  |
| tgl_pakai | datetime | ✓ |  |  |  |  |
| bukti_po | varchar(25) | ✓ |  |  |  |  |
| bukti_terima | varchar(25) | ✓ |  |  |  |  |
| art_id | varchar(25) | ✓ |  |  |  |  |
| kd_aset | varchar(2) | ✓ |  |  |  | `FA` 983 |
| wujud | char(1) | ✓ |  |  |  | `Y` 983 |
| met_susut | varchar(5) | ✓ |  |  |  |  |
| coa_aset | varchar(15) | ✓ |  |  |  |  |
| coa_ak_susut | varchar(15) | ✓ |  |  |  |  |
| coa_beban_susut | varchar(15) | ✓ |  |  |  |  |
| qty | numeric(18,2) | ✓ |  |  |  |  |
| umur_th | numeric(10,0) | ✓ |  |  |  |  |
| umur_bl | numeric(10,0) | ✓ |  |  |  |  |
| rasio | numeric(10,0) | ✓ |  |  |  |  |
| residu_qty | numeric(10,0) | ✓ |  |  |  |  |
| residu_tot | numeric(10,0) | ✓ |  |  |  |  |
| nilai_sisa | numeric(18,2) | ✓ |  |  |  |  |
| bl_berjalan | numeric(10,0) | ✓ |  |  |  |  |
| pqty_aset | numeric(18,2) | ✓ |  |  |  |  |
| tot_pqty_aset | numeric(18,2) | ✓ |  |  |  |  |
| tot_aset | numeric(18,2) | ✓ |  |  |  |  |
| tot_buku | numeric(18,2) | ✓ |  |  |  |  |
| ket | varchar(70) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

<a id="dbogl_aset_dtl"></a>
## dbo.gl_aset_dtl

1.569 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| site_id | varchar(4) |  | PK |  |  |  |
| brand_id | varchar(10) |  | PK |  |  |  |
| urut | numeric(10,0) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| tgl_po | datetime | ✓ |  |  |  |  |
| tgl_terima | datetime | ✓ |  |  |  |  |
| tgl_pakai | datetime | ✓ |  |  |  |  |
| bukti_po | varchar(25) | ✓ |  |  |  |  |
| bukti_terima | varchar(25) | ✓ |  |  |  |  |
| art_id | varchar(25) | ✓ |  |  |  |  |
| kd_aset | varchar(2) | ✓ |  |  |  | `FA` 1.569 |
| wujud | char(1) | ✓ |  |  |  | `Y` 1.569 |
| met_susut | varchar(5) | ✓ |  |  |  |  |
| coa_aset | varchar(15) | ✓ |  |  |  |  |
| coa_ak_susut | varchar(15) | ✓ |  |  |  |  |
| coa_beban_susut | varchar(15) | ✓ |  |  |  |  |
| qty | numeric(18,2) | ✓ |  |  |  |  |
| umur_th | numeric(10,0) | ✓ |  |  |  |  |
| umur_bl | numeric(10,0) | ✓ |  |  |  |  |
| rasio | numeric(10,0) | ✓ |  |  |  |  |
| residu_qty | numeric(10,0) | ✓ |  |  |  |  |
| residu_tot | numeric(10,0) | ✓ |  |  |  |  |
| nilai_sisa | numeric(18,2) | ✓ |  |  |  |  |
| bl_berjalan | numeric(10,0) |  | PK |  |  |  |
| tgl_berjalan | datetime |  | PK |  |  |  |
| pqty_aset | numeric(18,2) | ✓ |  |  |  |  |
| tot_pqty_aset | numeric(18,2) | ✓ |  |  |  |  |
| tot_aset | numeric(18,2) | ✓ |  |  |  |  |
| tot_buku | numeric(18,2) | ✓ |  |  |  |  |
| ket | varchar(70) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| bukti_gl | varchar(50) | ✓ |  |  |  |  |

<a id="dbogl_balance"></a>
## dbo.gl_balance

3.277 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| periode | datetime |  | PK |  |  |  |
| account_id | varchar(15) |  | PK |  |  |  |
| debet | numeric(16,2) | ✓ |  |  |  |  |
| kredit | numeric(16,2) | ✓ |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  | `IDR` 3.277 |
| currency_debet | numeric(16,2) | ✓ |  |  |  |  |
| currency_kredit | numeric(16,2) | ✓ |  |  |  |  |
| currency_rate | numeric(10,2) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 3.277 |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

<a id="dbogl_budget"></a>
## dbo.gl_budget

2.124 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  |  |  |  |  |
| periode | datetime |  |  |  |  |  |
| account_id | varchar(15) |  |  |  |  |  |
| nilai | numeric(16,4) | ✓ |  |  |  |  |

<a id="dbogl_budget_cc"></a>
## dbo.gl_budget_cc

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  |  |  |  |  |
| periode | datetime |  |  |  |  |  |
| account_id | varchar(15) |  |  |  |  |  |
| cc_id | varchar(10) |  |  |  |  |  |
| nilai | numeric(16,4) | ✓ |  |  |  |  |

<a id="dbogl_budget_cf"></a>
## dbo.gl_budget_cf

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  |  |  |  |  |
| periode | datetime |  |  |  |  |  |
| cf_id | varchar(10) |  |  |  |  |  |
| nilai | decimal(16,4) | ✓ |  |  |  |  |

<a id="dbogl_cc"></a>
## dbo.gl_cc

52 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| cc_id | varchar(10) |  | PK |  |  |  |
| cc_desc | varchar(50) | ✓ |  |  |  |  |
| cc_header | varchar(1) | ✓ |  |  |  | `NULL` 24, `Y` 17, `N` 11 |
| site_id | varchar(4) |  | PK |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 52 |

<a id="dbogl_cf"></a>
## dbo.gl_cf

11 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| cf_id | varchar(10) |  |  |  |  |  |
| cf_desc | varchar(50) | ✓ |  |  |  |  |
| cf_header | varchar(1) | ✓ |  |  |  | `NULL` 9, `Y` 2 |
| site_id | varchar(4) |  |  |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |

<a id="dbogl_coa"></a>
## dbo.gl_coa

869 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| account_id | varchar(15) |  | PK |  |  |  |
| account_desc | varchar(60) | ✓ |  |  |  |  |
| flag_dk | varchar(1) | ✓ |  |  |  | `D` 575, `K` 294 |
| flag_active | varchar(1) | ✓ |  |  |  | `Y` 869 |
| flag_alloc | varchar(1) | ✓ |  |  |  | `NULL` 482, `N` 387 |
| flag_cf | varchar(1) | ✓ |  |  |  | `NULL` 482, `N` 387 |
| account_cf | varchar(10) | ✓ |  |  |  |  |
| flag_cc | varchar(1) | ✓ |  |  |  | `NULL` 481, `N` 388 |
| cc_id | varchar(10) | ✓ |  |  |  |  |
| ledger_id | varchar(15) | ✓ |  |  |  |  |
| pjk | char(1) | ✓ |  |  |  | `NULL` 481, `N` 383, `Y` 5 |
| brand_id | varchar(10) |  | PK |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |

<a id="dbogl_coa_alocation"></a>
## dbo.gl_coa_alocation

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  |  |  |  |  |
| account_id | varchar(15) |  |  |  |  |  |
| account_alloc | varchar(15) |  |  |  |  |  |
| cc_id | varchar(10) |  |  |  |  |  |
| persentase | numeric(6,2) | ✓ |  |  |  |  |

<a id="dbogl_coax"></a>
## dbo.gl_coax

447 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| account_id | varchar(15) |  | PK |  |  |  |
| account_id_baru | varchar(15) | ✓ |  |  |  |  |
| account_desc | varchar(60) | ✓ |  |  |  |  |
| flag_dk | varchar(1) | ✓ |  |  |  | `NULL` 447 |
| flag_active | varchar(1) | ✓ |  |  |  | `NULL` 447 |
| flag_alloc | varchar(1) | ✓ |  |  |  | `NULL` 447 |
| flag_cf | varchar(1) | ✓ |  |  |  | `NULL` 447 |
| account_cf | varchar(10) | ✓ |  |  |  |  |
| flag_cc | varchar(1) | ✓ |  |  |  | `NULL` 447 |
| cc_id | varchar(10) | ✓ |  |  |  |  |
| ledger_id | varchar(15) | ✓ |  |  |  |  |
| pjk | char(1) | ✓ |  |  |  | `NULL` 447 |
| brand_id | varchar(10) |  | PK |  |  |  |

<a id="dbogl_currency"></a>
## dbo.gl_currency

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| currency_id | varchar(3) |  |  |  |  |  |
| currency_desc | varchar(25) | ✓ |  |  |  |  |
| currency_symbol | varchar(5) | ✓ |  |  |  |  |

<a id="dbogl_exchange"></a>
## dbo.gl_exchange

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| exch_currency_date | datetime |  |  |  |  |  |
| exch_currency_from | varchar(3) |  |  |  |  |  |
| exch_currency_to | varchar(3) |  |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  |  |
| exch_currency_rate | numeric(10,4) | ✓ |  |  |  |  |

<a id="dbogl_journal"></a>
## dbo.gl_journal

66.523 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| voucher | varchar(50) |  | PK |  |  |  |
| voucher_date | datetime |  |  |  |  |  |
| voucher_periode | datetime |  |  |  |  |  |
| voucher_status | varchar(1) | ✓ |  |  |  | `O` 60.461, `P` 5.862, `NULL` 200 |
| voucher_modul | varchar(2) | ✓ |  |  |  | `AR` 31.951, `AP` 23.784, `BK` 4.167, `BM` 2.361, `KK` 1.962, `AS` 1.626, `RF` 357, `NULL` 200, `MM` 74, `KM` 41 |
| voucher_adjustment | varchar(1) | ✓ |  |  |  | `N` 66.249, `NULL` 200, `R` 74 |
| voucher_form | int | ✓ |  |  |  |  |
| entry_date | datetime | ✓ |  |  |  |  |
| user_id | varchar(15) | ✓ |  |  |  |  |
| voucher_modul_id | varchar(2) | ✓ |  |  |  | `70` 31.569, `01` 25.416, `12` 5.194, `14` 1.245, `13` 1.110, `03` 447, `11` 438, `16` 420, `72` 382, `NULL` 274, `15` 28 |
| keterangan | varchar(50) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 32.686, `B` 31.308, `C` 1.742, `H` 705, `''` 82 |

<a id="dbogl_journal_detail"></a>
## dbo.gl_journal_detail

237.260 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK → dbo.gl_journal(site_id, voucher, brand_id) |  |  |  |
| voucher | varchar(50) |  | PK → dbo.gl_journal(site_id, voucher, brand_id) |  |  |  |
| no_urut | int |  | PK |  |  |  |
| account_id | varchar(15) |  | PK |  |  |  |
| description | varchar(100) | ✓ |  |  |  |  |
| debet | numeric(16,4) | ✓ |  |  |  |  |
| kredit | numeric(16,4) | ✓ |  |  |  |  |
| cf_id | varchar(10) | ✓ |  |  |  |  |
| cc_id | varchar(10) | ✓ |  |  |  |  |
| currency_id | varchar(3) | ✓ |  |  |  | `IDR` 172.442, `NULL` 64.818 |
| currency_debet | numeric(16,4) | ✓ |  |  |  |  |
| currency_kredit | numeric(16,4) | ✓ |  |  |  |  |
| currency_date | datetime | ✓ |  |  |  |  |
| currency_rate | numeric(10,4) | ✓ |  |  |  |  |
| actual_rate | numeric(10,4) | ✓ |  |  |  |  |
| acct_lama | varchar(15) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.gl_journal(site_id, voucher, brand_id) |  |  | `A` 136.122, `B` 94.193, `C` 4.695, `H` 2.038, `''` 212 |

<a id="dbogl_journal_form"></a>
## dbo.gl_journal_form

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| form_no | int |  |  |  |  |  |
| form_name | varchar(50) | ✓ |  |  |  |  |

<a id="dbogl_journal_form_detail"></a>
## dbo.gl_journal_form_detail

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| form_no | int |  |  |  |  |  |
| no_urut | int |  |  |  |  |  |
| site_id | varchar(4) | ✓ |  |  |  |  |
| account_id | varchar(15) |  |  |  |  |  |
| description | varchar(100) | ✓ |  |  |  |  |
| cf_id | varchar(10) | ✓ |  |  |  |  |
| cc_id | varchar(10) | ✓ |  |  |  |  |

<a id="dbogl_ledger"></a>
## dbo.gl_ledger

41 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| ledger_id | varchar(15) |  |  |  |  |  |
| ledger_desc | varchar(60) | ✓ |  |  |  |  |
| flag_dk | varchar(1) | ✓ |  |  |  | `D` 35, `K` 6 |
| flag_active | varchar(1) | ✓ |  |  |  | `Y` 41 |
| tipe_id | varchar(10) | ✓ |  |  |  |  |

<a id="dbogl_report"></a>
## dbo.gl_report

2 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| report_id | varchar(4) |  | PK |  |  |  |
| report_desc | varchar(30) | ✓ |  |  |  |  |
| report_tipe | varchar(4) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 2 |

<a id="dbogl_report_detail"></a>
## dbo.gl_report_detail

80 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| report_id | varchar(4) |  | PK |  |  |  |
| report_line | numeric(8,0) |  | PK |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |
| description | varchar(150) | ✓ |  |  |  |  |
| trd123 | char(1) | ✓ |  |  |  | `R` 47, `S` 17, `1` 7, `''` 5, `3` 4 |
| t1 | char(1) | ✓ |  |  |  | `''` 28, `+` 26, `-` 15, `0` 11 |
| t2 | char(1) | ✓ |  |  |  | `''` 75, `0` 4, `NULL` 1 |
| t3 | char(1) | ✓ |  |  |  | `''` 68, `+` 6, `0` 4, `-` 2 |
| t4 | char(1) | ✓ |  |  |  | `NULL` 80 |
| report_row | numeric(2,0) | ✓ |  |  |  |  |
| report_space | numeric(2,0) | ✓ |  |  |  |  |
| description2 | varchar(150) | ✓ |  |  |  |  |
| flag_omzet | char(1) | ✓ |  |  |  | `N` 80 |
| flag_gp | char(1) | ✓ |  |  |  | `N` 76, `Y` 4 |
| brand_id | varchar(2) |  | PK |  |  | `A` 80 |

<a id="dbogl_site"></a>
## dbo.gl_site

18 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| long_desc | varchar(50) | ✓ |  |  |  |  |
| short_desc | varchar(15) | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| coa_id | varchar(25) | ✓ |  |  |  |  |

<a id="dbogl_tipe"></a>
## dbo.gl_tipe

10 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tipe_id | varchar(10) |  |  |  |  |  |
| tipe_desc | varchar(50) | ✓ |  |  |  |  |
| tipe_group | varchar(1) | ✓ |  |  |  | `R` 5, `N` 4, `X` 1 |

<a id="dbogl_tjournal"></a>
## dbo.gl_tjournal

3 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| journal_id | char(2) |  | PK |  |  | `03` 1, `02` 1, `01` 1 |
| journal_desc | varchar(50) | ✓ |  |  |  |  |
| journal_module | char(1) | ✓ |  |  |  | `R` 1, `K` 1, `B` 1 |
| site_id | varchar(4) |  | PK |  |  |  |
| brand_id | varchar(1) |  | PK |  |  | `A` 3 |

<a id="dboim_roll_acc"></a>
## dbo.im_roll_acc

6 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| merk_id1 | char(1) |  | PK |  |  | `C` 2, `B` 2, `A` 2 |
| merk_id2 | char(1) |  | PK |  |  | `C` 2, `B` 2, `A` 2 |
| acc_roll | varchar(15) | ✓ |  |  |  |  |
| acc_roll1 | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_aplikasi"></a>
## dbo.M_APLIKASI

20 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| aps_id | varchar(2) |  | PK |  |  | `01` 1, `02` 1, `03` 1, `04` 1, `05` 1, `06` 1, `07` 1, `08` 1, `09` 1, `10` 1, `11` 1, `12` 1, `…` |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |

<a id="dbom_aplikasix"></a>
## dbo.M_APLIKASIX

12 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| aps_id | varchar(2) |  | PK |  |  | `01` 1, `02` 1, `03` 1, `04` 1, `05` 1, `06` 1, `07` 1, `08` 1, `09` 1, `10` 1, `11` 1, `12` 1 |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |

<a id="dbom_bahan_acc"></a>
## dbo.m_bahan_acc

10 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| acc_ap_id | varchar(2) |  | PK |  |  | `ZZ` 5, `EZ` 1, `DZ` 1, `CZ` 1, `BZ` 1, `AZ` 1 |
| acc_ap_desc | varchar(50) | ✓ |  |  |  |  |
| acc_ap | varchar(15) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `H` 2, `D` 2, `C` 2, `B` 2, `A` 2 |
| flag | varchar(1) | ✓ |  |  |  | `Y` 10 |

<a id="dbom_bahan_art"></a>
## dbo.m_bahan_art

3.045 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| art_id | varchar(25) |  | PK |  |  |  |
| art_id_lama | varchar(25) | ✓ |  |  |  |  |
| art_id_baru | varchar(25) | ✓ |  |  |  |  |
| art_desc | varchar(60) | ✓ |  |  |  |  |
| art_pendek | varchar(10) | ✓ |  |  |  |  |
| merk_id | varchar(1) | ✓ |  |  |  | `NULL` 3.045 |
| supp_id | varchar(7) | ✓ |  |  |  |  |
| supp_desc | varchar(50) | ✓ |  |  |  |  |
| induk_id | varchar(1) | ✓ |  |  |  | `2` 1.411, `4` 649, `1` 522, `7` 101, `5` 84, `8` 74, `B` 69, `6` 65, `D` 32, `3` 32, `9` 3, `C` 1, `…` |
| induk_id1 | varchar(2) | ✓ |  |  |  | `NULL` 3.045 |
| jenis_id | varchar(2) | ✓ |  |  |  | `06` 428, `02` 318, `52` 271, `50` 248, `05` 210, `44` 182, `38` 116, `58` 96, `04` 81, `14` 69, `A2` 69, `56` 68, `…` |
| jenis_id1 | varchar(2) | ✓ |  |  |  | `NULL` 3.045 |
| tipe_id | varchar(1) | ✓ |  |  |  | `1` 1.351, `2` 1.219, `8` 150, `3` 86, `6` 68, `B` 54, `5` 51, `4` 41, `C` 15, `9` 4, `7` 3, `D` 1, `…` |
| thn | datetime | ✓ |  |  |  |  |
| warna_id | varchar(2) | ✓ |  |  |  | `AA` 1.295, `AB` 296, `ZQ` 226, `WN` 177, `AX` 116, `AI` 89, `MY` 88, `AR` 72, `YG` 60, `WP` 60, `XF` 56, `XH` 54, `…` |
| urut | char(5) | ✓ |  |  |  |  |
| hbeli | decimal(12,3) | ✓ |  |  |  |  |
| hbeli2 | decimal(12,3) | ✓ |  |  |  |  |
| hjual | decimal(12,3) | ✓ |  |  |  |  |
| hjual2 | decimal(12,3) | ✓ |  |  |  |  |
| flag | char(1) | ✓ |  |  |  | `Y` 3.033, `NULL` 7, `N` 5 |
| usrupd | char(10) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| ket | varchar(40) | ✓ |  |  |  |  |
| lkain | varchar(15) | ✓ |  |  |  |  |
| berat | varchar(15) | ✓ |  |  |  |  |
| sat_id | char(2) | ✓ |  |  |  | `03` 1.379, `02` 1.191, `01` 376, `NULL` 83, `05` 8, `08` 2, `09` 2, `04` 2, `07` 1, `10` 1 |
| sat_id2 | char(2) | ✓ |  |  |  | `02` 1.198, `03` 989, `01` 374, `04` 309, `NULL` 82, `09` 77, `08` 9, `05` 5, `07` 1, `10` 1 |
| con_sat | decimal(12,3) | ✓ |  |  |  |  |
| item_id | varchar(2) | ✓ |  |  |  | `ZZ` 1.484, `AZ` 1.402, `BZ` 89, `CZ` 69, `NULL` 1 |
| acc_ap_id | varchar(2) | ✓ |  |  |  | `ZZ` 1.484, `AZ` 1.402, `BZ` 89, `CZ` 69, `NULL` 1 |
| aktif | char(1) | ✓ |  |  |  | `NULL` 3.045 |
| mata_uang | varchar(10) | ✓ |  |  |  |  |
| mata_uang2 | varchar(10) | ✓ |  |  |  |  |
| kurs | decimal(12,3) | ✓ |  |  |  |  |
| kurs2 | decimal(12,3) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 2.031, `B` 805, `C` 175, `H` 34 |
| qty_barcode | decimal(12,3) | ✓ |  |  |  |  |
| dept_id | varchar(3) | ✓ |  |  |  | `023` 1.562, `022` 747, `013` 250, `001` 177, `010` 79, `016` 77, `024` 72, `005` 19, `002` 17, `012` 14, `015` 13, `007` 10, `…` |

<a id="dbom_bahan_dept"></a>
## dbo.m_bahan_dept

13 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| dept_id | varchar(3) |  | PK |  |  | `001` 1, `002` 1, `003` 1, `005` 1, `007` 1, `010` 1, `012` 1, `013` 1, `015` 1, `016` 1, `022` 1, `023` 1, `…` |
| dept_desc | varchar(30) | ✓ |  |  |  |  |
| aktif | char(1) | ✓ |  |  |  | `Y` 13 |

<a id="dbom_bahan_induk"></a>
## dbo.m_bahan_induk

15 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| induk_id | varchar(1) |  | PK |  |  | `1` 1, `2` 1, `3` 1, `4` 1, `5` 1, `6` 1, `7` 1, `8` 1, `9` 1, `A` 1, `B` 1, `C` 1, `…` |
| induk_id_lama | varchar(2) | ✓ |  |  |  | `NULL` 15 |
| induk_id_baru | varchar(2) | ✓ |  |  |  | `NULL` 15 |
| induk_desc | varchar(50) | ✓ |  |  |  |  |
| flag | varchar(1) | ✓ |  |  |  | `Y` 15 |
| brand_id | varchar(2) | ✓ |  |  |  | `A` 6, `H` 3, `C` 3, `B` 3 |
| coa | varchar(20) | ✓ |  |  |  |  |
| coa_biaya | varchar(20) | ✓ |  |  |  |  |
| coa_jual | varchar(20) | ✓ |  |  |  |  |
| coa_hpp | varchar(20) | ✓ |  |  |  |  |
| coa_ak_susut | varchar(20) | ✓ |  |  |  |  |
| cek_aset | varchar(1) | ✓ |  |  |  | `NULL` 12, `Y` 3 |

<a id="dbom_bahan_jenis"></a>
## dbo.m_bahan_jenis

108 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| jenis_id | varchar(2) |  | PK |  |  | `01` 1, `02` 1, `03` 1, `04` 1, `05` 1, `06` 1, `07` 1, `08` 1, `09` 1, `10` 1, `11` 1, `12` 1, `…` |
| jenis_id_lama | varchar(2) | ✓ |  |  |  | `NULL` 108 |
| jenis_id_baru | varchar(2) | ✓ |  |  |  | `NULL` 108 |
| jenis_desc | varchar(40) | ✓ |  |  |  |  |
| flag | varchar(1) | ✓ |  |  |  | `Y` 108 |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 108 |
| coa_asset | varchar(25) | ✓ |  |  |  |  |
| coa_ak_susut | varchar(25) | ✓ |  |  |  |  |
| coa_beban | varchar(25) | ✓ |  |  |  |  |

<a id="dbom_bahan_sat"></a>
## dbo.m_bahan_sat

10 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| sat_id | char(2) |  | PK |  |  | `01` 1, `02` 1, `03` 1, `04` 1, `05` 1, `06` 1, `07` 1, `08` 1, `09` 1, `10` 1 |
| sat_desc | varchar(10) | ✓ |  |  |  |  |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 10 |

<a id="dbom_bahan_tipe"></a>
## dbo.m_bahan_tipe

13 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tipe_id | varchar(1) |  | PK |  |  | `1` 1, `2` 1, `3` 1, `4` 1, `5` 1, `6` 1, `7` 1, `8` 1, `9` 1, `A` 1, `B` 1, `C` 1, `…` |
| tipe_desc | varchar(40) | ✓ |  |  |  |  |
| flag | varchar(1) | ✓ |  |  |  | `Y` 13 |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 13 |

<a id="dbom_bahan_warna"></a>
## dbo.m_bahan_warna

35 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| warna_id | varchar(2) |  | PK |  |  | `AA` 1, `AB` 1, `AC` 1, `AD` 1, `AE` 1, `AF` 1, `AG` 1, `AH` 1, `AI` 1, `AJ` 1, `AK` 1, `BA` 1, `…` |
| warna_desc | varchar(30) | ✓ |  |  |  |  |
| flag | varchar(1) | ✓ |  |  |  | `Y` 35 |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 35 |

<a id="dbom_bank"></a>
## dbo.M_BANK

10 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bank_id | varchar(5) |  | PK |  |  |  |
| bank_desc | varchar(128) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |

<a id="dbom_closing"></a>
## dbo.M_CLOSING

4 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tipe | varchar(20) |  | PK |  |  |  |
| periode | datetime | ✓ |  |  |  |  |

<a id="dbom_customer"></a>
## dbo.M_CUSTOMER

2.519 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| cust_id | varchar(10) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| pulau | varchar(50) | ✓ |  |  |  |  |
| wilayah | varchar(75) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| rjual | numeric(12,0) | ✓ |  |  |  |  |
| grosir | bit | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| acc_ar | varchar(15) | ✓ |  |  |  |  |
| kab | varchar(75) | ✓ |  |  |  |  |
| kab_kota | varchar(75) | ✓ |  |  |  |  |
| acc_disc | varchar(15) | ✓ |  |  |  |  |
| acc_jual | varchar(15) | ✓ |  |  |  |  |
| jam_masuk | char(5) | ✓ |  |  |  |  |
| jam_masuk2 | char(5) | ✓ |  |  |  |  |
| jam_keluar | char(5) | ✓ |  |  |  |  |
| jam_keluar2 | char(5) | ✓ |  |  |  |  |
| cust_name | varchar(100) | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |

<a id="dbom_divisi"></a>
## dbo.M_DIVISI

6 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| divisi_id | varchar(2) |  | PK |  |  | `02` 1, `04` 1, `05` 1, `06` 1, `07` 1, `08` 1 |
| divisi_desc | varchar(50) | ✓ |  |  |  |  |

<a id="dbom_divisi_group"></a>
## dbo.M_DIVISI_GROUP

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| group_div_id | bigint |  |  |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |

<a id="dbom_ekspedisi"></a>
## dbo.M_EKSPEDISI

12 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| ekspedisi_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |

<a id="dbom_gaji_umr"></a>
## dbo.M_GAJI_UMR

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| umr_id | bigint |  | PK IDENTITY |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| periode | datetime | ✓ |  |  |  |  |
| umr | numeric(15,0) | ✓ |  |  |  |  |
| min_telat | int | ✓ |  | ((0)) |  |  |
| max_telat | int | ✓ |  | ((0)) |  |  |
| pot_absen_telat | numeric(15,0) | ✓ |  | ((0)) |  |  |
| uang_lembur | numeric(15,0) | ✓ |  | ((0)) |  |  |
| pot_lembur | bit | ✓ |  | ((0)) |  |  |
| hari | int | ✓ |  | ((0)) |  |  |
| umr_hari | numeric(15,0) | ✓ |  |  |  |  |
| umr_hari2 | numeric(15,0) | ✓ |  |  |  |  |
| umr_hari3 | numeric(15,0) | ✓ |  |  |  |  |
| umr_hari4 | numeric(15,0) | ✓ |  |  |  |  |
| umr_jam | numeric(15,0) | ✓ |  |  |  |  |
| umr_jam2 | numeric(15,0) | ✓ |  |  |  |  |
| umr_jam3 | numeric(15,0) | ✓ |  |  |  |  |
| umr_jam4 | numeric(15,0) | ✓ |  |  |  |  |
| jam_weekday | numeric(5,2) | ✓ |  |  |  |  |
| jam_weekend | numeric(5,2) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| user_entry | varchar(30) | ✓ |  |  |  |  |

<a id="dbom_pegawai"></a>
## dbo.M_PEGAWAI

62 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| peg_id | bigint |  | PK IDENTITY |  |  |  |
| pt_id | smallint | ✓ |  |  |  |  |
| kd_brand | varchar(15) | ✓ |  |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| tipe_id | bigint | ✓ |  |  |  |  |
| group_peg_id | bigint | ✓ |  |  |  |  |
| tgl_kontrak_awal | datetime | ✓ |  |  |  |  |
| tgl_kontrak_akhir | datetime | ✓ |  |  |  |  |
| tgl_awal_komisi | datetime | ✓ |  |  |  |  |
| flag_active | char(1) | ✓ |  | ('Y') |  | `Y` 34, `N` 28 |
| user_entry | varchar(30) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| tgl_lahir | datetime | ✓ |  |  |  |  |
| tempat_lahir | varchar(50) | ✓ |  |  |  |  |
| kelamin | char(1) | ✓ |  |  |  | `L` 45, `P` 17 |
| status | varchar(30) | ✓ |  |  |  |  |
| pendidikan | varchar(30) | ✓ |  |  |  |  |
| telepon | varchar(30) | ✓ |  |  |  |  |
| no_ktp | varchar(20) | ✓ |  |  |  |  |
| npwp | varchar(50) | ✓ |  |  |  |  |
| norek | varchar(50) | ✓ |  |  |  |  |
| nama_rek | varchar(50) | ✓ |  |  |  |  |
| bank_rek | varchar(50) | ✓ |  |  |  |  |
| nobpjs | varchar(50) | ✓ |  |  |  |  |
| bpjs_rp | numeric(15,0) | ✓ |  |  |  |  |
| jab_id | bigint | ✓ |  |  |  |  |
| divisi_id | varchar(5) | ✓ |  |  |  |  |
| shift_id | smallint | ✓ |  |  |  |  |
| tipe_gaji_id | varchar(5) | ✓ |  |  |  |  |
| gaji | numeric(15,0) | ✓ |  |  |  |  |
| tunj_jabatan | numeric(15,0) | ✓ |  |  |  |  |
| uang_luar_kota | numeric(15,0) | ✓ |  |  |  |  |
| flag_gaji | char(1) | ✓ |  | ('Y') |  | `Y` 36, `N` 26 |
| group_gaji | varchar(20) | ✓ |  |  |  |  |
| password | varchar(50) | ✓ |  |  |  |  |
| email | varchar(150) | ✓ |  |  |  |  |
| foto | varchar(100) | ✓ |  |  |  |  |
| tgl_foto | datetime | ✓ |  |  |  |  |
| face_acc | bit | ✓ |  |  |  |  |
| face_acc_nik | varchar(15) | ✓ |  |  |  |  |
| tgl_face_acc | datetime | ✓ |  |  |  |  |
| face_id | varchar(max) | ✓ |  |  |  |  |
| join_id | bigint | ✓ |  |  |  |  |
| xxx | varchar(50) | ✓ |  |  |  |  |
| sts_peg | varchar(10) | ✓ |  |  |  |  |
| no_absen | numeric(10,0) | ✓ |  |  |  |  |
| nama_dkt | varchar(50) | ✓ |  |  |  |  |
| al_dkt | varchar(50) | ✓ |  |  |  |  |
| tlp_dkt | varchar(50) | ✓ |  |  |  |  |
| hub | varchar(50) | ✓ |  |  |  |  |

<a id="dbom_pegawai_group"></a>
## dbo.M_PEGAWAI_GROUP

6 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| group_peg_id | bigint |  | PK IDENTITY |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| premi | numeric(15,0) | ✓ |  | ((0)) |  |  |

<a id="dbom_pegawai_izin_tipe"></a>
## dbo.M_PEGAWAI_IZIN_TIPE

27 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | int |  | PK IDENTITY |  |  |  |
| jenis_name | varchar(50) | ✓ |  |  |  |  |
| item_name | varchar(50) | ✓ |  |  |  |  |
| flag_dibayar | smallint | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((1)) |  |  |
| max_hr | numeric(10,0) | ✓ |  |  |  |  |
| pokok_pot | numeric(10,0) | ✓ |  |  |  |  |
| premi_pot | numeric(10,0) | ✓ |  |  |  |  |

<a id="dbom_pegawai_jabatan"></a>
## dbo.M_PEGAWAI_JABATAN

26 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| jab_id | bigint |  | PK IDENTITY |  |  |  |
| jab_desc | varchar(50) | ✓ |  |  |  |  |
| pt_id | smallint | ✓ |  |  |  |  |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 26 |
| jab_id1 | bigint | ✓ |  |  |  |  |
| jab_id2 | bigint | ✓ |  |  |  |  |
| jab_id3 | bigint | ✓ |  |  |  |  |
| jab_id4 | bigint | ✓ |  |  |  |  |
| nik1 | varchar(10) | ✓ |  |  |  |  |
| nik2 | varchar(10) | ✓ |  |  |  |  |
| nik3 | varchar(10) | ✓ |  |  |  |  |
| nik4 | varchar(10) | ✓ |  |  |  |  |

<a id="dbom_pegawai_jabatan_level"></a>
## dbo.M_PEGAWAI_JABATAN_LEVEL

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| level_id | bigint |  | PK IDENTITY |  |  |  |
| pt_id | smallint | ✓ |  |  |  |  |
| jab_id | bigint | ✓ | → dbo.M_PEGAWAI_JABATAN(jab_id) |  |  |  |
| nik | varchar(10) | ✓ |  |  |  |  |
| jab_id_parent | bigint | ✓ |  |  |  |  |
| sort_order | smallint | ✓ |  |  |  |  |

<a id="dbom_pegawai_kontrak"></a>
## dbo.M_PEGAWAI_KONTRAK

138 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| kontrak_id | bigint |  | PK IDENTITY |  |  |  |
| peg_id | bigint | ✓ | → dbo.M_PEGAWAI(peg_id) |  |  |  |
| pt_id | smallint | ✓ |  |  |  |  |
| kd_brand | varchar(15) | ✓ |  |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| tipe | varchar(50) | ✓ |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| tgl_awal | datetime | ✓ |  |  |  |  |
| tgl_akhir | datetime | ✓ |  |  |  |  |
| remark | varchar(100) | ✓ |  |  |  |  |
| user_entry | varchar(30) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| jab_id | bigint | ✓ |  |  |  |  |
| tipe_id | bigint | ✓ |  |  |  |  |
| divisi_id | varchar(5) | ✓ |  |  |  |  |
| group_peg_id | bigint | ✓ |  |  |  |  |
| status_pegangan | bit | ✓ |  | ((1)) |  |  |
| status_aktif | bit | ✓ |  | ((0)) |  |  |
| sts_peg | varchar(10) | ✓ |  |  |  |  |

<a id="dbom_pegawai_lembur"></a>
## dbo.M_PEGAWAI_LEMBUR

19 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| lembur_id | int |  | PK IDENTITY |  |  |  |
| jam1 | varchar(5) | ✓ |  |  |  |  |
| jam2 | varchar(5) | ✓ |  |  |  |  |
| jumlah | decimal(10,1) | ✓ |  |  |  |  |
| Rp | decimal(10,1) | ✓ |  |  |  |  |

<a id="dbom_pegawai_shift"></a>
## dbo.M_PEGAWAI_SHIFT

2 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| shift_id | smallint |  | PK IDENTITY |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| jam_masuk | varchar(5) | ✓ |  |  |  |  |
| jam_masuk2 | varchar(5) | ✓ |  |  |  |  |
| jam_keluar | varchar(5) | ✓ |  |  |  |  |
| jam_keluar2 | varchar(5) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |

<a id="dbom_pegawai_tunjangan"></a>
## dbo.M_PEGAWAI_TUNJANGAN

19 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tunj_id | bigint |  | PK IDENTITY |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| peg_id | bigint | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| jumlah | numeric(12,0) | ✓ |  |  |  |  |
| jumlah2 | numeric(12,0) | ✓ |  |  |  |  |
| user_entry | varchar(30) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| per_gapok | numeric(12,0) | ✓ |  |  |  |  |
| per_premi | numeric(12,0) | ✓ |  |  |  |  |
| gaji_total | numeric(12,0) | ✓ |  |  |  |  |
| hr_gapok | numeric(12,0) | ✓ |  |  |  |  |
| hr_premi | numeric(12,0) | ✓ |  |  |  |  |
| hr | numeric(12,0) | ✓ |  |  |  |  |
| jam_gapok | numeric(12,0) | ✓ |  |  |  |  |
| jam_premi | numeric(12,0) | ✓ |  |  |  |  |
| umakan | numeric(12,0) | ✓ |  |  |  |  |

<a id="dbom_produk"></a>
## dbo.M_PRODUK

232.985 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| produk_id | varchar(20) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(25) | ✓ |  |  |  |  |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| brand_id | varchar(1) | ✓ | → dbo.M_PRODUK_BRAND(brand_id) |  |  | `B` 129.235, `A` 97.759, `C` 5.209, `H` 782 |
| gender_id | char(1) | ✓ | → dbo.M_PRODUK_GENDER(gender_id) |  |  | `2` 229.779, `3` 1.775, `1` 657, `5` 443, `4` 331 |
| grup_dept | varchar(5) | ✓ | → dbo.M_PRODUK_DEPT2(grup_dept, dept_id) |  |  |  |
| dept_id | varchar(5) | ✓ | → dbo.M_PRODUK_DEPT2(grup_dept, dept_id) |  |  |  |
| bahan_id | varchar(3) | ✓ | → dbo.M_PRODUK_BAHAN(bahan_id) |  |  | `002` 60.761, `001` 37.622, `015` 18.029, `100` 9.338, `024` 7.475, `019` 7.025, `037` 6.754, `023` 6.040, `050` 5.447, `035` 4.858, `036` 4.291, `005` 4.263, `…` |
| nomor | varchar(3) | ✓ |  |  |  | `001` 38.654, `002` 20.931, `003` 13.731, `004` 9.882, `005` 7.489, `006` 6.148, `007` 5.227, `008` 4.644, `009` 3.926, `010` 3.657, `011` 3.179, `012` 3.026, `…` |
| period | smalldatetime | ✓ |  |  |  |  |
| model_id | varchar(20) | ✓ | → dbo.M_PRODUK_MODEL(model_id) |  |  |  |
| warna_id | varchar(2) | ✓ | → dbo.M_PRODUK_WARNA(warna_id) |  |  | `AA` 83.267, `AB` 16.203, `AI` 13.486, `WN` 11.899, `WP` 8.753, `ZQ` 8.629, `XH` 7.949, `WW` 7.408, `AR` 6.847, `XF` 6.172, `BG` 6.077, `ZS` 4.752, `…` |
| size_id | varchar(2) | ✓ | → dbo.M_PRODUK_SIZE(size_id) |  |  | `L` 55.983, `M` 55.976, `XL` 53.260, `2X` 40.155, `S` 7.385, `AS` 6.660, `42` 2.653, `40` 2.652, `39` 2.449, `41` 2.445, `43` 2.424, `36` 260, `…` |
| qty_barcode | numeric(10,0) | ✓ |  |  |  |  |
| produk_id_lama | varchar(50) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| tipe_id | varchar(2) | ✓ | → dbo.M_PRODUK_TIPE(tipe_id) |  |  | `02` 128.725, `01` 97.739, `03` 5.042, `06` 782, `05` 308, `NULL` 214, `04` 175 |
| jenis_id | varchar(5) | ✓ |  |  |  |  |
| model_produk | varchar(25) | ✓ |  |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  | `01` 124.657, `03` 47.125, `02` 37.830, `08` 7.676, `07` 4.085, `09` 2.225, `04` 1.918, `17` 1.456, `11` 1.014, `15` 921, `10` 899, `14` 863, `…` |
| mall_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| nama_pendek2 | varchar(25) | ✓ |  |  |  |  |
| kode_mall | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((1)) |  |  |

**Index:** `IDX_M_PRODUK` (nama, nama_pendek, brand_id, gender_id, grup_dept, dept_id, bahan_id, nomor, period, model_id, warna_id, size_id, supp_id, tipe_id, jenis_id, model_produk, aps_id, mall_barcode, nama_pendek2, kode_mall, flag_aktif)

<a id="dbom_produk_bahan"></a>
## dbo.M_PRODUK_BAHAN

132 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bahan_id | varchar(3) |  | PK |  |  | `117` 1, `053` 1, `088` 1, `078` 1, `028` 1, `044` 1, `003` 1, `075` 1, `064` 1, `094` 1, `124` 1, `027` 1, `…` |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_BAHAN` (nama, nama_pendek, flag_aktif)

<a id="dbom_produk_bahanx"></a>
## dbo.M_PRODUK_BAHANX

82 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bahan_id | varchar(3) |  | PK |  |  | `001` 1, `002` 1, `003` 1, `004` 1, `005` 1, `006` 1, `007` 1, `008` 1, `009` 1, `010` 1, `011` 1, `012` 1, `…` |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |

<a id="dbom_produk_brand"></a>
## dbo.M_PRODUK_BRAND

8 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| brand_id | varchar(1) |  | PK |  |  | `A` 1, `E` 1, `B` 1, `F` 1, `C` 1, `G` 1, `H` 1, `D` 1 |
| nama | varchar(50) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | (0) |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| coa_so_bj | varchar(25) | ✓ |  |  |  |  |
| coa_so_rm | varchar(25) | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_BRAND` (nama, flag_aktif, coa_inv, coa_so_bj, coa_so_rm)

<a id="dbom_produk_dept"></a>
## dbo.M_PRODUK_DEPT

14 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| grup_dept | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| disc | numeric(10,2) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| grup_dept2 | varchar(5) | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_DEPT` (nama, flag_aktif, grup_dept2, coa_inv)

<a id="dbom_produk_dept2"></a>
## dbo.M_PRODUK_DEPT2

7.212 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| grup_dept | varchar(5) |  | PK → dbo.M_PRODUK_DEPT(grup_dept) |  |  |  |
| dept_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| jenis_id | varchar(2) | ✓ |  |  |  | `NULL` 7.211, `01` 1 |

**Index:** `IDX_M_PRODUK_DEPT2` (nama, nama_pendek, flag_aktif, jenis_id)

<a id="dbom_produk_dept2x"></a>
## dbo.M_PRODUK_DEPT2X

7.114 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| dept_id | varchar(5) |  | PK |  |  |  |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |

<a id="dbom_produk_dept2xx"></a>
## dbo.M_PRODUK_DEPT2XX

7.119 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| grup_dept | varchar(5) |  | PK |  |  |  |
| dept_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| jenis_id | varchar(2) | ✓ |  |  |  | `NULL` 7.118, `1` 1 |

<a id="dbom_produk_dept2xxxx"></a>
## dbo.M_PRODUK_DEPT2xxxx

666 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| grup_dept | varchar(5) |  | PK |  |  |  |
| dept_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| jenis_id | varchar(2) | ✓ |  |  |  | `NULL` 666 |

<a id="dbom_produk_deptxxxx"></a>
## dbo.M_PRODUK_DEPTxxxx

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| grup_dept | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| disc | numeric(10,2) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| grup_dept2 | varchar(5) | ✓ |  |  |  |  |

<a id="dbom_produk_gender"></a>
## dbo.M_PRODUK_GENDER

5 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| gender_id | char(1) |  | PK |  |  | `4` 1, `1` 1, `5` 1, `2` 1, `3` 1 |
| nama | varchar(50) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | (0) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_GENDER` (nama, flag_aktif)

<a id="dbom_produk_jenis"></a>
## dbo.M_PRODUK_JENIS

55 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| jenis_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(40) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| nama_pendek | varchar(10) | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_JENIS` (nama, flag_aktif, nama_pendek)

<a id="dbom_produk_model"></a>
## dbo.M_PRODUK_MODEL

33.586 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(25) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 18.615, `A` 13.799, `C` 1.010, `H` 162 |
| gender_id | char(1) | ✓ |  |  |  | `2` 32.854, `3` 408, `1` 133, `4` 116, `5` 75 |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| dept_id | varchar(5) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  | `002` 7.601, `001` 4.265, `024` 2.031, `037` 1.520, `015` 1.252, `025` 1.250, `100` 1.188, `039` 1.085, `035` 896, `036` 835, `019` 765, `023` 641, `…` |
| nomor | varchar(3) | ✓ |  |  |  | `001` 6.493, `002` 3.396, `003` 2.180, `004` 1.600, `005` 1.226, `006` 984, `007` 805, `008` 721, `009` 615, `010` 553, `011` 463, `012` 421, `…` |
| period | smalldatetime | ✓ |  |  |  |  |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| model_id_lama | varchar(20) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| tipe_id | varchar(2) | ✓ |  |  |  | `02` 18.534, `01` 13.797, `03` 978, `06` 162, `05` 47, `NULL` 37, `04` 31 |
| jenis_id | varchar(5) | ✓ |  |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  | `01` 15.664, `03` 7.486, `02` 5.908, `08` 1.335, `09` 1.119, `07` 371, `17` 254, `04` 225, `13` 217, `14` 184, `11` 166, `15` 134, `…` |
| model_produk | varchar(25) | ✓ |  |  |  |  |
| mall_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| nama_pendek2 | varchar(25) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((1)) |  |  |
| foto | varchar(max) | ✓ |  |  |  |  |
| sls_tipe | varchar(2) | ✓ |  |  |  | `NULL` 23.453, `01` 10.133 |
| sls_tgl | datetime | ✓ |  |  |  |  |
| prioritas | varchar(15) | ✓ |  |  |  |  |
| beres | varchar(1) | ✓ |  |  |  | `1` 18.580, `NULL` 15.006 |
| user_upload | varchar(15) | ✓ |  |  |  |  |
| tgl_upload | datetime | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_MODEL` (nama, nama_pendek, brand_id, gender_id, grup_dept, dept_id, bahan_id, nomor, period, supp_id, tipe_id, jenis_id, aps_id, model_produk, mall_barcode, nama_pendek2, flag_aktif)

<a id="dbom_produk_model_size"></a>
## dbo.M_PRODUK_MODEL_SIZE

74.507 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| size_id | varchar(2) |  | PK |  |  | `M` 17.331, `L` 17.320, `XL` 17.164, `2X` 12.239, `S` 4.299, `AS` 1.982, `42` 821, `40` 821, `39` 653, `41` 652, `43` 642, `36` 200, `…` |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| mall_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |

<a id="dbom_produk_model_xxx"></a>
## dbo.M_produk_model_xxx

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(25) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  |  |
| gender_id | char(1) | ✓ |  |  |  |  |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| dept_id | varchar(5) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  |  |
| nomor | varchar(3) | ✓ |  |  |  |  |
| period | smalldatetime | ✓ |  |  |  |  |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| model_id_lama | varchar(20) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| tipe_id | varchar(2) | ✓ |  |  |  |  |
| jenis_id | varchar(5) | ✓ |  |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  |  |
| model_produk | varchar(25) | ✓ |  |  |  |  |
| mall_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| nama_pendek2 | varchar(25) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((1)) |  |  |
| foto | varchar(max) | ✓ |  |  |  |  |
| sls_tipe | varchar(2) | ✓ |  |  |  |  |
| sls_tgl | datetime | ✓ |  |  |  |  |
| prioritas | varchar(15) | ✓ |  |  |  |  |
| beres | varchar(1) | ✓ |  |  |  |  |
| user_upload | varchar(15) | ✓ |  |  |  |  |
| tgl_upload | datetime | ✓ |  |  |  |  |

<a id="dbom_produk_model2"></a>
## dbo.M_PRODUK_MODEL2

66.133 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK → dbo.M_PRODUK_MODEL(model_id) |  |  |  |
| warna_id | varchar(2) |  | PK |  |  | `AA` 23.219, `AB` 4.370, `AI` 4.034, `WN` 3.283, `ZQ` 3.043, `WP` 2.473, `XH` 2.263, `WW` 1.993, `AR` 1.978, `BG` 1.736, `XF` 1.729, `ZS` 1.450, `…` |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_produk_model3"></a>
## dbo.M_PRODUK_MODEL3

109.137 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK → dbo.M_PRODUK_MODEL(model_id) |  |  |  |
| size_id | varchar(2) |  | PK |  |  | `L` 25.745, `M` 25.734, `XL` 24.508, `2X` 16.666, `S` 5.646, `AS` 3.487, `40` 1.426, `42` 1.425, `39` 1.264, `41` 1.263, `43` 1.250, `36` 196, `…` |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_produk_modelx"></a>
## dbo.M_PRODUK_MODELX

13.191 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(25) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 6.925, `A` 5.981, `C` 272, `H` 13 |
| gender_id | char(1) | ✓ |  |  |  | `2` 13.020, `3` 145, `1` 20, `5` 4, `4` 2 |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| dept_id | varchar(5) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  | `002` 1.837, `001` 1.773, `024` 934, `100` 834, `036` 519, `039` 518, `015` 480, `019` 416, `037` 412, `035` 325, `005` 310, `042` 302, `…` |
| nomor | varchar(3) | ✓ |  |  |  | `001` 1.998, `002` 1.017, `003` 686, `004` 532, `005` 430, `006` 354, `007` 293, `008` 274, `009` 234, `010` 218, `011` 192, `012` 168, `…` |
| period | smalldatetime | ✓ |  |  |  |  |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| model_id_lama | varchar(20) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| tipe_id | varchar(2) | ✓ |  |  |  | `02` 6.889, `01` 5.980, `03` 272, `04` 20, `05` 16, `06` 13, `NULL` 1 |
| jenis_id | varchar(5) | ✓ |  |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  | `01` 5.805, `03` 4.155, `02` 1.234, `08` 629, `09` 419, `07` 305, `13` 183, `04` 175, `10` 78, `12` 54, `06` 42, `05` 40, `…` |
| model_produk | varchar(25) | ✓ |  |  |  |  |
| mall_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| nama_pendek2 | varchar(25) | ✓ |  |  |  |  |
| kode_mall | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((1)) |  |  |

<a id="dbom_produk_modelxxx"></a>
## dbo.M_PRODUK_MODELXXX

9.871 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| model_id | varchar(20) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(25) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 5.250, `A` 4.444, `C` 177 |
| gender_id | char(1) | ✓ |  |  |  | `2` 9.691, `3` 157, `1` 18, `5` 4, `4` 1 |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| dept_id | varchar(5) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  | `1` 1.606, `2` 1.288, `24` 591, `36` 408, `15` 385, `19` 360, `39` 347, `5` 335, `62` 318, `37` 306, `7` 260, `35` 248, `…` |
| nomor | varchar(3) | ✓ |  |  |  | `1` 1.285, `2` 653, `3` 450, `4` 348, `5` 296, `6` 247, `7` 212, `8` 200, `9` 170, `10` 154, `11` 139, `12` 128, `…` |
| period | smalldatetime | ✓ |  |  |  |  |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| model_id_lama | varchar(20) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| tipe_id | varchar(2) | ✓ |  |  |  | `2` 5.217, `1` 4.443, `3` 177, `4` 21, `5` 13 |
| jenis_id | varchar(5) | ✓ |  |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  | `1` 4.136, `3` 3.410, `2` 735, `8` 467, `9` 301, `7` 300, `13` 194, `4` 170, `10` 54, `6` 42, `5` 36, `11` 14, `…` |
| model_produk | varchar(25) | ✓ |  |  |  |  |
| model_produk2 | varchar(25) | ✓ |  |  |  |  |

<a id="dbom_produk_size"></a>
## dbo.M_PRODUK_SIZE

29 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| size_id | varchar(2) |  | PK |  |  | `2X` 1, `33` 1, `34` 1, `35` 1, `36` 1, `37` 1, `38` 1, `39` 1, `3X` 1, `40` 1, `41` 1, `42` 1, `…` |
| nama | varchar(50) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | (0) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| urut | numeric(5,0) | ✓ |  |  |  |  |
| nama_pendek | varchar(10) | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_SIZE` (nama, flag_aktif, urut, nama_pendek)

<a id="dbom_produk_sls_tipe"></a>
## dbo.M_PRODUK_SLS_TIPE

5 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| sls_tipe | varchar(2) |  | PK |  |  | `01` 1, `02` 1, `03` 1, `04` 1, `05` 1 |
| nama | varchar(30) | ✓ |  |  |  |  |

<a id="dbom_produk_tipe"></a>
## dbo.M_PRODUK_TIPE

6 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tipe_id | varchar(2) |  | PK |  |  | `05` 1, `01` 1, `02` 1, `03` 1, `06` 1, `04` 1 |
| nama | varchar(50) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 3, `H` 1, `C` 1, `A` 1 |
| flag_aktif | bit | ✓ |  | ((0)) |  |  |

**Index:** `IDX_M_PRODUK_TIPE` (nama, brand_id, flag_aktif)

<a id="dbom_produk_upharga"></a>
## dbo.M_PRODUK_UPHARGA

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| toko_id | varchar(5) | ✓ |  |  |  |  |
| produk_id | varchar(20) | ✓ |  |  |  |  |
| harga | numeric(10,0) | ✓ |  |  |  |  |
| brand_id | varchar(5) |  | PK |  |  |  |

<a id="dbom_produk_warna"></a>
## dbo.M_PRODUK_WARNA

158 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| warna_id | varchar(2) |  | PK |  |  | `MY` 1, `GE` 1, `AA` 1, `WW` 1, `BX` 1, `BA` 1, `ZQ` 1, `BJ` 1, `WM` 1, `AX` 1, `WY` 1, `ZS` 1, `…` |
| nama | varchar(50) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | (0) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |

**Index:** `IDX_M_PRODUK_WARNA` (nama, flag_aktif)

<a id="dbom_produk_xxx"></a>
## dbo.M_produk_xxx

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| produk_id | varchar(20) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nama_pendek | varchar(25) | ✓ |  |  |  |  |
| hbeli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir | numeric(15,0) | ✓ |  |  |  |  |
| pembilang | numeric(15,2) | ✓ |  |  |  |  |
| penyebut | numeric(15,2) | ✓ |  |  |  |  |
| hjual_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| brand_id | varchar(1) | ✓ |  |  |  |  |
| gender_id | char(1) | ✓ |  |  |  |  |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| dept_id | varchar(5) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  |  |
| nomor | varchar(3) | ✓ |  |  |  |  |
| period | smalldatetime | ✓ |  |  |  |  |
| model_id | varchar(20) | ✓ |  |  |  |  |
| warna_id | varchar(2) | ✓ |  |  |  |  |
| size_id | varchar(2) | ✓ |  |  |  |  |
| qty_barcode | numeric(10,0) | ✓ |  |  |  |  |
| produk_id_lama | varchar(50) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| tipe_id | varchar(2) | ✓ |  |  |  |  |
| jenis_id | varchar(5) | ✓ |  |  |  |  |
| model_produk | varchar(25) | ✓ |  |  |  |  |
| aps_id | varchar(2) | ✓ |  |  |  |  |
| mall_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| nama_pendek2 | varchar(25) | ✓ |  |  |  |  |
| kode_mall | varchar(20) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  | ((1)) |  |  |

<a id="dbom_rekening"></a>
## dbo.M_REKENING

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bank_id | varchar(5) |  | PK → dbo.M_BANK(bank_id) |  |  |  |
| norek | varchar(30) |  | PK |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |

<a id="dbom_setup"></a>
## dbo.M_Setup

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| path_foto_absen | varchar(500) | ✓ |  |  |  |  |

**Index:** `IX_M_Setup` (path_foto_absen)

<a id="dbom_status"></a>
## dbo.m_status

7 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| status_id | varchar(5) |  | PK |  |  |  |
| status_desc | varchar(20) | ✓ |  |  |  |  |
| PTKP | numeric(14,0) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `LG` 7 |

<a id="dbom_supplier"></a>
## dbo.M_SUPPLIER

338 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| fax | varchar(25) | ✓ |  |  |  |  |
| npwp | varchar(30) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| brand_id | varchar(5) |  | PK |  |  |  |
| coa_ap | varchar(15) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| coa_ar | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_supplier0"></a>
## dbo.M_SUPPLIER0

8 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| fax | varchar(25) | ✓ |  |  |  |  |
| npwp | varchar(30) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| brand_id | varchar(5) | ✓ |  |  |  |  |
| coa_ap | varchar(15) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| coa_ar | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_supplier2"></a>
## dbo.m_supplier2

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| kd1 | varchar(10) |  | PK |  |  |  |
| nm | varchar(70) | ✓ |  |  |  |  |
| br | varchar(5) |  | PK |  |  |  |
| kd2 | varchar(10) |  | PK |  |  |  |
| br2 | varchar(5) | ✓ |  |  |  |  |

<a id="dbom_supplierx"></a>
## dbo.M_SUPPLIERx

116 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| fax | varchar(25) | ✓ |  |  |  |  |
| npwp | varchar(30) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| brand_id | varchar(5) | ✓ |  |  |  |  |
| coa_ap | varchar(15) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| coa_ar | varchar(15) | ✓ |  |  |  |  |
| coa_ap_baru | varchar(15) | ✓ |  |  |  |  |
| coa_inv_baru | varchar(15) | ✓ |  |  |  |  |
| coa_ar_baru | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_supplierxx"></a>
## dbo.M_SUPPLIERxx

116 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| fax | varchar(25) | ✓ |  |  |  |  |
| npwp | varchar(30) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| brand_id | varchar(5) |  | PK |  |  |  |
| coa_ap | varchar(15) | ✓ |  |  |  |  |
| coa_inv | varchar(15) | ✓ |  |  |  |  |
| coa_ar | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_table_pro"></a>
## dbo.M_TABLE_PRO

12 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| line_id | bigint |  | PK |  |  |  |
| tipe | varchar(50) | ✓ |  |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| urut | smallint | ✓ |  |  |  |  |

<a id="dbom_tipe_gaji"></a>
## dbo.M_TIPE_GAJI

3 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tipe_gaji_id | varchar(5) |  | PK |  |  |  |
| tipe_gaji_desc | varchar(50) | ✓ |  |  |  |  |

<a id="dbom_tipe_pegawai"></a>
## dbo.M_TIPE_PEGAWAI

3 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| tipe_id | bigint |  | PK IDENTITY |  |  |  |
| tipe_desc | varchar(50) | ✓ |  |  |  |  |

<a id="dbom_tipe_telat"></a>
## dbo.M_tipe_telat

6 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| telat_id | int |  | PK IDENTITY |  |  |  |
| menit | numeric(10,0) | ✓ |  |  |  |  |
| per | numeric(10,0) | ✓ |  |  |  |  |

<a id="dbom_toko"></a>
## dbo.M_TOKO

17 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| toko_id | varchar(5) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| rjual | numeric(12,0) | ✓ |  |  |  |  |
| site_id | varchar(4) | ✓ |  |  |  |  |
| acc_ar | varchar(15) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(5) | ✓ |  |  |  |  |
| srvname | varchar(30) | ✓ |  |  |  |  |
| dbname | nchar(25) | ✓ |  |  |  |  |
| acc_disc | varchar(15) | ✓ |  |  |  |  |
| acc_jual | varchar(15) | ✓ |  |  |  |  |
| coa_hutang | varchar(25) | ✓ |  |  |  |  |
| coa_biaya | varchar(25) | ✓ |  |  |  |  |
| promo | numeric(12,0) | ✓ |  |  |  |  |
| sdr | bit | ✓ |  |  |  |  |

<a id="dbom_toko_dtl"></a>
## dbo.M_TOKO_DTL

4 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| toko_id | varchar(5) |  | PK |  |  |  |
| brand_id | varchar(1) |  | PK |  |  | `H` 1, `C` 1, `B` 1, `A` 1 |
| coa_biaya | varchar(15) | ✓ |  |  |  |  |

<a id="dbom_toko2"></a>
## dbo.M_TOKO2

8 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| toko_id | varchar(5) |  | PK |  |  |  |
| toko_id2 | varchar(10) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| rjual | numeric(12,0) | ✓ |  |  |  |  |
| site_id | varchar(4) | ✓ |  |  |  |  |
| acc_ar | varchar(15) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(5) | ✓ |  |  |  |  |
| srvname | varchar(30) | ✓ |  |  |  |  |
| dbname | nchar(25) | ✓ |  |  |  |  |
| acc_disc | varchar(15) | ✓ |  |  |  |  |
| acc_jual | varchar(15) | ✓ |  |  |  |  |
| coa_hutang | varchar(25) | ✓ |  |  |  |  |
| coa_biaya | varchar(25) | ✓ |  |  |  |  |
| promo | numeric(10,2) | ✓ |  |  |  |  |
| sdr | bit | ✓ |  |  |  |  |

<a id="dbom_toko3"></a>
## dbo.M_TOKO3

4.310 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| toko_id | varchar(5) |  | PK |  |  |  |
| toko_id2 | varchar(10) |  | PK |  |  |  |
| site_id | varchar(4) | ✓ |  |  |  |  |
| pembeli_id | varchar(10) |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| alamat | varchar(300) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| provinsi | varchar(50) | ✓ |  |  |  |  |
| country | varchar(50) | ✓ |  |  |  |  |
| kode_pos | varchar(50) | ✓ |  |  |  |  |
| telp | varchar(25) | ✓ |  |  |  |  |
| email | varchar(150) | ✓ |  |  |  |  |
| user_entry | varchar(15) | ✓ |  |  |  |  |
| tgl_entry | smalldatetime | ✓ |  |  |  |  |
| user_upd | varchar(15) | ✓ |  |  |  |  |
| tgl_upd | smalldatetime | ✓ |  |  |  |  |
| Nama_Account | varchar(50) | ✓ |  |  |  |  |

<a id="dbom_users"></a>
## dbo.M_USERS

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| peg_id | bigint |  | PK |  |  |  |
| nama | varchar(50) | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| tgl_kontrak_awal | datetime | ✓ |  |  |  |  |
| tgl_kontrak_akhir | datetime | ✓ |  |  |  |  |
| tgl_awal_komisi | datetime | ✓ |  |  |  |  |
| flag_active | char(1) | ✓ |  | ('Y') |  |  |
| user_entry | varchar(30) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| alamat | varchar(200) | ✓ |  |  |  |  |
| tgl_lahir | datetime | ✓ |  |  |  |  |
| tempat_lahir | varchar(50) | ✓ |  |  |  |  |
| kelamin | char(1) | ✓ |  |  |  |  |
| status | varchar(30) | ✓ |  |  |  |  |
| pendidikan | varchar(30) | ✓ |  |  |  |  |
| telepon | varchar(30) | ✓ |  |  |  |  |
| no_ktp | varchar(20) | ✓ |  |  |  |  |
| npwp | varchar(50) | ✓ |  |  |  |  |
| norek | varchar(50) | ✓ |  |  |  |  |
| nama_rek | varchar(50) | ✓ |  |  |  |  |
| bank_rek | varchar(50) | ✓ |  |  |  |  |
| nobpjs | varchar(50) | ✓ |  |  |  |  |
| bpjs_rp | numeric(15,0) | ✓ |  |  |  |  |
| jab_id | bigint | ✓ |  |  |  |  |
| divisi_id | varchar(5) | ✓ |  |  |  |  |
| shift_id | smallint | ✓ |  |  |  |  |
| tipe_gaji_id | varchar(5) | ✓ |  |  |  |  |
| gaji | numeric(15,0) | ✓ |  |  |  |  |
| tunj_jabatan | numeric(15,0) | ✓ |  |  |  |  |
| uang_luar_kota | numeric(15,0) | ✓ |  |  |  |  |
| flag_gaji | char(1) | ✓ |  | ('Y') |  |  |
| group_gaji | varchar(20) | ✓ |  |  |  |  |
| password | varchar(50) | ✓ |  |  |  |  |
| email | varchar(150) | ✓ |  |  |  |  |
| foto | varchar(100) | ✓ |  |  |  |  |
| tgl_foto | datetime | ✓ |  |  |  |  |
| face_acc | bit | ✓ |  |  |  |  |
| face_acc_nik | varchar(15) | ✓ |  |  |  |  |
| tgl_face_acc | datetime | ✓ |  |  |  |  |
| face_id | varchar(max) | ✓ |  |  |  |  |
| join_id | bigint | ✓ |  |  |  |  |
| xxx | varchar(50) | ✓ |  |  |  |  |
| flag_lembur | bit | ✓ |  |  |  |  |
| wajib_kop | numeric(10,0) | ✓ |  |  |  |  |

<a id="dbomc_saldo_awal"></a>
## dbo.mc_saldo_awal

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  |  |  |  |  |
| merk_id | char(2) |  |  |  |  |  |
| art_id | varchar(25) |  |  |  |  |  |
| qty_awal1 | numeric(12,3) | ✓ |  |  |  |  |
| qty_awal2 | numeric(12,3) | ✓ |  |  |  |  |
| sts_byr | char(1) |  |  |  |  |  |
| hrg_awal1 | numeric(12,2) | ✓ |  |  |  |  |
| hrg_awal2 | numeric(12,2) | ✓ |  |  |  |  |
| brand_id | varchar(2) | ✓ |  |  |  |  |

<a id="dbomigrations"></a>
## dbo.migrations

11 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | int |  | PK IDENTITY |  |  |  |
| migration | nvarchar(255) |  |  |  |  |  |
| batch | int |  |  |  |  |  |

<a id="dbooauth_access_tokens"></a>
## dbo.oauth_access_tokens

3 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | nvarchar(100) |  | PK |  |  |  |
| user_id | bigint | ✓ |  |  |  |  |
| client_id | bigint |  |  |  |  |  |
| name | nvarchar(255) | ✓ |  |  |  |  |
| scopes | nvarchar(max) | ✓ |  |  |  |  |
| revoked | bit |  |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |
| expires_at | datetime | ✓ |  |  |  |  |

**Index:** `oauth_access_tokens_user_id_index` (user_id)

<a id="dbooauth_auth_codes"></a>
## dbo.oauth_auth_codes

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | nvarchar(100) |  | PK |  |  |  |
| user_id | bigint |  |  |  |  |  |
| client_id | bigint |  |  |  |  |  |
| scopes | nvarchar(max) | ✓ |  |  |  |  |
| revoked | bit |  |  |  |  |  |
| expires_at | datetime | ✓ |  |  |  |  |

**Index:** `oauth_auth_codes_user_id_index` (user_id)

<a id="dbooauth_clients"></a>
## dbo.oauth_clients

4 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | bigint |  | PK IDENTITY |  |  |  |
| user_id | bigint | ✓ |  |  |  |  |
| name | nvarchar(255) |  |  |  |  |  |
| secret | nvarchar(100) | ✓ |  |  |  |  |
| provider | nvarchar(255) | ✓ |  |  |  |  |
| redirect | nvarchar(max) |  |  |  |  |  |
| personal_access_client | bit |  |  |  |  |  |
| password_client | bit |  |  |  |  |  |
| revoked | bit |  |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |

**Index:** `oauth_clients_user_id_index` (user_id)

<a id="dbooauth_personal_access_clients"></a>
## dbo.oauth_personal_access_clients

2 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | bigint |  | PK IDENTITY |  |  |  |
| client_id | bigint |  |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |

<a id="dbooauth_refresh_tokens"></a>
## dbo.oauth_refresh_tokens

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | nvarchar(100) |  | PK |  |  |  |
| access_token_id | nvarchar(100) |  |  |  |  |  |
| revoked | bit |  |  |  |  |  |
| expires_at | datetime | ✓ |  |  |  |  |

**Index:** `oauth_refresh_tokens_access_token_id_index` (access_token_id)

<a id="dboob_bahan_cost_dtl"></a>
## dbo.ob_bahan_cost_dtl

98.356 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK → dbo.ob_bahan_cost_hdr(bukti, brand_id) |  |  |  |
| urut | int |  | PK |  |  |  |
| item_id | varchar(2) | ✓ |  |  |  | `ZZ` 98.303, `EZ` 44, `BZ` 5, `AZ` 4 |
| art_id | varchar(25) |  | PK |  |  |  |
| hrg | decimal(12,3) | ✓ |  |  |  |  |
| qty_pakai | decimal(12,3) | ✓ |  |  |  |  |
| ppn | decimal(18,0) | ✓ |  |  |  |  |
| po_view | char(1) | ✓ |  |  |  | `NULL` 98.347, `N` 7, `Y` 2 |
| brand_id | varchar(2) |  | PK → dbo.ob_bahan_cost_hdr(bukti, brand_id) |  |  | `B` 55.942, `A` 35.449, `C` 4.998, `H` 1.967 |

<a id="dboob_bahan_cost_hdr"></a>
## dbo.ob_bahan_cost_hdr

30.829 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| article_id | varchar(20) | ✓ |  |  |  |  |
| article_desc | varchar(100) | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| fee | decimal(12,2) | ✓ |  |  |  |  |
| margin | decimal(12,2) | ✓ |  |  |  |  |
| ppn | decimal(12,2) | ✓ |  |  |  |  |
| tot | decimal(12,3) | ✓ |  |  |  |  |
| kon_hrg | decimal(12,3) | ✓ |  |  |  |  |
| acc | int | ✓ |  |  |  |  |
| acc_nm | varchar(30) | ✓ |  |  |  |  |
| usrupd | varchar(30) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| ket | varchar(100) | ✓ |  |  |  |  |
| qty_all | decimal(12,3) | ✓ |  |  |  |  |
| tot_all | decimal(12,3) | ✓ |  |  |  |  |
| hrg_all | decimal(12,3) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 17.711, `A` 12.195, `C` 700, `H` 223 |

<a id="dboob_bahan_gd_dtl"></a>
## dbo.ob_bahan_gd_dtl

5.711 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  | PK → dbo.ob_bahan_gd_hdr(bukti, brand_id) |  |  |  |
| urut | numeric(18,0) |  | PK |  |  |  |
| art_id | varchar(25) |  | PK → dbo.m_bahan_art(art_id, brand_id) |  |  |  |
| art_desc | varchar(100) | ✓ |  |  |  |  |
| gd_id | varchar(10) | ✓ |  |  |  |  |
| trans_id | varchar(2) | ✓ |  |  |  | `NULL` 5.711 |
| qty | numeric(12,3) | ✓ |  |  |  |  |
| qty2 | numeric(12,3) | ✓ |  |  |  |  |
| qty_FEE | numeric(12,3) | ✓ |  |  |  |  |
| harga | numeric(12,3) | ✓ |  |  |  |  |
| harga2 | numeric(12,3) | ✓ |  |  |  |  |
| hjual | numeric(12,3) | ✓ |  |  |  |  |
| hjual2 | numeric(12,3) | ✓ |  |  |  |  |
| lkain | varchar(15) | ✓ |  |  |  |  |
| berat | varchar(15) | ✓ |  |  |  |  |
| sat_id | char(2) | ✓ |  |  |  | `NULL` 2.395, `03` 1.817, `02` 1.099, `01` 388, `05` 5, `04` 4, `09` 2, `10` 1 |
| sat_id2 | char(2) | ✓ |  |  |  | `NULL` 2.391, `03` 1.627, `02` 1.102, `01` 385, `04` 143, `09` 53, `05` 5, `08` 3, `07` 1, `10` 1 |
| con_sat | numeric(12,3) | ✓ |  |  |  |  |
| flag | varchar(50) | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| mata_uang | varchar(5) | ✓ |  |  |  |  |
| kurs | numeric(14,2) | ✓ |  |  |  |  |
| mata_uang2 | varchar(5) | ✓ |  |  |  |  |
| kurs2 | numeric(14,2) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.ob_bahan_gd_hdr(bukti, brand_id) |  |  | `A` 3.099, `B` 2.254, `C` 297, `H` 61 |
| asset | char(1) | ✓ |  |  |  | `NULL` 3.326, `N` 2.372, `Y` 13 |
| asset_bln | numeric(10,0) | ✓ |  |  |  |  |

<a id="dboob_bahan_gd_hdr"></a>
## dbo.ob_bahan_gd_hdr

1.688 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(20) | ✓ |  |  |  |  |
| supp_desc | varchar(50) | ✓ |  |  |  |  |
| bukti_po | varchar(20) | ✓ |  |  |  |  |
| bukti_ref | varchar(20) | ✓ |  |  |  |  |
| usrupd | varchar(20) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| trans_id | varchar(2) | ✓ |  |  |  | `02` 1.523, `41` 97, `40` 51, `20` 17 |
| bukti_ap | varchar(20) | ✓ |  |  |  |  |
| bukti_gl | varchar(20) | ✓ |  |  |  |  |
| account_id | varchar(20) | ✓ |  |  |  |  |
| flag | varchar(1) | ✓ |  |  |  | `NULL` 1.688 |
| prn | int | ✓ |  |  |  |  |
| no_sj | varchar(50) | ✓ |  |  |  |  |
| sts_byr | varchar(1) | ✓ |  |  |  | `N` 1.540, `NULL` 148 |
| ket | varchar(70) | ✓ |  |  |  |  |
| jtrans | varchar(10) | ✓ |  |  |  |  |
| Xusrupd | varchar(20) | ✓ |  |  |  |  |
| xtglupd | datetime | ✓ |  |  |  |  |
| sts_trans | varchar(1) | ✓ |  |  |  | `A` 1.354, `N` 186, `NULL` 148 |
| ppn | varchar(1) | ✓ |  |  |  | `NULL` 1.688 |
| brand_id | varchar(2) |  | PK |  |  | `A` 843, `B` 749, `C` 77, `H` 19 |
| asset | char(1) | ✓ |  |  |  | `NULL` 1.675, `Y` 12, `N` 1 |

<a id="dboob_bahan_gdrol_dtl"></a>
## dbo.ob_bahan_gdrol_dtl

1.118 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  | PK → dbo.ob_bahan_gdrol_hdr(bukti, brand_id) |  |  |  |
| urut | numeric(18,0) |  | PK |  |  |  |
| art_id | varchar(25) |  | PK |  |  |  |
| art_desc | varchar(100) | ✓ |  |  |  |  |
| gd_id | varchar(10) | ✓ |  |  |  |  |
| trans_id | varchar(2) | ✓ |  |  |  | `NULL` 1.118 |
| qty | numeric(12,3) | ✓ |  |  |  |  |
| qty2 | numeric(12,3) | ✓ |  |  |  |  |
| harga | numeric(12,3) | ✓ |  |  |  |  |
| harga2 | numeric(12,3) | ✓ |  |  |  |  |
| hjual | numeric(12,3) | ✓ |  |  |  |  |
| hjual2 | numeric(12,3) | ✓ |  |  |  |  |
| lkain | varchar(15) | ✓ |  |  |  |  |
| berat | varchar(15) | ✓ |  |  |  |  |
| sat_id | char(2) | ✓ |  |  |  | `03` 1.088, `02` 22, `04` 4, `NULL` 4 |
| sat_id2 | char(2) | ✓ |  |  |  | `03` 1.088, `02` 22, `04` 4, `NULL` 4 |
| flag | varchar(50) | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| mata_uang | varchar(5) | ✓ |  |  |  |  |
| kurs | numeric(14,2) | ✓ |  |  |  |  |
| mata_uang2 | varchar(5) | ✓ |  |  |  |  |
| kurs2 | numeric(14,2) | ✓ |  |  |  |  |
| con_sat | numeric(12,3) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.ob_bahan_gdrol_hdr(bukti, brand_id) |  |  | `A` 525, `B` 414, `H` 136, `C` 39, `D` 4 |

<a id="dboob_bahan_gdrol_hdr"></a>
## dbo.ob_bahan_gdrol_hdr

874 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(20) | ✓ |  |  |  |  |
| supp_desc | varchar(50) | ✓ |  |  |  |  |
| bukti_po | varchar(20) | ✓ |  |  |  |  |
| bukti_ref | varchar(20) | ✓ |  |  |  |  |
| usrupd | varchar(20) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| trans_id | varchar(2) | ✓ |  |  |  | `26` 437, `27` 437 |
| bukti_ap | varchar(20) | ✓ |  |  |  |  |
| account_id | varchar(20) | ✓ |  |  |  |  |
| flag | varchar(1) | ✓ |  |  |  | `NULL` 874 |
| prn | int | ✓ |  |  |  |  |
| merk_id | varchar(1) | ✓ |  |  |  | `NULL` 874 |
| no_sj | varchar(50) | ✓ |  |  |  |  |
| sts_byr | char(10) | ✓ |  |  |  |  |
| ket | varchar(70) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `A` 413, `B` 289, `H` 135, `C` 36, `D` 1 |

<a id="dboob_bahan_jual_dtl"></a>
## dbo.ob_bahan_jual_dtl

34.674 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK → dbo.ob_bahan_jual_hdr(bukti, brand_id) |  |  |  |
| urut | int |  | PK |  |  |  |
| art_id | varchar(25) | ✓ | → dbo.m_bahan_art(art_id, brand_id) |  |  |  |
| art_desc | varchar(70) | ✓ |  |  |  |  |
| qty_kirim | numeric(12,3) | ✓ |  |  |  |  |
| qty_kirim2 | numeric(12,3) | ✓ |  |  |  |  |
| qty | numeric(12,3) | ✓ |  |  |  |  |
| qty2 | numeric(12,3) | ✓ |  |  |  |  |
| sisa | numeric(12,3) | ✓ |  |  |  |  |
| sisa2 | numeric(12,3) | ✓ |  |  |  |  |
| harga | numeric(12,3) | ✓ |  |  |  |  |
| harga2 | numeric(12,3) | ✓ |  |  |  |  |
| sat | char(10) | ✓ |  |  |  |  |
| sat2 | char(10) | ✓ |  |  |  |  |
| kurs | numeric(12,2) | ✓ |  |  |  |  |
| mata_uang | varchar(50) | ✓ |  |  |  |  |
| con_sat | numeric(12,2) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.m_bahan_art(art_id, brand_id) |  |  | `B` 18.081, `A` 11.269, `C` 3.265, `H` 2.059 |
| harga_beli | numeric(12,3) | ✓ |  |  |  |  |
| harga_beli2 | numeric(12,3) | ✓ |  |  |  |  |

<a id="dboob_bahan_jual_hdr"></a>
## dbo.ob_bahan_jual_hdr

9.570 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| supp_desc | varchar(70) | ✓ |  |  |  |  |
| merk_id | char(2) | ✓ |  |  |  | `NULL` 9.570 |
| no_kirim | varchar(25) | ✓ |  |  |  |  |
| bukti_ref | varchar(50) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(50) | ✓ |  |  |  |  |
| trans_id | char(2) | ✓ |  |  |  | `10` 9.443, `11` 127 |
| no_po | varchar(50) | ✓ |  |  |  |  |
| article_id | varchar(25) | ✓ |  |  |  |  |
| article_desc | char(70) | ✓ |  |  |  |  |
| sts_byr | char(10) | ✓ |  |  |  |  |
| ket1 | varchar(70) | ✓ |  |  |  |  |
| ket2 | varchar(70) | ✓ |  |  |  |  |
| ket3 | varchar(70) | ✓ |  |  |  |  |
| sts_trans | char(1) | ✓ |  |  |  | `A` 9.565, `N` 5 |
| brand_id | varchar(2) |  | PK |  |  | `B` 5.139, `A` 3.610, `C` 549, `H` 272 |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| bukti_gl | varchar(25) | ✓ |  |  |  |  |
| bukti_po | varchar(25) | ✓ |  |  |  |  |
| bukti_cost | varchar(25) | ✓ |  |  |  |  |

<a id="dboob_bahan_keluar_dtl"></a>
## dbo.ob_bahan_keluar_dtl

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  | PK → dbo.ob_bahan_keluar_hdr(bukti, brand_id) |  |  |  |
| urut | int |  | PK |  |  |  |
| art_id | varchar(25) |  | PK → dbo.m_bahan_art(art_id, brand_id) |  |  |  |
| art_desc | varchar(70) | ✓ |  |  |  |  |
| gudang_id | char(1) | ✓ |  |  |  |  |
| trans_id | char(2) | ✓ |  |  |  |  |
| qty | numeric(12,3) | ✓ |  |  |  |  |
| qty2 | numeric(12,3) | ✓ |  |  |  |  |
| sat_id | varchar(5) | ✓ |  |  |  |  |
| sat_id2 | varchar(5) | ✓ |  |  |  |  |
| harga | numeric(12,3) | ✓ |  |  |  |  |
| harga2 | numeric(12,3) | ✓ |  |  |  |  |
| hjual | numeric(12,3) | ✓ |  |  |  |  |
| hjual2 | numeric(12,3) | ✓ |  |  |  |  |
| con_sat | numeric(12,3) | ✓ |  |  |  |  |
| hpp | numeric(14,2) | ✓ |  |  |  |  |
| gudang_darike | varchar(15) | ✓ |  |  |  |  |
| cmt | varchar(15) | ✓ |  |  |  |  |
| flag_quota | varchar(1) | ✓ |  |  |  |  |
| group_id | varchar(15) | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| lkain | varchar(20) | ✓ |  |  |  |  |
| berat | varchar(20) | ✓ |  |  |  |  |
| kurs | numeric(14,3) | ✓ |  |  |  |  |
| mata_uang | varchar(5) | ✓ |  |  |  |  |
| kurs2 | numeric(12,3) | ✓ |  |  |  |  |
| mata_uang2 | varchar(5) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.m_bahan_art(art_id, brand_id) |  |  |  |

<a id="dboob_bahan_keluar_hdr"></a>
## dbo.ob_bahan_keluar_hdr

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(20) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| gudang_id | char(1) | ✓ |  |  |  |  |
| trans_id | char(2) | ✓ |  |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| supp_desc | varchar(70) | ✓ |  |  |  |  |
| po_ref | varchar(15) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| bukti_ap | varchar(20) | ✓ |  |  |  |  |
| cmt | varchar(15) | ✓ |  |  |  |  |
| jenis_rm | char(1) | ✓ |  |  |  |  |
| account_id | varchar(15) | ✓ |  |  |  |  |
| supp_faktur | varchar(15) | ✓ |  |  |  |  |
| ket1 | varchar(100) | ✓ |  |  |  |  |
| st | char(1) | ✓ |  |  |  |  |
| ket2 | varchar(100) | ✓ |  |  |  |  |
| ket3 | varchar(100) | ✓ |  |  |  |  |
| sts_byr | varchar(1) | ✓ |  |  |  |  |
| article_id | varchar(25) | ✓ |  |  |  |  |
| article_desc | varchar(70) | ✓ |  |  |  |  |
| bukti_po | varchar(25) | ✓ |  |  |  |  |
| sts_trans | varchar(1) | ✓ |  |  |  |  |
| ppn | varchar(1) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  |  |

<a id="dboob_bahan_kirim_dtl"></a>
## dbo.ob_bahan_kirim_dtl

25.131 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK → dbo.ob_bahan_kirim_hdr(bukti, brand_id) |  |  |  |
| urut | int |  | PK |  |  |  |
| art_id | varchar(25) |  | PK |  |  |  |
| ART_DESC | varchar(100) | ✓ |  |  |  |  |
| qty | decimal(12,3) | ✓ |  |  |  |  |
| qty2 | decimal(12,3) | ✓ |  |  |  |  |
| sat_id | varchar(5) | ✓ |  |  |  |  |
| sat_id2 | varchar(5) | ✓ |  |  |  |  |
| lkain | varchar(15) | ✓ |  |  |  |  |
| berat | varchar(15) | ✓ |  |  |  |  |
| harga | decimal(12,3) | ✓ |  |  |  |  |
| harga2 | decimal(12,3) | ✓ |  |  |  |  |
| hjual | decimal(12,3) | ✓ |  |  |  |  |
| hjual2 | decimal(12,3) | ✓ |  |  |  |  |
| con_sat | decimal(12,3) | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| kurs | decimal(14,3) | ✓ |  |  |  |  |
| mata_uang | varchar(5) | ✓ |  |  |  |  |
| kurs2 | decimal(12,3) | ✓ |  |  |  |  |
| mata_uang2 | varchar(5) | ✓ |  |  |  |  |
| sisa | decimal(12,3) | ✓ |  |  |  |  |
| sisa2 | decimal(12,3) | ✓ |  |  |  |  |
| ppn | decimal(10,0) | ✓ |  |  |  |  |
| penalti | decimal(10,0) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.ob_bahan_kirim_hdr(bukti, brand_id) |  |  | `B` 15.966, `A` 9.033, `H` 75, `C` 57 |

<a id="dboob_bahan_kirim_hdr"></a>
## dbo.ob_bahan_kirim_hdr

4.976 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| bukti_ref | varchar(40) | ✓ |  |  |  |  |
| no_sj | varchar(25) | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| supp_desc | varchar(50) | ✓ |  |  |  |  |
| trans_id | varchar(2) | ✓ |  |  |  | `03` 4.884, `04` 92 |
| usrupd | varchar(20) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| status | varchar(1) | ✓ |  |  |  | `NULL` 4.976 |
| note1 | varchar(100) | ✓ |  |  |  |  |
| note2 | varchar(100) | ✓ |  |  |  |  |
| note3 | varchar(100) | ✓ |  |  |  |  |
| note4 | varchar(100) | ✓ |  |  |  |  |
| note5 | varchar(100) | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| bukti_gl | varchar(25) | ✓ |  |  |  |  |
| article_id | varchar(25) | ✓ |  |  |  |  |
| article_desc | varchar(70) | ✓ |  |  |  |  |
| bukti_po | varchar(25) | ✓ |  |  |  |  |
| sts | char(1) | ✓ |  |  |  | `NULL` 4.976 |
| app | int | ✓ |  |  |  |  |
| sts_byr | char(1) | ✓ |  |  |  | `N` 4.976 |
| sts_jenis | char(1) | ✓ |  |  |  | `NULL` 4.976 |
| Xusrupd | varchar(20) | ✓ |  |  |  |  |
| xtglupd | datetime | ✓ |  |  |  |  |
| AN | char(1) | ✓ |  |  |  | `NULL` 4.976 |
| sts_trans | char(1) | ✓ |  |  |  | `A` 4.975, `N` 1 |
| brand_id | varchar(2) |  | PK |  |  | `B` 3.086, `A` 1.852, `H` 20, `C` 18 |
| trans_byr | char(1) | ✓ |  |  |  | `B` 4.918, `K` 35, `NULL` 23 |
| model_id | varchar(25) | ✓ |  |  |  |  |
| model_desc | varchar(70) | ✓ |  |  |  |  |
| bukti_cost | varchar(25) | ✓ |  |  |  |  |

<a id="dboob_bahan_pakai_dtl"></a>
## dbo.ob_bahan_pakai_dtl

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK → dbo.ob_bahan_pakai_hdr(bukti, brand_id) |  |  |  |
| urut | int |  | PK |  |  |  |
| art_id | varchar(25) | ✓ |  |  |  |  |
| art_desc | varchar(70) | ✓ |  |  |  |  |
| qty_kirim | numeric(12,3) | ✓ |  |  |  |  |
| qty_kirim2 | numeric(12,3) | ✓ |  |  |  |  |
| qty_pakai | numeric(12,3) | ✓ |  |  |  |  |
| qty_pakai2 | numeric(12,3) | ✓ |  |  |  |  |
| sisa | numeric(12,3) | ✓ |  |  |  |  |
| sisa2 | numeric(12,3) | ✓ |  |  |  |  |
| harga | numeric(12,3) | ✓ |  |  |  |  |
| harga2 | numeric(12,3) | ✓ |  |  |  |  |
| sat | char(10) | ✓ |  |  |  |  |
| sat2 | char(10) | ✓ |  |  |  |  |
| kurs | numeric(12,2) | ✓ |  |  |  |  |
| mata_uang | varchar(50) | ✓ |  |  |  |  |
| con_sat | numeric(12,2) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.ob_bahan_pakai_hdr(bukti, brand_id) |  |  | `B` 1 |

<a id="dboob_bahan_pakai_hdr"></a>
## dbo.ob_bahan_pakai_hdr

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| supp_desc | varchar(70) | ✓ |  |  |  |  |
| no_kirim | varchar(25) | ✓ |  |  |  |  |
| bukti_ref | varchar(50) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(50) | ✓ |  |  |  |  |
| trans_id | char(2) | ✓ |  |  |  | `07` 1 |
| no_po | varchar(50) | ✓ |  |  |  |  |
| article_id | varchar(25) | ✓ |  |  |  |  |
| article_desc | char(70) | ✓ |  |  |  |  |
| sts_byr | char(1) | ✓ |  |  |  | `N` 1 |
| ket1 | varchar(70) | ✓ |  |  |  |  |
| ket2 | varchar(70) | ✓ |  |  |  |  |
| sts_trans | char(1) | ✓ |  |  |  | `NULL` 1 |
| buktix | varchar(25) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 1 |

<a id="dboob_bahan_po_dtl"></a>
## dbo.ob_bahan_po_dtl

2.883 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK → dbo.ob_bahan_po_hdr(bukti) |  |  |  |
| art_id | varchar(25) |  | PK |  |  |  |
| urut | numeric(18,0) |  | PK |  |  |  |
| art_desc | varchar(100) | ✓ |  |  |  |  |
| qty | numeric(12,3) | ✓ |  |  |  |  |
| qty2 | numeric(12,3) | ✓ |  |  |  |  |
| harga | numeric(12,3) | ✓ |  |  |  |  |
| harga2 | numeric(12,3) | ✓ |  |  |  |  |
| lkain | varchar(15) | ✓ |  |  |  |  |
| berat | varchar(15) | ✓ |  |  |  |  |
| sat_id | char(2) | ✓ |  |  |  | `03` 1.416, `02` 1.081, `01` 373, `05` 5, `NULL` 3, `09` 2, `04` 2, `10` 1 |
| sat_id2 | char(2) | ✓ |  |  |  | `03` 1.267, `02` 1.083, `01` 370, `04` 101, `09` 49, `08` 5, `05` 5, `07` 1, `10` 1, `NULL` 1 |
| ket | varchar(50) | ✓ |  |  |  |  |
| con_sat | numeric(12,3) | ✓ |  |  |  |  |
| mata_uang | varchar(5) | ✓ |  |  |  |  |
| kurs | numeric(14,2) | ✓ |  |  |  |  |
| kurs2 | numeric(14,2) | ✓ |  |  |  |  |
| mata_uang2 | varchar(5) | ✓ |  |  |  |  |
| hjual | numeric(14,2) | ✓ |  |  |  |  |
| hjual2 | numeric(14,2) | ✓ |  |  |  |  |
| brand_id | varchar(2) | ✓ |  |  |  | `A` 1.904, `B` 774, `C` 164, `H` 41 |
| stok1 | numeric(12,3) | ✓ |  |  |  |  |
| asset | char(1) | ✓ |  |  |  | `N` 2.229, `NULL` 641, `Y` 13 |
| asset_bln | numeric(10,0) | ✓ |  |  |  |  |

<a id="dboob_bahan_po_hdr"></a>
## dbo.ob_bahan_po_hdr

1.006 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| supp_id | varchar(15) | ✓ |  |  |  |  |
| supp_desc | varchar(50) | ✓ |  |  |  |  |
| bukti_ref | varchar(20) | ✓ |  |  |  |  |
| status | char(1) | ✓ |  |  |  | `R` 516, `B` 490 |
| trans_id | char(2) | ✓ |  |  |  | `01` 1.006 |
| disc | numeric(18,0) | ✓ |  |  |  |  |
| flag_approval | char(10) | ✓ |  |  |  |  |
| ket | varchar(100) | ✓ |  |  |  |  |
| flag_close | char(10) | ✓ |  |  |  |  |
| tgl_kirim | datetime | ✓ |  |  |  |  |
| tgl_hari | int | ✓ |  |  |  |  |
| top_payment | int | ✓ |  |  |  |  |
| usrupd | char(10) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| prn | int | ✓ |  |  |  |  |
| ket1 | varchar(100) | ✓ |  |  |  |  |
| ket2 | varchar(100) | ✓ |  |  |  |  |
| ket3 | varchar(100) | ✓ |  |  |  |  |
| ket4 | varchar(100) | ✓ |  |  |  |  |
| ket5 | varchar(100) | ✓ |  |  |  |  |
| sts_byr | varchar(1) | ✓ |  |  |  | `N` 1.004, `T` 2 |
| sts_trans | varchar(1) | ✓ |  |  |  | `A` 820, `N` 186 |
| acc | int | ✓ |  |  |  |  |
| acc_name | varchar(20) | ✓ |  |  |  |  |
| jtrans | varchar(10) | ✓ |  |  |  |  |
| bukti_temp | varchar(25) | ✓ |  |  |  |  |
| ppn | char(1) | ✓ |  |  |  | `NULL` 1.006 |
| brand_id | varchar(2) | ✓ |  |  |  | `A` 555, `B` 393, `C` 43, `H` 15 |
| acc_flag | int | ✓ |  |  |  |  |
| acc_tgl | datetime | ✓ |  |  |  |  |
| acc_nik | varchar(10) | ✓ |  |  |  |  |
| asset | char(1) | ✓ |  |  |  | `NULL` 993, `Y` 12, `N` 1 |
| bln | numeric(10,0) | ✓ |  |  |  |  |

<a id="dboob_bahan_roll_dtl"></a>
## dbo.ob_bahan_roll_dtl

562 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK → dbo.ob_bahan_roll_hdr(bukti, brand_id) |  |  |  |
| urut | int |  | PK |  |  |  |
| art_id | varchar(25) |  | PK |  |  |  |
| art_desc | varchar(100) | ✓ |  |  |  |  |
| art_id2 | varchar(25) |  | PK |  |  |  |
| art_desc2 | varchar(100) | ✓ |  |  |  |  |
| merk_id1 | varchar(2) | ✓ |  |  |  | `A` 439, `B` 111, `C` 8, `H` 4 |
| merk_id2 | varchar(2) | ✓ |  |  |  | `B` 306, `H` 132, `A` 89, `C` 31, `D` 4 |
| qty | numeric(12,3) | ✓ |  |  |  |  |
| qty2 | numeric(12,3) | ✓ |  |  |  |  |
| sat | char(10) | ✓ |  |  |  |  |
| sat2 | char(10) | ✓ |  |  |  |  |
| hbeli | numeric(12,3) | ✓ |  |  |  |  |
| hbeli2 | numeric(12,3) | ✓ |  |  |  |  |
| hjual | numeric(12,3) | ✓ |  |  |  |  |
| hjual2 | numeric(12,3) | ✓ |  |  |  |  |
| kurs | numeric(16,2) | ✓ |  |  |  |  |
| kurs2 | numeric(16,2) | ✓ |  |  |  |  |
| mata_uang | char(10) | ✓ |  |  |  |  |
| mata_uang2 | char(10) | ✓ |  |  |  |  |
| ket | varchar(100) | ✓ |  |  |  |  |
| con_sat | numeric(12,3) | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK → dbo.ob_bahan_roll_hdr(bukti, brand_id) |  |  | `A` 439, `B` 111, `C` 8, `H` 4 |

<a id="dboob_bahan_roll_hdr"></a>
## dbo.ob_bahan_roll_hdr

440 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(25) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| brand_id1 | varchar(2) | ✓ |  |  |  | `A` 379, `B` 50, `C` 7, `H` 4 |
| supp_id1 | varchar(10) | ✓ |  |  |  |  |
| supp_desc1 | varchar(70) | ✓ |  |  |  |  |
| brand_id2 | varchar(2) | ✓ |  |  |  | `B` 242, `H` 131, `A` 37, `C` 29, `D` 1 |
| supp_id2 | varchar(10) | ✓ |  |  |  |  |
| supp_desc2 | varchar(70) | ✓ |  |  |  |  |
| usrupd | varchar(20) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| trans_id | varchar(2) | ✓ |  |  |  | `28` 440 |
| no_sj | varchar(50) | ✓ |  |  |  |  |
| ket | varchar(100) | ✓ |  |  |  |  |
| bukti_tarik | varchar(25) | ✓ |  |  |  |  |
| bukti_kirim | varchar(25) | ✓ |  |  |  |  |
| flag_transfer | int | ✓ |  |  |  |  |
| sts_byr | char(1) | ✓ |  |  |  | `N` 440 |
| flag_trans | int | ✓ |  |  |  |  |
| bukti_ap | varchar(25) | ✓ |  |  |  |  |
| acc | int | ✓ |  |  |  |  |
| acc_user | varchar(30) | ✓ |  |  |  |  |
| acc_tgl | datetime | ✓ |  |  |  |  |
| sts_trans | char(1) | ✓ |  |  |  | `NULL` 440 |
| brand_id | varchar(2) |  | PK |  |  | `A` 379, `B` 50, `C` 7, `H` 4 |

<a id="dboob_bahan_trans"></a>
## dbo.ob_bahan_trans

19 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| trans_id | char(2) |  |  |  |  | `26` 1, `22` 1, `20` 1, `12` 1, `10` 1, `09` 1, `08` 1, `07` 1, `05` 1, `04` 1, `03` 1, `02` 1, `…` |
| trans_desc | varchar(50) | ✓ |  |  |  |  |
| urut | char(2) | ✓ |  |  |  | `7` 1, `6` 1, `5` 1, `4` 1, `3` 1, `2` 1, `17` 1, `16` 1, `14` 1, `13` 1, `12` 1, `11` 1, `…` |
| brand_id | varchar(2) | ✓ |  |  |  | `LG` 19 |

<a id="dbopassword_resets"></a>
## dbo.password_resets

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| email | nvarchar(255) |  |  |  |  |  |
| token | nvarchar(255) |  |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |

**Index:** `password_resets_email_index` (email)

<a id="dbopersonal_access_tokens"></a>
## dbo.personal_access_tokens

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | bigint |  | PK IDENTITY |  |  |  |
| tokenable_type | nvarchar(255) |  |  |  |  |  |
| tokenable_id | bigint |  |  |  |  |  |
| name | nvarchar(255) |  |  |  |  |  |
| token | nvarchar(64) |  |  |  |  |  |
| abilities | nvarchar(max) | ✓ |  |  |  |  |
| last_used_at | datetime | ✓ |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |

**Index:** `personal_access_tokens_token_unique` (token) unik; `personal_access_tokens_tokenable_type_tokenable_id_index` (tokenable_type, tokenable_id)

<a id="dbos_awal_gudang"></a>
## dbo.S_AWAL_GUDANG

379.295 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| qty | numeric(10,2) | ✓ |  | ((0)) |  |  |

<a id="dbos_awal_toko"></a>
## dbo.S_AWAL_TOKO

47.945 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| toko_id | varchar(5) |  | PK |  |  |  |
| periode | datetime |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| qty | numeric(10,0) | ✓ |  | (0) |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

<a id="dbosaldo_awal_art"></a>
## dbo.saldo_awal_art

138.241 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| brand_id | varchar(2) |  | PK |  |  | `A` 83.791, `B` 45.352, `C` 8.256, `H` 842 |
| periode | datetime |  | PK |  |  |  |
| art_id | varchar(25) |  | PK |  |  |  |
| sts_byr | char(1) |  | PK |  |  | `N` 138.241 |
| qty_awal1 | numeric(12,3) | ✓ |  |  |  |  |
| qty_awal2 | numeric(12,3) | ✓ |  |  |  |  |
| hrg_awal1 | numeric(12,2) | ✓ |  |  |  |  |
| hrg_awal2 | numeric(12,2) | ✓ |  |  |  |  |

<a id="dbosaldo_awal_art_supp"></a>
## dbo.saldo_awal_art_supp

9.171 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| supp_id | varchar(10) |  | PK |  |  |  |
| sts_byr | char(1) |  | PK |  |  | `N` 9.171 |
| periode | datetime |  | PK |  |  |  |
| art_id | varchar(25) |  | PK |  |  |  |
| qawal1 | numeric(12,3) | ✓ |  |  |  |  |
| qawal2 | numeric(12,3) | ✓ |  |  |  |  |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 9.171 |

<a id="dbosys_module"></a>
## dbo.SYS_MODULE

11 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| module_id | varchar(2) |  | PK |  |  | `AP` 1, `AR` 1, `BH` 1, `CB` 1, `DB` 1, `GD` 1, `GL` 1, `HR` 1, `SL` 1, `TK` 1, `WB` 1 |
| module_name | varchar(45) |  |  |  |  |  |
| flag_aktif | bit | ✓ |  |  |  |  |
| urut | smallint | ✓ |  |  |  |  |
| img | varchar(50) | ✓ |  |  |  |  |

<a id="dbosys_program"></a>
## dbo.SYS_PROGRAM

185 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| module_id | varchar(2) |  | PK → dbo.SYS_MODULE(module_id) |  |  | `GL` 51, `TK` 38, `BH` 30, `GD` 22, `CB` 12, `AP` 10, `HR` 7, `AR` 6, `SL` 5, `WB` 2, `DB` 2 |
| submodule_id | varchar(2) |  | PK |  |  | `03` 74, `02` 59, `01` 32, `04` 20 |
| program_id | varchar(30) |  | PK |  |  |  |
| program_name | varchar(100) | ✓ |  |  |  |  |
| urut | smallint | ✓ |  |  |  |  |

<a id="dbosys_setup"></a>
## dbo.SYS_SETUP

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| company | varchar(50) |  | PK |  |  |  |
| alamat | varchar(50) | ✓ |  |  |  |  |
| kota | varchar(50) | ✓ |  |  |  |  |
| kd_pos | varchar(10) | ✓ |  |  |  |  |
| telp | varchar(30) | ✓ |  |  |  |  |
| fax | varchar(30) | ✓ |  |  |  |  |
| site_id | varchar(5) | ✓ |  |  |  |  |
| site_name | varchar(50) | ✓ |  |  |  |  |
| host_ip | varchar(15) | ✓ |  |  |  |  |
| toko_id | varchar(5) | ✓ |  |  |  |  |
| periode | datetime | ✓ |  |  |  |  |
| tipe_closing | varchar(1) | ✓ |  |  |  | `M` 1 |
| base_currency | varchar(3) | ✓ |  |  |  | `NULL` 1 |
| re_last_year | varchar(15) | ✓ |  |  |  |  |
| re_this_year | varchar(15) | ✓ |  |  |  |  |
| re_ikhtisar | varchar(15) | ✓ |  |  |  |  |
| account_is1 | varchar(15) | ✓ |  |  |  |  |
| account_is2 | varchar(15) | ✓ |  |  |  |  |
| account_bs1 | varchar(15) | ✓ |  |  |  |  |
| account_bs2 | varchar(15) | ✓ |  |  |  |  |
| account_jadi | varchar(15) | ✓ |  |  |  |  |
| tebal | numeric(10,0) | ✓ |  |  |  |  |
| brand_id | varchar(2) | ✓ |  |  |  | `NULL` 1 |
| DestyToken | nvarchar(max) | ✓ |  |  |  |  |
| DestyTokenExp | datetime | ✓ |  |  |  |  |

<a id="dbosys_setup_dtl"></a>
## dbo.SYS_SETUP_DTL

4 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| brand_id | varchar(1) |  | PK |  |  | `A` 1, `B` 1, `C` 1, `H` 1 |
| periode | datetime | ✓ |  |  |  |  |
| re_last_year | varchar(15) | ✓ |  |  |  |  |
| re_this_year | varchar(15) | ✓ |  |  |  |  |
| re_ikhtisar | varchar(15) | ✓ |  |  |  |  |
| account_is1 | varchar(15) | ✓ |  |  |  |  |
| account_is2 | varchar(15) | ✓ |  |  |  |  |
| account_bs1 | varchar(15) | ✓ |  |  |  |  |
| account_bs2 | varchar(15) | ✓ |  |  |  |  |
| tipe_closing | varchar(1) | ✓ |  |  |  | `M` 4 |
| closing_sales | datetime | ✓ |  |  |  |  |
| closing_sales_permanent | datetime | ✓ |  |  |  |  |
| inv_jadi | varchar(15) | ✓ |  |  |  |  |
| inv_kain | varchar(15) | ✓ |  |  |  |  |
| inv_acc | varchar(15) | ✓ |  |  |  |  |
| ap_pot | varchar(15) | ✓ |  |  |  |  |
| ap_lebih | varchar(15) | ✓ |  |  |  |  |
| ap_kurang | varchar(15) | ✓ |  |  |  |  |
| acc_hpp | varchar(15) | ✓ |  |  |  |  |
| acc_hpp2 | varchar(15) | ✓ |  |  |  |  |
| acc_inv | varchar(15) | ✓ |  |  |  |  |
| acc_beli | varchar(15) | ✓ |  |  |  |  |
| acc_biaya_rm | varchar(15) | ✓ |  |  |  |  |
| glo | datetime | ✓ |  |  |  |  |
| closing_ap | datetime | ✓ |  |  |  |  |
| ins_spg | numeric(8,2) | ✓ |  |  |  |  |
| ins_kor | numeric(8,2) | ✓ |  |  |  |  |
| ins_dist | numeric(8,2) | ✓ |  |  |  |  |
| ins_asm | numeric(8,2) | ✓ |  |  |  |  |
| tgl_pjk | datetime | ✓ |  |  |  |  |
| tgl_back | datetime | ✓ |  |  |  |  |
| per_target | numeric(4,0) | ✓ |  |  |  |  |
| tgl_gaji | datetime | ✓ |  |  |  |  |
| closing_mc | datetime | ✓ |  |  |  |  |
| BPO | varchar(50) | ✓ |  |  |  |  |
| acc_hpp_rw | varchar(15) | ✓ |  |  |  |  |
| acc_hpp2_rw | varchar(15) | ✓ |  |  |  |  |
| acc_inv_rw | varchar(15) | ✓ |  |  |  |  |
| acc_beli_rw | varchar(15) | ✓ |  |  |  |  |
| acc_bijual_ol | varchar(15) | ✓ |  |  |  |  |

<a id="dbosys_submodule"></a>
## dbo.SYS_SUBMODULE

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| module_id | varchar(2) |  | PK |  |  |  |
| submodule_id | varchar(2) |  | PK |  |  |  |
| submodule_name | varchar(45) |  |  |  |  |  |

<a id="dbosys_user"></a>
## dbo.SYS_USER

43 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| user_id | varchar(15) |  | PK |  |  |  |
| user_name | varchar(30) | ✓ |  |  |  |  |
| user_psw | varchar(15) | ✓ |  |  |  |  |
| create_date | datetime | ✓ |  |  |  |  |
| create_by | varchar(15) | ✓ |  |  |  |  |
| site_id | varchar(4) | ✓ |  |  |  |  |
| status_user | numeric(5,0) | ✓ |  |  |  |  |
| divisi_id | varchar(2) | ✓ | → dbo.M_DIVISI(divisi_id) |  |  | `NULL` 42, `02` 1 |
| bagian_id | char(10) | ✓ |  |  |  |  |
| flag_salah | smallint | ✓ |  |  |  |  |
| flag_active | char(1) | ✓ |  |  |  | `Y` 43 |
| toko_id | varchar(5) | ✓ |  |  |  |  |

<a id="dbosys_userprogram"></a>
## dbo.SYS_USERPROGRAM

4.652 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| user_id | varchar(15) |  | PK → dbo.SYS_USER(user_id) |  |  |  |
| module_id | varchar(2) |  | PK → dbo.SYS_PROGRAM(module_id, submodule_id, program_id) |  |  | `GL` 1.418, `BH` 836, `TK` 726, `GD` 540, `CB` 336, `AP` 280, `AR` 168, `HR` 168, `SL` 138, `DB` 24, `WB` 18 |
| submodule_id | varchar(2) |  | PK → dbo.SYS_PROGRAM(module_id, submodule_id, program_id) |  |  | `03` 1.935, `02` 1.372, `01` 850, `04` 495 |
| program_id | varchar(30) |  | PK → dbo.SYS_PROGRAM(module_id, submodule_id, program_id) |  |  |  |
| up_insert | varchar(1) |  |  |  |  | `N` 3.450, `Y` 1.202 |
| up_delete | varchar(1) |  |  |  |  | `N` 3.450, `Y` 1.202 |
| up_save | varchar(1) |  |  |  |  | `N` 3.450, `Y` 1.202 |
| up_print | varchar(1) |  |  |  |  | `N` 3.450, `Y` 1.202 |
| flag_active | varchar(1) |  |  |  |  | `N` 3.450, `Y` 1.202 |
| status_user | varchar(1) | ✓ |  |  |  | `NULL` 4.652 |
| up_acc | varchar(1) | ✓ |  |  |  | `N` 3.356, `Y` 930, `NULL` 366 |

<a id="dbosysdiagrams"></a>
## dbo.sysdiagrams

14 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| name | sysname |  |  |  |  |  |
| principal_id | int |  |  |  |  |  |
| diagram_id | int |  | PK IDENTITY |  |  |  |
| version | int | ✓ |  |  |  |  |
| definition | varbinary(max) | ✓ |  |  |  |  |

**Index:** `UK_principal_name` (principal_id, name) unik

<a id="dbot_beli1"></a>
## dbo.T_BELI1

30.246 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| flag_closing | varchar(50) | ✓ |  | ((0)) |  |  |
| flag_batal | bit | ✓ |  | ((0)) |  |  |
| delivery_date | int | ✓ |  |  |  |  |
| tipe_bayar | varchar(1) | ✓ |  |  |  | `K` 30.162, `P` 62, `T` 22 |
| top_payment | int | ✓ |  |  |  |  |
| qty | decimal(18,2) | ✓ |  |  |  |  |
| kode_design | varchar(20) | ✓ |  |  |  |  |
| kode_register | varchar(20) | ✓ |  |  |  |  |
| model_id | varchar(15) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  | `002` 7.444, `001` 4.167, `024` 1.731, `037` 1.277, `100` 1.176, `015` 1.125, `039` 950, `025` 940, `035` 746, `036` 738, `019` 614, `023` 604, `…` |
| aps_id | varchar(2) | ✓ |  |  |  | `01` 15.010, `03` 5.879, `02` 5.330, `08` 1.198, `09` 968, `07` 336, `NULL` 243, `17` 228, `04` 218, `14` 193, `15` 128, `10` 110, `…` |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| flag_baru | varchar(1) | ✓ |  |  |  | `NULL` 30.246 |
| uk_s | int | ✓ |  |  |  |  |
| uk_sm | int | ✓ |  |  |  |  |
| uk_m | int | ✓ |  |  |  |  |
| uk_ml | int | ✓ |  |  |  |  |
| uk_l | int | ✓ |  |  |  |  |
| uk_ll | int | ✓ |  |  |  |  |
| uk_f | int | ✓ |  |  |  |  |
| uk_xl | int | ✓ |  |  |  |  |
| uk_xxl | int | ✓ |  |  |  |  |
| uk_xxx | int | ✓ |  |  |  |  |
| tgl_sample | smalldatetime | ✓ |  |  |  |  |
| tgl_prod | smalldatetime | ✓ |  |  |  |  |
| tgl_delivery | smalldatetime | ✓ |  |  |  |  |
| hrg_jual | decimal(14,2) | ✓ |  |  |  |  |
| hrg_beli | decimal(14,2) | ✓ |  |  |  |  |
| jenis_rm | char(3) | ✓ |  |  |  | `NULL` 30.246 |
| ongkos_jahit | decimal(14,2) | ✓ |  |  |  |  |
| flag_break | varchar(1) | ✓ |  |  |  | `NULL` 30.246 |
| flag_print | int | ✓ |  |  |  |  |
| bukti_mc | varchar(20) | ✓ |  |  |  |  |
| bukti_cost | varchar(20) | ✓ |  |  |  |  |
| note1 | varchar(200) | ✓ |  |  |  |  |
| note2 | varchar(200) | ✓ |  |  |  |  |
| note3 | varchar(200) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 17.414, `A` 11.936, `C` 675, `H` 221 |
| acc_flag | int | ✓ |  |  |  |  |
| acc_tgl | datetime | ✓ |  |  |  |  |
| acc_nik | varchar(10) | ✓ |  |  |  |  |
| DP | numeric(15,0) | ✓ |  |  |  |  |
| tipe_produk | char(1) | ✓ |  |  |  | `G` 16.964, `NULL` 11.774, `R` 1.508 |

<a id="dbot_beli2"></a>
## dbo.T_BELI2

222.848 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK → dbo.T_BELI1(bukti, brand_id) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| brand_id | varchar(2) |  | PK → dbo.T_BELI1(bukti, brand_id) |  |  | `B` 127.295, `A` 91.379, `C` 3.168, `H` 1.006 |

<a id="dbot_git1"></a>
## dbo.T_GIT1

31.654 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| toko_id | varchar(5) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| ekspedisi_id | varchar(5) | ✓ |  |  |  |  |
| tipe_kend | varchar(30) | ✓ |  |  |  |  |
| nopol | varchar(10) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | (0) |  |  |
| disc | numeric(10,2) | ✓ |  | (0) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | (0) |  |  |
| total | numeric(15,0) | ✓ |  | (0) |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 18.213, `A` 12.386, `C` 785, `H` 258, `D` 10, `E` 2 |

<a id="dbot_git2"></a>
## dbo.T_GIT2

237.355 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK → dbo.T_GIT1(bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | (0) |  |  |
| qty | numeric(10,0) | ✓ |  | (0) |  |  |
| subtotal | numeric(15,0) | ✓ |  | (0) |  |  |
| disc | numeric(10,2) | ✓ |  | (0) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | (0) |  |  |
| total | numeric(15,0) | ✓ |  | (0) |  |  |

<a id="dbot_gudang1"></a>
## dbo.T_GUDANG1

58.886 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  | `OUT` 29.743, `IN` 29.143 |
| supp_id | varchar(5) | ✓ |  |  |  |  |
| toko_id | varchar(5) | ✓ |  |  |  |  |
| bukti_ref | varchar(20) | ✓ |  |  |  |  |
| bukti_ref_ext | varchar(20) | ✓ |  |  |  |  |
| no_sj | varchar(20) | ✓ |  |  |  |  |
| ekspedisi_id | varchar(5) | ✓ |  |  |  |  |
| tipe_kend | varchar(30) | ✓ |  |  |  |  |
| no_resi | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| nopol | varchar(15) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 34.113, `A` 22.797, `C` 1.485, `H` 490, `E` 1 |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| bukti_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_gl | varchar(40) | ✓ |  |  |  |  |
| bukti_terima_toko | varchar(15) | ✓ |  |  |  |  |
| toko_id_sj | varchar(5) | ✓ |  |  |  |  |
| bukti_spk | varchar(15) | ✓ |  |  |  |  |

<a id="dbot_gudang2"></a>
## dbo.T_GUDANG2

438.727 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK → dbo.T_GUDANG1(bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_po | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_retur | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

<a id="dbot_jual1"></a>
## dbo.T_JUAL1

27.844 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| toko_id | varchar(5) |  |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | (0) |  |  |
| disc | numeric(10,2) | ✓ |  | (0) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | (0) |  |  |
| total | numeric(15,0) | ✓ |  | (0) |  |  |
| flag_kirim | bit | ✓ |  | (0) |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 15.961, `A` 11.239, `C` 620, `H` 24 |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| bukti_terima | varchar(15) | ✓ |  |  |  |  |

<a id="dbot_jual2"></a>
## dbo.T_JUAL2

209.963 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK → dbo.T_JUAL1(bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | (0) |  |  |
| qty | numeric(10,0) | ✓ |  | (0) |  |  |
| subtotal | numeric(15,0) | ✓ |  | (0) |  |  |
| disc | numeric(10,2) | ✓ |  | (0) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | (0) |  |  |
| total | numeric(15,0) | ✓ |  | (0) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |

<a id="dbot_opname"></a>
## dbo.T_OPNAME

31.791 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| qty_stok | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_koreksi | numeric(10,0) | ✓ |  | ((0)) |  |  |
| harga | numeric(10,0) | ✓ |  |  |  |  |

<a id="dbot_opname_raw"></a>
## dbo.T_OPNAME_RAW

5.160 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  | PK |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 2.497, `A` 2.495, `C` 148, `H` 20 |
| art_id | varchar(25) |  | PK |  |  |  |
| qty_stok | numeric(10,3) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,3) | ✓ |  | ((0)) |  |  |
| qty_koreksi | numeric(10,3) | ✓ |  | ((0)) |  |  |
| harga | numeric(10,3) | ✓ |  |  |  |  |
| gl_acc | varchar(30) | ✓ |  |  |  |  |

<a id="dbot_opname_raw_temp"></a>
## dbo.T_OPNAME_RAW_TEMP

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| art_id | varchar(25) |  | PK |  |  |  |
| qty | numeric(10,3) | ✓ |  | ((0)) |  |  |

<a id="dbot_opname_temp"></a>
## dbo.T_OPNAME_TEMP

2 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  | PK |  |  |  |
| noo | numeric(18,0) |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |

<a id="dbot_opname_toko"></a>
## dbo.T_OPNAME_TOKO

52.892 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| toko_id | varchar(5) |  | PK |  |  |  |
| periode | datetime |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| qty_stok | numeric(10,0) | ✓ |  |  |  |  |
| qty | numeric(10,0) | ✓ |  |  |  |  |
| qty_koreksi | numeric(10,0) | ✓ |  |  |  |  |
| hbeli | numeric(10,0) | ✓ |  |  |  |  |

<a id="dbot_payment"></a>
## dbo.T_PAYMENT

13.902 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| tgl_tempo | datetime | ✓ |  |  |  |  |
| bank_id | varchar(5) | ✓ |  |  |  |  |
| norek | varchar(30) | ✓ |  |  |  |  |
| payment | numeric(15,0) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tipe_bayar | varchar(10) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |

<a id="dbot_peg_cuti"></a>
## dbo.T_PEG_CUTI

95 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| periode | datetime |  | PK |  |  |  |
| peg_id | bigint |  | PK |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| awal | numeric(10,0) | ✓ |  |  |  |  |
| trans | numeric(10,0) | ✓ |  |  |  |  |
| akhir | numeric(10,0) | ✓ |  |  |  |  |

<a id="dbot_pegawai_izin"></a>
## dbo.T_PEGAWAI_IZIN

3.658 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| izin_id | bigint |  | PK IDENTITY |  |  |  |
| pt_id | smallint | ✓ |  |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| peg_id | bigint | ✓ |  |  |  |  |
| nik | varchar(20) | ✓ |  |  |  |  |
| tipe_id | int | ✓ |  |  |  |  |
| tgl1 | datetime | ✓ |  |  |  |  |
| tgl2 | datetime | ✓ |  |  |  |  |
| jml_hari | int | ✓ |  |  |  |  |
| jml_jam | int | ✓ |  |  |  |  |
| jml_mnt | int | ✓ |  |  |  |  |
| keterangan | varchar(100) | ✓ |  |  |  |  |
| foto | varchar(100) | ✓ |  |  |  |  |
| user_entry | varchar(50) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| user_update | varchar(50) | ✓ |  |  |  |  |
| tgl_update | datetime | ✓ |  |  |  |  |
| user_approve_pimpinan | varchar(50) | ✓ |  |  |  |  |
| tgl_approve_pimpinan | datetime | ✓ |  |  |  |  |
| user_approve_hrd | varchar(50) | ✓ |  |  |  |  |
| tgl_approve_hrd | datetime | ✓ |  |  |  |  |
| status_approve | smallint | ✓ |  | ((0)) |  |  |

<a id="dbot_penggajian"></a>
## dbo.T_PENGGAJIAN

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| gaji_id | bigint |  | PK IDENTITY |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| peg_id | bigint | ✓ |  |  |  |  |
| cust_id | varchar(15) | ✓ |  |  |  |  |
| tipe_gaji_id | varchar(5) | ✓ |  |  |  |  |
| umr | numeric(15,0) | ✓ |  |  |  |  |
| hari | int | ✓ |  |  |  |  |
| umr_hari | numeric(15,0) | ✓ |  |  |  |  |
| umr_hari2 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| tunj_jab | numeric(15,0) | ✓ |  | ((0)) |  |  |
| tunj_jab2 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hadir_wd | numeric(15,2) | ✓ |  | ((0)) |  |  |
| hadir_we | numeric(15,2) | ✓ |  | ((0)) |  |  |
| libur_we | numeric(15,2) | ✓ |  | ((0)) |  |  |
| libur_wd | numeric(15,2) | ✓ |  | ((0)) |  |  |
| total_hadir | numeric(15,2) | ✓ |  | ((0)) |  |  |
| total_nilai_hadir | numeric(15,0) | ✓ |  | ((0)) |  |  |
| pot_telat | numeric(10,0) | ✓ |  | ((0)) |  |  |
| pot_izin | numeric(10,0) | ✓ |  | ((0)) |  |  |
| lembur | numeric(15,0) | ✓ |  | ((0)) |  |  |
| premi | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total_gaji | numeric(15,0) | ✓ |  | ((0)) |  |  |
| pinjaman | numeric(15,0) | ✓ |  | ((0)) |  |  |
| bayar_pinjaman | numeric(15,0) | ✓ |  | ((0)) |  |  |
| koperasi | numeric(15,0) | ✓ |  | ((0)) |  |  |
| bayar_koperasi | numeric(15,0) | ✓ |  | ((0)) |  |  |
| koperasi_pinj | numeric(15,0) | ✓ |  | ((0)) |  |  |
| bayar_koperasi_pinj | numeric(15,0) | ✓ |  | ((0)) |  |  |
| bpjs | numeric(15,0) | ✓ |  | ((0)) |  |  |
| pending | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |

<a id="dbot_po_print"></a>
## dbo.T_PO_PRINT

30.462 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(2) |  | PK |  |  | `B` 17.512, `A` 12.019, `C` 692, `H` 223, `D` 16 |
| tgl_sample | smalldatetime | ✓ |  |  |  |  |
| tgl_prod | smalldatetime | ✓ |  |  |  |  |
| tgl_delivery | smalldatetime | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| tipe_bayar | varchar(1) | ✓ |  |  |  | `K` 30.367, `P` 72, `T` 23 |
| top_payment | int | ✓ |  |  |  |  |
| kode_design | varchar(20) | ✓ |  |  |  |  |
| kode_register | varchar(20) | ✓ |  |  |  |  |
| model_id | varchar(15) | ✓ |  |  |  |  |
| bahan_id | varchar(3) | ✓ |  |  |  | `002` 7.483, `001` 4.203, `024` 1.747, `037` 1.283, `100` 1.184, `015` 1.132, `039` 958, `025` 940, `035` 749, `036` 741, `019` 618, `050` 606, `…` |
| aps_id | varchar(2) | ✓ |  |  |  | `01` 15.108, `03` 5.943, `02` 5.349, `08` 1.217, `09` 968, `07` 337, `NULL` 243, `17` 229, `04` 225, `14` 195, `15` 128, `10` 112, `…` |
| grup_dept | varchar(5) | ✓ |  |  |  |  |
| T1_A1 | varchar(20) | ✓ |  |  |  |  |
| T1_A2 | varchar(20) | ✓ |  |  |  |  |
| T1_A3 | varchar(20) | ✓ |  |  |  |  |
| T1_A4 | varchar(20) | ✓ |  |  |  |  |
| T1_A5 | varchar(20) | ✓ |  |  |  |  |
| T1_A6 | varchar(20) | ✓ |  |  |  |  |
| T1_A7 | varchar(20) | ✓ |  |  |  |  |
| T1_A8 | varchar(20) | ✓ |  |  |  |  |
| T1_A9 | varchar(20) | ✓ |  |  |  |  |
| T1_B1 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B2 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B3 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B4 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B5 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B6 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B7 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B8 | numeric(15,0) | ✓ |  |  |  |  |
| T1_B9 | numeric(15,0) | ✓ |  |  |  |  |
| T2_A1 | varchar(10) | ✓ |  |  |  |  |
| T2_A2 | varchar(10) | ✓ |  |  |  |  |
| T2_A3 | varchar(10) | ✓ |  |  |  |  |
| T2_A4 | varchar(10) | ✓ |  |  |  |  |
| T2_A5 | varchar(10) | ✓ |  |  |  |  |
| T2_A6 | varchar(10) | ✓ |  |  |  |  |
| T2_A7 | varchar(10) | ✓ |  |  |  |  |
| T2_1 | varchar(10) | ✓ |  |  |  |  |
| T2_2 | varchar(10) | ✓ |  |  |  |  |
| T2_3 | varchar(10) | ✓ |  |  |  |  |
| T2_4 | varchar(10) | ✓ |  |  |  |  |
| T2_5 | varchar(10) | ✓ |  |  |  |  |
| T2_6 | varchar(10) | ✓ |  |  |  |  |
| T2_7 | varchar(10) | ✓ |  |  |  |  |
| T2_8 | varchar(10) | ✓ |  |  |  |  |
| T2_9 | varchar(10) | ✓ |  |  |  |  |
| T2_B1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_B2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_B3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_B4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_B5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_B6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_B7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_C7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_D7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_E7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_F7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_G7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_H7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_I7 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J1 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J2 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J3 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J4 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J5 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J6 | numeric(10,0) | ✓ |  |  |  |  |
| T2_J7 | numeric(10,0) | ✓ |  |  |  |  |
| T3_A1 | varchar(25) | ✓ |  |  |  |  |
| T3_A2 | varchar(25) | ✓ |  |  |  |  |
| T3_A3 | varchar(25) | ✓ |  |  |  |  |
| T3_A4 | varchar(25) | ✓ |  |  |  |  |
| T3_A5 | varchar(25) | ✓ |  |  |  |  |
| T3_A6 | varchar(25) | ✓ |  |  |  |  |
| T3_A7 | varchar(25) | ✓ |  |  |  |  |
| T3_A8 | varchar(25) | ✓ |  |  |  |  |
| T3_A9 | varchar(25) | ✓ |  |  |  |  |
| T3_A10 | varchar(25) | ✓ |  |  |  |  |
| T3_A11 | varchar(25) | ✓ |  |  |  |  |
| T3_A12 | varchar(25) | ✓ |  |  |  |  |
| T3_A13 | varchar(25) | ✓ |  |  |  |  |
| T3_A14 | varchar(25) | ✓ |  |  |  |  |
| T3_A15 | varchar(25) | ✓ |  |  |  |  |
| T3_B1 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B2 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B3 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B4 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B5 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B6 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B7 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B8 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B9 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B10 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B11 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B12 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B13 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B14 | decimal(10,3) | ✓ |  |  |  |  |
| T3_B15 | decimal(10,3) | ✓ |  |  |  |  |
| note1 | varchar(70) | ✓ |  |  |  |  |
| DP | decimal(15,0) | ✓ |  |  |  |  |
| tipe_produk | char(1) | ✓ |  |  |  | `G` 16.789, `NULL` 12.153, `R` 1.520 |

<a id="dbot_pro_plan1"></a>
## dbo.T_PRO_PLAN1

4 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | smalldatetime | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| model_id | varchar(20) | ✓ |  |  |  |  |
| lama_produksi | int | ✓ |  |  |  |  |
| tgl_selesai | datetime | ✓ |  |  |  |  |
| user_upd | varchar(15) | ✓ |  |  |  |  |
| tgl_upd | smalldatetime | ✓ |  |  |  |  |
| flag_approve | bit | ✓ |  |  |  |  |
| flag_proses | bit | ✓ |  |  |  |  |

<a id="dbot_pro_plan2"></a>
## dbo.T_PRO_PLAN2

7.047 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| bukti | varchar(15) |  | PK |  |  |  |
| model_id | varchar(20) |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `A` 3.775, `B` 3.226, `H` 40, `C` 6 |
| tgl | smalldatetime | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| line_id | bigint | ✓ |  |  |  |  |
| lama_produksi | int | ✓ |  |  |  |  |
| tgl_selesai | datetime | ✓ |  |  |  |  |
| flag_approve | bit | ✓ |  |  |  |  |
| flag_proses | bit | ✓ |  |  |  |  |
| qty | decimal(10,0) | ✓ |  |  |  |  |
| user_upd | varchar(15) | ✓ |  |  |  |  |
| tgl_upd | smalldatetime | ✓ |  |  |  |  |
| ket | varchar(70) | ✓ |  |  |  |  |
| prioritas | varchar(15) | ✓ |  |  |  |  |
| spk | varchar(25) | ✓ |  |  |  |  |
| qty_spk | decimal(10,0) | ✓ |  |  |  |  |

<a id="dbot_rollgd1"></a>
## dbo.T_ROLLGD1

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | smalldatetime | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |
| bukti_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_gl | varchar(40) | ✓ |  |  |  |  |
| bukti_tarik | varchar(15) | ✓ |  |  |  |  |
| bukti_kirim | varchar(15) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | smalldatetime | ✓ |  |  |  |  |
| usr_proses | varchar(15) | ✓ |  |  |  |  |
| tgl_proses | smalldatetime | ✓ |  |  |  |  |

<a id="dbot_rollgd2"></a>
## dbo.T_ROLLGD2

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| URUT | int |  | PK |  |  |  |
| brand_id1 | nchar(10) | ✓ |  |  |  |  |
| produk_id1 | varchar(20) | ✓ |  |  |  |  |
| nama1 | varchar(50) | ✓ |  |  |  |  |
| nama_pendek1 | varchar(25) | ✓ |  |  |  |  |
| qty1 | decimal(10,0) | ✓ |  |  |  |  |
| hbeli1 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual1 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir1 | numeric(15,0) | ✓ |  |  |  |  |
| mall_barcode1 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total1 | decimal(15,0) | ✓ |  |  |  |  |
| brand_id2 | nchar(10) | ✓ |  |  |  |  |
| produk_id2 | varchar(20) | ✓ |  |  |  |  |
| nama2 | varchar(50) | ✓ |  |  |  |  |
| nama_pendek2 | varchar(25) | ✓ |  |  |  |  |
| qty2 | decimal(10,0) | ✓ |  |  |  |  |
| hbeli2 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hjual2 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| hgrosir2 | numeric(15,0) | ✓ |  |  |  |  |
| mall_barcode2 | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total2 | decimal(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | smalldatetime | ✓ |  |  |  |  |

<a id="dbot_rolling1"></a>
## dbo.T_ROLLING1

299 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | smalldatetime | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  | `OUT` 195, `IN` 104 |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| toko_id | varchar(5) | ✓ |  |  |  |  |
| toko_id_ke | varchar(5) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| flag_approve | bit | ✓ |  |  |  |  |
| flag_proses | bit | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | smalldatetime | ✓ |  |  |  |  |
| usr_approve | varchar(15) | ✓ |  |  |  |  |
| tgl_approve | smalldatetime | ✓ |  |  |  |  |
| usr_proses | varchar(15) | ✓ |  |  |  |  |
| tgl_proses | smalldatetime | ✓ |  |  |  |  |

<a id="dbot_rolling2"></a>
## dbo.T_ROLLING2

14.811 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK → dbo.T_ROLLING1(site_id, bukti) |  |  |  |
| bukti | varchar(15) |  | PK → dbo.T_ROLLING1(site_id, bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | decimal(15,0) | ✓ |  |  |  |  |
| qty | decimal(10,0) | ✓ |  |  |  |  |
| total | decimal(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | smalldatetime | ✓ |  |  |  |  |

<a id="dbot_sales_byr"></a>
## dbo.T_SALES_BYR

54.044 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| Urut | bigint |  | PK IDENTITY |  |  |  |
| NoInvoice | varchar(30) |  |  |  |  |  |
| Tanggal | datetime | ✓ |  |  |  |  |
| produk_id | varchar(25) |  |  |  |  |  |
| vou | numeric(18,2) | ✓ |  |  |  |  |
| aff | numeric(18,2) | ✓ |  |  |  |  |
| admin | numeric(18,2) | ✓ |  |  |  |  |
| kirim | numeric(18,2) | ✓ |  |  |  |  |
| jml | numeric(18,2) | ✓ |  |  |  |  |
| Total | numeric(18,2) | ✓ |  |  |  |  |
| flag_proses | bit | ✓ |  | ((0)) |  |  |
| tanggal_pesan | datetime | ✓ |  |  |  |  |
| pajak | numeric(18,2) | ✓ |  |  |  |  |

<a id="dbot_sales_byr_temp"></a>
## dbo.T_SALES_BYR_TEMP

1 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| Urut | bigint |  | PK IDENTITY |  |  |  |
| NoInvoice | varchar(30) |  |  |  |  |  |
| Tanggal | datetime | ✓ |  |  |  |  |
| produk_id | varchar(25) |  |  |  |  |  |
| vou | numeric(18,2) | ✓ |  |  |  |  |
| aff | numeric(18,2) | ✓ |  |  |  |  |
| admin | numeric(18,2) | ✓ |  |  |  |  |
| kirim | numeric(18,2) | ✓ |  |  |  |  |
| jml | numeric(18,2) | ✓ |  |  |  |  |
| Total | numeric(18,2) | ✓ |  |  |  |  |
| Tanggal_pesan | datetime | ✓ |  |  |  |  |
| pajak | numeric(18,2) | ✓ |  |  |  |  |

<a id="dbot_sales_upload"></a>
## dbo.T_SALES_UPLOAD

43.364 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| Urut | bigint |  | PK IDENTITY |  |  |  |
| NoInvoice | varchar(30) | ✓ |  |  |  |  |
| Tanggal | datetime | ✓ |  |  |  |  |
| Market | varchar(50) | ✓ |  |  |  |  |
| Kategori | varchar(50) | ✓ |  |  |  |  |
| Brand | varchar(50) | ✓ |  |  |  |  |
| Artikel | varchar(50) | ✓ |  |  |  |  |
| Size | varchar(50) | ✓ |  |  |  |  |
| Jenis_Barang | varchar(50) | ✓ |  |  |  |  |
| QTY | numeric(10,0) | ✓ |  |  |  |  |
| Harga | numeric(10,0) | ✓ |  |  |  |  |
| Total | numeric(18,2) | ✓ |  |  |  |  |
| Disc | numeric(10,2) | ✓ |  |  |  |  |
| Value_Disc | numeric(15,2) | ✓ |  |  |  |  |
| Promo | numeric(15,2) | ✓ |  |  |  |  |
| Nett | numeric(18,2) | ✓ |  |  |  |  |
| Ongkos_Kirim | numeric(15,2) | ✓ |  |  |  |  |
| Shipment | varchar(50) | ✓ |  |  |  |  |
| Adm | numeric(15,2) | ✓ |  |  |  |  |
| Transfer | numeric(18,2) | ✓ |  |  |  |  |
| Bank | varchar(50) | ✓ |  |  |  |  |
| ket | varchar(50) | ✓ |  |  |  |  |
| Pembeli | varchar(50) | ✓ |  |  |  |  |
| Alamat | varchar(300) | ✓ |  |  |  |  |
| Kota | varchar(50) | ✓ |  |  |  |  |
| Kode_Pos | varchar(15) | ✓ |  |  |  |  |
| Tlp | varchar(50) | ✓ |  |  |  |  |
| Nama_Account | varchar(50) | ✓ |  |  |  |  |
| KETERANGAN | varchar(50) | ✓ |  |  |  |  |
| Ekspedisi | varchar(50) | ✓ |  |  |  |  |
| No_Resi | varchar(50) | ✓ |  |  |  |  |
| Promo_Ongkir | numeric(18,2) | ✓ |  |  |  |  |
| Total_Promo | numeric(18,2) | ✓ |  |  |  |  |
| toko_id | varchar(10) | ✓ |  |  |  |  |
| pembeli_id | varchar(10) | ✓ |  |  |  |  |
| File_Source | varchar(255) | ✓ |  |  |  |  |
| flag_proses | bit | ✓ |  | ((0)) |  |  |
| user_entry | varchar(15) | ✓ |  |  |  |  |
| tgl_entry | smalldatetime | ✓ |  |  |  |  |

<a id="dbot_sales3"></a>
## dbo.T_SALES3

50.234 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| toko_id | varchar(10) |  |  |  |  |  |
| pembeli_id | varchar(10) | ✓ |  |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| bukti_reff | varchar(50) | ✓ |  |  |  |  |
| No_Resi | varchar(50) | ✓ |  |  |  |  |
| Ekspedisi | varchar(50) | ✓ |  |  |  |  |
| flag_sj | bit | ✓ |  | ((0)) |  |  |
| bukti_sj | varchar(15) | ✓ |  |  |  |  |
| subtotal | decimal(15,2) | ✓ |  | ((0)) |  |  |
| total | decimal(15,2) | ✓ |  | ((0)) |  |  |
| user_entry | varchar(15) | ✓ |  |  |  |  |
| tgl_entry | datetime | ✓ |  |  |  |  |
| flag_batal | bit | ✓ |  |  |  |  |
| bukti_ttoko | varchar(15) | ✓ |  |  |  |  |
| tot_biaya | decimal(10,2) | ✓ |  |  |  |  |
| tot_net | decimal(10,2) | ✓ |  |  |  |  |

<a id="dbot_sales4"></a>
## dbo.T_SALES4

57.658 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(4) |  | PK → dbo.T_SALES3(site_id, bukti) |  |  |  |
| bukti | varchar(15) |  | PK → dbo.T_SALES3(site_id, bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| urut | int |  | PK |  |  |  |
| harga | decimal(15,0) | ✓ |  | ((0)) |  |  |
| qty | decimal(10,0) | ✓ |  | ((0)) |  |  |
| Total | decimal(15,2) | ✓ |  | ((0)) |  |  |
| Disc | decimal(10,2) | ✓ |  | ((0)) |  |  |
| Value_Disc | decimal(15,2) | ✓ |  | ((0)) |  |  |
| Promo | decimal(10,2) | ✓ |  | ((0)) |  |  |
| Nett | decimal(15,2) | ✓ |  | ((0)) |  |  |

<a id="dbot_toko1"></a>
## dbo.T_TOKO1

106.583 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| grosir | bit | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  | `OUT` 75.187, `IN` 31.396 |
| flag_retail | bit | ✓ |  | ((0)) |  |  |
| toko_id | varchar(5) | ✓ |  | ((0)) |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| payment | numeric(15,0) | ✓ |  |  |  |  |
| tipe_bayar | varchar(10) | ✓ |  |  |  |  |
| bank_id | varchar(5) | ✓ |  |  |  |  |
| bank_internal | varchar(5) | ✓ |  |  |  |  |
| norek | varchar(30) | ✓ |  |  |  |  |
| tgl_tempo | datetime | ✓ |  |  |  |  |
| sts_bayar | varchar(1) | ✓ |  |  |  | `NULL` 84.233, `C` 13.122, `T` 9.225, `''` 3 |
| cash | numeric(15,0) | ✓ |  |  |  |  |
| debit | numeric(15,0) | ✓ |  |  |  |  |
| credit | numeric(15,0) | ✓ |  |  |  |  |
| change | numeric(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| no_ref | varchar(30) | ✓ |  |  |  |  |
| transfer | numeric(15,0) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `NULL` 78.352, `B` 16.620, `A` 11.292, `H` 225, `C` 93, `E` 1 |
| toko_id2 | varchar(10) | ✓ |  | ((0)) |  |  |
| pembeli_id | varchar(10) | ✓ |  |  |  |  |
| no_resi | varchar(30) | ✓ |  |  |  |  |
| no_resi_ref | varchar(30) | ✓ |  |  |  |  |
| berat | decimal(10,2) | ✓ |  | ((0)) |  |  |
| koli | decimal(10,2) | ✓ |  | ((0)) |  |  |
| flag_proses | bit | ✓ |  | ((0)) |  |  |
| user_proses | varchar(15) | ✓ |  |  |  |  |
| tgl_proses | datetime | ✓ |  |  |  |  |
| no_pesan | varchar(50) | ✓ |  |  |  |  |
| Exp | varchar(50) | ✓ |  |  |  |  |
| sts | char(1) | ✓ |  |  |  | `NULL` 106.583 |
| bukti_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_gl | varchar(40) | ✓ |  |  |  |  |
| tot_qty | decimal(10,0) | ✓ |  |  |  |  |
| tot_biaya | decimal(10,2) | ✓ |  |  |  |  |
| tot_net | decimal(10,2) | ✓ |  |  |  |  |
| tgl_byr | datetime | ✓ |  |  |  |  |
| bukti_byr_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_byr_gl | varchar(40) | ✓ |  |  |  |  |
| tot_byr | decimal(10,2) | ✓ |  |  |  |  |
| ttot_net | decimal(10,2) | ✓ |  |  |  |  |
| ap_biaya | varchar(40) | ✓ |  |  |  |  |

<a id="dbot_toko1_biaya"></a>
## dbo.T_TOKO1_BIAYA

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| grosir | bit | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  |  |
| flag_retail | bit | ✓ |  | ((0)) |  |  |
| toko_id | varchar(5) | ✓ |  | ((0)) |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| payment | numeric(15,0) | ✓ |  |  |  |  |
| tipe_bayar | varchar(10) | ✓ |  |  |  |  |
| bank_id | varchar(5) | ✓ |  |  |  |  |
| bank_internal | varchar(5) | ✓ |  |  |  |  |
| norek | varchar(30) | ✓ |  |  |  |  |
| tgl_tempo | datetime | ✓ |  |  |  |  |
| sts_bayar | varchar(1) | ✓ |  |  |  |  |
| cash | numeric(15,0) | ✓ |  |  |  |  |
| debit | numeric(15,0) | ✓ |  |  |  |  |
| credit | numeric(15,0) | ✓ |  |  |  |  |
| change | numeric(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| no_ref | varchar(30) | ✓ |  |  |  |  |
| transfer | numeric(15,0) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  |  |
| toko_id2 | varchar(10) | ✓ |  | ((0)) |  |  |
| pembeli_id | varchar(10) | ✓ |  |  |  |  |
| no_resi | varchar(30) | ✓ |  |  |  |  |
| no_resi_ref | varchar(30) | ✓ |  |  |  |  |
| berat | decimal(10,2) | ✓ |  | ((0)) |  |  |
| koli | decimal(10,2) | ✓ |  | ((0)) |  |  |
| flag_proses | bit | ✓ |  | ((0)) |  |  |
| user_proses | varchar(15) | ✓ |  |  |  |  |
| tgl_proses | datetime | ✓ |  |  |  |  |
| no_pesan | varchar(50) | ✓ |  |  |  |  |
| Exp | varchar(50) | ✓ |  |  |  |  |
| sts | char(1) | ✓ |  |  |  |  |
| bukti_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_gl | varchar(40) | ✓ |  |  |  |  |
| tot_qty | decimal(10,0) | ✓ |  |  |  |  |
| tot_biaya | decimal(10,2) | ✓ |  |  |  |  |
| tot_net | decimal(10,2) | ✓ |  |  |  |  |
| tgl_byr | datetime | ✓ |  |  |  |  |
| bukti_byr_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_byr_gl | varchar(40) | ✓ |  |  |  |  |
| tot_byr | decimal(10,2) | ✓ |  |  |  |  |

<a id="dbot_toko2"></a>
## dbo.T_TOKO2

1.798.583 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK → dbo.T_TOKO1(site_id, bukti) |  |  |  |
| bukti | varchar(15) |  | PK → dbo.T_TOKO1(site_id, bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_beli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_sj | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `NULL` 1.733.805, `B` 49.773, `H` 12.738, `A` 1.228, `C` 1.039 |
| disc_rp_pcs | numeric(15,0) | ✓ |  | ((0)) |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| qty_mp | numeric(10,0) | ✓ |  | ((0)) |  |  |

<a id="dbot_toko2_biaya"></a>
## dbo.T_TOKO2_BIAYA

0 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK → dbo.T_TOKO1_BIAYA(site_id, bukti) |  |  |  |
| bukti | varchar(15) |  | PK → dbo.T_TOKO1_BIAYA(site_id, bukti) |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_beli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_sj | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  |  |
| disc_rp_pcs | numeric(15,0) | ✓ |  | ((0)) |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| qty_mp | numeric(10,0) | ✓ |  | ((0)) |  |  |

<a id="dbot_toko2xx"></a>
## dbo.T_TOKO2XX

751.395 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_beli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_sj | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `NULL` 751.395 |
| disc_rp_pcs | numeric(15,0) | ✓ |  | ((0)) |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| qty_mp | numeric(10,0) | ✓ |  | ((0)) |  |  |

<a id="dbot_tokox1"></a>
## dbo.T_TOKOX1

10.227 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| grosir | bit | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  | `IN` 5.720, `OUT` 4.507 |
| flag_retail | bit | ✓ |  | ((0)) |  |  |
| toko_id | varchar(5) | ✓ |  | ((0)) |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| payment | numeric(15,0) | ✓ |  |  |  |  |
| tipe_bayar | varchar(10) | ✓ |  |  |  |  |
| bank_id | varchar(5) | ✓ |  |  |  |  |
| bank_internal | varchar(5) | ✓ |  |  |  |  |
| norek | varchar(30) | ✓ |  |  |  |  |
| tgl_tempo | smalldatetime | ✓ |  |  |  |  |
| sts_bayar | varchar(1) | ✓ |  |  |  | `NULL` 6.237, `T` 2.022, `C` 1.965, `''` 3 |
| cash | numeric(15,0) | ✓ |  |  |  |  |
| debit | numeric(15,0) | ✓ |  |  |  |  |
| credit | numeric(15,0) | ✓ |  |  |  |  |
| change | numeric(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| no_ref | varchar(30) | ✓ |  |  |  |  |
| transfer | numeric(15,0) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 5.668, `NULL` 4.559 |

<a id="dbot_tokox2"></a>
## dbo.T_TOKOX2

388.395 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_beli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_sj | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `NULL` 388.395 |

<a id="dbot_tokoxx1"></a>
## dbo.T_TOKOXX1

10.843 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| grosir | bit | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  | `IN` 6.075, `OUT` 4.768 |
| flag_retail | bit | ✓ |  | ((0)) |  |  |
| toko_id | varchar(5) | ✓ |  | ((0)) |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| payment | numeric(15,0) | ✓ |  |  |  |  |
| tipe_bayar | varchar(10) | ✓ |  |  |  |  |
| bank_id | varchar(5) | ✓ |  |  |  |  |
| bank_internal | varchar(5) | ✓ |  |  |  |  |
| norek | varchar(30) | ✓ |  |  |  |  |
| tgl_tempo | smalldatetime | ✓ |  |  |  |  |
| sts_bayar | varchar(1) | ✓ |  |  |  | `NULL` 6.604, `T` 2.154, `C` 2.082, `''` 3 |
| cash | numeric(15,0) | ✓ |  |  |  |  |
| debit | numeric(15,0) | ✓ |  |  |  |  |
| credit | numeric(15,0) | ✓ |  |  |  |  |
| change | numeric(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| no_ref | varchar(30) | ✓ |  |  |  |  |
| transfer | numeric(15,0) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 6.015, `NULL` 4.828 |

<a id="dbot_tokoxx2"></a>
## dbo.T_TOKOXX2

414.873 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) |  | PK |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_beli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_sj | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `NULL` 414.873 |

<a id="dbot_tokoxxx1"></a>
## dbo.T_TOKOXXX1

1.324 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) | ✓ |  |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| cust_id | varchar(10) | ✓ |  |  |  |  |
| grosir | bit | ✓ |  |  |  |  |
| tipe_trans | varchar(20) | ✓ |  |  |  |  |
| status | varchar(3) | ✓ |  |  |  | `IN` 1.264, `OUT` 60 |
| flag_retail | bit | ✓ |  | ((0)) |  |  |
| toko_id | varchar(5) | ✓ |  | ((0)) |  |  |
| bukti_ref | varchar(15) | ✓ |  |  |  |  |
| remark | varchar(50) | ✓ |  |  |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| payment | numeric(15,0) | ✓ |  |  |  |  |
| tipe_bayar | varchar(10) | ✓ |  |  |  |  |
| bank_id | varchar(5) | ✓ |  |  |  |  |
| bank_internal | varchar(5) | ✓ |  |  |  |  |
| norek | varchar(30) | ✓ |  |  |  |  |
| tgl_tempo | datetime | ✓ |  |  |  |  |
| sts_bayar | varchar(1) | ✓ |  |  |  | `NULL` 1.324 |
| cash | numeric(15,0) | ✓ |  |  |  |  |
| debit | numeric(15,0) | ✓ |  |  |  |  |
| credit | numeric(15,0) | ✓ |  |  |  |  |
| change | numeric(15,0) | ✓ |  |  |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| tglupd | datetime | ✓ |  |  |  |  |
| no_ref | varchar(30) | ✓ |  |  |  |  |
| transfer | numeric(15,0) | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `B` 973, `H` 220, `C` 93, `A` 38 |
| toko_id2 | varchar(10) | ✓ |  | ((0)) |  |  |
| pembeli_id | varchar(10) | ✓ |  |  |  |  |
| no_resi | varchar(30) | ✓ |  |  |  |  |
| no_resi_ref | varchar(30) | ✓ |  |  |  |  |
| berat | decimal(10,2) | ✓ |  | ((0)) |  |  |
| koli | decimal(10,2) | ✓ |  | ((0)) |  |  |
| flag_proses | bit | ✓ |  | ((0)) |  |  |
| user_proses | varchar(15) | ✓ |  |  |  |  |
| tgl_proses | datetime | ✓ |  |  |  |  |
| no_pesan | varchar(50) | ✓ |  |  |  |  |
| Exp | varchar(50) | ✓ |  |  |  |  |
| sts | char(1) | ✓ |  |  |  | `NULL` 1.324 |
| bukti_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_gl | varchar(40) | ✓ |  |  |  |  |
| tot_qty | decimal(10,0) | ✓ |  |  |  |  |
| tot_biaya | decimal(10,2) | ✓ |  |  |  |  |
| tot_net | decimal(10,2) | ✓ |  |  |  |  |
| tgl_byr | datetime | ✓ |  |  |  |  |
| bukti_byr_ap | varchar(40) | ✓ |  |  |  |  |
| bukti_byr_gl | varchar(40) | ✓ |  |  |  |  |
| tot_byr | decimal(10,2) | ✓ |  |  |  |  |
| ttot_net | decimal(10,2) | ✓ |  |  |  |  |
| ap_biaya | varchar(40) | ✓ |  |  |  |  |

<a id="dbot_tokoxxx2"></a>
## dbo.T_TOKOXXX2

4.945 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| site_id | varchar(5) | ✓ |  |  |  |  |
| bukti | varchar(15) |  | PK |  |  |  |
| produk_id | varchar(20) |  | PK |  |  |  |
| harga | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_barcode | numeric(15,0) | ✓ |  | ((0)) |  |  |
| harga_beli | numeric(15,0) | ✓ |  | ((0)) |  |  |
| qty_sj | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty_terima | numeric(10,0) | ✓ |  | ((0)) |  |  |
| qty | numeric(10,0) | ✓ |  | ((0)) |  |  |
| subtotal | numeric(15,0) | ✓ |  | ((0)) |  |  |
| disc | numeric(10,2) | ✓ |  | ((0)) |  |  |
| disc_rp | numeric(15,0) | ✓ |  | ((0)) |  |  |
| total | numeric(15,0) | ✓ |  | ((0)) |  |  |
| usrupd | varchar(15) | ✓ |  |  |  |  |
| usrtgl | datetime | ✓ |  |  |  |  |
| brand_id | varchar(1) | ✓ |  |  |  | `NULL` 4.945 |
| disc_rp_pcs | numeric(15,0) | ✓ |  | ((0)) |  |  |
| tgl | datetime | ✓ |  |  |  |  |
| qty_mp | numeric(10,0) | ✓ |  | ((0)) |  |  |

<a id="dbousers"></a>
## dbo.users

28 baris

| Kolom | Tipe | Null | Kunci | Default | Label / keterangan | Nilai kode |
|---|---|:-:|---|---|---|---|
| id | bigint |  | PK IDENTITY |  |  |  |
| name | nvarchar(255) |  |  |  |  |  |
| email | nvarchar(255) |  |  |  |  |  |
| email_verified_at | datetime | ✓ |  |  |  |  |
| password | nvarchar(255) |  |  |  |  |  |
| remember_token | nvarchar(100) | ✓ |  |  |  |  |
| created_at | datetime | ✓ |  |  |  |  |
| updated_at | datetime | ✓ |  |  |  |  |
| pt_id | int | ✓ |  |  |  |  |
| role | nvarchar(255) | ✓ |  |  |  |  |
| nik | nvarchar(255) | ✓ |  |  |  |  |
| supp_id | varchar(10) | ✓ |  |  |  |  |
| nama_supp | varchar(50) | ✓ |  |  |  |  |
| flag_sts | int | ✓ |  |  |  |  |
| flag_prio | int | ✓ |  |  |  |  |

**Index:** `users_email_unique` (email) unik

## Objek lain

**View (4):** `dbo.View_Pegawai`, `dbo.View_Pegawai_Kontrak`, `dbo.View_Pegawai_Kontrak_Gaji`, `dbo.View_produk`

**Stored procedure (29):** `dbo.sp_alterdiagram`, `dbo.sp_Attend_Insert`, `dbo.sp_Attend_Insert_Izin`, `dbo.sp_Attend_Update_Baru`, `dbo.sp_creatediagram`, `dbo.sp_Dashboard_COA`, `dbo.sp_Dashboard_Sales`, `dbo.sp_Dashboard_Sales_Online`, `dbo.sp_Dashboard_Stok`, `dbo.sp_Desty_Generate_Sales`, `dbo.sp_Desty_Generate_Sales_Update`, `dbo.sp_Desty_GetOrder`, `dbo.sp_Desty_RegenToken`, `dbo.sp_dropdiagram`, `dbo.sp_generate_sales_Marketplace`, `dbo.sp_generate_sales_Marketplacex`, `dbo.sp_helpdiagramdefinition`, `dbo.sp_helpdiagrams`, `dbo.sp_Model_Prioritas_Update`, `dbo.sp_PRO_Insert`, `dbo.sp_renamediagram`, `dbo.sp_Retrieve_List_Plan`, `dbo.sp_Retrieve_List_Plan_Detail`, `dbo.sp_Rpt_ProPlan`, `dbo.sp_Rpt_ProPlan_Detail`, `dbo.sp_Rpt_ProPlan2`, `dbo.sp_Rpt_ProPlan3`, `dbo.sp_Rpt_Tes`, `dbo.sp_upgraddiagrams`

**Function (skalar) (4):** `dbo.fn_diagramobjects`, `dbo.SALDO`, `dbo.stok_produk`, `dbo.uf_eom`

**Function (tabel) (1):** `dbo.Get_Awal_Coa`

