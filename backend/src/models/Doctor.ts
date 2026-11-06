import { Schema, model, type InferSchemaType } from "mongoose";

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    specialization: { type: String, required: true, trim: true, maxlength: 120 },
    hospital: { type: String, required: true, trim: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Optional public profile basics, shown on the website when present.
    qualifications: { type: String, trim: true, maxlength: 160, default: "" },
    photoUrl: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

// Default listing order and date-range filter.
doctorSchema.index({ createdAt: -1, _id: -1 });
// Filter by specialization / hospital, then sort by newest.
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });

export type DoctorDocument = InferSchemaType<typeof doctorSchema>;
export const Doctor = model("Doctor", doctorSchema);
