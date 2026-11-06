import { describe, expect, it } from "vitest";
import { createDoctor, createPatient, doctorInput } from "./factories.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

describe("doctors", () => {
  it("creates a doctor and normalizes the email", async () => {
    const agent = await t.loggedInAgent();
    const res = await agent.post("/api/doctors").send(doctorInput({ email: "  Jane.Doe@Example.COM " }));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: "jane.doe@example.com", patientCount: 0 });
  });

  it("validates every required field", async () => {
    const agent = await t.loggedInAgent();
    const res = await agent.post("/api/doctors").send({ name: "X", phone: "abc", email: "nope" });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(["name", "specialization", "hospital", "phone", "email"]));
  });

  it("rejects a duplicate email with 409", async () => {
    const agent = await t.loggedInAgent();
    const input = doctorInput();
    await agent.post("/api/doctors").send(input).expect(201);
    const res = await agent.post("/api/doctors").send({ ...input, name: "Dr. Other" });
    expect(res.status).toBe(409);
    expect(res.body.errors[0].field).toBe("email");
  });

  it("paginates with stable newest-first ordering and metadata", async () => {
    const agent = await t.loggedInAgent();
    for (let i = 0; i < 12; i++) await createDoctor({}, daysAgo(i));
    const page1 = await agent.get("/api/doctors?page=1&limit=5");
    const page3 = await agent.get("/api/doctors?page=3&limit=5");
    expect(page1.body.pagination).toEqual({ page: 1, limit: 5, total: 12, totalPages: 3 });
    expect(page1.body.data).toHaveLength(5);
    expect(page3.body.data).toHaveLength(2);
    const dates = page1.body.data.map((d: { createdAt: string }) => Date.parse(d.createdAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("sorts by name", async () => {
    const agent = await t.loggedInAgent();
    await createDoctor({ name: "Dr. Charlie" });
    await createDoctor({ name: "Dr. Alice" });
    await createDoctor({ name: "Dr. Bob" });
    const res = await agent.get("/api/doctors?sortBy=name&sortOrder=asc");
    expect(res.body.data.map((d: { name: string }) => d.name)).toEqual(["Dr. Alice", "Dr. Bob", "Dr. Charlie"]);
  });

  it("searches across name, email, specialization and hospital, escaping regex input", async () => {
    const agent = await t.loggedInAgent();
    await createDoctor({ name: "Dr. Amelia Hart", specialization: "Cardiology" });
    await createDoctor({ name: "Dr. Omar", specialization: "Neurology", hospital: "Lakeside (North)" });
    expect((await agent.get("/api/doctors?search=amel")).body.data).toHaveLength(1);
    expect((await agent.get("/api/doctors?search=NEURO")).body.data).toHaveLength(1);
    expect((await agent.get("/api/doctors?search=(North)")).body.data).toHaveLength(1);
    expect((await agent.get("/api/doctors?search=.*")).body.data).toHaveLength(0);
  });

  it("filters by specialization, hospital and created date range", async () => {
    const agent = await t.loggedInAgent();
    await createDoctor({ specialization: "Cardiology", hospital: "A" }, daysAgo(40));
    await createDoctor({ specialization: "Cardiology", hospital: "B" }, daysAgo(5));
    await createDoctor({ specialization: "Neurology", hospital: "B" }, daysAgo(5));
    expect((await agent.get("/api/doctors?specialization=Cardiology")).body.pagination.total).toBe(2);
    expect((await agent.get("/api/doctors?specialization=Cardiology&hospital=B")).body.pagination.total).toBe(1);
    const from = daysAgo(10).toISOString().slice(0, 10);
    expect((await agent.get(`/api/doctors?startDate=${from}`)).body.pagination.total).toBe(2);
  });

  it("rejects invalid query parameters", async () => {
    const agent = await t.loggedInAgent();
    expect((await agent.get("/api/doctors?limit=1000")).status).toBe(400);
    expect((await agent.get("/api/doctors?startDate=2026-05-01&endDate=2026-01-01")).status).toBe(400);
    expect((await agent.get("/api/doctors?startDate=yesterday")).status).toBe(400);
  });

  it("returns patient counts per doctor in the list and details", async () => {
    const agent = await t.loggedInAgent();
    const busy = await createDoctor();
    await createDoctor();
    await createPatient({ doctorId: busy._id });
    await createPatient({ doctorId: busy._id });
    const list = await agent.get("/api/doctors?sortBy=name&sortOrder=asc");
    const counts = Object.fromEntries(list.body.data.map((d: { _id: string; patientCount: number }) => [d._id, d.patientCount]));
    expect(counts[busy._id.toString()]).toBe(2);
    const details = await agent.get(`/api/doctors/${busy._id}`);
    expect(details.body.data.patientCount).toBe(2);
  });

  it("handles malformed and unknown ids", async () => {
    const agent = await t.loggedInAgent();
    expect((await agent.get("/api/doctors/not-an-id")).status).toBe(400);
    expect((await agent.get("/api/doctors/650000000000000000000000")).status).toBe(404);
  });

  it("serves filter options and bounded picker options", async () => {
    const agent = await t.loggedInAgent();
    await createDoctor({ specialization: "Neurology", hospital: "B" });
    await createDoctor({ specialization: "Cardiology", hospital: "A" });
    const filters = await agent.get("/api/doctors/filters");
    expect(filters.body.data).toEqual({ specializations: ["Cardiology", "Neurology"], hospitals: ["A", "B"] });
    const options = await agent.get("/api/doctors/options?limit=1");
    expect(options.body.data).toHaveLength(1);
    expect(Object.keys(options.body.data[0]).sort()).toEqual(["_id", "name", "specialization"]);
  });
});
