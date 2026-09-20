"use client";

import { PolicyForm } from "@/components/PolicyForm";

export default function NewPolicyPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-seal">
          Issue
        </p>
        <h1 className="font-serif text-4xl">Create a multi-principal policy</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Assemble the living principals, rank them, attach a per-intent spend
          contract and an agent identity, then seal a mandate.
        </p>
      </header>
      <PolicyForm />
    </div>
  );
}
