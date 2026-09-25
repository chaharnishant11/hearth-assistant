import { pronounsFor } from "@/lib/profile";
import type { CheckIn, Profile } from "@/lib/types";

export function Memory({ profile, checkins }: { profile: Profile; checkins: CheckIn[] }) {
  const seen = new Set<string>();
  const notes: { text: string; day: string; live?: boolean }[] = [];
  for (const c of [...checkins].reverse()) {
    for (const text of c.memoryNotes) {
      if (seen.has(text)) continue;
      seen.add(text);
      notes.push({ text, day: c.dayLabel, live: c.live });
    }
  }
  const recent = notes.slice(0, 8);

  return (
    <section className="rounded-3xl bg-card p-6 sm:p-8">
      <h2 className="font-display text-4xl leading-none sm:text-5xl">what hearth remembers</h2>
      <p className="mt-2 text-muted">
        Carried from call to call, so {profile.relation} never has to repeat {pronounsFor(profile.relation).themselves} and every chat picks up
        where the last one left off.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-heading text-xl">from recent calls</h3>
          <ul className="mt-3 space-y-3">
            {recent.map((n, i) => (
              <li
                key={n.text}
                className="hearth-rise flex items-start gap-3 rounded-2xl bg-sage p-4"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="pill mt-0.5 shrink-0 bg-card px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-muted">
                  {n.day}
                </span>
                <span className="leading-snug">{n.text}</span>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="rounded-2xl bg-sage p-4 text-muted">Nothing yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-xl">about {profile.name.toLowerCase()}</h3>
          <ul className="mt-3 space-y-3">
            {profile.about.map((a) => (
              <li key={a} className="rounded-2xl bg-sage p-4 leading-snug">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
