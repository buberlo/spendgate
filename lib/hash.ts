const GENESIS = "0".repeat(64);

export function genesisHash(): string {
  return GENESIS;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonical(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`)
    .join(",")}}`;
}

export async function hashPayload(value: unknown): Promise<string> {
  return sha256Hex(canonical(value));
}

export type ChainLink = {
  seq: number;
  id: string;
  at: string;
  type: string;
  actor: unknown;
  entityType: string;
  entityId: string;
  payload: unknown;
  prevHash: string;
  hash: string;
};

export async function hashAuditLink(
  event: Omit<ChainLink, "hash">,
): Promise<string> {
  return hashPayload({
    seq: event.seq,
    id: event.id,
    at: event.at,
    type: event.type,
    actor: event.actor,
    entityType: event.entityType,
    entityId: event.entityId,
    payload: event.payload,
    prevHash: event.prevHash,
  });
}

export async function verifyChain(
  events: ChainLink[],
): Promise<{ ok: boolean; brokenAt?: number; detail?: string }> {
  let prev = GENESIS;
  for (const event of events) {
    if (event.prevHash !== prev) {
      return {
        ok: false,
        brokenAt: event.seq,
        detail: `prevHash mismatch at seq ${event.seq}`,
      };
    }
    const expected = await hashAuditLink(event);
    if (expected !== event.hash) {
      return {
        ok: false,
        brokenAt: event.seq,
        detail: `hash mismatch at seq ${event.seq}`,
      };
    }
    prev = event.hash;
  }
  return { ok: true };
}

export function shortHash(hash: string, head = 8, tail = 6): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function fingerprintFrom(parts: string[]): string {
  return parts
    .join("|")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24)
    .padEnd(16, "0")
    .toLowerCase();
}

export function newId(prefix: string): string {
  const rand =
    globalThis.crypto?.randomUUID?.() ??
    `x${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand.replace(/-/g, "").slice(0, 16)}`;
}
