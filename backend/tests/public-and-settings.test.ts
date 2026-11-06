import request from "supertest";
import { describe, expect, it } from "vitest";
import { createDoctor } from "./factories.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();

const validSettings = (featuredDoctorIds: string[] = []) => ({
  hospitalName: "City Care",
  tagline: "Care that follows you",
  heroTitle: "Find your specialist",
  heroSubtitle: "Subtitle",
  about: "About us",
  services: [{ title: "Cardiology", description: "Heart care", icon: "heart" }],
  announcements: [
    { title: "Flu clinic open", body: "Walk in", active: true },
    { title: "Hidden notice", body: "", active: false },
  ],
  contact: { phone: "+1 555", emergencyPhone: "+1 911", email: "Care@Example.com", address: "1 Main St", hours: "24/7" },
  homepage: { showStats: true, showDoctors: true, featuredDoctorIds },
});

describe("public website API", () => {
  it("serves default content without authentication and never exposes doctor contact details", async () => {
    await createDoctor({ name: "Dr. Public", specialization: "Cardiology", hospital: "North" });
    const res = await request(t.app).get("/api/public/site");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("public");
    expect(res.body.data.hospitalName).toBeTruthy();
    expect(res.body.data.services.length).toBeGreaterThan(0);
    expect(res.body.data.stats).toEqual({ doctors: 1, specializations: 1, hospitals: 1 });
    expect(res.body.data.featuredDoctors[0]).toMatchObject({ name: "Dr. Public" });
    expect(JSON.stringify(res.body)).not.toMatch(/@example\.com|"phone":"\+1 555 010 2030"/);
  });

  it("lists and searches doctors publicly with only public fields", async () => {
    await createDoctor({ name: "Dr. Zed", specialization: "Neurology" });
    await createDoctor({ name: "Dr. Amy", specialization: "Cardiology" });
    const res = await request(t.app).get("/api/public/doctors?specialization=Neurology");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(Object.keys(res.body.data[0]).sort()).toEqual(["_id", "hospital", "name", "specialization"]);
    expect((await request(t.app).get("/api/public/doctors?limit=500")).status).toBe(400);
  });

  it("returns a single public doctor or 404", async () => {
    const doctor = await createDoctor();
    expect((await request(t.app).get(`/api/public/doctors/${doctor._id}`)).body.data).not.toHaveProperty("email");
    expect((await request(t.app).get("/api/public/doctors/650000000000000000000000")).status).toBe(404);
  });
});

describe("site settings", () => {
  it("is restricted to administrators", async () => {
    expect((await request(t.app).get("/api/settings")).status).toBe(401);
    const staff = await t.loggedInAgent("staff");
    expect((await staff.get("/api/settings")).status).toBe(403);
    expect((await staff.put("/api/settings").send(validSettings())).status).toBe(403);
  });

  it("saves content that the public site then reflects, hiding inactive announcements", async () => {
    const admin = await t.loggedInAgent();
    const [a, b] = [await createDoctor({ name: "Dr. A" }), await createDoctor({ name: "Dr. B" })];
    const saved = await admin.put("/api/settings").send(validSettings([b._id.toString(), a._id.toString()]));
    expect(saved.status).toBe(200);
    expect(saved.body.data.contact.email).toBe("care@example.com");

    const site = (await request(t.app).get("/api/public/site")).body.data;
    expect(site.hospitalName).toBe("City Care");
    expect(site.announcements.map((x: { title: string }) => x.title)).toEqual(["Flu clinic open"]);
    expect(site.featuredDoctors.map((d: { name: string }) => d.name)).toEqual(["Dr. B", "Dr. A"]);
  });

  it("validates content and featured doctor references", async () => {
    const admin = await t.loggedInAgent();
    expect((await admin.put("/api/settings").send({ ...validSettings(), hospitalName: "" })).status).toBe(400);
    const badIcon = validSettings();
    badIcon.services[0]!.icon = "rocket";
    expect((await admin.put("/api/settings").send(badIcon)).status).toBe(400);
    expect((await admin.put("/api/settings").send(validSettings(["650000000000000000000000"]))).status).toBe(400);
  });

  it("hides stats and doctors when turned off", async () => {
    const admin = await t.loggedInAgent();
    await createDoctor();
    const off = validSettings();
    off.homepage.showStats = false;
    off.homepage.showDoctors = false;
    await admin.put("/api/settings").send(off).expect(200);
    const site = (await request(t.app).get("/api/public/site")).body.data;
    expect(site.stats).toBeNull();
    expect(site.featuredDoctors).toEqual([]);
  });
});
