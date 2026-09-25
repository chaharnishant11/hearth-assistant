"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HearthState } from "@/lib/types";
import { Header } from "@/components/dashboard/Header";
import { UrgentBanner } from "@/components/dashboard/UrgentBanner";
import { LatestCheckIn } from "@/components/dashboard/LatestCheckIn";
import { Signals } from "@/components/dashboard/Signals";
import { Trends } from "@/components/dashboard/Trends";
import { Memory } from "@/components/dashboard/Memory";
import { DashboardStyles } from "@/components/dashboard/ui";

const POLL_MS = 2000;
const FRESH_MS = 9000;

export default function DashboardPage() {
  const [state, setState] = useState<HearthState | null>(null);
  const [offline, setOffline] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const knownIds = useRef<Set<string> | null>(null);

  const apply = useCallback((next: HearthState) => {
    const ids = [...next.checkins.map((c) => c.id), ...next.liveAlerts.map((a) => a.id)];
    const known = knownIds.current;
    if (known) {
      const added = ids.filter((id) => !known.has(id));
      if (added.length > 0) {
        setFreshIds((prev) => new Set([...prev, ...added]));
        setTimeout(() => {
          setFreshIds((prev) => {
            const n = new Set(prev);
            for (const id of added) n.delete(id);
            return n;
          });
        }, FRESH_MS);
      }
    }
    knownIds.current = new Set(ids);
    setState(next);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      apply((await res.json()) as HearthState);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [apply]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const reset = useCallback(async () => {
    if (!confirm("Clear every check-in and alert from this dashboard? This can't be undone.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
        cache: "no-store",
      });
      if (res.ok) apply((await res.json()) as HearthState);
    } finally {
      setResetting(false);
    }
  }, [apply]);

  if (!state) {
    return (
      <main className="flex flex-1 items-center justify-center bg-cream p-8">
        <DashboardStyles />
        <div className="flex items-center gap-4">
          <span className="animate-breathe h-4 w-4 rounded-full bg-teal" />
          <span className="font-display text-4xl">hearth</span>
          <span className="text-muted">{offline ? "reconnecting…" : "connecting…"}</span>
        </div>
      </main>
    );
  }

  const { profile, checkins, liveAlerts, callActive, calmMode, configured } = state;

  if (!configured) {
    return (
      <main className="flex flex-1 items-center justify-center bg-cream p-8">
        <div className="max-w-xl">
          <p className="font-display text-5xl leading-[1.02]">set up the daily check-in first</p>
          <p className="mt-4 text-lg text-ink/70">
            Tell Hearth who it will be calling. This dashboard fills up from their real calls.
          </p>
          <Link href="/setup" className="pill mt-6 inline-block bg-lime px-6 py-3 text-lg font-bold">
            Set up for your family
          </Link>
        </div>
      </main>
    );
  }
  const latest = checkins[checkins.length - 1];

  return (
    <main className="flex-1 overflow-x-hidden bg-cream">
      <DashboardStyles />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
        <Header
          profile={profile}
          callActive={callActive}
          calmMode={calmMode}
          lastDayLabel={latest?.dayLabel}
          offline={offline}
          onReset={reset}
          resetting={resetting}
        />

        <UrgentBanner profile={profile} liveAlerts={liveAlerts} latest={latest} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-5">
            {latest ? (
              <LatestCheckIn
                key={latest.id}
                checkin={latest}
                relation={profile.relation}
                fresh={freshIds.has(latest.id)}
              />
            ) : (
              <div className="rounded-3xl bg-card p-8">
                <p className="font-heading text-2xl">No calls yet</p>
                <p className="mt-2 text-muted">
                  Everything here comes from {profile.name}&apos;s real calls with Hearth.
                </p>
                <Link href="/call?c=checkin" className="pill mt-5 inline-block bg-lime px-5 py-3 font-bold">
                  Start {profile.name}&apos;s first call
                </Link>
              </div>
            )}
          </div>
          <div className="min-w-0 lg:col-span-7">
            <Signals checkins={checkins} freshIds={freshIds} relation={profile.relation} />
          </div>
        </div>

        <Trends checkins={checkins} profile={profile} />

        <Memory profile={profile} checkins={checkins} />

        <footer className="pb-4 text-center text-sm text-muted">
          Hearth never diagnoses. Signals are conversation-based observations for family, not
          medical advice.
        </footer>
      </div>
    </main>
  );
}
