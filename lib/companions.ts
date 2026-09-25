// Client-safe companion catalogue. Voice personalities live in lib/companion.ts (server only).

export type CompanionId = "checkin" | "loss" | "sessions" | "rightnow";

export interface Companion {
  id: CompanionId;
  title: string;
  audience: string;
  summary: string;
  /** Who sees what's said. */
  privacy: string;
  /** Tailwind background class for the card and orb. */
  accent: string;
  /** Self-use companions ask for your own name; the check-in is set up by family. */
  selfUse: boolean;
  /** Opens straight into calm mode. */
  startsCalm: boolean;
  voice: string;
  /** Idle headline; {name} is replaced with the person's first name. */
  greeting: string;
}

export const COMPANIONS: Companion[] = [
  {
    id: "checkin",
    title: "daily check-in",
    audience: "for older people living alone",
    summary: "A warm morning call that remembers their life, and tells family what matters.",
    privacy: "Summaries go to family, with the exact words behind every alert.",
    accent: "bg-lime",
    selfUse: false,
    startsCalm: false,
    voice: "marin",
    greeting: "good morning, {name}",
  },
  {
    id: "loss",
    title: "after a loss",
    audience: "for anyone who is grieving",
    summary: "Someone to talk to about the person you miss, who remembers them with you.",
    privacy: "Private to you.",
    accent: "bg-coral",
    selfUse: true,
    startsCalm: false,
    voice: "cedar",
    greeting: "hi {name}. i'm here to listen.",
  },
  {
    id: "sessions",
    title: "between sessions",
    audience: "for people in trauma therapy",
    summary: "Grounding and a trigger journal between therapy sessions. It never digs into the past.",
    privacy: "Private to you, with an optional note for your therapist.",
    accent: "bg-teal",
    selfUse: true,
    startsCalm: false,
    voice: "cedar",
    greeting: "hi {name}. how have things been?",
  },
  {
    id: "rightnow",
    title: "right now",
    audience: "for panic and anxiety",
    summary: "Breathing first. A steady voice that slows things down in the moment.",
    privacy: "Private to you.",
    accent: "bg-mint",
    selfUse: true,
    startsCalm: true,
    voice: "marin",
    greeting: "let's slow things down together",
  },
];

export function getCompanion(id?: string | null): Companion {
  return COMPANIONS.find((c) => c.id === id) ?? COMPANIONS[0];
}

/** Best guess at the caller's country from their clock, for crisis numbers. */
export function guessCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Dubai") return "UAE";
    if (tz === "Europe/London") return "UK";
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "India";
    if (tz.startsWith("America/")) return "US";
  } catch {}
  return "UAE";
}
