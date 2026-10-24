/**
 * Salin teks ke clipboard. navigator.clipboard hanya ada di koneksi aman (HTTPS / localhost) —
 * dibuka lewat http://IP-LAN (HP saat dev, atau server tanpa HTTPS) API itu tidak ada, jadi pakai
 * cara lama: textarea tersembunyi + execCommand('copy') (masih didukung semua browser).
 * Panggil langsung dari handler klik (butuh aktivasi pengguna). Hasil: true bila berhasil.
 */
export async function copyText(text: string): Promise<boolean> {
	if (window.isSecureContext && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// ditolak (izin / dokumen tidak fokus) → coba cara lama
		}
	}
	return legacyCopy(text);
}

function legacyCopy(text: string) {
	const prev = document.activeElement as HTMLElement | null;
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.setAttribute('readonly', '');
	// 16px: iOS tidak zoom saat fokus; di luar layar tapi tetap bisa diseleksi
	ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px';
	document.body.append(ta);
	ta.focus({ preventScroll: true });
	ta.select();
	ta.setSelectionRange(0, text.length); // iOS
	let ok = false;
	try {
		ok = document.execCommand('copy');
	} catch {
		ok = false;
	}
	ta.remove();
	prev?.focus?.({ preventScroll: true });
	return ok;
}
