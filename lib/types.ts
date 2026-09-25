export type Severity = "info" | "watch" | "urgent";

export type SignalKind =
  | "mood"
  | "sleep"
  | "meds"
  | "pain"
  | "memory"
  | "social"
  | "safety";

export interface Signal {
  kind: SignalKind;
  label: string;
  severity: Severity;
  /** Exact words from the call that caused this signal, in the language they were said. */
  quote: string;
  /** English translation when the quote isn't entirely English. */
  quoteTranslation?: string | null;
  explanation: string;
}

export interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
}

/** Simulated smartwatch data (clearly labelled as simulated in the UI). */
export interface Wearable {
  sleepHours: number;
  restingHr: number;
  steps: number;
}

export interface SpeechMetrics {
  wordsPerMinute: number;
  fillerPer100: number;
}

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Mon"
  durationSec: number;
  mood: number; // 1 (very low) – 5 (very good)
  moodLabel: string;
  loneliness: "low" | "medium" | "high";
  medsTaken: boolean | null;
  summary: string;
  topics: string[];
  peopleMentioned: string[];
  signals: Signal[];
  suggestedAction: string;
  memoryNotes: string[];
  urgent: boolean;
  wearable: Wearable;
  speech: SpeechMetrics;
  transcript: TranscriptLine[];
  live?: boolean; // produced from a real call in this session
}

export interface LiveAlert {
  id: string;
  at: string; // ISO timestamp
  reason: string;
  quote: string;
  translation?: string | null;
}

export interface Profile {
  name: string;
  /** What the family calls them: "Mum", "Dad", "Grandma", "Grandad". Drives pronouns and dashboard labels. */
  relation: string;
  age: number;
  city: string;
  country: string;
  /** IANA time zone of the person Hearth calls, for alert timestamps. */
  timeZone: string;
  caregiver: string;
  caregiverCity: string;
  emergencyNumber: string;
  crisisLine: { name: string; number: string };
  baselineWpm: number;
  about: string[];
}

/** A private note Claude writes after a self-use companion call. */
export interface Reflection {
  title: string;
  reflection: string;
  quote: string;
  whatHelped: string[];
  gentleNextStep: string;
  memoryNotes: string[];
  therapistNote: string | null;
  safetyConcern: boolean;
}

/** What a self-use companion remembers about its user between calls. */
export interface PersonalMemory {
  userName: string;
  notes: string[];
  sessions: { at: string; title: string; reflection: string }[];
}

export interface HearthState {
  /** Self-use companions' memory, keyed by companion id. */
  personal: Record<string, PersonalMemory>;
  profile: Profile;
  /** Whether the dashboard starts with the sample week of history. */
  sampleHistory: boolean;
  checkins: CheckIn[];
  liveAlerts: LiveAlert[];
  callActive: boolean;
  calmMode: boolean;
}
