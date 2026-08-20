import { expect, test } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("home redirects into a locale and shows D&A", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(uk|en|ru)(\/|$)/);
    await expect(page.getByRole("link", { name: /D&A/i }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Dreams & Anime");
  });

  test("catalog loads in UK locale", async ({ page }) => {
    await page.goto("/uk/catalog");
    await expect(page.locator("main, #main").first()).toBeVisible();
  });

  test("language switcher flips to EN", async ({ page }) => {
    await page.goto("/uk");
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page).toHaveURL(/\/en(\/|$)/);
    await expect(page.getByRole("link", { name: "Catalog" }).first()).toBeVisible();
  });

  test("robots disallows admin", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("Disallow: /admin");
  });
});

test.describe("admin gate", () => {
  test("admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("body")).toContainText(/Admin|D&A/i);
  });
});
