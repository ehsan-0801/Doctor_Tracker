import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "../playwright.config";
import { signIn, unique } from "./helpers";

test("chat widget works from any portal page and stays off the Messages page", async ({ page }) => {
  await signIn(page, "/patients");
  await page.getByRole("button", { name: /^Open chat/ }).click();
  const chat = page.getByRole("dialog", { name: "Chat" });
  await expect(chat.getByRole("heading", { name: "Messages" })).toBeVisible();

  await chat.getByRole("navigation", { name: "Conversations" }).getByRole("button").first().click();
  const text = `From the widget ${unique()}`;
  await chat.getByRole("textbox", { name: "Message" }).fill(text);
  await chat.getByRole("button", { name: "Send message" }).click();
  await expect(chat.getByText(text)).toBeVisible();

  // State survives navigation between portal pages.
  await page.getByRole("link", { name: "Doctors" }).first().click();
  await page.waitForURL("**/doctors");
  await expect(chat.getByText(text)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
  await expect(page.getByRole("button", { name: /^Open chat/ })).toBeFocused();

  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open chat/ })).toHaveCount(0);
});

test("widget shows the new-message count live: launcher, header and back button", async ({ page, browser }) => {
  await signIn(page, "/dashboard");
  const me = (await (await page.request.get("/api/auth/session")).json()).data.user;

  // Read everything first so the count starts at zero.
  for (const c of (await (await page.request.get("/api/chat/conversations")).json()).data) await page.request.post(`/api/chat/conversations/${c._id}/read`);
  await page.reload();
  const launcher = page.getByRole("button", { name: /^Open chat/ });
  await expect(launcher).toHaveAccessibleName("Open chat");

  // Front desk sends two messages from another browser.
  const staff = await browser.newContext();
  const staffPage = await staff.newPage();
  await staffPage.goto("/login");
  await staffPage.getByLabel("Email").fill("staff@doctortracker.com");
  await staffPage.getByLabel("Password", { exact: true }).fill(E2E_ADMIN.password);
  await staffPage.getByRole("button", { name: "Sign in" }).click();
  await staffPage.waitForURL((u) => !u.pathname.startsWith("/login"));
  const conv = (await (await staffPage.request.post("/api/chat/conversations", { data: { userId: me._id ?? me.id } })).json()).data;
  for (const body of ["Patient at reception", "Room 3 is ready"]) {
    await staffPage.request.post(`/api/chat/conversations/${conv._id}/messages`, { data: { body } });
  }

  await expect(launcher).toHaveAccessibleName("Open chat, 2 unread", { timeout: 10_000 });
  await expect(launcher.getByText("2", { exact: true })).toBeVisible();

  await launcher.click();
  const chat = page.getByRole("dialog", { name: "Chat" });
  await expect(chat.getByText("2 new")).toBeVisible();

  // Reading another conversation: its count shows on the back button; opening the staff chat clears it.
  const others = chat.getByRole("navigation", { name: "Conversations" }).getByRole("button").filter({ hasNotText: "Room 3 is ready" });
  await others.first().click();
  await expect(chat.getByRole("button", { name: "Back to conversations, 2 unread" })).toBeVisible();
  await chat.getByRole("button", { name: /Back to conversations/ }).click();
  await chat.getByRole("navigation", { name: "Conversations" }).getByRole("button").filter({ hasText: "Room 3 is ready" }).click();
  await expect(chat.getByText("Room 3 is ready")).toBeVisible();
  // All read: the launcher (still open) loses its count.
  await expect(page.locator('button[aria-expanded="true"]')).toHaveAccessibleName("Close chat", { timeout: 10_000 });
  await staff.close();
});
