import { evaluateIntent, snapshotFor } from "./engine";
import { fingerprintFrom, genesisHash, hashAuditLink, hashPayload, newId } from "./hash";
import type {
  Agent,
  AuditEvent,
  Mandate,
  Policy,
  Principal,
  PurchaseIntent,
  SpendContract,
  World,
} from "./types";

const T = {
  open: "2026-09-17T07:00:00.000Z",
  mandateH: "2026-09-17T07:05:00.000Z",
  mandateC: "2026-09-17T07:12:00.000Z",
  grocery: "2026-09-18T09:14:00.000Z",
  grocerySub: "2026-09-18T09:14:02.000Z",
  casino: "2026-09-18T21:48:00.000Z",
  casinoSub: "2026-09-18T21:48:04.000Z",
  spoof: "2026-09-19T11:02:00.000Z",
  spoofSub: "2026-09-19T11:02:03.000Z",
  cans: "2026-09-17T13:40:00.000Z",
  cansSub: "2026-09-17T13:40:05.000Z",
  phones: "2026-09-20T10:22:00.000Z",
  phonesSub: "2026-09-20T10:22:06.000Z",
  desks: "2026-09-18T08:55:00.000Z",
  desksSub: "2026-09-18T08:55:08.000Z",
};

const ids = {
  elena: "prin_elena_kern",
  markus: "prin_markus_kern",
  lea: "prin_lea_kern",
  anja: "prin_anja_vogel",
  tomasz: "prin_tomasz_radek",
  facilities: "prin_facilities_bot",
  leaAgent: "agt_leashopper",
  officeAgent: "agt_officebuy",
  polHouse: "pol_kern_household",
  polCo: "pol_nordwerk",
  ctrHouse: "ctr_lea_weekly",
  ctrCo: "ctr_office_facilities",
  manHouse: "man_kern_2026q3",
  manCo: "man_nordwerk_2026q3",
};

function agentLea(): Agent {
  return {
    id: ids.leaAgent,
    name: "LeaShopper",
    runtime: "anthropic",
    identityFingerprint: fingerprintFrom(["lea", "shopper", "anthropic", "kern"]),
    boundPrincipalId: ids.lea,
    status: "active",
  };
}

function agentOffice(): Agent {
  return {
    id: ids.officeAgent,
    name: "OfficeBuy",
    runtime: "internal",
    identityFingerprint: fingerprintFrom(["officebuy", "nordwerk", "internal"]),
    boundPrincipalId: ids.facilities,
    status: "active",
  };
}

const principals: Principal[] = [
  {
    id: ids.elena,
    name: "Elena Kern",
    email: "elena@kern.example",
    role: "owner",
  },
  {
    id: ids.markus,
    name: "Markus Kern",
    email: "markus@kern.example",
    role: "approver",
  },
  {
    id: ids.lea,
    name: "Lea Kern",
    email: "lea@kern.example",
    role: "dependent",
  },
  {
    id: ids.anja,
    name: "Anja Vogel",
    email: "anja.vogel@nordwerk.example",
    role: "owner",
  },
  {
    id: ids.tomasz,
    name: "Tomasz Radek",
    email: "tomasz.radek@nordwerk.example",
    role: "approver",
  },
  {
    id: ids.facilities,
    name: "Facilities (cost centre)",
    email: "facilities@nordwerk.example",
    role: "spender",
  },
];

function houseContract(): SpendContract {
  return {
    id: ids.ctrHouse,
    policyId: ids.polHouse,
    agentId: ids.leaAgent,
    currency: "EUR",
    perIntentCents: 50_000,
    dailyCents: 60_000,
    weeklyCents: 120_000,
    monthlyCents: 250_000,
    allowedCategories: ["groceries", "education", "transport", "electronics"],
    deniedCategories: ["gambling", "crypto"],
    window: {
      tz: "Europe/Berlin",
      days: [1, 2, 3, 4, 5, 6, 7],
      startMinute: 7 * 60,
      endMinute: 21 * 60,
    },
    revision: 1,
  };
}

function companyContract(): SpendContract {
  return {
    id: ids.ctrCo,
    policyId: ids.polCo,
    agentId: ids.officeAgent,
    currency: "EUR",
    perIntentCents: 200_000,
    dailyCents: 250_000,
    weeklyCents: 600_000,
    monthlyCents: 1_500_000,
    allowedCategories: ["office", "electronics"],
    deniedCategories: ["gambling", "crypto", "entertainment"],
    window: {
      tz: "Europe/Berlin",
      days: [1, 2, 3, 4, 5],
      startMinute: 8 * 60,
      endMinute: 18 * 60,
    },
    revision: 1,
  };
}

function housePolicy(): Policy {
  return {
    id: ids.polHouse,
    name: "Kern household · parental",
    kind: "parental",
    jurisdiction: "EU",
    principalIds: [ids.elena, ids.markus, ids.lea],
    hierarchy: [
      {
        principalId: ids.lea,
        rank: 0,
        autoApproveCents: 6_000,
        hardApproveCents: 0,
      },
      {
        principalId: ids.markus,
        rank: 1,
        autoApproveCents: 20_000,
        hardApproveCents: 100_000,
      },
      {
        principalId: ids.elena,
        rank: 2,
        autoApproveCents: 50_000,
        hardApproveCents: 200_000,
      },
    ],
    contractId: ids.ctrHouse,
    mandateId: ids.manHouse,
    createdAt: T.mandateH,
    status: "active",
  };
}

function companyPolicy(): Policy {
  return {
    id: ids.polCo,
    name: "Nordwerk GmbH · facilities",
    kind: "company",
    jurisdiction: "EU",
    principalIds: [ids.anja, ids.tomasz, ids.facilities],
    hierarchy: [
      {
        principalId: ids.facilities,
        rank: 0,
        autoApproveCents: 15_000,
        hardApproveCents: 0,
      },
      {
        principalId: ids.tomasz,
        rank: 1,
        autoApproveCents: 40_000,
        hardApproveCents: 150_000,
      },
      {
        principalId: ids.anja,
        rank: 2,
        autoApproveCents: 100_000,
        hardApproveCents: null,
      },
    ],
    contractId: ids.ctrCo,
    mandateId: ids.manCo,
    createdAt: T.mandateC,
    status: "active",
  };
}

async function sealedMandate(
  id: string,
  issuedAt: string,
  issuedBy: string,
  policy: Policy,
  contract: SpendContract,
  agent: Agent,
  people: Principal[],
): Promise<Mandate> {
  const body = {
    policyId: policy.id,
    policyName: policy.name,
    kind: policy.kind,
    jurisdiction: policy.jurisdiction,
    principals: people.filter((person) => policy.principalIds.includes(person.id)),
    hierarchy: policy.hierarchy,
    contract,
    agent,
  };
  return {
    id,
    policyId: policy.id,
    contractId: contract.id,
    issuedByPrincipalId: issuedBy,
    issuedAt,
    termsHash: await hashPayload(body),
    body,
    status: "active",
  };
}

async function append(
  audit: AuditEvent[],
  at: string,
  type: string,
  actor: AuditEvent["actor"],
  entityType: string,
  entityId: string,
  payload: Record<string, unknown>,
): Promise<AuditEvent> {
  const prevHash = audit.at(-1)?.hash ?? genesisHash();
  const seq = (audit.at(-1)?.seq ?? 0) + 1;
  const event: Omit<AuditEvent, "hash"> = {
    seq,
    id: `aud_${seq.toString().padStart(4, "0")}_${entityId.slice(-6)}`,
    at,
    type,
    actor,
    entityType,
    entityId,
    payload,
    prevHash,
  };
  const hash = await hashAuditLink(event);
  const sealed: AuditEvent = { ...event, hash };
  audit.push(sealed);
  return sealed;
}

const system = { kind: "system" as const, id: "spendgate", name: "SpendGate" };

export const SEED_IDS = ids;

export async function buildSeed(): Promise<World> {
  const lea = agentLea();
  const office = agentOffice();
  const polH = housePolicy();
  const polC = companyPolicy();
  const ctrH = houseContract();
  const ctrC = companyContract();
  const manH = await sealedMandate(
    ids.manHouse,
    T.mandateH,
    ids.elena,
    polH,
    ctrH,
    lea,
    principals,
  );
  const manC = await sealedMandate(
    ids.manCo,
    T.mandateC,
    ids.anja,
    polC,
    ctrC,
    office,
    principals,
  );

  const worldBase: World = {
    version: 1,
    principals,
    agents: [lea, office],
    policies: [polH, polC],
    contracts: [ctrH, ctrC],
    mandates: [manH, manC],
    intents: [],
    audit: [],
    actingPrincipalId: ids.elena,
  };

  const audit: AuditEvent[] = [];
  await append(audit, T.open, "LEDGER_OPENED", system, "ledger", "sg_ledger", {
    jurisdiction: "EU",
    note: "Append-only mandate ledger for SpendGate sandbox.",
  });
  await append(
    audit,
    T.mandateH,
    "MANDATE_SEALED",
    { kind: "principal", id: ids.elena, name: "Elena Kern" },
    "mandate",
    manH.id,
    { termsHash: manH.termsHash, policyId: polH.id, kind: polH.kind },
  );
  await append(
    audit,
    T.mandateC,
    "MANDATE_SEALED",
    { kind: "principal", id: ids.anja, name: "Anja Vogel" },
    "mandate",
    manC.id,
    { termsHash: manC.termsHash, policyId: polC.id, kind: polC.kind },
  );

  const intents: PurchaseIntent[] = [];

  async function run(
    draft: Parameters<typeof evaluateIntent>[1],
    submittedAt: string,
    id: string,
  ): Promise<PurchaseIntent> {
    const slice = {
      ...worldBase,
      intents: [...intents],
    };
    const evaluation = evaluateIntent(slice, draft);
    const agent = worldBase.agents.find((item) => item.id === draft.agentId)!;
    const contract = worldBase.contracts.find((item) => item.agentId === agent.id)!;
    const mandate = worldBase.mandates.find(
      (item) => item.policyId === contract.policyId && item.status === "active",
    )!;
    const snapshot = snapshotFor(slice, mandate, contract)!;
    const status =
      evaluation.decision === "allow"
        ? "allowed"
        : evaluation.decision === "deny"
          ? "denied"
          : "escalated";
    const intent: PurchaseIntent = {
      id,
      agentId: agent.id,
      policyId: snapshot.policy.id,
      contractId: contract.id,
      mandateId: mandate.id,
      merchantName: draft.merchantName,
      merchantCategory: draft.merchantCategory,
      declaredPurpose: draft.declaredPurpose,
      amountCents: draft.amountCents,
      currency: "EUR",
      occurredAt: draft.occurredAt,
      submittedAt,
      claimedFingerprint: draft.claimedFingerprint ?? agent.identityFingerprint,
      status,
      evaluation,
      snapshot,
      waitingOnPrincipalId:
        evaluation.decision === "escalate" ? evaluation.nextPrincipalId : undefined,
      decisions: [],
    };
    intents.push(intent);
    await append(
      audit,
      submittedAt,
      "INTENT_SUBMITTED",
      { kind: "agent", id: agent.id, name: agent.name },
      "intent",
      intent.id,
      {
        merchantName: intent.merchantName,
        amountCents: intent.amountCents,
        category: intent.merchantCategory,
        declaredPurpose: intent.declaredPurpose,
      },
    );
    await append(
      audit,
      submittedAt,
      evaluation.decision === "allow"
        ? "INTENT_ALLOWED"
        : evaluation.decision === "deny"
          ? "INTENT_DENIED"
          : "INTENT_ESCALATED",
      system,
      "intent",
      intent.id,
      {
        decision: evaluation.decision,
        auto: evaluation.auto,
        reason: evaluation.reasonSummary,
        waitingOnPrincipalId: intent.waitingOnPrincipalId ?? null,
      },
    );
    return intent;
  }

  await run(
    {
      agentId: ids.leaAgent,
      merchantName: "REWE City Berlin",
      merchantCategory: "groceries",
      declaredPurpose: "Weekly household groceries",
      amountCents: 5_420,
      occurredAt: T.grocery,
    },
    T.grocerySub,
    "int_rewe_groceries",
  );

  await run(
    {
      agentId: ids.leaAgent,
      merchantName: "NightStake Casino",
      merchantCategory: "gambling",
      declaredPurpose: "Weekly household groceries",
      amountCents: 7_500,
      occurredAt: T.casino,
    },
    T.casinoSub,
    "int_nightstake_denied",
  );

  await run(
    {
      agentId: ids.leaAgent,
      merchantName: "MediaMarkt",
      merchantCategory: "electronics",
      declaredPurpose: "USB-C charging cable",
      amountCents: 1_999,
      occurredAt: T.spoof,
      claimedFingerprint: "spoofedagentfingerprintx",
    },
    T.spoofSub,
    "int_spoofed_identity",
  );

  await run(
    {
      agentId: ids.officeAgent,
      merchantName: "Viking Direct",
      merchantCategory: "office",
      declaredPurpose: "Office stationery restock",
      amountCents: 8_640,
      occurredAt: T.cans,
    },
    T.cansSub,
    "int_viking_stationery",
  );

  await run(
    {
      agentId: ids.leaAgent,
      merchantName: "Sony Store",
      merchantCategory: "electronics",
      declaredPurpose: "WH-1000XM5 headphones",
      amountCents: 38_900,
      occurredAt: T.phones,
    },
    T.phonesSub,
    "int_sony_headphones",
  );

  await run(
    {
      agentId: ids.officeAgent,
      merchantName: "Vitra",
      merchantCategory: "office",
      declaredPurpose: "Standing desks for HQ facilities",
      amountCents: 124_000,
      occurredAt: T.desks,
    },
    T.desksSub,
    "int_vitra_desks",
  );

  return {
    ...worldBase,
    intents,
    audit,
  };
}

export function emptyDraftPolicy() {
  return {
    name: "",
    kind: "household" as const,
    principals: [
      {
        name: "",
        email: "",
        role: "owner" as const,
        rank: 2,
        autoApproveCents: 50_000,
        hardApproveCents: 200_000 as number | null,
      },
      {
        name: "",
        email: "",
        role: "spender" as const,
        rank: 0,
        autoApproveCents: 2_500,
        hardApproveCents: 0 as number | null,
      },
    ],
    agent: {
      name: "",
      runtime: "anthropic",
      boundPrincipalIndex: 1,
    },
    contract: {
      currency: "EUR" as const,
      perIntentCents: 25_000,
      dailyCents: 40_000,
      weeklyCents: 80_000,
      monthlyCents: 200_000,
      allowedCategories: ["groceries", "transport"] as World["contracts"][number]["allowedCategories"],
      deniedCategories: ["gambling", "crypto"] as World["contracts"][number]["deniedCategories"],
      window: {
        tz: "Europe/Berlin",
        days: [1, 2, 3, 4, 5, 6, 7],
        startMinute: 7 * 60,
        endMinute: 21 * 60,
      },
    },
    issuedByPrincipalIndex: 0,
  };
}

export { newId };
