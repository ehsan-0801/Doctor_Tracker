import { describe, expect, it } from "vitest";
import type { Role } from "../src/constants/roles.js";
import { createDoctor, createPatient, doctorInput } from "./factories.js";
import { User } from "./models.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();

type Check = { name: string; run: (agent: Awaited<ReturnType<typeof t.loggedInAgent>>, ids: Ids) => Promise<{ status: number }> };
type Ids = { doctorId: string; patientId: string };

const checks: Check[] = [
  { name: "GET /dashboard/stats", run: (a) => a.get("/api/dashboard/stats") },
  { name: "GET /doctors", run: (a) => a.get("/api/doctors") },
  { name: "POST /doctors", run: (a) => a.post("/api/doctors").send(doctorInput()) },
  { name: "GET /patients", run: (a) => a.get("/api/patients") },
  { name: "PATCH /patients/:id", run: (a, ids) => a.patch(`/api/patients/${ids.patientId}`).send({ name: "Renamed" }) },
  { name: "DELETE /doctors/:id/patients/:pid", run: (a, ids) => a.delete(`/api/doctors/${ids.doctorId}/patients/${ids.patientId}`) },
  { name: "DELETE /patients/:id", run: (a, ids) => a.delete(`/api/patients/${ids.patientId}`) },
  { name: "GET /users", run: (a) => a.get("/api/users") },
];

// Expected allow (true) / deny (false) per role, in the order of `checks`.
const matrix: Record<Role, boolean[]> = {
  admin: [true, true, true, true, true, true, true, true],
  management: [true, true, false, true, false, false, false, false],
  staff: [true, true, false, true, true, true, false, false],
  doctor: [false, false, false, false, false, false, false, false],
};

describe("role permissions", () => {
  for (const [role, expected] of Object.entries(matrix) as [Role, boolean[]][]) {
    it(`enforces the permission matrix for ${role}`, async () => {
      const doctor = await createDoctor();
      const agent = await t.loggedInAgent(role, { doctorId: role === "doctor" ? doctor._id : undefined });
      for (const [index, check] of checks.entries()) {
        // Fresh patient per check so destructive checks do not affect the next one.
        const patient = await createPatient({ doctorId: doctor._id });
        const res = await check.run(agent, { doctorId: doctor._id.toString(), patientId: patient._id.toString() });
        const allowed = expected[index]!;
        expect(allowed ? res.status < 400 : res.status === 403, `${role} ${check.name} -> ${res.status}`).toBe(true);
      }
    });
  }
});

describe("user management", () => {
  it("creates accounts for every role and links doctor logins", async () => {
    const agent = await t.loggedInAgent();
    const doctor = await createDoctor();
    const staff = await agent.post("/api/users").send({ name: "Front Desk", email: "desk@test.local", role: "staff", password: "Desk1234" });
    expect(staff.status).toBe(201);
    expect(staff.body.data).not.toHaveProperty("passwordHash");

    const missingDoctor = await agent.post("/api/users").send({ name: "Dr", email: "dr@test.local", role: "doctor", password: "Doc12345" });
    expect(missingDoctor.status).toBe(400);

    const doc = await agent
      .post("/api/users")
      .send({ name: "Dr Login", email: "dr@test.local", role: "doctor", password: "Doc12345", doctorId: doctor._id.toString() });
    expect(doc.status).toBe(201);
    expect(doc.body.data.doctor.name).toBe(doctor.name);

    const second = await agent
      .post("/api/users")
      .send({ name: "Dr Two", email: "dr2@test.local", role: "doctor", password: "Doc12345", doctorId: doctor._id.toString() });
    expect(second.status).toBe(409);
  });

  it("validates password strength and duplicate emails", async () => {
    const agent = await t.loggedInAgent();
    expect((await agent.post("/api/users").send({ name: "Weak", email: "w@test.local", role: "staff", password: "short" })).status).toBe(400);
    await agent.post("/api/users").send({ name: "One", email: "dup@test.local", role: "staff", password: "Valid1234" }).expect(201);
    expect((await agent.post("/api/users").send({ name: "Two", email: "dup@test.local", role: "staff", password: "Valid1234" })).status).toBe(409);
  });

  it("filters and paginates users", async () => {
    const agent = await t.loggedInAgent();
    await agent.post("/api/users").send({ name: "Mgmt", email: "m@test.local", role: "management", password: "Valid1234" });
    const res = await agent.get("/api/users?role=management");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].email).toBe("m@test.local");
  });

  it("deactivating or changing a role signs the user out", async () => {
    const admin = await t.loggedInAgent();
    const staff = await t.loggedInAgent("staff");
    const staffUser = await User.findOne({ role: "staff" }).lean();
    expect((await staff.get("/api/patients")).status).toBe(200);
    await admin.patch(`/api/users/${staffUser!._id}`).send({ role: "management" }).expect(200);
    expect((await staff.get("/api/patients")).status).toBe(401);
  });

  it("prevents removing the last administrator or your own admin access", async () => {
    const agent = await t.loggedInAgent();
    const me = await User.findOne({ role: "admin" }).lean();
    expect((await agent.patch(`/api/users/${me!._id}`).send({ active: false })).status).toBe(400);
    expect((await agent.patch(`/api/users/${me!._id}`).send({ role: "staff" })).status).toBe(400);
  });

  it("resets a password and revokes existing sessions", async () => {
    const admin = await t.loggedInAgent();
    const staff = await t.loggedInAgent("staff");
    const staffUser = await User.findOne({ role: "staff" }).lean();
    await admin.post(`/api/users/${staffUser!._id}/reset-password`).send({ password: "NewPass123" }).expect(200);
    expect((await staff.get("/api/patients")).status).toBe(401);
  });
});

describe("doctor self-access", () => {
  it("lets a doctor read only their own record and patients", async () => {
    const [mine, other] = [await createDoctor(), await createDoctor()];
    await createPatient({ doctorId: mine._id });
    await createPatient({ doctorId: other._id });
    const doctor = await t.loggedInAgent("doctor", { doctorId: mine._id });
    expect((await doctor.get(`/api/doctors/${mine._id}`)).status).toBe(200);
    const own = await doctor.get(`/api/doctors/${mine._id}/patients`);
    expect(own.status).toBe(200);
    expect(own.body.pagination.total).toBe(1);
    expect((await doctor.get(`/api/doctors/${other._id}`)).status).toBe(403);
    expect((await doctor.get(`/api/doctors/${other._id}/patients`)).status).toBe(403);
    expect((await doctor.get("/api/patients")).status).toBe(403);
    expect((await doctor.get("/api/patients/conditions")).status).toBe(200);
  });
});
