/** Nama perangkat yang mudah dibaca dari user-agent (untuk daftar sesi aktif). */
export type DeviceKind = 'desktop' | 'phone' | 'tablet' | 'other';

export function describeDevice(ua: string | null | undefined): { browser: string; os: string; kind: DeviceKind } {
	if (!ua) return { browser: 'Browser', os: 'Perangkat tidak dikenal', kind: 'other' };
	const browser = /Edg\//.test(ua)
		? 'Edge'
		: /OPR\/|Opera/.test(ua)
			? 'Opera'
			: /SamsungBrowser/.test(ua)
				? 'Samsung Internet'
				: /Firefox\/|FxiOS/.test(ua)
					? 'Firefox'
					: /Chrome\/|CriOS/.test(ua)
						? 'Chrome'
						: /Safari\//.test(ua)
							? 'Safari'
							: /curl|node|undici|python|postman/i.test(ua)
								? 'Skrip / API'
								: 'Browser';
	const os = /Windows NT/.test(ua)
		? 'Windows'
		: /Android/.test(ua)
			? 'Android'
			: /iPhone|iPod/.test(ua)
				? 'iPhone'
				: /iPad/.test(ua)
					? 'iPad'
					: /CrOS/.test(ua)
						? 'ChromeOS'
						: /Mac OS X|Macintosh/.test(ua)
							? 'macOS'
							: /Linux/.test(ua)
								? 'Linux'
								: 'Perangkat lain';
	const kind: DeviceKind = /iPad|Tablet/.test(ua) ? 'tablet' : /Mobi|iPhone|Android/.test(ua) ? 'phone' : browser === 'Skrip / API' ? 'other' : 'desktop';
	return { browser, os, kind };
}
