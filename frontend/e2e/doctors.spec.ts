import { expect, test } from "@playwright/test";
import { signIn, tableRows, unique } from "./helpers";

test.describe("doctors", () => {
  test.beforeEach(async ({ page }) => signIn(page, "/doctors"));

  test("lists, searches, sorts and paginates doctors", async ({ page }) => {
    await expect(tableRows(page)).toHaveCount(10);
    await expect(page.getByText(/Showing 1–10 of \d+ doctors/)).toBeVisible();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);

    await page.getByRole("button", { name: "Doctor", exact: true }).click();
    await expect(page).toHaveURL(/sortBy=name&sortOrder=asc/);
    await expect(tableRows(page).first()).toContainText("Dr. Amelia Hart");

    await page.getByLabel("Search doctors").fill("cardiology");
    await expect(page).toHaveURL(/search=cardiology/);
    await expect(tableRows(page)).toHaveCount(2);
    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await expect(page).not.toHaveURL(/search=/);
    await expect(page).toHaveURL(/sortBy=name/); // sorting survives clearing filters
  });

  test("filters by specialization", async ({ page }) => {
    await page.getByLabel("Specialization").click();
    await page.getByRole("option", { name: "Neurology" }).click();
    await expect(page).toHaveURL(/specialization=Neurology/);
    await expect(tableRows(page)).toHaveCount(2);
    await expect(tableRows(page).filter({ hasNotText: "Neurology" })).toHaveCount(0);
  });

  test("adds a doctor with validation and duplicate-email handling", async ({ page }) => {
    const email = `e2e.${unique()}@example.com`;
    await page.getByRole("button", { name: "Add doctor" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Add doctor" }).click();
    await expect(dialog.getByText("Enter a valid phone number")).toBeVisible();

    await dialog.getByLabel("Full name").fill("Dr. E2E Created");
    await dialog.getByLabel("Specialization").fill("Dermatology");
    await dialog.getByLabel("Hospital").fill("E2E Hospital");
    await dialog.getByLabel("Phone").fill("+1 555 222 3333");
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByRole("button", { name: "Add doctor" }).click();
    await expect(page.getByText("Dr. E2E Created added")).toBeVisible();

    await page.getByRole("button", { name: "Add doctor" }).click();
    await dialog.getByLabel("Full name").fill("Dr. Duplicate");
    await dialog.getByLabel("Specialization").fill("Dermatology");
    await dialog.getByLabel("Hospital").fill("E2E Hospital");
    await dialog.getByLabel("Phone").fill("+1 555 222 3333");
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByRole("button", { name: "Add doctor" }).click();
    await expect(dialog.getByText("Email is already in use")).toBeVisible();
  });

  test("opens doctor details with breadcrumbs and patients", async ({ page }) => {
    await page.getByLabel("Search doctors").fill("Amelia");
    await page.getByRole("link", { name: "Dr. Amelia Hart" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Dr. Amelia Hart" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Doctors" })).toBeVisible();
    await expect(tableRows(page).first()).toBeVisible();
  });
});
