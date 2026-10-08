import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Three.js makes the bundle about 500 kB (≈130 kB gzipped), which is normal for a 3D app,
    // so raise the size warning instead of splitting the bundle.
    chunkSizeWarningLimit: 800,
  },
});
