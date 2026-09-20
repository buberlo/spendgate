import assert from "node:assert/strict";
import { test } from "node:test";
import {
  genesisHash,
  hashAuditLink,
  sha256Hex,
  verifyChain,
  type ChainLink,
} from "../lib/hash";

test("sha256 of empty string is the well-known digest", async () => {
  const hex = await sha256Hex("");
  assert.equal(
    hex,
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("audit chain verifies and detects tampering", async () => {
  const firstBase = {
    seq: 1,
    id: "aud_1",
    at: "2026-09-17T07:00:00.000Z",
    type: "LEDGER_OPENED",
    actor: { kind: "system", id: "spendgate", name: "SpendGate" },
    entityType: "ledger",
    entityId: "sg",
    payload: { ok: true },
    prevHash: genesisHash(),
  };
  const first: ChainLink = {
    ...firstBase,
    hash: await hashAuditLink(firstBase),
  };
  const secondBase = {
    seq: 2,
    id: "aud_2",
    at: "2026-09-17T07:05:00.000Z",
    type: "MANDATE_SEALED",
    actor: { kind: "principal", id: "p1", name: "Elena" },
    entityType: "mandate",
    entityId: "man_1",
    payload: { termsHash: "abc" },
    prevHash: first.hash,
  };
  const second: ChainLink = {
    ...secondBase,
    hash: await hashAuditLink(secondBase),
  };

  const ok = await verifyChain([first, second]);
  assert.equal(ok.ok, true);

  const tampered = await verifyChain([
    first,
    { ...second, payload: { termsHash: "MUTATED" } },
  ]);
  assert.equal(tampered.ok, false);
  assert.equal(tampered.brokenAt, 2);
});
