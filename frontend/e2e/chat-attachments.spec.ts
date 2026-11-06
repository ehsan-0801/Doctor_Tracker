import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// 1×1 PNG served for every Cloudinary image request.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

/** Stands in for Cloudinary: echoes an upload URL inside the signed folder, and serves a placeholder image. */
async function fakeCloudinary(page: Page) {
  let n = 0;
  await page.route("https://api.cloudinary.com/**", async (route) => {
    const request = route.request();
    const body = request.postDataBuffer()?.toString("latin1") ?? "";
    const folder = /name="folder"\r\n\r\n([^\r]+)/.exec(body)?.[1];
    const resource = request.url().includes("/raw/") ? "raw" : "image";
    const ext = resource === "raw" ? "pdf" : "png";
    await route.fulfill({
      json: { secure_url: `https://res.cloudinary.com/e2e-cloud/${resource}/upload/v1/${folder}/upload${++n}.${ext}`, bytes: 2048, width: 1, height: 1 },
    });
  });
  await page.route("https://res.cloudinary.com/**", (route) => route.fulfill({ body: PNG, contentType: "image/png" }));
}

test("sends an emoji, a photo and a document in a conversation", async ({ page }) => {
  await signIn(page);
  await fakeCloudinary(page);
  const contacts = (await (await page.request.get("/api/chat/contacts")).json()).data as { _id: string; role: string }[];
  const doctor = contacts.find((c) => c.role === "doctor")!;
  const conversation = (await (await page.request.post("/api/chat/conversations", { data: { userId: doctor._id } })).json()).data;
  await page.goto(`/messages?c=${conversation._id}`);
  const thread = page.getByRole("region", { name: "Conversation" });

  await thread.getByRole("button", { name: "Insert emoji" }).click();
  await page.getByRole("button", { name: "👍" }).click();
  await expect(thread.getByRole("textbox", { name: "Message" })).toHaveValue("👍");
  await thread.getByRole("textbox", { name: "Message" }).press("End");
  await thread.getByRole("textbox", { name: "Message" }).pressSequentially(" on my way");
  await thread.getByRole("button", { name: "Send message" }).click();
  await expect(thread.getByText("👍 on my way")).toBeVisible();

  await thread.locator('input[type="file"][accept*=".png"]').setInputFiles({ name: "scan.png", mimeType: "image/png", buffer: PNG });
  await expect(thread.getByText("ready to send")).toBeVisible();
  await thread.getByRole("textbox", { name: "Message" }).fill("Latest scan");
  await thread.getByRole("button", { name: "Send message" }).click();
  await expect(thread.getByRole("img", { name: "scan.png" })).toBeVisible();
  await expect(thread.getByText("Latest scan")).toBeVisible();

  await thread.locator('input[type="file"][accept*=".pdf"]').setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await expect(thread.getByText("ready to send")).toBeVisible();
  await thread.getByRole("button", { name: "Send message" }).click();
  await expect(thread.getByRole("link", { name: /report\.pdf/ })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Conversations" }).getByText("📎 report.pdf")).toBeVisible();

  // Blocked type is rejected before upload.
  await thread.locator('input[type="file"][accept*=".pdf"]').setInputFiles({ name: "tool.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
  await expect(page.getByText(/Allowed files:/)).toBeVisible();
});
