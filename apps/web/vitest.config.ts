import { mergeConfig, defineConfig } from "vitest/config";
import { baseConfig } from "@repo/vitestconfig/base";
import path from "path";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["src/**/*.test.ts"],
    },
    resolve: {
      alias: {
        "@domain": path.resolve(__dirname, "./src/domain"),
        "@application": path.resolve(__dirname, "./src/application"),
        "@contracts": path.resolve(__dirname, "./src/contracts"),
        "@infrastructure": path.resolve(__dirname, "./src/infrastructure"),
        "@ui": path.resolve(__dirname, "./src/ui"),
        "@shared": path.resolve(__dirname, "./src/shared"),
        "@": path.resolve(__dirname, "."),
      },
    },
  })
);
