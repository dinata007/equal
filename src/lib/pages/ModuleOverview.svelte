<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { chain, visibleTree } from '#lib/domain/menu.ts';
	import type { MenuNode } from '#lib/domain/types.ts';
	import PageHeader from '#lib/components/data/PageHeader.svelte';

	let { node }: { node: MenuNode } = $props();

	const mod = $derived(chain(node.path!)[0]);
	const tree = $derived(visibleTree(node.children ?? [], (p) => auth.can(p)));
	/** ratakan grup menjadi section berisi daun */
	type Section = { title: string; items: MenuNode[] };
	const sections = $derived.by(() => {
		const out: Section[] = [];
		const walk = (ns: MenuNode[], title: string) => {
			const leaves = ns.filter((n) => !n.children);
			if (leaves.length) out.push({ title, items: leaves });
			for (const n of ns.filter((n) => n.children)) walk(n.children!, title ? `${title} › ${n.label}` : n.label);
		};
		walk(tree, '');
		return out;
	});
</script>

<PageHeader title={node.label} subtitle={mod?.description ?? node.trail?.join(' › ')} icon={mod?.icon} />

{#if !sections.length}
	<p class="card py-16 text-center text-sm text-stone-400">Tidak ada menu yang dapat diakses pada modul ini.</p>
{/if}
<div class="space-y-6">
	{#each sections as s (s.title)}
		<section>
			{#if s.title}<h2 class="mb-2 px-1 text-xs font-medium tracking-wider text-stone-400 uppercase">{s.title}</h2>{/if}
			<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
				{#each s.items as it (it.path)}
					<a href={it.path} class="card group flex items-center gap-3 p-3.5 transition hover:border-brand-300 hover:shadow-md">
						<span class="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-500/10">
							{#if it.icon}<it.icon class="size-5" />{/if}
						</span>
						<span class="flex-1 text-sm font-medium">{it.label}</span>
						<ChevronRight class="size-4 text-stone-300 transition group-hover:translate-x-0.5" />
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>
