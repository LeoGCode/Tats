import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// SHOWCASE=1 slows every action down and records video, for demos.
const showcase = !!process.env.SHOWCASE;
const desktop = { width: 1280, height: 800 };
const video = (size: { width: number; height: number }) =>
  showcase ? { mode: "on" as const, size } : ("retain-on-failure" as const);

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: showcase ? 180_000 : 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: "only-on-failure",
    launchOptions: { slowMo: showcase ? 250 : 0 },
  },
  projects: [
    { name: "student", testMatch: "student.spec.ts", use: { ...devices["Pixel 7"], video: video(devices["Pixel 7"].viewport) } },
    {
      name: "teacher",
      testMatch: "teacher.spec.ts",
      dependencies: ["student"],
      use: { ...devices["Desktop Chrome"], viewport: desktop, video: video(desktop) },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { DATA_DIR: ".data-e2e" },
  },
});
