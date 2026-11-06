import { expect, test } from "@playwright/test";
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
