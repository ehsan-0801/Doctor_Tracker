import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { initRealtime } from "./realtime/server.js";

async function main() {
  await connectDatabase(env.MONGODB_URI);
  const server = createServer(createApp());
  initRealtime(server);
  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (real-time enabled)`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
