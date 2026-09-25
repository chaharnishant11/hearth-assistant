import { COUNTRIES } from "./profile";
import type { CheckIn, Profile } from "./types";

/** Starting point for the setup form. Nothing here is real until the family fills it in. */
export const blankProfile: Profile = {
  name: "",
  relation: "Mum",
  age: 0,
  city: "",
  ...COUNTRIES.UAE,
  caregiver: "",
  caregiverCity: "",
  about: [],
};

/**
 * Their usual speaking pace: the average of earlier calls, once there are at least two.
 * Returns null while Hearth is still learning what's normal for them.
 */
export function baselineWpm(earlier: CheckIn[]): number | null {
  const paces = earlier.map((c) => c.speech.wordsPerMinute).filter((w) => w > 0);
  if (paces.length < 2) return null;
  return Math.round(paces.reduce((a, b) => a + b, 0) / paces.length);
}
