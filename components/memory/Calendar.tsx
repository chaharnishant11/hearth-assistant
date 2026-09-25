import { getCompanion } from "@/lib/companions";
import type { Conversation } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Month grid with a dot per conversation, coloured by companion. */
export function Calendar({
  month,
  conversations,
  selected,
  onSelect,
  onMonth,
}: {
  month: Date;
  conversations: Conversation[];
  selected: string | null;
  onSelect: (day: string | null) => void;
  onMonth: (delta: number) => void;
}) {
  const byDay = new Map<string, Conversation[]>();
  for (const c of conversations) {
    const k = dayKey(c.at);
    byDay.set(k, [...(byDay.get(k) ?? []), c]);
  }

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const todayKey = dayKey(new Date().toISOString());

  return (
    <div className="rounded-[2rem] bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => onMonth(-1)} className="pill px-3 py-1.5 text-lg hover:bg-sage" aria-label="Previous month">
          ‹
        </button>
        <p className="font-heading text-xl">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
        <button onClick={() => onMonth(1)} className="pill px-3 py-1.5 text-lg hover:bg-sage" aria-label="Next month">
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const calls = byDay.get(key) ?? [];
          const isSelected = selected === key;
          return (
            <button
              key={key}
              disabled={!calls.length}
              onClick={() => onSelect(isSelected ? null : key)}
              aria-pressed={isSelected}
              aria-label={`${day}: ${calls.length} conversation${calls.length === 1 ? "" : "s"}`}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-sm transition ${
                isSelected ? "bg-ink text-cream" : calls.length ? "bg-sage hover:bg-mint" : "text-ink/40"
              } ${key === todayKey && !isSelected ? "ring-2 ring-ink/30" : ""}`}
            >
              <span className="font-semibold">{day}</span>
              {calls.length > 0 && (
                <span className="flex gap-0.5">
                  {calls.slice(0, 3).map((c) => (
                    <span key={c.id} className={`h-1.5 w-1.5 rounded-full ${getCompanion(c.companionId).accent}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
