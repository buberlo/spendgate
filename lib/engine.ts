import type {
  Agent,
  Evaluation,
  Finding,
  IntentDraft,
  Mandate,
  MerchantCategory,
  Principal,
  PurchaseIntent,
  SpendContract,
  TimeWindow,
  World,
} from "./types";

const PURPOSE_HINTS: Record<MerchantCategory, string[]> = {
  groceries: ["groc", "food", "rewe", "lidl", "aldi", "supermarket", "household"],
  transport: ["transit", "train", "uber", "bolt", "bahn", "ticket"],
  travel: ["hotel", "flight", "airbnb", "booking", "travel"],
  electronics: ["headphone", "laptop", "phone", "sony", "apple", "electronics"],
  office: ["desk", "chair", "stationery", "office", "facility"],
  restaurants: ["restaurant", "dining", "cafe", "meal"],
  healthcare: ["pharma", "doctor", "clinic", "health"],
  education: ["course", "book", "tuition", "school"],
  entertainment: ["stream", "game", "cinema", "concert"],
  gambling: ["casino", "bet", "stake", "poker"],
  crypto: ["btc", "crypto", "exchange", "usdt"],
  other: [],
};

export type WorldSlice = Pick<
  World,
  "principals" | "agents" | "policies" | "contracts" | "mandates" | "intents"
>;

function finding(
  code: string,
  severity: Finding["severity"],
  title: string,
  detail: string,
): Finding {
  return { code, severity, title, detail };
}

export function berlinParts(iso: string, tz: string): {
  weekday: number;
  minute: number;
} {
  const date = new Date(iso);
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const hour = Number.parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
    10,
  );
  const minute = Number.parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      minute: "2-digit",
    }).format(date),
    10,
  );
  return { weekday: map[weekdayName] ?? 1, minute: hour * 60 + minute };
}

export function inTimeWindow(iso: string, window: TimeWindow): boolean {
  const parts = berlinParts(iso, window.tz);
  if (!window.days.includes(parts.weekday)) return false;
  if (window.startMinute <= window.endMinute) {
    return parts.minute >= window.startMinute && parts.minute <= window.endMinute;
  }
  return parts.minute >= window.startMinute || parts.minute <= window.endMinute;
}

function startOfDayUtc(iso: string, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return new Date(`${parts}T00:00:00.000Z`).getTime();
}

function spentInWindow(
  intents: PurchaseIntent[],
  contractId: string,
  nowIso: string,
  tz: string,
  days: number,
): number {
  const now = startOfDayUtc(nowIso, tz);
  const from = now - (days - 1) * 24 * 60 * 60 * 1000;
  return intents
    .filter(
      (intent) =>
        intent.contractId === contractId &&
        intent.status === "allowed" &&
        startOfDayUtc(intent.occurredAt, tz) >= from,
    )
    .reduce((sum, intent) => sum + intent.amountCents, 0);
}

export function mismatchReport(draft: IntentDraft): {
  score: number;
  notes: string[];
} {
  const notes: string[] = [];
  const purpose = draft.declaredPurpose.toLowerCase();
  const merchant = draft.merchantName.toLowerCase();
  const hints = PURPOSE_HINTS[draft.merchantCategory];
  const purposeHitsOwn = hints.some((hint) => purpose.includes(hint));
  const merchantHitsOwn = hints.some((hint) => merchant.includes(hint));

  let conflicting: MerchantCategory | null = null;
  for (const [category, words] of Object.entries(PURPOSE_HINTS) as [
    MerchantCategory,
    string[],
  ][]) {
    if (category === draft.merchantCategory) continue;
    if (words.some((word) => purpose.includes(word))) {
      conflicting = category;
      break;
    }
  }

  if (conflicting) {
    notes.push(
      `Declared purpose reads as ${conflicting}, but the agent presented MCC ${draft.merchantCategory}.`,
    );
  } else if (!purposeHitsOwn && purpose.length > 0) {
    notes.push(
      "Declared purpose does not mention the presented merchant category.",
    );
  }

  if (!merchantHitsOwn && hints.length > 0) {
    notes.push(
      `Merchant “${draft.merchantName}” does not look like a typical ${draft.merchantCategory} counterparty.`,
    );
  }

  if (draft.merchantCategory === "gambling" || draft.merchantCategory === "crypto") {
    notes.push(
      "High-risk category: even a matching purpose is insufficient without an explicit mandate allow.",
    );
  }

  const score = Math.min(1, notes.length * 0.34 + (conflicting ? 0.4 : 0));
  if (notes.length === 0) {
    notes.push("Declared purpose, merchant name, and category are consistent.");
  }
  return { score, notes };
}

function contractForAgent(world: WorldSlice, agentId: string): SpendContract | undefined {
  return world.contracts.find((contract) => contract.agentId === agentId);
}

export function evaluateIntent(world: WorldSlice, draft: IntentDraft): Evaluation {
  const findings: Finding[] = [];
  const mismatch = mismatchReport(draft);

  const agent = world.agents.find((item) => item.id === draft.agentId);
  if (!agent) {
    return deny(findings, mismatch, [
      finding(
        "AGENT_MISSING",
        "fail",
        "Unknown agent",
        "No agent identity is registered for this intent.",
      ),
    ]);
  }
  if (agent.status !== "active") {
    return deny(findings, mismatch, [
      finding(
        "AGENT_REVOKED",
        "fail",
        "Agent revoked",
        `${agent.name} is no longer allowed to transact.`,
      ),
    ]);
  }

  const claimed = draft.claimedFingerprint ?? agent.identityFingerprint;
  if (claimed !== agent.identityFingerprint) {
    return deny(findings, mismatch, [
      finding(
        "AGENT_IDENTITY_MISMATCH",
        "fail",
        "Agent identity mismatch",
        `Presented fingerprint ${claimed} does not match bound identity ${agent.identityFingerprint}.`,
      ),
    ]);
  }
  findings.push(
    finding(
      "AGENT_IDENTITY_OK",
      "pass",
      "Agent identity bound",
      `${agent.name} fingerprint ${agent.identityFingerprint} matches the mandate.`,
    ),
  );

  const contract = contractForAgent(world, agent.id);
  if (!contract) {
    return deny(findings, mismatch, [
      finding(
        "CONTRACT_MISSING",
        "fail",
        "No spend contract",
        "This agent is not attached to an active per-intent spend contract.",
      ),
    ]);
  }

  const policy = world.policies.find((item) => item.id === contract.policyId);
  const mandate = world.mandates.find(
    (item) => item.policyId === contract.policyId && item.status === "active",
  );
  if (!policy || policy.status !== "active") {
    return deny(findings, mismatch, [
      finding(
        "POLICY_INACTIVE",
        "fail",
        "Policy inactive",
        "There is no active multi-principal policy for this agent.",
      ),
    ]);
  }
  if (!mandate) {
    return deny(findings, mismatch, [
      finding(
        "MANDATE_MISSING",
        "fail",
        "Mandate missing",
        "Spend is refused until a sealed mandate exists.",
      ),
    ]);
  }
  findings.push(
    finding(
      "MANDATE_ACTIVE",
      "pass",
      "Mandate in force",
      `Mandate ${mandate.id} issued ${mandate.issuedAt} binds this intent.`,
    ),
  );

  if (contract.deniedCategories.includes(draft.merchantCategory)) {
    return deny(findings, mismatch, [
      finding(
        "CATEGORY_DENIED",
        "fail",
        "Category barred by contract",
        `${draft.merchantCategory} is on the denied list of this spend contract.`,
      ),
    ]);
  }
  if (!contract.allowedCategories.includes(draft.merchantCategory)) {
    return deny(findings, mismatch, [
      finding(
        "CATEGORY_NOT_ALLOWED",
        "fail",
        "Category outside allow-list",
        `${draft.merchantCategory} is not an allowed merchant category for this agent.`,
      ),
    ]);
  }
  findings.push(
    finding(
      "CATEGORY_ALLOWED",
      "pass",
      "Category in contract",
      `${draft.merchantCategory} is permitted by the spend contract.`,
    ),
  );

  if (!inTimeWindow(draft.occurredAt, contract.window)) {
    return deny(findings, mismatch, [
      finding(
        "WINDOW_OUTSIDE",
        "fail",
        "Outside time window",
        `Intent at ${draft.occurredAt} is outside the contracted window in ${contract.window.tz}.`,
      ),
    ]);
  }
  findings.push(
    finding(
      "WINDOW_OK",
      "pass",
      "Inside time window",
      `Intent falls inside the contracted window (${contract.window.tz}).`,
    ),
  );

  if (draft.amountCents > contract.perIntentCents) {
    return deny(findings, mismatch, [
      finding(
        "CAP_INTENT_EXCEEDED",
        "fail",
        "Per-intent cap exceeded",
        `${draft.amountCents} cents > contract per-intent ${contract.perIntentCents} cents.`,
      ),
    ]);
  }
  findings.push(
    finding(
      "CAP_INTENT_OK",
      "pass",
      "Per-intent cap holds",
      `Amount is within the ${contract.perIntentCents} cent per-intent rail.`,
    ),
  );

  const daily =
    spentInWindow(world.intents, contract.id, draft.occurredAt, contract.window.tz, 1) +
    draft.amountCents;
  const weekly =
    spentInWindow(world.intents, contract.id, draft.occurredAt, contract.window.tz, 7) +
    draft.amountCents;
  const monthly =
    spentInWindow(world.intents, contract.id, draft.occurredAt, contract.window.tz, 30) +
    draft.amountCents;

  if (daily > contract.dailyCents) {
    return deny(findings, mismatch, [
      finding(
        "CAP_DAILY_EXCEEDED",
        "fail",
        "Daily cap exceeded",
        `Rolling daily spend would be ${daily} cents against ${contract.dailyCents}.`,
      ),
    ]);
  }
  if (weekly > contract.weeklyCents) {
    return deny(findings, mismatch, [
      finding(
        "CAP_WEEKLY_EXCEEDED",
        "fail",
        "Weekly cap exceeded",
        `Rolling weekly spend would be ${weekly} cents against ${contract.weeklyCents}.`,
      ),
    ]);
  }
  if (monthly > contract.monthlyCents) {
    return deny(findings, mismatch, [
      finding(
        "CAP_MONTHLY_EXCEEDED",
        "fail",
        "Monthly cap exceeded",
        `Rolling monthly spend would be ${monthly} cents against ${contract.monthlyCents}.`,
      ),
    ]);
  }
  findings.push(
    finding(
      "CAPS_ROLLING_OK",
      "pass",
      "Rolling caps hold",
      `Daily ${daily}/${contract.dailyCents}, weekly ${weekly}/${contract.weeklyCents}, monthly ${monthly}/${contract.monthlyCents}.`,
    ),
  );

  if (mismatch.score >= 0.7) {
    findings.push(
      finding(
        "INTENT_MISMATCH_HIGH",
        "warn",
        "High intent mismatch",
        mismatch.notes.join(" "),
      ),
    );
  } else if (mismatch.score >= 0.34) {
    findings.push(
      finding(
        "INTENT_MISMATCH_MED",
        "info",
        "Intent mismatch noted",
        mismatch.notes.join(" "),
      ),
    );
  }

  const acting = world.principals.find((item) => item.id === agent.boundPrincipalId);
  if (!acting) {
    return deny(findings, mismatch, [
      finding(
        "PRINCIPAL_MISSING",
        "fail",
        "Bound principal missing",
        "Agent has no living principal on the policy.",
      ),
    ]);
  }

  const hierarchy = [...policy.hierarchy].sort((a, b) => a.rank - b.rank);
  const actingRung = hierarchy.find((rung) => rung.principalId === acting.id);
  if (!actingRung) {
    return deny(findings, mismatch, [
      finding(
        "HIERARCHY_UNBOUND",
        "fail",
        "Principal not in hierarchy",
        `${acting.name} is not on the approval ladder.`,
      ),
    ]);
  }

  if (draft.amountCents <= actingRung.autoApproveCents) {
    findings.push(
      finding(
        "HIERARCHY_AUTO_ALLOW",
        "pass",
        "Within auto-approve",
        `${acting.name} may auto-allow up to ${actingRung.autoApproveCents} cents.`,
      ),
    );
    return {
      decision: "allow",
      auto: true,
      findings,
      mismatch,
      reasonSummary: `Auto-allowed under ${acting.name}'s principal authority.`,
    };
  }

  const next = hierarchy.find((rung) => {
    if (rung.rank < actingRung.rank) return false;
    if (rung.principalId === acting.id && draft.amountCents > actingRung.autoApproveCents) {
      return rung.hardApproveCents === null || draft.amountCents <= rung.hardApproveCents;
    }
    if (rung.rank === actingRung.rank && rung.principalId !== acting.id) return false;
    return rung.hardApproveCents === null || draft.amountCents <= rung.hardApproveCents;
  });

  const nextIsSelf = next?.principalId === acting.id;
  const nextHigher = nextIsSelf
    ? hierarchy.find(
        (rung) =>
          rung.rank > actingRung.rank &&
          (rung.hardApproveCents === null || draft.amountCents <= rung.hardApproveCents),
      ) ?? next
    : next;

  if (!nextHigher) {
    return deny(findings, mismatch, [
      finding(
        "HIERARCHY_NO_AUTHORITY",
        "fail",
        "No principal can cover this amount",
        `€${(draft.amountCents / 100).toFixed(2)} exceeds every hard-approve rung on the policy.`,
      ),
    ]);
  }

  const nextPrincipal = world.principals.find((item) => item.id === nextHigher.principalId);
  findings.push(
    finding(
      "HIERARCHY_ESCALATE",
      "warn",
      "Approval required",
      `${acting.name}'s auto-approve is ${actingRung.autoApproveCents} cents. Escalate to ${nextPrincipal?.name ?? nextHigher.principalId}.`,
    ),
  );

  return {
    decision: "escalate",
    auto: false,
    findings,
    mismatch,
    nextPrincipalId: nextHigher.principalId,
    reasonSummary: `Escalated to ${nextPrincipal?.name ?? "next principal"} under the multi-principal hierarchy.`,
  };
}

function deny(
  existing: Finding[],
  mismatch: Evaluation["mismatch"],
  extra: Finding[],
): Evaluation {
  const findings = [...existing, ...extra];
  const last = extra[extra.length - 1];
  return {
    decision: "deny",
    auto: true,
    findings,
    mismatch,
    reasonSummary: last?.detail ?? "Denied by spend contract.",
  };
}

export function canDecide(args: {
  actor: Principal;
  intent: PurchaseIntent;
  principals: Principal[];
}): { ok: boolean; reason: string } {
  const { actor, intent } = args;
  if (intent.status !== "escalated" && intent.status !== "pending") {
    return { ok: false, reason: "Intent is no longer awaiting a decision." };
  }
  const waitingId = intent.waitingOnPrincipalId;
  if (!waitingId) return { ok: false, reason: "No principal is on the clock." };

  const hierarchy = intent.snapshot.policy.hierarchy;
  const actorRung = hierarchy.find((rung) => rung.principalId === actor.id);
  const waitingRung = hierarchy.find((rung) => rung.principalId === waitingId);
  if (!actorRung) {
    return { ok: false, reason: "Acting principal is not on this policy." };
  }
  if (actor.id === waitingId) return { ok: true, reason: "Waiting principal." };
  if (waitingRung && actorRung.rank > waitingRung.rank) {
    return { ok: true, reason: "Higher-rank override." };
  }
  return {
    ok: false,
    reason: "Only the waiting principal or a higher-rank principal may decide.",
  };
}

export function nextApproverAfter(
  intent: PurchaseIntent,
  fromPrincipalId: string,
): string | undefined {
  const hierarchy = [...intent.snapshot.policy.hierarchy].sort(
    (a, b) => a.rank - b.rank,
  );
  const from = hierarchy.find((rung) => rung.principalId === fromPrincipalId);
  if (!from) return undefined;
  const next = hierarchy.find((rung) => {
    if (rung.rank <= from.rank) return false;
    return (
      rung.hardApproveCents === null || intent.amountCents <= rung.hardApproveCents
    );
  });
  return next?.principalId;
}

export function resolveAgentPolicy(world: WorldSlice, agent: Agent): {
  policyId: string;
  contractId: string;
  mandateId: string;
} | null {
  const contract = world.contracts.find((item) => item.agentId === agent.id);
  if (!contract) return null;
  const mandate = world.mandates.find(
    (item) => item.policyId === contract.policyId && item.status === "active",
  );
  if (!mandate) return null;
  return {
    policyId: contract.policyId,
    contractId: contract.id,
    mandateId: mandate.id,
  };
}

export function snapshotFor(
  world: WorldSlice,
  mandate: Mandate,
  contract: SpendContract,
): {
  policy: World["policies"][number];
  contract: SpendContract;
  mandate: Mandate;
  agent: Agent;
  principals: Principal[];
} | null {
  const policy = world.policies.find((item) => item.id === mandate.policyId);
  const agent = world.agents.find((item) => item.id === contract.agentId);
  if (!policy || !agent) return null;
  const principals = world.principals.filter((item) =>
    policy.principalIds.includes(item.id),
  );
  return { policy, contract, mandate, agent, principals };
}
