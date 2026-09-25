import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getCompanion } from "@/lib/companions";
import { getPersonal, rememberSession } from "@/lib/store";
import type { Reflection, TranscriptLine } from "@/lib/types";

// Pin the public API: the shell running the dev server may set ANTHROPIC_BASE_URL to something else.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com",
});

const ReflectionSchema = z.object({
  title: z.string().describe("A gentle title of a few words, e.g. 'A heavy morning, a little lighter'"),
  reflection: z.string().describe("Two or three warm sentences written to the person (\"you\"), specific to what they said"),
  quote: z.string().describe("One short line they said that matters most, in their EXACT words"),
  whatHelped: z.array(z.string()).describe("Things that helped during the call or that they mentioned helping"),
  gentleNextStep: z.string().describe("One small, kind, doable suggestion for the rest of today"),
  memoryNotes: z.array(z.string()).describe("Facts worth remembering next time, e.g. the name of the person they lost, a known trigger"),
  therapistNote: z
    .string()
    .nullable()
    .describe("Only for the 'between sessions' companion: 2-3 present-focused sentences they could share with their therapist. Otherwise null."),
  safetyConcern: z.boolean().describe("True if they mentioned self-harm, being in danger, or a medical emergency"),
});

const SYSTEM = `You write a short private note for someone after they talked with Hearth, a voice companion. The note is for them, not for anyone else.

Rules:
- Write warmly and plainly, to them ("you", "your") in every field, including what helped and memory notes. The one exception is the therapist note, written in first person as if they wrote it. Never assume their gender.
- Be specific to what they actually said.
- Write the note in the same language, or the same mix of languages, they used on the call (Hinglish stays Hinglish; Arabic mixed with English and French stays that mix). The quote stays in their exact original words.
- If they spoke anything other than plain English, add a memory note describing the language mix they use, unless it's already remembered.
- The quote must be their exact words from the transcript.
- Never diagnose, label, or give clinical advice. Hearth is a companion, not a therapist.
- For the "between sessions" companion, never summarise trauma details; keep the therapist note about the present (sleep, triggers, what helped, what they want to bring to the session).`;

interface Body {
  companion: string;
  userName: string;
  transcript: TranscriptLine[];
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set in .env.local" }, { status: 500 });
  }

  const { companion: companionId, userName, transcript } = (await request.json()) as Body;
  const companion = getCompanion(companionId);
  const name = userName?.trim() || "friend";
  const memory = getPersonal(companion.id);

  const prompt = `Companion: "${companion.title}" (${companion.audience}).
Person: ${name}.
${memory?.notes.length ? `Already remembered from earlier calls:\n${memory.notes.map((n) => `- ${n}`).join("\n")}` : "This was their first call."}

Transcript:
${transcript.map((l) => `${l.role === "user" ? name : "Hearth"}: ${l.text}`).join("\n")}`;

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(ReflectionSchema) },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Claude could not write a note for this call." }, { status: 502 });
    }

    const note: Reflection = {
      ...response.parsed_output,
      therapistNote: companion.id === "sessions" ? response.parsed_output.therapistNote : null,
    };
    rememberSession(companion.id, name, { title: note.title, reflection: note.reflection }, note.memoryNotes);
    return Response.json(note);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API error ${error.status}: ${error.message}` }, { status: 502 });
    }
    throw error;
  }
}
