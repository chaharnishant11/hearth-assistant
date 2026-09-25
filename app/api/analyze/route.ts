import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { todayWearable } from "@/lib/seed";
import { addCheckIn, getState } from "@/lib/store";
import type { CheckIn, SpeechMetrics, TranscriptLine } from "@/lib/types";

// Pin the public API: the shell running the dev server may set ANTHROPIC_BASE_URL to something else.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com",
});

const Analysis = z.object({
  mood: z.number().int().describe("1 = very low, 3 = okay, 5 = very good"),
  moodLabel: z.string().describe("Two or three words, e.g. 'Low and anxious'"),
  loneliness: z.enum(["low", "medium", "high"]),
  medsTaken: z.boolean().nullable().describe("null if unclear or not discussed"),
  summary: z.string().describe("Two short sentences for their family member, plain and kind"),
  topics: z.array(z.string()),
  peopleMentioned: z.array(z.string()).describe("People (and pets) they mentioned by name today"),
  signals: z.array(
    z.object({
      kind: z.enum(["mood", "sleep", "meds", "pain", "memory", "social", "safety"]),
      label: z.string().describe("Short headline, e.g. 'Chest tightness and dizziness'"),
      severity: z.enum(["info", "watch", "urgent"]),
      quote: z.string().describe("The person's EXACT words from the transcript that support this signal, in the original language and script"),
      quoteTranslation: z
        .string()
        .nullable()
        .describe("English translation of the quote if it isn't entirely in English; otherwise null"),
      explanation: z.string().describe("One sentence: why this matters, referencing past days where relevant"),
    }),
  ),
  suggestedAction: z.string().describe("One concrete next step for their family member"),
  memoryNotes: z.array(z.string()).describe("New facts worth remembering for future calls"),
  urgent: z.boolean().describe("True if anything needs action today (e.g. chest pain, fall, self-harm)"),
});

const SYSTEM = `You analyse a daily check-in call between Hearth (an AI companion) and an older adult, and write an explainable update for their family.

Rules:
- Every signal MUST quote the person's exact words from today's transcript. If you cannot quote it, do not raise it.
- Compare today with previous days: flag changes in mood, sleep, medication, pain, social contact, and memory (for example, retelling a story they told on an earlier day, or losing track of their medication).
- Speech pace and filler-word rate are provided; mention a clear slowdown versus their baseline as a "memory" or "mood" signal only as an observation, never a diagnosis.
- Chest pain, breathing trouble, falls, stroke signs, or self-harm talk are always severity "urgent" and set urgent = true.
- The call may be in any language or a mix (for example Hinglish, or Arabic with English and French). Write labels, summary, explanations and suggested action in English for the family, but keep every quote in the exact original words and script, with an English translation when it isn't entirely English.
- If they spoke anything other than plain English, add a memory note describing the language mix they use (for example "Speaks a mix of Hindi and English"), unless it's already remembered.
- You never diagnose. Use plain, kind language a worried family member can act on. Refer to the person by name.`;

interface Body {
  transcript: TranscriptLine[];
  durationSec: number;
  speech: SpeechMetrics;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set in .env.local" }, { status: 500 });
  }

  const { transcript, durationSec, speech } = (await request.json()) as Body;
  const state = getState();
  const { profile, checkins, liveAlerts } = state;

  const history = checkins
    .map(
      (c) =>
        `${c.dayLabel} ${c.date}: mood ${c.mood}/5 (${c.moodLabel}); meds ${c.medsTaken ?? "unsure"}; sleep ${c.wearable.sleepHours}h; pace ${c.speech.wordsPerMinute} wpm; people: ${c.peopleMentioned.join(", ") || "none"}. ${c.summary} Memory: ${c.memoryNotes.join(" ")}`,
    )
    .join("\n");

  const prompt = `About ${profile.name} (${profile.age}, ${profile.city}), whose family calls them "${profile.relation}". The family member reading this is ${profile.caregiver}.
${profile.about.join("\n")}

Previous days:
${history}

Today's simulated watch data: slept ${todayWearable.sleepHours}h, resting heart rate ${todayWearable.restingHr}, ${todayWearable.steps} steps.
Today's speech: ${speech.wordsPerMinute} words per minute (their baseline is ${profile.baselineWpm}), ${speech.fillerPer100} filler words ("um", "er") per 100 words.
${liveAlerts.length ? `Hearth raised a live alert during the call: ${liveAlerts.map((a) => `${a.reason} ("${a.quote}")`).join("; ")}` : ""}

Today's call transcript:
${transcript.map((l) => `${l.role === "user" ? profile.name : "Hearth"}: ${l.text}`).join("\n")}`;

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(Analysis) },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Claude could not analyse this call." }, { status: 502 });
    }

    const now = new Date();
    const checkIn: CheckIn = {
      ...response.parsed_output,
      id: `live-${now.getTime()}`,
      date: now.toISOString().slice(0, 10),
      dayLabel: "Today",
      durationSec,
      wearable: todayWearable,
      speech,
      transcript,
      live: true,
    };
    addCheckIn(checkIn);
    return Response.json(checkIn);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API error ${error.status}: ${error.message}` }, { status: 502 });
    }
    throw error;
  }
}
