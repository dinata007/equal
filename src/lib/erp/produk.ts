/** Rumus master produk yang sama di browser & server (meniru window PowerBuilder W_01_M01). */

/** harga barcode = grosir + grosir × pembilang / penyebut (W_01_M01_ENTRY editchanged) */
export const hargaBarcode = (grosir: unknown, pembilang: unknown, penyebut: unknown) =>
	Number(penyebut) > 0 ? Math.round((Number(pembilang) / Number(penyebut)) * Number(grosir || 0) + Number(grosir || 0)) : null;

/** tahun (2 digit) + huruf bulan (Januari = A) dari tanggal yyyy-mm-dd */
export const tahunBulan = (ymd: string) => (/^\d{4}-\d{2}/.test(ymd) ? ymd.slice(2, 4) + String.fromCharCode(64 + Number(ymd.slice(5, 7))) : '');
