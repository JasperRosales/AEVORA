import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // Split rarely-changing vendors out of the entry chunk. Screens are already
    // lazy per route (src/features/lazy-routes.ts); this keeps the initial file
    // small and lets browsers cache React/motion/auth independently of app code.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "vendor-motion", test: /node_modules[\\/]motion/ },
            { name: "vendor-auth", test: /node_modules[\\/]@neondatabase[\\/]/ },
          ],
        },
      },
    },
  },
})
