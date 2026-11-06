import { Schema, model, type InferSchemaType } from "mongoose";

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    condition: { type: String, required: true, trim: true, maxlength: 120 },
    // A patient belongs to at most one doctor. `null` means the patient was
    // removed from a doctor's list and is currently unassigned.
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", default: null },
  },
  { timestamps: true },
);

// Global listing order and registration date range / trend aggregation.
patientSchema.index({ createdAt: -1, _id: -1 });
// Doctor's patient list and patients-per-doctor aggregation.
patientSchema.index({ doctorId: 1, createdAt: -1 });
// Condition filter and condition distribution; case-insensitive collation lets
// canonical-condition lookups use the index.
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ condition: 1 }, { name: "condition_ci", collation: { locale: "en", strength: 2 } });

export type PatientDocument = InferSchemaType<typeof patientSchema>;
export const Patient = model("Patient", patientSchema);
