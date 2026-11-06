import { expect, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../playwright.config";

export async function signIn(page: Page, target = "/dashboard") {
  await page.goto(`/login?from=${encodeURIComponent(target)}`);
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`**${target}`);
}

/** Visible data rows of the desktop table (hidden, still-mounted routes are excluded). */
export const tableRows = (page: Page) => page.locator("main table:visible tbody tr");

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
}

export const unique = () => Date.now().toString(36);
