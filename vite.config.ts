import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: 'public',
    base: '/rupture-env/', // must match your GitHub repo name
    // assetsInclude: ['**/*.ts'], // Tell Vite to treat .ts files in public as assets
    optimizeDeps: {
        include: ['@kitware/vtk.js'],
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            onwarn(warning, warn) {
                // Suppress warnings from node_modules
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
                if (warning.loc && warning.loc.file?.includes('node_modules')) return;
                warn(warning);
            }
        }
    }
});

