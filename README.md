# SpendGate

EU-native **liability + multi-principal policy layer** over agentic commerce agents.

This is not a chat shopper. It is not a Visa spend-limits clone. SpendGate binds a purchase **intent** to a sealed **mandate**, a ranked set of **principals**, and an append-only **evidence log** — then allows, denies, or escalates.

## Product thesis

Card networks price liability for a cardholder. Agentic commerce has many principals and one payment: a parent and a teen, a shared household wallet, a GmbH cost centre and a procurement lead, plus the agent runtime itself.

When the agent buys the wrong thing, the question is not “was the card present.” It is:

1. Which mandate bound this intent?
2. Which principal had authority — and did they auto-allow or approve?
3. Does the merchant’s charge match the signed purpose and agent identity?

SpendGate is that layer. It sits over any agent (Anthropic, OpenAI, internal). The MVP sandbox demonstrates the wedge without a bank or card scheme.

### Core concepts in this demo

| Concept | What you can do |
| --- | --- |
| Multi-principal policies | Household / shared wallet / company / parental. Ranked roles, auto-approve and hard-approve rails. |
| Per-intent spend contracts | Caps, merchant categories, Europe/Berlin time windows, bound agent fingerprint. |
| Approval workflow | Allow / deny / escalate, with higher-rank override. |
| Mandate + audit log | Sealed terms hash. SHA-256 hash chain. Exportable ledger JSON. |
| Merchant Dispute Shield | Intent-mismatch evidence pack (JSON + print/PDF-ready). **MVP mock — not scheme cover.** |

Seeded ledgers:

- **Kern household (parental)** — Elena (owner), Markus (approver), Lea (dependent) + `LeaShopper`
- **Nordwerk GmbH (company)** — Anja Vogel (CFO), Tomasz Radek (procurement), Facilities spender + `OfficeBuy`

Pending by default: Sony headphones (waiting on Markus) and Vitra desks (waiting on Tomasz). Denied samples include a casino intent-mismatch and a spoofed agent fingerprint.

## Stack

- Next.js App Router (TypeScript)
- Client sandbox persistence (`localStorage`) so Vercel serverless does not need a database
- Pure policy engine in `lib/engine.ts` (also exposed at `POST /api/evaluate`)
- Evidence pack builder at `POST /api/evidence`

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test          # policy engine + hash-chain tests
npm run build     # production build
npm start         # serve the build
```

Reset the sandbox from the demo footer, or clear `localStorage` key `spendgate.mvp.v1`.

## Deploy on Vercel

Next.js defaults are unchanged. Vercel detects the app with no extra config.

### Dashboard

1. Push this repo to GitHub (already the case for `buberlo/spendgate`).
2. [Import the project](https://vercel.com/new) and select the repository.
3. Framework preset: **Next.js**. Build command `npm run build`, output `.next`.
4. Deploy. No environment variables are required for the MVP.

### CLI

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

If a `VERCEL_TOKEN` is available:

```bash
npx vercel --yes --token "$VERCEL_TOKEN"
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

## What this MVP is not

- Not a live acquirer, issuer, or card-network integration
- Not PSD2 / SCA production controls
- Not Merchant Dispute Shield as a real insurance or scheme product — the pack is labeled as a mock
- Persistence is per-browser; refreshing on another device starts from the sealed seed (until you create policies locally)

## License

Private MVP. All product names in the seed data are fictional.
