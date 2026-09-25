// Client-safe helpers for identifying people. In this demo a person is identified by first name.

export function personId(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "friend"
  );
}

export const CATEGORY_LABELS: Record<string, string> = {
  people: "people in their life",
  health: "health and sleep",
  feelings: "feelings, triggers and what helps",
  routine: "routines",
  life: "life and events",
  preferences: "likes and preferences",
  language: "how they speak",
};
