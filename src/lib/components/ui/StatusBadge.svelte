<script lang="ts">
	import type { DocStatus } from '#lib/domain/types.ts';

	let { status, labels }: { status: DocStatus; labels?: Partial<Record<DocStatus, string>> } = $props();

	const tone: Record<DocStatus, string> = {
		draft: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
		posted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
		void: 'bg-stone-200 text-stone-500 line-through dark:bg-stone-800'
	};
	const def: Record<DocStatus, string> = { draft: 'Draft', posted: 'Posted', void: 'Batal' };
</script>

<span class="badge {tone[status]}">
	<span class="size-1.5 rounded-full bg-current"></span>
	{labels?.[status] ?? def[status]}
</span>
