/**
 * Hash & verifikasi password memakai scrypt (bawaan Node.js) — parameter OWASP: N=2^17, r=8, p=1.
 * Format tersimpan: scrypt$N$r$p$salt$hash (base64url). Modul JS biasa agar bisa dipakai script Node.
 */
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

const N = 2 ** 17;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 256 * 1024 * 1024;

/** @param {string} password @param {Buffer} salt @param {number} n @param {number} r @param {number} p @param {number} keylen */
const derive = (password, salt, n, r, p, keylen) =>
	/** @type {Promise<Buffer>} */ (
		new Promise((resolve, reject) =>
			scrypt(password.normalize('NFKC'), salt, keylen, { N: n, r, p, maxmem: MAXMEM }, (err, key) => (err ? reject(err) : resolve(key)))
		)
	);

/** @param {string} password */
export async function hashPassword(password) {
	const salt = randomBytes(16);
	const key = await derive(password, salt, N, R, P, KEYLEN);
	return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

/** @param {string} password @param {string | null | undefined} stored */
export async function verifyPassword(password, stored) {
	const parts = String(stored ?? '').split('$');
	if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
	const [, n, r, p, salt, hash] = parts;
	const expected = Buffer.from(hash, 'base64url');
	try {
		const key = await derive(password, Buffer.from(salt, 'base64url'), Number(n), Number(r), Number(p), expected.length);
		return timingSafeEqual(key, expected);
	} catch {
		return false;
	}
}

let dummy = /** @type {Promise<string> | null} */ (null);
/** Samakan waktu respons saat username tidak ada (mencegah menebak username dari lamanya proses) */
export async function verifyDummy(/** @type {string} */ password) {
	dummy ??= hashPassword('dummy-password-untuk-penyamaan-waktu');
	await verifyPassword(password, await dummy);
	return false;
}

const COMMON = new Set(['password', 'password1', '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop', 'admin123', 'senja123', 'iloveyou', '11111111', '00000000', 'abc12345', 'p@ssw0rd', 'passw0rd', 'bismillah']);

/** Pesan bila password tidak memenuhi syarat, atau null bila boleh dipakai */
export function passwordProblem(/** @type {string} */ password, /** @type {string} */ username = '') {
	if (typeof password !== 'string' || password.length < 8) return 'Password minimal 8 karakter';
	if (password.length > 128) return 'Password maksimal 128 karakter';
	const lower = password.toLowerCase();
	if (username && lower.includes(username.toLowerCase())) return 'Password tidak boleh memuat username';
	if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return 'Password terlalu mudah ditebak';
	return null;
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Password sementara acak (tanpa huruf/angka yang mirip seperti l/1/O/0) */
/** @returns {string} */
export function generatePassword(length = 12) {
	let s = '';
	for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
	return /\d/.test(s) && /[a-z]/.test(s) && /[A-Z]/.test(s) ? s : generatePassword(length);
}
