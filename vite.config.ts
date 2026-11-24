// Vite is retained only as a TypeScript module loader for the existing Node tests.
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({ optimizeDeps: { noDiscovery: true }, resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } } });
