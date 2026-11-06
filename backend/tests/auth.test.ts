import request from "supertest";
import { describe, expect, it } from "vitest";
import { ADMIN, setupTestApp } from "./setup-app.js";
import { Session } from "./models.js";

const t = setupTestApp();

describe("authentication", () => {
  it("rejects protected routes without a session", async () => {
    for (const path of ["/api/doctors", "/api/patients", "/api/dashboard/stats", "/api/auth/session"]) {
      const res = await request(t.app).get(path);
      expect(res.status, path).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  it("validates the login body", async () => {
    const res = await request(t.app).post("/api/auth/login").send({ email: "not-an-email", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e: { field: string }) => e.field)).toEqual(expect.arrayContaining(["email", "password"]));
  });

  it("rejects wrong credentials with a generic message", async () => {
    const wrongPassword = await request(t.app).post("/api/auth/login").send({ ...ADMIN, password: "wrong-password" });
    const unknownEmail = await request(t.app).post("/api/auth/login").send({ email: "nobody@test.local", password: "x" });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("signs in with an httpOnly cookie and never returns the password hash", async () => {
    const res = await request(t.app).post("/api/auth/login").send({ email: ADMIN.email.toUpperCase(), password: ADMIN.password });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: ADMIN.email, role: "admin" });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/^dt_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("stores only a hash of the session token", async () => {
    const res = await request(t.app).post("/api/auth/login").send(ADMIN);
    const token = (res.headers["set-cookie"]?.[0] ?? "").split(";")[0]!.split("=")[1]!;
    const session = await Session.findOne().lean();
    expect(session?.tokenHash).toHaveLength(64);
    expect(session?.tokenHash).not.toBe(token);
  });

  it("returns the current user and role for a valid session", async () => {
    const agent = await t.loggedInAgent();
    const res = await agent.get("/api/auth/session");
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: ADMIN.email, role: "admin" });
  });

  it("revokes the session on logout, even if the cookie is replayed", async () => {
    const login = await request(t.app).post("/api/auth/login").send(ADMIN);
    const cookie = (login.headers["set-cookie"]?.[0] ?? "").split(";")[0]!;
    const logout = await request(t.app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(200);
    const replay = await request(t.app).get("/api/auth/session").set("Cookie", cookie);
    expect(replay.status).toBe(401);
  });

  it("rejects deactivated users at login and on existing sessions", async () => {
    const agent = await t.loggedInAgent();
    const { User } = await import("./models.js");
    await User.updateOne({ email: ADMIN.email }, { active: false });
    expect((await agent.get("/api/auth/session")).status).toBe(401);
    expect((await request(t.app).post("/api/auth/login").send(ADMIN)).status).toBe(401);
  });

  it("rejects expired sessions", async () => {
    const agent = await t.loggedInAgent();
    await Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    const res = await agent.get("/api/doctors");
    expect(res.status).toBe(401);
  });
});
