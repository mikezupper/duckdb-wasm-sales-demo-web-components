import { defineConfig } from 'vite';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    plugins:[wasm(),topLevelAwait()],
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                main: 'index.html',
            }
        }
    },
    worker: {
        format: 'es',
        plugins: () => [wasm(), topLevelAwait()]
    },
    optimizeDeps: {
        exclude: ['@duckdb/duckdb-wasm'],
        esbuildOptions: {
            target: 'esnext',
            supported: {
                'top-level-await': true
            }
        }
    },
    esbuild: {
        target: 'esnext',
        supported: {
            'top-level-await': true
        }
    }
});
