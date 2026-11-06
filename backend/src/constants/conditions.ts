/**
 * Preset patient conditions offered in the UI. Administrators may also enter a
 * custom condition; every value is normalized by `normalizeCondition` so that
 * variants such as "diabetes" and "Diabetes " are stored identically.
 */
export const PRESET_CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Arthritis",
  "Migraine",
  "Chronic Kidney Disease",
  "Thyroid Disorder",
  "Anxiety",
  "Depression",
] as const;

export function normalizeCondition(value: string): string {
  const collapsed = value.trim().replace(/\s+/g, " ");
  const preset = PRESET_CONDITIONS.find((c) => c.toLowerCase() === collapsed.toLowerCase());
  if (preset) return preset;
  // Capitalize the first letter of each word, keep the rest as typed (preserves acronyms like "COPD").
  return collapsed.replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toUpperCase());
}
