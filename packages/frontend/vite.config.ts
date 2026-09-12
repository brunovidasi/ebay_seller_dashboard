import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Backend serves HTTPS in dev (eBay's RuName requires an https:// redirect
      // URL); `secure: false` skips the self-signed cert check for this proxy.
      "/api": {
        target: "https://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
