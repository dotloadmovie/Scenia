import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  server: {
    host: "0.0.0.0",
    port: 5175
  },
  preview: {
    host: "0.0.0.0",
    port: 5175
  }
});
