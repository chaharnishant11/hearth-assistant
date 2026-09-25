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

export interface SpeechMetrics {
  wordsPerMinute: number;
  fillerPer100: number;
}

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Fri 25"
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

export type MemoryCategory =
  | "people"
  | "health"
  | "feelings"
  | "routine"
  | "life"
  | "preferences"
  | "language";

/** One durable thing Hearth knows about a person. */
export interface MemoryFact {
  id: string;
  text: string;
  category: MemoryCategory;
  /** Companion whose conversation this came from. */
  source: string;
  /** Learned in a private companion, so never shared with family. */
  private: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  text: string;
  private: boolean;
}

/** One past call with any companion. */
export interface Conversation {
  id: string;
  companionId: string;
  at: string; // ISO timestamp
  durationSec: number;
  title: string;
  summary: string;
  quote: string;
  urgent: boolean;
  transcript: TranscriptLine[];
  sample?: boolean;
}

/** Everything Hearth remembers about one person, shared across all companions. */
export interface Person {
  id: string;
  name: string;
  summary: string;
  facts: MemoryFact[];
  followUps: FollowUp[];
  conversations: Conversation[];
}

export interface HearthState {
  profile: Profile;
  /** False until the family has filled in the setup page. */
  configured: boolean;
  checkins: CheckIn[];
  liveAlerts: LiveAlert[];
  callActive: boolean;
  calmMode: boolean;
}
