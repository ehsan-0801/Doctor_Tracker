import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Each file starts its own in-memory MongoDB; the first run downloads the binary.
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
