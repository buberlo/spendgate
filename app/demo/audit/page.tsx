"use client";

import { shortHash } from "@/lib/hash";
import { formatWhen } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AuditPage() {
  const { world, exportWorld } = useStore();
  if (!world) return null;
  const events = [...world.audit].reverse();

  function download() {
    const blob = new Blob([exportWorld()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spendgate-ledger.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
            Append-only
          </p>
          <h1 className="font-serif text-4xl">Audit log</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Each event carries a SHA-256 over its canonical payload and the
            previous hash. Tampering with any row breaks the chain.
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          className="rounded-full border border-line px-4 py-2 text-sm"
        >
          Export ledger JSON
        </button>
      </header>
      <ol className="space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-2xl border border-line bg-white/70 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-xs">
                #{event.seq} · {event.type}
              </p>
              <p className="text-xs text-ink-soft">{formatWhen(event.at)}</p>
            </div>
            <p className="mt-1 text-sm">
              {event.actor.name}{" "}
              <span className="text-ink-soft">
                ({event.actor.kind}) → {event.entityType} {event.entityId}
              </span>
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-5 text-ink-soft">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
            <p className="mt-2 font-mono text-[11px] text-ink-soft">
              prev {shortHash(event.prevHash)} · hash {shortHash(event.hash)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
