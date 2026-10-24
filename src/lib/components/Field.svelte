<script lang="ts">
	import DateInput from './DateInput.svelte';
	import Select from './Select.svelte';
	import type { FieldDef } from '#lib/erp/types.ts';
	import Lookup from './Lookup.svelte';
	import NumberInput from './NumberInput.svelte';

	let {
		field,
		form = $bindable(),
		disabled = false,
		error,
		prefix = 'f'
	}: {
		field: FieldDef;
		form: Record<string, any>;
		disabled?: boolean;
		error?: string;
		/** awalan id elemen (beda per form bila dua form tampil bersamaan) */
		prefix?: string;
	} = $props();

	const id = $derived(`${prefix}-${field.key}`);
	const type = $derived(field.type ?? 'text');
	const ro = $derived(disabled || field.readonly);
	const options = $derived((field.options ?? []).map((o) => (typeof o === 'string' ? o : { value: o.value, label: o.label })));
</script>

<!-- min-w-0: isian tidak boleh melebarkan kolom grid form melebihi lebar layar -->
<div class="min-w-0 {field.span === 2 || type === 'textarea' ? 'sm:col-span-2' : ''}">
	{#if type === 'toggle'}
		<label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2.5 dark:border-stone-700">
			<span class="text-sm">{field.label}</span>
			<input type="checkbox" class="peer sr-only" bind:checked={form[field.key]} disabled={ro} />
			<span class="relative h-6 w-11 rounded-full bg-stone-200 transition peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 dark:bg-stone-700"></span>
		</label>
	{:else}
		<label class="label" for={id}>
			{field.label}
			{#if field.required}<span class="text-rose-500">*</span>{/if}
		</label>
		{#if type === 'lookup'}
			<Lookup {id} table={field.ref} source={field.source} bind:value={form[field.key]} disabled={ro} clearable={!field.required} filter={field.refFilter ? (r) => field.refFilter!(r, form) : undefined} />
		{:else if type === 'select'}
			<Select {id} bind:value={form[field.key]} {options} disabled={ro} clearable={!field.required} label={field.label} placeholder="— Pilih —" />
		{:else if type === 'money' || type === 'number'}
			<NumberInput {id} bind:value={form[field.key]} money={type === 'money'} decimals={field.decimals} disabled={ro} />
		{:else if type === 'textarea'}
			<textarea {id} class="input" rows="3" bind:value={form[field.key]} disabled={ro} placeholder={field.placeholder} maxlength={field.maxLength}></textarea>
		{:else if type === 'date'}
			<DateInput {id} bind:value={form[field.key]} disabled={ro} clearable={!field.required} />
		{:else}
			<input {id} class="input" type={type} bind:value={form[field.key]} disabled={ro} placeholder={field.placeholder} maxlength={field.maxLength} autocomplete="off" />
		{/if}
	{/if}
	{#if error}
		<p class="mt-1 text-xs text-rose-500">{error}</p>
	{:else if field.hint}
		<p class="mt-1 text-xs text-stone-400">{field.hint}</p>
	{/if}
</div>
