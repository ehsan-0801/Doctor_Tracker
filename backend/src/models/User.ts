import { Schema, model, type InferSchemaType } from "mongoose";
import { ROLES } from "../constants/roles.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    // Set only for doctor accounts: the doctor record this login belongs to.
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", default: null },
    active: { type: Boolean, default: true },
    // Optional profile photo (https URL, e.g. Cloudinary DocTrack/staff).
    photoUrl: { type: String, trim: true, maxlength: 500, default: "" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, createdAt: -1 });
// One login per doctor record.
userSchema.index({ doctorId: 1 }, { unique: true, partialFilterExpression: { doctorId: { $type: "objectId" } } });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
