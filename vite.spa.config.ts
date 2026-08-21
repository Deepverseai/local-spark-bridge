import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

/**
 * Separate Vite config for the Capacitor SPA build.
 *
 * Produces a pure client-side static bundle (no SSR/nitro) in dist-spa/.
 * This is what Capacitor loads into the Android WebView.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  build: {
    outDir: "../dist-spa",
    emptyOutDir: true,
  },
  root: "spa",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
