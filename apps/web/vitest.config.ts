import { mergeConfig, defineConfig } from "vitest/config";
import { baseConfig } from "@repo/vitestconfig/base";
import react from "@vitejs/plugin-react";
import path from "path";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      include: ["src/**/*.test.ts", "app/**/*.test.ts", "app/**/*.test.tsx"],
    },
    resolve: {
      alias: {
        "@domain": path.resolve(__dirname, "./src/domain"),
        "@application": path.resolve(__dirname, "./src/application"),
        "@contracts": path.resolve(__dirname, "../../packages/contracts/src"),
        "@infrastructure": path.resolve(__dirname, "./src/infrastructure"),
        "@ui": path.resolve(__dirname, "./src/ui"),
        "@shared": path.resolve(__dirname, "./src/shared"),
        "@": path.resolve(__dirname, "."),
      },
    },
  })
);
