import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
  build: {
    // CSP 호환성을 위해 sourcemap 비활성화 (eval 사용 방지)
    sourcemap: false,
    // esbuild minify 사용 (eval 사용 방지)
    minify: "esbuild",
    rollupOptions: {
      output: {
        // eval 사용 방지
        format: "es",
      },
    },
  },
});
