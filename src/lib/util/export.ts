/**
 * Export tabel ke Excel (.xlsx asli), CSV, atau PDF — semua dibuat di browser.
 * - Excel: angka & tanggal tetap bernilai (bisa dijumlah/di-filter), header di-freeze + AutoFilter, lebar kolom otomatis
 * - CSV: pemisah titik koma + BOM (langsung rapi saat dibuka Excel berbahasa Indonesia)
 * - PDF: A4 (landscape bila kolom banyak), header berulang tiap halaman, nomor halaman
 * Library (fflate, jsPDF) baru dimuat saat dipakai.
 */
import { auth } from '../state/auth.svelte';
import { date as fdate } from './format';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ColType = 'text' | 'number' | 'date';
export interface ExportColumn {
	label: string;
	type?: ColType;
}
export interface ExportTable {
	/** judul di dalam file */
	title: string;
	/** periode / filter, tampil di bawah judul */
	subtitle?: string;
	/** nama file tanpa ekstensi (bawaan: judul) */
	filename?: string;
	columns: (ExportColumn | string)[];
	rows: unknown[][];
	/** baris total (opsional) */
	totals?: unknown[];
}

export const EXPORT_FORMATS: { id: ExportFormat; label: string; ext: string }[] = [
	{ id: 'xlsx', label: 'Excel', ext: '.xlsx' },
	{ id: 'csv', label: 'CSV', ext: '.csv' },
	{ id: 'pdf', label: 'PDF', ext: '.pdf' }
];

/** bentuk ringkas untuk pemanggil lama: nama file, header, baris */
export const tableOf = (filename: string, columns: string[], rows: unknown[][]): ExportTable => ({ title: filename, filename, columns, rows });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const empty = (v: unknown) => v === null || v === undefined || v === '';

/** tipe kolom dari isinya bila tidak disebut: semua angka → number, semua yyyy-mm-dd → date */
function resolveColumns(t: ExportTable) {
	return t.columns.map((c, i) => {
		const col = typeof c === 'string' ? { label: c } : c;
		if (col.type) return col as Required<ExportColumn>;
		const vals = t.rows.map((r) => r[i]).filter((v) => !empty(v));
		const type: ColType = !vals.length
			? 'text'
			: vals.every((v) => typeof v === 'number' && Number.isFinite(v))
				? 'number'
				: vals.every((v) => typeof v === 'string' && ISO_DATE.test(v))
					? 'date'
					: 'text';
		return { label: col.label, type };
	});
}

const nf0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const stamp = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** teks tampilan (PDF & lebar kolom Excel) */
function show(v: unknown, type: ColType) {
	if (empty(v)) return '';
	if (type === 'number' && typeof v === 'number') return (Number.isInteger(v) ? nf0 : nf2).format(v);
	if (type === 'date' && typeof v === 'string') return fdate(v);
	return String(v);
}

const meta = () => `Diekspor ${stamp.format(new Date())}${auth.user ? ` oleh ${auth.user.name}` : ''} · Senja ERP`;
const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) || 'data';

function save(blob: Blob, filename: string) {
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function exportTable(format: ExportFormat, t: ExportTable) {
	const cols = resolveColumns(t);
	const name = safeName(t.filename ?? t.title);
	if (format === 'csv') return save(csv(t, cols), name + '.csv');
	if (format === 'xlsx') return save(await xlsx(t, cols), name + '.xlsx');
	return save(await pdf(t, cols), name + '.pdf');
}

/* ================= CSV ================= */
function csv(t: ExportTable, cols: Required<ExportColumn>[]) {
	const cell = (v: unknown, type?: ColType) => {
		if (empty(v)) return '';
		// desimal pakai koma, sesuai pemisah ; (format regional Indonesia)
		const s = type === 'number' && typeof v === 'number' ? String(v).replace('.', ',') : String(v);
		return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const lines = [cols.map((c) => cell(c.label)), ...t.rows.map((r) => cols.map((c, i) => cell(r[i], c.type)))];
	if (t.totals) lines.push(cols.map((c, i) => cell(t.totals![i], c.type)));
	return new Blob(['﻿' + lines.map((l) => l.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}

/* ================= Excel (.xlsx) ================= */
const xml = (s: string) =>
	s
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
const colName = (i: number): string => (i >= 26 ? colName(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));
const serial = (iso: string) => {
	const [y, m, d] = iso.split('-').map(Number);
	return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000;
};

// indeks gaya di styles.xml (cellXfs)
const S = { title: 1, sub: 2, head: 3, text: 4, int: 5, dec: 6, date: 7, totText: 8, totInt: 9, totDec: 10, headNum: 11 };
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="dd mmm yyyy"/></numFmts>
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="14"/><color rgb="FF1C1917"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="10"/><color rgb="FF78716C"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF1C1917"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEDEAE6"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFA8A29E"/></bottom><diagonal/></border>
<border><left/><right/><top style="thin"><color rgb="FF57534E"/></top><bottom style="double"><color rgb="FF57534E"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1"/>
<xf numFmtId="3" fontId="3" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="164" fontId="3" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

async function xlsx(t: ExportTable, cols: Required<ExportColumn>[]) {
	const { zipSync, strToU8 } = await import('fflate');
	const sheetName = xml(safeName(t.title).replace(/[[\]]/g, '').slice(0, 31));
	const last = colName(Math.max(cols.length - 1, 0));

	const str = (ref: string, v: string, s: number) => `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
	const num = (ref: string, v: number, s: number) => `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
	function cell(ref: string, v: unknown, type: ColType, total = false) {
		if (empty(v)) return total ? `<c r="${ref}" s="${S.totText}"/>` : '';
		if (type === 'number' && typeof v === 'number' && Number.isFinite(v)) return num(ref, v, Number.isInteger(v) ? (total ? S.totInt : S.int) : total ? S.totDec : S.dec);
		if (type === 'date' && typeof v === 'string' && ISO_DATE.test(v)) return num(ref, serial(v), S.date);
		return str(ref, String(v), total ? S.totText : S.text);
	}

	const out: string[] = [];
	let r = 1;
	out.push(`<row r="${r}" ht="22" customHeight="1">${str('A' + r, t.title, S.title)}</row>`);
	r++;
	if (t.subtitle) out.push(`<row r="${r}">${str('A' + r, t.subtitle, S.sub)}</row>`), r++;
	out.push(`<row r="${r}">${str('A' + r, meta(), S.sub)}</row>`);
	r += 2;
	const headRow = r;
	out.push(`<row r="${r}" ht="20" customHeight="1">${cols.map((c, i) => str(colName(i) + r, c.label, c.type === 'number' ? S.headNum : S.head)).join('')}</row>`);
	for (const row of t.rows) {
		r++;
		out.push(`<row r="${r}">${cols.map((c, i) => cell(colName(i) + r, row[i], c.type)).join('')}</row>`);
	}
	const lastData = r;
	if (t.totals) {
		r++;
		out.push(`<row r="${r}">${cols.map((c, i) => cell(colName(i) + r, t.totals![i], c.type, true)).join('')}</row>`);
	}

	// lebar kolom dari teks terpanjang (dibatasi agar tetap rapi)
	const widths = cols.map((c, i) => {
		let w = c.label.length + 2;
		for (const row of t.rows) w = Math.max(w, show(row[i], c.type).length + 1);
		return Math.min(Math.max(w, 6), 60) + 1;
	});
	const filterRef = `A${headRow}:${last}${Math.max(lastData, headRow)}`;
	const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" showGridLines="1"><pane ySplit="${headRow}" topLeftCell="A${headRow + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${headRow + 1}" sqref="A${headRow + 1}"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${out.join('')}</sheetData>
<autoFilter ref="${filterRef}"/>
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="${cols.length > 6 ? 'landscape' : 'portrait'}" fitToHeight="0"/>
</worksheet>`;

	const files: Record<string, string> = {
		'[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
		'_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
		'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(t.title)}</dc:title><dc:creator>${xml(auth.user?.name ?? 'Senja ERP')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`,
		'docProps/app.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Senja ERP</Application></Properties>`,
		'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sheetName.replace(/'/g, "''")}'!$A$${headRow}:$${last}$${Math.max(lastData, headRow)}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'${sheetName.replace(/'/g, "''")}'!$${headRow}:$${headRow}</definedName></definedNames></workbook>`,
		'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
		'xl/styles.xml': STYLES,
		'xl/worksheets/sheet1.xml': sheet
	};
	const zip = zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])), { level: 6 });
	return new Blob([zip as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/* ================= PDF ================= */
/** font standar PDF hanya mengenal Latin-1 → ganti tanda baca Unicode umum, buang sisanya */
const pdfText = (s: string) =>
	s
		.replace(/[–—−]/g, '-')
		.replace(/[‘’]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/…/g, '...')
		.replace(/›|→/g, '>')
		.replace(/‹|←/g, '<')
		.replace(/[^\u0000-ÿ]/g, '');

async function pdf(t: ExportTable, cols: Required<ExportColumn>[]) {
	const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
	const landscape = cols.length > 6;
	const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4', compress: true });
	const W = doc.internal.pageSize.getWidth();
	const H = doc.internal.pageSize.getHeight();
	const M = 36;
	doc.setProperties({ title: pdfText(t.title), creator: 'Senja ERP', author: pdfText(auth.user?.name ?? '') });

	// kepala halaman pertama
	doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(28, 25, 23);
	doc.text(pdfText(t.title), M, M + 10);
	let y = M + 26;
	doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120, 113, 108);
	if (t.subtitle) doc.text(pdfText(t.subtitle), M, y), (y += 13);
	doc.text(pdfText(meta()), M, y);
	doc.setDrawColor(138, 124, 108).setLineWidth(1.2).line(M, y + 9, W - M, y + 9);

	const num = cols.map((c) => c.type === 'number');
	const fmt = (row: unknown[]) => cols.map((c, i) => pdfText(show(row[i], c.type)));
	autoTable(doc, {
		startY: y + 18,
		margin: { top: M + 18, left: M, right: M, bottom: M + 8 },
		head: [cols.map((c) => pdfText(c.label))],
		body: t.rows.map(fmt),
		foot: t.totals ? [fmt(t.totals)] : undefined,
		showFoot: 'lastPage',
		theme: 'plain',
		styles: { font: 'helvetica', fontSize: landscape ? 8 : 8.5, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 }, textColor: [41, 37, 36], lineColor: [231, 229, 228], overflow: 'linebreak' },
		headStyles: { fillColor: [138, 124, 108], textColor: 255, fontStyle: 'bold' },
		bodyStyles: { lineWidth: { bottom: 0.5 } },
		alternateRowStyles: { fillColor: [250, 250, 249] },
		footStyles: { fillColor: [237, 234, 230], textColor: [28, 25, 23], fontStyle: 'bold' },
		columnStyles: Object.fromEntries(num.map((n, i) => [i, n ? { halign: 'right' } : {}]).filter(([, s]) => Object.keys(s as object).length)),
		didParseCell: (d) => {
			if ((d.section === 'head' || d.section === 'foot') && num[d.column.index]) d.cell.styles.halign = 'right';
		},
		didDrawPage: (d) => {
			// judul ringkas di halaman berikutnya
			if (d.pageNumber > 1) {
				doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(120, 113, 108);
				doc.text(pdfText(t.title), M, M + 4);
			}
		}
	});

	// kaki halaman: nomor halaman dihitung setelah semua halaman jadi
	const pages = doc.getNumberOfPages();
	for (let i = 1; i <= pages; i++) {
		doc.setPage(i);
		doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(168, 162, 158);
		doc.text('Senja ERP', M, H - M / 2);
		doc.text(`Halaman ${i} dari ${pages}`, W - M, H - M / 2, { align: 'right' });
	}
	return doc.output('blob');
}
