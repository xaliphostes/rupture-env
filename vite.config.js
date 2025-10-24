import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: 'public',
    base: '/arch-platform/', // must match your GitHub repo name
    // assetsInclude: ['**/*.ts'], // Tell Vite to treat .ts files in public as assets
    optimizeDeps: {
        include: ['@kitware/vtk.js'],
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            onwarn: function (warning, warn) {
                var _a;
                // Suppress warnings from node_modules
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE')
                    return;
                if (warning.loc && ((_a = warning.loc.file) === null || _a === void 0 ? void 0 : _a.includes('node_modules')))
                    return;
                warn(warning);
            }
        }
    }
});
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// export default defineConfig({
//     plugins: [react()],
//     base: './src',
//     build: {
//         outDir: 'dist',
//         sourcemap: true,
//     },
//     server: {
//         port: 3000,
//         open: true,
//     },
//     optimizeDeps: {
//         include: ['@kitware/vtk.js'],
//     },
// });
