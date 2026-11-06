import { Schema, model, type InferSchemaType } from "mongoose";

export const LOCATION_TYPES = [
  "ot",
  "icu",
  "ward",
  "consultation",
  "emergency",
  "lab",
  "radiology",
  "pharmacy",
  "reception",
  "lounge",
  "office",
] as const;

/** A room or area on a hospital floor, placed on a grid for the 3D map. */
const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 12 },
    type: { type: String, enum: LOCATION_TYPES, required: true },
    floor: { type: Number, required: true, min: -5, max: 50 },
    // Grid placement (map units); one unit ≈ 1 metre on the 3D map.
    x: { type: Number, required: true, min: 0, max: 200 },
    y: { type: Number, required: true, min: 0, max: 200 },
    w: { type: Number, required: true, min: 1, max: 100 },
    h: { type: Number, required: true, min: 1, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

locationSchema.index({ floor: 1, name: 1 });

export type LocationDocument = InferSchemaType<typeof locationSchema>;
export const Location = model("Location", locationSchema);
