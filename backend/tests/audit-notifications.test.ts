import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { io as connect, type Socket } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";
import { createDoctor, createPatient, doctorInput } from "./factories.js";
import { AuditEvent, Notification, User } from "./models.js";
import { ADMIN, setupTestApp } from "./setup-app.js";

const t = setupTestApp();

describe("audit log", () => {
  it("records logins, failed logins and logouts", async () => {
    await request(t.app).post("/api/auth/login").send({ ...ADMIN, password: "wrong-one" });
    const agent = await t.loggedInAgent();
    await agent.post("/api/auth/logout");
    const actions = (await AuditEvent.find().sort({ createdAt: 1 }).lean()).map((e) => e.action);
    expect(actions).toEqual(["auth.login_failed", "auth.login", "auth.logout"]);
    const failed = await AuditEvent.findOne({ action: "auth.login_failed" }).lean();
    expect(failed).toMatchObject({ entityLabel: ADMIN.email, actorId: null });
  });

  it("records data changes with the actor and never stores secrets", async () => {
    const admin = await t.loggedInAgent();
    const doctor = (await admin.post("/api/doctors").send(doctorInput({ name: "Dr. Audit" }))).body.data;
    await admin.patch(`/api/doctors/${doctor._id}`).send({ hospital: "New Hospital" });
    await admin.post("/api/users").send({ name: "Desk", email: "desk-a@test.local", role: "staff", password: "Desk1234" });
    const user = await User.findOne({ email: "desk-a@test.local" }).lean();
    await admin.post(`/api/users/${user!._id}/reset-password`).send({ password: "NewPass123" });

    const events = await AuditEvent.find({ action: { $ne: "auth.login" } }).sort({ createdAt: 1 }).lean();
    expect(events.map((e) => e.action)).toEqual(["doctor.create", "doctor.update", "user.create", "user.reset_password"]);
    expect(events[1]).toMatchObject({ actorName: "Admin", actorRole: "admin", entityLabel: "Dr. Audit", changes: { hospital: "New Hospital" } });
    expect(JSON.stringify(events)).not.toMatch(/Desk1234|NewPass123/);
  });

  it("logs patient deletion with a readable label", async () => {
    const admin = await t.loggedInAgent();
    const patient = await createPatient({ name: "Pat Gone", doctorId: (await createDoctor())._id });
    await admin.delete(`/api/patients/${patient._id}`).expect(200);
    expect(await AuditEvent.findOne({ action: "patient.delete" }).lean()).toMatchObject({ entityLabel: "Pat Gone", entityType: "patient" });
  });

  it("is readable by admins only, with filters and facets", async () => {
    const admin = await t.loggedInAgent();
    await admin.post("/api/doctors").send(doctorInput());
    const staff = await t.loggedInAgent("staff");
    expect((await staff.get("/api/audit")).status).toBe(403);

    const all = await admin.get("/api/audit");
    expect(all.status).toBe(200);
    expect(all.body.pagination.total).toBeGreaterThanOrEqual(3);
    const filtered = await admin.get("/api/audit?action=doctor.create");
    expect(filtered.body.data.every((e: { action: string }) => e.action === "doctor.create")).toBe(true);
    const facets = (await admin.get("/api/audit/facets")).body.data;
    expect(facets.actions).toEqual(expect.arrayContaining(["auth.login", "doctor.create"]));
  });
});

describe("notifications", () => {
  it("notifies a doctor when a patient is assigned or removed", async () => {
    const admin = await t.loggedInAgent();
    const doctor = await createDoctor();
    const doc = await t.loggedInAgent("doctor", { doctorId: doctor._id });
    const created = (await admin.post(`/api/doctors/${doctor._id}/patients`).send({ name: "Pat New", condition: "Asthma" })).body.data;
    await admin.delete(`/api/doctors/${doctor._id}/patients/${created._id}`).expect(200);

    const list = (await doc.get("/api/notifications")).body.data;
    expect(list.unread).toBe(2);
    expect(list.items.map((n: { type: string }) => n.type)).toEqual(["patient_unassigned", "patient_assigned"]);
  });

  it("notifies the recipient of a chat message and a location changed by someone else", async () => {
    const doctor = await createDoctor();
    const admin = await t.loggedInAgent();
    const doc = await t.loggedInAgent("doctor", { doctorId: doctor._id });
    const docUser = await User.findOne({ role: "doctor" }).lean();
    const conv = (await admin.post("/api/chat/conversations").send({ userId: docUser!._id.toString() })).body.data;
    await admin.post(`/api/chat/conversations/${conv._id}/messages`).send({ body: "Please call me" });
    await admin.put(`/api/presence/${docUser!._id}`).send({ locationId: null, status: "busy" });
    await doc.put(`/api/presence/${docUser!._id}`).send({ locationId: null, status: "available" }); // self: no notification

    const types = (await doc.get("/api/notifications")).body.data.items.map((n: { type: string }) => n.type).sort();
    expect(types).toEqual(["location_updated", "message"]);
  });

  it("notifies staff about newly assigned doctors", async () => {
    const admin = await t.loggedInAgent();
    const doctor = await createDoctor({ name: "Dr. New" });
    await admin.post("/api/users").send({ name: "Desk", email: "desk-n@test.local", role: "staff", password: "Desk1234" });
    const desk = await User.findOne({ email: "desk-n@test.local" }).lean();
    await admin.patch(`/api/users/${desk!._id}`).send({ assignedDoctorIds: [doctor._id.toString()] }).expect(200);
    const n = await Notification.findOne({ userId: desk!._id }).lean();
    expect(n).toMatchObject({ type: "staff_assigned", body: expect.stringContaining("Dr. New") });
  });

  it("marks one or all as read and keeps notifications private", async () => {
    const doctor = await createDoctor();
    const doc = await t.loggedInAgent("doctor", { doctorId: doctor._id });
    const other = await t.loggedInAgent("staff");
    const docUser = await User.findOne({ role: "doctor" }).lean();
    await Notification.insertMany([
      { userId: docUser!._id, type: "system", title: "One" },
      { userId: docUser!._id, type: "system", title: "Two" },
    ]);
    const [first] = (await doc.get("/api/notifications")).body.data.items;
    await other.post(`/api/notifications/${first._id}/read`).expect(200); // not theirs: no effect
    expect((await doc.get("/api/notifications")).body.data.unread).toBe(2);
    await doc.post(`/api/notifications/${first._id}/read`).expect(200);
    expect((await doc.get("/api/notifications")).body.data.unread).toBe(1);
    await doc.post("/api/notifications/read-all").expect(200);
    expect((await doc.get("/api/notifications")).body.data.unread).toBe(0);
    expect((await other.get("/api/notifications")).body.data.items).toHaveLength(0);
  });
});

describe("real-time push", () => {
  let server: HttpServer | null = null;
  const sockets: Socket[] = [];
  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.disconnect());
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    server = null;
  });

  it("pushes notifications to the user and new audit entries to admins", async () => {
    const { initRealtime } = await import("../src/realtime/server.js");
    server = createServer(t.app);
    initRealtime(server);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const url = `http://localhost:${(server!.address() as AddressInfo).port}`;

    const doctor = await createDoctor();
    const admin = await t.loggedInAgent();
    const doc = await t.loggedInAgent("doctor", { doctorId: doctor._id });
    const open = async (agent: typeof admin) => {
      const { token } = (await agent.get("/api/realtime/token")).body.data;
      const s = connect(url, { auth: { token }, transports: ["websocket"], forceNew: true });
      sockets.push(s);
      await new Promise<void>((r) => s.on("connect", () => r()));
      return s;
    };
    const [adminSocket, docSocket] = [await open(admin), await open(doc)];
    const notification = new Promise<{ type: string }>((r) => docSocket.once("notification:new", r));
    const audit = new Promise<{ action: string }>((r) => adminSocket.once("audit:new", r));
    await admin.post(`/api/doctors/${doctor._id}/patients`).send({ name: "Live Pat", condition: "Asthma" }).expect(201);
    expect((await notification).type).toBe("patient_assigned");
    expect((await audit).action).toBe("patient.create");
  });
});
