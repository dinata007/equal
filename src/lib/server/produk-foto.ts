/**
 * Foto model produk: disimpan sebagai file di folder PRODUK_FOTO_DIR (.env), satu subfolder per kode model,
 * mis. D:\Equal-data\foto-produk\A1A00005300122C\1732700000000-1a2b3c4d.webp. Satu model boleh banyak foto;
 * urutan = urutan unggah (nama file diawali waktu unggah). Tidak memakai tabel database.
 *
 * Foto bukan bagian data master lama, jadi tetap bisa ditambah/dihapus walau master produk hanya baca;
 * aksesnya mengikuti hak menu Produk & cakupan brand model (lewat get('produk', …)).
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as env from '$app/env/private';
import type { SessionUser } from '#lib/domain/types.ts';
import { audit } from './auth/audit.ts';
import { AuthError } from './auth/users.ts';
import { imageType } from './image.ts';
import { get } from './master/service.ts';

/** foto di atas 3 MB dikompres dulu di browser. Production: BODY_SIZE_LIMIT=4M di .env (diisi deploy/pasang.ps1; bawaan adapter-node 512 KB) */
export const FOTO_MAX_BYTES = 3 * 1024 * 1024;
const MAX_PER_MODEL = 30;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
const TYPE_OF: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
/** nama file buatan server: <waktu ms>-<8 hex>.<ext> — selain pola ini ditolak (tidak bisa keluar folder) */
const NAME = /^\d{13}-[0-9a-f]{8}\.(jpg|png|webp)$/;

export interface ProdukFoto {
	name: string;
	size: number;
	/** waktu unggah (ISO) */
	at: string;
}

function root() {
	const dir = env.PRODUK_FOTO_DIR?.trim();
	if (!dir) throw new AuthError('Folder foto produk belum diatur. Isi PRODUK_FOTO_DIR di file .env server.', 503);
	return path.resolve(dir);
}

/** folder foto model (model harus ada & dalam cakupan menu/brand pengguna) */
async function modelDir(user: SessionUser, modelId: string) {
	const model = (await get('produk', user, modelId)) as { model_id?: unknown };
	const id = String(model.model_id ?? '').trim();
	if (!/^[A-Za-z0-9_-]{1,30}$/.test(id)) throw new AuthError('Kode model tidak valid');
	return { id, dir: path.join(root(), id) };
}

function fileName(name: string) {
	if (!NAME.test(name)) throw new AuthError('Foto tidak ditemukan', 404);
	return name;
}

async function listDir(dir: string): Promise<ProdukFoto[]> {
	let names: string[];
	try {
		names = await readdir(dir);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw e;
	}
	const fotos = await Promise.all(
		names
			.filter((n) => NAME.test(n))
			.sort()
			.map(async (name) => {
				const s = await stat(path.join(dir, name));
				return { name, size: s.size, at: new Date(Number(name.slice(0, 13))).toISOString() };
			})
	);
	return fotos;
}

/** menu Produk (sama dengan PRODUK_MENU di master/produk.ts) */
const PRODUK_MENU = '/inventory/master/produk';

/**
 * Jumlah foto per kode model (hanya model yang punya foto) untuk kolom grid. Folder belum diatur = kosong
 * (grid tetap tampil). Hanya angka per kode model; data model sendiri tetap disaring cakupan brand.
 */
export async function countFoto(user: SessionUser): Promise<Record<string, number>> {
	if (!user.admin && !user.menus.includes(PRODUK_MENU)) throw new AuthError('Anda tidak punya akses ke menu ini', 403);
	const dir = env.PRODUK_FOTO_DIR?.trim();
	if (!dir) return {};
	let entries;
	try {
		entries = await readdir(path.resolve(dir), { withFileTypes: true });
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {};
		throw e;
	}
	const out: Record<string, number> = {};
	await Promise.all(
		entries
			.filter((d) => d.isDirectory())
			.map(async (d) => {
				const n = (await readdir(path.join(path.resolve(dir), d.name))).filter((f) => NAME.test(f)).length;
				if (n) out[d.name] = n;
			})
	);
	return out;
}

export async function listFoto(user: SessionUser, modelId: string) {
	const { dir } = await modelDir(user, modelId);
	return listDir(dir);
}

export async function readFoto(user: SessionUser, modelId: string, name: string) {
	const { dir } = await modelDir(user, modelId);
	const file = fileName(name);
	try {
		return { data: await readFile(path.join(dir, file)), type: TYPE_OF[file.split('.').pop()!] };
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new AuthError('Foto tidak ditemukan', 404);
		throw e;
	}
}

/** foto pertama model (thumbnail dashboard); 404 bila belum ada foto */
export async function readCover(user: SessionUser, modelId: string) {
	const { dir } = await modelDir(user, modelId);
	const first = (await listDir(dir))[0];
	if (!first) throw new AuthError('Model ini belum punya foto', 404);
	return { data: await readFile(path.join(dir, first.name)), type: TYPE_OF[first.name.split('.').pop()!] };
}

export async function addFoto(user: SessionUser, modelId: string, bytes: Uint8Array, ip: string) {
	if (!bytes.length) throw new AuthError('Foto kosong');
	if (bytes.length > FOTO_MAX_BYTES) throw new AuthError('Ukuran foto maksimal 3 MB', 413);
	const type = imageType(bytes);
	if (!type) throw new AuthError('Format foto harus JPEG, PNG, atau WebP', 415);
	const { id, dir } = await modelDir(user, modelId);
	if ((await listDir(dir)).length >= MAX_PER_MODEL) throw new AuthError(`Maksimal ${MAX_PER_MODEL} foto per model`);
	await mkdir(dir, { recursive: true });
	const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${EXT[type]}`;
	await writeFile(path.join(dir, name), bytes, { flag: 'wx' });
	await audit('produk.foto', { userId: user.id, username: user.username, ip, detail: `produk ${id}: tambah foto ${name}` });
	return listDir(dir);
}

export async function removeFoto(user: SessionUser, modelId: string, name: string, ip: string) {
	const { id, dir } = await modelDir(user, modelId);
	const file = fileName(name);
	await rm(path.join(dir, file), { force: true });
	await audit('produk.foto', { userId: user.id, username: user.username, ip, detail: `produk ${id}: hapus foto ${file}` });
	return listDir(dir);
}
