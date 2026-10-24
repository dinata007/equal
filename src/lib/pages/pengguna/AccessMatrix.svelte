<script lang="ts">
	/** Daftar modul → menu dengan sakelar on/off per menu & per modul. */
	import { ChevronDown } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { GRANTABLE, MENU, type Leaf } from '#lib/domain/menu.ts';
	import type { MenuNode } from '#lib/domain/types.ts';
	import Switch from '../../components/ui/Switch.svelte';

	let {
		isOn,
		onset,
		disabled = false
	}: {
		isOn: (path: string) => boolean;
		onset: (paths: string[], value: boolean) => void;
		disabled?: boolean;
	} = $props();

	let open = $state<Record<string, boolean>>(Object.fromEntries(MENU.map((m) => [m.path!, innerWidth >= 1024])));

	const leavesOf = (m: MenuNode) => GRANTABLE.filter((l) => l.path.startsWith(m.path + '/'));
	// modul yang seluruh menunya khusus admin tidak ditampilkan
	const modules = MENU.filter((m) => leavesOf(m).length);
	function groups(m: MenuNode) {
		const out = new Map<string, Leaf[]>();
		for (const l of leavesOf(m)) {
			const k = l.trail.slice(1, -1).join(' › ');
			out.set(k, [...(out.get(k) ?? []), l]);
		}
		return [...out.entries()];
	}
</script>

<div class="space-y-3">
	{#each modules as m (m.path)}
		{@const all = leavesOf(m)}
		{@const n = all.filter((l) => isOn(l.path)).length}
		<section class="card overflow-hidden">
			<div class="flex items-center gap-3 px-4 py-3">
				<button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={() => (open[m.path!] = !open[m.path!])} aria-expanded={open[m.path!]}>
					<span class="grid size-9 shrink-0 place-items-center rounded-xl {n ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}">
						{#if m.icon}<m.icon class="size-4" />{/if}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block font-medium">{m.label}</span>
						<span class="block text-xs text-stone-500">
							{n} / {all.length} menu
						</span>
					</span>
					<ChevronDown class="size-4 shrink-0 text-stone-400 transition-transform {open[m.path!] ? 'rotate-180' : ''}" />
				</button>
				<Switch
					label="Semua menu {m.label}"
					checked={n === all.length}
					mixed={n > 0 && n < all.length}
					{disabled}
					onchange={() => onset(all.map((l) => l.path), n < all.length)}
				/>
			</div>
			{#if open[m.path!]}
				<div transition:slide={{ duration: 160 }} class="border-t border-stone-100 pb-2 dark:border-stone-800">
					{#each groups(m) as [title, items] (title)}
						{#if title}<p class="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">{title}</p>{/if}
						<ul>
							{#each items as l (l.path)}
								{@const on = isOn(l.path)}
								<li>
									<label class="flex items-center gap-3 px-4 py-2.5 {disabled ? '' : 'cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40'}">
										{#if l.icon}<l.icon class="size-4 shrink-0 {on ? 'text-brand-500' : 'text-stone-300 dark:text-stone-600'}" />{/if}
										<span class="min-w-0 flex-1 truncate text-sm {on ? '' : 'text-stone-500'}">{l.label}</span>
										<Switch label={l.label} checked={on} {disabled} onchange={(v) => onset([l.path], v)} />
									</label>
								</li>
							{/each}
						</ul>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>
