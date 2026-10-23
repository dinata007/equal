<script lang="ts">
	import '../app.css';
	import { db } from '#lib/erp/db.svelte.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import Toaster from '#lib/components/Toaster.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

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
