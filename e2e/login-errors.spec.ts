import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures/test-data";

test.use({ storageState: { cookies: [], origins: [] } });

test("correct email, wrong password", async ({ page }) => {
  await page.goto("/auth/login");

  await page.getByPlaceholder("Enter your email").fill(TEST_USER.email);
  await page.getByPlaceholder("Enter your password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.locator(".text-destructive")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("email does not exist", async ({ page }) => {
  await page.goto("/auth/login");

  await page.getByPlaceholder("Enter your email").fill("nonexistent@example.com");
  await page.getByPlaceholder("Enter your password").fill("some-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.locator(".text-destructive")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
});
