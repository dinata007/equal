/**
 * Tab halaman yang sudah dibuka (desktop, menggantikan breadcrumb di Topbar).
 * Tab = pintasan: membuka tab lagi memuat ulang halamannya (filter/periode/kolom tetap diingat
 * halaman masing-masing lewat sessionStorage). Urutan bisa diubah dengan drag.
 * Disimpan per pengguna di localStorage; tab ke menu yang tidak lagi boleh dibuka dibuang.
 */
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { Component } from 'svelte';
import { UserRound } from '@lucide/svelte';
import { auth } from './auth.svelte';
import { findNode, isLeaf } from '../domain/menu';

export interface PageTab {
	path: string;
	/** alamat terakhir di tab ini (termasuk ?query, mis. dokumen yang sedang dibuka) */
	href: string;
}
export interface TabInfo {
	label: string;
	icon?: Component<any>;
	/** jalur menu untuk tooltip, mis. "Material › Master › Raw Material" */
	trail: string;
}

/** Dashboard tidak jadi tab (sudah ada di sidebar); tujuan bila tab terakhir ditutup */
export const HOME = '/';
const MAX = 20;
const FIXED: Record<string, TabInfo> = {
	'/profil': { label: 'Profil', icon: UserRound, trail: 'Profil & Pengaturan' }
};

export function tabInfo(path: string): TabInfo | null {
	if (FIXED[path]) return FIXED[path];
	const n = findNode(path);
	if (!n) return null;
	return { label: n.label, icon: n.icon ?? (isLeaf(n) ? n.module.icon : undefined), trail: (n.trail ?? [n.label]).join(' › ') };
}

/** halaman yang boleh jadi tab: Profil, modul, atau menu yang boleh dibuka pengguna (bukan Dashboard) */
function allowed(path: string) {
	if (path === HOME) return false;
	if (FIXED[path]) return true;
	const n = findNode(path);
	return !!n && (!isLeaf(n) || auth.can(n.path));
}

class Tabs {
	list = $state<PageTab[]>([]);
	#owner: number | null = null;

	#key = () => `senja:tabs:${this.#owner}`;

	#save() {
		try {
			localStorage.setItem(this.#key(), JSON.stringify(this.list));
		} catch {
			// penyimpanan penuh / diblokir: tab tetap jalan selama aplikasi terbuka
		}
	}

	/** muat tab milik pengguna yang login (sekali per pengguna) */
	#load() {
		const id = auth.user?.id ?? null;
		if (id === this.#owner) return;
		this.#owner = id;
		let saved: PageTab[] = [];
		try {
			const raw = JSON.parse(localStorage.getItem(this.#key()) ?? '[]');
			if (Array.isArray(raw)) saved = raw.filter((t) => t && typeof t.path === 'string' && typeof t.href === 'string' && t.href.startsWith(t.path));
		} catch {
			saved = [];
		}
		this.list = saved.filter((t) => t.path !== HOME && allowed(t.path)).slice(-MAX);
	}

	/** halaman dibuka → jadikan tab (atau perbarui alamat terakhir tab yang sudah ada) */
	visit(url: { pathname: string; search: string }) {
		this.#load();
		const path = url.pathname;
		if (path === HOME || !allowed(path)) return;
		const href = path + url.search;
		const t = this.list.find((x) => x.path === path);
		if (t) {
			if (t.href === href) return;
			t.href = href;
		} else {
			this.list.push({ path, href });
			// terlalu banyak: buang tab terlama selain yang sedang dibuka
			if (this.list.length > MAX) this.list.splice(this.list.findIndex((x) => x.path !== path), 1);
		}
		this.#save();
	}

	/** tutup tab; bila tab yang sedang dibuka → pindah ke tab sebelahnya (kanan, lalu kiri, lalu Dashboard) */
	close(path: string) {
		const i = this.list.findIndex((t) => t.path === path);
		if (i < 0) return;
		this.list.splice(i, 1);
		this.#save();
		if (page.url.pathname === path) goto((this.list[i] ?? this.list[i - 1])?.href ?? HOME);
	}

	closeOthers() {
		this.list = this.list.filter((t) => t.path === page.url.pathname);
		this.#save();
	}

	closeAll() {
		const open = this.list.some((t) => t.path === page.url.pathname);
		this.list = [];
		this.#save();
		if (open) goto(HOME);
	}

	/** pindahkan tab ke posisi `to` saat di-drag (disimpan sekali saat dilepas: `saveOrder`) */
	move(path: string, to: number) {
		const from = this.list.findIndex((t) => t.path === path);
		if (from < 0 || from === to) return;
		const [t] = this.list.splice(from, 1);
		this.list.splice(Math.max(0, Math.min(to, this.list.length)), 0, t);
	}

	saveOrder() {
		this.#save();
	}
}

export const tabs = new Tabs();
