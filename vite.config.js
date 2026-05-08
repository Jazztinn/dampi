import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Matches your repository name for GitHub Pages deployment
    base: '/dampi/', 
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:3001',
          changeOrigin: true,
          // Optional proxy - won't throw error if backend is unavailable
          ws: true,
        },
        '/health': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:3001',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    // Ensure build output goes to 'dist' for the GitHub Action to find it
    build: {
      outDir: 'dist',
    }
  };
});