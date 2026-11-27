import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: command === 'build' ? env.VITE_BASE_PATH || '/' : '/',
    plugins: [react(), tailwindcss()],
    worker: {
      format: 'es',
    },
    server: {
      port: 5173,
    },
  };
});
