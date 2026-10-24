<script lang="ts">
	/**
	 * Salin hak akses dari pengguna lain — dibuat untuk jumlah pengguna yang banyak:
	 * cari (nama/username/toko), pilih, lihat pratinjau perubahan per modul, lalu terapkan.
	 * Mode "Ganti" menyamakan persis; "Tambahkan" hanya menambah menu tanpa mencabut yang sudah ada.
	 */
	import { ArrowDown, ArrowUp, Check, Search, ShieldCheck } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { accessLabel, menusOf } from '#lib/erp/auth.svelte.ts';
	import { num } from '#lib/erp/format.ts';
	import Avatar from './Avatar.svelte';
	import { GRANTABLE } from '#lib/erp/menu.ts';
	import type { ManagedUser } from '#lib/erp/types.ts';
	import Sheet from './Sheet.svelte';

	let {
		open = $bindable(false),
		users,
		current,
		storeName = () => '',
		onapply
	}: {
		open?: boolean;
		/** kandidat sumber (tanpa pengguna yang sedang diedit) */
		users: ManagedUser[];
		/** akses menu saat ini di form */
		current: Record<string, boolean>;
		/** nama toko default pengguna (untuk pencarian & keterangan) */
		storeName?: (u: ManagedUser) => string;
		onapply: (next: Record<string, boolean>, from: ManagedUser) => void;
	} = $props();

	const LIMIT = 100;
	let query = $state('');
	let mode = $state<'replace' | 'merge'>('replace');
	let pickedId = $state<number | null>(null);
	let active = $state(0);
	let searchEl = $state<HTMLInputElement>();
	let listEl = $state<HTMLUListElement>();

	const sourceMap = (u: ManagedUser) => {
		const on = new Set(menusOf(u));
		return Object.fromEntries(GRANTABLE.map((l) => [l.path, on.has(l.path)]));
	};

	const matches = $derived.by(() => {
		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		const list = users
			.filter((u) => !terms.length || terms.every((t) => `${u.name} ${u.username} ${storeName(u)} ${accessLabel(u)}`.toLowerCase().includes(t)))
			.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'id'));
		return list;
	});
	const shown = $derived(matches.slice(0, LIMIT));
	const picked = $derived(users.find((u) => u.id === pickedId));

	const next = $derived.by(() => {
		if (!picked) return null;
		const src = sourceMap(picked);
		return mode === 'replace' ? src : Object.fromEntries(GRANTABLE.map((l) => [l.path, !!current[l.path] || src[l.path]]));
	});
	const diff = $derived.by(() => {
		if (!next) return null;
		const mods = new Map<string, { label: string; add: number; del: number }>();
		let add = 0;
		let del = 0;
		for (const l of GRANTABLE) {
			const was = !!current[l.path];
			const now = next[l.path];
			if (was === now) continue;
			const m = mods.get(l.module.path!) ?? { label: l.module.label, add: 0, del: 0 };
			if (now) (m.add++, add++);
			else (m.del++, del++);
			mods.set(l.module.path!, m);
		}
		return { add, del, total: Object.values(next).filter(Boolean).length, mods: [...mods.values()] };
	});

	$effect(() => {
		if (!open) return;
		query = '';
		pickedId = null;
		active = 0;
		mode = 'replace';
		tick().then(() => searchEl?.focus());
	});
	$effect(() => {
		void query;
		active = 0;
	});

	function move(to: number) {
		if (!shown.length) return;
		active = Math.max(0, Math.min(shown.length - 1, to));
		pickedId = shown[active].id;
		listEl?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') move(pickedId ? active + 1 : 0);
		else if (e.key === 'ArrowUp') move(active - 1);
		else if (e.key === 'Enter') {
			if (picked && diff && (diff.add || diff.del)) apply();
			else if (shown[active]) pickedId = shown[active].id;
		} else return;
		e.preventDefault();
	}
	function apply() {
		if (!picked || !next) return;
		onapply({ ...next }, picked);
		open = false;
	}
</script>

<Sheet bind:open title="Salin hak akses" subtitle="Pilih pengguna yang aksesnya mau dijadikan acuan" size="lg">
	<div class="sticky top-0 z-10 -mx-5 space-y-3 bg-white px-5 pt-1 pb-3 sm:-mx-6 sm:px-6 dark:bg-stone-900">
		<div class="relative">
			<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
			<input
				bind:this={searchEl}
				bind:value={query}
				onkeydown={onkey}
				type="search"
				class="input pl-9"
				placeholder="Cari nama, username, toko…"
				autocomplete="off"
				role="combobox"
				aria-expanded="true"
				aria-controls="copy-access-list"
				aria-activedescendant={pickedId ? `copy-u-${pickedId}` : undefined}
			/>
		</div>
		<div class="flex items-center justify-between gap-3">
			<div class="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/60" role="radiogroup" aria-label="Cara menyalin">
				{#each [{ k: 'replace', label: 'Ganti semua' }, { k: 'merge', label: 'Tambahkan saja' }] as o (o.k)}
					<button
						type="button"
						role="radio"
						aria-checked={mode === o.k}
						class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {mode === o.k ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}"
						onclick={() => (mode = o.k as typeof mode)}>{o.label}</button
					>
				{/each}
			</div>
			<p class="hidden text-right text-xs text-stone-400 sm:block">
				{mode === 'replace' ? 'Akses disamakan persis dengan pengguna terpilih' : 'Menu yang sudah aktif tidak dicabut'}
			</p>
		</div>
	</div>

	<ul bind:this={listEl} id="copy-access-list" role="listbox" aria-label="Pengguna" class="-mx-2 space-y-0.5">
		{#each shown as u, i (u.id)}
			{@const sel = u.id === pickedId}
			<!-- keyboard ditangani di kotak cari (aria-activedescendant) -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<li
				id="copy-u-{u.id}"
				data-i={i}
				role="option"
				aria-selected={sel}
				class="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors {sel ? 'bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-700' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}"
				onclick={() => ((pickedId = u.id), (active = i))}
			>
				<Avatar id={u.id} name={u.name} ver={u.avatar} tone={u.admin ? 'brand' : 'muted'} class="size-9 text-xs {u.active ? '' : 'opacity-40'}" />
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm font-medium">{u.name} <span class="font-normal text-stone-400">@{u.username}</span></span>
					<span class="block truncate text-xs text-stone-500">{[storeName(u), u.active ? '' : 'Nonaktif'].filter(Boolean).join(' · ') || 'Tidak terikat toko'}</span>
				</span>
				<span class="badge shrink-0 {u.admin ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}">{u.admin ? 'Admin' : accessLabel(u)}</span>
				<span class="grid size-5 shrink-0 place-items-center rounded-full border transition {sel ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 dark:border-stone-600'}">
					{#if sel}<Check class="size-3" strokeWidth={3} />{/if}
				</span>
			</li>
		{:else}
			<li class="px-3 py-10 text-center text-sm text-stone-400">{query ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna lain'}</li>
		{/each}
	</ul>
	{#if matches.length > LIMIT}
		<p class="py-3 text-center text-xs text-stone-400">Menampilkan {num(LIMIT)} dari {num(matches.length)} pengguna — ketik untuk mempersempit</p>
	{/if}

	{#snippet footer()}
		<div class="min-w-0 flex-1 text-xs">
			{#if picked && diff}
				{#if picked.admin}
					<p class="flex items-center gap-1.5 text-stone-500"><ShieldCheck class="size-3.5 shrink-0 text-brand-500" /> Sumber admin: semua menu non-admin diaktifkan (flag admin tidak ikut)</p>
				{/if}
				{#if diff.add || diff.del}
					<p class="flex flex-wrap items-center gap-x-3 gap-y-0.5">
						<span class="font-medium">Jadi {num(diff.total)} menu</span>
						{#if diff.add}<span class="inline-flex items-center gap-0.5 text-emerald-600"><ArrowUp class="size-3" />{diff.add} ditambah</span>{/if}
						{#if diff.del}<span class="inline-flex items-center gap-0.5 text-rose-600"><ArrowDown class="size-3" />{diff.del} dicabut</span>{/if}
					</p>
					<p class="mt-0.5 truncate text-stone-400">
						{diff.mods.map((m) => `${m.label} ${m.add ? '+' + m.add : ''}${m.add && m.del ? ' ' : ''}${m.del ? '−' + m.del : ''}`).join(' · ')}
					</p>
				{:else}
					<p class="text-stone-500">Akses sudah sama — tidak ada perubahan</p>
				{/if}
			{:else}
				<p class="text-stone-400">Pilih pengguna untuk melihat pratinjau perubahan</p>
			{/if}
		</div>
		<button type="button" class="btn btn-secondary" onclick={() => (open = false)}>Batal</button>
		<button type="button" class="btn btn-primary" disabled={!diff || !(diff.add || diff.del)} onclick={apply}>Terapkan</button>
	{/snippet}
</Sheet>
