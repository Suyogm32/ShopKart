const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  // Sequential: these tests share one database, so parallel runs would fight
  // over cart and account state.
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Reuses an already-running dev server if you have one, otherwise starts it.
  webServer: {
    command: "npm run dev",
    url: process.env.E2E_BASE_URL || "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
