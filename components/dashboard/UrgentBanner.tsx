import type { CheckIn, LiveAlert, Profile } from "@/lib/types";

function fmtTime(iso: string, timeZone?: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });
  } catch {
    return "";
  }
}

export function UrgentBanner({
  profile,
  liveAlerts,
  latest,
}: {
  profile: Profile;
  liveAlerts: LiveAlert[];
  latest?: CheckIn;
}) {
  const alert = liveAlerts[0];
  const urgentSignal = latest?.signals.find((s) => s.severity === "urgent");

  if (!alert && !latest?.urgent) return null;

  const reason =
    alert?.reason ??
    urgentSignal?.label ??
    "Hearth flagged something urgent in the latest call";
  const quote = alert?.quote ?? urgentSignal?.quote;
  const translation = alert ? alert.translation : urgentSignal?.quoteTranslation;
  const when = alert
    ? `${fmtTime(alert.at, profile.timeZone)} in ${profile.city} · ${fmtTime(alert.at)} your time`
    : `${latest?.dayLabel}'s call`;
  const key = alert?.id ?? latest?.id;
  const earlier = liveAlerts.slice(1);

  return (
    <section
      key={key}
      role="alert"
      className="hearth-banner rounded-3xl bg-alert p-6 text-white sm:p-10"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wider text-white/85">
        <span className="relative flex h-3 w-3">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-white" />
          <span className="relative h-3 w-3 rounded-full bg-white" />
        </span>
        <span>Urgent · {when}</span>
      </div>

      <h2 className="font-heading mt-4 text-3xl leading-tight sm:text-5xl">{reason}</h2>

      {quote && (
        <figure className="mt-5">
          <blockquote className="border-l-4 border-white/70 pl-5 text-xl italic leading-snug sm:text-2xl">
            <span dir="auto">&ldquo;{quote}&rdquo;</span>
          </blockquote>
          {translation && (
            <p className="mt-2 pl-5 text-base text-white/90">In English: &ldquo;{translation}&rdquo;</p>
          )}
          <figcaption className="mt-2 pl-5 text-sm text-white/80">
            {profile.relation}&apos;s exact words, heard by Hearth during the call.
          </figcaption>
        </figure>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          className="pill bg-white px-7 py-3.5 text-lg font-semibold text-ink shadow-sm transition hover:bg-cream"
        >
          Call {profile.relation}
        </button>
        <button
          type="button"
          className="pill bg-lime px-7 py-3.5 text-lg font-semibold text-ink shadow-sm transition hover:brightness-95"
        >
          Call {profile.emergencyNumber} ({profile.country})
        </button>
      </div>

      {earlier.length > 0 && (
        <ul className="mt-6 space-y-1 border-t border-white/25 pt-4 text-sm text-white/85">
          {earlier.map((a) => (
            <li key={a.id}>
              <span className="font-semibold">{fmtTime(a.at, profile.timeZone)}</span> ·{" "}
              {a.reason} — <span className="italic">&ldquo;{a.quote}&rdquo;</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
