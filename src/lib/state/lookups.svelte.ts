/**
 * Pilihan lookup dari server (/api/lookup/[name]) untuk master dari database:
 * dimuat sekali saat pertama dipakai, lalu disimpan selama aplikasi terbuka.
 */
import { api } from '../util/api';
import type { LookupOption } from '../domain/types';

class Lookups {
	#data = $state<Record<string, LookupOption[]>>({});
	#index: Record<string, Map<string, LookupOption>> = {};
	#loading = new Map<string, Promise<LookupOption[]>>();

	/** daftar pilihan; kosong selama masih dimuat */
	options(name: string): LookupOption[] {
		void this.load(name);
		return this.#data[name] ?? [];
	}

	load(name: string, force = false): Promise<LookupOption[]> {
		const cached = this.#data[name];
		if (cached && !force) return Promise.resolve(cached);
		const pending = this.#loading.get(name);
		if (pending) return pending;
		const p = api<{ options: LookupOption[] }>(`/api/lookup/${encodeURIComponent(name)}`)
			.then((r) => {
				this.#index[name] = new Map(r.options.map((o) => [o.id, o]));
				this.#data[name] = r.options;
				return r.options;
			})
			.finally(() => this.#loading.delete(name));
		p.catch(() => {});
		this.#loading.set(name, p);
		return p;
	}

	/** muat ulang semua lookup yang sudah pernah dipakai (setelah master diubah) */
	refresh() {
		for (const name of Object.keys(this.#data)) void this.load(name, true);
	}

	get(name: string, id: unknown): LookupOption | undefined {
		if (id == null || id === '') return undefined;
		if (!this.#data[name]) void this.load(name);
		return this.#index[name]?.get(String(id));
	}
	name(name: string, id: unknown) {
		return this.get(name, id)?.name ?? (id == null ? '' : String(id));
	}
	/** "KODE — Nama" */
	label(name: string, id: unknown) {
		const o = this.get(name, id);
		if (!o) return id == null ? '' : String(id);
		return o.code && o.code !== o.name ? `${o.code} — ${o.name}` : o.name;
	}
}

export const lookups = new Lookups();
