import type { CSSProperties } from "react";

/** A number that counts up when scrolled into view. */
export function CountUp({ to, suffix }: { to: number; suffix?: string }) {
  return (
    <span className="font-display tabular-nums">
      <span className="count-up" style={{ "--to": to } as CSSProperties} />
      {suffix}
    </span>
  );
}

function Person({ fade, delay }: { fade?: boolean; delay?: number }) {
  return (
    <svg
      viewBox="0 0 40 64"
      className={`h-20 w-12 ${fade ? "person-fade" : ""}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      aria-hidden
    >
      <circle cx="20" cy="12" r="10" fill="currentColor" />
      <path d="M4 62c0-14 7-26 16-26s16 12 16 26z" fill="currentColor" />
    </svg>
  );
}

/** Four people; three fade to show "3 in 4 never diagnosed". */
export function DementiaFigure() {
  return (
    <div className="flex items-end gap-2 text-ink" role="img" aria-label="Three out of four people fade away">
      <Person />
      <Person fade delay={0} />
      <Person fade delay={0.15} />
      <Person fade delay={0.3} />
    </div>
  );
}

/** Step 1: Hearth's voice orb, ringing and talking. */
export function CallVignette() {
  return (
    <div className="relative grid h-44 place-items-center" aria-hidden>
      <span className="ring-out absolute h-28 w-28 rounded-full border-2 border-ink/25" />
      <span className="ring-out absolute h-28 w-28 rounded-full border-2 border-ink/25" style={{ animationDelay: "1.2s" }} />
      <div className="relative flex h-28 w-28 items-center justify-center gap-1.5 rounded-full bg-lime shadow-[0_20px_40px_-20px_rgba(10,12,11,0.5)]">
        {[0, 0.2, 0.4, 0.1, 0.3].map((d, i) => (
          <span key={i} className="eq-bar h-9 w-1.5 rounded-full bg-ink" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>
    </div>
  );
}

const MEMORIES = [
  { text: "Biscuit the cat", cls: "bg-mint left-[2%] top-[4%]", delay: 0 },
  { text: "Arthur's prize marrow", cls: "bg-coral right-[2%] top-[28%]", delay: 1.1 },
  { text: "Joan's in Leeds", cls: "bg-teal left-[8%] top-[53%]", delay: 0.6 },
  { text: "knee sore after walks", cls: "bg-lime right-[6%] top-[78%]", delay: 1.6 },
];

/** Step 2: the little things Hearth remembers, floating. */
export function MemoryVignette() {
  return (
    <div className="relative h-44" aria-hidden>
      <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage animate-breathe" />
      {MEMORIES.map((m) => (
        <span
          key={m.text}
          className={`drift pill absolute px-3 py-1.5 text-sm font-semibold shadow-sm ${m.cls}`}
          style={{ animationDelay: `${m.delay}s` }}
        >
          {m.text}
        </span>
      ))}
    </div>
  );
}

/** Step 3: a mood trend drawing itself down, then an alert with her words. */
export function AlertVignette() {
  return (
    <div className="relative h-44" aria-hidden>
      <div className="absolute inset-x-2 top-2 rounded-2xl bg-card p-4 shadow-sm">
        <svg viewBox="0 0 220 70" className="h-16 w-full">
          <polyline
            className="draw-line"
            points="4,14 40,16 76,24 112,38 148,34 184,52 216,60"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="216" cy="60" r="5" fill="var(--alert)" />
        </svg>
        <p className="text-xs text-muted">mood this week</p>
      </div>
      <div className="pop-in pill absolute bottom-1 right-2 origin-bottom-right bg-alert px-4 py-2 text-sm font-semibold text-white shadow-md">
        &ldquo;my chest feels a bit tight&rdquo;
      </div>
    </div>
  );
}

const CAPTIONS = [
  { text: "Arre, knee toh theek hai, but raat ko neend nahi aayi.", mix: "Hindi and English" },
  { text: "C'est difficile. تيتا passed away and I miss her every morning.", mix: "Arabic, English and French" },
  { text: "Not so bad, love. I didn't sleep much though.", mix: "English" },
];

/** Live captions cycling through mixed languages over a talking waveform. */
export function LanguageCaptions() {
  return (
    <div className="rounded-[2rem] bg-card p-7 shadow-[0_40px_80px_-50px_rgba(10,12,11,0.5)] sm:p-9">
      <div className="flex h-16 items-center gap-1.5" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="eq-bar w-1.5 rounded-full bg-teal"
            style={{ height: `${20 + ((i * 37) % 44)}px`, animationDelay: `${(i % 7) * 0.12}s` }}
          />
        ))}
      </div>
      <div className="mt-6 grid min-h-[7.5rem]">
        {CAPTIONS.map((c, i) => (
          <div key={c.mix} className="caption-cycle" style={{ animationDelay: `${i * 3.5}s` }}>
            <p dir="auto" className="text-2xl leading-snug sm:text-3xl">
              &ldquo;{c.text}&rdquo;
            </p>
            <p className="mt-3 text-sm text-muted">{c.mix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-7 w-7",
  "aria-hidden": true,
};

export const ICONS = {
  heart: (
    <svg {...ICON_PROPS}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
  lifebuoy: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
    </svg>
  ),
  lock: (
    <svg {...ICON_PROPS}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  quote: (
    <svg {...ICON_PROPS}>
      <path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6" />
    </svg>
  ),
};
