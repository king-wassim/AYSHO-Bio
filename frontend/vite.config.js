import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
export default defineConfig({
    plugins: [
        react(),
        compression({
            algorithm: 'gzip',
            exclude: [/\.(br)$/, /\.(gz)$/],
            threshold: 1024,
        }),
        compression({
            algorithm: 'brotliCompress',
            exclude: [/\.(br)$/, /\.(gz)$/],
            threshold: 1024,
        }),
    ],
    server: {
        host: true,
        port: 5173,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['@headlessui/react', '@heroicons/react'],
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: function (assetInfo) {
                    var _a;
                    var name = (_a = assetInfo.name) !== null && _a !== void 0 ? _a : 'unknown';
                    var info = name.split('.');
                    var ext = info[info.length - 1];
                    if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(name)) {
                        return "assets/images/[name]-[hash].".concat(ext);
                    }
                    if (/\.(woff2?|ttf|eot)$/.test(name)) {
                        return "assets/fonts/[name]-[hash].".concat(ext);
                    }
                    if (/\.css$/.test(name)) {
                        return "assets/css/[name]-[hash].".concat(ext);
                    }
                    return "assets/[name]-[hash].".concat(ext);
                },
            },
        },
        chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
    },
    preview: {
        port: 4173,
        host: true,
    },
});
