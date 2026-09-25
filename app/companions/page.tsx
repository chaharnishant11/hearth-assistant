import Link from "next/link";
import { connection } from "next/server";
import { COMPANIONS } from "@/lib/companions";
import { getState } from "@/lib/store";

export default async function CompanionsPage() {
  await connection();
  const { profile } = getState();
  const [checkin, ...selfUse] = COMPANIONS;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="font-display text-3xl">
          hearth
        </Link>
        <Link href="/setup" className="pill border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-sage">
          Set up for your family
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-4 pb-16 sm:px-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-6xl leading-[1.02] sm:text-7xl">
            companions that remember you.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-ink/75">
            Warm voice companions for the hard parts of life. Every one remembers your story, slows down
            when things feel like too much, and gets you to real help in a crisis.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* The daily check-in is set up by family, so it gets two doors: the call and the dashboard. */}
          <div className={`flex flex-col rounded-3xl p-8 lg:row-span-3 ${checkin.accent}`}>
            <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">{checkin.audience}</p>
            <p className="font-heading mt-3 text-5xl">{checkin.title}</p>
            <p className="mt-3 text-lg text-ink/75">{checkin.summary}</p>
            <p className="mt-2 text-sm text-ink/60">{checkin.privacy}</p>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <Link
                href="/call?c=checkin"
                className="pill bg-ink px-6 py-3.5 text-lg font-bold text-cream transition hover:scale-[1.02]"
              >
                Talk as {profile.name} →
              </Link>
              <Link
                href="/dashboard"
                className="pill bg-card px-6 py-3.5 text-lg font-semibold transition hover:scale-[1.02]"
              >
                {profile.caregiver}&apos;s dashboard
              </Link>
            </div>
          </div>

          {selfUse.map((c) => (
            <Link
              key={c.id}
              href={`/call?c=${c.id}`}
              className={`group flex items-start justify-between gap-6 rounded-3xl p-7 transition hover:-translate-y-1 hover:shadow-lg ${c.accent}`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">{c.audience}</p>
                <p className="font-heading mt-2 text-3xl">{c.title}</p>
                <p className="mt-2 text-base text-ink/75">{c.summary}</p>
                <p className="mt-1 text-sm text-ink/60">{c.privacy}</p>
              </div>
              <span className="pill mt-1 shrink-0 bg-card px-4 py-2 text-sm font-semibold transition group-hover:bg-white">
                Talk →
              </span>
            </Link>
          ))}
        </div>

        <p className="text-sm text-muted">
          Hearth is a companion, not therapy, and never diagnoses. In an emergency, call your local
          emergency number.
        </p>
      </section>
    </main>
  );
}
