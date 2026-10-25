/**
 * Isi Dashboard 2 per perusahaan, dipetakan dari dashboard Stimulsoft lama (legacy/Dashboard_*.mrt).
 * Tab Qty & Nilai lama digabung jadi satu tab dengan pilihan Qty | Nilai; tab tabel pivot lama tidak dipakai.
 * `set` = nama data di server (src/lib/server/dashboard.ts); `key` dimensi = nama kolom hasilnya.
 */
export interface Dim {
	key: string;
	label: string;
}
export type Measure = 'qty' | 'nilai';

interface Base {
	key: string;
	label: string;
	set: string;
}
/** ringkasan transaksi per bulan: KPI, tren harian, peringkat */
export interface FlowTab extends Base {
	kind: 'flow';
	/** kata benda di judul (Penjualan / Pembelian) */
	noun: string;
	/** satuan qty (kosong bila campuran, mis. kain meter & aksesoris pcs) */
	unit: string;
	/** satu garis per nilai dimensi ini */
	series: Dim;
	/** peringkat tambahan selain `series` */
	breakdowns: Dim[];
}
/** komposisi stok */
export interface StockTab extends Base {
	kind: 'stock';
	/** donut (porsi) */
	share: Dim;
	/** batang bertumpuk per nilai dimensi ini, dipecah per `share` */
	stack: Dim;
}
export type TabDef = FlowTab | StockTab;

export interface DashboardDef {
	/** nama perusahaan di pilihan Senja | JP */
	company: string;
	tabs: TabDef[];
}

const toko: Dim = { key: 'toko', label: 'Toko' };
const dept: Dim = { key: 'dept', label: 'Dept' };
const brand: Dim = { key: 'brand', label: 'Brand' };
const gudang: Dim = { key: 'gudang', label: 'Gudang' };

export const DASHBOARDS: Record<'senja' | 'jp', DashboardDef> = {
	senja: {
		company: 'Senja',
		tabs: [
			{ key: 'penjualan', label: 'Penjualan', kind: 'flow', set: 'sales', noun: 'Penjualan', unit: 'pcs', series: toko, breakdowns: [dept] },
			{ key: 'stok', label: 'Stok', kind: 'stock', set: 'stok', share: brand, stack: dept }
		]
	},
	jp: {
		company: 'JP',
		tabs: [
			{ key: 'penjualan', label: 'Penjualan', kind: 'flow', set: 'sales', noun: 'Penjualan', unit: 'pcs', series: brand, breakdowns: [{ key: 'spk', label: 'SPK' }] },
			{
				key: 'pembelian',
				label: 'Pembelian',
				kind: 'flow',
				set: 'beli',
				noun: 'Pembelian',
				unit: '',
				series: brand,
				breakdowns: [{ key: 'jenis', label: 'Jenis' }, { key: 'supplier', label: 'Supplier' }]
			},
			{ key: 'stok', label: 'Stok', kind: 'stock', set: 'stok', share: brand, stack: gudang }
		]
	}
};
