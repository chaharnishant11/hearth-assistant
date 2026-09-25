# hearth: pitch notes

## One-liner
Hearth rings your parent every morning for a warm chat, remembers their life, and tells you what matters, with the exact words behind every alert.

## Problem (pick 2–3 for the slide; verify on the source page before presenting)
- Loneliness is linked to ~871,000 deaths a year worldwide. WHO Commission on Social Connection, 2025. https://www.who.int/groups/commission-on-social-connection
- Isolated older adults have 50% higher dementia risk, 29% higher heart disease risk, 32% higher stroke risk. US Surgeon General Advisory, 2023. https://www.hhs.gov/surgeongeneral/reports-and-publications/connection/index.html
- ~75% of the world's 55M dementia cases are undiagnosed. Alzheimer's Disease International. https://www.alzint.org/about/dementia-facts-figures/dementia-statistics/
- 63M Americans are unpaid family caregivers, up 45% in a decade. AARP, 2025. https://www.aarp.org/caregiving/basics/caregiving-in-us-survey-2025/
- 1.1B people are 60+ today, 2.1B by 2050. WHO, 2024. https://www.who.int/news-room/fact-sheets/detail/ageing-and-health
- Local angle: most UAE residents are expats, and many have parents ageing alone back home.

## Does AI conversation help?
- Review of 17 studies: conversational agents reduced loneliness, depression and anxiety in older adults. Psychological Medicine, 2025. https://www.cambridge.org/core/journals/psychological-medicine/article/autonomous-conversational-agents-for-loneliness-social-isolation-depression-and-anxiety-in-older-people-without-cognitive-impairment-systematic-review-and-metaanalysis/F6E6D9A5C228392CA036B96FDD59C0D9
- ElliQ pilot with NY State Office for the Aging (800+ seniors): 95% reported feeling less lonely. https://aging.ny.gov/news/nysofas-rollout-ai-companion-robot-elliq-shows-95-reduction-loneliness
- Speech features (pauses, word-finding, pace) are studied as early signs of cognitive decline. Frontiers in Public Health, 2024. https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2024.1417966/full

## Competitors and the gap
| Product | What it does | Gap |
|---|---|---|
| ElliQ | Companion robot, $249 + ~$60/mo | Hardware cost; little structured info for family |
| Meela, CareYaya | AI phone calls for lonely seniors | Warm, but no explainable health signals |
| Canary Speech, Winterlight | Speech biomarkers for cognition | Sold to pharma/hospitals only |
| Hippocratic AI | AI nurse calls after discharge | Health-system tool, not daily companionship |

Hearth's wedge: warm daily companionship plus explainable, longitudinal signals for the family. Every alert cites the exact words that caused it.

## One engine, four companions
Same voice, memory, calm mode and crisis handoff; each companion changes the personality, focus and who sees the summary.
- **Daily check-in** (older people living alone): summaries to family, with quotes. The flagship and the demo.
- **After a loss** (grief): remembers the person they miss; private.
- **Between sessions** (people in trauma therapy): grounding and triggers, never digs into trauma memories; optional note for their therapist.
- **Right now** (panic and anxiety): starts in calm mode, breathing first; private.
Pitch line: "We start with elders because the family pays and the need is urgent. The same engine powers the next companions."
Demo tip: show the companion picker for ~10 seconds; don't demo the trauma companion live.

## How it works (for the "how did you build it" question)
- Voice and live reasoning: OpenAI gpt-realtime-2.1 (speech-to-speech, low reasoning effort) over WebRTC, with semantic turn-taking and noise reduction. Short-lived key minted server-side. User speech transcribed with gpt-transcribe.
- Memory: each call's instructions are rebuilt from what Hearth remembers about her life and recent days.
- Live tools: `set_calm_mode` (slower voice, grounding, breathing) and `escalate` (crisis card with local emergency numbers, instant family alert).
- After the call: Claude (claude-opus-5) reads the transcript plus 6 days of history and returns structured signals, each with an exact quote, plus speech pace vs her baseline.
- Built in ~1 hour with Claude Code.

## 3-minute demo script
1. (30s) Problem: one stat + the expat angle. "Nour is in Abu Dhabi. Her mum Margaret, 78, lives alone in Manchester."
2. (30s) Open Nour's dashboard: a week of mood slipping, sleep falling (simulated watch data), speaking pace dropping, her world getting smaller since her friend Joan left.
3. (60s) Open the call page and talk as Margaret. Hearth remembers yesterday's walk. Say something like: "I didn't sleep much. Did I tell you about Arthur's marrow? It won first prize at the allotment show." Then: "My chest feels a bit tight and I'm a bit dizzy."
   Calm mode switches on, the crisis card appears with 999, and Nour's dashboard shows a red alert during the call.
4. (30s) Hang up. In ~15s the dashboard updates: urgent alert with her exact words, "repeated the marrow story she told on Tuesday", pace 20% below her normal, suggested next step for Nour.
5. (30s) Business: $30–50/month paid by adult children; later home-care agencies and insurers. Roadmap: real phone calls, WhatsApp alerts, real wearable sync, clinical validation.

Backup: if the mic or Wi-Fi fails, click "No microphone? Play the sample call" on the call page.

## Questions judges will ask
- "Is it safe?" It never diagnoses. Red flags go straight to 999 and the family. Every signal is explainable.
- "Isn't this surveillance?" The parent opts in and talks on their own terms; we only use what's said on the call. No phone monitoring, no camera.
- "Why not just ChatGPT?" Memory across calls, proactive daily calls, the family loop, and explainable trend alerts.
- "Is the watch data real?" Simulated in this demo; wearable sync is on the roadmap.
