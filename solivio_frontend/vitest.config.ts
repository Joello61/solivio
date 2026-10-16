import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Une image importee arrive a next/image comme au build (StaticImageData), avec
// son apercu flou ; Vite seul n'en donnerait que l'URL.
const imagesStatiques = {
  name: "images-statiques",
  enforce: "pre" as const,
  load(id: string) {
    if (!/\.(png|jpe?g|webp)$/.test(id)) return null;
    const src = `/${path.relative(__dirname, id)}`;
    return `export default ${JSON.stringify({ src, width: 1600, height: 1067, blurDataURL: "data:image/jpeg;base64,AA" })};`;
  },
};

export default defineConfig({
  plugins: [react(), imagesStatiques],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["__tests__/e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
