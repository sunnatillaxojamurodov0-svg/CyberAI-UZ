import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { resolve } from "path";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: {
        "cloudflare:workers": resolve(__dirname, ".cloudflare-mock/workers.js"),
        "cloudflare:workflows": resolve(__dirname, ".cloudflare-mock/workers.js"),
      },
    },
    ssr: {
      external: [],
      noExternal: [],
    },
  },
});
