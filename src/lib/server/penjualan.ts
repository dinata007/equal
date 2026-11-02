/**
 * Data penjualan untuk Dashboard (beranda). Hanya baca, langsung dari tabel aplikasi lama.
 * Penjualan kotor dari gudang (retur tidak dikurangkan, sama seperti dashboard Stimulsoft lama):
 *   - Kirim gudang ke toko  : T_GUDANG1/2 status OUT, tipe_trans KIRIM PENJUALAN (channel = toko)
 * Nilai baris = (qty × harga) - disc_rp per baris detail.
 * Hasil dikirim per (tanggal, channel, kategori, produk) dan disaring cakupan brand pengguna.
 */
import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request, sql } from './db.ts';
import { brandScope, brandWhere } from './master/service.ts';

export const GROSIR = 'GROSIR';

export interface PenjualanData {
	/** waktu data diambil dari database (ISO) */
	at: string;
	channels: { id: string; name: string; city: string }[];
	/** [tanggal, channel, kategori, produk, qty, nilai] */
	rows: [string, string, string, string, number, number][];
	/** jumlah dokumen berbeda; kategori '' = seluruh dokumen channel itu pada tanggal tsb: [tanggal, channel, kategori, jumlah] */
	docs: [string, string, string, number][];
}

const TTL = 5 * 60_000;
/** muat ulang paksa paling cepat tiap 15 detik */
const MIN_FRESH = 15_000;
const MAX_SPAN_DAYS = 400;
const cache = new Map<string, { at: number; data: Promise<PenjualanData> }>();

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const SOURCES = `
	SELECT CONVERT(char(10), a.tgl, 23) d, CAST(RTRIM(a.toko_id) AS varchar(10)) ch, CAST('G' + a.bukti AS varchar(40)) doc, b.produk_id, b.qty,
	       (b.qty * b.harga) - ISNULL(b.disc_rp, 0) amount, (b.qty * b.harga) - ISNULL(b.disc_rp, 0) raw
	INTO #s0
	FROM T_GUDANG1 a JOIN T_GUDANG2 b ON a.bukti = b.bukti
	WHERE a.status = 'OUT'
	  AND a.tipe_trans IN ('KIRIM PENJUALAN', 'KIRIM TOKO')
	  AND a.total > 0
	  AND a.tgl >= @f AND a.tgl < @t;

`;

async function run(from: string, to: string, scope: string[] | null, brandOverride?: string): Promise<PenjualanData> {
	const req = await request();
	req.input('pf', from);
	req.input('pt', to);
	if (brandOverride) req.input('pbrand', sql.VarChar(10), brandOverride);
	const brand = brandWhere(req, 'p.brand_id', false, scope);
	const brandFilter = brandOverride ? `AND RTRIM(p.brand_id) = @pbrand` : '';
	const r = await req.query(`
		SET NOCOUNT ON;
		DECLARE @f date = CAST(@pf AS date), @t date = DATEADD(DAY, 1, CAST(@pt AS date));
		${SOURCES}
		SELECT s.d, s.ch, s.doc, ISNULL(RTRIM(p.grup), '-') cat,
		       CASE WHEN NULLIF(LTRIM(RTRIM(p.model_id_lama)), '') IS NOT NULL THEN p.model_id_lama
		            WHEN NULLIF(LTRIM(RTRIM(p.model_produk)), '') IS NOT NULL THEN p.model_produk
		            ELSE s.produk_id END item,
		       s.qty, ISNULL(s.amount, s.raw) amount
		INTO #s
		FROM #s0 s LEFT JOIN View_produk p ON p.produk_id = s.produk_id
		WHERE ${brand} ${brandFilter};

		SELECT d, ch, cat, item, SUM(qty) qty, SUM(amount) amount FROM #s GROUP BY d, ch, cat, item;
		SELECT d, ch, cat, COUNT(DISTINCT doc) n FROM #s GROUP BY d, ch, cat;
		SELECT d, ch, '' cat, COUNT(DISTINCT doc) n FROM #s GROUP BY d, ch;
		SELECT RTRIM(toko_id) id, RTRIM(nama) name, RTRIM(ISNULL(kota, '')) city FROM M_TOKO;`);

	const [rows, docsCat, docsAll, tokos] = r.recordsets as unknown as Record<string, any>[][];
	const used = new Set([...rows].map((x) => x.ch as string));
	const toko = new Map(tokos.map((t) => [t.id as string, t]));
	const channels = [...used].map((id) =>
		id === GROSIR
			? { id, name: 'Grosir / Corporate', city: 'Penjualan B2B' }
			: { id, name: String(toko.get(id)?.name ?? id).replace(/^TOKO /, ''), city: String(toko.get(id)?.city ?? '') }
	);
	return {
		at: new Date().toISOString(),
		channels,
		rows: rows.map((x) => [x.d, x.ch, x.cat, String(x.item).trim(), +x.qty || 0, Math.round(+x.amount || 0)] as PenjualanData['rows'][number]),
		docs: [...docsCat, ...docsAll].map((x) => [x.d, x.ch, x.cat, +x.n] as PenjualanData['docs'][number])
	};
}

export async function penjualan(user: SessionUser, from: unknown, to: unknown, fresh: boolean, brand?: string): Promise<PenjualanData> {
	if (!user.admin && !user.menus.some((m) => m.startsWith('/sales/') || m.startsWith('/toko/'))) throw new AuthError('Anda tidak punya akses ke data penjualan', 403);
	if (!isDate(from) || !isDate(to) || from > to || (Date.parse(to) - Date.parse(from)) / 864e5 > MAX_SPAN_DAYS) throw new AuthError('Rentang tanggal tidak valid');
	const scope = brandScope(user);
	const selectedBrand = brand && brand.trim();
	if (selectedBrand) {
		const allowed = scope ?? ['*'];
		if (!allowed.includes('*') && !allowed.includes(selectedBrand)) throw new AuthError('Brand yang dipilih tidak tersedia untuk akun Anda', 403);
	}
	const key = `${from}|${to}|${selectedBrand ?? ''}|${scope?.slice().sort().join(',') ?? '*'}`;
	const hit = cache.get(key);
	const age = hit ? Date.now() - hit.at : Infinity;
	if (hit && age < (fresh ? MIN_FRESH : TTL)) return hit.data;
	const entry = { at: Date.now(), data: run(from, to, scope, selectedBrand) };
	cache.set(key, entry);
	entry.data.catch(() => cache.get(key) === entry && cache.delete(key));
	if (cache.size > 50) cache.delete(cache.keys().next().value!);
	return entry.data;
}
