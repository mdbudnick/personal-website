import { defineConfig } from "cypress";

export default defineConfig({
  // python3 -m http.server --directory www 3000
  e2e: {
    baseUrl: "http://localhost:3000/"
  }
});
