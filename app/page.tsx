import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const wedges = [
  {
    kicker: "01",
    title: "Multi-principal, not cardholder.",
    body: "Household, shared wallet, company cost centre, parental. Several living principals, ranked, with auto-approve and hard-approve rails. The agent is bound to one of them — it is never the payer of record.",
  },
  {
    kicker: "02",
    title: "Per-intent spend contracts.",
    body: "Caps, merchant categories, time windows, and a cryptographic agent identity. Evaluation is against the signed intent, not a monthly card limit.",
  },
  {
    kicker: "03",
    title: "Allow, deny, or escalate.",
    body: "Under the bound principal’s auto rail, the gate allows. Over it, the hierarchy is walked. Contract breaches (category, window, identity, hard cap) deny. Every outcome is sealed.",
  },
  {
    kicker: "04",
    title: "Mandate + append-only log.",
    body: "Issuing a policy seals a mandate: principals, contract, agent fingerprint, terms hash. The ledger is hash-chained. That is the evidence, not a dashboard screenshot.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <BrandMark />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/#wedge" className="hidden text-ink-soft hover:text-ink sm:inline">
            Thesis
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-seal-deep"
          >
            Open live demo
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-seal">
            EU · Liability layer · Agentic commerce
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            The liability layer agents don’t have.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
            SpendGate sits over any shopping agent — not as a chat UI, not as a
            Visa spend-limit clone — as the multi-principal policy plane that
            binds a purchase intent to a sealed mandate, an approval hierarchy,
            and an append-only evidence pack.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="rounded-full bg-seal px-5 py-2.5 text-paper hover:bg-seal-deep"
            >
              Run the sandbox
            </Link>
            <Link
              href="/demo/policies/new"
              className="rounded-full border border-line px-5 py-2.5 hover:bg-paper-2"
            >
              Issue a mandate
            </Link>
          </div>
          <p className="mt-6 max-w-lg text-sm text-ink-soft">
            Seeded with a parental household (Kern) and a German GmbH procurement
            desk (Nordwerk). Persistence is in-browser. No bank, no scheme, no
            live card rail.
          </p>
        </div>

        <aside className="relative">
          <div className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-full seal-ring lg:block" />
          <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-[0_20px_60px_-30px_rgba(20,18,14,0.45)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
              Sealed mandate · man_kern_2026q3
            </p>
            <h2 className="mt-2 font-serif text-3xl">Kern household · parental</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-ink-soft">Principals</dt>
                <dd>Elena · Markus · Lea</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-ink-soft">Bound agent</dt>
                <dd className="font-mono text-xs">LeaShopper · anthropic</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                <dt className="text-ink-soft">Per-intent rail</dt>
                <dd>EUR 500 · groceries / education / transport / electronics</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Window</dt>
                <dd>07:00–21:00 Europe/Berlin</dd>
              </div>
            </dl>
            <p className="mt-6 font-mono text-[11px] leading-5 text-ink-soft">
              termsHash
              <br />
              <span className="text-ink">e3b0…a sealed snapshot, not a setting.</span>
            </p>
          </div>
        </aside>
      </section>

      <div className="rule mx-auto w-full max-w-6xl" />

      <section id="wedge" className="mx-auto w-full max-w-6xl px-4 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brass">
          The wedge
        </p>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
          Card networks price liability for a cardholder. Agentic commerce has
          many principals and one payment.
        </h2>
        <p className="mt-6 max-w-2xl text-ink-soft">
          When an agent buys the wrong thing, the question is not “was the card
          present.” It is which mandate bound this intent, which principal
          approved it, and whether the merchant’s charge matches the signed
          purpose. SpendGate is that layer — EU-native, scheme-agnostic, sitting
          over any agent runtime.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {wedges.map((item) => (
            <article
              key={item.kicker}
              className="rounded-2xl border border-line bg-white/60 p-6"
            >
              <p className="font-mono text-[11px] text-seal">{item.kicker}</p>
              <h3 className="mt-2 font-serif text-2xl">{item.title}</h3>
              <p className="mt-3 text-ink-soft">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-seal/30 bg-white p-8">
          <p className="inline-flex rounded-full border border-seal/30 bg-fail-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-seal">
            MVP mock · not scheme cover
          </p>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
            Merchant Dispute Shield
          </h2>
          <p className="mt-4 max-w-2xl text-ink-soft">
            When the presented merchant diverges from the declared intent —
            groceries that settle at a casino, a spoofed agent fingerprint,
            an electronics charge against an office mandate — SpendGate exports
            a JSON / print-ready evidence pack: mandate snapshot, contract,
            identity binding, evaluation findings, hash-chained audit. This
            sandbox demonstrates the pack. It is not Visa, Mastercard, or PSD2
            dispute cover.
          </p>
          <Link
            href="/demo/shield"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-paper"
          >
            Open a sample pack
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3">
        {[
          ["Not a chat shopper", "No catalogue, no cart, no LLM storefront. The agent is an identity to bind."],
          ["Not a spend-limits UI", "Limits exist, but as contract rails under a mandate and a hierarchy."],
          ["EU-native on purpose", "Jurisdiction stamped on every mandate. Evidence first, rails second."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-line p-5">
            <h3 className="font-serif text-xl">{title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
          </article>
        ))}
      </section>

      <footer className="mt-auto border-t border-line/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft">
          <span>SpendGate · sandbox MVP</span>
          <Link href="/demo" className="text-ink">
            Enter the demo →
          </Link>
        </div>
      </footer>
    </div>
  );
}
