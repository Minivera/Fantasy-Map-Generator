import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});