<script lang="ts">
	import '../app.css';
	import { db } from '#lib/erp/db.svelte.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import Toaster from '#lib/components/Toaster.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	db.init();
	auth.init();
</script>

<svelte:head>
	<title>ruangSenja ERP</title>
</svelte:head>

{@render children()}
<Toaster />
<ConfirmDialog />
