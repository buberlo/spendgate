import type { IntentDraft } from "./types";
import { SEED_IDS } from "./seed";

export type IntentPreset = {
  id: string;
  label: string;
  blurb: string;
  expect: "allow" | "deny" | "escalate";
  draft: IntentDraft;
};

export const INTENT_PRESETS: IntentPreset[] = [
  {
    id: "rewe",
    label: "Sunday groceries",
    blurb: "Under Lea’s auto-approve, allowed category, inside window.",
    expect: "allow",
    draft: {
      agentId: SEED_IDS.leaAgent,
      merchantName: "REWE",
      merchantCategory: "groceries",
      declaredPurpose: "Household groceries restock",
      amountCents: 3_280,
      occurredAt: "2026-09-20T11:05:00.000Z",
    },
  },
  {
    id: "headphones",
    label: "Headphones over auto-approve",
    blurb: "Inside the contract cap, over the dependent’s auto rail → escalate.",
    expect: "escalate",
    draft: {
      agentId: SEED_IDS.leaAgent,
      merchantName: "Coolblue",
      merchantCategory: "electronics",
      declaredPurpose: "Replacement headphones for school commute",
      amountCents: 29_900,
      occurredAt: "2026-09-20T12:40:00.000Z",
    },
  },
  {
    id: "casino",
    label: "Late gambling merchant",
    blurb: "Denied category, intent mismatch, outside the household window.",
    expect: "deny",
    draft: {
      agentId: SEED_IDS.leaAgent,
      merchantName: "Bet365",
      merchantCategory: "gambling",
      declaredPurpose: "Household groceries restock",
      amountCents: 6_000,
      occurredAt: "2026-09-20T22:15:00.000Z",
    },
  },
  {
    id: "desks",
    label: "HQ standing desks",
    blurb: "Company facilities agent, over spender auto, under procurement hard cap.",
    expect: "escalate",
    draft: {
      agentId: SEED_IDS.officeAgent,
      merchantName: "Vitra",
      merchantCategory: "office",
      declaredPurpose: "Standing desks for HQ facilities",
      amountCents: 148_000,
      occurredAt: "2026-09-21T09:10:00.000Z",
    },
  },
  {
    id: "spoof",
    label: "Spoofed agent fingerprint",
    blurb: "Same merchant, wrong runtime identity → hard deny + evidence pack.",
    expect: "deny",
    draft: {
      agentId: SEED_IDS.leaAgent,
      merchantName: "MediaMarkt",
      merchantCategory: "electronics",
      declaredPurpose: "USB-C charging cable",
      amountCents: 1_999,
      occurredAt: "2026-09-20T14:02:00.000Z",
      claimedFingerprint: "spoofedagentfingerprintx",
    },
  },
];
