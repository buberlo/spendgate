import { NextResponse } from "next/server";
import { buildEvidencePack } from "@/lib/evidence";
import type { AuditEvent, PurchaseIntent } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    intent?: PurchaseIntent;
    audit?: AuditEvent[];
  };
  if (!body.intent || !body.audit) {
    return NextResponse.json(
      { error: "Expected { intent, audit }" },
      { status: 400 },
    );
  }
  const pack = await buildEvidencePack(body.intent, body.audit);
  return NextResponse.json(pack);
}
