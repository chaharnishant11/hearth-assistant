import { companionInstructions, companionTools, selfUseInstructions } from "@/lib/companion";
import { getCompanion } from "@/lib/companions";
import { getDashboard, getPerson } from "@/lib/store";

interface Body {
  companion?: string;
  userName?: string;
  country?: string;
}

// Mints a short-lived OpenAI Realtime key so the real API key never reaches the browser.
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set (add it to .env.local, or to the Vercel project for deployments)" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const companion = getCompanion(body.companion);
  let instructions: string;
  if (companion.id === "checkin") {
    const { profile, checkins } = await getDashboard();
    instructions = companionInstructions(profile, checkins, await getPerson(profile.name));
  } else {
    const userName = body.userName?.trim() || "friend";
    instructions = selfUseInstructions(companion.id, {
      userName,
      country: body.country ?? "UAE",
      person: await getPerson(userName),
    });
  }

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 600 },
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1",
        // A little thinking before each reply; higher effort adds noticeable voice latency.
        reasoning: { effort: "low" },
        instructions,
        audio: {
          input: {
            // Laptop mic in a noisy room.
            noise_reduction: { type: "far_field" },
            // No language set: auto-detect, and keep code-mixed speech (Hinglish, Arabic+English+French) as spoken.
            transcription: {
              model: "gpt-transcribe",
              prompt:
                "The speaker may mix languages mid-sentence, e.g. Hindi and English (Hinglish), or Arabic with English and French. Transcribe exactly as spoken, keeping each word in the language it was said. Do not translate.",
            },
            // Semantic turn-taking: waits while they're mid-thought (up to ~4s), replies fast once they're done.
            turn_detection: { type: "semantic_vad", eagerness: "auto" },
          },
          output: { voice: companion.voice, ...(companion.startsCalm && { speed: 0.9 }) },
        },
        tools: companionTools,
        tool_choice: "auto",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: `OpenAI error ${res.status}: ${detail}` }, { status: 502 });
  }

  const data = (await res.json()) as { value: string };
  return Response.json({ value: data.value });
}
