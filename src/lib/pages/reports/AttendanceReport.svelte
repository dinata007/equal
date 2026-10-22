<script lang="ts">
	import { db } from '#lib/erp/db.svelte.ts';
	import { addDays, date as fdate, downloadCsv, num, today } from '#lib/erp/format.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import type { Doc } from '#lib/erp/types.ts';
	import Lookup from '#lib/components/Lookup.svelte';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf }: { leaf: Leaf } = $props();

	const STATUS = ['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Cuti', 'Alpa'] as const;
	const tone: Record<string, string> = {
		Hadir: 'text-emerald-600',
		Terlambat: 'text-amber-600',
		Sakit: 'text-sky-600',
		Izin: 'text-sky-600',
		Cuti: 'text-violet-600',
		Alpa: 'text-rose-600'
	};

	let from = $state(addDays(today(), -14));
	let to = $state(today());
	let siteId = $state('');

	const docs = $derived(db.all<Doc>('attendance').filter((d) => d.status !== 'void' && d.date >= from && d.date <= to && (!siteId || d.siteId === siteId)));
	const days = $derived(new Set(docs.map((d) => d.date)).size);
	const rows = $derived(
		db
			.all('employees')
			.filter((e) => !siteId || e.siteId === siteId)
			.map((e) => {
				const c: Record<string, number> = Object.fromEntries(STATUS.map((s) => [s, 0]));
				for (const d of docs) for (const l of d.lines) if (l.employeeId === e.id && l.status) c[l.status]++;
				const total = STATUS.reduce((s, k) => s + c[k], 0);
				return { e, c, total, rate: total ? ((c.Hadir + c.Terlambat) / total) * 100 : 0 };
			})
			.filter((r) => r.total)
	);
	const sum = $derived(Object.fromEntries(STATUS.map((s) => [s, rows.reduce((a, r) => a + r.c[s], 0)])));
	const all = $derived(STATUS.reduce((a, s) => a + sum[s], 0));

	function exportCsv() {
		downloadCsv(`Rekap Absensi ${from} sd ${to}`, ['NIK', 'Nama', 'Jabatan', ...STATUS, '% Hadir'], rows.map((r) => [r.e.nik, r.e.name, r.e.position, ...STATUS.map((s) => r.c[s]), num(r.rate)]));
	}
</script>

<ReportShell {leaf} subtitle="{fdate(from)} – {fdate(to)} · {days} hari tercatat" onexport={exportCsv}>
	{#snippet filters()}
		<PeriodFilter bind:from bind:to />
		<div class="col-span-2 sm:w-60"><span class="label">Site</span><Lookup table="sites" bind:value={siteId} placeholder="Semua site" clearable /></div>
	{/snippet}

	<div class="mb-4 grid grid-cols-3 gap-3 lg:grid-cols-6">
		{#each STATUS as s (s)}
			<div class="card p-3 sm:p-4">
				<p class="text-xs text-stone-500">{s}</p>
				<p class="mt-1 text-xl font-semibold tabular-nums {tone[s]}">{sum[s]}</p>
				<p class="text-[11px] text-stone-400">{all ? num((sum[s] / all) * 100) : 0}%</p>
			</div>
		{/each}
	</div>

	<div class="card overflow-x-auto">
		<table class="table-erp">
			<thead>
				<tr>
					<th>Pegawai</th>
					{#each STATUS as s (s)}<th class="text-center">{s}</th>{/each}
					<th class="min-w-36">Kehadiran</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r (r.e.id)}
					<tr>
						<td><span class="block font-medium whitespace-nowrap">{r.e.name}</span><span class="text-xs text-stone-400">{r.e.nik} · {r.e.position}</span></td>
						{#each STATUS as s (s)}<td class="text-center tabular-nums {r.c[s] ? tone[s] : 'text-stone-300 dark:text-stone-600'}">{r.c[s]}</td>{/each}
						<td>
							<div class="flex items-center gap-2">
								<div class="h-2 flex-1 rounded-full bg-stone-100 dark:bg-stone-800"><div class="h-2 rounded-full {r.rate >= 90 ? 'bg-emerald-500' : r.rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}" style="width:{r.rate}%"></div></div>
								<span class="w-10 text-right text-xs tabular-nums">{num(r.rate)}%</span>
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="8" class="py-10 text-center text-stone-400">Belum ada data absensi pada periode ini</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</ReportShell>
