import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const empty = fileURLToPath(new URL('./src/lib/stubs/empty.js', import.meta.url));

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// adapter-node: siap di-deploy ke server Windows/Linux berdampingan dengan MSSQL
			adapter: adapter()
		})
	],
	resolve: {
		// fitur jsPDF yang tidak dipakai (doc.html / SVG) → modul kosong, lihat src/lib/stubs/empty.js
		alias: { html2canvas: empty, canvg: empty, dompurify: empty }
	},
	server: {
		// dev: compile shell & halaman di background saat server menyala, agar pembukaan pertama tidak menunggu
		warmup: {
			clientFiles: ['./src/routes/**/+layout.svelte', './src/routes/**/+page.svelte', './src/lib/pages/**/*.svelte']
		}
	},
	optimizeDeps: {
		// dev: library yang terlambat ditemukan Vite (import() untuk export, popover) → tanpa ini halaman di-reload saat pertama dipakai
		include: ['@floating-ui/dom', 'fflate', 'jspdf', 'jspdf-autotable']
	}
});
