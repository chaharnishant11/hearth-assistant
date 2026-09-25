import type { CheckIn, Signal } from "@/lib/types";
import { SeverityChip, cx, severityBorder, severityRank } from "./ui";

function sortSignals(signals: Signal[]) {
  return [...signals].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function SignalRow({
  signal,
  index,
  fresh,
  compact,
}: {
  signal: Signal;
  index: number;
  fresh?: boolean;
  compact?: boolean;
}) {
  return (
    <li
      className={cx(
        "hearth-rise rounded-2xl p-5",
        signal.severity === "urgent" ? "bg-[#fbe3df]" : "bg-sage",
        fresh && "ring-2 ring-lime",
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SeverityChip severity={signal.severity} />
        <h3 className={cx("font-heading leading-tight", compact ? "text-lg" : "text-xl")}>
          {signal.label}
        </h3>
        {fresh && (
          <span className="pill bg-lime px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            new
          </span>
        )}
      </div>
      <blockquote
        className={cx(
          "mt-3 border-l-4 pl-4 italic leading-snug",
          severityBorder[signal.severity],
          compact ? "text-base" : "text-lg sm:text-xl",
        )}
      >
        <span dir="auto">&ldquo;{signal.quote}&rdquo;</span>
      </blockquote>
      {signal.quoteTranslation && (
        <p className="mt-1 pl-5 text-sm text-ink/70">
          <span className="font-semibold">In English:</span> &ldquo;{signal.quoteTranslation}&rdquo;
        </p>
      )}
      <p className="mt-2 text-sm text-muted">{signal.explanation}</p>
    </li>
  );
}

export function Signals({
  checkins,
  freshIds,
  relation,
}: {
  checkins: CheckIn[];
  freshIds: Set<string>;
  relation: string;
}) {
  const latest = checkins[checkins.length - 1];
  const latestSignals = latest ? sortSignals(latest.signals) : [];
  const earlier = checkins
    .slice(0, -1)
    .reverse()
    .filter((c) => c.signals.length > 0);
  const earlierCount = earlier.reduce((n, c) => n + c.signals.length, 0);
  const latestFresh = latest ? freshIds.has(latest.id) : false;

  return (
    <section className="rounded-3xl bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-4xl leading-none sm:text-5xl">why hearth flagged this</h2>
        {latest && (
          <span className="text-sm text-muted">
            {latestSignals.length} signal{latestSignals.length === 1 ? "" : "s"} from{" "}
            {latest.dayLabel}&apos;s call
          </span>
        )}
      </div>
      <p className="mt-2 text-muted">
        Every signal shows {relation}&apos;s exact words. No black box, no guesswork.
      </p>

      {latestSignals.length > 0 ? (
        <ul key={latest?.id} className="mt-6 space-y-4">
          {latestSignals.map((s, i) => (
            <SignalRow
              key={`${latest?.id}-${s.kind}-${s.label}`}
              signal={s}
              index={i}
              fresh={latestFresh}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl bg-sage p-5 text-lg">
          Nothing flagged in the latest call.
        </p>
      )}

      {earlierCount > 0 && (
        <details className="group mt-6">
          <summary className="pill inline-flex cursor-pointer list-none items-center gap-2 bg-sage px-4 py-2 text-sm font-semibold hover:bg-mint">
            <span className="transition group-open:rotate-90" aria-hidden>
              ›
            </span>
            Earlier this week · {earlierCount} signal{earlierCount === 1 ? "" : "s"}
          </summary>
          <div className="mt-4 space-y-5">
            {earlier.map((c) => (
              <div key={c.id}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                  {c.dayLabel} · {c.moodLabel}
                </p>
                <ul className="space-y-3">
                  {sortSignals(c.signals).map((s, i) => (
                    <SignalRow key={`${c.id}-${s.kind}-${s.label}`} signal={s} index={i} compact />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
