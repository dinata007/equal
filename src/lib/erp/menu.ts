/**
 * Struktur menu = sumber tunggal untuk navigasi, routing, breadcrumb & hak akses.
 * Path halaman (mis. /inventory/transaksi/order-pembelian) sekaligus menjadi kunci izin.
 */
import {
	ArrowLeftRight,
	BadgePercent,
	Banknote,
	BookOpen,
	BookText,
	Boxes,
	Building,
	Calculator,
	CalendarCheck,
	ChartColumn,
	ClipboardCheck,
	ClipboardList,
	Coins,
	CreditCard,
	Factory,
	FileMinus,
	FilePlus,
	FileText,
	HandCoins,
	KeyRound,
	Landmark,
	Layers,
	Lock,
	MapPin,
	Package,
	PackageCheck,
	PackageMinus,
	PackagePlus,
	Receipt,
	Scale,
	Settings,
	ShoppingCart,
	Store,
	Tags,
	TrendingUp,
	Truck,
	Undo2,
	UserCheck,
	Users,
	Wallet,
	Warehouse
} from '@lucide/svelte';
import * as M from './defs/masters';
import * as T from './defs/transactions';
import type { MenuNode, PageDef, TxDef } from './types';

const R = (component: string, props?: Record<string, any>): PageDef => ({ kind: 'report', component, props });
const C = (component: string, props?: Record<string, any>): PageDef => ({ kind: 'custom', component, props });

const stockReports = (itemTable: string, scope: string): MenuNode => ({
	slug: 'report',
	label: 'Report',
	children: [
		{ slug: 'mutasi-stok', label: 'Mutasi Stok', icon: ArrowLeftRight, page: R('stock-mutation', { itemTable, scope }) },
		{ slug: 'kartu-stok', label: 'Kartu Stok', icon: BookText, page: R('stock-card', { itemTable, scope }) }
	]
});
const closing = (scope: string): MenuNode => ({ slug: 'closing-stok', label: 'Closing Stok', icon: Lock, page: C('closing', { scope }) });

export const MENU: MenuNode[] = [
	{
		slug: 'material',
		label: 'Material',
		icon: Factory,
		description: 'Bahan baku & pembelian material',
		children: [
			{
				slug: 'master',
				label: 'Master',
				children: [
					{ slug: 'raw-material', label: 'Raw Material', icon: Layers, page: M.rawMaterial },
					{ slug: 'atribut-material', label: 'Atribut Raw Material', icon: Tags, page: C('attributes', { set: 'material' }) }
				]
			},
			{
				slug: 'transaksi',
				label: 'Transaksi',
				children: [
					{ slug: 'order-pembelian', label: 'Order Pembelian (PO)', icon: ShoppingCart, page: T.matPO },
					{ slug: 'penerimaan-po', label: 'Penerimaan Pembelian PO', icon: PackageCheck, page: T.matReceipt }
				]
			},
			stockReports('raw_materials', 'MAT'),
			{ slug: 'utility', label: 'Utility', children: [closing('MAT')] }
		]
	},
	{
		slug: 'inventory',
		label: 'Inventory',
		icon: Warehouse,
		description: 'Gudang barang jadi & distribusi toko',
		children: [
			{
				slug: 'master',
				label: 'Master',
				children: [
					{ slug: 'produk', label: 'Produk', icon: Package, page: C('products') },
					{ slug: 'atribut-produk', label: 'Atribut Produk', icon: Tags, page: C('attributes', { set: 'produk' }) },
					{ slug: 'supplier', label: 'Supplier', icon: Building, page: M.supplier },
					{ slug: 'ekspedisi', label: 'Ekspedisi', icon: Truck, page: M.expedition }
				]
			},
			{
				slug: 'transaksi',
				label: 'Transaksi',
				children: [
					{ slug: 'order-pembelian', label: 'Order Pembelian (PO)', icon: ShoppingCart, page: T.invPO },
					{ slug: 'penerimaan-barang', label: 'Penerimaan Barang Pembelian', icon: PackageCheck, page: T.invReceipt },
					{ slug: 'retur-pembelian', label: 'Retur Pembelian', icon: Undo2, page: T.invPurchaseReturn },
					{ slug: 'kirim-barang-toko', label: 'Kirim Barang Toko', icon: Truck, page: T.invStoreShipment },
					{ slug: 'terima-retur-toko', label: 'Terima Retur Toko', icon: PackagePlus, page: T.invStoreReturnReceipt }
				]
			},
			stockReports('products', 'INV'),
			{ slug: 'utility', label: 'Utility', children: [closing('INV')] }
		]
	},
	{
		slug: 'sales',
		label: 'Sales',
		icon: TrendingUp,
		description: 'Penjualan & analisa',
		children: [
			{ slug: 'master', label: 'Master', children: [{ slug: 'toko', label: 'Toko', icon: Store, page: M.store }] },
			{ slug: 'transaksi', label: 'Transaksi', children: [{ slug: 'penjualan', label: 'Penjualan', icon: Receipt, page: T.salesOrder }] },
			{ slug: 'report', label: 'Report', children: [{ slug: 'analisa-penjualan', label: 'Analisa Penjualan', icon: ChartColumn, page: R('sales-analysis') }] }
		]
	},
	{
		slug: 'toko',
		label: 'Toko',
		icon: Store,
		description: 'Operasional outlet & POS',
		children: [
			{
				slug: 'master',
				label: 'Master',
				children: [
					{ slug: 'customer', label: 'Customer', icon: Users, page: M.customer },
					{ slug: 'bank', label: 'Bank', icon: CreditCard, page: M.bank }
				]
			},
			{
				slug: 'transaksi',
				label: 'Transaksi',
				children: [
					{ slug: 'terima-barang', label: 'Terima Barang', icon: PackageCheck, page: T.storeReceipt },
					{ slug: 'retur-barang', label: 'Retur Barang', icon: PackageMinus, page: T.storeReturn },
					{ slug: 'penjualan', label: 'Penjualan', icon: ShoppingCart, page: T.storeSale },
					{ slug: 'retur-penjualan', label: 'Retur Penjualan', icon: Undo2, page: T.storeSaleReturn }
				]
			},
			stockReports('products', 'TOKO'),
			{
				slug: 'utility',
				label: 'Utility',
				children: [closing('TOKO'), { slug: 'stok-opname', label: 'Stok Opname', icon: ClipboardCheck, page: T.stockOpname }]
			}
		]
	},
	{
		slug: 'akunting',
		label: 'Akunting',
		icon: Calculator,
		description: 'Piutang, hutang, kas bank & buku besar',
		children: [
			{
				slug: 'master',
				label: 'Master',
				children: [
					{ slug: 'coa', label: 'COA', icon: BookOpen, page: M.coa },
					{ slug: 'site', label: 'Site', icon: MapPin, page: M.site },
					{ slug: 'kas-bank', label: 'Kas Bank', icon: Landmark, page: M.cashBank }
				]
			},
			{
				slug: 'ar',
				label: 'AR (Piutang)',
				children: [
					{
						slug: 'transaksi',
						label: 'Transaksi',
						children: [
							{ slug: 'faktur-tagihan', label: 'Faktur Tagihan', icon: FileText, page: T.arInvoice },
							{ slug: 'nota-debit', label: 'Nota Debit', icon: FilePlus, page: T.arDebitNote },
							{ slug: 'nota-kredit', label: 'Nota Kredit', icon: FileMinus, page: T.arCreditNote }
						]
					},
					{
						slug: 'report',
						label: 'Report',
						children: [
							{ slug: 'mutasi-piutang', label: 'Mutasi Piutang', icon: ArrowLeftRight, page: R('party-mutation', { kind: 'ar' }) },
							{ slug: 'kartu-piutang', label: 'Kartu Piutang', icon: BookText, page: R('party-card', { kind: 'ar' }) }
						]
					}
				]
			},
			{
				slug: 'ap',
				label: 'AP (Hutang)',
				children: [
					{
						slug: 'transaksi',
						label: 'Transaksi',
						children: [
							{ slug: 'nota-debit', label: 'Nota Debit', icon: FilePlus, page: T.apDebitNote },
							{ slug: 'nota-kredit', label: 'Nota Kredit', icon: FileMinus, page: T.apCreditNote }
						]
					},
					{
						slug: 'report',
						label: 'Report',
						children: [
							{ slug: 'mutasi-hutang', label: 'Mutasi Hutang', icon: ArrowLeftRight, page: R('party-mutation', { kind: 'ap' }) },
							{ slug: 'kartu-hutang', label: 'Kartu Hutang', icon: BookText, page: R('party-card', { kind: 'ap' }) }
						]
					}
				]
			},
			{
				slug: 'kas-bank',
				label: 'Kas & Bank',
				children: [
					{
						slug: 'transaksi',
						label: 'Transaksi',
						children: [
							{ slug: 'penerimaan', label: 'Penerimaan Kas/Bank', icon: HandCoins, page: T.cashIn },
							{ slug: 'pengeluaran', label: 'Pengeluaran Kas/Bank', icon: Banknote, page: T.cashOut }
						]
					},
					{
						slug: 'report',
						label: 'Report',
						children: [
							{ slug: 'buku-bank', label: 'Buku Bank', icon: Landmark, page: R('cash-book', { type: 'Bank' }) },
							{ slug: 'buku-kas', label: 'Buku Kas', icon: Wallet, page: R('cash-book', { type: 'Kas' }) }
						]
					}
				]
			},
			{
				slug: 'gl',
				label: 'GL (Buku Besar)',
				children: [
					{
						slug: 'transaksi',
						label: 'Transaksi',
						children: [
							{ slug: 'jurnal', label: 'Jurnal', icon: BookOpen, page: T.journal },
							{ slug: 'jurnal-adjustment', label: 'Jurnal Adjustment', icon: Scale, page: T.journalAdjustment }
						]
					},
					{ slug: 'report', label: 'Report', children: [{ slug: 'jurnal', label: 'Jurnal', icon: Coins, page: R('journal-report') }] }
				]
			}
		]
	},
	{
		slug: 'hr',
		label: 'HR',
		icon: Users,
		description: 'Pegawai, absensi & perizinan',
		children: [
			{
				slug: 'master',
				label: 'Master',
				children: [
					{ slug: 'pegawai', label: 'Pegawai', icon: UserCheck, page: C('employees') },
					{ slug: 'umr', label: 'UMR', icon: BadgePercent, page: M.umr },
					{ slug: 'tunjangan', label: 'Tunjangan Pegawai', icon: HandCoins, page: M.allowance },
					{ slug: 'atribut-pegawai', label: 'Atribut Pegawai', icon: Tags, page: C('attributes', { set: 'pegawai' }) }
				]
			},
			{
				slug: 'transaksi',
				label: 'Transaksi',
				children: [
					{ slug: 'absensi', label: 'Absensi', icon: CalendarCheck, page: T.attendance },
					{ slug: 'perizinan', label: 'Perizinan', icon: ClipboardList, page: T.leave }
				]
			},
			{ slug: 'report', label: 'Report', children: [{ slug: 'absensi', label: 'Absensi', icon: ChartColumn, page: R('attendance-report') }] }
		]
	},
	{
		slug: 'pengaturan',
		label: 'Pengaturan',
		icon: Settings,
		description: 'Pengguna & hak akses',
		children: [
			{ slug: 'pengguna', label: 'Pengguna & Hak Akses', icon: KeyRound, page: C('users'), adminOnly: true }
		]
	}
];

/* ---------- build index ---------- */
export interface Leaf extends MenuNode {
	path: string;
	trail: string[];
	module: MenuNode;
	page: PageDef;
}
export const LEAVES: Leaf[] = [];
const byPath = new Map<string, MenuNode>();

(function walk(nodes: MenuNode[], base: string, trail: string[], module?: MenuNode) {
	for (const n of nodes) {
		n.path = `${base}/${n.slug}`;
		n.trail = [...trail, n.label];
		byPath.set(n.path, n);
		const mod = module ?? n;
		if (n.children) walk(n.children, n.path, n.trail, mod);
		else if (n.page) {
			const leaf = n as Leaf;
			leaf.module = mod;
			LEAVES.push(leaf);
		}
	}
})(MENU, '', []);

/** menu yang diatur lewat sakelar hak akses (tanpa menu khusus admin) */
export const GRANTABLE = LEAVES.filter((l) => !l.adminOnly);
const ADMIN_ONLY = new Set(LEAVES.filter((l) => l.adminOnly).map((l) => l.path));
export const isAdminOnly = (path: string) => ADMIN_ONLY.has(path);
const GRANT_PATHS = new Set(GRANTABLE.map((l) => l.path));
export const isGrantable = (path: string) => GRANT_PATHS.has(path);

const leafByPath = new Map(LEAVES.map((l) => [l.path, l]));
export const leafOf = (path: string) => leafByPath.get(path);

export const findNode = (path: string) => byPath.get(path.replace(/\/$/, ''));
export const isLeaf = (n?: MenuNode): n is Leaf => !!n?.page;
/** Rantai node dari modul hingga node (untuk breadcrumb) */
export function chain(path: string): MenuNode[] {
	const parts = path.split('/').filter(Boolean);
	return parts.map((_, i) => byPath.get('/' + parts.slice(0, i + 1).join('/'))).filter((n): n is MenuNode => !!n);
}

/** Semua definisi transaksi beserta path & labelnya (untuk ledger stok/AR/AP/kas/jurnal) */
export const TX: { def: TxDef; path: string; label: string }[] = LEAVES.filter((l) => l.page.kind === 'transaction').map(
	(l) => ({ def: l.page as TxDef, path: l.path, label: l.label })
);
export const txByTable = (table: string) => TX.find((t) => t.def.table === table);

/** Filter pohon menu berdasarkan izin view */
export function visibleTree(nodes: MenuNode[], can: (path: string) => boolean): MenuNode[] {
	const out: MenuNode[] = [];
	for (const n of nodes) {
		if (n.children) {
			const ch = visibleTree(n.children, can);
			if (ch.length) out.push({ ...n, children: ch });
		} else if (can(n.path!)) out.push(n);
	}
	return out;
}
export const firstLeaf = (n: MenuNode): MenuNode | undefined => (n.children ? n.children.map(firstLeaf).find(Boolean) : n);
