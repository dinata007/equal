<script lang="ts">
	import { page } from '$app/state';
	import { ShieldAlert } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { goto } from '$app/navigation';
	import { findNode, firstLeaf, isLeaf, visibleTree } from '#lib/domain/menu.ts';
	import MasterPage from '#lib/pages/master/MasterPage.svelte';
	import TransactionPage from '#lib/pages/transaksi/TransactionPage.svelte';
	import ModuleOverview from '#lib/pages/ModuleOverview.svelte';
	import MutasiStok from '#lib/pages/laporan/MutasiStok.svelte';
	import KartuStok from '#lib/pages/laporan/KartuStok.svelte';
	import MutasiHutangPiutang from '#lib/pages/laporan/MutasiHutangPiutang.svelte';
	import KartuHutangPiutang from '#lib/pages/laporan/KartuHutangPiutang.svelte';
	import BukuKasBank from '#lib/pages/laporan/BukuKasBank.svelte';
	import Jurnal from '#lib/pages/laporan/Jurnal.svelte';
	import Absensi from '#lib/pages/laporan/Absensi.svelte';
	import ClosingStok from '#lib/pages/utilitas/ClosingStok.svelte';
	import Pengguna from '#lib/pages/pengguna/Pengguna.svelte';
	import Pegawai from '#lib/pages/pegawai/Pegawai.svelte';
	import Atribut from '#lib/pages/master/Atribut.svelte';
	import type { CustomPage, ReportPage } from '#lib/domain/types.ts';

	// kunci = R('…') / C('…') di domain/menu.ts; bertipe → kunci kurang / salah ketik jadi error saat check
	const components: Record<ReportPage | CustomPage, Component<any>> = {
		'mutasi-stok': MutasiStok,
		'kartu-stok': KartuStok,
		'mutasi-hutang-piutang': MutasiHutangPiutang,
		'kartu-hutang-piutang': KartuHutangPiutang,
		'buku-kas-bank': BukuKasBank,
		jurnal: Jurnal,
		absensi: Absensi,
		'closing-stok': ClosingStok,
		pengguna: Pengguna,
		pegawai: Pegawai,
		atribut: Atribut
	};

	const node = $derived(findNode('/' + page.params.path));
	// modul `flat` (grup tanpa halaman ringkasan) tidak punya halaman ringkasan → langsung ke anak pertama yang boleh dibuka
	const flatTo = $derived(node?.flat && !isLeaf(node) ? firstLeaf(visibleTree([node], (p) => auth.can(p))[0] ?? node) : undefined);
	$effect(() => {
		if (flatTo?.path && flatTo.path !== node?.path) goto(flatTo.path, { replaceState: true });
	});
</script>

<svelte:head><title>{node?.label ?? 'Tidak ditemukan'} · Senja</title></svelte:head>

{#if !node}
	<div class="grid place-items-center py-24 text-center">
		<p class="text-6xl font-bold text-stone-200 dark:text-stone-800">404</p>
		<p class="mt-2 text-stone-500">Halaman tidak ditemukan</p>
		<a href="/" class="btn btn-secondary mt-6">Ke Dashboard</a>
	</div>
{:else if isLeaf(node)}
	{#if !auth.can(node.path)}
		<div class="grid place-items-center py-24 text-center">
			<ShieldAlert class="size-14 stroke-1 text-stone-300" />
			<p class="mt-3 font-medium">Akses ditolak</p>
			<p class="mt-1 text-sm text-stone-500">Akun Anda belum diberi akses ke menu <b>{node.label}</b>. Hubungi administrator.</p>
			<a href="/" class="btn btn-secondary mt-6">Ke Dashboard</a>
		</div>
	{:else}
		{#key node.path}
			{#if node.page.kind === 'master'}
				<MasterPage leaf={node} />
			{:else if node.page.kind === 'transaction'}
				<TransactionPage leaf={node} />
			{:else}
				{@const Comp = components[node.page.component]}
				<Comp leaf={node} {...node.page.props} />
			{/if}
		{/key}
	{/if}
{:else if !node.flat}
	{#key node.path}<ModuleOverview {node} />{/key}
{/if}
