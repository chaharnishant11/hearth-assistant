import { pronounsFor } from "@/lib/profile";
import type { ReactNode } from "react";
import type { CheckIn, Profile } from "@/lib/types";
import { cx } from "./ui";

const INK = "#0a0c0b";
const TEAL = "#87b3b5";
const MUTED = "#757070";

// viewBox sized close to the rendered width of a 4-up card at 1280px so 13px labels stay ~12px+.
const W = 240;
const H = 132;
const PL = 14;
const PR = 16;
const PT = 26;
const PB = 26;

function Chart({
  values,
  labels,
  min,
  max,
  format,
  latestKey,
  baseline,
}: {
  values: number[];
  labels: string[];
  min: number;
  max: number;
  format: (v: number) => string;
  latestKey: string;
  baseline?: { value: number; label: string };
}) {
  const n = values.length;
  const x = (i: number) =>
    n <= 1 ? (PL + W - PR) / 2 : PL + (i * (W - PL - PR)) / (n - 1);
  const y = (v: number) => PT + (1 - (v - min) / (max - min || 1)) * (H - PT - PB);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = n - 1;
  const lx = x(last);
  const ly = y(values[last]);
  const labelAbove = ly - 12 > 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 block h-auto w-full overflow-visible"
      role="img"
      aria-label={values.map((v, i) => `${labels[i]} ${format(v)}`).join(", ")}
    >
      {baseline && (
        <g>
          <line
            x1={PL}
            x2={W - PR}
            y1={y(baseline.value)}
            y2={y(baseline.value)}
            stroke={TEAL}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <text x={W - PR} y={y(baseline.value) - 6} fontSize={12} textAnchor="end" fill={MUTED}>
            {baseline.label}
          </text>
        </g>
      )}
      <path d={d} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {values.slice(0, -1).map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={INK} />
      ))}
      <g key={latestKey}>
        <circle className="hearth-pop" cx={lx} cy={ly} r={10} fill={TEAL} opacity={0.45} />
        <circle className="hearth-pop" cx={lx} cy={ly} r={5.5} fill={INK} />
        <text
          x={lx + 4}
          y={labelAbove ? ly - 12 : ly + 22}
          fontSize={13}
          fontWeight={700}
          textAnchor="end"
          fill={INK}
        >
          {format(values[last])}
        </text>
      </g>
      {labels.map((l, i) => (
        <text
          key={`${l}-${i}`}
          x={x(i)}
          y={H - 6}
          fontSize={12}
          textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
          dx={i === 0 ? -6 : i === last ? 6 : 0}
          fill={i === last ? INK : MUTED}
          fontWeight={i === last ? 700 : 400}
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

function TrendCard({
  title,
  headline,
  note,
  noteTone = "muted",
  caption,
  children,
}: {
  title: string;
  headline: string;
  note?: string;
  noteTone?: "muted" | "warn";
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-3xl bg-card p-5">
      <h3 className="font-heading text-lg leading-tight">{title}</h3>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-3xl leading-none">{headline}</span>
        {note && (
          <span
            className={cx(
              "pill px-2.5 py-0.5 text-xs font-semibold",
              noteTone === "warn" ? "bg-coral text-ink" : "bg-sage text-muted",
            )}
          >
            {note}
          </span>
        )}
      </div>
      {children}
      {caption && <p className="mt-2 text-xs text-muted">{caption}</p>}
    </div>
  );
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function Trends({ checkins, profile }: { checkins: CheckIn[]; profile: Profile }) {
  const days = checkins.slice(-7);
  if (days.length === 0) return null;
  const labels = days.map((c) => c.dayLabel);
  const latest = days[days.length - 1];
  const first = days[0];
  const latestKey = latest.id;

  const mood = days.map((c) => c.mood);
  const sleep = days.map((c) => c.wearable.sleepHours);
  const wpm = days.map((c) => c.speech.wordsPerMinute);
  const people = days.map((c) => c.peopleMentioned.length);

  const earlierSleep = avg(sleep.slice(0, -1));
  const pacePct = Math.round(
    ((latest.speech.wordsPerMinute - profile.baselineWpm) / profile.baselineWpm) * 100,
  );
  const { their } = pronounsFor(profile.relation);
  const paceNote = `${pacePct < 0 ? "−" : "+"}${Math.abs(pacePct)}% vs ${their} normal`;
  const peopleFalling =
    people.length > 1 && people[people.length - 1] < Math.max(...people.slice(0, -1));

  const wMin = Math.min(...wpm, profile.baselineWpm) - 6;
  const wMax = Math.max(...wpm, profile.baselineWpm) + 6;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-4xl leading-none sm:text-5xl">the last {days.length} days</h2>
        <p className="text-sm text-muted">
          Slow changes are easy to miss on a phone call. Hearth notices them.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TrendCard
          title="Mood"
          headline={`${latest.mood}/5`}
          note={latest.moodLabel}
          noteTone={latest.mood <= 2 ? "warn" : "muted"}
          caption={`${first.dayLabel}: ${first.mood}/5 → ${latest.dayLabel}: ${latest.mood}/5`}
        >
          <Chart values={mood} labels={labels} min={1} max={5} format={(v) => `${v}`} latestKey={latestKey} />
        </TrendCard>

        <TrendCard
          title="Sleep"
          headline={`${latest.wearable.sleepHours}h`}
          note={
            days.length > 1
              ? `avg ${earlierSleep.toFixed(1)}h before`
              : undefined
          }
          noteTone={latest.wearable.sleepHours < 5 ? "warn" : "muted"}
          caption="simulated watch data"
        >
          <Chart
            values={sleep}
            labels={labels}
            min={Math.min(3, Math.min(...sleep) - 0.5)}
            max={Math.max(8, Math.max(...sleep) + 0.5)}
            format={(v) => `${v}h`}
            latestKey={latestKey}
          />
        </TrendCard>

        <TrendCard
          title="Speaking pace"
          headline={`${latest.speech.wordsPerMinute} wpm`}
          note={paceNote}
          noteTone={pacePct <= -5 ? "warn" : "muted"}
          caption="Slower speech can be an early sign of tiredness or low mood."
        >
          <Chart
            values={wpm}
            labels={labels}
            min={wMin}
            max={wMax}
            format={(v) => `${v}`}
            latestKey={latestKey}
            baseline={{ value: profile.baselineWpm, label: `${their} normal · ${profile.baselineWpm}` }}
          />
        </TrendCard>

        <TrendCard
          title="People mentioned"
          headline={`${people[people.length - 1]}`}
          note={peopleFalling ? `${their} world is getting smaller` : undefined}
          noteTone="warn"
          caption={
            latest.peopleMentioned.length
              ? `Last call: ${latest.peopleMentioned.join(", ")}`
              : "Last call: nobody mentioned"
          }
        >
          <Chart
            values={people}
            labels={labels}
            min={0}
            max={Math.max(5, ...people)}
            format={(v) => `${v}`}
            latestKey={latestKey}
          />
        </TrendCard>
      </div>
    </section>
  );
}
