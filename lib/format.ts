import type { GateDecision, IntentStatus, MerchantCategory, PolicyKind, PrincipalRole } from "./types";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatEUR(cents: number): string {
  return euro.format(cents / 100);
}

export function formatEURCompact(cents: number | null): string {
  if (cents === null) return "Unlimited";
  return formatEUR(cents);
}

export function parseEuroToCents(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function formatWhen(iso: string, tz = "Europe/Berlin"): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function kindLabel(kind: PolicyKind): string {
  switch (kind) {
    case "household":
      return "Household";
    case "shared_wallet":
      return "Shared wallet";
    case "company":
      return "Company";
    case "parental":
      return "Parental";
  }
}

export function roleLabel(role: PrincipalRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "approver":
      return "Approver";
    case "spender":
      return "Spender";
    case "dependent":
      return "Dependent";
  }
}

export function categoryLabel(category: MerchantCategory): string {
  const labels: Record<MerchantCategory, string> = {
    groceries: "Groceries",
    transport: "Transport",
    travel: "Travel",
    electronics: "Electronics",
    office: "Office",
    restaurants: "Restaurants",
    healthcare: "Healthcare",
    education: "Education",
    entertainment: "Entertainment",
    gambling: "Gambling",
    crypto: "Crypto",
    other: "Other",
  };
  return labels[category];
}

export function statusLabel(status: IntentStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "allowed":
      return "Allowed";
    case "denied":
      return "Denied";
    case "escalated":
      return "Escalated";
  }
}

export function decisionLabel(decision: GateDecision): string {
  switch (decision) {
    case "allow":
      return "Allow";
    case "deny":
      return "Deny";
    case "escalate":
      return "Escalate";
  }
}

export function weekdayLabel(isoDay: number): string {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][isoDay - 1] ?? "?";
}

export function minuteToClock(minute: number): string {
  const h = Math.floor(minute / 60)
    .toString()
    .padStart(2, "0");
  const m = (minute % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function clockToMinute(clock: string): number {
  const [h, m] = clock.split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}
