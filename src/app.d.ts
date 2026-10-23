// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SessionUser } from '#lib/erp/types.ts';

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
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
