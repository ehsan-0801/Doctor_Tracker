import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";
import { createDoctor } from "./factories.js";
import { Location, PresenceEvent, User } from "./models.js";
import { ADMIN, setupTestApp } from "./setup-app.js";

const t = setupTestApp();
const room = (overrides: Record<string, unknown> = {}) => ({ name: "Operation Theatre 1", code: "OT-1", type: "ot", floor: 1, x: 0, y: 0, w: 8, h: 6, ...overrides });

/** Users for the scenario: one doctor, an assigned and an unassigned front-desk user. */
async function scenario() {
  const doctor = await createDoctor({ name: "Dr. Track" });
  const admin = await t.loggedInAgent();
  const doc = await t.loggedInAgent("doctor", { doctorId: doctor._id });
  const desk = await t.loggedInAgent("staff", { assignedDoctorIds: [doctor._id] });
  const other = await t.loggedInAgent("staff");
  const users = await User.find().select("role doctorId assignedDoctorIds email").lean();
  const id = (pred: (u: (typeof users)[number]) => boolean) => users.find(pred)!._id.toString();
  return {
    doctor,
    admin,
    doc,
    desk,
    other,
    ids: {
      admin: id((u) => u.email === ADMIN.email),
      doc: id((u) => u.role === "doctor"),
      desk: id((u) => u.role === "staff" && u.assignedDoctorIds.length > 0),
      other: id((u) => u.role === "staff" && u.assignedDoctorIds.length === 0),
    },
  };
}

describe("locations", () => {
  it("lists for any signed-in user and is managed by admins only", async () => {
    const { admin, desk } = await scenario();
    expect((await admin.post("/api/locations").send(room())).status).toBe(201);
    expect((await admin.post("/api/locations").send(room())).status).toBe(409);
    expect((await desk.post("/api/locations").send(room({ code: "X1" }))).status).toBe(403);
    expect((await desk.get("/api/locations")).body.data).toHaveLength(1);
    expect((await admin.post("/api/locations").send(room({ code: "bad code!" }))).status).toBe(400);
  });
});

describe("presence", () => {
  it("lets people check themselves in and assigned staff update their doctor", async () => {
    const { admin, doc, desk, other, ids } = await scenario();
    const ot = (await admin.post("/api/locations").send(room())).body.data;

    const self = await doc.put(`/api/presence/${ids.doc}`).send({ locationId: ot._id, status: "in_surgery", note: "Appendectomy" });
    expect(self.status).toBe(200);
    expect(self.body.data).toMatchObject({ status: "in_surgery", location: { code: "OT-1" } });

    expect((await desk.put(`/api/presence/${ids.doc}`).send({ locationId: ot._id, status: "busy" })).status).toBe(200);
    expect((await other.put(`/api/presence/${ids.doc}`).send({ locationId: ot._id, status: "busy" })).status).toBe(403);
    expect((await desk.put(`/api/presence/${ids.admin}`).send({ locationId: null, status: "available" })).status).toBe(403);
    expect((await admin.put(`/api/presence/${ids.desk}`).send({ locationId: ot._id, status: "available" })).status).toBe(200);
    expect(await PresenceEvent.countDocuments()).toBe(3);
  });

  it("shows admins everyone but other roles only doctors", async () => {
    const { admin, desk } = await scenario();
    const adminView = (await admin.get("/api/presence")).body.data as { role: string }[];
    const deskView = (await desk.get("/api/presence")).body.data as { role: string }[];
    expect(new Set(adminView.map((p) => p.role))).toEqual(new Set(["admin", "doctor", "staff"]));
    // Doctors, plus the viewer's own entry for "my status".
    expect(deskView.filter((p) => p.role !== "doctor")).toHaveLength(1);
    expect(deskView.find((p) => p.role === "doctor")).toMatchObject({ canUpdate: true });
  });

  it("clears the room when going off duty and validates the location", async () => {
    const { admin, doc, ids } = await scenario();
    const ot = (await admin.post("/api/locations").send(room())).body.data;
    const off = await doc.put(`/api/presence/${ids.doc}`).send({ locationId: ot._id, status: "off_duty" });
    expect(off.body.data.location).toBeNull();
    expect((await doc.put(`/api/presence/${ids.doc}`).send({ locationId: "650000000000000000000000", status: "busy" })).status).toBe(400);
  });

  it("keeps history for admins only", async () => {
    const { admin, doc, ids } = await scenario();
    await doc.put(`/api/presence/${ids.doc}`).send({ locationId: null, status: "on_break" });
    expect((await admin.get(`/api/presence/${ids.doc}/history`)).body.data).toHaveLength(1);
    expect((await doc.get(`/api/presence/${ids.doc}/history`)).status).toBe(403);
  });

  it("deleting a room clears anyone checked into it", async () => {
    const { admin, doc, ids } = await scenario();
    const ot = (await admin.post("/api/locations").send(room())).body.data;
    await doc.put(`/api/presence/${ids.doc}`).send({ locationId: ot._id, status: "busy" });
    await admin.delete(`/api/locations/${ot._id}`).expect(200);
    const view = (await admin.get("/api/presence")).body.data.find((p: { userId: string }) => p.userId === ids.doc);
    expect(view.location).toBeNull();
    expect(await Location.countDocuments()).toBe(0);
  });
});

describe("chat", () => {
  it("allows doctor ↔ assigned staff and admin ↔ anyone only", async () => {
    const { admin, doc, desk, other, ids } = await scenario();
    const docContacts = (await doc.get("/api/chat/contacts")).body.data.map((c: { _id: string }) => c._id);
    expect(docContacts).toEqual(expect.arrayContaining([ids.desk, ids.admin]));
    expect(docContacts).not.toContain(ids.other);

    expect((await doc.post("/api/chat/conversations").send({ userId: ids.desk })).status).toBe(200);
    expect((await other.post("/api/chat/conversations").send({ userId: ids.doc })).status).toBe(403);
    expect((await admin.post("/api/chat/conversations").send({ userId: ids.other })).status).toBe(200);
    expect((await desk.post("/api/chat/conversations").send({ userId: ids.other })).status).toBe(403);
  });

  it("sends messages, tracks unread counts and hides conversations from outsiders", async () => {
    const { doc, desk, other, ids } = await scenario();
    const conv = (await doc.post("/api/chat/conversations").send({ userId: ids.desk })).body.data;
    expect((await doc.post("/api/chat/conversations").send({ userId: ids.desk })).body.data._id).toBe(conv._id);

    await doc.post(`/api/chat/conversations/${conv._id}/messages`).send({ body: "Patient in OT-1 needs a porter" }).expect(201);
    await doc.post(`/api/chat/conversations/${conv._id}/messages`).send({ body: "Thanks!" }).expect(201);
    expect((await doc.post(`/api/chat/conversations/${conv._id}/messages`).send({ body: "   " })).status).toBe(400);

    const deskList = (await desk.get("/api/chat/conversations")).body.data;
    expect(deskList[0]).toMatchObject({ unread: 2, lastMessage: "Thanks!" });
    await desk.post(`/api/chat/conversations/${conv._id}/read`).expect(200);
    expect((await desk.get("/api/chat/conversations")).body.data[0].unread).toBe(0);

    const thread = (await desk.get(`/api/chat/conversations/${conv._id}/messages`)).body.data;
    expect(thread.messages.map((m: { body: string }) => m.body)).toEqual(["Patient in OT-1 needs a porter", "Thanks!"]);
    expect((await other.get(`/api/chat/conversations/${conv._id}/messages`)).status).toBe(404);
  });

  it("blocks sending after the assignment is removed", async () => {
    const { doc, ids } = await scenario();
    const conv = (await doc.post("/api/chat/conversations").send({ userId: ids.desk })).body.data;
    await User.updateOne({ _id: ids.desk }, { assignedDoctorIds: [] });
    expect((await doc.post(`/api/chat/conversations/${conv._id}/messages`).send({ body: "hello?" })).status).toBe(403);
  });
});

describe("real-time delivery (WebSocket)", () => {
  let server: HttpServer | null = null;
  const sockets: Socket[] = [];
  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.disconnect());
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    server = null;
  });

  async function startRealtime() {
    const { initRealtime } = await import("../src/realtime/server.js");
    server = createServer(t.app);
    initRealtime(server);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    return `http://localhost:${(server!.address() as AddressInfo).port}`;
  }
  async function socketFor(url: string, agent: Awaited<ReturnType<typeof t.loggedInAgent>>) {
    const { token } = (await agent.get("/api/realtime/token")).body.data;
    const socket = connect(url, { auth: { token }, transports: ["websocket"], forceNew: true });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.on("connect", () => resolve());
      socket.on("connect_error", reject);
    });
    return socket;
  }
  const next = <T>(socket: Socket, event: string) => new Promise<T>((resolve) => socket.once(event, resolve));

  it("rejects sockets without a valid token", async () => {
    const url = await startRealtime();
    const socket = connect(url, { auth: { token: "forged.0.sig" }, transports: ["websocket"], forceNew: true });
    sockets.push(socket);
    const error = await new Promise<Error>((resolve) => socket.on("connect_error", resolve));
    expect(error.message).toBe("unauthorized");
  });

  it("pushes location changes instantly, scoped by role", async () => {
    const { admin, doc, desk, ids } = await scenario();
    const url = await startRealtime();
    const [adminSocket, deskSocket] = [await socketFor(url, admin), await socketFor(url, desk)];

    const adminGetsDoctor = next<{ userId: string; status: string }>(adminSocket, "presence:update");
    const deskGetsDoctor = next<{ userId: string }>(deskSocket, "presence:update");
    await doc.put(`/api/presence/${ids.doc}`).send({ locationId: null, status: "on_break" });
    expect(await adminGetsDoctor).toMatchObject({ userId: ids.doc, status: "on_break" });
    expect((await deskGetsDoctor).userId).toBe(ids.doc);

    // A staff member's own move is visible to admins only.
    let deskSawStaff = false;
    deskSocket.on("presence:update", () => (deskSawStaff = true));
    const adminGetsStaff = next<{ userId: string }>(adminSocket, "presence:update");
    await desk.put(`/api/presence/${ids.desk}`).send({ locationId: null, status: "available" });
    expect((await adminGetsStaff).userId).toBe(ids.desk);
    await new Promise((r) => setTimeout(r, 150));
    expect(deskSawStaff).toBe(false);
  });

  it("delivers chat messages to both participants in real time", async () => {
    const { doc, desk, ids } = await scenario();
    const url = await startRealtime();
    const deskSocket = await socketFor(url, desk);
    const conv = (await doc.post("/api/chat/conversations").send({ userId: ids.desk })).body.data;
    const incoming = next<{ conversationId: string; message: { body: string } }>(deskSocket, "chat:message");
    await doc.post(`/api/chat/conversations/${conv._id}/messages`).send({ body: "Live hello" }).expect(201);
    expect(await incoming).toMatchObject({ conversationId: conv._id, message: { body: "Live hello" } });
  });
});
