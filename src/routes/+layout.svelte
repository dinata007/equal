<script lang="ts">
	import '../app.css';
	import { db } from '#lib/erp/db.svelte.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	// tangkap event "pasang aplikasi" sejak halaman pertama dimuat
	import '#lib/erp/pwa.svelte.ts';
	import Toaster from '#lib/components/Toaster.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import { installBackClose } from '#lib/ui/backClose.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// tombol back menutup sheet/dialog/dropdown yang terbuka dulu, baru pindah halaman
	installBackClose();

	db.init();
	// sesi dari server tersedia sebelum halaman pertama dirender, lalu diperbarui setiap invalidateAll()
	// svelte-ignore state_referenced_locally
	auth.set(data);
	$effect.pre(() => auth.set(data));
</script>

<svelte:head>
	<title>ruangSenja ERP</title>
</svelte:head>

{@render children()}
<Toaster />
<ConfirmDialog />
