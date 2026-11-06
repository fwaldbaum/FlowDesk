import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The launcher UI loads from file:// inside Electron, so every asset path is relative.
export default defineConfig({
  root: 'renderer',
  base: './',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true, chunkSizeWarningLimit: 900, assetsInlineLimit: 0 },
  server: { port: 5190, host: '127.0.0.1' },
});
