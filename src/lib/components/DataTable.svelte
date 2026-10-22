<script lang="ts" generics="T extends Record<string, any>">
	/**
	 * Grid data untuk daftar besar:
	 * - scroll virtual (hanya baris terlihat yang di-render), header, kolom pertama & baris total menempel
	 * - cari + sorot hasil, filter per kolom (chip), multi-sort (Shift+klik)
	 * - atur kolom (tampil/sembunyi, urutan, lebar), kerapatan, tampilan tersimpan — per user
	 * - centang banyak baris + aksi massal, navigasi keyboard penuh
	 * HP: daftar kartu dengan muat otomatis saat menggulir.
	 */
	import { ArrowDown, ArrowUp, Check, ChevronDown, Columns3, Download, Funnel, Inbox, ListFilter, Minus, Pin, RotateCcw, Rows3, Rows4, Search, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { flushSync, onDestroy, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { MediaQuery, SvelteSet } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { downloadCsv, num } from '#lib/erp/format.ts';
	import { toast } from '#lib/erp/ui.svelte.ts';
	import { tooltip } from '#lib/ui/tooltip.ts';
	import Menu, { type MenuItem } from './Menu.svelte';
	import Popover from './Popover.svelte';
	import ColumnsPanel from './grid/ColumnsPanel.svelte';
	import ExcelFilter from './grid/ExcelFilter.svelte';
	import { autoWidth, blankPrefs, compare, compile, describe, filterType, fitWidth, highlight, isActive, loadPrefs, savePrefs, text, val, vkey, vlabel } from './grid/core.ts';
	import type { BulkAction, Col, FilterType, FilterValue, SortKey } from './types';

	let {
		rows,
		columns,
		query = $bindable(''),
		search = true,
		searchPlaceholder = 'Cari…',
		id,
		onrow,
		card,
		toolbar,
		empty = 'Belum ada data',
		initialSort,
		rowClass,
		rowKey,
		bulk = [],
		selectable = true,
		exportName
	}: {
		rows: T[];
		columns: Col<T>[];
		query?: string;
		/** tampilkan kotak cari di toolbar */
		search?: boolean;
		searchPlaceholder?: string;
		/** kunci penyimpanan pengaturan grid; default = path halaman */
		id?: string;
		onrow?: (row: T) => void;
		/** tampilan kartu untuk HP */
		card?: Snippet<[T]>;
		/** kontrol tambahan di toolbar (filter periode, tab status, …) */
		toolbar?: Snippet;
		empty?: string;
		initialSort?: SortKey;
		rowClass?: (row: T) => string;
		rowKey?: (row: T) => string;
		/** aksi untuk baris yang dicentang (Export selalu tersedia) */
		bulk?: BulkAction<T>[];
		selectable?: boolean;
		exportName?: string;
	} = $props();

	/* ---------------- preferensi tersimpan per user ---------------- */
	// svelte-ignore state_referenced_locally
	const storeKey = `senja:grid:${auth.user?.id ?? 'anon'}:${id ?? page.url.pathname}`;
	// diingat selama aplikasi terbuka (sessionStorage): pindah menu lalu kembali → tampilan tetap
	const saved = loadPrefs(storeKey);
	const { filters: savedFilters, query: savedQuery, ...savedPrefs } = saved;
	const prefs = $state(savedPrefs);
	let filters = $state<Record<string, FilterValue>>(savedFilters);
	// svelte-ignore state_referenced_locally
	if (!query && savedQuery) query = savedQuery;
	$effect(() => savePrefs(storeKey, { ...$state.snapshot(prefs), filters: $state.snapshot(filters), query }));

	/* ---------------- kolom ---------------- */
	const colMap = $derived(new Map(columns.map((c) => [c.key, c])));
	const ordered = $derived.by(() => {
		const keys = prefs.order.filter((k) => colMap.has(k));
		columns.forEach((c, i) => !keys.includes(c.key) && keys.splice(Math.min(i, keys.length), 0, c.key));
		return keys.map((k) => colMap.get(k)!);
	});
	const visible = $derived.by(() => {
		const v = ordered.filter((c) => !prefs.hidden.includes(c.key));
		return v.length ? v : ordered.slice(0, 1);
	});
	/** jenis data per kolom (teks/angka/tanggal); null = kolom tanpa filter */
	const kinds = $derived(Object.fromEntries(columns.map((c) => [c.key, c.filter === false ? null : filterType(c, rows)])) as Record<string, FilterType | null>);

	const wCache = new Map<string, number>();
	const widths = $derived.by(() => {
		const o: Record<string, number> = {};
		for (const c of visible) {
			let w = prefs.widths[c.key] ?? c.width ?? wCache.get(c.key);
			if (w == null && rows.length) wCache.set(c.key, (w = autoWidth(c, rows)));
			o[c.key] = w ?? 140;
		}
		return o;
	});

	/* ---------------- cari, filter, urut ---------------- */
	const sorts = $derived<SortKey[]>(prefs.sort ?? (initialSort ? [initialSort] : []));
	const terms = $derived(query.toLowerCase().split(/\s+/).filter(Boolean));
	const activeFilters = $derived(Object.entries(filters).filter(([k, f]) => colMap.has(k) && kinds[k] && isActive(f)));
	const preds = $derived(activeFilters.map(([k, f]) => [k, compile(f, kinds[k]!, colMap.get(k)!, rows)] as const));

	function passes(r: T, skip?: string) {
		for (const [k, p] of preds) if (k !== skip && !p(r)) return false;
		return true;
	}
	const searched = $derived.by(() => {
		if (!terms.length) return rows;
		return rows.filter((r) => {
			const hay = columns
				.map((c) => {
					const raw = String(val(c, r) ?? '');
					const shown = text(c, r);
					return shown === raw ? raw : `${raw} ${shown}`;
				})
				.join(' ')
				.toLowerCase();
			return terms.every((t) => hay.includes(t));
		});
	});
	const filtered = $derived.by(() => {
		const out = activeFilters.length ? searched.filter((r) => passes(r)) : searched.slice();
		const cs = sorts.map((s) => [colMap.get(s.key), s.dir] as const).filter(([c]) => c);
		if (cs.length)
			out.sort((a, b) => {
				for (const [c, d] of cs) {
					const x = compare(c!, a, b);
					if (x) return x * d;
				}
				return 0;
			});
		return out;
	});
	/** pilihan filter + jumlah, dengan filter kolom lain tetap berlaku */
	function facet(key: string) {
		const c = colMap.get(key)!;
		const type = kinds[key] ?? 'text';
		const counts = new Map<string, number>();
		for (const r of searched) {
			if (!passes(r, key)) continue;
			const k = vkey(type, c, r);
			counts.set(k, (counts.get(k) ?? 0) + 1);
		}
		const cur = filters[key];
		if (cur?.kind === 'values') for (const v of cur.values) if (!counts.has(v)) counts.set(v, 0);
		const cmp =
			type === 'number' ? (a: string, b: string) => Number(a) - Number(b) : type === 'date' ? (a: string, b: string) => a.localeCompare(b) : (a: string, b: string) => a.localeCompare(b, 'id', { numeric: true });
		// "(Kosong)" selalu di akhir, seperti Excel
		return [...counts]
			.sort(([a], [b]) => (!a ? 1 : !b ? -1 : cmp(a, b)))
			.map(([k, count]) => ({ key: k, label: vlabel(type, c, k), count }));
	}
	const describeFor = (k: string, f: FilterValue) => describe(f, kinds[k] ?? 'text', colMap.get(k)!);

	function toggleSort(c: Col<T>, multi: boolean) {
		if (c.sortable === false || justDragged()) return;
		const cur = sorts.find((s) => s.key === c.key);
		const next: SortKey | null = !cur ? { key: c.key, dir: 1 } : cur.dir === 1 ? { key: c.key, dir: -1 } : null;
		if (multi) {
			const rest = sorts.filter((s) => s.key !== c.key);
			prefs.sort = next ? (cur ? sorts.map((s) => (s.key === c.key ? next : s)) : [...rest, next]) : rest;
		} else prefs.sort = next ? [next] : [];
	}

	function setFilter(key: string, v: FilterValue | null) {
		if (v) filters[key] = v;
		else delete filters[key];
	}
	const fmtFor = (c: Col<T>) => (c.format ? (v: any) => c.format!(v) : num);

	/* ---------------- pilih baris ---------------- */
	const objIds = new WeakMap<object, string>();
	let objSeq = 0;
	function keyOf(r: T): string {
		if (rowKey) return rowKey(r);
		if (r.id != null) return String(r.id);
		let k = objIds.get(r);
		if (!k) objIds.set(r, (k = 'o' + ++objSeq));
		return k;
	}
	const selected = new SvelteSet<string>();
	let anchorIdx = -1;
	const selectedRows = $derived(selected.size ? filtered.filter((r) => selected.has(keyOf(r))) : []);
	const allSel = $derived(filtered.length > 0 && selectedRows.length === filtered.length);
	const someSel = $derived(selectedRows.length > 0 && !allSel);

	function toggleRow(i: number, range = false) {
		const k = keyOf(filtered[i]);
		if (range && anchorIdx >= 0 && anchorIdx < filtered.length) {
			const on = selected.has(keyOf(filtered[anchorIdx]));
			for (let j = Math.min(i, anchorIdx); j <= Math.max(i, anchorIdx); j++) {
				const kj = keyOf(filtered[j]);
				if (on) selected.add(kj);
				else selected.delete(kj);
			}
		} else if (selected.has(k)) selected.delete(k);
		else selected.add(k);
		anchorIdx = i;
	}
	function toggleAll() {
		if (allSel) selected.clear();
		else for (const r of filtered) selected.add(keyOf(r));
	}
	const bulkShown = $derived(bulk.map((a) => ({ a, n: a.when ? selectedRows.filter(a.when).length : selectedRows.length })).filter((x) => x.n > 0));
	async function runBulk(a: BulkAction<T>) {
		const target = a.when ? selectedRows.filter(a.when) : selectedRows;
		const res = await a.run(target);
		if (res !== false) selected.clear();
	}
	function exportRows(list: T[]) {
		const name = exportName ?? document.title.split(' · ')[0] ?? 'data';
		downloadCsv(
			name,
			visible.map((c) => c.label),
			list.map((r) => visible.map((c) => (typeof val(c, r) === 'number' ? val(c, r) : text(c, r))))
		);
	}

	/* ---------------- total ---------------- */
	const sumCols = $derived(visible.filter((c) => c.sum));
	const sums = $derived.by(() => {
		const src = selectedRows.length ? selectedRows : filtered;
		return Object.fromEntries(sumCols.map((c) => [c.key, src.reduce((s, r) => s + (Number(val(c, r)) || 0), 0)]));
	});
	const totalLabelKey = $derived(visible.find((c) => !c.sum)?.key);

	/* ---------------- scroll virtual ---------------- */
	let scroller = $state<HTMLDivElement>();
	let tbodyEl = $state<HTMLTableSectionElement>();
	let cardsEl = $state<HTMLUListElement>();
	let searchEl = $state<HTMLInputElement>();
	let scrollTop = $state(0);
	let scrolledX = $state(false);
	let viewH = $state(600);
	let headH = $state(40);
	let footH = $state(0);
	let measured = $state(0);
	let printing = $state(false);
	let mobileLimit = $state(30);

	const OVER = 10;
	const SEL_W = 44;
	const showSel = $derived(selectable && !printing);
	const selW = $derived(showSel ? SEL_W : 0);
	const fh = $derived(sumCols.length ? footH : 0);
	const RH = $derived(measured || (prefs.density === 'compact' ? 34 : 44));
	const start = $derived(printing ? 0 : Math.max(0, Math.floor(scrollTop / RH) - OVER));
	const end = $derived(printing ? filtered.length : Math.min(filtered.length, Math.ceil((scrollTop + viewH) / RH) + OVER));
	const slice = $derived(filtered.slice(start, end));
	const tableW = $derived(selW + visible.reduce((s, c) => s + widths[c.key], 0));

	/* ---------------- freeze kolom (freeze panes) ---------------- */
	const frozenN = $derived(Math.max(0, Math.min(prefs.freeze ?? 1, visible.length)));
	// posisi kiri tiap kolom freeze = lebar checkbox + lebar kolom freeze sebelumnya
	const lefts = $derived.by(() => {
		const o: number[] = [];
		let x = selW;
		for (let i = 0; i < frozenN; i++) ((o[i] = x), (x += widths[visible[i].key]));
		return o;
	});
	const frozenCls = (ci: number) => (ci < frozenN ? `dg-sticky${ci === frozenN - 1 ? ' dg-first' : ''}` : '');
	const frozenStyle = (ci: number, _key: string) => (ci < frozenN ? `left: ${lefts[ci]}px` : undefined);
	function setFreeze(key: string, on: boolean) {
		if (!on) {
			prefs.freeze = 0;
			return;
		}
		const ci = visible.findIndex((c) => c.key === key);
		const w = selW + visible.slice(0, ci + 1).reduce((s, c) => s + widths[c.key], 0);
		if (scroller && w > scroller.clientWidth * 0.75) return toast.error('Kolom yang di-freeze terlalu lebar untuk layar ini. Sembunyikan atau perkecil beberapa kolom dulu.');
		prefs.freeze = ci + 1;
	}
	const firstVis = $derived(filtered.length ? Math.min(filtered.length, Math.floor(scrollTop / RH) + 1) : 0);
	const lastVis = $derived(Math.max(firstVis, Math.min(filtered.length, Math.floor((scrollTop + viewH - headH - fh) / RH))));

	// tinggi baris sebenarnya (border & font bisa membuat ukuran berbeda dari nominal)
	$effect(() => {
		void prefs.density;
		if (!slice.length) return;
		tick().then(() => {
			const h = tbodyEl?.querySelector('tr[data-row]')?.getBoundingClientRect().height ?? 0;
			if (h && Math.abs(h - measured) > 0.1) measured = h;
		});
	});
	// cari/filter berubah → kembali ke atas, kosongkan pilihan
	$effect(() => {
		void query;
		void JSON.stringify(filters);
		untrack(() => {
			if (scroller) scroller.scrollTop = 0;
			scrollTop = 0;
			activeIdx = -1;
			selected.clear();
			mobileLimit = 30;
		});
	});
	$effect(() => {
		void sorts;
		untrack(() => {
			if (scroller) scroller.scrollTop = 0;
			scrollTop = 0;
		});
	});

	function onscroll() {
		scrollTop = scroller!.scrollTop;
		scrolledX = scroller!.scrollLeft > 0;
	}

	/* ---------------- sorot hasil cari ---------------- */
	const hlOwner = Symbol('grid');
	$effect(() => {
		void slice;
		void visible;
		void mobileLimit;
		const t = terms;
		tick().then(() => highlight(hlOwner, [tbodyEl, cardsEl], t));
	});
	onDestroy(() => highlight(hlOwner, [], []));

	/* ---------------- keyboard ---------------- */
	let activeIdx = $state(-1);
	function ensureVisible(i: number) {
		if (!scroller) return;
		const top = i * RH;
		const bottom = (i + 1) * RH;
		const room = viewH - headH - fh;
		if (top < scroller.scrollTop) scroller.scrollTop = top;
		else if (bottom > scroller.scrollTop + room) scroller.scrollTop = bottom - room;
	}
	function onGridKey(e: KeyboardEvent) {
		if (e.target !== scroller) return;
		const n = filtered.length;
		if (!n) return;
		const pageRows = Math.max(1, Math.floor((viewH - headH - fh) / RH) - 1);
		const cur = activeIdx < 0 ? firstVis - 1 : activeIdx;
		let to: number;
		switch (e.key) {
			case 'ArrowDown':
				to = activeIdx < 0 ? cur : cur + 1;
				break;
			case 'ArrowUp':
				to = cur - 1;
				break;
			case 'PageDown':
				to = cur + pageRows;
				break;
			case 'PageUp':
				to = cur - pageRows;
				break;
			case 'Home':
				to = 0;
				break;
			case 'End':
				to = n - 1;
				break;
			case 'Enter':
				if (activeIdx >= 0) onrow?.(filtered[activeIdx]);
				e.preventDefault();
				return;
			case ' ':
				if (showSel && activeIdx >= 0) toggleRow(activeIdx, e.shiftKey);
				e.preventDefault();
				return;
			case 'Escape':
				if (selected.size) (selected.clear(), e.preventDefault());
				return;
			case 'a':
				if ((e.ctrlKey || e.metaKey) && showSel) (e.preventDefault(), toggleAll());
				return;
			default:
				return;
		}
		e.preventDefault();
		to = Math.max(0, Math.min(n - 1, to));
		if (e.shiftKey && showSel) {
			selected.add(keyOf(filtered[Math.max(0, cur)]));
			selected.add(keyOf(filtered[to]));
		}
		activeIdx = to;
		ensureVisible(to);
	}
	function rowClick(e: MouseEvent, i: number) {
		if (justDragged()) return;
		activeIdx = i;
		if (showSel && (e.ctrlKey || e.metaKey)) toggleRow(i);
		else if (showSel && e.shiftKey) toggleRow(i, true);
		else onrow?.(filtered[i]);
	}
	const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
	function onWindowKey(e: KeyboardEvent) {
		if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || !searchEl?.offsetParent) return;
		if (document.querySelector(':popover-open:not(#app-tooltip)')) return;
		e.preventDefault();
		searchEl.focus();
		searchEl.select();
	}
	function onSearchKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' && filtered.length && scroller?.offsetParent) {
			e.preventDefault();
			activeIdx = 0;
			scroller.focus();
			ensureVisible(0);
		}
	}

	/* ---------------- ubah lebar kolom ---------------- */
	let resizing = $state<string | null>(null);
	function startResize(e: PointerEvent, c: Col<T>) {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		const el = e.currentTarget as HTMLElement;
		el.setPointerCapture(e.pointerId);
		const x0 = e.clientX;
		const w0 = widths[c.key];
		resizing = c.key;
		const move = (ev: PointerEvent) => (prefs.widths[c.key] = Math.round(Math.min(800, Math.max(56, w0 + ev.clientX - x0))));
		const up = () => {
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerup', up);
			el.removeEventListener('pointercancel', up);
			resizing = null;
		};
		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', up);
		el.addEventListener('pointercancel', up);
	}

	/* ---------------- popover filter / kolom / tampilan ---------------- */
	let filterPop = $state<Popover>();
	let filterKey = $state<string | null>(null);
	function openFilter(key: string, el: Element) {
		filterKey = key;
		filterPop?.show(el);
	}
	let filterMenuBtn = $state<HTMLButtonElement>();
	const filterItems = $derived<MenuItem[]>(
		ordered
			.filter((c) => kinds[c.key])
			.map((c) => ({ label: c.label, kbd: isActive(filters[c.key]) ? '●' : undefined, onclick: () => requestAnimationFrame(() => filterMenuBtn && openFilter(c.key, filterMenuBtn)) }))
	);

	function toggleHidden(key: string) {
		if (prefs.hidden.includes(key)) prefs.hidden = prefs.hidden.filter((k) => k !== key);
		else if (visible.length > 1) prefs.hidden = [...prefs.hidden, key];
	}
	function moveCol(from: number, to: number) {
		const keys = ordered.map((c) => c.key);
		keys.splice(to, 0, keys.splice(from, 1)[0]);
		prefs.order = keys;
	}

	/* ---------------- drag: pindah kolom (judul) & geser tabel (isi) ---------------- */
	let wrapEl = $state<HTMLDivElement>();
	let headRow = $state<HTMLTableRowElement>();
	/** kolom yang sedang di-drag: posisi kursor + indeks jatuh (di antara kolom tampil) */
	let colDrag = $state<{ key: string; label: string; x: number; y: number; drop: number; line: number } | null>(null);
	let panning = $state(false);
	let dragEndAt = 0; // klik tepat setelah drag diabaikan (agar tidak urut / membuka baris)
	const justDragged = () => performance.now() - dragEndAt < 250;

	/** gerakan mouse ≥ 6px baru dianggap drag; di bawah itu tetap klik biasa */
	function trackDrag(e: PointerEvent, onstart: () => void, onmove: (ev: PointerEvent, dx: number, dy: number) => void, onend: () => void) {
		const x0 = e.clientX;
		const y0 = e.clientY;
		let started = false;
		const move = (ev: PointerEvent) => {
			const dx = ev.clientX - x0;
			const dy = ev.clientY - y0;
			if (!started) {
				if (Math.hypot(dx, dy) < 6) return;
				started = true;
				getSelection()?.removeAllRanges();
				onstart();
			}
			ev.preventDefault();
			onmove(ev, dx, dy);
		};
		const up = () => {
			removeEventListener('pointermove', move);
			removeEventListener('pointerup', up);
			removeEventListener('pointercancel', up);
			if (started) ((dragEndAt = performance.now()), onend());
		};
		addEventListener('pointermove', move);
		addEventListener('pointerup', up);
		addEventListener('pointercancel', up);
	}

	function startColDrag(e: PointerEvent, c: Col<T>, ci: number) {
		if (e.button !== 0 || e.pointerType !== 'mouse' || (e.target as Element).closest('.dg-resize, [aria-haspopup]')) return;
		const ths = () => [...(headRow?.querySelectorAll<HTMLElement>('th[data-col]') ?? [])];
		trackDrag(
			e,
			() => (colDrag = { key: c.key, label: c.label, x: e.clientX, y: e.clientY, drop: ci, line: 0 }),
			(ev) => {
				// gulir otomatis saat kursor mendekati tepi kiri/kanan tabel
				const sr = scroller!.getBoundingClientRect();
				if (ev.clientX > sr.right - 48) scroller!.scrollLeft += 16;
				else if (ev.clientX < sr.left + 48) scroller!.scrollLeft -= 16;
				const list = ths();
				let drop = list.length;
				for (let i = 0; i < list.length; i++) {
					const r = list[i].getBoundingClientRect();
					if (ev.clientX < r.left + r.width / 2) {
						drop = i;
						break;
					}
				}
				const edge = drop < list.length ? list[drop].getBoundingClientRect().left : list[list.length - 1].getBoundingClientRect().right;
				colDrag = { key: c.key, label: c.label, x: ev.clientX, y: ev.clientY, drop, line: edge - wrapEl!.getBoundingClientRect().left };
			},
			() => {
				const d = colDrag;
				colDrag = null;
				if (!d) return;
				const to = d.drop > ci ? d.drop - 1 : d.drop;
				if (to === ci) return;
				// susun ulang kolom tampil; kolom tersembunyi tetap di tempatnya
				const vis = visible.map((x) => x.key);
				vis.splice(to, 0, vis.splice(ci, 1)[0]);
				let n = 0;
				prefs.order = ordered.map((x) => (prefs.hidden.includes(x.key) ? x.key : vis[n++]));
			}
		);
	}

	function startPan(e: PointerEvent) {
		if (e.button !== 0 || e.pointerType !== 'mouse' || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
		if ((e.target as Element).closest('button, a, input, [role="checkbox"], .dg-resize')) return;
		const left0 = scroller.scrollLeft;
		trackDrag(
			e,
			() => (panning = true),
			(_ev, dx) => (scroller!.scrollLeft = left0 - dx),
			() => (panning = false)
		);
	}

	function resetCols() {
		prefs.order = [];
		prefs.hidden = [];
		prefs.widths = {};
		prefs.freeze = 1;
		wCache.clear();
	}

	/** ada yang berbeda dari tampilan bawaan? → tampilkan tombol "kembalikan" */
	const customized = $derived(
		!!query || activeFilters.length > 0 || prefs.sort !== null || prefs.order.length > 0 || prefs.hidden.length > 0 || Object.keys(prefs.widths).length > 0 || prefs.density !== 'cozy' || prefs.freeze !== 1
	);
	function resetAll() {
		Object.assign(prefs, blankPrefs());
		wCache.clear();
		filters = {};
		query = '';
	}

	function clearAll() {
		filters = {};
		query = '';
	}

	/* ---------------- HP: muat otomatis ---------------- */
	const loadMore: Attachment<HTMLElement> = (node) => {
		const io = new IntersectionObserver(([e]) => e.isIntersecting && (mobileLimit += 30), { rootMargin: '600px' });
		io.observe(node);
		return () => io.disconnect();
	};

	/* ---------------- HP: toolbar menempel di bawah topbar ---------------- */
	const phone = new MediaQuery('(max-width: 767px)');
	const stickyBar = $derived(!!card && phone.current);
	let stuck = $state(false);
	let barW = $state(0);
	// kontrol tambahan sebaris dengan kotak cari hanya bila kartu cukup lebar (72rem); selain itu di bawahnya & tidak ikut menempel
	const wide = $derived(barW >= 72 * (typeof document === 'undefined' ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16));
	const watchStuck: Attachment<HTMLElement> = (node) => {
		const bar = node.nextElementSibling as HTMLElement;
		const top = parseFloat(getComputedStyle(bar).top) || 0;
		const io = new IntersectionObserver(([e]) => (stuck = !e.isIntersecting && e.boundingClientRect.top < top + 1), { rootMargin: `-${Math.ceil(top) + 1}px 0px 0px 0px` });
		io.observe(node);
		return () => (io.disconnect(), (stuck = false));
	};

	const alignCls = (c: Col<T>) => (c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : '');
	const hasFilterUi = $derived(filterItems.length > 0);
</script>

<svelte:window onkeydown={onWindowKey} onbeforeprint={() => flushSync(() => (printing = true))} onafterprint={() => (printing = false)} />

{#snippet chips()}
	<div class="no-print flex flex-wrap items-center gap-1.5 border-b border-stone-100 px-3 py-2 dark:border-stone-800 {stickyBar ? 'border-t border-b-0' : ''}">
		{#each activeFilters as [k, f] (k)}
			{@const c = colMap.get(k)!}
			<span class="inline-flex h-7 max-w-full items-center rounded-full border border-brand-200 bg-brand-50 pl-2.5 text-xs dark:border-brand-800 dark:bg-brand-500/10">
				<button type="button" class="inline-flex min-w-0 items-center gap-1" onclick={(e) => openFilter(k, e.currentTarget.parentElement!)}>
					<span class="text-stone-500">{c.label}:</span>
					<span class="max-w-48 truncate font-medium">{describeFor(k, f)}</span>
				</button>
				<button type="button" class="ml-0.5 grid size-6 place-items-center rounded-full text-stone-500 hover:bg-brand-100 hover:text-stone-800 dark:hover:bg-brand-500/20 dark:hover:text-stone-200" aria-label="Hapus filter {c.label}" onclick={() => setFilter(k, null)}>
					<X class="size-3" />
				</button>
			</span>
		{/each}
		<button type="button" class="rounded-full px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-200" onclick={() => (filters = {})}>Hapus semua</button>
	</div>
{/snippet}

<!-- ============ toolbar ============ -->
<!-- penanda: toolbar dianggap "menempel" begitu penanda ini lewat di bawah topbar -->
<div {@attach stickyBar ? watchStuck : undefined} aria-hidden="true"></div>
<div
	bind:clientWidth={barW}
	class="no-print border-b border-stone-100 dark:border-stone-800 {stickyBar ? 'sticky z-20 bg-white/90 backdrop-blur-xl transition-shadow duration-200 dark:bg-stone-900/90' : ''} {stickyBar && stuck
		? 'shadow-lg shadow-stone-900/8 dark:shadow-black/40'
		: ''}"
	style={stickyBar ? 'top: calc(3.5rem + env(safe-area-inset-top))' : undefined}
>
<div class="@container p-3">
<div class="flex flex-wrap items-center gap-2">
	{#if search}
		<div class="relative min-w-0 flex-1 @lg:w-64 @lg:flex-none">
			<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
			<input bind:this={searchEl} class="peer input pr-9 pl-9" placeholder={searchPlaceholder} bind:value={query} type="search" onkeydown={onSearchKey} aria-label="Cari" />
			{#if !query}
				<kbd class="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-stone-200 bg-stone-50 px-1.5 text-[10px] font-medium text-stone-400 peer-focus:hidden sm:block dark:border-stone-700 dark:bg-stone-800">/</kbd>
			{/if}
		</div>
	{/if}
	{#if toolbar && wide}
		<div class="min-w-0 flex-1">{@render toolbar()}</div>
	{/if}
	<div class="ml-auto flex shrink-0 items-center gap-1">
		{#if customized}
			<button type="button" class="btn btn-ghost btn-icon btn-sm text-stone-500" aria-label="Reset tampilan" {@attach tooltip()} onclick={resetAll}>
				<RotateCcw class="size-4" />
			</button>
		{/if}

		{#if hasFilterUi}
			<Menu items={filterItems} placement="bottom-end">
				{#snippet header()}<p class="px-3 pt-1.5 pb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">Filter berdasarkan</p>{/snippet}
				{#snippet trigger(props)}
					<button bind:this={filterMenuBtn} {...props} type="button" class="btn btn-ghost btn-sm aria-expanded:bg-stone-100 dark:aria-expanded:bg-stone-800 {activeFilters.length ? 'text-brand-700 dark:text-brand-300' : ''}" aria-label="Filter" {@attach tooltip()}>
						<ListFilter class="size-4" />
						<span class="hidden xl:inline">Filter</span>
						{#if activeFilters.length}<span class="grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">{activeFilters.length}</span>{/if}
					</button>
				{/snippet}
			</Menu>
		{/if}

		<div class="{card ? 'hidden md:contents' : 'contents'}">
			<Popover class="w-72" label="Atur kolom" placement="bottom-end">
				{#snippet trigger(props)}
					<button {...props} type="button" class="btn btn-ghost btn-sm aria-expanded:bg-stone-100 dark:aria-expanded:bg-stone-800" aria-label="Atur kolom" {@attach tooltip()}>
						<Columns3 class="size-4" />
						<span class="hidden xl:inline">Kolom</span>
						{#if prefs.hidden.length}<span class="text-[10px] text-stone-400 tabular-nums">{visible.length}/{columns.length}</span>{/if}
					</button>
				{/snippet}
				<ColumnsPanel columns={ordered.map((c) => ({ key: c.key, label: c.label, hideable: c.hideable !== false }))} hidden={prefs.hidden} ontoggle={toggleHidden} onmove={moveCol} onreset={resetCols} />
			</Popover>
			<button
				type="button"
				class="btn btn-ghost btn-icon btn-sm"
				aria-label={prefs.density === 'compact' ? 'Baris rapat · klik untuk nyaman' : 'Baris nyaman · klik untuk rapat'}
				{@attach tooltip()}
				onclick={() => (prefs.density = prefs.density === 'compact' ? 'cozy' : 'compact')}
			>
				{#if prefs.density === 'compact'}<Rows4 class="size-4" />{:else}<Rows3 class="size-4" />{/if}
			</button>
		</div>
	</div>
</div>
</div>
	{#if stickyBar && activeFilters.length}{@render chips()}{/if}
</div>

<!-- kontrol tambahan (periode, status, …): di HP tidak ikut menempel agar layar tetap lega -->
{#if toolbar && !wide}
	<div class="no-print @container border-b border-stone-100 p-3 dark:border-stone-800">{@render toolbar()}</div>
{/if}
{#if !stickyBar && activeFilters.length}{@render chips()}{/if}

{#if !filtered.length}
	<div class="flex flex-col items-center justify-center gap-2 py-16 text-center text-stone-400">
		<Inbox class="size-10 stroke-1" />
		<p class="text-sm">{query || activeFilters.length ? 'Tidak ada data yang cocok' : empty}</p>
		{#if query || activeFilters.length}
			<button type="button" class="btn btn-secondary btn-sm mt-1" onclick={clearAll}>Hapus cari & filter</button>
		{/if}
	</div>
{:else}
	<!-- ============ desktop / tablet: grid ============ -->
	<div bind:this={wrapEl} class="relative {card ? 'hidden md:block' : ''}">
		<!-- area gulir bisa difokus: navigasi baris dengan keyboard; drag isi tabel = geser ke samping -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={scroller}
			bind:clientHeight={viewH}
			onpointerdown={startPan}
			class="dg-scroll overflow-auto overscroll-x-contain outline-none {scrolledX ? 'is-scrolled-x' : ''} {resizing ? 'cursor-col-resize select-none' : ''} {panning || colDrag ? 'is-dragging' : ''}"
			style="max-height: calc(100dvh - 12.5rem)"
			tabindex="0"
			role="region"
			aria-label="Tabel data · panah atas/bawah untuk berpindah baris"
			{onscroll}
			onkeydown={onGridKey}
			onfocus={(e) => e.target === scroller && activeIdx < 0 && (activeIdx = firstVis - 1)}
		>
			<table class="dg" role="grid" style="width: max(100%, {tableW}px); --rh: {prefs.density === 'compact' ? 34 : 44}px" aria-rowcount={filtered.length + 1} aria-multiselectable={showSel || undefined}>
				<colgroup>
					{#if showSel}<col style="width: {SEL_W}px" />{/if}
					{#each visible as c (c.key)}<col style="width: {widths[c.key]}px" />{/each}
					<col />
				</colgroup>
				<thead bind:offsetHeight={headH}>
					<tr bind:this={headRow} aria-rowindex={1}>
						{#if showSel}
							<th class="dg-sticky dg-sel" style="left: 0">
								<button type="button" role="checkbox" aria-checked={allSel ? 'true' : someSel ? 'mixed' : 'false'} aria-label="Pilih semua baris" class="dg-check" class:on={allSel || someSel} onclick={toggleAll}>
									{#if allSel}<Check class="size-3" strokeWidth={3} />{:else if someSel}<Minus class="size-3" strokeWidth={3} />{/if}
								</button>
							</th>
						{/if}
						{#each visible as c, ci (c.key)}
							{@const si = sorts.findIndex((s) => s.key === c.key)}
							{@const s = sorts[si]}
							{@const fOn = isActive(filters[c.key])}
							<!-- drag judul = pindah kolom; klik = urut -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<th
								data-col={c.key}
								class="group relative {frozenCls(ci)} {colDrag?.key === c.key ? 'dg-dragging' : ''}"
								style={frozenStyle(ci, c.key)}
								aria-sort={s ? (s.dir === 1 ? 'ascending' : 'descending') : undefined}
								onpointerdown={(e) => (e.stopPropagation(), startColDrag(e, c, ci))}
							>
								<div class="flex items-center gap-1">
									<button
										type="button"
										class="flex min-w-0 flex-1 items-center gap-1 uppercase transition-colors hover:text-stone-800 dark:hover:text-stone-200 {c.align === 'right' ? 'justify-end' : c.align === 'center' ? 'justify-center' : ''} {s ? 'text-stone-800 dark:text-stone-200' : ''}"
										onclick={(e) => toggleSort(c, e.shiftKey)}
									>
										{#if ci === frozenN - 1 && prefs.freeze !== 1}<Pin class="size-3 shrink-0 text-brand-500" />{/if}
										<span class="truncate">{c.label}</span>
										{#if s}
											{#if s.dir === 1}<ArrowUp class="size-3 shrink-0 text-brand-600" />{:else}<ArrowDown class="size-3 shrink-0 text-brand-600" />{/if}
											{#if sorts.length > 1}<span class="-ml-0.5 text-[9px] font-bold text-brand-600">{si + 1}</span>{/if}
										{/if}
									</button>
									<!-- tombol ▾ ala Excel: sort, freeze, filter -->
									<button
										type="button"
										class="grid size-5 shrink-0 place-items-center rounded border transition {fOn
											? 'border-brand-500 bg-brand-500 text-white'
											: 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:text-stone-200'}"
										aria-label="{fOn ? 'Filter aktif' : 'Filter & urut'} · {c.label}"
										aria-haspopup="dialog"
										{@attach tooltip()}
										onclick={(e) => openFilter(c.key, e.currentTarget)}
									>
										{#if fOn}<Funnel class="size-3" />{:else}<ChevronDown class="size-3" />{/if}
									</button>
								</div>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<span class="dg-resize {resizing === c.key ? 'is-on' : ''}" onpointerdown={(e) => startResize(e, c)} ondblclick={() => (prefs.widths[c.key] = fitWidth(c, filtered))}></span>
							</th>
						{/each}
						<th class="dg-fill" aria-hidden="true"></th>
					</tr>
				</thead>
				<tbody bind:this={tbodyEl}>
					{#if start > 0}
						<tr class="dg-spacer" aria-hidden="true" style="height: {start * RH}px"><td colspan={visible.length + 2}></td></tr>
					{/if}
					{#each slice as r, j (keyOf(r))}
						{@const i = start + j}
						{@const sel = showSel && selected.has(keyOf(r))}
						<!-- keyboard ditangani di level grid (panah/Enter/Spasi) -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<tr
							data-row
							aria-rowindex={i + 2}
							aria-selected={showSel ? sel : undefined}
							class="{onrow ? 'cursor-pointer' : ''} {sel ? 'is-sel' : ''} {i === activeIdx ? 'is-active' : ''} {rowClass?.(r) ?? ''}"
							onmousedown={(e) => e.shiftKey && e.preventDefault()}
							onclick={(e) => rowClick(e, i)}
						>
							{#if showSel}
								<td class="dg-sticky dg-sel" style="left: 0">
									<button
										type="button"
										role="checkbox"
										tabindex="-1"
										aria-checked={sel}
										aria-label="Pilih baris"
										class="dg-check"
										class:on={sel}
										onclick={(e) => (e.stopPropagation(), (activeIdx = i), toggleRow(i, e.shiftKey))}
									>
										{#if sel}<Check class="size-3" strokeWidth={3} />{/if}
									</button>
								</td>
							{/if}
							{#each visible as c, ci (c.key)}
								<td class="{alignCls(c)} {c.class ?? ''} {frozenCls(ci)}" style={frozenStyle(ci, c.key)}>
									{#if c.cell}{@render c.cell(r)}{:else}{text(c, r)}{/if}
								</td>
							{/each}
							<td class="dg-fill"></td>
						</tr>
					{/each}
					{#if end < filtered.length}
						<tr class="dg-spacer" aria-hidden="true" style="height: {(filtered.length - end) * RH}px"><td colspan={visible.length + 2}></td></tr>
					{/if}
				</tbody>
				{#if sumCols.length}
					<tfoot bind:offsetHeight={footH}>
						<tr>
							{#if showSel}<td class="dg-sticky dg-sel" style="left: 0"></td>{/if}
							{#each visible as c, ci (c.key)}
								<td class="{alignCls(c)} {frozenCls(ci)}" style={frozenStyle(ci, c.key)}>
									{#if c.sum}{fmtFor(c)(sums[c.key])}{:else if c.key === totalLabelKey}
										{selectedRows.length ? `Total ${num(selectedRows.length)} terpilih` : 'Total'}
									{/if}
								</td>
							{/each}
							<td class="dg-fill"></td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>

		<!-- drag kolom: garis posisi jatuh + label mengikuti kursor -->
		{#if colDrag}
			<div class="pointer-events-none absolute top-0 z-30 w-0.5 -translate-x-1/2 rounded-full bg-brand-500 shadow-[0_0_0_3px] shadow-brand-500/20" style="left: {colDrag.line}px; height: {viewH}px"></div>
			<div class="pointer-events-none fixed z-[95] flex items-center gap-1.5 rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase shadow-xl dark:bg-stone-100 dark:text-stone-900" style="left: {colDrag.x + 14}px; top: {colDrag.y + 14}px">
				<Columns3 class="size-3.5" />{colDrag.label}
			</div>
		{/if}

		<!-- status -->
		<div class="no-print flex items-center justify-between gap-3 border-t border-stone-100 px-4 py-2 text-xs text-stone-500 dark:border-stone-800">
			<span class="tabular-nums">
				Baris {num(firstVis)}–{num(lastVis)} dari {num(filtered.length)}{#if filtered.length < rows.length}<span class="text-stone-400"> · disaring dari {num(rows.length)}</span>{/if}
			</span>
			<span class="hidden items-center gap-3 text-stone-400 xl:flex">
				<span><kbd class="dg-kbd">/</kbd> cari</span>
				<span><kbd class="dg-kbd">↑</kbd><kbd class="dg-kbd">↓</kbd> pindah</span>
				<span><kbd class="dg-kbd">Enter</kbd> buka</span>
				{#if showSel}<span><kbd class="dg-kbd">Spasi</kbd> centang</span>{/if}
				<span><kbd class="dg-kbd">Shift</kbd>+klik judul: multi-sort</span>
			</span>
		</div>

		<!-- aksi massal -->
		{#if selectedRows.length}
			<div class="no-print pointer-events-none absolute inset-x-0 z-10 flex justify-center px-3" style="bottom: {fh + 44}px">
				<div
					transition:fly={{ y: 12, duration: 160 }}
					class="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-stone-900 p-1.5 pl-4 text-sm text-white shadow-2xl shadow-stone-900/30 dark:bg-stone-100 dark:text-stone-900"
					role="toolbar"
					aria-label="Aksi untuk baris terpilih"
				>
					<span class="font-medium whitespace-nowrap tabular-nums">{num(selectedRows.length)} terpilih</span>
					{#if !allSel}
						<button type="button" class="ml-1 rounded-lg px-2 py-1 text-xs whitespace-nowrap text-white/60 hover:bg-white/10 hover:text-white dark:text-stone-500 dark:hover:bg-stone-900/10 dark:hover:text-stone-900" onclick={toggleAll}>
							Pilih semua {num(filtered.length)}
						</button>
					{/if}
					<span class="mx-1 h-5 w-px shrink-0 bg-white/15 dark:bg-stone-900/15"></span>
					<button type="button" class="btn btn-sm text-white hover:bg-white/10 dark:text-stone-900 dark:hover:bg-stone-900/10" onclick={() => exportRows(selectedRows)}><Download class="size-3.5" /> Export</button>
					{#each bulkShown as { a, n } (a.label)}
						<button
							type="button"
							class="btn btn-sm {a.danger ? 'text-rose-300 hover:bg-rose-500/20 dark:text-rose-600 dark:hover:bg-rose-500/10' : 'text-white hover:bg-white/10 dark:text-stone-900 dark:hover:bg-stone-900/10'}"
							onclick={() => runBulk(a)}
						>
							{#if a.icon}<a.icon class="size-3.5" />{/if}
							{a.label}{#if n !== selectedRows.length}<span class="opacity-60">({num(n)})</span>{/if}
						</button>
					{/each}
					<button type="button" class="btn btn-icon btn-sm text-white/70 hover:bg-white/10 hover:text-white dark:text-stone-500 dark:hover:bg-stone-900/10 dark:hover:text-stone-900" aria-label="Batalkan pilihan (Esc)" {@attach tooltip()} onclick={() => selected.clear()}>
						<X class="size-4" />
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- ============ HP: kartu ============ -->
	{#if card}
		<ul bind:this={cardsEl} class="divide-y divide-stone-100 md:hidden dark:divide-stone-800">
			{#each filtered.slice(0, mobileLimit) as r (keyOf(r))}
				<li>
					<button class="block w-full px-4 py-3 text-left focus-visible:-outline-offset-2 active:bg-stone-50 dark:active:bg-stone-800/50" onclick={() => onrow?.(r)}>
						{@render card(r)}
					</button>
				</li>
			{/each}
		</ul>
		<div class="flex items-center justify-center gap-2 px-4 py-3 text-xs text-stone-400 md:hidden">
			{num(Math.min(mobileLimit, filtered.length))} dari {num(filtered.length)}
			{#if filtered.length > mobileLimit}
				{#key mobileLimit}<span {@attach loadMore} class="size-1.5 animate-pulse rounded-full bg-stone-300"></span>{/key}
			{/if}
		</div>
	{/if}
{/if}

<Popover bind:this={filterPop} class="flex w-80 flex-col overflow-hidden" maxHeight={600} label={filterKey ? `Filter ${colMap.get(filterKey)?.label ?? ''}` : 'Filter'} placement="bottom-start" onclose={() => (filterKey = null)}>
	{#if filterKey && colMap.get(filterKey) && kinds[filterKey]}
		{@const c = colMap.get(filterKey)!}
		{@const k = filterKey}
		{@const ci = visible.findIndex((x) => x.key === k)}
		{#key k}
			<ExcelFilter
				label={c.label}
				type={kinds[k]!}
				value={isActive(filters[k]) ? filters[k] : undefined}
				options={() => facet(k)}
				sortDir={sorts.length === 1 && sorts[0].key === k ? sorts[0].dir : null}
				money={!!c.format}
				describeCond={(f) => describeFor(k, f)}
				freeze={ci >= 0 && !stickyBar ? { last: ci === frozenN - 1, count: frozenN } : undefined}
				onfreeze={(on) => (setFreeze(k, on), filterPop?.hide())}
				onsort={(dir) => ((prefs.sort = [{ key: k, dir }]), filterPop?.hide())}
				onapply={(v) => (setFilter(k, v), filterPop?.hide())}
				oncancel={() => filterPop?.hide()}
			/>
		{/key}
	{/if}
</Popover>
