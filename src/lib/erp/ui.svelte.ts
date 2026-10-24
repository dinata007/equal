import { browser } from '$app/env';

/* ---------- Toast ---------- */
export type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
	id: number;
	kind: ToastKind;
	message: string;
}
let seq = 0;
class Toasts {
	items = $state<ToastItem[]>([]);
	push(kind: ToastKind, message: string, ms = 3500) {
		const id = ++seq;
		this.items.push({ id, kind, message });
		setTimeout(() => this.dismiss(id), ms);
	}
	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
	success = (m: string) => this.push('success', m);
	error = (m: string) => this.push('error', m, 5000);
	info = (m: string) => this.push('info', m);
}
export const toast = new Toasts();

/* ---------- Konfirmasi ---------- */
interface ConfirmOpts {
	title: string;
	message?: string;
	confirmText?: string;
	danger?: boolean;
}
class Confirm {
	current = $state<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
	ask(opts: ConfirmOpts) {
		return new Promise<boolean>((resolve) => (this.current = { ...opts, resolve }));
	}
	close(v: boolean) {
		this.current?.resolve(v);
		this.current = null;
	}
}
export const confirmDialog = new Confirm();
export const ask = (o: ConfirmOpts) => confirmDialog.ask(o);

/* ---------- Shell (tema ada di appearance.svelte.ts) ---------- */
class Shell {
	drawer = $state(false);
	palette = $state(false);
	collapsed = $state(browser && localStorage.getItem('senja:collapsed') === '1');

	toggleCollapsed() {
		this.collapsed = !this.collapsed;
		localStorage.setItem('senja:collapsed', this.collapsed ? '1' : '0');
	}
}
export const shell = new Shell();
