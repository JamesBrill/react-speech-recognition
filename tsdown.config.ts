import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.js",
  platform: "browser",
  format: ["esm", "cjs"],
  sourcemap: true,
  outputOptions: {
    exports: "named",
  },
});
