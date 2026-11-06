import { describe, expect, it } from "vitest";
import { createDoctor, createPatient } from "./factories.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

describe("dashboard", () => {
  it("returns zeros for an empty database", async () => {
    const agent = await t.loggedInAgent();
    const stats = (await agent.get("/api/dashboard/stats")).body.data;
    expect(stats).toMatchObject({ totalDoctors: 0, totalPatients: 0, averagePatientsPerDoctor: 0, recentPatients: 0 });
    expect((await agent.get("/api/dashboard/patients-per-doctor")).body.data).toEqual([]);
    const months = (await agent.get("/api/dashboard/registrations?months=6")).body.data;
    expect(months).toHaveLength(6);
    expect(months.every((m: { count: number }) => m.count === 0)).toBe(true);
  });

  it("computes totals, averages and recent counts from the records", async () => {
    const agent = await t.loggedInAgent();
    const [a, b] = [await createDoctor(), await createDoctor()];
    await createPatient({ doctorId: a._id }, daysAgo(1));
    await createPatient({ doctorId: a._id }, daysAgo(2));
    await createPatient({ doctorId: b._id }, daysAgo(45));
    await createPatient({ doctorId: null }, daysAgo(3));
    const stats = (await agent.get("/api/dashboard/stats")).body.data;
    expect(stats).toMatchObject({
      totalDoctors: 2,
      totalPatients: 4,
      assignedPatients: 3,
      unassignedPatients: 1,
      averagePatientsPerDoctor: 1.5,
      recentPatients: 3,
      previousPeriodPatients: 1,
    });
  });

  it("ranks doctors by patient count", async () => {
    const agent = await t.loggedInAgent();
    const [a, b] = [await createDoctor({ name: "Dr. A" }), await createDoctor({ name: "Dr. B" })];
    await createPatient({ doctorId: b._id });
    await createPatient({ doctorId: b._id });
    await createPatient({ doctorId: a._id });
    await createPatient({ doctorId: null });
    const rows = (await agent.get("/api/dashboard/patients-per-doctor")).body.data;
    expect(rows.map((r: { name: string; patientCount: number }) => [r.name, r.patientCount])).toEqual([
      ["Dr. B", 2],
      ["Dr. A", 1],
    ]);
  });

  it("groups registrations by month and fills empty months", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor();
    await createPatient({ doctorId: doctor._id }, new Date());
    await createPatient({ doctorId: doctor._id }, new Date());
    const months = (await agent.get("/api/dashboard/registrations?months=3")).body.data;
    expect(months).toHaveLength(3);
    expect(months.at(-1)).toEqual({ month: new Date().toISOString().slice(0, 7), count: 2 });
    expect((await agent.get("/api/dashboard/registrations?months=99")).status).toBe(400);
  });

  it("returns top conditions and folds the rest into Other", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor();
    for (const condition of ["Asthma", "Asthma", "Asthma", "Diabetes", "Diabetes", "Migraine", "Anxiety"]) {
      await createPatient({ doctorId: doctor._id, condition });
    }
    const rows = (await agent.get("/api/dashboard/conditions?limit=2")).body.data;
    expect(rows).toEqual([
      { condition: "Asthma", count: 3 },
      { condition: "Diabetes", count: 2 },
      { condition: "Other conditions", count: 2 },
    ]);
  });
});
