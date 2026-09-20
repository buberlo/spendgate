import { verifyChain } from "./hash";
import type { AuditEvent, PurchaseIntent } from "./types";

export const DISPUTE_SHIELD_DISCLAIMER =
  "Merchant Dispute Shield is an MVP mock. This evidence pack is a sandbox demonstration of intent-mismatch packaging. It is not scheme cover, not a card-network product, and not a legal filing.";

export type EvidencePack = {
  packId: string;
  generatedAt: string;
  product: "SpendGate Merchant Dispute Shield";
  mock: true;
  disclaimer: string;
  intent: PurchaseIntent;
  mandate: PurchaseIntent["snapshot"]["mandate"];
  contract: PurchaseIntent["snapshot"]["contract"];
  policy: PurchaseIntent["snapshot"]["policy"];
  principals: PurchaseIntent["snapshot"]["principals"];
  agent: PurchaseIntent["snapshot"]["agent"];
  evaluation: PurchaseIntent["evaluation"];
  mismatch: PurchaseIntent["evaluation"]["mismatch"];
  decisions: PurchaseIntent["decisions"];
  audit: AuditEvent[];
  chain: { ok: boolean; brokenAt?: number; detail?: string; head: string; tail: string };
};

export async function buildEvidencePack(
  intent: PurchaseIntent,
  audit: AuditEvent[],
  generatedAt = new Date().toISOString(),
): Promise<EvidencePack> {
  const related = audit.filter(
    (event) =>
      event.entityId === intent.id ||
      event.entityId === intent.mandateId ||
      event.entityId === intent.policyId ||
      event.entityId === intent.snapshot.agent.id,
  );
  const chain = await verifyChain(audit);
  return {
    packId: `evp_${intent.id}`,
    generatedAt,
    product: "SpendGate Merchant Dispute Shield",
    mock: true,
    disclaimer: DISPUTE_SHIELD_DISCLAIMER,
    intent,
    mandate: intent.snapshot.mandate,
    contract: intent.snapshot.contract,
    policy: intent.snapshot.policy,
    principals: intent.snapshot.principals,
    agent: intent.snapshot.agent,
    evaluation: intent.evaluation,
    mismatch: intent.evaluation.mismatch,
    decisions: intent.decisions,
    audit: related,
    chain: {
      ...chain,
      head: audit[0]?.hash ?? "",
      tail: audit.at(-1)?.hash ?? "",
    },
  };
}
