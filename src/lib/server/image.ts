/** jenis gambar dari isi file (bukan dari header/nama file yang bisa dipalsukan) */
export function imageType(b: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
	if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
	if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
	if (b.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
	return null;
}
