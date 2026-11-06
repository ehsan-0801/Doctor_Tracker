import { describe, expect, it } from "vitest";
import { createDoctor, createPatient } from "./factories.js";
import { Patient } from "./models.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

describe("doctor-scoped patients", () => {
  it("adds a patient under a doctor and lists it there and globally", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor();
    const res = await agent.post(`/api/doctors/${doctor._id}/patients`).send({ name: "Jane Doe", condition: "Asthma" });
    expect(res.status).toBe(201);
    expect(res.body.data.doctor).toMatchObject({ _id: doctor._id.toString(), name: doctor.name });
    expect((await agent.get(`/api/doctors/${doctor._id}/patients`)).body.pagination.total).toBe(1);
    expect((await agent.get("/api/patients")).body.pagination.total).toBe(1);
  });

  it("returns 404 when adding or listing for an unknown doctor", async () => {
    const agent = await t.loggedInAgent();
    const missing = "650000000000000000000000";
    expect((await agent.post(`/api/doctors/${missing}/patients`).send({ name: "Jane", condition: "Asthma" })).status).toBe(404);
    expect((await agent.get(`/api/doctors/${missing}/patients`)).status).toBe(404);
  });

  it("removes the association without deleting the patient", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor();
    const patient = await createPatient({ doctorId: doctor._id });
    const res = await agent.delete(`/api/doctors/${doctor._id}/patients/${patient._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.doctor).toBeNull();
    expect(await Patient.exists({ _id: patient._id })).toBeTruthy();
    expect((await agent.get(`/api/doctors/${doctor._id}/patients`)).body.pagination.total).toBe(0);
    expect((await agent.get("/api/patients?doctorId=unassigned")).body.pagination.total).toBe(1);
  });

  it("refuses to remove a patient from a doctor they do not belong to", async () => {
    const agent = await t.loggedInAgent();
    const [a, b] = [await createDoctor(), await createDoctor()];
    const patient = await createPatient({ doctorId: a._id });
    expect((await agent.delete(`/api/doctors/${b._id}/patients/${patient._id}`)).status).toBe(404);
    expect((await Patient.findById(patient._id).lean())?.doctorId?.toString()).toBe(a._id.toString());
  });
});

describe("global patients", () => {
  it("requires an existing doctor on creation", async () => {
    const agent = await t.loggedInAgent();
    expect((await agent.post("/api/patients").send({ name: "Jane", condition: "Asthma" })).status).toBe(400);
    expect(
      (await agent.post("/api/patients").send({ name: "Jane", condition: "Asthma", doctorId: "650000000000000000000000" })).status,
    ).toBe(404);
  });

  it("canonicalizes conditions to presets and existing spellings", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor();
    const create = (condition: string) =>
      agent.post("/api/patients").send({ name: "Pat", condition, doctorId: doctor._id.toString() });
    expect((await create("  diabetes ")).body.data.condition).toBe("Diabetes");
    expect((await create("COPD")).body.data.condition).toBe("COPD");
    expect((await create("copd")).body.data.condition).toBe("COPD");
    expect((await create("sickle   cell anemia")).body.data.condition).toBe("Sickle Cell Anemia");
    const conditions = (await agent.get("/api/patients/conditions")).body.data as string[];
    expect(conditions).toEqual(expect.arrayContaining(["Diabetes", "COPD", "Sickle Cell Anemia", "Hypertension"]));
    expect(conditions.filter((c) => c.toLowerCase() === "copd")).toHaveLength(1);
  });

  it("searches, filters by condition, doctor and date, and paginates", async () => {
    const agent = await t.loggedInAgent();
    const [a, b] = [await createDoctor(), await createDoctor()];
    await createPatient({ name: "Jane Doe", condition: "Asthma", doctorId: a._id }, daysAgo(2));
    await createPatient({ name: "John Roe", condition: "Diabetes", doctorId: b._id }, daysAgo(60));
    await createPatient({ name: "Janet Poe", condition: "Asthma", doctorId: b._id }, daysAgo(3));

    expect((await agent.get("/api/patients?search=jan")).body.pagination.total).toBe(2);
    expect((await agent.get("/api/patients?condition=asthma")).body.pagination.total).toBe(2);
    expect((await agent.get(`/api/patients?doctorId=${b._id}`)).body.pagination.total).toBe(2);
    expect((await agent.get(`/api/patients?doctorId=${b._id}&condition=Asthma`)).body.pagination.total).toBe(1);
    const from = daysAgo(10).toISOString().slice(0, 10);
    expect((await agent.get(`/api/patients?startDate=${from}`)).body.pagination.total).toBe(2);
    const paged = await agent.get("/api/patients?limit=2&page=2");
    expect(paged.body.data).toHaveLength(1);
    expect(paged.body.pagination.totalPages).toBe(2);
  });

  it("populates the doctor summary in list results", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor({ name: "Dr. Visible" });
    await createPatient({ doctorId: doctor._id });
    const [row] = (await agent.get("/api/patients")).body.data;
    expect(row.doctor).toMatchObject({ name: "Dr. Visible", specialization: doctor.specialization });
    expect(row).not.toHaveProperty("doctorId");
  });

  it("updates details and reassigns to another doctor", async () => {
    const agent = await t.loggedInAgent();
    const [a, b] = [await createDoctor(), await createDoctor()];
    const patient = await createPatient({ doctorId: a._id });
    const res = await agent.patch(`/api/patients/${patient._id}`).send({ name: "Renamed", doctorId: b._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: "Renamed", doctor: { _id: b._id.toString() } });
  });

  it("rejects empty updates and invalid doctor references", async () => {
    const agent = await t.loggedInAgent();
    const patient = await createPatient({ doctorId: (await createDoctor())._id });
    expect((await agent.patch(`/api/patients/${patient._id}`).send({})).status).toBe(400);
    expect((await agent.patch(`/api/patients/${patient._id}`).send({ doctorId: "650000000000000000000000" })).status).toBe(404);
    expect((await agent.patch("/api/patients/650000000000000000000000").send({ name: "Ghost" })).status).toBe(404);
  });

  it("deletes a patient record", async () => {
    const agent = await t.loggedInAgent();
    const patient = await createPatient({ doctorId: (await createDoctor())._id });
    expect((await agent.delete(`/api/patients/${patient._id}`)).status).toBe(200);
    expect(await Patient.exists({ _id: patient._id })).toBeNull();
    expect((await agent.delete(`/api/patients/${patient._id}`)).status).toBe(404);
  });

  it("does not interpret query-string operators (NoSQL injection)", async () => {
    const agent = await t.loggedInAgent();
    await createPatient({ condition: "Hypertension", doctorId: (await createDoctor())._id });
    // If `$ne` reached MongoDB this would return 0 rows; it must be ignored instead.
    const res = await agent.get("/api/patients?condition[$ne]=Hypertension&search[$regex]=.*");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
  });

  it("does not accept operator objects in JSON bodies", async () => {
    const agent = await t.loggedInAgent();
    const res = await agent.post("/api/patients").send({ name: "Jane", condition: { $gt: "" }, doctorId: { $ne: null } });
    expect(res.status).toBe(400);
  });
});
