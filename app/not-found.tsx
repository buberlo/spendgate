import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-seal">
        404
      </p>
      <h1 className="mt-3 font-serif text-4xl">No mandate at this path</h1>
      <Link href="/" className="mt-6 rounded-full bg-ink px-4 py-2 text-paper">
        Back to SpendGate
      </Link>
    </div>
  );
}
