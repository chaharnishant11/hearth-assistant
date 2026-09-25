import type { Profile } from "./types";

export const RELATIONS = ["Mum", "Dad", "Grandma", "Grandad"] as const;

/** Emergency presets per country. Shown pre-filled and editable on the setup page. */
export const COUNTRIES: Record<
  string,
  Pick<Profile, "country" | "timeZone" | "emergencyNumber" | "crisisLine">
> = {
  UK: {
    country: "UK",
    timeZone: "Europe/London",
    emergencyNumber: "999",
    crisisLine: { name: "Samaritans", number: "116 123" },
  },
  UAE: {
    country: "UAE",
    timeZone: "Asia/Dubai",
    emergencyNumber: "998",
    crisisLine: { name: "National Mental Support Line", number: "800 4673" },
  },
  US: {
    country: "US",
    timeZone: "America/New_York",
    emergencyNumber: "911",
    crisisLine: { name: "988 Suicide & Crisis Lifeline", number: "988" },
  },
  India: {
    country: "India",
    timeZone: "Asia/Kolkata",
    emergencyNumber: "112",
    crisisLine: { name: "Tele-MANAS", number: "14416" },
  },
};

export function pronounsFor(relation: string) {
  const r = relation.toLowerCase();
  if (["mum", "mom", "mother", "grandma", "nan", "nana"].includes(r)) {
    return { they: "she", them: "her", their: "her", themselves: "herself" };
  }
  if (["dad", "father", "grandad", "grandpa"].includes(r)) {
    return { they: "he", them: "him", their: "his", themselves: "himself" };
  }
  return { they: "they", them: "them", their: "their", themselves: "themselves" };
}
