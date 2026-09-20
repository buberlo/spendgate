"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  canDecide,
  evaluateIntent,
  nextApproverAfter,
  snapshotFor,
} from "./engine";
import { hashAuditLink, hashPayload, newId } from "./hash";
import { buildSeed } from "./seed";
import type {
  AuditEvent,
  DecisionRecord,
  GateDecision,
  IntentDraft,
  NewPolicyInput,
  Principal,
  PurchaseIntent,
  World,
} from "./types";

const STORAGE_KEY = "spendgate.mvp.v1";

type StoreApi = {
  world: World | null;
  ready: boolean;
  acting: Principal | undefined;
  setActing: (principalId: string) => void;
  resetDemo: () => Promise<void>;
  submitIntent: (draft: IntentDraft) => Promise<PurchaseIntent>;
  decideIntent: (args: {
    intentId: string;
    action: GateDecision;
    note: string;
  }) => Promise<PurchaseIntent>;
  createPolicy: (input: NewPolicyInput) => Promise<{ policyId: string }>;
  exportWorld: () => string;
};

const StoreContext = createContext<StoreApi | null>(null);

async function appendAudit(
  world: World,
  at: string,
  type: string,
  actor: AuditEvent["actor"],
  entityType: string,
  entityId: string,
  payload: Record<string, unknown>,
): Promise<World> {
  const prevHash = world.audit.at(-1)?.hash ?? "0".repeat(64);
  const seq = (world.audit.at(-1)?.seq ?? 0) + 1;
  const event: Omit<AuditEvent, "hash"> = {
    seq,
    id: newId("aud"),
    at,
    type,
    actor,
    entityType,
    entityId,
    payload,
    prevHash,
  };
  const hash = await hashAuditLink(event);
  return { ...world, audit: [...world.audit, { ...event, hash }] };
}

function requireWorld(world: World | null): World {
  if (!world) throw new Error("SpendGate store is not ready yet.");
  return world;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<World | null>(null);
  const [ready, setReady] = useState(false);
  const worldRef = useRef<World | null>(null);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as World;
          if (parsed?.version === 1 && Array.isArray(parsed.audit)) {
            if (!cancelled) {
              setWorld(parsed);
              setReady(true);
            }
            return;
          }
        }
      } catch {
        /* fall through to seed */
      }
      const seed = await buildSeed();
      if (!cancelled) {
        setWorld(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready && world) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
    }
  }, [ready, world]);

  const acting = world?.principals.find((p) => p.id === world.actingPrincipalId);

  const setActing = useCallback((principalId: string) => {
    setWorld((prev) => (prev ? { ...prev, actingPrincipalId: principalId } : prev));
  }, []);

  const resetDemo = useCallback(async () => {
    const seed = await buildSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    setWorld(seed);
  }, []);

  const submitIntent = useCallback(async (draft: IntentDraft) => {
    const latest = requireWorld(worldRef.current);
    const evaluation = evaluateIntent(latest, draft);
    const agent = latest.agents.find((item) => item.id === draft.agentId);
    if (!agent) throw new Error("Unknown agent");
    const contract = latest.contracts.find((item) => item.agentId === agent.id);
    const mandate = latest.mandates.find(
      (item) => item.policyId === contract?.policyId && item.status === "active",
    );
    if (!contract || !mandate) throw new Error("Agent is not bound to a sealed mandate");
    const snapshot = snapshotFor(latest, mandate, contract);
    if (!snapshot) throw new Error("Cannot snapshot policy");
    const now = new Date().toISOString();
    const status =
      evaluation.decision === "allow"
        ? "allowed"
        : evaluation.decision === "deny"
          ? "denied"
          : "escalated";
    const intent: PurchaseIntent = {
      id: newId("int"),
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
      submittedAt: now,
      claimedFingerprint: draft.claimedFingerprint ?? agent.identityFingerprint,
      status,
      evaluation,
      snapshot,
      waitingOnPrincipalId:
        evaluation.decision === "escalate" ? evaluation.nextPrincipalId : undefined,
      decisions: [],
    };
    let next = {
      ...latest,
      intents: [intent, ...latest.intents],
    };
    next = await appendAudit(
      next,
      now,
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
    next = await appendAudit(
      next,
      now,
      evaluation.decision === "allow"
        ? "INTENT_ALLOWED"
        : evaluation.decision === "deny"
          ? "INTENT_DENIED"
          : "INTENT_ESCALATED",
      { kind: "system", id: "spendgate", name: "SpendGate" },
      "intent",
      intent.id,
      {
        decision: evaluation.decision,
        auto: evaluation.auto,
        reason: evaluation.reasonSummary,
        waitingOnPrincipalId: intent.waitingOnPrincipalId ?? null,
      },
    );
    setWorld(next);
    return intent;
  }, []);

  const decideIntent = useCallback(
    async ({
      intentId,
      action,
      note,
    }: {
      intentId: string;
      action: GateDecision;
      note: string;
    }) => {
      const latest = requireWorld(worldRef.current);
      const actor = latest.principals.find(
        (item) => item.id === latest.actingPrincipalId,
      );
      if (!actor) throw new Error("No acting principal");
      const intent = latest.intents.find((item) => item.id === intentId);
      if (!intent) throw new Error("Unknown intent");
      const gate = canDecide({
        actor,
        intent,
        principals: latest.principals,
      });
      if (!gate.ok) throw new Error(gate.reason);

      const now = new Date().toISOString();
      const signature = await hashPayload({
        intentId,
        action,
        principalId: actor.id,
        at: now,
        note,
        mandateId: intent.mandateId,
      });
      const record: DecisionRecord = {
        action,
        principalId: actor.id,
        at: now,
        note,
        signature,
      };

      let status: PurchaseIntent["status"] = intent.status;
      let waitingOnPrincipalId = intent.waitingOnPrincipalId;
      if (action === "allow") {
        status = "allowed";
        waitingOnPrincipalId = undefined;
      } else if (action === "deny") {
        status = "denied";
        waitingOnPrincipalId = undefined;
      } else {
        const nextId = nextApproverAfter(intent, actor.id);
        if (!nextId) {
          throw new Error("No higher principal left to escalate to.");
        }
        status = "escalated";
        waitingOnPrincipalId = nextId;
      }

      const updated: PurchaseIntent = {
        ...intent,
        status,
        waitingOnPrincipalId,
        decisions: [...intent.decisions, record],
      };
      let next: World = {
        ...latest,
        intents: latest.intents.map((item) => (item.id === intentId ? updated : item)),
      };
      next = await appendAudit(
        next,
        now,
        action === "allow"
          ? "APPROVAL_ALLOWED"
          : action === "deny"
            ? "APPROVAL_DENIED"
            : "APPROVAL_ESCALATED",
        { kind: "principal", id: actor.id, name: actor.name },
        "intent",
        intent.id,
        {
          action,
          note,
          signature,
          waitingOnPrincipalId: waitingOnPrincipalId ?? null,
        },
      );
      setWorld(next);
      return updated;
    },
    [],
  );

  const createPolicy = useCallback(async (input: NewPolicyInput) => {
    const latest = requireWorld(worldRef.current);
    const now = new Date().toISOString();
    const newPrincipals: Principal[] = input.principals.map((person) => ({
      id: newId("prin"),
      name: person.name.trim(),
      email: person.email.trim(),
      role: person.role,
    }));
    const bound = newPrincipals[input.agent.boundPrincipalIndex];
    const issuer = newPrincipals[input.issuedByPrincipalIndex];
    if (!bound || !issuer) throw new Error("Principal index out of range");
    const agent = {
      id: newId("agt"),
      name: input.agent.name.trim(),
      runtime: input.agent.runtime.trim() || "custom",
      identityFingerprint: (await hashPayload([
        input.agent.name,
        input.agent.runtime,
        now,
      ])).slice(0, 24),
      boundPrincipalId: bound.id,
      status: "active" as const,
    };
    const policyId = newId("pol");
    const contractId = newId("ctr");
    const mandateId = newId("man");
    const contract = {
      id: contractId,
      policyId,
      agentId: agent.id,
      revision: 1,
      ...input.contract,
    };
    const policy = {
      id: policyId,
      name: input.name.trim(),
      kind: input.kind,
      jurisdiction: "EU" as const,
      principalIds: newPrincipals.map((person) => person.id),
      hierarchy: input.principals.map((person, index) => ({
        principalId: newPrincipals[index].id,
        rank: person.rank,
        autoApproveCents: person.autoApproveCents,
        hardApproveCents: person.hardApproveCents,
      })),
      contractId,
      mandateId,
      createdAt: now,
      status: "active" as const,
    };
    const body = {
      policyId,
      policyName: policy.name,
      kind: policy.kind,
      jurisdiction: policy.jurisdiction,
      principals: newPrincipals,
      hierarchy: policy.hierarchy,
      contract,
      agent,
    };
    const mandate = {
      id: mandateId,
      policyId,
      contractId,
      issuedByPrincipalId: issuer.id,
      issuedAt: now,
      termsHash: await hashPayload(body),
      body,
      status: "active" as const,
    };

    let next: World = {
      ...latest,
      principals: [...latest.principals, ...newPrincipals],
      agents: [...latest.agents, agent],
      policies: [policy, ...latest.policies],
      contracts: [...latest.contracts, contract],
      mandates: [...latest.mandates, mandate],
      actingPrincipalId: issuer.id,
    };
    next = await appendAudit(
      next,
      now,
      "POLICY_CREATED",
      { kind: "principal", id: issuer.id, name: issuer.name },
      "policy",
      policy.id,
      { name: policy.name, kind: policy.kind },
    );
    next = await appendAudit(
      next,
      now,
      "AGENT_BOUND",
      { kind: "principal", id: issuer.id, name: issuer.name },
      "agent",
      agent.id,
      {
        agent: agent.name,
        fingerprint: agent.identityFingerprint,
        boundPrincipalId: bound.id,
      },
    );
    next = await appendAudit(
      next,
      now,
      "MANDATE_SEALED",
      { kind: "principal", id: issuer.id, name: issuer.name },
      "mandate",
      mandate.id,
      { termsHash: mandate.termsHash, policyId: policy.id, kind: policy.kind },
    );
    setWorld(next);
    return { policyId: policy.id };
  }, []);

  const exportWorld = useCallback(() => JSON.stringify(world, null, 2), [world]);

  const api = useMemo<StoreApi>(
    () => ({
      world,
      ready,
      acting,
      setActing,
      resetDemo,
      submitIntent,
      decideIntent,
      createPolicy,
      exportWorld,
    }),
    [
      world,
      ready,
      acting,
      setActing,
      resetDemo,
      submitIntent,
      decideIntent,
      createPolicy,
      exportWorld,
    ],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
