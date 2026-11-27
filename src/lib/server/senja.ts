/**
 * Database aplikasi Senja di server SQL yang sama (lihat deploy/BACA-DULU.txt). Data bersama yang dikelola
 * di Senja (mis. master supplier) dibaca langsung dari sana lewat nama tiga bagian: `SENJA.dbo.TABEL`.
 */
export const SENJA_DB = 'SENJA';

/** nama tabel lengkap di database Senja, mis. senja('M_SUPPLIER') → SENJA.dbo.M_SUPPLIER */
export const senja = (table: string) => `${SENJA_DB}.dbo.${table}`;
