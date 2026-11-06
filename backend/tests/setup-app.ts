import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import type { Express } from "express";
import { afterAll, beforeAll, beforeEach } from "vitest";
import type { Role } from "../src/constants/roles.js";

export const ADMIN = { email: "admin@test.local", password: "Admin1234" };

/**
 * Starts an isolated in-memory MongoDB and an app instance for one test file.
 * The environment is set before the app modules are imported, because
 * `config/env.ts` validates it at import time.
 */
export function setupTestApp() {
  const ctx = {} as { app: Express; mongo: MongoMemoryServer };

  beforeAll(async () => {
    ctx.mongo = await MongoMemoryServer.create();
    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI = ctx.mongo.getUri("doctor_tracker_test");
    process.env.CLIENT_ORIGIN = "http://localhost:3000";

    await mongoose.connect(process.env.MONGODB_URI);
    const [{ createApp }, models] = await Promise.all([import("../src/app.js"), import("./models.js")]);
    await Promise.all(models.all.map((model) => model.syncIndexes()));
    ctx.app = createApp();
  });

  beforeEach(async () => {
    const { all } = await import("./models.js");
    await Promise.all(all.map((model) => model.deleteMany({})));
    const { User } = await import("../src/models/User.js");
    const { hashPassword } = await import("../src/services/auth.service.js");
    await User.create({ name: "Admin", email: ADMIN.email, role: "admin", passwordHash: await hashPassword(ADMIN.password) });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await ctx.mongo?.stop();
  });

  return {
    get app() {
      return ctx.app;
    },
    /** Supertest agent that keeps the session cookie between requests (admin by default). */
    async loggedInAgent(role: Role = "admin", options: { doctorId?: unknown } = {}) {
      const agent = request.agent(ctx.app);
      let credentials = ADMIN;
      if (role !== "admin") {
        const { User } = await import("../src/models/User.js");
        const { hashPassword } = await import("../src/services/auth.service.js");
        credentials = { email: `${role}.${Date.now()}.${Math.random().toString(36).slice(2)}@test.local`, password: ADMIN.password };
        await User.create({
          name: `${role} user`,
          email: credentials.email,
          role,
          doctorId: options.doctorId ?? null,
          passwordHash: await hashPassword(credentials.password),
        });
      }
      const res = await agent.post("/api/auth/login").send(credentials);
      if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
      return agent;
    },
  };
}
