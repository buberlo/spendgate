import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { DemoShell } from "@/components/DemoShell";

export const metadata: Metadata = {
  title: "Demo",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <DemoShell>{children}</DemoShell>
    </StoreProvider>
  );
}
