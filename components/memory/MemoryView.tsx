"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompanion } from "@/lib/companions";
import { CATEGORY_LABELS, personId } from "@/lib/people";
import type { Conversation, MemoryFact, Person } from "@/lib/types";
import { Calendar, dayKey } from "./Calendar";

interface PersonSummary {
  id: string;
  name: string;
  conversations: number;
  lastAt: string | null;
}

interface MemoryData {
  people: PersonSummary[];
  person: Person | null;
}

function savedName() {
  try {
    return localStorage.getItem("hearth:name") ?? "";
  } catch {
    return "";
  }
}

function formatDate(iso: string, withTime = false) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  });
}

/** familyView: what a family member may see. Private companions' conversations and learnings are left out. */
export function MemoryView({ initialPersonId, familyView }: { initialPersonId: string | null; familyView: boolean }) {
  const [data, setData] = useState<MemoryData | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [day, setDay] = useState<string | null>(null);

  async function load(id: string | null) {
    const res = await fetch(`/api/memory${id ? `?p=${encodeURIComponent(id)}` : ""}`, { cache: "no-store" });
    const next = (await res.json()) as MemoryData;
    setData(next);
    setDay(null);
    const last = next.person?.conversations.at(-1);
    if (last) setMonth(new Date(last.at));
  }

  async function post(body: object) {
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setData((await res.json()) as MemoryData);
  }

  useEffect(() => {
    const name = savedName();
    load(initialPersonId ?? (name ? personId(name) : null));
  }, []);

  const loaded = data?.person ?? null;
  const person: Person | null =
    loaded && familyView
      ? {
          ...loaded,
          summary: "",
          facts: loaded.facts.filter((f) => !f.private),
          followUps: loaded.followUps.filter((f) => !f.private),
          conversations: loaded.conversations.filter((c) => !getCompanion(c.companionId).selfUse),
        }
      : loaded;
  const conversations = person ? [...person.conversations].reverse() : [];
  const shown = day ? conversations.filter((c) => dayKey(c.at) === day) : conversations;
  const grouped = new Map<string, MemoryFact[]>();
  for (const f of person?.facts ?? []) grouped.set(f.category, [...(grouped.get(f.category) ?? []), f]);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-10">
        <Link href="/" className="font-display text-3xl">
          hearth
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/companions" className="pill bg-ink px-4 py-2 text-cream">
            Talk to a companion
          </Link>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-10">
        {data && !familyView && data.people.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Whose memory">
            {data.people.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === person?.id}
                onClick={() => load(p.id)}
                className={`pill px-4 py-2 text-sm font-semibold ${
                  p.id === person?.id ? "bg-ink text-cream" : "border border-ink/15 hover:bg-sage"
                }`}
              >
                {p.name}
                <span className="ml-2 opacity-60">{p.conversations}</span>
              </button>
            ))}
          </div>
        )}

        {!data ? (
          <p className="text-muted">Loading memory…</p>
        ) : !person ? (
          <div className="rounded-[2rem] bg-card p-10">
            <h1 className="font-display text-5xl">nothing remembered yet</h1>
            <p className="mt-3 text-lg text-ink/70">Talk to any companion and Hearth will start remembering.</p>
            <Link href="/companions" className="pill mt-6 inline-block bg-lime px-6 py-3 font-bold">
              Talk to a companion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">
              what hearth remembers about {person.name.toLowerCase()}
            </h1>
            {person.summary && (
              <p dir="auto" className="mt-6 max-w-3xl text-xl leading-relaxed text-ink/80">
                {person.summary}
              </p>
            )}
            <p className="mt-3 text-sm text-muted">
              {familyView
                ? "Family view: from the daily check-in only. Private conversations are never shown here."
                : "Shared by every companion. Updated by Hearth after each conversation."}
            </p>

            {/* What Hearth knows */}
            <section className="mt-12">
              <h2 className="font-heading text-3xl">what it knows</h2>
              {grouped.size === 0 ? (
                <p className="mt-3 text-muted">Nothing yet. It learns as you talk.</p>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {[...grouped.entries()].map(([category, facts]) => (
                    <div key={category} className="rounded-[2rem] bg-sage p-6">
                      <h3 className="font-heading text-lg text-ink/70">{CATEGORY_LABELS[category] ?? category}</h3>
                      <ul className="mt-3 space-y-3">
                        {facts.map((f) => (
                          <li key={f.id} className="group flex items-start gap-3">
                            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${getCompanion(f.source).accent}`} />
                            <div className="min-w-0 flex-1">
                              <p dir="auto" className="text-base leading-snug">
                                {f.text}
                              </p>
                              <p className="mt-0.5 text-xs text-muted">
                                Learned in {getCompanion(f.source).title}, {formatDate(f.updatedAt)}
                                {f.private && ", private"}
                              </p>
                            </div>
                            {!familyView && (
                            <button
                              onClick={() => post({ action: "forget-fact", personId: person.id, factId: f.id })}
                              className="pill shrink-0 px-2.5 py-1 text-xs font-semibold text-muted hover:bg-card hover:text-ink"
                              aria-label={`Forget: ${f.text}`}
                            >
                              Forget
                            </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {person.followUps.length > 0 && (
              <section className="mt-10 rounded-[2rem] bg-lime p-6 sm:p-8">
                <h2 className="font-heading text-2xl">it will gently check on</h2>
                <ul className="mt-3 space-y-2">
                  {person.followUps.map((f) => (
                    <li key={f.text} dir="auto" className="text-lg">
                      {f.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Calendar and conversation history */}
            <section className="mt-14 grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 className="font-heading text-3xl">conversations</h2>
                <p className="mt-2 text-muted">
                  {person.conversations.length} so far. Pick a day to see just that day.
                </p>
                <div className="mt-6">
                  <Calendar
                    month={month}
                    conversations={person.conversations}
                    selected={day}
                    onSelect={setDay}
                    onMonth={(delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))}
                  />
                </div>
              </div>

              <ol className="space-y-4 lg:col-span-7">
                {day && (
                  <li>
                    <button onClick={() => setDay(null)} className="text-sm font-semibold underline underline-offset-4">
                      Show all days
                    </button>
                  </li>
                )}
                {shown.length === 0 && <li className="text-muted">No conversations yet.</li>}
                {shown.map((c) => (
                  <ConversationItem key={c.id} conversation={c} name={person.name} />
                ))}
              </ol>
            </section>

            {!familyView && (
            <div className="mt-16 border-t border-ink/10 pt-6">
              <button
                onClick={() => {
                  if (confirm(`Forget everything Hearth knows about ${person.name}? This can't be undone.`)) {
                    post({ action: "forget-person", personId: person.id });
                  }
                }}
                className="text-sm font-semibold text-alert underline underline-offset-4"
              >
                Forget everything about {person.name}
              </button>
            </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ConversationItem({ conversation: c, name }: { conversation: Conversation; name: string }) {
  const companion = getCompanion(c.companionId);
  const mins = Math.max(1, Math.round(c.durationSec / 60));
  return (
    <li className={`rounded-[2rem] p-6 ${c.urgent ? "bg-[#fbe3df]" : "bg-card"}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={`pill px-3 py-1 font-semibold ${companion.accent}`}>{companion.title}</span>
        <span className="text-muted">
          {formatDate(c.at, !c.sample)}, {mins} min
        </span>
        {c.urgent && <span className="pill bg-alert px-3 py-1 font-semibold text-white">urgent</span>}
      </div>
      <h3 dir="auto" className="font-heading mt-3 text-2xl">
        {c.title}
      </h3>
      <p dir="auto" className="mt-2 text-ink/80">
        {c.summary}
      </p>
      {c.quote && (
        <blockquote dir="auto" className="mt-3 border-l-4 border-teal pl-4 italic text-ink/75">
          &ldquo;{c.quote}&rdquo;
        </blockquote>
      )}
      {c.transcript.length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">Read the conversation</summary>
          <div className="mt-3 space-y-2 border-l-2 border-ink/10 pl-4">
            {c.transcript.map((l, i) => (
              <p key={i} dir="auto" className="text-sm leading-snug">
                <span className="font-heading mr-2 text-muted">{l.role === "user" ? name : "Hearth"}</span>
                {l.text}
              </p>
            ))}
          </div>
        </details>
      ) : (
        c.sample && <p className="mt-3 text-xs text-muted">Sample history, no transcript.</p>
      )}
    </li>
  );
}
