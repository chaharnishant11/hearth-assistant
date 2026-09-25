import Link from "next/link";
import {
  AlertVignette,
  CallVignette,
  CountUp,
  DementiaFigure,
  ICONS,
  LanguageCaptions,
  MemoryVignette,
} from "@/components/home/Visuals";
import { COMPANIONS } from "@/lib/companions";

// Margaret's morning call, replayed in the hero. Delays roughly follow speaking pace.
const CALL = [
  { who: "Hearth", text: "Morning, Margaret. How's the knee after your walk to the park yesterday?", at: 0.3 },
  { who: "Margaret", text: "Not so bad, love. I didn't sleep much though.", at: 2.0 },
  { who: "Hearth", text: "I'm sorry to hear that. How are you feeling in yourself?", at: 3.4 },
] as const;
const FLAGGED_AT = 4.9;
const ALERT_AT = 6.6;

const STEPS = [
  { title: "it calls", body: "A warm voice, every morning. Nothing to install.", visual: <CallVignette /> },
  { title: "it remembers", body: "Every call picks up where the last one left off.", visual: <MemoryVignette /> },
  { title: "it tells you", body: "Trends and alerts, with the exact words behind them.", visual: <AlertVignette /> },
];

const PROMISES = [
  { icon: ICONS.heart, title: "Never diagnoses", body: "A companion that notices, never labels." },
  { icon: ICONS.lifebuoy, title: "Real help in a crisis", body: "Local emergency numbers, and family alerted." },
  { icon: ICONS.lock, title: "Private by default", body: "You choose what anyone else sees." },
  { icon: ICONS.quote, title: "No black box", body: "Every signal shows the words behind it." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-10">
        <Link href="/" className="font-display text-3xl">
          hearth
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold sm:gap-5">
          <Link href="/companions" className="hidden hover:underline hover:underline-offset-4 sm:inline">
            Companions
          </Link>
          <Link href="/dashboard" className="hidden hover:underline hover:underline-offset-4 sm:inline">
            Family dashboard
          </Link>
          <Link href="/setup" className="pill bg-ink px-4 py-2 text-cream">
            Set up for your family
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-8 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
        <div>
          <h1 className="font-display text-[3.4rem] leading-[0.98] sm:text-7xl lg:text-[5.6rem]">
            someone to talk to, every morning.
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-relaxed text-ink/75">
            A voice companion for the people you love. It calls, remembers, and tells you what matters, in
            their own words.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/companions"
              className="pill bg-lime px-7 py-4 text-lg font-bold shadow-sm transition hover:scale-[1.02]"
            >
              Try a call
            </Link>
            <Link
              href="/dashboard"
              className="pill border border-ink/20 px-7 py-4 text-lg font-semibold transition hover:bg-sage"
            >
              See the family dashboard
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] bg-card p-7 shadow-[0_40px_90px_-50px_rgba(10,12,11,0.45)] sm:p-9">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-pulse-ring absolute inset-0 rounded-full bg-lime" />
                <span className="relative h-10 w-10 rounded-full bg-lime" />
              </span>
              <p className="text-sm text-muted">Hearth is on a morning call with Margaret, 78, in Manchester</p>
            </div>

            <div className="mt-7 space-y-5">
              {CALL.map((line) => (
                <p key={line.text} className="hero-line text-lg leading-snug" style={{ animationDelay: `${line.at}s` }}>
                  <span className="font-heading mr-2 text-sm text-muted">{line.who}</span>
                  {line.text}
                </p>
              ))}
              <p className="hero-line text-lg leading-snug" style={{ animationDelay: `${FLAGGED_AT}s` }}>
                <span className="font-heading mr-2 text-sm text-muted">Margaret</span>
                Honestly,{" "}
                <span className="hero-mark" style={{ animationDelay: `${FLAGGED_AT + 0.8}s` }}>
                  my chest feels a bit tight
                </span>
                .
              </p>
            </div>
          </div>

          <div
            className="hero-alert relative -mt-6 ml-auto w-[92%] rounded-3xl bg-alert p-6 text-white shadow-[0_30px_60px_-30px_rgba(214,68,68,0.7)] sm:w-[85%]"
            style={{ animationDelay: `${ALERT_AT}s` }}
            role="note"
          >
            <p className="text-sm text-white/85">Sent to Nour in Abu Dhabi, during the call</p>
            <p className="font-heading mt-2 text-2xl">Mum mentioned chest tightness</p>
            <p className="mt-2 border-l-4 border-white/70 pl-3 text-lg italic">&ldquo;my chest feels a bit tight&rdquo;</p>
            <p className="mt-3 text-sm text-white/85">Hearth told Margaret to call 999 and stayed on the line.</p>
          </div>
        </div>
      </section>

      {/* Why it matters: figures instead of paragraphs */}
      <section className="bg-sage">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-10 sm:py-24">
          <h2 className="font-display text-5xl sm:text-6xl">why it matters</h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            <figure>
              <div className="text-6xl sm:text-7xl">
                <CountUp to={871} suffix=",000" />
              </div>
              <figcaption className="mt-3 text-lg text-ink/75">deaths a year linked to loneliness</figcaption>
            </figure>
            <figure>
              <DementiaFigure />
              <figcaption className="mt-3 text-lg text-ink/75">
                3 in 4 people with dementia are never diagnosed
              </figcaption>
            </figure>
            <figure>
              <div className="text-6xl sm:text-7xl">
                <CountUp to={63} suffix="M" />
              </div>
              <figcaption className="mt-3 text-lg text-ink/75">Americans caring for family, unpaid</figcaption>
            </figure>
          </div>
          <p className="mt-12 text-sm text-ink/55">
            WHO Commission on Social Connection, 2025. Alzheimer&apos;s Disease International. AARP, 2025.
          </p>
        </div>
      </section>

      {/* How it works: a real sequence, so it's numbered */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-10 sm:py-28">
        <h2 className="font-display text-5xl sm:text-6xl">how it works</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-[2rem] bg-sage/70 p-6">
              {step.visual}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-2xl text-ink/35">{i + 1}</span>
                <h3 className="font-heading text-3xl">{step.title}</h3>
              </div>
              <p className="mt-2 text-lg text-ink/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Companions */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-10 sm:pb-28">
        <h2 className="font-display text-5xl sm:text-6xl">one hearth, four companions</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {COMPANIONS.map((c, i) => (
            <li key={c.id} className="flex items-center gap-5 rounded-[2rem] border border-ink/10 p-5">
              <span
                className={`animate-breathe h-16 w-16 shrink-0 rounded-full ${c.accent}`}
                style={{ animationDelay: `${i * 0.7}s` }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-2xl">{c.title}</h3>
                <p className="text-ink/65">{c.audience}</p>
              </div>
              <Link
                href={`/call?c=${c.id}`}
                className={`pill shrink-0 px-4 py-2.5 font-semibold transition hover:scale-[1.03] ${c.accent}`}
              >
                Talk
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Languages */}
      <section className="bg-teal">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="font-display text-5xl leading-[1.02] sm:text-6xl">speaks the way you speak.</h2>
            <p className="mt-5 max-w-sm text-lg text-ink/80">Any language, any mix. It follows you when you switch.</p>
          </div>
          <LanguageCaptions />
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-10 sm:py-28">
        <h2 className="font-display text-5xl sm:text-6xl">careful by design</h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <li key={p.title} className="rounded-[2rem] bg-card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-lime">{p.icon}</span>
              <h3 className="font-heading mt-5 text-2xl">{p.title}</h3>
              <p className="mt-2 text-ink/70">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing call to action */}
      <section className="bg-ink text-cream">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-20 sm:px-10 sm:py-24 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display max-w-2xl text-5xl leading-[1.02] sm:text-6xl">
            set up hearth for someone you love.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/setup" className="pill bg-lime px-7 py-4 text-lg font-bold text-ink">
              Set up for your family
            </Link>
            <Link href="/companions" className="pill border border-cream/30 px-7 py-4 text-lg font-semibold">
              Try a call
            </Link>
          </div>
        </div>
        <footer className="mx-auto w-full max-w-6xl px-5 pb-10 text-sm text-cream/60 sm:px-10">
          Hearth is a companion, not therapy or medical care. In an emergency, call your local emergency number.
          Built at Hub71, Abu Dhabi.
        </footer>
      </section>
    </main>
  );
}
