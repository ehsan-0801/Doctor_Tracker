import { expect, test } from "@playwright/test";
import { signIn, unique } from "./helpers";

test.describe("patient status check", () => {
  test("front desk issues a token and the patient sees their condition with it", async ({ page, browser }) => {
    await signIn(page);
    const doctors = await (await page.request.get("/api/doctors?limit=1")).json();
    const doctor = doctors.data[0] as { _id: string; name: string };
    const name = `Status Patient ${unique()}`;
    const created = await page.request.post("/api/patients", { data: { name, condition: "Asthma", doctorId: doctor._id } });
    const patientId = (await created.json()).data._id as string;

    // Staff issue the token from the patient's actions menu.
    await page.goto(`/patients?search=${encodeURIComponent(name)}`);
    await page.getByRole("button", { name: `Actions for ${name}` }).first().click();
    await page.getByRole("menuitem", { name: "Status-check token" }).click();
    const dialog = page.getByRole("dialog", { name: "Status-check token" });
    await dialog.getByRole("button", { name: "Issue token" }).click();
    const token = (await dialog.getByLabel("Access token").textContent())!.trim();
    expect(token).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    await dialog.getByRole("button", { name: "Done" }).click();

    // The patient checks, signed out, in a fresh browser.
    const patientContext = await browser.newContext();
    const patientPage = await patientContext.newPage();
    await patientPage.goto("/check-status");
    await patientPage.getByLabel("Full name").fill(name.toLowerCase());
    await patientPage.getByLabel("Access token").fill("WRON-GTOK-ENXX");
    await patientPage.getByRole("button", { name: "Check status" }).click();
    await expect(patientPage.getByRole("alert").filter({ hasText: "No record matches" })).toBeVisible();

    await patientPage.getByLabel("Access token").fill(token.toLowerCase());
    await patientPage.getByRole("button", { name: "Check status" }).click();
    await expect(patientPage.getByRole("heading", { name: `Status for ${name}` })).toBeFocused();
    await expect(patientPage.getByText("Asthma")).toBeVisible();
    await expect(patientPage.getByText(doctor.name)).toBeVisible();

    await patientPage.getByRole("button", { name: "Check another patient" }).click();
    await expect(patientPage.getByLabel("Access token")).toHaveValue("");
    await patientContext.close();

    // Keep the seeded totals intact for the dashboard spec.
    await page.request.delete(`/api/patients/${patientId}`);
  });
});
