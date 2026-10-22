// Membuat ikon PWA & favicon ruangSenja tanpa dependensi: node scripts/gen-icons.mjs
// Motif: lingkaran taupe dengan 8 kelopak bergaris (dari ikon bunga pada logo).
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const TAUPE = [138, 124, 108];
const PAPER = [242, 241, 239];

/* ---------- geometri kelopak (koordinat mark: pusat 0,0, radius lingkaran 14) ---------- */
const R0 = 1.2, R1 = 11.2, T = 4.6, SW = 0.95;
const L = R1 - R0;
const LR = (L * L) / 4 / T + T / 4; // radius busur lensa
const OFF = LR - T / 2; // jarak pusat busur dari sumbu kelopak
const ANGLES = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

function onPetal(x, y) {
	for (const a of ANGLES) {
		// putar ke kerangka kelopak: sumbu kelopak = sumbu-u (radial)
		const u = x * Math.cos(a) + y * Math.sin(a) - (R0 + L / 2);
		const v = -x * Math.sin(a) + y * Math.cos(a);
		const d1 = Math.hypot(u, v - OFF) - LR;
		const d2 = Math.hypot(u, v + OFF) - LR;
		if (Math.abs(Math.max(d1, d2)) < SW / 2) return true;
	}
	return false;
}

/** warna piksel pada koordinat mark, atau null (transparan/latar) */
function mark(x, y) {
	if (Math.hypot(x, y) > 14) return null;
	return onPetal(x, y) ? PAPER : TAUPE;
}

/* ---------- PNG ---------- */
const crcTable = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
const crc = (b) => {
	let c = 0xffffffff;
	for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};
const chunk = (t, d) => {
	const l = Buffer.alloc(4);
	l.writeUInt32BE(d.length);
	const td = Buffer.concat([Buffer.from(t), d]);
	const c = Buffer.alloc(4);
	c.writeUInt32BE(crc(td));
	return Buffer.concat([l, td, c]);
};
function png(size, px) {
	const raw = Buffer.alloc((size * 4 + 1) * size);
	for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
	const ih = Buffer.alloc(13);
	ih.writeUInt32BE(size, 0);
	ih.writeUInt32BE(size, 4);
	ih[8] = 8;
	ih[9] = 6;
	return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** ratio = radius lingkaran terhadap sisi ikon; bg = latar kertas atau transparan */
function render(size, ratio, bg) {
	const px = Buffer.alloc(size * size * 4);
	const N = 4;
	const k = 14 / (ratio * size); // piksel → koordinat mark
	for (let y = 0; y < size; y++)
		for (let x = 0; x < size; x++) {
			let r = 0, g = 0, b = 0, a = 0;
			for (let sy = 0; sy < N; sy++)
				for (let sx = 0; sx < N; sx++) {
					const c = mark((x + (sx + 0.5) / N - size / 2) * k, (y + (sy + 0.5) / N - size / 2) * k) ?? bg;
					if (c) ((r += c[0]), (g += c[1]), (b += c[2]), a++);
				}
			const i = (y * size + x) * 4;
			if (a) ((px[i] = r / a), (px[i + 1] = g / a), (px[i + 2] = b / a));
			px[i + 3] = Math.round((a / (N * N)) * 255);
		}
	return png(size, px);
}

writeFileSync('static/icon-192.png', render(192, 0.4, PAPER));
writeFileSync('static/icon-512.png', render(512, 0.4, PAPER));
writeFileSync('static/icon-maskable-512.png', render(512, 0.3, PAPER));
writeFileSync('static/apple-touch-icon.png', render(180, 0.4, PAPER));

/* ---------- SVG (favicon & komponen) — geometri yang sama ---------- */
const f = (n) => +n.toFixed(3);
const petal = (a) => {
	const deg = (a * 180) / Math.PI;
	return `<path transform="rotate(${deg})" d="M${f(R0)} 0A${f(LR)} ${f(LR)} 0 0 1 ${f(R1)} 0A${f(LR)} ${f(LR)} 0 0 1 ${f(R0)} 0Z"/>`;
};
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 32 32"><circle r="14" fill="#8a7c6c"/><g fill="none" stroke="#f2f1ef" stroke-width="${SW}">${ANGLES.map(petal).join('')}</g></svg>\n`;
writeFileSync('static/icon.svg', svg);
console.log('icons generated');
