import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                main: 'index.html',
            }
        }
    },
    worker: {
        format: 'es'
    },
    optimizeDeps: {
        exclude: ['@duckdb/duckdb-wasm']
    },
    esbuild: {
        target: 'esnext'
    }
});
