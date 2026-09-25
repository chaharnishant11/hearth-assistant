"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COUNTRIES, RELATIONS } from "@/lib/profile";
import { profile as defaultProfile } from "@/lib/seed";
import type { HearthState, Profile } from "@/lib/types";

const field =
  "w-full rounded-2xl border border-ink/10 bg-card px-4 py-3 text-lg outline-none transition focus:border-ink/40 focus:bg-white";
const label = "mb-1.5 block text-sm font-semibold text-ink/70";

export default function SetupPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [about, setAbout] = useState(defaultProfile.about.join("\n"));
  const [sampleHistory, setSampleHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/state", { cache: "no-store" })
      .then((r) => r.json() as Promise<HearthState>)
      .then((s) => {
        setProfile(s.profile);
        setAbout(s.profile.about.join("\n"));
        setSampleHistory(s.sampleHistory);
      })
      .catch(() => undefined);
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaved(false);
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function chooseCountry(code: string) {
    setSaved(false);
    setProfile((p) => ({ ...p, ...COUNTRIES[code] }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const next: Profile = {
      ...profile,
      name: profile.name.trim(),
      caregiver: profile.caregiver.trim(),
      about: about
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "profile", profile: next, sampleHistory }),
    });
    setProfile(next);
    setSaving(false);
    setSaved(true);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="font-display text-3xl">
          hearth
        </Link>
      </header>

      <form onSubmit={save} className="mx-auto w-full max-w-3xl space-y-10 px-4 pb-20 sm:px-10">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">set up hearth for your family</h1>
          <p className="mt-4 text-lg text-ink/70">
            Tell Hearth who it will be calling. It uses these details to greet them by name, remember
            their life, and know which emergency number to give.
          </p>
        </div>

        <section className="space-y-5 rounded-3xl bg-sage p-6 sm:p-8">
          <h2 className="font-heading text-3xl">who hearth will call</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="name">Their first name</label>
              <input id="name" required className={field} value={profile.name}
                onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="relation">You call them</label>
              <select id="relation" className={field} value={profile.relation}
                onChange={(e) => update("relation", e.target.value)}>
                {RELATIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="age">Age</label>
              <input id="age" type="number" min={40} max={110} required className={field} value={profile.age}
                onChange={(e) => update("age", Number(e.target.value))} />
            </div>
            <div>
              <label className={label} htmlFor="city">City</label>
              <input id="city" required className={field} value={profile.city}
                onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="country">Country</label>
              <select id="country" className={field} value={profile.country}
                onChange={(e) => chooseCountry(e.target.value)}>
                {Object.keys(COUNTRIES).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="emergency">Emergency number</label>
              <input id="emergency" required className={field} value={profile.emergencyNumber}
                onChange={(e) => update("emergencyNumber", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="crisis">Support line for emotional crises</label>
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <input id="crisis" className={field} value={profile.crisisLine.name}
                  onChange={(e) => update("crisisLine", { ...profile.crisisLine, name: e.target.value })} />
                <input aria-label="Support line number" className={field} value={profile.crisisLine.number}
                  onChange={(e) => update("crisisLine", { ...profile.crisisLine, number: e.target.value })} />
              </div>
              <p className="mt-1.5 text-sm text-muted">Pre-filled for the country. Check the numbers before going live.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="about">Things Hearth should know (one per line)</label>
              <textarea id="about" rows={6} className={field} value={about}
                onChange={(e) => { setSaved(false); setAbout(e.target.value); }} />
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-card p-6 sm:p-8">
          <h2 className="font-heading text-3xl">about you</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="caregiver">Your first name</label>
              <input id="caregiver" required className={field} value={profile.caregiver}
                onChange={(e) => update("caregiver", e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="caregiverCity">Where you live</label>
              <input id="caregiverCity" required className={field} value={profile.caregiverCity}
                onChange={(e) => update("caregiverCity", e.target.value)} />
            </div>
          </div>
          <label className="flex items-start gap-3 text-base">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#0a0c0b]" checked={sampleHistory}
              onChange={(e) => { setSaved(false); setSampleHistory(e.target.checked); }} />
            <span>
              Start with a sample week of calls, so the dashboard has history to show.
              <span className="block text-sm text-muted">Turn this off to start completely fresh.</span>
            </span>
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving}
            className="pill bg-lime px-10 py-5 text-xl font-bold text-ink shadow-sm transition hover:scale-[1.02] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && (
            <>
              <Link href="/call" className="pill bg-ink px-8 py-5 text-lg font-bold text-cream">
                Start {profile.name}&apos;s first call →
              </Link>
              <Link href="/dashboard" className="pill border border-ink/15 px-8 py-5 text-lg font-semibold hover:bg-sage">
                Open your dashboard
              </Link>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
