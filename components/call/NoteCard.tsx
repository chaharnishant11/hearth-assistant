import Link from "next/link";
import type { Reflection } from "@/lib/types";

export function NoteCard({
  note,
  name,
  memoryHref,
  onAgain,
}: {
  note: Reflection;
  name: string;
  memoryHref: string;
  onAgain: () => void;
}) {
  return (
    <article className="w-full max-w-2xl rounded-3xl bg-card p-7 text-left shadow-sm sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        your note from today · private to you
      </p>
      <h2 dir="auto" className="font-display mt-3 text-4xl leading-[1.05]">{note.title.toLowerCase()}</h2>
      <p dir="auto" className="mt-4 text-lg leading-relaxed text-ink/85">{note.reflection}</p>

      {note.quote && (
        <blockquote dir="auto" className="mt-5 border-l-4 border-teal pl-4 text-lg italic text-ink/80">
          &ldquo;{note.quote}&rdquo;
          <span className="mt-1 block text-sm not-italic text-muted">{name}, today</span>
        </blockquote>
      )}

      {note.whatHelped.length > 0 && (
        <div className="mt-6">
          <p className="font-heading text-lg">what helped</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {note.whatHelped.map((h) => (
              <span key={h} className="pill bg-mint px-3 py-1 text-sm font-semibold">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-lime p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink/60">for the rest of today</p>
        <p dir="auto" className="mt-1 text-lg font-semibold">{note.gentleNextStep}</p>
      </div>

      {note.therapistNote && (
        <div className="mt-6 rounded-2xl bg-sage p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/60">
            for your therapist · only if you choose to share
          </p>
          <p dir="auto" className="mt-1 text-base">{note.therapistNote}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(note.therapistNote ?? "").catch(() => undefined)}
            className="pill mt-3 border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-card"
          >
            Copy note
          </button>
        </div>
      )}

      {note.memoryNotes.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          Hearth will remember: {note.memoryNotes.join(" · ")}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <Link href={memoryHref} className="pill bg-ink px-5 py-3 font-semibold text-cream">
          See everything Hearth remembers
        </Link>
        <button onClick={onAgain} className="text-base font-semibold underline underline-offset-4">
          Talk again
        </button>
      </div>
    </article>
  );
}
