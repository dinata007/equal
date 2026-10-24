<script lang="ts">
	/** Master pegawai (tabel lama M_PEGAWAI, PowerBuilder W_MS_08) + tab riwayat kontrak. */
	import { auth } from '#lib/state/auth.svelte.ts';
	import * as M from '#lib/domain/defs/masters.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import type { Row } from '#lib/domain/types.ts';
	import MasterPage from '#lib/pages/master/MasterPage.svelte';
	import KontrakPanel from './KontrakPanel.svelte';

	let { leaf }: { leaf: Leaf } = $props();
</script>

{#snippet kontrak(row: Row, reload: () => Promise<void>)}
	<KontrakPanel pegawai={row} canEdit={auth.can(leaf.path, 'edit')} canDelete={auth.can(leaf.path, 'delete')} onchange={reload} />
{/snippet}

<MasterPage {leaf} page={M.employee} tabs={[{ key: 'kontrak', label: 'Kontrak', panel: kontrak }]} />
