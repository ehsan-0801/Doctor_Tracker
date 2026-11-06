import mongoose from "mongoose";

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
