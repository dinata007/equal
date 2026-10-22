/**
 * Navigasi keyboard form entry (gaya aplikasi ERP), sebagai Svelte attachment:
 *   <form {@attach formNav({ onsave: save, last: () => saveBtn })}>
 * - Enter        → pindah ke isian berikutnya (tidak menyimpan)
 * - Shift+Enter  → kembali ke isian sebelumnya
 * - Enter di isian terakhir → fokus ke tombol simpan (`last`), belum disimpan
 * - Ctrl/⌘+S atau Ctrl/⌘+Enter → simpan
 * Textarea tetap membuat baris baru; Enter di dalam dropdown/kalender tetap memilih.
 */
import type { Attachment } from 'svelte/attachments';

interface FormNavOpts {
	onsave?: () => void;
	/** elemen yang difokus setelah isian terakhir (biasanya tombol Simpan) */
	last?: () => HTMLElement | null | undefined;
}

/** elemen yang dianggap "isian" untuk lompatan Enter */
const FIELD = 'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]), textarea, button[aria-haspopup="listbox"], [role="switch"]';

const visible = (el: HTMLElement) => (el.checkVisibility ? el.checkVisibility() : el.offsetParent !== null);

export function fields(root: HTMLElement): HTMLElement[] {
	return [...root.querySelectorAll<HTMLElement>(FIELD)].filter(
		(el) => !el.closest('[popover]') && !(el as HTMLInputElement).disabled && !(el as HTMLInputElement).readOnly && el.tabIndex !== -1 && visible(el)
	);
}

export function formNav(opts: FormNavOpts = {}): Attachment<HTMLElement> {
	return (node) => {
		function onkeydown(e: KeyboardEvent) {
			const mod = e.ctrlKey || e.metaKey;
			if (mod && (e.key === 's' || e.key === 'S' || e.key === 'Enter')) {
				e.preventDefault();
				// isian yang sedang diketik (mis. angka/tanggal) dikomit lewat blur dulu
				(document.activeElement as HTMLElement | null)?.blur?.();
				opts.onsave?.();
				return;
			}
			if (e.key !== 'Enter' || e.altKey || mod || e.isComposing) return;
			const t = e.target as HTMLElement;
			if (t.closest('[popover]') || t.tagName === 'TEXTAREA' || !t.matches(FIELD)) return;
			const list = fields(node);
			const i = list.indexOf(t);
			if (i < 0) return;
			e.preventDefault(); // juga mencegah submit otomatis <form>
			const next = list[i + (e.shiftKey ? -1 : 1)];
			const target = next ?? (e.shiftKey ? null : opts.last?.());
			if (!target) return;
			target.focus();
			if (target instanceof HTMLInputElement && /^(text|search|tel|email|url|number|password|)$/.test(target.type)) target.select();
		}
		// tombol simpan biasanya di luar form (footer): Shift+Enter di sana → kembali ke isian terakhir
		function onLastKey(e: KeyboardEvent) {
			if (e.key !== 'Enter' || !e.shiftKey || e.target !== opts.last?.()) return;
			e.preventDefault();
			e.stopPropagation();
			fields(node).at(-1)?.focus();
		}
		node.addEventListener('keydown', onkeydown);
		addEventListener('keydown', onLastKey, true);
		return () => {
			node.removeEventListener('keydown', onkeydown);
			removeEventListener('keydown', onLastKey, true);
		};
	};
}
