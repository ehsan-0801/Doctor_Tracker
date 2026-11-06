import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("dashboard shows seeded totals and charts", async ({ page }) => {
  await signIn(page);
  const stats = page.getByRole("region", { name: "Key statistics" });
  await expect(stats.getByText("Total doctors")).toBeVisible();
  // The seed creates 15 doctors and 60 patients.
  await expect(stats.locator("p.text-\\[28px\\]").nth(0)).toHaveText("15");
  await expect(stats.locator("p.text-\\[28px\\]").nth(1)).toHaveText("60");
  for (const title of ["Patients per doctor", "Patient registrations", "Patients by condition", "Recently added patients"]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();

  await page.getByRole("combobox", { name: "Registration period" }).click();
  await page.getByRole("option", { name: "Last 6 months" }).click();
  await expect(page.getByText(/in the last 6 months/)).toBeVisible();
});
