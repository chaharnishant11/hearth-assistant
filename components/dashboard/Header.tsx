import { personId } from "@/lib/people";
import type { Profile } from "@/lib/types";

export function Header({
  profile,
  callActive,
  calmMode,
  lastDayLabel,
  offline,
  onReset,
  resetting,
}: {
  profile: Profile;
  callActive: boolean;
  calmMode: boolean;
  lastDayLabel?: string;
  offline: boolean;
  onReset: () => void;
  resetting: boolean;
}) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="font-display text-6xl leading-none sm:text-7xl">hearth</div>
        <p className="mt-3 text-base text-muted sm:text-lg">
          for {profile.caregiver} · watching over {profile.name}, {profile.age},{" "}
          {profile.city}
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 md:items-end">
        {callActive ? (
          <span className="pill inline-flex flex-wrap items-center gap-3 border border-coral bg-card px-5 py-2.5 shadow-sm">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-pulse-ring absolute inset-0 rounded-full bg-coral" />
              <span className="relative h-3.5 w-3.5 rounded-full bg-coral ring-2 ring-[#e98b7a]" />
            </span>
            <span className="font-semibold">Hearth is on a call with {profile.relation} now</span>
            {calmMode && (
              <span className="pill bg-teal px-3 py-0.5 text-xs font-semibold text-ink">
                · calm mode
              </span>
            )}
          </span>
        ) : (
          <span className="pill inline-flex items-center gap-2 bg-sage px-5 py-2.5 text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-teal" />
            Last call: {lastDayLabel ?? "none yet"}
          </span>
        )}
        <div className="flex items-center gap-3 text-xs text-muted">
          {offline && <span>reconnecting…</span>}
          <a
            href={`/memory?p=${encodeURIComponent(personId(profile.name))}&view=family`}
            className="underline-offset-4 hover:text-ink hover:underline"
          >
            Conversation history
          </a>
          <a href="/setup" className="underline-offset-4 hover:text-ink hover:underline">
            Edit details
          </a>
          <button
            type="button"
            onClick={onReset}
            disabled={resetting}
            className="underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
          >
            {resetting ? "Clearing…" : "Clear check-ins"}
          </button>
        </div>
      </div>
    </header>
  );
}
