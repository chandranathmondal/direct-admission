import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'build',
      },
      plugins: [react()],
      define: {
        'process.env.REACT_APP_INITIAL_ADMIN_EMAIL': JSON.stringify(env.REACT_APP_INITIAL_ADMIN_EMAIL),
        'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(env.REACT_APP_GOOGLE_CLIENT_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
