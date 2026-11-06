import { describe, expect, it } from "vitest";
import { normalizeCondition } from "../src/constants/conditions.js";

describe("normalizeCondition", () => {
  it.each([
    ["diabetes", "Diabetes"],
    ["  HEART disease ", "Heart Disease"],
    ["sickle   cell anemia", "Sickle Cell Anemia"],
    ["COPD", "COPD"],
    ["ménière's disease", "Ménière's Disease"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeCondition(input)).toBe(expected);
  });
});
