import type { CheckIn } from "@/lib/types";
import { cx } from "./ui";

const lonelinessStyle: Record<CheckIn["loneliness"], string> = {
  low: "bg-mint",
  medium: "bg-stone/60",
  high: "bg-coral",
};

function MoodDots({ mood }: { mood: number }) {
  return (
    <div className="flex gap-1.5" aria-label={`Mood ${mood} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cx(
            "h-3.5 w-3.5 rounded-full",
            n <= mood ? "bg-ink" : "border-2 border-stone bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

function Meds({ taken }: { taken: boolean | null }) {
  if (taken === true)
    return (
      <span className="pill inline-flex items-center gap-1.5 bg-mint px-3 py-1 font-semibold">
        <span aria-hidden>✓</span> taken
      </span>
    );
  if (taken === false)
    return (
      <span className="pill inline-flex items-center gap-1.5 bg-coral px-3 py-1 font-semibold">
        <span aria-hidden>✗</span> missed
      </span>
    );
  return (
    <span className="pill inline-flex items-center gap-1.5 bg-stone/60 px-3 py-1 font-semibold">
      ? unsure
    </span>
  );
}

export function LatestCheckIn({
  checkin,
  fresh,
  relation,
}: {
  checkin: CheckIn;
  fresh: boolean;
  relation: string;
}) {
  const mins = Math.max(1, Math.round(checkin.durationSec / 60));
  return (
    <article
      key={checkin.id}
      className={cx(
        "rounded-3xl bg-card p-6 sm:p-8",
        fresh ? "hearth-fresh ring-4 ring-lime" : "hearth-rise",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
          Latest check-in · {checkin.dayLabel}
          {checkin.durationSec > 0 && ` · ${mins} min`}
        </p>
        {checkin.live && (
          <span className="pill inline-flex items-center gap-2 bg-coral px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-ink" />
            Live call · just now
          </span>
        )}
      </div>

      <h2 className="font-display mt-2 text-4xl leading-none sm:text-5xl">how {relation.toLowerCase()}&apos;s doing</h2>

      <dl className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-sage p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Mood</dt>
          <dd className="mt-1.5">
            <div className="font-heading text-xl">{checkin.moodLabel}</div>
            <div className="mt-2">
              <MoodDots mood={checkin.mood} />
            </div>
          </dd>
        </div>
        <div className="rounded-2xl bg-sage p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Loneliness</dt>
          <dd className="mt-2">
            <span
              className={cx(
                "pill inline-block px-3 py-1 font-semibold",
                lonelinessStyle[checkin.loneliness],
              )}
            >
              {checkin.loneliness}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl bg-sage p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            BP tablet
          </dt>
          <dd className="mt-2">
            <Meds taken={checkin.medsTaken} />
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-lg leading-relaxed">{checkin.summary}</p>

      <div className="mt-6 rounded-2xl bg-lime p-5">
        <p className="text-xs font-bold uppercase tracking-wider">What you could do</p>
        <p className="font-heading mt-1 text-xl leading-snug">{checkin.suggestedAction}</p>
      </div>
    </article>
  );
}
