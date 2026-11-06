import { expect, test } from "@playwright/test";
import { signIn, tableRows, unique } from "./helpers";

test("patient lifecycle: add under doctor, remove, reassign, edit, delete", async ({ page }) => {
  const name = `Uma ${unique()}`;
  await signIn(page, "/doctors");
  await page.getByLabel("Search doctors").fill("Grace");
  await page.getByRole("link", { name: "Dr. Grace Liu" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Dr. Grace Liu" })).toBeVisible();

  // Add with a custom condition, which is normalized
  await page.getByRole("button", { name: "Add patient" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill(name);
  await dialog.getByRole("combobox", { name: "Condition" }).click();
  await page.getByPlaceholder("Search or add condition…").fill(`rare condition ${unique()}`);
  await page.getByText(/^Use “rare condition/).click();
  await dialog.getByRole("button", { name: "Add patient" }).click();
  await expect(page.getByText(`${name} added to Dr. Grace Liu`)).toBeVisible();
  const row = tableRows(page).filter({ hasText: name });
  await expect(row).toContainText("Rare Condition");

  // Remove from doctor keeps the record
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Remove from doctor" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove from doctor" }).click();
  await expect(row).toHaveCount(0);

  await page.goto(`/patients?search=${encodeURIComponent(name)}`);
  await expect(tableRows(page).filter({ hasText: name })).toContainText("Unassigned");

  // Reassign + rename through edit
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Edit patient" }).click();
  await dialog.getByLabel("Full name").fill(`${name} Edited`);
  await dialog.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByPlaceholder("Search doctors…").fill("Grace");
  await page.getByRole("option", { name: /Dr\. Grace Liu/ }).click();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Patient updated")).toBeVisible();

  await page.goto(`/patients?search=${encodeURIComponent(`${name} Edited`)}`);
  await expect(tableRows(page).first()).toContainText("Dr. Grace Liu");

  // Delete after confirmation
  await page.getByRole("button", { name: `Actions for ${name} Edited` }).click();
  await page.getByRole("menuitem", { name: "Delete patient" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete patient" }).click();
  await expect(page.getByText("No patients match your filters")).toBeVisible();
});

test("filters patients by condition, doctor and URL state", async ({ page }) => {
  await signIn(page, "/patients?condition=Hypertension");
  await expect(tableRows(page).first()).toBeVisible();
  await expect(tableRows(page).filter({ hasNotText: "Hypertension" })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByRole("option", { name: "Unassigned" }).click();
  await expect(page).toHaveURL(/doctorId=unassigned/);
  // Retries until the refetched rows have replaced the previous results.
  await expect(tableRows(page).filter({ hasNotText: "Unassigned" })).toHaveCount(0);
  await expect(tableRows(page).first()).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/condition=Hypertension.*doctorId=unassigned|doctorId=unassigned.*condition=Hypertension/);
});
