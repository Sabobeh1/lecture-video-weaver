
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // This ensures import.meta.env has the correct values
    // We can use these values in our code
    "import.meta.env.VITE_SSH_HOST": JSON.stringify(process.env.VITE_SSH_HOST || "176.119.254.185"),
    "import.meta.env.VITE_SSH_PORT": JSON.stringify(process.env.VITE_SSH_PORT || "22"),
    "import.meta.env.VITE_SSH_USER": JSON.stringify(process.env.VITE_SSH_USER || "sabobeh"),
    "import.meta.env.VITE_SSH_TARGET_DIR": JSON.stringify(process.env.VITE_SSH_TARGET_DIR || "/sabobeh/FileFromUser#"),
  }
}));
