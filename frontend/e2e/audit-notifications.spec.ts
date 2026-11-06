import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "../playwright.config";
import { signIn, tableRows, unique } from "./helpers";

test.describe("audit log", () => {
  test("lists the admin's sign-in and opens its details", async ({ page }) => {
    await signIn(page, "/audit");
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
    const row = tableRows(page).filter({ hasText: "Signed in" }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Details" }).click();
    await expect(page.getByRole("dialog").getByText("Signed in")).toBeVisible();
  });
});

test.describe("notifications", () => {
  test("a doctor is notified live when a patient is assigned to them", async ({ page, browser }) => {
    await signIn(page);
    const doctors = await (await page.request.get("/api/doctors?limit=1")).json();
    const doctor = doctors.data[0] as { _id: string; email: string };

    const doctorContext = await browser.newContext();
    const doctorPage = await doctorContext.newPage();
    await doctorPage.goto("/login?from=%2Fdoctor");
    await doctorPage.getByLabel("Email").fill(doctor.email);
    await doctorPage.getByLabel("Password", { exact: true }).fill(E2E_ADMIN.password);
    await doctorPage.getByRole("button", { name: "Sign in" }).click();
    await doctorPage.waitForURL("**/doctor");
    // Wait for the live connection before triggering the event.
    await doctorPage.waitForTimeout(1500);

    const name = `Notify Patient ${unique()}`;
    const created = await page.request.post("/api/patients", { data: { name, condition: "Hypertension", doctorId: doctor._id } });
    expect(created.ok()).toBe(true);

    await expect(doctorPage.getByText("New patient assigned").first()).toBeVisible({ timeout: 10_000 });
    await expect(doctorPage.getByRole("button", { name: /Notifications, \d+ unread/ })).toBeVisible();
    await doctorContext.close();
    // Keep the seeded totals intact for the dashboard spec.
    const { data } = await created.json();
    expect((await page.request.delete(`/api/patients/${data._id}`)).ok()).toBe(true);
  });
});
