/**
 * Lapisan data prototipe (in-memory + localStorage).
 *
 * Seluruh akses data aplikasi melewati objek `db` ini, sehingga pada tahap koneksi
 * MSSQL cukup modul ini yang diganti (mis. memanggil endpoint /api/[table] atau
 * remote functions SvelteKit) tanpa mengubah halaman/komponen.
 */
import { browser } from '$app/env';
import type { Row } from '../domain/types';
import { uid } from '../util/format';
import { seed } from './seed';

const KEY = 'senja:db:v1';

class Database {
	t = $state<Record<string, Row[]>>({});
	ready = $state(false);
	#timer: ReturnType<typeof setTimeout> | undefined;

	init() {
		if (this.ready) return;
		let data: Record<string, Row[]> | null = null;
		if (browser) {
			try {
				const raw = localStorage.getItem(KEY);
				if (raw) data = JSON.parse(raw);
			} catch {
				data = null;
			}
		}
		const migrated = data ? migrate(data) : false;
		this.t = data ?? seed();
		if (!data || migrated) this.persist(true);
		this.ready = true;
	}

	/** Kembalikan data ke kondisi awal prototipe */
	reset() {
		this.t = seed();
		this.persist(true);
	}

	persist(now = false) {
		if (!browser) return;
		clearTimeout(this.#timer);
		const write = () => {
			try {
				localStorage.setItem(KEY, JSON.stringify($state.snapshot(this.t)));
			} catch (e) {
				console.warn('Gagal menyimpan data lokal', e);
			}
		};
		if (now) write();
		else this.#timer = setTimeout(write, 250);
	}

	all<T extends Row = Row>(table: string): T[] {
		return (this.t[table] ?? []) as T[];
	}

	get<T extends Row = Row>(table: string, id: string | undefined | null): T | undefined {
		if (!id) return undefined;
		return this.all<T>(table).find((r) => r.id === id);
	}

	/** Label ringkas "KODE — Nama" untuk lookup */
	label(table: string, id: string | undefined | null): string {
		const r = this.get(table, id);
		if (!r) return '';
		const name = r.name ?? r.username ?? r.no ?? '';
		const code = r.code ?? r.nik ?? '';
		return code ? `${code} — ${name}` : name;
	}
	name(table: string, id: string | undefined | null): string {
		const r = this.get(table, id);
		return r ? (r.name ?? r.no ?? '') : '';
	}

	async insert<T extends Row>(table: string, row: Omit<T, 'id'> & { id?: string }): Promise<T> {
		const rec = { ...row, id: row.id || uid() } as T;
		(this.t[table] ??= []).push(rec);
		this.persist();
		return rec;
	}

	async update<T extends Row>(table: string, id: string, patch: Partial<T>): Promise<T | undefined> {
		const r = this.get<T>(table, id);
		if (!r) return undefined;
		Object.assign(r, patch);
		this.persist();
		return r;
	}

	async upsert<T extends Row>(table: string, row: T): Promise<T> {
		return this.get(table, row.id) ? (await this.update<T>(table, row.id, row))! : this.insert<T>(table, row);
	}

	async remove(table: string, id: string) {
		const list = this.t[table];
		if (!list) return;
		const i = list.findIndex((r) => r.id === id);
		if (i >= 0) list.splice(i, 1);
		this.persist();
	}

	/** Nomor dokumen: PREFIX/YYMM/0001 */
	nextNo(table: string, prefix: string, date: string) {
		const head = `${prefix}/${date.slice(2, 4)}${date.slice(5, 7)}/`;
		let max = 0;
		for (const r of this.all(table)) {
			if (typeof r.no === 'string' && r.no.startsWith(head)) max = Math.max(max, Number(r.no.slice(head.length)) || 0);
		}
		return head + String(max + 1).padStart(4, '0');
	}

	/** Kode master berikutnya, mis. PRD-0017 */
	nextCode(table: string, field = 'code') {
		const codes = this.all(table).map((r) => String(r[field] ?? ''));
		const sample = codes.find((c) => /\d+$/.test(c));
		if (!sample) return '';
		const prefix = sample.replace(/\d+$/, '');
		const width = sample.length - prefix.length;
		const max = Math.max(0, ...codes.filter((c) => c.startsWith(prefix)).map((c) => Number(c.slice(prefix.length)) || 0));
		return prefix + String(max + 1).padStart(width, '0');
	}
}

/**
 * Bersihkan data lokal versi lama: akun & hak akses kini dikelola di server (dbo.AppUser),
 * jadi tabel users prototipe (berisi password teks biasa) dihapus dari browser.
 */
function migrate(t: Record<string, Row[]>) {
	let changed = false;
	for (const k of ['users', 'roles', 'divisions'])
		if (k in t) {
			delete t[k];
			changed = true;
		}
	return changed;
}

export const db = new Database();
