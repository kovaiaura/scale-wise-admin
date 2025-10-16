import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Disable clearing the screen for better Tauri dev experience
  clearScreen: false,
  // Prevent Vite from obscuring Rust errors
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    rollupOptions: {
      // No need to externalize - desktop only
      external: [],
    },
  },
}));
