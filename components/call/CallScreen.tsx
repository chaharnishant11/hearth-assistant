"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCompanion, guessCountry, type CompanionId } from "@/lib/companions";
import { COUNTRIES } from "@/lib/profile";
import { blankProfile } from "@/lib/defaults";
import type { HearthState, Profile, Reflection, SpeechMetrics, TranscriptLine } from "@/lib/types";
import { personId } from "@/lib/people";
import { NoteCard } from "./NoteCard";

type Status = "idle" | "connecting" | "live" | "analyzing" | "done" | "error";
type Line = TranscriptLine & { id: string };
type Crisis = { reason: string; quote: string; translation?: string };

const FILLERS = /\b(um+|uh+|erm?|hmm+)\b/gi;
const PENDING = "…";
const NAME_KEY = "hearth:name";
// Hearth's text arrives much faster than its voice, so captions are revealed at speaking pace.
const WORDS_PER_SEC = 2.6;
const CAPTION_TICK_MS = 120;
const COUNTRY_KEY = "hearth:country";

function measureSpeech(lines: Line[], userSpeechMs: number, durationSec: number): SpeechMetrics {
  const said = lines.filter((l) => l.role === "user" && l.text !== PENDING).map((l) => l.text);
  const words = said.flatMap((t) => t.split(/\s+/).filter(Boolean));
  const fillers = said.reduce((n, t) => n + (t.match(FILLERS)?.length ?? 0), 0);
  // Prefer measured speaking time; fall back to an estimate if VAD timing was too short.
  const minutes = userSpeechMs > 5000 ? userSpeechMs / 60000 : Math.max(durationSec * 0.4, 1) / 60;
  return {
    wordsPerMinute: words.length ? Math.round(words.length / minutes) : 0,
    fillerPer100: words.length ? Math.round((fillers / words.length) * 1000) / 10 : 0,
  };
}

function postState(body: object) {
  return fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function readLocal(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function CallScreen({ companionId }: { companionId: CompanionId }) {
  const companion = getCompanion(companionId);
  // The daily check-in reports to family; the other companions are private to the caller.
  const isFamily = !companion.selfUse;

  const [profile, setProfile] = useState<Profile>(blankProfile);
  const [configured, setConfigured] = useState(true);
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("UAE");
  const [status, setStatus] = useState<Status>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [calm, setCalm] = useState(companion.startsCalm);
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [note, setNote] = useState<Reflection | null>(null);
  const [error, setError] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const startedAtRef = useRef(0);
  const speechStartRef = useRef<number | null>(null);
  const userSpeechMsRef = useRef(0);
  const linesRef = useRef<Line[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const fullTextRef = useRef(new Map<string, string>());
  const revealedRef = useRef(new Map<string, number>());
  const cutRef = useRef(new Set<string>());
  const captionItemRef = useRef<string | null>(null);
  const playingRef = useRef(false);
  const speedRef = useRef(companion.startsCalm ? 0.9 : 1);
  const captionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sawPlaybackEventsRef = useRef(false);

  const numbers = isFamily
    ? { emergencyNumber: profile.emergencyNumber, crisisLine: profile.crisisLine }
    : COUNTRIES[country] ?? COUNTRIES.UAE;
  const displayName = isFamily ? profile.name : userName.trim();

  useEffect(() => {
    if (isFamily) {
      // A fresh or closing call page means no call is running, so the dashboard never shows a stale "on a call".
      postState({ action: "call", callActive: false, calmMode: false });
      fetch("/api/state", { cache: "no-store" })
        .then((r) => r.json() as Promise<HearthState>)
        .then((s) => {
          setProfile(s.profile);
          setConfigured(s.configured);
        })
        .catch(() => undefined);
    } else {
      setUserName(readLocal(NAME_KEY));
      setCountry(readLocal(COUNTRY_KEY) || guessCountry());
    }
    const onHide = () => {
      if (!isFamily) return;
      navigator.sendBeacon(
        "/api/state",
        new Blob([JSON.stringify({ action: "call", callActive: false, calmMode: false })], {
          type: "application/json",
        }),
      );
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      teardown();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines]);

  function setAllLines(next: Line[]) {
    linesRef.current = next;
    setLines(next);
  }

  function upsertLine(id: string, role: Line["role"], text: string, append = false) {
    const existing = linesRef.current.find((l) => l.id === id);
    if (!existing) return setAllLines([...linesRef.current, { id, role, text }]);
    setAllLines(
      linesRef.current.map((l) =>
        l.id === id ? { ...l, text: append && l.text !== PENDING ? l.text + text : text } : l,
      ),
    );
  }

  function send(event: object) {
    if (dcRef.current?.readyState === "open") dcRef.current.send(JSON.stringify(event));
  }

  function respondToTool(callId: string, output: object) {
    send({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: callId, output: JSON.stringify(output) },
    });
    send({ type: "response.create" });
  }

  function enterCalmMode() {
    setCalm(true);
    speedRef.current = 0.85;
    if (isFamily) postState({ action: "call", calmMode: true });
    send({ type: "session.update", session: { type: "realtime", audio: { output: { speed: 0.85 } } } });
  }

  function handleTool(name: string, callId: string, rawArgs: string) {
    let args: Partial<Crisis> = {};
    try {
      args = JSON.parse(rawArgs);
    } catch {}

    if (name === "set_calm_mode") {
      enterCalmMode();
      respondToTool(callId, { ok: true, note: "Calm mode is on. Use very short, slow, gentle sentences." });
    } else if (name === "escalate") {
      const alert = {
        reason: args.reason ?? "Safety concern",
        quote: args.quote ?? "",
        translation: args.translation?.trim() || undefined,
      };
      setCrisis(alert);
      setShowCrisis(true);
      enterCalmMode();
      if (isFamily) postState({ action: "alert", ...alert });
      respondToTool(callId, {
        ok: true,
        family_notified: isFamily,
        resources_shown: true,
        note: isFamily
          ? `${profile.caregiver} has been alerted. Calmly tell them to call ${numbers.emergencyNumber} now and stay with them.`
          : `Emergency and support numbers are on their screen. Stay with them, gently.`,
      });
    }
  }

  function handleEvent(message: MessageEvent) {
    const ev = JSON.parse(message.data);
    switch (ev.type) {
      case "input_audio_buffer.speech_started":
        speechStartRef.current = performance.now();
        // They talked over Hearth: its caption stops where its voice stopped.
        if (playingRef.current) cutCaption(captionItemRef.current);
        upsertLine(ev.item_id, "user", PENDING);
        break;
      case "input_audio_buffer.speech_stopped":
        if (speechStartRef.current !== null) {
          userSpeechMsRef.current += performance.now() - speechStartRef.current;
        }
        speechStartRef.current = null;
        break;
      case "conversation.item.input_audio_transcription.completed":
        upsertLine(ev.item_id, "user", String(ev.transcript ?? "").trim() || PENDING);
        break;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        fullTextRef.current.set(ev.item_id, (fullTextRef.current.get(ev.item_id) ?? "") + ev.delta);
        if (captionItemRef.current !== ev.item_id) {
          finishCaption(captionItemRef.current);
          captionItemRef.current = ev.item_id;
          revealedRef.current.set(ev.item_id, 0);
          upsertLine(ev.item_id, "assistant", PENDING);
        }
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        fullTextRef.current.set(ev.item_id, ev.transcript);
        break;
      case "response.done": {
        // Fallback if playback events never arrive: show the line after its estimated speaking time.
        const id = captionItemRef.current;
        if (!sawPlaybackEventsRef.current && id) {
          const secs = captionWords(id).length / (WORDS_PER_SEC * speedRef.current);
          setTimeout(() => finishCaption(id), secs * 1000);
        }
        break;
      }
      case "output_audio_buffer.started":
        sawPlaybackEventsRef.current = true;
        playingRef.current = true;
        setSpeaking(true);
        break;
      case "output_audio_buffer.stopped":
        playingRef.current = false;
        setSpeaking(false);
        finishCaption(captionItemRef.current);
        break;
      case "output_audio_buffer.cleared":
        playingRef.current = false;
        setSpeaking(false);
        cutCaption(captionItemRef.current);
        break;
      case "response.function_call_arguments.done":
        handleTool(ev.name, ev.call_id, ev.arguments);
        break;
      case "error":
        console.warn("Realtime error", ev.error);
        break;
    }
  }

  function captionWords(id: string) {
    return (fullTextRef.current.get(id) ?? "").split(/\s+/).filter(Boolean);
  }

  /** Advance the caption of the line Hearth is currently speaking. */
  function tickCaption() {
    const id = captionItemRef.current;
    if (!playingRef.current || !id || cutRef.current.has(id)) return;
    const words = captionWords(id);
    const next = Math.min(
      words.length,
      (revealedRef.current.get(id) ?? 0) + (CAPTION_TICK_MS / 1000) * WORDS_PER_SEC * speedRef.current,
    );
    revealedRef.current.set(id, next);
    const shown = words.slice(0, Math.floor(next)).join(" ");
    if (shown) upsertLine(id, "assistant", shown);
  }

  /** Hearth finished speaking this line: show all of it. */
  function finishCaption(id: string | null) {
    if (!id || cutRef.current.has(id)) return;
    const text = fullTextRef.current.get(id);
    if (!text) return;
    revealedRef.current.set(id, captionWords(id).length);
    upsertLine(id, "assistant", text);
  }

  /** Hearth was interrupted: keep only what it actually said. */
  function cutCaption(id: string | null) {
    if (!id || cutRef.current.has(id)) return;
    cutRef.current.add(id);
    const said = captionWords(id).slice(0, Math.floor(revealedRef.current.get(id) ?? 0)).join(" ");
    upsertLine(id, "assistant", said ? `${said} —` : PENDING);
  }

  function startMeter(stream: MediaStream) {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let last = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      const next = Math.min(1, Math.sqrt(sum / data.length) * 5);
      if (Math.abs(next - last) > 0.03) {
        last = next;
        setLevel(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  function teardown() {
    cancelAnimationFrame(rafRef.current);
    if (captionTimerRef.current) clearInterval(captionTimerRef.current);
    captionTimerRef.current = null;
    playingRef.current = false;
    finishCaption(captionItemRef.current);
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => undefined);
    if (audioRef.current) audioRef.current.srcObject = null;
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    setSpeaking(false);
    setLevel(0);
  }

  async function start() {
    if (!isFamily) {
      if (!userName.trim()) {
        setError("Tell me what to call you first.");
        return;
      }
      writeLocal(NAME_KEY, userName.trim());
      writeLocal(COUNTRY_KEY, country);
    }
    setError("");
    setStatus("connecting");
    setAllLines([]);
    setNote(null);
    setCalm(companion.startsCalm);
    setCrisis(null);
    setShowCrisis(false);
    userSpeechMsRef.current = 0;
    fullTextRef.current.clear();
    revealedRef.current.clear();
    cutRef.current.clear();
    captionItemRef.current = null;
    speedRef.current = companion.startsCalm ? 0.9 : 1;

    try {
      if (isFamily) await postState({ action: "call", callActive: true, calmMode: false });
      const tokenRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companion: companion.id, userName: userName.trim(), country }),
      });
      const token = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(token.error ?? "Could not start the call");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      startMeter(stream);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("message", handleEvent);
      // Hearth speaks first.
      dc.addEventListener("open", () => send({ type: "response.create" }));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: `Bearer ${token.value}`, "Content-Type": "application/sdp" },
      });
      if (!sdpRes.ok) throw new Error(`Voice connection failed (${sdpRes.status}): ${await sdpRes.text()}`);
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

      startedAtRef.current = Date.now();
      captionTimerRef.current = setInterval(tickCaption, CAPTION_TICK_MS);
      setStatus("live");
    } catch (err) {
      teardown();
      if (isFamily) postState({ action: "call", callActive: false, calmMode: false });
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function writeUp(transcript: TranscriptLine[], durationSec: number, speech: SpeechMetrics) {
    setStatus("analyzing");
    const res = isFamily
      ? await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, durationSec, speech }),
        })
      : await fetch("/api/reflect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companion: companion.id, userName: userName.trim(), transcript, durationSec }),
        });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not write today's note.");
      setStatus("error");
      return;
    }
    if (!isFamily) setNote(data as Reflection);
    setStatus("done");
  }

  async function end() {
    const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
    teardown();
    setCalm(false);
    if (isFamily) await postState({ action: "call", callActive: false, calmMode: false });

    const transcript = linesRef.current
      .filter((l) => l.text && l.text !== PENDING)
      .map(({ role, text }) => ({ role, text }));
    if (!transcript.some((l) => l.role === "user")) {
      setError("Hearth didn't hear anything on that call, so there's nothing to write up.");
      setStatus("idle");
      return;
    }
    await writeUp(transcript, durationSec, measureSpeech(linesRef.current, userSpeechMsRef.current, durationSec));
  }

  const live = status === "live";
  const greeting = companion.greeting
    .replace("{name}", (displayName || "there").toLowerCase())
    .replace("hi there. ", "hi. ");
  const headline = {
    idle: isFamily && !configured ? "who should hearth call?" : greeting,
    connecting: "ringing hearth…",
    live: calm ? "breathe in… and slowly out" : speaking ? "hearth is talking" : "i'm listening",
    analyzing: isFamily
      ? `writing today's note for ${profile.caregiver.toLowerCase()}…`
      : "writing you a little note…",
    done: isFamily
      ? `thank you, ${profile.name.toLowerCase()}. talk tomorrow.`
      : `thank you for talking, ${displayName.toLowerCase()}.`,
    error: "let's try that again",
  }[status];

  const orbScale = live && !speaking ? 1 + level * 0.25 : 1;
  const orbColour = calm
    ? "animate-breathe-slow bg-teal"
    : status === "analyzing"
      ? `animate-breathe ${companion.accent}`
      : companion.accent;

  return (
    <main
      className={`relative flex min-h-screen flex-col transition-colors duration-1000 ${calm ? "bg-[#dcebea]" : "bg-cream"}`}
    >
      <header className="flex items-center justify-between gap-3 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-3xl">
            hearth
          </Link>
          <span className={`pill hidden px-3 py-1 text-sm font-semibold sm:inline ${companion.accent}`}>
            {companion.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isFamily && (
            <Link href="/setup" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
              Not {profile.name}?
            </Link>
          )}
          {calm && (
            <span className="pill bg-teal px-4 py-1.5 text-sm font-semibold text-ink">calm mode</span>
          )}
          {isFamily ? (
            <Link
              href="/dashboard"
              target="_blank"
              className="pill border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-sage"
            >
              {profile.caregiver}&apos;s view →
            </Link>
          ) : (
            <>
              {displayName && (
                <Link
                  href={`/memory?p=${encodeURIComponent(personId(displayName))}`}
                  className="hidden text-sm text-muted underline-offset-4 hover:text-ink hover:underline sm:inline"
                >
                  Your memory
                </Link>
              )}
              <Link href="/companions" className="pill border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-sage">
                All companions
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-10 px-4 pb-10 text-center">
        <div className="relative flex h-60 w-60 items-center justify-center sm:h-72 sm:w-72">
          {live && speaking && !calm && (
            <>
              <span className={`animate-pulse-ring absolute inset-0 rounded-full ${companion.accent}`} />
              <span
                className={`animate-pulse-ring absolute inset-0 rounded-full ${companion.accent}`}
                style={{ animationDelay: "0.9s" }}
              />
            </>
          )}
          <div
            className={`relative flex h-full w-full items-center justify-center rounded-full shadow-[0_30px_80px_-30px_rgba(10,12,11,0.35)] transition-[background-color,transform] duration-300 ${orbColour}`}
            style={calm ? undefined : { transform: `scale(${orbScale})` }}
          >
            <span className="font-display text-5xl">hearth</span>
          </div>
        </div>

        <h1 className="font-display max-w-3xl text-5xl leading-[1.05] sm:text-6xl">{headline}</h1>

        {!isFamily && (status === "idle" || status === "error") && (
          <div className="flex w-full max-w-md flex-col gap-3 text-left">
            <label className="text-sm font-semibold text-ink/70" htmlFor="userName">
              What should I call you?
            </label>
            <input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your first name"
              className="rounded-2xl border border-ink/10 bg-card px-5 py-4 text-xl outline-none focus:border-ink/40 focus:bg-white"
            />
            <label className="flex items-center gap-2 text-sm text-muted">
              Emergency numbers for
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg bg-transparent font-semibold text-ink"
              >
                {Object.keys(COUNTRIES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error && <p className="max-w-xl text-lg font-semibold text-alert">{error}</p>}

        <div className="flex flex-col items-center gap-4">
          {live ? (
            <button
              onClick={end}
              className="pill bg-ink px-14 py-6 text-2xl font-bold text-cream transition hover:scale-[1.03]"
            >
              End call
            </button>
          ) : status === "done" && isFamily ? (
            <Link
              href="/dashboard"
              className="pill bg-lime px-12 py-6 text-2xl font-bold text-ink shadow-sm transition hover:scale-[1.03]"
            >
              See what {profile.caregiver} sees →
            </Link>
          ) : status === "done" ? null : isFamily && !configured ? (
            <Link
              href="/setup"
              className="pill bg-lime px-12 py-6 text-2xl font-bold text-ink shadow-sm transition hover:scale-[1.03]"
            >
              Set up the daily check-in
            </Link>
          ) : (
            <button
              onClick={start}
              disabled={status === "connecting" || status === "analyzing"}
              className={`pill px-14 py-6 text-2xl font-bold text-ink shadow-sm transition hover:scale-[1.03] disabled:opacity-60 ${companion.accent}`}
            >
              {status === "connecting" ? "Connecting…" : status === "analyzing" ? "One moment…" : "Talk to Hearth"}
            </button>
          )}
          {crisis && !showCrisis && (
            <button onClick={() => setShowCrisis(true)} className="text-sm font-semibold text-alert underline">
              Show emergency numbers
            </button>
          )}
        </div>

        {note && (
          <NoteCard
            note={note}
            name={displayName}
            memoryHref={`/memory?p=${encodeURIComponent(personId(displayName))}`}
            onAgain={() => {
              setNote(null);
              setAllLines([]);
              setStatus("idle");
            }}
          />
        )}

        {lines.length > 0 && !note && (
          <div className="w-full max-w-2xl rounded-3xl bg-card/80 p-6 text-left shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">live transcript</p>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
              {lines.map((l) => (
                <p key={l.id} dir="auto" className={`text-lg leading-snug ${l.role === "assistant" ? "text-ink" : "text-ink/70"}`}>
                  <span className="font-heading mr-2 text-sm text-muted">
                    {l.role === "assistant" ? "Hearth" : displayName || "You"}
                  </span>
                  {l.text}
                </p>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </section>

      {crisis && showCrisis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-coral/95 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">hearth · safety check</p>
            <h2 className="font-display mt-4 text-5xl leading-[1.05] sm:text-6xl">
              {isFamily
                ? `let's get you some help, ${profile.name.toLowerCase()}`
                : "you don't have to go through this alone"}
            </h2>
            {crisis.quote && (
              <p className="mt-6 text-xl text-ink/80">
                You said: <span dir="auto" className="italic">&ldquo;{crisis.quote}&rdquo;</span>
              </p>
            )}
            {/* Demo build: deliberately not tel: links, so a click on stage can't dial via a paired phone. */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="pill inline-block bg-alert px-12 py-6 text-3xl font-bold text-white shadow-lg"
              >
                Call {numbers.emergencyNumber} now
              </button>
              {!isFamily && (
                <button
                  type="button"
                  className="pill inline-block bg-white px-8 py-6 text-2xl font-bold text-ink shadow-lg"
                >
                  {numbers.crisisLine.name} · {numbers.crisisLine.number}
                </button>
              )}
            </div>
            <p className="mt-6 text-xl font-semibold">
              {isFamily
                ? `${profile.caregiver} has been told. I'm staying on the line with you.`
                : "I'm still here with you. Is there someone you trust you could call too?"}
            </p>
            {isFamily && (
              <p className="mt-2 text-base text-ink/70">
                Need to talk to someone? {numbers.crisisLine.name} {numbers.crisisLine.number}, free, any time.
              </p>
            )}
            <button onClick={() => setShowCrisis(false)} className="mt-8 text-base underline underline-offset-4">
              Back to the call
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
