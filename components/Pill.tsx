import type { GateDecision, IntentStatus } from "@/lib/types";

const styles: Record<string, string> = {
  allowed:
    "bg-ok-soft text-ok border-ok/20",
  allow: "bg-ok-soft text-ok border-ok/20",
  denied: "bg-fail-soft text-fail border-fail/20",
  deny: "bg-fail-soft text-fail border-fail/20",
  escalated: "bg-warn-soft text-brass border-brass/25",
  escalate: "bg-warn-soft text-brass border-brass/25",
  pending: "bg-paper-2 text-ink-soft border-line",
  pass: "bg-ok-soft text-ok border-ok/20",
  fail: "bg-fail-soft text-fail border-fail/20",
  warn: "bg-warn-soft text-brass border-brass/25",
  info: "bg-paper-2 text-info border-line",
  active: "bg-ok-soft text-ok border-ok/20",
  mock: "bg-fail-soft text-seal border-seal/20",
};

export function Pill({
  tone,
  children,
}: {
  tone: IntentStatus | GateDecision | keyof typeof styles | string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${styles[tone] ?? styles.pending}`}
    >
      {children}
    </span>
  );
}
