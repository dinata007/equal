<script lang="ts">
	/**
	 * Input angka dengan edit mask format Indonesia: pemisah ribuan "." langsung saat mengetik,
	 * desimal ",". Posisi kursor dijaga, Backspace/Delete di dekat pemisah menghapus digitnya,
	 * tombol "." (numpad) dibaca sebagai koma desimal, dan tempel angka gaya apa pun (1,500.50 / 1.500,50) dikenali.
	 */
	let {
		value = $bindable(),
		money: isMoney = false,
		decimals,
		disabled = false,
		compact = false,
		id,
		placeholder = '0',
		oninput
	}: {
		value?: number | string;
		money?: boolean;
		/** jumlah desimal maksimum; default 0 untuk uang, 2 untuk angka */
		decimals?: number;
		disabled?: boolean;
		compact?: boolean;
		id?: string;
		placeholder?: string;
		oninput?: () => void;
	} = $props();

	const maxDec = $derived(decimals ?? (isMoney ? 0 : 2));
	const SIG = /[\d,-]/; // karakter "bermakna" (bukan pemisah ribuan) untuk menjaga posisi kursor

	/** teks bebas → teks ber-mask + nilai angka */
	function mask(s: string): { text: string; num: number | '' } {
		const neg = s.trim().startsWith('-');
		const cleaned = s.replace(/[^\d,]/g, '');
		const comma = maxDec > 0 && cleaned.includes(',');
		const [intRaw, ...rest] = cleaned.split(',');
		const int = intRaw.replace(/^0+(?=\d)/, '');
		const dec = rest.join('').slice(0, maxDec);
		const text = (neg ? '-' : '') + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (comma ? ',' + dec : '');
		const num = !int && !dec ? '' : Number(`${neg ? '-' : ''}${int || '0'}.${dec || '0'}`);
		return { text, num };
	}
	const fromValue = (v: number | string | undefined) => (v === '' || v == null || isNaN(Number(v)) ? '' : mask(String(v).replace('.', ',')).text);

	let el = $state<HTMLInputElement>();
	let focused = $state(false);
	// saat tidak difokus, tampilkan nilai dengan mask yang sama
	const shown = $derived(fromValue(value));

	/** tulis teks baru lalu kembalikan kursor setelah `sig` karakter bermakna */
	function apply(input: string, sig: number) {
		const { text, num } = mask(input);
		el!.value = text;
		value = num;
		let pos = 0;
		for (let n = 0; pos < text.length && n < sig; pos++) if (SIG.test(text[pos])) n++;
		el!.setSelectionRange(pos, pos);
		oninput?.();
	}
	const sigBefore = (s: string, i: number) => s.slice(0, i).replace(/[^\d,-]/g, '').length;

	function onInput() {
		const v = el!.value;
		apply(v, sigBefore(v, el!.selectionStart ?? v.length));
	}
	function onbeforeinput(e: InputEvent) {
		if (e.inputType !== 'insertText' || !e.data) return;
		const v = el!.value;
		const s = el!.selectionStart ?? v.length;
		const t = el!.selectionEnd ?? s;
		// teks beberapa karakter sekaligus (keyboard HP, autofill) → perlakukan seperti tempel
		if (e.data.length > 1) {
			e.preventDefault();
			insertText(e.data);
			return;
		}
		// numpad "." → koma desimal; huruf & karakter lain ditolak
		if (e.data === '.' || e.data === ',') {
			e.preventDefault();
			if (maxDec === 0 || (v.includes(',') && !v.slice(s, t).includes(','))) return;
			const next = v.slice(0, s) + ',' + v.slice(t);
			apply(next, sigBefore(v, s) + 1);
		} else if (!/^[\d-]+$/.test(e.data)) e.preventDefault();
	}
	function onkeydown(e: KeyboardEvent) {
		const v = el!.value;
		const s = el!.selectionStart ?? 0;
		if (s !== el!.selectionEnd) return;
		// Backspace tepat setelah "." / Delete tepat sebelum "." → hapus digit di sebelahnya
		if (e.key === 'Backspace' && v[s - 1] === '.') {
			e.preventDefault();
			apply(v.slice(0, s - 2) + v.slice(s - 1), sigBefore(v, s - 2));
		} else if (e.key === 'Delete' && v[s] === '.') {
			e.preventDefault();
			apply(v.slice(0, s + 1) + v.slice(s + 2), sigBefore(v, s));
		}
	}
	/** angka tempelan: tentukan pemisah desimal dari pola, lalu ubah ke format Indonesia */
	function onpaste(e: ClipboardEvent) {
		const txt = e.clipboardData?.getData('text') ?? '';
		if (!txt) return;
		e.preventDefault();
		insertText(txt);
	}
	function insertText(txt: string) {
		let s = txt.trim().replace(/[^\d.,-]/g, '');
		const lastDot = s.lastIndexOf('.');
		const lastComma = s.lastIndexOf(',');
		let decSep = '';
		if (lastDot >= 0 && lastComma >= 0) decSep = lastDot > lastComma ? '.' : ',';
		else if (lastComma >= 0) decSep = /^-?\d{1,3}(,\d{3})+$/.test(s) ? '' : ',';
		else if (lastDot >= 0) decSep = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? '' : '.';
		if (decSep) {
			const i = s.lastIndexOf(decSep);
			s = s.slice(0, i).replace(/[.,]/g, '') + ',' + s.slice(i + 1).replace(/[.,]/g, '');
		} else s = s.replace(/[.,]/g, '');
		const v = el!.value;
		const a = el!.selectionStart ?? v.length;
		const b = el!.selectionEnd ?? a;
		apply(v.slice(0, a) + s + v.slice(b), sigBefore(v, a) + s.replace(/[^\d,-]/g, '').length);
	}

	function onfocus() {
		focused = true;
		requestAnimationFrame(() => el?.select());
	}
	function onblur() {
		focused = false;
		// rapikan sisa koma di akhir, mis. "12," → "12"
		if (el) el.value = fromValue(value);
	}
</script>

<input
	bind:this={el}
	{id}
	class="input num {compact ? '!h-9 !rounded-lg' : ''} {Number(value) < 0 ? '!text-rose-600 dark:!text-rose-400' : ''}"
	inputmode="decimal"
	{placeholder}
	{disabled}
	value={focused ? el?.value : shown}
	{onfocus}
	{onblur}
	oninput={onInput}
	{onbeforeinput}
	{onkeydown}
	{onpaste}
	autocomplete="off"
/>
