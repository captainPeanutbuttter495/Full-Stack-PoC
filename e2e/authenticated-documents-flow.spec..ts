import { test, expect } from "@playwright/test";

test("homepage → signin → documents → payment modal → logout", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /pay what you think/i })
  ).toBeVisible();

  await expect(page.getByRole("link", { name: /sign in/i })).not.toBeVisible();

  await page.getByRole("link", { name: /browse documents/i }).click();
  await expect(page).toHaveURL(/\/documents/);

  await expect(
    page.getByRole("heading", { name: "Documents" })
  ).toBeVisible();

  const selectButton = page.getByRole("button", { name: "Select" }).first();
  await expect(selectButton).toBeVisible();
  await selectButton.click();

  await expect(page.getByText("Enter your payment amount:")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit Payment" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator('[data-slot="dialog-overlay"]')).not.toBeVisible();

  await page.locator('[data-slot="dropdown-menu-trigger"]').click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(
    page.getByRole("link", { name: /sign in/i })
  ).toBeVisible();
});
