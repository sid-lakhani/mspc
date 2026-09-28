import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const define = { __APP_VERSION__: JSON.stringify(pkg.version) };

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  define,
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@brand': resolve(__dirname, 'docs'),
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to the MSPC server in development
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html')
    }
  }
});
