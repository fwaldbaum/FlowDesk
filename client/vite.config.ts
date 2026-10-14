import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = process.env.API_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  // Runtime-relative asset URLs so the same build also works under zerosolutions.cl/flowdesk:
  // the proxy rewrites index.html, chunks resolve against window.__FD_BASE__, CSS uses relative paths.
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') return { runtime: `(window.__FD_BASE__||'')+${JSON.stringify(`/${filename}`)}` };
      if (hostType === 'css') return { relative: true };
      return undefined;
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': api,
      '/socket.io': { target: api, ws: true },
    },
  },
});
