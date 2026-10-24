<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';
	import { confirmDialog } from '#lib/erp/ui.svelte.ts';
	import { backClose } from '#lib/ui/backClose.svelte.ts';

	const c = $derived(confirmDialog.current);
	backClose(() => !!c, () => confirmDialog.close(false));
</script>

<svelte:window onkeydown={(e) => c && e.key === 'Escape' && confirmDialog.close(false)} />

{#if c}
	<div class="fixed inset-0 z-[80] grid place-items-center p-4">
		<button
			class="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
			transition:fade={{ duration: 150 }}
			onclick={() => confirmDialog.close(false)}
			aria-label="Batal"
		></button>
		<div
			role="alertdialog"
			aria-modal="true"
			transition:scale={{ start: 0.95, duration: 150 }}
			class="card relative w-full max-w-sm p-5"
		>
			<div class="flex gap-4">
				<div
					class="grid size-10 shrink-0 place-items-center rounded-full {c.danger
						? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15'
						: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15'}"
				>
					<TriangleAlert class="size-5" />
				</div>
				<div class="min-w-0">
					<h3 class="font-medium">{c.title}</h3>
					{#if c.message}<p class="mt-1 text-sm text-stone-500 dark:text-stone-400">{c.message}</p>{/if}
				</div>
			</div>
			<div class="mt-5 flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => confirmDialog.close(false)}>Batal</button>
				<!-- svelte-ignore a11y_autofocus -->
				<button autofocus class="btn {c.danger ? 'btn-danger' : 'btn-primary'}" onclick={() => confirmDialog.close(true)}>
					{c.confirmText ?? 'Ya, lanjutkan'}
				</button>
			</div>
		</div>
	</div>
{/if}
