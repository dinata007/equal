/**
 * Konfigurasi koneksi SQL Server dari variabel lingkungan (.env).
 * Modul JS biasa agar bisa dipakai server SvelteKit maupun script Node (scripts/db-schema.mjs).
 */

/** @param {string | undefined} v @param {boolean} d */
const bool = (v, d) => (v == null || v === '' ? d : /^(1|true|yes|ya)$/i.test(v.trim()));

/**
 * @param {Record<string, string | undefined>} env
 * @returns {import('mssql').config}
 */
export function dbConfig(env) {
	const missing = ['DB_SERVER', 'DB_NAME', 'DB_USER'].filter((k) => !env[k]);
	if (missing.length) throw new Error(`Konfigurasi database belum lengkap di .env: ${missing.join(', ')}`);
	const instance = env.DB_INSTANCE || undefined;
	return {
		server: /** @type {string} */ (env.DB_SERVER),
		port: instance ? undefined : Number(env.DB_PORT) || 1433,
		database: env.DB_NAME,
		...(env.DB_DOMAIN
			? { authentication: { type: 'ntlm', options: { domain: env.DB_DOMAIN, userName: env.DB_USER ?? '', password: env.DB_PASSWORD ?? '' } } }
			: { user: env.DB_USER, password: env.DB_PASSWORD ?? '' }),
		options: {
			instanceName: instance,
			encrypt: bool(env.DB_ENCRYPT, false),
			trustServerCertificate: bool(env.DB_TRUST_CERT, true),
			appName: 'Senja Web',
			// tanggal dari kolom datetime dibaca apa adanya (tanpa geser zona waktu)
			useUTC: false
		},
		pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
		connectionTimeout: 15_000,
		requestTimeout: 30_000
	};
}

/** Label aman untuk log/error: server, instance & database tanpa kredensial */
export const dbLabel = (/** @type {Record<string, string | undefined>} */ env) =>
	`${env.DB_SERVER ?? '?'}${env.DB_INSTANCE ? '\\' + env.DB_INSTANCE : env.DB_PORT ? ':' + env.DB_PORT : ''}/${env.DB_NAME ?? '?'}`;
