import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site under /<repo-name>/, so we set base accordingly.
// If you fork this and rename the repo, change "compass-investment-assistant" below.
export default defineConfig({
  plugins: [react()],
  base: "/compass-investment-assistant/",
  server: {
    port: 5173,
  },
});
