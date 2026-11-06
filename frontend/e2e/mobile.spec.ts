import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, signIn } from "./helpers";

test.describe("mobile layout", () => {
  test("pages fit the viewport and use card lists", async ({ page }) => {
    await signIn(page);
    await expectNoHorizontalOverflow(page);
    for (const path of ["/doctors", "/patients"]) {
      await page.goto(path);
      await expect(page.locator("main ul li p.font-medium:visible").first()).toBeVisible();
      await expect(page.locator("main table:visible")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("navigation drawer and collapsible filters", async ({ page }) => {
    await signIn(page, "/patients");
    await expect(page.getByLabel("Condition")).toBeHidden();
    await page.getByRole("button", { name: "Filters" }).click();
    await expect(page.getByLabel("Condition")).toBeVisible();
    await expect(page.getByLabel("Sort by")).toBeVisible();

    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Doctors" }).click();
    await expect(page).toHaveURL(/\/doctors$/);
    await expect(page.getByRole("heading", { level: 1, name: "Doctors" })).toBeVisible();
  });
});
