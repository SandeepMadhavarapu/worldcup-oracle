import { expect, test } from "@playwright/test";

test.describe("core pages", () => {
  test("home page renders with navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/WorldCup Oracle/);
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
  });

  test("health endpoint reports ok with build info", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.status).toBe("ok");
    expect(payload.meta.requestId).toBeTruthy();
  });

  test("calibration page is honest about its data source", async ({ page }) => {
    await page.goto("/calibration");
    // Without a provider key CI runs in sample mode: the page must label the
    // synthetic source and never claim real accuracy.
    await expect(
      page.getByText(/Illustrative — no real matches resolved yet/).first(),
    ).toBeVisible();
  });

  test("model lab explains evaluation status without fake metrics", async ({ page }) => {
    await page.goto("/model-lab");
    await expect(page.getByText("Model Evaluation Status")).toBeVisible();
    await expect(
      page.getByText(/No out-of-sample evaluation has been published/),
    ).toBeVisible();
  });
});

test.describe("dashboard flows", () => {
  test("tabs switch and the predictor produces an explained prediction", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Tournament Intelligence Dashboard" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Predictor" }).click();
    await page.getByRole("button", { name: "Run prediction" }).click();

    await expect(page.getByText("Why this prediction?")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Scoreline distribution")).toBeVisible();
  });

  test("simulator reruns with a chosen iteration count", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("tab", { name: "Simulator" }).click();
    await page
      .getByRole("button", { name: "Run 500 Monte Carlo simulations" })
      .click();

    await expect(page.getByText(/Current run: 500 iterations/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("saving a bracket puts the entry on the leaderboard with a share link", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("tab", { name: "Leaderboard" }).click();

    await page.getByLabel("Display name").fill("E2E Reviewer");
    await page.getByRole("button", { name: "Save demo bracket" }).click();

    await expect(
      page.getByRole("link", { name: /View temporary bracket link/ }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("cell", { name: "E2E Reviewer" }).first(),
    ).toBeVisible();
  });

  test("keyboard navigation moves between tabs (WAI-ARIA tabs pattern)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const groupsTab = page.getByRole("tab", { name: "Groups" });
    await groupsTab.click();
    await groupsTab.press("ArrowRight");

    await expect(page.getByRole("tab", { name: "Predictor" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
