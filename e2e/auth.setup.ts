import { test as setup, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures/test-data";

const authFile = ".auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/auth/login");

  await page.getByPlaceholder("Enter your email").fill(TEST_USER.email);
  await page.getByPlaceholder("Enter your password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: /sign in/i })).not.toBeVisible();

  await page.context().storageState({ path: authFile });
});
