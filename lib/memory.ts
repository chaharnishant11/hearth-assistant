import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { claude, CLAUDE_MODEL } from "./claude";
import { COMPANIONS, getCompanion, type Companion } from "./companions";
import { savePersonMemory } from "./store";
import type { MemoryFact, Person, TranscriptLine } from "./types";

const Learning = z.object({
  summary: z.string().describe("2-3 sentences: who they are and what's going on for them right now"),
  facts: z.array(
    z.object({
      id: z.string().nullable().describe("The id of the existing fact this keeps or updates; null for a new fact"),
      text: z.string().describe("Short, specific, third person, using their name"),
      category: z.enum(["people", "health", "feelings", "routine", "life", "preferences", "language"]),
    }),
  ),
  followUps: z.array(z.string()).describe("Things to gently check on next time, with dates when known"),
});

const SYSTEM = `You maintain Hearth's long-term memory about one person. The memory is shared by all of Hearth's companions, so whichever companion they talk to next already knows them.

After each conversation, return the complete updated memory:
- Keep every fact that is still true, with its id. Reword it only if this conversation changes it.
- Add new lasting facts: people in their life (names and relationships), health and sleep, feelings and what triggers or helps them, routines, life events and dates, likes, and the language or mix of languages they speak.
- Drop facts that are clearly no longer true. Skip small talk and one-off details.
- From the "between sessions" companion, never store details of traumatic events. Keep only present-focused things: triggers, coping skills that help, what they want to work on.
- Follow-ups: things to gently ask about next time (an upcoming exam, how an anniversary went). Drop ones this conversation resolved.
- Refer to them by name. Don't assume their gender from their name; use "they" unless they've said their pronouns.
- At most 25 facts. Write plainly and kindly. Never diagnose.`;

/** Runs the memory agent over one conversation. */
export async function learnFrom(person: Person, companion: Companion, transcript: TranscriptLine[]) {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Person: ${person.name}
Today: ${today}
This conversation was with the "${companion.title}" companion (${companion.audience}).

Current summary: ${person.summary || "(none yet)"}

Current facts:
${person.facts.length ? person.facts.map((f) => `- [${f.id}] (${f.category}) ${f.text}`).join("\n") : "(none yet)"}

Current follow-ups:
${person.followUps.length ? person.followUps.map((f) => `- ${f.text}`).join("\n") : "(none)"}

Transcript:
${transcript.map((l) => `${l.role === "user" ? person.name : "Hearth"}: ${l.text}`).join("\n")}`;

  const response = await claude.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 6000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(Learning) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  return response.parsed_output;
}

/** Merges the memory agent's output into the person's memory. */
export async function applyLearning(
  person: Person,
  companion: Companion,
  learning: NonNullable<Awaited<ReturnType<typeof learnFrom>>>,
) {
  const now = new Date().toISOString();
  const existing = new Map(person.facts.map((f) => [f.id, f]));
  person.summary = learning.summary;
  person.facts = learning.facts.slice(0, 25).map((f): MemoryFact => {
    const prev = f.id ? existing.get(f.id) : undefined;
    if (prev) {
      return { ...prev, text: f.text, category: f.category, updatedAt: prev.text === f.text ? prev.updatedAt : now };
    }
    return {
      id: crypto.randomUUID(),
      text: f.text,
      category: f.category,
      source: companion.id,
      private: companion.selfUse,
      createdAt: now,
      updatedAt: now,
    };
  });
  const prevFollowUps = new Map(person.followUps.map((f) => [f.text, f]));
  person.followUps = learning.followUps.map((text) => prevFollowUps.get(text) ?? { text, private: companion.selfUse });
  await savePersonMemory(person);
}

/**
 * What a companion should know before a call. The family check-in only sees what was
 * learned outside the private companions.
 */
export function memoryContext(person: Person | undefined, companionId: string): string {
  const companion = getCompanion(companionId);
  const shareable = !companion.selfUse;
  if (!person) return "- This is your first conversation.";

  const facts = person.facts.filter((f) => !shareable || !f.private);
  const followUps = person.followUps.filter((f) => !shareable || !f.private);
  const recent = person.conversations
    .filter((c) => !shareable || !getCompanion(c.companionId).selfUse)
    .slice(-5)
    .map((c) => {
      const title = COMPANIONS.find((x) => x.id === c.companionId)?.title ?? c.companionId;
      return `- ${new Date(c.at).toDateString()} (${title}): ${c.summary}`;
    });

  if (!facts.length && !recent.length) return "- This is your first conversation.";
  return [
    !shareable && person.summary ? person.summary : "",
    facts.length ? `Things you know:\n${facts.map((f) => `- ${f.text}`).join("\n")}` : "",
    followUps.length ? `Gently check on these when it fits:\n${followUps.map((f) => `- ${f.text}`).join("\n")}` : "",
    recent.length ? `Recent conversations:\n${recent.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
