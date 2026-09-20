import assert from "node:assert/strict";
import { test } from "node:test";
import { canDecide, evaluateIntent, inTimeWindow } from "../lib/engine";
import { buildSeed, SEED_IDS } from "../lib/seed";
import type { IntentDraft, World } from "../lib/types";

async function world(): Promise<World> {
  return buildSeed();
}

function draft(over: Partial<IntentDraft> & Pick<IntentDraft, "agentId">): IntentDraft {
  return {
    merchantName: "REWE",
    merchantCategory: "groceries",
    declaredPurpose: "Household groceries restock",
    amountCents: 3_000,
    occurredAt: "2026-09-20T11:05:00.000Z",
    ...over,
  };
}

test("seeded grocery restock auto-allows under the dependent rail", async () => {
  const w = await world();
  const grocery = w.intents.find((item) => item.id === "int_rewe_groceries");
  assert.equal(grocery?.status, "allowed");
  assert.equal(grocery?.evaluation.auto, true);
});

test("gambling merchant is a contract deny, not an escalation", async () => {
  const w = await world();
  const casino = w.intents.find((item) => item.id === "int_nightstake_denied");
  assert.equal(casino?.status, "denied");
  assert.ok(
    casino?.evaluation.findings.some((f) => f.code === "CATEGORY_DENIED"),
  );
});

test("spoofed agent fingerprint is a hard deny", async () => {
  const w = await world();
  const spoof = w.intents.find((item) => item.id === "int_spoofed_identity");
  assert.equal(spoof?.status, "denied");
  assert.ok(
    spoof?.evaluation.findings.some((f) => f.code === "AGENT_IDENTITY_MISMATCH"),
  );
});

test("headphones escalate to the next principal who can hard-approve", async () => {
  const w = await world();
  const phones = w.intents.find((item) => item.id === "int_sony_headphones");
  assert.equal(phones?.status, "escalated");
  assert.equal(phones?.waitingOnPrincipalId, SEED_IDS.markus);
});

test("company desks escalate to procurement, not the spender", async () => {
  const w = await world();
  const desks = w.intents.find((item) => item.id === "int_vitra_desks");
  assert.equal(desks?.status, "escalated");
  assert.equal(desks?.waitingOnPrincipalId, SEED_IDS.tomasz);
});

test("amount inside contract but over auto-approve escalates", async () => {
  const w = await world();
  const evaluation = evaluateIntent(
    w,
    draft({
      agentId: SEED_IDS.leaAgent,
      merchantName: "Coolblue",
      merchantCategory: "electronics",
      declaredPurpose: "Replacement headphones",
      amountCents: 29_900,
    }),
  );
  assert.equal(evaluation.decision, "escalate");
  assert.equal(evaluation.nextPrincipalId, SEED_IDS.markus);
});

test("per-intent contract cap is a deny even if an owner could approve", async () => {
  const w = await world();
  const evaluation = evaluateIntent(
    w,
    draft({
      agentId: SEED_IDS.leaAgent,
      merchantName: "Coolblue",
      merchantCategory: "electronics",
      declaredPurpose: "OLED television",
      amountCents: 89_900,
    }),
  );
  assert.equal(evaluation.decision, "deny");
  assert.ok(evaluation.findings.some((f) => f.code === "CAP_INTENT_EXCEEDED"));
});

test("outside the contracted Berlin window denies", async () => {
  const w = await world();
  const evaluation = evaluateIntent(
    w,
    draft({
      agentId: SEED_IDS.leaAgent,
      merchantCategory: "electronics",
      merchantName: "MediaMarkt",
      declaredPurpose: "USB cable",
      amountCents: 1_999,
      occurredAt: "2026-09-20T20:30:00.000Z",
    }),
  );
  assert.equal(evaluation.decision, "deny");
  assert.ok(evaluation.findings.some((f) => f.code === "WINDOW_OUTSIDE"));
});

test("time window helper understands Europe/Berlin summer time", () => {
  const window = {
    tz: "Europe/Berlin",
    days: [1, 2, 3, 4, 5, 6, 7],
    startMinute: 7 * 60,
    endMinute: 21 * 60,
  };
  assert.equal(inTimeWindow("2026-09-20T10:00:00.000Z", window), true);
  assert.equal(inTimeWindow("2026-09-20T20:30:00.000Z", window), false);
});

test("intent mismatch flags groceries purpose at a casino", async () => {
  const w = await world();
  const evaluation = evaluateIntent(
    w,
    draft({
      agentId: SEED_IDS.leaAgent,
      merchantName: "Bet365",
      merchantCategory: "gambling",
      declaredPurpose: "Household groceries restock",
      amountCents: 2_000,
      occurredAt: "2026-09-20T11:00:00.000Z",
    }),
  );
  assert.ok(evaluation.mismatch.score >= 0.34);
  assert.ok(
    evaluation.mismatch.notes.some((note) => /groc|category|risk/i.test(note)),
  );
});

test("only the waiting principal or a higher rank may decide", async () => {
  const w = await world();
  const phones = w.intents.find((item) => item.id === "int_sony_headphones")!;
  const lea = w.principals.find((p) => p.id === SEED_IDS.lea)!;
  const markus = w.principals.find((p) => p.id === SEED_IDS.markus)!;
  const elena = w.principals.find((p) => p.id === SEED_IDS.elena)!;
  assert.equal(canDecide({ actor: lea, intent: phones, principals: w.principals }).ok, false);
  assert.equal(canDecide({ actor: markus, intent: phones, principals: w.principals }).ok, true);
  assert.equal(canDecide({ actor: elena, intent: phones, principals: w.principals }).ok, true);
});
