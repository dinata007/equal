<script lang="ts">
	import { tooltip } from '#lib/ui/tooltip.ts';
	import Select from '#lib/components/Select.svelte';
	import { Plus, Trash } from '@lucide/svelte';
	import { db } from '#lib/erp/db.svelte.ts';
	import { money, num, uid } from '#lib/erp/format.ts';
	import type { Doc, LineField, LinesDef, Row } from '#lib/erp/types.ts';
	import Lookup from '#lib/components/Lookup.svelte';
	import NumberInput from '#lib/components/NumberInput.svelte';
	import { fields as fieldEls } from '#lib/ui/formNav.ts';
	import { tick } from 'svelte';

	let { def, doc = $bindable(), disabled = false }: { def: LinesDef; doc: Doc; disabled?: boolean } = $props();

	const fields = $derived(def.fields);
	const tableOf = (f: LineField) => (f.type === 'item' ? def.itemTable! : f.ref!);

	let rootEl = $state<HTMLDivElement>();
	/** tambah baris lalu fokus ke isian pertamanya (tabel desktop atau kartu HP, mana yang tampil) */
	async function addLine() {
		doc.lines.push({ _k: uid() });
		await tick();
		const i = doc.lines.length - 1;
		for (const el of rootEl?.querySelectorAll<HTMLElement>(`[data-line="${i}"]`) ?? []) {
			const f = fieldEls(el)[0];
			if (f) {
				f.focus();
				break;
			}
		}
	}
	const filled = (i: number) => Object.entries(doc.lines[i] ?? {}).some(([k, v]) => k !== '_k' && v !== '' && v != null);
	// Enter di isian terakhir pada baris terakhir (yang sudah diisi) → baris baru
	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
		const t = e.target as HTMLElement;
		if (t.closest('[popover]')) return;
		const row = t.closest<HTMLElement>('[data-line]');
		const i = Number(row?.dataset.line);
		if (!row || i !== doc.lines.length - 1 || fieldEls(row).at(-1) !== t || !filled(i)) return;
		e.preventDefault();
		e.stopPropagation();
		addLine();
	}
	function removeLine(i: number) {
		doc.lines.splice(i, 1);
	}
	function onItem(i: number, item: Row | undefined) {
		if (item && def.onItem) def.onItem(doc.lines[i], item, doc);
	}
	const fmt = (f: LineField, v: number) => (f.format === 'money' ? money(v) : num(v));
</script>

{#snippet input(f: LineField, i: number, compact: boolean)}
	{@const l = doc.lines[i]}
	{#if f.type === 'computed'}
		<div class="num px-1 py-2 text-sm font-medium tabular-nums">{fmt(f, f.compute!(l, doc))}</div>
	{:else if disabled || f.readonly}
		<div class="truncate px-1 py-2 text-sm {f.type === 'number' || f.type === 'money' ? 'num tabular-nums' : ''}">
			{#if f.type === 'item' || f.type === 'lookup'}{db.label(tableOf(f), l[f.key]) || '—'}
			{:else if f.type === 'money'}{money(l[f.key])}
			{:else if f.type === 'number'}{num(l[f.key])}
			{:else}{l[f.key] || '—'}{/if}
		</div>
	{:else if f.type === 'item' || f.type === 'lookup'}
		<Lookup table={tableOf(f)} bind:value={l[f.key]} {compact} placeholder="Pilih {f.label.toLowerCase()}…" onselect={(r) => f.type === 'item' && onItem(i, r)} />
	{:else if f.type === 'number' || f.type === 'money'}
		<NumberInput bind:value={l[f.key]} money={f.type === 'money'} {compact} />
	{:else if f.type === 'select'}
		<Select bind:value={l[f.key]} options={f.options ?? []} {compact} clearable label={f.label} placeholder="—" />
	{:else if f.type === 'time'}
		<input type="time" class="input {compact ? '!h-9 !rounded-lg' : ''}" bind:value={l[f.key]} />
	{:else}
		<input class="input {compact ? '!h-9 !rounded-lg' : ''}" bind:value={l[f.key]} />
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={rootEl} {onkeydown}>
<!-- Desktop -->
<div class="hidden overflow-x-auto md:block">
	<table class="table-erp">
		<thead>
			<tr>
				<th class="w-10 text-center">#</th>
				{#each fields as f (f.key)}
					<th class="{f.width ?? ''} {f.type === 'number' || f.type === 'money' || f.type === 'computed' ? 'text-right' : ''}">{f.label}</th>
				{/each}
				{#if !disabled}<th class="w-10"></th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each doc.lines as l, i (l._k)}
				<tr class="hover:!bg-transparent" data-line={i}>
					<td class="text-center text-xs text-stone-400">{i + 1}</td>
					{#each fields as f (f.key)}
						<td class="!px-1.5 !py-1.5 {f.width ?? ''}">{@render input(f, i, true)}</td>
					{/each}
					{#if !disabled}
						<td class="!px-1">
							<button class="btn btn-ghost btn-icon btn-sm text-stone-400 hover:text-rose-600" onclick={() => removeLine(i)} aria-label="Hapus baris" {@attach tooltip()}><Trash class="size-4" /></button>
						</td>
					{/if}
				</tr>
			{:else}
				<tr><td colspan={fields.length + 2} class="py-8 text-center text-sm text-stone-400">Belum ada baris</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- Mobile -->
<div class="space-y-3 md:hidden">
	{#each doc.lines as l, i (l._k)}
		<div class="rounded-2xl border border-stone-200 p-3 dark:border-stone-800" data-line={i}>
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium text-stone-400">Baris {i + 1}</span>
				{#if !disabled}
					<button class="btn btn-ghost btn-icon btn-sm -mr-1 text-stone-400" onclick={() => removeLine(i)} aria-label="Hapus baris" {@attach tooltip()}><Trash class="size-4" /></button>
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-x-3 gap-y-2">
				{#each fields as f (f.key)}
					<div class={f.type === 'item' || f.type === 'lookup' || (f.type === 'text' && !f.readonly) ? 'col-span-2' : ''}>
						<span class="label !mb-1">{f.label}</span>
						{@render input(f, i, false)}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<p class="rounded-2xl border border-dashed border-stone-200 py-8 text-center text-sm text-stone-400 dark:border-stone-800">Belum ada baris</p>
	{/each}
</div>

{#if !disabled}
	<button class="btn btn-secondary mt-3 w-full border-dashed md:w-auto" onclick={addLine}><Plus class="size-4" /> Tambah Baris</button>
{/if}
</div>
