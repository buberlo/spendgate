import { NextResponse } from "next/server";
import { evaluateIntent } from "@/lib/engine";
import type { IntentDraft, World } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    world?: World;
    draft?: IntentDraft;
  };
  if (!body.world || !body.draft) {
    return NextResponse.json(
      { error: "Expected { world, draft }" },
      { status: 400 },
    );
  }
  const evaluation = evaluateIntent(body.world, body.draft);
  return NextResponse.json({ evaluation });
}
