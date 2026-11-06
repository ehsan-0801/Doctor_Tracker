import { Location } from "../models/Location.js";
import { Presence } from "../models/Presence.js";
import { ApiError } from "../utils/ApiError.js";
import type { z } from "zod";
import type { locationSchema, updateLocationSchema } from "../validators/tracking.validator.js";

const FIELDS = "name code type floor x y w h active";

export async function listLocations() {
  return Location.find().select(FIELDS).sort({ floor: 1, name: 1 }).lean();
}

export async function createLocation(input: z.infer<typeof locationSchema>) {
  if (await Location.exists({ code: input.code })) {
    throw ApiError.conflict("A location with this code already exists", [{ field: "code", message: "Code is already in use" }]);
  }
  const created = await Location.create(input);
  return Location.findById(created._id).select(FIELDS).lean();
}

export async function updateLocation(id: string, input: z.infer<typeof updateLocationSchema>) {
  if (input.code && (await Location.exists({ code: input.code, _id: { $ne: id } }))) {
    throw ApiError.conflict("A location with this code already exists", [{ field: "code", message: "Code is already in use" }]);
  }
  const updated = await Location.findByIdAndUpdate(id, input, { new: true, runValidators: true }).select(FIELDS).lean();
  if (!updated) throw ApiError.notFound("Location not found");
  return updated;
}

/** Deleting a room clears it from anyone currently checked in there. */
export async function deleteLocation(id: string) {
  const deleted = await Location.findByIdAndDelete(id).select("_id").lean();
  if (!deleted) throw ApiError.notFound("Location not found");
  await Presence.updateMany({ locationId: id }, { locationId: null });
}
