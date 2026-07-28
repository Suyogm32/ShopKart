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

  // Port must be explicit: `next dev` defaults to 3000 and only lands on 3001
  // locally because the seller portal already holds 3000. On CI nothing does.
  // CI also runs a production build first, so serve that rather than dev.
  webServer: {
    command: process.env.CI ? "npx next start -p 3001" : "npm run dev -- -p 3001",
    url: process.env.E2E_BASE_URL || "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
