// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SessionUser } from '#lib/domain/types.ts';

declare global {
	namespace App {
		interface Locals {
			/** pengguna yang login (null = belum login / sesi berakhir) */
			user: SessionUser | null;
			sessionId: string | null;
			/** .env sudah berisi koneksi database */
			dbReady: boolean;
			/** pesan bila database tidak bisa dihubungi */
			dbError: string | null;
		}
		// interface Error {}
		// interface PageData {}
		interface PageState {
			/** jumlah lapisan terbuka (sheet/dialog/dropdown) — tombol back menutupnya satu per satu, lihat dom/backClose.svelte.ts */
			layers?: number;
		}
		// interface Platform {}
	}
}

export {};
