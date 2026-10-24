/** Pemanggil API JSON aplikasi: error server → ApiError dengan pesan yang bisa ditampilkan. */
export class ApiError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
	}
}

let onUnauthorized: (() => void) | null = null;
/** dipanggil saat server menjawab 401 (sesi berakhir di tengah pemakaian) */
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
	let res: Response;
	try {
		res = await fetch(url, {
			method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
			headers: opts.body === undefined ? undefined : { 'content-type': 'application/json' },
			body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
		});
	} catch {
		throw new ApiError('Server tidak dapat dihubungi. Periksa koneksi.', 0);
	}
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		if (res.status === 401 && url !== '/api/auth/login') onUnauthorized?.();
		throw new ApiError(data?.error ?? `Permintaan gagal (${res.status})`, res.status);
	}
	return data as T;
}
