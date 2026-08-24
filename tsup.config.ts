import { defineConfig } from "tsup";

export default defineConfig([
  // Core Entry: Pure TypeScript (zero React/DOM dependencies, no "use client" banner)
  {
    entry: { core: "src/core.ts" },
    format: ["cjs", "esm"],
    dts: true,
    tsconfig: "tsconfig.build.json",
    sourcemap: true,
    clean: true,
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : ".cjs",
      };
    },
  },
  // React & Main Entries (React / DOM components with "use client" banner)
  {
    entry: {
      index: "index.ts",
      react: "src/react.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    tsconfig: "tsconfig.build.json",
    sourcemap: true,
    clean: false,
    external: ["react", "react-dom"],
    banner: {
      js: '"use client";',
    },
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : ".cjs",
      };
    },
  },
]);
