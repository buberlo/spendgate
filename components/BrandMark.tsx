export function BrandMark({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative grid h-8 w-8 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-seal" />
        <span className="absolute inset-[5px] rounded-full border border-brass/70" />
        <span className="h-3 w-[2px] bg-ink" />
        <span className="absolute h-[2px] w-3 bg-ink" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg tracking-tight">SpendGate</span>
        {!compact ? (
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
            Mandate layer
          </span>
        ) : null}
      </span>
    </span>
  );
}
