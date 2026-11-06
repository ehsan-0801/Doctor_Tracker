import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run the real backend and frontend against a dedicated
 * database (E2E_MONGODB_URI), which is reset and seeded before the run.
 * Ports 4100/3100 avoid clashing with the normal dev servers.
 */
const API_PORT = 4100;
const WEB_PORT = 3100;
const mongoUri = process.env.E2E_MONGODB_URI ?? "";

export const E2E_ADMIN = { email: "e2e-admin@example.com", password: "E2eAdmin1234" };

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    // Set PLAYWRIGHT_CHANNEL=chrome to use an installed Chrome instead of `npx playwright install chromium`.
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } }, testMatch: /mobile\.spec/ },
  ],
  webServer: [
    {
      command: "npx tsx src/server.ts",
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/api/health`,
      env: { MONGODB_URI: mongoUri, PORT: String(API_PORT), CLIENT_ORIGIN: `http://localhost:${WEB_PORT}`, NODE_ENV: "test" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx next build && npx next start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/login`,
      env: { API_URL: `http://localhost:${API_PORT}`, NEXT_PUBLIC_REALTIME_URL: `http://localhost:${API_PORT}`, NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
