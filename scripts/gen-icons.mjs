// Membuat logo & ikon aplikasi Senja tanpa dependensi: node scripts/gen-icons.mjs
// Sumber (brand/): i_exe.ico = ikon aplikasi lama (huruf S di kotak oranye), SENJA_2.bmp = splash screen lama (tulisan "Senja").
//  - static/logo-light.png / logo-dark.png : tulisan "Senja" transparan (hitam untuk latar terang, putih untuk latar gelap)
//  - static/icon-192|512.png, icon-maskable-512.png, apple-touch-icon.png, favicon.png, icon.svg : dari ikon aplikasi
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

/* ---------- PNG ---------- */
const crcTable = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
const crc32 = (buf) => {
	let c = 0xffffffff;
	for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const td = Buffer.concat([Buffer.from(type), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(td));
	return Buffer.concat([len, td, crc]);
}
function png({ w, h, rgba }) {
	const raw = Buffer.alloc((w * 4 + 1) * h);
	for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
	const ih = Buffer.alloc(13);
	ih.writeUInt32BE(w, 0);
	ih.writeUInt32BE(h, 4);
	ih[8] = 8;
	ih[9] = 6;
	return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- decoder BMP 32-bit & ICO (DIB 1/4/8/24/32-bit) ---------- */
function readBmp(file) {
	const b = readFileSync(file);
	const off = b.readUInt32LE(10);
	const w = b.readInt32LE(18);
	const hh = b.readInt32LE(22);
	const bpp = b.readUInt16LE(28);
	const h = Math.abs(hh);
	const rs = Math.floor((w * bpp + 31) / 32) * 4;
	const rgba = Buffer.alloc(w * h * 4);
	for (let y = 0; y < h; y++) {
		const sy = hh < 0 ? y : h - 1 - y;
		for (let x = 0; x < w; x++) {
			const o = off + sy * rs + (x * bpp) / 8;
			rgba.set([b[o + 2], b[o + 1], b[o], 255], (y * w + x) * 4);
		}
	}
	return { w, h, rgba };
}
function readIco(file) {
	const b = readFileSync(file);
	const off = b.readUInt32LE(18); // gambar pertama
	const hs = b.readUInt32LE(off);
	const w = b.readInt32LE(off + 4);
	const h = b.readInt32LE(off + 8) / 2;
	const bpp = b.readUInt16LE(off + 14);
	const colors = b.readUInt32LE(off + 32) || (bpp <= 8 ? 1 << bpp : 0);
	const pal = Array.from({ length: colors }, (_, i) => [b[off + hs + i * 4 + 2], b[off + hs + i * 4 + 1], b[off + hs + i * 4]]);
	const pix = off + hs + colors * 4;
	const rs = Math.floor((w * bpp + 31) / 32) * 4;
	const maskOff = pix + rs * h;
	const ms = Math.floor((w + 31) / 32) * 4;
	const rgba = Buffer.alloc(w * h * 4);
	for (let y = 0; y < h; y++) {
		const sy = h - 1 - y;
		for (let x = 0; x < w; x++) {
			let c;
			let a = 255;
			if (bpp === 32) {
				const o = pix + sy * rs + x * 4;
				c = [b[o + 2], b[o + 1], b[o]];
				a = b[o + 3];
			} else if (bpp === 24) {
				const o = pix + sy * rs + x * 3;
				c = [b[o + 2], b[o + 1], b[o]];
			} else if (bpp === 8) c = pal[b[pix + sy * rs + x]];
			else if (bpp === 4) {
				const v = b[pix + sy * rs + (x >> 1)];
				c = pal[x & 1 ? v & 15 : v >> 4];
			} else c = pal[(b[pix + sy * rs + (x >> 3)] >> (7 - (x & 7))) & 1];
			if (bpp !== 32 && (b[maskOff + sy * ms + (x >> 3)] >> (7 - (x & 7))) & 1) a = 0;
			rgba.set([...c, a], (y * w + x) * 4);
		}
	}
	return { w, h, rgba };
}

/* ---------- ubah ukuran persegi: rata-rata area saat mengecil, bilinear saat membesar (ikon sumber ber-dither) ---------- */
function blur3(img) {
	const { w, h, rgba } = img;
	const out = Buffer.alloc(rgba.length);
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const s = [0, 0, 0, 0];
			let n = 0;
			for (let dy = -1; dy <= 1; dy++)
				for (let dx = -1; dx <= 1; dx++) {
					const xx = Math.min(w - 1, Math.max(0, x + dx));
					const yy = Math.min(h - 1, Math.max(0, y + dy));
					for (let c = 0; c < 4; c++) s[c] += rgba[(yy * w + xx) * 4 + c];
					n++;
				}
			for (let c = 0; c < 4; c++) out[(y * w + x) * 4 + c] = Math.round(s[c] / n);
		}
	return { w, h, rgba: out };
}
function resize(img, size) {
	const { w, h, rgba } = img;
	const out = Buffer.alloc(size * size * 4);
	const sx = w / size;
	const sy = h / size;
	for (let y = 0; y < size; y++)
		for (let x = 0; x < size; x++) {
			const s = [0, 0, 0, 0];
			if (sx > 1) {
				const x0 = x * sx, x1 = (x + 1) * sx, y0 = y * sy, y1 = (y + 1) * sy;
				let wt = 0;
				for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++)
					for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
						const f = (Math.min(x1, xx + 1) - Math.max(x0, xx)) * (Math.min(y1, yy + 1) - Math.max(y0, yy));
						for (let c = 0; c < 4; c++) s[c] += rgba[(Math.min(h - 1, yy) * w + Math.min(w - 1, xx)) * 4 + c] * f;
						wt += f;
					}
				for (let c = 0; c < 4; c++) out[(y * size + x) * 4 + c] = Math.round(s[c] / wt);
			} else {
				const fx = Math.max(0, (x + 0.5) * sx - 0.5), fy = Math.max(0, (y + 0.5) * sy - 0.5);
				const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
				const tx = fx - x0, ty = fy - y0;
				for (let c = 0; c < 4; c++) {
					const v = (rgba[(y0 * w + x0) * 4 + c] * (1 - tx) + rgba[(y0 * w + x1) * 4 + c] * tx) * (1 - ty) + (rgba[(y1 * w + x0) * 4 + c] * (1 - tx) + rgba[(y1 * w + x1) * 4 + c] * tx) * ty;
					out[(y * size + x) * 4 + c] = Math.round(v);
				}
			}
		}
	return { w: size, h: size, rgba: out };
}

/* ---------- ikon aplikasi ---------- */
const icon = blur3(readIco('brand/i_exe.ico'));
const at = (size) => png(resize(icon, size));
writeFileSync('static/icon-192.png', at(192));
writeFileSync('static/icon-512.png', at(512));
writeFileSync('static/icon-maskable-512.png', at(512)); // gambar penuh sampai tepi; huruf S ada di zona aman tengah
writeFileSync('static/apple-touch-icon.png', at(180));
writeFileSync('static/favicon.png', at(64));
// icon.svg: sudut membulat, gambar disematkan (dipakai komponen Logo saat sidebar dilipat)
const svg128 = at(128).toString('base64');
writeFileSync(
	'static/icon.svg',
	`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><clipPath id="c"><rect width="32" height="32" rx="7"/></clipPath><image clip-path="url(#c)" width="32" height="32" xlink:href="data:image/png;base64,${svg128}"/></svg>\n`
);

/* ---------- logo tulisan "Senja" dari splash screen ---------- */
const splash = readBmp('brand/SENJA_2.bmp');
const [X0, X1, Y0, Y1] = [82, 298, 48, 128]; // kotak tulisan "Senja" (tanpa peta latar & teks hak cipta)
const lw = X1 - X0 + 1;
const lh = Y1 - Y0 + 1;
function wordmark(rgb) {
	const rgba = Buffer.alloc(lw * lh * 4);
	for (let y = 0; y < lh; y++)
		for (let x = 0; x < lw; x++) {
			const i = ((y + Y0) * splash.w + x + X0) * 4;
			const lum = (splash.rgba[i] + splash.rgba[i + 1] + splash.rgba[i + 2]) / 3;
			// latar gelap & garis peta (< ~85) hilang; tulisan putih menjadi opak
			rgba.set([...rgb, Math.round(Math.max(0, Math.min(1, (lum - 85) / 170)) * 255)], (y * lw + x) * 4);
		}
	return png({ w: lw, h: lh, rgba });
}
writeFileSync('static/logo-light.png', wordmark([28, 25, 23]));
writeFileSync('static/logo-dark.png', wordmark([255, 255, 255]));
console.log('logo & ikon dibuat');
