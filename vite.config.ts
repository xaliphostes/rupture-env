import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/rupture-env',
    server: {
        port: 3000,
        open: true,
    },
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

