import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { baselineWpm } from "@/lib/defaults";
import { claude, CLAUDE_MODEL } from "@/lib/claude";
import { getCompanion } from "@/lib/companions";
import { applyLearning, learnFrom } from "@/lib/memory";
import { addCheckIn, addConversation, ensurePerson, getDashboard } from "@/lib/store";
import type { CheckIn, SpeechMetrics, TranscriptLine } from "@/lib/types";

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
- Speech pace and filler-word rate are provided; if their usual pace is known, mention a clear slowdown versus it as a "memory" or "mood" signal, only as an observation, never a diagnosis.
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
    return Response.json({ error: "ANTHROPIC_API_KEY is not set (add it to .env.local, or to the Vercel project for deployments)" }, { status: 500 });
  }

  const { transcript, durationSec, speech } = (await request.json()) as Body;
  const { profile, checkins, liveAlerts } = await getDashboard();

  const baseline = baselineWpm(checkins);
  const history = checkins
    .map(
      (c) =>
        `${c.dayLabel} ${c.date}: mood ${c.mood}/5 (${c.moodLabel}); meds ${c.medsTaken ?? "unsure"}; pace ${c.speech.wordsPerMinute} wpm; people: ${c.peopleMentioned.join(", ") || "none"}. ${c.summary} Memory: ${c.memoryNotes.join(" ")}`,
    )
    .join("\n");

  const prompt = `About ${profile.name} (${profile.age}, ${profile.city}), whose family calls them "${profile.relation}". The family member reading this is ${profile.caregiver}.
${profile.about.join("\n")}

Previous days:
${history || "None. This is the first call, so don't compare with earlier days."}

Today's speech: ${speech.wordsPerMinute} words per minute (${baseline ? `their usual pace is ${baseline}` : "not enough calls yet to know their usual pace"}), ${speech.fillerPer100} filler words ("um", "er") per 100 words.
${liveAlerts.length ? `Hearth raised a live alert during the call: ${liveAlerts.map((a) => `${a.reason} ("${a.quote}")`).join("; ")}` : ""}

Today's call transcript:
${transcript.map((l) => `${l.role === "user" ? profile.name : "Hearth"}: ${l.text}`).join("\n")}`;

  try {
    const person = await ensurePerson(profile.name);
    const checkinCompanion = getCompanion("checkin");
    // The family analysis and the memory update run side by side.
    const [response, learning] = await Promise.all([
      claude.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { effort: "low", format: zodOutputFormat(Analysis) },
        messages: [{ role: "user", content: prompt }],
      }),
      learnFrom(person, checkinCompanion, transcript).catch((error) => {
        console.warn("Memory update failed", error);
        return null;
      }),
    ]);

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Claude could not analyse this call." }, { status: 502 });
    }

    const now = new Date();
    const checkIn: CheckIn = {
      ...response.parsed_output,
      id: `live-${now.getTime()}`,
      date: now.toISOString().slice(0, 10),
      dayLabel: now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: profile.timeZone }),
      durationSec,
      speech,
      transcript,
      live: true,
    };
    await addCheckIn(checkIn);
    const worst = [...checkIn.signals].sort((a, b) => (a.severity === "urgent" ? -1 : b.severity === "urgent" ? 1 : 0))[0];
    await addConversation(person, {
      id: crypto.randomUUID(),
      companionId: "checkin",
      at: now.toISOString(),
      durationSec,
      title: checkIn.moodLabel,
      summary: checkIn.summary,
      quote: worst?.quote ?? "",
      urgent: checkIn.urgent,
      transcript,
    });
    if (learning) await applyLearning(person, checkinCompanion, learning);
    return Response.json(checkIn);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API error ${error.status}: ${error.message}` }, { status: 502 });
    }
    throw error;
  }
}
