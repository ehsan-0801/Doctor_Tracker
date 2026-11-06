import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "../playwright.config";
import { signIn } from "./helpers";

test.describe("authentication", () => {
  test("redirects signed-out visitors to login and back after sign-in", async ({ page }) => {
    await page.goto("/patients");
    await expect(page).toHaveURL(/\/login\?from=%2Fpatients/);
    await page.getByLabel("Email").fill(E2E_ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/patients$/);
  });

  test("validates fields and rejects wrong credentials without leaking them into the URL", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();

    await page.getByLabel("Email").fill(E2E_ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Invalid email or password" })).toBeVisible();
    expect(page.url()).not.toContain("password");
  });

  test("toggles password visibility", async ({ page }) => {
    await page.goto("/login");
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
  });

  test("signs out and blocks protected pages afterwards", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
