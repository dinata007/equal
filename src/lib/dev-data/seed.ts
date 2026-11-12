/**
 * Data prototipe: dibangkitkan deterministik (PRNG) relatif terhadap tanggal hari ini,
 * sehingga dashboard & report selalu terlihat "hidup".
 */
import { addDays, iso, today } from '../util/format';
import type { Row } from '../domain/types';

function mulberry32(a: number) {
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function seed(): Record<string, Row[]> {
	const rnd = mulberry32(20261019);
	const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
	const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
	const shuffle = <T>(arr: T[]) => [...arr].sort(() => rnd() - 0.5);
	const T0 = today();
	const D = (n: number) => addDays(T0, -n);
	const now = new Date().toISOString();
	let k = 0;
	const lk = () => 'l' + (++k).toString(36);

	/* ---------------- master ---------------- */
	const sites = [
		['S01', 'Kantor Pusat Bandung', 'Kantor', 'Bandung'],
		['S02', 'Gudang & Produksi Cimahi', 'Gudang', 'Cimahi'],
		['S03', 'Toko Dago', 'Toko', 'Bandung'],
		['S04', 'Toko Kemang', 'Toko', 'Jakarta Selatan'],
		['S05', 'Toko Malioboro', 'Toko', 'Yogyakarta'],
		['S06', 'Toko Tunjungan', 'Toko', 'Surabaya']
	].map(([code, name, type, city]) => ({ id: 'site-' + code, code, name, type, city, address: '', active: true }));

	const stores = [
		['T01', 'Senja Dago', 'Bandung', 'Rina Marlina', 'S03', 'Jl. Ir. H. Juanda No. 88'],
		['T02', 'Senja Kemang', 'Jakarta Selatan', 'Fajar Nugroho', 'S04', 'Jl. Kemang Raya No. 21'],
		['T03', 'Senja Malioboro', 'Yogyakarta', 'Wulan Sari', 'S05', 'Jl. Malioboro No. 112'],
		['T04', 'Senja Tunjungan', 'Surabaya', 'Hendra Wijaya', 'S06', 'Jl. Tunjungan No. 45']
	].map(([code, name, city, manager, site, address]) => ({
		id: 'store-' + code,
		code,
		name,
		city,
		manager,
		siteId: 'site-' + site,
		address,
		phone: '08' + ri(1100000000, 1399999999),
		active: true
	}));

	const suppliers = [
		['SUP-001', 'PT Kahatex', 'Bpk. Gunawan', 'Bandung', 30],
		['SUP-002', 'CV Benang Mas Jaya', 'Ibu Lilis', 'Bandung', 14],
		['SUP-003', 'PT Garmindo Aksesoris', 'Bpk. Teddy', 'Jakarta Utara', 30],
		['SUP-004', 'CV Konveksi Mitra Abadi', 'Bpk. Asep', 'Bandung', 30],
		['SUP-005', 'PT Sandang Nusantara', 'Ibu Ratna', 'Surakarta', 45]
	].map(([code, name, contact, city, termDays]) => ({
		id: 'sup-' + code,
		code,
		name,
		contact,
		city,
		termDays,
		phone: '022-' + ri(6000000, 7999999),
		email: String(name).toLowerCase().replace(/^(pt|cv) /, '').replace(/\s+/g, '') + '@mail.co.id',
		npwp: `0${ri(1, 9)}.${ri(100, 999)}.${ri(100, 999)}.${ri(1, 9)}-${ri(400, 499)}.000`,
		address: '',
		active: true
	}));

	const expeditions = [
		['EXP-01', 'Armada Internal', 'Trucking'],
		['EXP-02', 'JNE Trucking', 'Cargo'],
		['EXP-03', 'SiCepat Cargo', 'Cargo'],
		['EXP-04', 'Lion Parcel', 'Reguler'],
		['EXP-05', 'Deliveree', 'Express']
	].map(([code, name, service]) => ({ id: 'exp-' + code, code, name, service, phone: '0800-' + ri(1000000, 9999999), active: true }));

	const raw_materials = [
		['RM-0001', 'Kain Katun Combed 30s Hitam', 'Kain', 'Kg', 128000],
		['RM-0002', 'Kain Katun Combed 30s Putih', 'Kain', 'Kg', 122000],
		['RM-0003', 'Kain Flanel Kotak', 'Kain', 'Meter', 38500],
		['RM-0004', 'Kain Denim 14oz Indigo', 'Kain', 'Yard', 56000],
		['RM-0005', 'Kain Fleece Cotton', 'Kain', 'Kg', 137000],
		['RM-0006', 'Benang Jahit Polyester 40/2', 'Benang', 'Cone', 18500],
		['RM-0007', 'Kancing Kemeja 18L', 'Aksesoris', 'Lusin', 6000],
		['RM-0008', 'Resleting YKK 20cm', 'Aksesoris', 'Pcs', 4500],
		['RM-0009', 'Label Woven Senja', 'Aksesoris', 'Pcs', 850],
		['RM-0010', 'Polybag Packing 30x40', 'Packaging', 'Pack', 26000]
	].map(([code, name, category, unit, price]) => ({ id: 'rm-' + code, code, name, category, unit, price, minStock: 20, active: true }));

	const products = [
		['PRD-0001', 'Kaos Polos Senja Hitam', 'Atasan', 45000, 99000],
		['PRD-0002', 'Kaos Polos Senja Putih', 'Atasan', 45000, 99000],
		['PRD-0003', 'Kaos Graphic Golden Hour', 'Atasan', 55000, 129000],
		['PRD-0004', 'Kemeja Flanel Kotak Merah', 'Atasan', 95000, 229000],
		['PRD-0005', 'Kemeja Oxford Biru Muda', 'Atasan', 90000, 219000],
		['PRD-0006', 'Polo Shirt Navy', 'Atasan', 70000, 169000],
		['PRD-0007', 'Celana Chino Khaki', 'Bawahan', 110000, 259000],
		['PRD-0008', 'Celana Jeans Slim Indigo', 'Bawahan', 135000, 319000],
		['PRD-0009', 'Jogger Pants Abu', 'Bawahan', 85000, 199000],
		['PRD-0010', 'Hoodie Zipper Charcoal', 'Outer', 140000, 329000],
		['PRD-0011', 'Jaket Denim Classic', 'Outer', 175000, 399000],
		['PRD-0012', 'Cardigan Rajut Cream', 'Outer', 120000, 279000],
		['PRD-0013', 'Topi Baseball Senja', 'Aksesoris', 30000, 79000],
		['PRD-0014', 'Totebag Kanvas', 'Aksesoris', 25000, 69000],
		['PRD-0015', 'Kaus Kaki Isi 3', 'Aksesoris', 18000, 49000],
		['PRD-0016', 'Sweater Crewneck Sage', 'Outer', 115000, 269000]
	].map(([code, name, category, buyPrice, sellPrice], i) => ({
		id: 'prd-' + code,
		code,
		barcode: '899' + String(1000000000 + i * 7919).slice(0, 10),
		name,
		category,
		unit: 'Pcs',
		buyPrice,
		sellPrice,
		minStock: 10,
		active: true
	}));

	const customers = [
		['CUS-0001', 'Umum', 'Retail', ''],
		['CUS-0002', 'Andi Pratama', 'Member', 'T01'],
		['CUS-0003', 'Siti Rahmawati', 'Member', 'T02'],
		['CUS-0004', 'Budi Santoso', 'Member', 'T03'],
		['CUS-0005', 'Dewi Lestari', 'Member', 'T04'],
		['CUS-0006', 'PT Distro Kreatif Indonesia', 'Corporate', ''],
		['CUS-0007', 'CV Mode Nusantara', 'Corporate', ''],
		['CUS-0008', 'PT Seragam Prima Mandiri', 'Corporate', ''],
		['CUS-0009', 'Koperasi Karyawan Sejahtera', 'Corporate', '']
	].map(([code, name, type, store]) => ({
		id: 'cus-' + code,
		code,
		name,
		type,
		storeId: store ? 'store-' + store : '',
		phone: code === 'CUS-0001' ? '' : '08' + ri(1100000000, 1399999999),
		email: '',
		creditLimit: type === 'Corporate' ? 150_000_000 : 0,
		address: '',
		active: true
	}));

	const banks = [
		['BNK-01', 'BCA', 'EDC Debit', '0012345601', 0.15],
		['BNK-02', 'Mandiri', 'EDC Kredit', '0012345602', 1.8],
		['BNK-03', 'QRIS (Semua Bank)', 'QRIS', 'ID1023456789', 0.3],
		['BNK-04', 'BCA Transfer', 'Transfer', '7770011223', 0]
	].map(([code, name, channel, accountNo, mdr]) => ({ id: 'bnk-' + code, code, name, channel, accountNo, accountName: 'PT Senja Busana Indonesia', mdr, active: true }));

	const coaRaw: [string, string, string][] = [
		['1-1100', 'Kas Besar', 'Aset'],
		['1-1110', 'Kas Kecil Toko', 'Aset'],
		['1-1200', 'Bank BCA', 'Aset'],
		['1-1210', 'Bank Mandiri', 'Aset'],
		['1-1300', 'Piutang Usaha', 'Aset'],
		['1-1400', 'Persediaan Bahan Baku', 'Aset'],
		['1-1410', 'Persediaan Barang Jadi', 'Aset'],
		['1-1500', 'PPN Masukan', 'Aset'],
		['1-2100', 'Peralatan & Mesin', 'Aset'],
		['1-2190', 'Akumulasi Penyusutan', 'Aset'],
		['2-1100', 'Hutang Usaha', 'Kewajiban'],
		['2-1200', 'PPN Keluaran', 'Kewajiban'],
		['2-1300', 'Hutang Gaji', 'Kewajiban'],
		['3-1000', 'Modal Disetor', 'Ekuitas'],
		['3-2000', 'Laba Ditahan', 'Ekuitas'],
		['4-1000', 'Penjualan', 'Pendapatan'],
		['4-1100', 'Retur & Potongan Penjualan', 'Pendapatan'],
		['4-2000', 'Pendapatan Lain-lain', 'Pendapatan'],
		['5-1000', 'Harga Pokok Penjualan', 'HPP'],
		['6-1000', 'Beban Gaji & Tunjangan', 'Beban'],
		['6-1100', 'Beban Sewa', 'Beban'],
		['6-1200', 'Beban Listrik, Air & Internet', 'Beban'],
		['6-1300', 'Beban Transportasi & Ekspedisi', 'Beban'],
		['6-1400', 'Beban Administrasi Bank', 'Beban'],
		['6-1500', 'Beban ATK & Perlengkapan', 'Beban'],
		['6-1600', 'Beban Lain-lain', 'Beban']
	];
	const coa = coaRaw.map(([code, name, type]) => ({
		id: 'coa-' + code,
		code,
		name,
		type,
		normal: ['Aset', 'HPP', 'Beban'].includes(type) && code !== '1-2190' ? 'Debit' : 'Kredit',
		active: true
	}));
	const C = (code: string) => 'coa-' + code;

	const cashbanks = [
		{ id: 'kb-01', code: 'KB-01', name: 'Kas Besar Pusat', type: 'Kas', coaId: C('1-1100'), opening: 25_000_000, active: true },
		{ id: 'kb-02', code: 'KB-02', name: 'Kas Kecil Toko', type: 'Kas', coaId: C('1-1110'), opening: 5_000_000, active: true },
		{ id: 'kb-03', code: 'KB-03', name: 'BCA Operasional', type: 'Bank', coaId: C('1-1200'), bankName: 'BCA', accountNo: '437-0889-123', opening: 950_000_000, active: true },
		{ id: 'kb-04', code: 'KB-04', name: 'Mandiri Payroll', type: 'Bank', coaId: C('1-1210'), bankName: 'Mandiri', accountNo: '131-00-998877-6', opening: 320_000_000, active: true }
	];

	const empRaw: [string, string, string, string][] = [
		['Rudi Hartono', 'Direktur Operasional', 'Manajemen', 'S01'],
		['Maya Puspita', 'Manajer Keuangan', 'Keuangan', 'S01'],
		['Agus Setiawan', 'Staf Akunting', 'Keuangan', 'S01'],
		['Nadia Putri', 'Staf HRD', 'HRD', 'S01'],
		['Dedi Kurniawan', 'Kepala Gudang', 'Gudang', 'S02'],
		['Yusuf Maulana', 'Staf Gudang', 'Gudang', 'S02'],
		['Ilham Ramadhan', 'Operator Jahit', 'Produksi', 'S02'],
		['Sri Wahyuni', 'Operator Jahit', 'Produksi', 'S02'],
		['Rina Marlina', 'Kepala Toko', 'Toko', 'S03'],
		['Tika Amelia', 'Kasir', 'Toko', 'S03'],
		['Fajar Nugroho', 'Kepala Toko', 'Toko', 'S04'],
		['Wulan Sari', 'Kepala Toko', 'Toko', 'S05'],
		['Hendra Wijaya', 'Kepala Toko', 'Toko', 'S06'],
		['Bayu Saputra', 'Pramuniaga', 'Toko', 'S06']
	];
	const employees = empRaw.map(([name, position, department, site], i) => ({
		id: 'emp-' + (i + 1),
		nik: 'SNJ' + String(2101 + i * 7).padStart(5, '0'),
		name,
		position,
		department,
		siteId: 'site-' + site,
		joinDate: iso(new Date(2019 + (i % 6), (i * 3) % 12, 1 + i)),
		status: i < 6 ? 'Tetap' : 'Kontrak',
		baseSalary: position.startsWith('Dir') ? 18_000_000 : position.startsWith('Manajer') ? 12_000_000 : position.startsWith('Kepala') ? 7_500_000 : 5_200_000,
		phone: '08' + ri(1100000000, 1399999999),
		email: name.split(' ')[0].toLowerCase() + '@senja.co.id',
		active: true
	}));

	const yr = new Date().getFullYear();
	const umr = [
		['Kota Bandung', 4_745_000],
		['Kota Cimahi', 4_690_000],
		['Kota Jakarta Selatan', 5_720_000],
		['Kota Yogyakarta', 2_840_000],
		['Kota Surabaya', 5_230_000]
	].map(([region, amount], i) => ({ id: 'umr-' + i, region, year: yr, amount, decree: `SK/${yr}/UMK/${100 + i}` }));

	const allowances = [
		['TJ-01', 'Tunjangan Transport', 'Tidak Tetap', 'Per Hari Hadir', 25000],
		['TJ-02', 'Tunjangan Makan', 'Tidak Tetap', 'Per Hari Hadir', 30000],
		['TJ-03', 'Tunjangan Jabatan', 'Tetap', 'Per Bulan', 1500000],
		['TJ-04', 'Insentif Kehadiran', 'Tidak Tetap', 'Per Bulan', 300000],
		['TJ-05', 'BPJS Kesehatan (Perusahaan)', 'Tetap', '% Gaji Pokok', 4]
	].map(([code, name, type, basis, amount]) => ({ id: 'tj-' + code, code, name, type, basis, amount, active: true }));

	/* ---------------- transaksi ---------------- */
	const tables: Record<string, Row[]> = {};
	const counters: Record<string, number> = {};
	const P = (id: string) => products.find((p) => p.id === id)!;
	const M = (id: string) => raw_materials.find((p) => p.id === id)!;

	function doc(table: string, prefix: string, date: string, head: Record<string, any>, lines: Record<string, any>[], opt: { status?: string; priced?: boolean; taxRate?: number; discount?: number } = {}) {
		const head2 = `${prefix}/${date.slice(2, 4)}${date.slice(5, 7)}/`;
		counters[head2] = (counters[head2] ?? 0) + 1;
		const ls: Record<string, any>[] = lines.map((l) => ({ _k: lk(), ...l }));
		let subtotal = 0;
		if (opt.priced !== false) for (const l of ls) subtotal += (l.qty ?? 0) * (l.price ?? 0) * (1 - (l.disc ?? 0) / 100) || (l.amount ?? 0) || (l.debit ?? 0);
		const discount = opt.discount ?? 0;
		const tax = Math.round(((subtotal - discount) * (opt.taxRate ?? 0)) / 100);
		const d = {
			id: table + '-' + counters[head2] + '-' + date,
			no: head2 + String(counters[head2]).padStart(4, '0'),
			date,
			status: opt.status ?? 'posted',
			...head,
			lines: ls,
			discount,
			taxRate: opt.taxRate ?? 0,
			subtotal,
			tax,
			total: subtotal - discount + tax,
			createdBy: 'admin',
			createdAt: now,
			updatedAt: now
		};
		(tables[table] ??= []).push(d);
		return d;
	}

	// stok berjalan (untuk menjaga data tidak minus)
	const inv = new Map<string, number>();
	const tok = new Map<string, Map<string, number>>(stores.map((s) => [s.id, new Map()]));
	const add = (m: Map<string, number>, id: string, q: number) => m.set(id, (m.get(id) ?? 0) + q);

	// Material
	const matPlan: [number, string, string[], number?][] = [
		[72, 'sup-SUP-001', ['rm-RM-0001', 'rm-RM-0002', 'rm-RM-0005'], 4],
		[46, 'sup-SUP-002', ['rm-RM-0006', 'rm-RM-0007', 'rm-RM-0009', 'rm-RM-0010'], 4],
		[21, 'sup-SUP-001', ['rm-RM-0003', 'rm-RM-0004'], 5],
		[6, 'sup-SUP-003', ['rm-RM-0008', 'rm-RM-0009']],
		[3, 'sup-SUP-002', ['rm-RM-0006', 'rm-RM-0010']]
	];
	matPlan.forEach(([day, sup, items, recv], i) => {
		const lines = items.map((id) => ({ itemId: id, unit: M(id).unit, qty: ri(4, 20) * 10, price: M(id).price, disc: 0 }));
		const po = doc('mat_po', 'MPO', D(day), { supplierId: sup, termDays: 30, deliveryDate: D(day - 5) }, lines, { taxRate: 11, status: i === 3 ? 'draft' : 'posted' });
		if (recv) doc('mat_receipt', 'MRC', D(day - recv), { supplierId: sup, sourceId: po.id, sjNo: 'SJ-' + ri(10000, 99999), expeditionId: 'exp-EXP-02' }, lines, { taxRate: 11 });
	});

	// Inventory PO & penerimaan
	const invPlan: [number, string, boolean][] = [
		[74, 'sup-SUP-004', true],
		[52, 'sup-SUP-005', true],
		[31, 'sup-SUP-004', true],
		[12, 'sup-SUP-005', false]
	];
	const pendingReceipts: [number, () => void][] = [];
	for (const [day, sup, recv] of invPlan) {
		const lines = shuffle(products)
			.slice(0, ri(8, 12))
			.map((p) => ({ itemId: p.id, unit: 'Pcs', qty: ri(12, 24) * 10, price: p.buyPrice, disc: 0 }));
		const po = doc('inv_po', 'IPO', D(day), { supplierId: sup, termDays: 30, deliveryDate: D(day - 3) }, lines, { taxRate: 11 });
		if (recv)
			pendingReceipts.push([
				day - 3,
				() => {
					doc('inv_receipt', 'IRC', D(day - 3), { supplierId: sup, sourceId: po.id, sjNo: 'SJ-' + ri(10000, 99999), expeditionId: 'exp-EXP-01' }, lines, { taxRate: 11 });
					lines.forEach((l) => add(inv, l.itemId, l.qty));
				}
			]);
	}

	const corporates = customers.filter((c) => c.type === 'Corporate');
	const shipments: { day: number; d: any }[] = [];
	const salesOrders: { day: number; d: any }[] = [];

	for (let day = 75; day >= 0; day--) {
		const date = D(day);
		for (const [d, fn] of pendingReceipts) if (d === day) fn();

		// kirim barang ke toko tiap 7 hari
		if (day <= 69 && day % 7 === 0) {
			for (const s of stores) {
				const lines = shuffle(products)
					.filter((p) => (inv.get(p.id) ?? 0) > 20)
					.slice(0, ri(6, 9))
					.map((p) => ({ itemId: p.id, unit: 'Pcs', qty: Math.min(ri(2, 5) * 5, (inv.get(p.id) ?? 0) - 10), note: '' }));
				if (!lines.length) continue;
				lines.forEach((l) => add(inv, l.itemId, -l.qty));
				const d = doc('inv_store_shipment', 'KBT', date, { storeId: s.id, expeditionId: pick(['exp-EXP-01', 'exp-EXP-02', 'exp-EXP-03']), driver: 'Resi ' + ri(100000, 999999) }, lines, { priced: false });
				shipments.push({ day, d });
			}
		}
		// toko menerima H+1 (kecuali kiriman 1 hari terakhir: masih di jalan)
		for (const sh of shipments.filter((x) => x.day === day + 1)) {
			const d = sh.d;
			doc('store_receipts', 'TBT', date, { storeId: d.storeId, sourceId: d.id, receivedBy: stores.find((s) => s.id === d.storeId)!.manager }, d.lines.map((l: any) => ({ itemId: l.itemId, unit: l.unit, qty: l.qty })), { priced: false });
			d.lines.forEach((l: any) => add(tok.get(d.storeId)!, l.itemId, l.qty));
		}

		// retur toko ke gudang & retur pembelian (hanya bila stok cukup)
		if (day === 40) {
			const p = P('prd-PRD-0004');
			doc('inv_purchase_return', 'IRB', date, { supplierId: 'sup-SUP-004', reason: 'Cacat Produksi', expeditionId: 'exp-EXP-01' }, [{ itemId: p.id, unit: 'Pcs', qty: 5, price: p.buyPrice, disc: 0 }]);
			add(inv, p.id, -5);
		}
		for (const [d, sid, reason, recvDay] of [[30, 'store-T02', 'Rusak', 28], [4, 'store-T03', 'Slow Moving', -1]] as const) {
			if (day !== d) continue;
			const st = tok.get(sid)!;
			const p = products.find((x) => (st.get(x.id) ?? 0) >= 3);
			if (!p) continue;
			const ln = [{ itemId: p.id, unit: 'Pcs', qty: 2, note: reason === 'Rusak' ? 'Noda' : '' }];
			add(st, p.id, -2);
			const rt = doc('store_returns', 'TRB', date, { storeId: sid, reason, expeditionId: 'exp-EXP-02' }, ln, { priced: false });
			if (recvDay >= 0)
				pendingReceipts.push([
					recvDay,
					() => {
						doc('inv_store_return_receipt', 'TRT', D(recvDay), { storeId: sid, sourceId: rt.id }, ln, { priced: false });
						add(inv, p.id, 2);
					}
				]);
		}
		if (day === 18) {
			doc('store_sale_returns', 'RPJ', date, { storeId: 'store-T01', customerId: 'cus-CUS-0002', refNo: '', reason: 'Ukuran Tidak Sesuai' }, [{ itemId: 'prd-PRD-0001', unit: 'Pcs', qty: 1, price: 99000, disc: 0 }]);
			add(tok.get('store-T01')!, 'prd-PRD-0001', 1);
		}

		// penjualan grosir ke corporate
		if ([60, 48, 36, 25, 14, 6].includes(day)) {
			const lines = shuffle(products)
				.filter((p) => (inv.get(p.id) ?? 0) > 40)
				.slice(0, ri(3, 5))
				.map((p) => ({ itemId: p.id, unit: 'Pcs', qty: ri(2, 5) * 5, price: Math.round(Number(p.sellPrice) * 0.8), disc: 0 }));
			lines.forEach((l) => add(inv, l.itemId, -l.qty));
			const d = doc('sales_orders', 'SJL', date, { customerId: pick(corporates).id, salesman: pick(['Andre', 'Lukman', 'Sinta']), termDays: 30, expeditionId: 'exp-EXP-02' }, lines);
			salesOrders.push({ day, d });
		}
	}

	// Faktur tagihan + pelunasan
	salesOrders.forEach(({ day, d }, i) => {
		if (day < 2) return;
		if (i === salesOrders.length - 1) return; // belum ditagih
		const inv = doc('ar_invoices', 'INV', D(day - 1), { customerId: d.customerId, sourceId: d.id, dueDate: D(day - 31), poCustomer: 'PO-' + ri(1000, 9999) }, d.lines.map((l: any) => ({ ...l })), { taxRate: 11 });
		if (i < 3)
			doc('cash_in', 'BKM', D(Math.max(0, day - 21)), { kasbankId: 'kb-03', kind: 'Pelunasan Piutang', customerId: d.customerId, from: customers.find((c) => c.id === d.customerId)!.name }, [{ coaId: C('1-1300'), desc: 'Pelunasan ' + inv.no, amount: inv.total }]);
	});

	// Pembayaran hutang
	for (const r of (tables.inv_receipt ?? []).slice(0, 2).concat((tables.mat_receipt ?? []).slice(0, 1))) {
		const day = Math.round((+new Date(T0) - +new Date(r.date)) / 864e5);
		doc('cash_out', 'BKK', D(Math.max(0, day - 25)), { kasbankId: 'kb-03', kind: 'Pembayaran Hutang', supplierId: r.supplierId, to: suppliers.find((s) => s.id === r.supplierId)!.name }, [{ coaId: C('2-1100'), desc: 'Pembayaran ' + r.no, amount: r.total }]);
	}

	// Biaya operasional bulanan
	for (const day of [70, 40, 10]) {
		doc('cash_out', 'BKK', D(day), { kasbankId: 'kb-03', kind: 'Umum', to: 'Pemilik Ruko' }, [{ coaId: C('6-1100'), desc: 'Sewa 4 outlet', amount: 48_000_000 }]);
		doc('cash_out', 'BKK', D(day - 2), { kasbankId: 'kb-03', kind: 'Umum', to: 'PLN, PDAM, ISP' }, [
			{ coaId: C('6-1200'), desc: 'Listrik & air', amount: ri(70, 90) * 100_000 },
			{ coaId: C('6-1200'), desc: 'Internet', amount: 2_400_000 }
		]);
		doc('cash_out', 'BKK', D(day - 4), { kasbankId: 'kb-01', kind: 'Umum', to: 'Toko ATK' }, [{ coaId: C('6-1500'), desc: 'ATK & perlengkapan', amount: ri(8, 20) * 100_000 }]);
		doc('cash_in', 'BKM', D(day - 5), { kasbankId: 'kb-03', kind: 'Umum', from: 'Bank BCA' }, [{ coaId: C('4-2000'), desc: 'Jasa giro', amount: ri(4, 9) * 100_000 }]);
		doc('cash_out', 'BKK', D(day - 6), { kasbankId: 'kb-01', kind: 'Umum', to: 'Ekspedisi' }, [{ coaId: C('6-1300'), desc: 'Ongkir kirim toko', amount: ri(25, 45) * 100_000 }]);
	}

	// Stok opname (draft) di Toko Dago
	doc('store_opname', 'SOP', D(1), { storeId: 'store-T01', counter: 'Rina Marlina' }, [], { status: 'draft', priced: false });

	// Nota debit/kredit
	doc('ar_debit_notes', 'NDA', D(20), { customerId: 'cus-CUS-0006', refNo: tables.ar_invoices?.[0]?.no }, [{ desc: 'Biaya kirim ditagihkan', amount: 750_000 }]);
	doc('ar_credit_notes', 'NKA', D(15), { customerId: 'cus-CUS-0007', refNo: tables.ar_invoices?.[1]?.no }, [{ desc: 'Potongan barang cacat', amount: 1_250_000 }]);
	doc('ap_debit_notes', 'NDH', D(26), { supplierId: 'sup-SUP-004', refNo: tables.inv_receipt?.[0]?.no }, [{ desc: 'Klaim kekurangan barang', amount: 900_000 }]);
	doc('ap_credit_notes', 'NKH', D(9), { supplierId: 'sup-SUP-005', refNo: tables.inv_receipt?.[1]?.no }, [{ desc: 'Biaya handling ditagihkan supplier', amount: 450_000 }]);

	// Jurnal umum
	doc('journals', 'JU', D(75), { memo: 'Setoran modal tambahan' }, [
		{ coaId: C('1-1200'), desc: 'Setoran ke BCA', debit: 250_000_000, credit: 0 },
		{ coaId: C('3-1000'), desc: 'Modal disetor', debit: 0, credit: 250_000_000 }
	]);
	for (const day of [47, 17])
		doc('journals', 'JU', D(day), { memo: 'Pembayaran gaji karyawan' }, [
			{ coaId: C('6-1000'), desc: 'Gaji & tunjangan', debit: 98_500_000, credit: 0 },
			{ coaId: C('1-1210'), desc: 'Transfer payroll', debit: 0, credit: 98_500_000 }
		]);
	doc('journal_adjustments', 'JP', D(19), { memo: 'Penyusutan peralatan bulanan' }, [
		{ coaId: C('6-1600'), desc: 'Beban penyusutan', debit: 3_750_000, credit: 0 },
		{ coaId: C('1-2190'), desc: 'Akumulasi penyusutan', debit: 0, credit: 3_750_000 }
	]);

	// Absensi 10 hari kerja terakhir
	let wd = 0;
	for (let day = 0; wd < 10 && day < 20; day++) {
		const date = D(day);
		const dow = new Date(date + 'T00:00:00').getDay();
		if (dow === 0) continue;
		wd++;
		for (const site of sites) {
			const emps = employees.filter((e) => e.siteId === site.id);
			if (!emps.length) continue;
			const lines = emps.map((e) => {
				const r = rnd();
				const status = r < 0.82 ? 'Hadir' : r < 0.9 ? 'Terlambat' : r < 0.94 ? 'Sakit' : r < 0.97 ? 'Izin' : r < 0.99 ? 'Cuti' : 'Alpa';
				const hadir = status === 'Hadir' || status === 'Terlambat';
				const m = status === 'Terlambat' ? ri(10, 45) : ri(0, 14);
				return {
					employeeId: e.id,
					in: hadir ? (status === 'Terlambat' ? `08:${String(m).padStart(2, '0')}` : `07:${45 + m}`) : '',
					out: hadir ? `17:${String(ri(0, 40)).padStart(2, '0')}` : '',
					status
				};
			});
			doc('attendance', 'ABS', date, { siteId: site.id }, lines, { priced: false, status: day === 0 ? 'draft' : 'posted' });
		}
	}

	// Perizinan
	const lv: [number, number, string, string, number, string][] = [
		[25, 3, 'Cuti Tahunan', 'Acara keluarga', 2, 'posted'],
		[12, 9, 'Sakit', 'Demam, surat dokter terlampir', 1, 'posted'],
		[6, 5, 'Izin', 'Mengurus dokumen', 0, 'void'],
		[2, 12, 'Dinas Luar', 'Visit supplier Solo', 2, 'draft'],
		[1, 10, 'Cuti Tahunan', 'Liburan', 3, 'draft']
	];
	for (const [day, emp, type, reason, len, status] of lv)
		doc('leaves', 'IZN', D(day), { employeeId: 'emp-' + emp, type, reason, from: D(day - 1), to: D(day - 1 - len) }, [], { priced: false, status });

	// Closing stok: dua bulan lalu
	const d2 = new Date();
	d2.setDate(1);
	d2.setMonth(d2.getMonth() - 2);
	const period = iso(d2).slice(0, 7);
	const closings = ['MAT', 'INV', 'TOKO'].map((scope) => ({ id: 'cls-' + scope, scope, period, closedAt: now, closedBy: 'admin' }));

	return {
		sites,
		stores,
		suppliers,
		expeditions,
		raw_materials,
		products,
		customers,
		banks,
		coa,
		cashbanks,
		employees,
		umr,
		allowances,
		closings,
		...tables
	} as Record<string, Row[]>;
}
