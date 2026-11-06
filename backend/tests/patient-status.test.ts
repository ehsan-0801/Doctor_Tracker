import request from "supertest";
import { describe, expect, it } from "vitest";
import { AuditEvent } from "../src/models/Audit.js";
import { createDoctor, createPatient } from "./factories.js";
import { Patient } from "./models.js";
import { setupTestApp } from "./setup-app.js";

const t = setupTestApp();

async function issued() {
  const doctor = await createDoctor({ name: "Dr. Nadia Rahman", specialization: "Cardiology" });
  const patient = await createPatient({ name: "Karim Hossain", condition: "Hypertension", doctorId: doctor._id });
  const agent = await t.loggedInAgent("staff");
  const res = await agent.post(`/api/patients/${patient._id}/access-token`);
  return { agent, patient, res, token: res.body.data.token as string };
}

describe("patient status tokens", () => {
  it("issues a one-time token that is stored only as a hash and audited", async () => {
    const { res, patient, token, agent } = await issued();
    expect(res.status).toBe(201);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(token).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);

    const stored = await Patient.findById(patient._id).select("+accessTokenHash").lean();
    expect(stored?.accessTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.accessTokenHash).not.toContain(token);

    const detail = await agent.get(`/api/patients/${patient._id}`);
    expect(detail.body.data.accessTokenIssuedAt).toBeTruthy();
    expect(detail.body.data).not.toHaveProperty("accessTokenHash");
    expect(await AuditEvent.exists({ action: "patient.token_issue", entityId: patient._id.toString() })).toBeTruthy();
  });

  it("shows the current condition for a matching name and token, ignoring case, spaces and dashes", async () => {
    const { token } = await issued();
    const res = await request(t.app)
      .post("/api/public/patient-status")
      .send({ name: "  karim   HOSSAIN ", token: token.toLowerCase().replace(/-/g, " ") });
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.data).toMatchObject({ name: "Karim Hossain", condition: "Hypertension", doctor: { name: "Dr. Nadia Rahman", specialization: "Cardiology" } });
    expect(res.body.data).not.toHaveProperty("_id");
    expect(res.body.data.doctor).not.toHaveProperty("email");
  });

  it("gives the same 404 for a wrong name or a wrong token", async () => {
    const { token } = await issued();
    const wrongName = await request(t.app).post("/api/public/patient-status").send({ name: "Someone Else", token });
    const wrongToken = await request(t.app).post("/api/public/patient-status").send({ name: "Karim Hossain", token: "AAAA-BBBB-CCCC" });
    expect(wrongName.status).toBe(404);
    expect(wrongToken.status).toBe(404);
    expect(wrongName.body.message).toBe(wrongToken.body.message);
    expect((await request(t.app).post("/api/public/patient-status").send({ name: "K" })).status).toBe(400);
  });

  it("invalidates the old token when a new one is issued or the token is revoked", async () => {
    const { agent, patient, token } = await issued();
    const next = (await agent.post(`/api/patients/${patient._id}/access-token`)).body.data.token as string;
    const check = (value: string) => request(t.app).post("/api/public/patient-status").send({ name: "Karim Hossain", token: value });
    expect((await check(token)).status).toBe(404);
    expect((await check(next)).status).toBe(200);

    expect((await agent.delete(`/api/patients/${patient._id}/access-token`)).status).toBe(200);
    expect((await check(next)).status).toBe(404);
    expect((await agent.get(`/api/patients/${patient._id}`)).body.data.accessTokenIssuedAt).toBeNull();
  });

  it("lets only admin and staff issue tokens", async () => {
    const doctor = await createDoctor();
    const patient = await createPatient({ doctorId: doctor._id });
    for (const role of ["management", "doctor"] as const) {
      const agent = await t.loggedInAgent(role, role === "doctor" ? { doctorId: doctor._id } : {});
      expect((await agent.post(`/api/patients/${patient._id}/access-token`)).status).toBe(403);
    }
    expect((await request(t.app).post(`/api/patients/${patient._id}/access-token`)).status).toBe(401);
  });

  it("does not change the patient's last-updated time when a token is issued", async () => {
    const { patient } = await issued();
    const after = await Patient.findById(patient._id).lean();
    expect(after?.updatedAt.getTime()).toBe(patient.updatedAt.getTime());
  });
});
