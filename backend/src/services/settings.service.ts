import { DEFAULT_SERVICES, SiteSettings } from "../models/SiteSettings.js";
import { Doctor } from "../models/Doctor.js";
import { ApiError } from "../utils/ApiError.js";
import type { UpdateSettingsInput } from "../validators/settings.validator.js";

const KEY = "site";

/**
 * Returns the settings document, creating it with defaults on first use.
 * Hydrated (not lean) so fields added after the document was created — such as
 * the Bangla translations — receive their schema defaults.
 */
export async function getSettings() {
  const doc = await SiteSettings.findOneAndUpdate(
    { key: KEY },
    { $setOnInsert: { key: KEY, services: DEFAULT_SERVICES } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const { _id, key, __v, ...settings } = doc!.toObject();
  return settings;
}

export async function updateSettings(input: UpdateSettingsInput) {
  const featured = input.homepage.featuredDoctorIds;
  if (featured.length > 0) {
    const found = await Doctor.countDocuments({ _id: { $in: featured } });
    if (found !== new Set(featured).size) {
      throw ApiError.badRequest("One or more featured doctors no longer exist", [
        { field: "homepage.featuredDoctorIds", message: "Remove doctors that no longer exist" },
      ]);
    }
  }
  await SiteSettings.updateOne(
    { key: KEY },
    { $set: { ...input, homepage: { ...input.homepage, featuredDoctorIds: [...new Set(featured)] } } },
    { upsert: true, runValidators: true },
  );
  return getSettingsForAdmin();
}

/** Settings plus names of the featured doctors, for the admin editor. */
export async function getSettingsForAdmin() {
  const settings = await getSettings();
  const ids = settings.homepage?.featuredDoctorIds ?? [];
  const doctors = ids.length ? await Doctor.find({ _id: { $in: ids } }).select("name specialization").lean() : [];
  const byId = new Map(doctors.map((d) => [d._id.toString(), d]));
  return {
    ...settings,
    featuredDoctors: ids.map((id) => byId.get(id.toString())).filter((d) => d !== undefined),
  };
}
