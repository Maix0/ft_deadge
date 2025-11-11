import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [
		tailwindcss(),
		tsconfigPaths(),
	],
	server: {
		hmr: {
			protocol: 'ws',
			host: 'localhost',
			port: 5137,
		}
	}
});
