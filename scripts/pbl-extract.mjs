/**
 * Ekstrak source teks dari library PowerBuilder (.pbl, format Unicode PB 10+) agar bisa dibaca.
 *
 *   node scripts/pbl-extract.mjs [folder-pbl] [folder-keluaran]
 *   default: legacy/powerbuilder → legacy/src/<nama-pbl>/<objek>.sr?
 *
 * Hanya entri source (.srw window, .srd datawindow, .sru user object, .srf function, .srm menu,
 * .sra application, .srs structure) yang ditulis; hasil kompilasi diabaikan. Folder legacy/ tidak ikut git.
 */
import fs from 'node:fs';
import path from 'node:path';

const [src = 'legacy/powerbuilder', out = 'legacy/src'] = process.argv.slice(2);
const SOURCE = /\.sr[wdufmas]$/i;

function entries(buf) {
	const list = [];
	for (let i = buf.indexOf('ENT*'); i >= 0; i = buf.indexOf('ENT*', i + 4)) {
		// ENT* | versi (UTF-16, 8) | blok data pertama (4) | ukuran (4) | waktu (4) | panjang komentar (2) | panjang nama (2) | nama
		const first = buf.readUInt32LE(i + 12);
		const size = buf.readUInt32LE(i + 16);
		const time = buf.readUInt32LE(i + 20);
		const nameLen = buf.readUInt16LE(i + 26);
		const name = buf.toString('utf16le', i + 28, i + 28 + nameLen).replace(/\0+$/, '');
		if (name && first < buf.length) list.push({ name, first, size, time });
	}
	return list;
}

function read(buf, first, size) {
	const parts = [];
	let total = 0;
	// rantai blok DAT*: DAT* | blok berikutnya (4) | panjang data (2) | data (≤ 502)
	for (let off = first, guard = 0; off && total < size && guard < 1e6; guard++) {
		if (buf.toString('latin1', off, off + 4) !== 'DAT*') break;
		const next = buf.readUInt32LE(off + 4);
		const len = buf.readUInt16LE(off + 8);
		parts.push(buf.subarray(off + 10, off + 10 + len));
		total += len;
		off = next;
	}
	return Buffer.concat(parts).subarray(0, size);
}

let count = 0;
for (const file of fs.readdirSync(src).filter((f) => f.toLowerCase().endsWith('.pbl'))) {
	const buf = fs.readFileSync(path.join(src, file));
	const dir = path.join(out, path.basename(file, path.extname(file)));
	fs.mkdirSync(dir, { recursive: true });
	const seen = new Map();
	// entri bisa muncul lebih dari sekali (versi lama di blok bebas) → ambil yang terbaru
	for (const e of entries(buf)) if (SOURCE.test(e.name) && (seen.get(e.name)?.time ?? -1) < e.time) seen.set(e.name, e);
	for (const e of seen.values()) {
		let text = read(buf, e.first, e.size);
		// source disimpan UTF-16LE (umumnya diawali BOM)
		const s = text[0] === 0xff && text[1] === 0xfe ? text.toString('utf16le', 2) : text.toString('utf16le');
		fs.writeFileSync(path.join(dir, e.name.replace(/[<>:"/\\|?*]/g, '_')), s);
		count++;
	}
	console.log(`${file}: ${seen.size} objek`);
}
console.log(`Selesai: ${count} file source di ${out}`);
