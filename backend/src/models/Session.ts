import { Schema, model } from "mongoose";

/**
 * Server-side session. The cookie holds a random token; only its SHA-256 hash is
 * stored, so a database leak does not expose usable session tokens. Deleting the
 * document (logout) revokes the session immediately.
 */
const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB TTL monitor removes expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model("Session", sessionSchema);
