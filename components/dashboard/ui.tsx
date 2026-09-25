import type { Severity } from "@/lib/types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const severityChip: Record<Severity, string> = {
  urgent: "bg-alert text-white",
  watch: "bg-coral text-ink",
  info: "bg-teal text-ink",
};

export const severityBorder: Record<Severity, string> = {
  urgent: "border-alert",
  watch: "border-coral",
  info: "border-teal",
};

export const severityRank: Record<Severity, number> = {
  urgent: 0,
  watch: 1,
  info: 2,
};

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span
      className={cx(
        "pill inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider",
        severityChip[severity],
      )}
    >
      {severity}
    </span>
  );
}

/** Keyframes for live "animate in" effects. Scoped names to avoid clashes. */
export function DashboardStyles() {
  return (
    <style>{`
@keyframes hearth-rise {
  from { opacity: 0; transform: translateY(16px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
@keyframes hearth-drop {
  from { opacity: 0; transform: translateY(-18px); }
  to { opacity: 1; transform: none; }
}
@keyframes hearth-glow {
  0% { box-shadow: 0 0 0 0 rgba(214, 68, 68, 0.45); }
  100% { box-shadow: 0 0 0 22px rgba(214, 68, 68, 0); }
}
@keyframes hearth-fresh {
  0% { box-shadow: 0 0 0 0 rgba(200, 225, 60, 0.9); }
  100% { box-shadow: 0 0 0 16px rgba(239, 255, 159, 0); }
}
@keyframes hearth-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.5); }
  100% { transform: scale(1); }
}
.hearth-rise { animation: hearth-rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.hearth-banner { animation: hearth-drop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both, hearth-glow 2.2s ease-out 0.6s 3; }
.hearth-fresh { animation: hearth-rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both, hearth-fresh 1.6s ease-out 0.5s 3; }
.hearth-pop { transform-box: fill-box; transform-origin: center; animation: hearth-pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .hearth-rise, .hearth-banner, .hearth-fresh, .hearth-pop { animation: none; }
}
`}</style>
  );
}
