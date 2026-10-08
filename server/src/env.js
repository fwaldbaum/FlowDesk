import { fileURLToPath } from 'node:url';

// Load the repo-root .env when present. Real environment variables take precedence.
try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}
