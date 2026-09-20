export const CURRENCY = "EUR" as const;
export const JURISDICTION = "EU" as const;

export type PolicyKind = "household" | "shared_wallet" | "company" | "parental";

export type PrincipalRole =
  | "owner"
  | "admin"
  | "approver"
  | "spender"
  | "dependent";

export type MerchantCategory =
  | "groceries"
  | "transport"
  | "travel"
  | "electronics"
  | "office"
  | "restaurants"
  | "healthcare"
  | "education"
  | "entertainment"
  | "gambling"
  | "crypto"
  | "other";

export const MERCHANT_CATEGORIES: MerchantCategory[] = [
  "groceries",
  "transport",
  "travel",
  "electronics",
  "office",
  "restaurants",
  "healthcare",
  "education",
  "entertainment",
  "gambling",
  "crypto",
  "other",
];

export const POLICY_KINDS: PolicyKind[] = [
  "household",
  "shared_wallet",
  "company",
  "parental",
];

export const PRINCIPAL_ROLES: PrincipalRole[] = [
  "owner",
  "admin",
  "approver",
  "spender",
  "dependent",
];

export type IntentStatus = "pending" | "allowed" | "denied" | "escalated";
export type GateDecision = "allow" | "deny" | "escalate";

export type Principal = {
  id: string;
  name: string;
  email: string;
  role: PrincipalRole;
};

export type Agent = {
  id: string;
  name: string;
  runtime: string;
  identityFingerprint: string;
  boundPrincipalId: string;
  status: "active" | "revoked";
};

export type HierarchyRung = {
  principalId: string;
  rank: number;
  autoApproveCents: number;
  /** null = unlimited */
  hardApproveCents: number | null;
};

export type TimeWindow = {
  tz: string;
  /** 1 = Monday … 7 = Sunday (ISO) */
  days: number[];
  startMinute: number;
  endMinute: number;
};

export type SpendContract = {
  id: string;
  policyId: string;
  agentId: string;
  currency: typeof CURRENCY;
  perIntentCents: number;
  dailyCents: number;
  weeklyCents: number;
  monthlyCents: number;
  allowedCategories: MerchantCategory[];
  deniedCategories: MerchantCategory[];
  window: TimeWindow;
  revision: number;
};

export type MandateBody = {
  policyId: string;
  policyName: string;
  kind: PolicyKind;
  jurisdiction: typeof JURISDICTION;
  principals: Principal[];
  hierarchy: HierarchyRung[];
  contract: SpendContract;
  agent: Agent;
};

export type Mandate = {
  id: string;
  policyId: string;
  contractId: string;
  issuedByPrincipalId: string;
  issuedAt: string;
  termsHash: string;
  body: MandateBody;
  status: "active" | "superseded" | "revoked";
};

export type Policy = {
  id: string;
  name: string;
  kind: PolicyKind;
  jurisdiction: typeof JURISDICTION;
  principalIds: string[];
  hierarchy: HierarchyRung[];
  contractId: string;
  mandateId: string;
  createdAt: string;
  status: "active" | "draft" | "revoked";
};

export type FindingSeverity = "pass" | "info" | "warn" | "fail";

export type Finding = {
  code: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
};

export type MismatchReport = {
  score: number;
  notes: string[];
};

export type Evaluation = {
  decision: GateDecision;
  auto: boolean;
  findings: Finding[];
  mismatch: MismatchReport;
  nextPrincipalId?: string;
  reasonSummary: string;
};

export type IntentSnapshot = {
  policy: Policy;
  contract: SpendContract;
  mandate: Mandate;
  agent: Agent;
  principals: Principal[];
};

export type DecisionRecord = {
  action: GateDecision;
  principalId: string;
  at: string;
  note: string;
  signature: string;
};

export type PurchaseIntent = {
  id: string;
  agentId: string;
  policyId: string;
  contractId: string;
  mandateId: string;
  merchantName: string;
  merchantCategory: MerchantCategory;
  declaredPurpose: string;
  amountCents: number;
  currency: typeof CURRENCY;
  occurredAt: string;
  submittedAt: string;
  claimedFingerprint: string;
  status: IntentStatus;
  evaluation: Evaluation;
  snapshot: IntentSnapshot;
  waitingOnPrincipalId?: string;
  decisions: DecisionRecord[];
};

export type AuditActor = {
  kind: "system" | "principal" | "agent";
  id: string;
  name: string;
};

export type AuditEvent = {
  seq: number;
  id: string;
  at: string;
  type: string;
  actor: AuditActor;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
};

export type World = {
  version: 1;
  principals: Principal[];
  agents: Agent[];
  policies: Policy[];
  contracts: SpendContract[];
  mandates: Mandate[];
  intents: PurchaseIntent[];
  audit: AuditEvent[];
  actingPrincipalId: string;
};

export type IntentDraft = {
  agentId: string;
  merchantName: string;
  merchantCategory: MerchantCategory;
  declaredPurpose: string;
  amountCents: number;
  occurredAt: string;
  claimedFingerprint?: string;
};

export type NewPrincipalInput = {
  name: string;
  email: string;
  role: PrincipalRole;
  rank: number;
  autoApproveCents: number;
  hardApproveCents: number | null;
};

export type NewPolicyInput = {
  name: string;
  kind: PolicyKind;
  principals: NewPrincipalInput[];
  agent: {
    name: string;
    runtime: string;
    boundPrincipalIndex: number;
  };
  contract: Omit<SpendContract, "id" | "policyId" | "agentId" | "revision">;
  issuedByPrincipalIndex: number;
};
