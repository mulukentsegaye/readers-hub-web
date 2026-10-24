import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      'epubjs': path.resolve(__dirname, './node_modules/epubjs/dist/epub.js'),
      'JSZip': path.resolve(__dirname, './node_modules/jszip/dist/jszip.min.js'),
      'jszip': path.resolve(__dirname, './node_modules/jszip/dist/jszip.min.js'),
    },
  },
  optimizeDeps: {
    include: ['epubjs', 'jszip'],
  },
  server: {
    port: 3000,
    open: false,
  },
});
