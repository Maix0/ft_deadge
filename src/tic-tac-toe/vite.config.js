import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import path from 'node:path';
import fs from 'node:fs';

function collectDeps(...pkgJsonPaths) {
	const allDeps = new Set();
	for (const pkgPath of pkgJsonPaths) {
		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
		for (const dep of Object.keys(pkg.dependencies || {})) {
			allDeps.add(dep);
		}
		for (const peer of Object.keys(pkg.peerDependencies || {})) {
			allDeps.add(peer);
		}
	}
	return Array.from(allDeps);
}

const externals = collectDeps(
	'./package.json',
	'../@shared/package.json',
);


export default defineConfig({
	root: __dirname,
	define: {
		__SERVICE_NAME: '"ttt"',
	},
	// service root
	plugins: [tsconfigPaths(), nodeExternals()],
	build: {
		ssr: true,
		outDir: 'dist',
		emptyOutDir: true,
		lib: {
			entry: path.resolve(__dirname, process.env.VITE_ENTRYPOINT ?? 'src/run.ts'),
			// adjust main entry
			formats: ['cjs'],
			// CommonJS for Node.js
			fileName: (format, entryName) => `${entryName}.cjs`,
		},
		rollupOptions: {
			external: externals,
		},
		target: 'node22',
		// or whatever Node version you use
		sourcemap: true,
		minify: false,
		// for easier debugging
	},
});
