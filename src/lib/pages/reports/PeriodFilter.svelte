<script lang="ts">
	import DateInput from '#lib/components/DateInput.svelte';
	import PeriodPresets from '#lib/components/PeriodPresets.svelte';

	let { from = $bindable(), to = $bindable() }: { from: string; to: string } = $props();
</script>

<div class="min-w-0 sm:w-52">
	<label class="label" for="pf-from">Dari</label>
	<DateInput id="pf-from" bind:value={from} max={to} />
</div>
<div class="min-w-0 sm:w-auto">
	<label class="label" for="pf-to">Sampai</label>
	<div class="flex gap-2">
		<div class="min-w-0 flex-1 sm:w-52"><DateInput id="pf-to" bind:value={to} min={from} /></div>
		<PeriodPresets bind:from bind:to />
	</div>
</div>
