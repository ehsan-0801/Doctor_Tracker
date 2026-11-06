import { execFileSync } from "node:child_process";
import path from "node:path";
import { E2E_ADMIN } from "../playwright.config";

/** Reset and seed the dedicated end-to-end database. */
export default function globalSetup() {
  const uri = process.env.E2E_MONGODB_URI;
  if (!uri) throw new Error("Set E2E_MONGODB_URI to a dedicated test database (see README).");

  // The seed deletes all doctors and patients, so refuse anything that is not clearly a test database.
  const dbName = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).pathname.slice(1);
  if (!/e2e|test/i.test(dbName)) {
    throw new Error(`Refusing to reset database "${dbName}": its name must contain "e2e" or "test".`);
  }

  execFileSync("npx", ["tsx", "src/scripts/seed.ts", "--reset"], {
    cwd: path.resolve(__dirname, "../../backend"),
    env: { ...process.env, MONGODB_URI: uri, ADMIN_EMAIL: E2E_ADMIN.email, ADMIN_PASSWORD: E2E_ADMIN.password },
    stdio: "inherit",
  });
}
