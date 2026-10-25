/**
 * Variabel lingkungan (dibaca dari .env saat dev, atau environment server saat produksi).
 * Semua private (hanya server) & dibaca saat aplikasi berjalan. Lihat .env.example.
 */
import { defineEnvVars } from '@sveltejs/kit/env';

/** opsional: aplikasi tetap bisa jalan tanpa database (mode prototipe) */
const optional = (description: string) => ({ description, schema: (v: string | undefined) => (v === '' ? undefined : v) });

export const variables = defineEnvVars({
	DB_SERVER: optional('Host / IP SQL Server'),
	DB_INSTANCE: optional('Named instance, mis. SQLEXPRESS (port diabaikan)'),
	DB_PORT: optional('Port SQL Server (default 1433)'),
	DB_NAME: optional('Nama database, mis. SENJA_DEMO'),
	DB_USER: optional('Login SQL Server'),
	DB_PASSWORD: optional('Password login SQL Server'),
	DB_DOMAIN: optional('Domain untuk login Windows (autentikasi NTLM)'),
	DB_ENCRYPT: optional('true bila koneksi wajib terenkripsi'),
	DB_TRUST_CERT: optional('true untuk menerima sertifikat self-signed'),
	DASHBOARD_SENJA_DB: optional('Database sumber Dashboard Senja (bawaan: DB_NAME)'),
	DASHBOARD_JP_DB: optional('Database sumber Dashboard JP (bawaan: JP)')
});
