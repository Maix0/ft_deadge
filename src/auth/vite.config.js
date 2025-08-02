import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import nodeExternals from 'rollup-plugin-node-externals'
import path from 'node:path'

export default defineConfig({
	root: __dirname, // service root
	plugins: [tsconfigPaths(), nodeExternals()],
	build: {

		ssr: true,
		outDir: 'dist',
		emptyOutDir: true,
		lib: {
			entry: path.resolve(__dirname, 'src/run.ts'), // adjust main entry
			formats: ['cjs'], // CommonJS for Node.js
			fileName: () => 'index.js',
		},
		rollupOptions: {
			external: [],
		},
		target: 'node24', // or whatever Node version you use
		sourcemap: true,
		minify: false, // for easier debugging
	}
})
