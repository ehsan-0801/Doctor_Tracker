import { createHash } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { parseCloudinaryUrl, signParams } from "../src/config/cloudinary.js";
import { createDoctor } from "./factories.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();

describe("cloudinary helpers", () => {
  it("parses CLOUDINARY_URL and rejects malformed values", () => {
    expect(parseCloudinaryUrl("cloudinary://key:secret@my-cloud")).toEqual({ apiKey: "key", apiSecret: "secret", cloudName: "my-cloud" });
    expect(parseCloudinaryUrl("cloudinary://<your_api_key>@x")).toBeNull();
    expect(parseCloudinaryUrl(undefined)).toBeNull();
  });

  it("signs sorted parameters followed by the secret (Cloudinary spec)", () => {
    const expected = createHash("sha1").update("folder=a&timestamp=1315060510secret").digest("hex");
    expect(signParams({ timestamp: 1315060510, folder: "a" }, "secret")).toBe(expected);
  });
});

describe("upload signatures", () => {
  it("are admin-only", async () => {
    expect((await request(t.app).post("/api/uploads/signature").send({ purpose: "doctors" })).status).toBe(401);
    const staff = await t.loggedInAgent("staff");
    expect((await staff.post("/api/uploads/signature").send({ purpose: "doctors" })).status).toBe(403);
  });

  it("pin the folder and formats and never expose the secret", async () => {
    const admin = await t.loggedInAgent();
    const res = await admin.post("/api/uploads/signature").send({ purpose: "doctors" });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d).toMatchObject({ folder: "doctrack/doctors", cloudName: "test-cloud", apiKey: "123456789012345", allowed_formats: "jpg,jpeg,png,webp" });
    expect(JSON.stringify(res.body)).not.toContain("test-secret");
    expect(d.signature).toBe(signParams({ allowed_formats: d.allowed_formats, folder: d.folder, timestamp: d.timestamp }, "test-secret"));
    expect((await admin.post("/api/uploads/signature").send({ purpose: "anything" })).status).toBe(400);
  });
});

describe("doctor updates", () => {
  it("lets admins update profile basics and validates input", async () => {
    const admin = await t.loggedInAgent();
    const doctor = await createDoctor();
    const res = await admin
      .patch(`/api/doctors/${doctor._id}`)
      .send({ qualifications: "MBBS, FCPS", photoUrl: "https://res.cloudinary.com/test-cloud/image/upload/v1/doctrack/doctors/a.jpg" });
    expect(res.status).toBe(200);
    expect(res.body.data.qualifications).toBe("MBBS, FCPS");
    expect((await admin.patch(`/api/doctors/${doctor._id}`).send({})).status).toBe(400);
    expect((await admin.patch(`/api/doctors/${doctor._id}`).send({ photoUrl: "http://insecure.example/a.jpg" })).status).toBe(400);
    expect((await admin.patch("/api/doctors/650000000000000000000000").send({ name: "Dr. Ghost" })).status).toBe(404);
  });

  it("rejects duplicate emails and non-admin edits", async () => {
    const admin = await t.loggedInAgent();
    const [a, b] = [await createDoctor(), await createDoctor()];
    expect((await admin.patch(`/api/doctors/${a._id}`).send({ email: b.email })).status).toBe(409);
    const staff = await t.loggedInAgent("staff");
    expect((await staff.patch(`/api/doctors/${a._id}`).send({ name: "Dr. Hack" })).status).toBe(403);
  });
});
