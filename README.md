# hearth

Voice AI companions that remember you. Built at Fish Tank (Hub71, Abu Dhabi).

Hearth calls the people you love for a warm daily chat, remembers their stories, and tells the family what matters, with the exact words behind every alert. The same engine powers four companions:

| Companion | For | Who sees the summary |
|---|---|---|
| **Daily check-in** | Older people living alone | Family dashboard, with quotes and trends |
| **After a loss** | Anyone who is grieving | Private |
| **Between sessions** | People in trauma therapy (grounding only, never digs into the past) | Private, with an optional note for their therapist |
| **Right now** | Panic and anxiety in the moment | Private |

Every companion shares:

- **Memory across calls**: each call picks up where the last one left off.
- **Calm mode**: slows down with short sentences and guided breathing when someone is overwhelmed.
- **Crisis handoff**: red flags bring up local emergency and support numbers straight away, and the family is alerted during the call.
- **Any language, any mix**: Hearth mirrors how you speak (Hinglish stays Hinglish; Arabic with English and French stays that mix). Family quotes keep the original words with an English translation.

Hearth is a companion, not therapy or medical care, and it never diagnoses.

## Run it locally

Requires Node.js 22+.

```bash
npm install
cp .env.example .env.local   # then add your keys
npm run dev
```

Open http://localhost:3000. Voice calls need a browser with microphone access (Chrome recommended).

| Variable | Used for |
|---|---|
| `OPENAI_API_KEY` | Live voice conversation (OpenAI Realtime) |
| `ANTHROPIC_API_KEY` | Call analysis, family dashboard and private notes (Claude) |

## Pages

| Path | What it is |
|---|---|
| `/` | Homepage |
| `/companions` | Pick a companion |
| `/call?c=checkin` | Daily check-in call (also `loss`, `sessions`, `rightnow`) |
| `/dashboard` | Family dashboard for the daily check-in |
| `/setup` | Enter the person's name, language, location and emergency numbers |

On the call page, **"No microphone? Play the sample call"** runs a scripted check-in through the full pipeline. **"Reset demo"** on the dashboard clears calls and alerts but keeps the saved details.

## How it works

- **Voice and live reasoning:** OpenAI `gpt-realtime-2.1` (speech to speech, low reasoning effort) over WebRTC, with semantic turn-taking and far-field noise reduction. The server mints a short-lived key so the real API key never reaches the browser (`app/api/session`). User speech is transcribed with `gpt-transcribe`.
- **Personalities:** each companion's instructions are rebuilt before every call from what Hearth remembers (`lib/companion.ts`, `lib/companions.ts`).
- **Live tools:** `set_calm_mode` and `escalate`, handled in the browser (`components/call/CallScreen.tsx`).
- **After the call:** Claude (`claude-opus-5`) reads the transcript plus recent history and returns structured, quote-backed signals for the family (`app/api/analyze`) or a private note for the caller (`app/api/reflect`).
- **Storage:** an in-memory demo store (`lib/store.ts`), seeded with a sample week. It resets when the server restarts.

## Demo notes

- Smartwatch data (sleep, heart rate, steps) is simulated and labelled as such.
- Emergency and support numbers are pre-filled per country on the setup page; check them before relying on them.
- The "Call" buttons on crisis screens are deliberately not `tel:` links, so a click on stage can't dial a real emergency line.

Stack: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript.
