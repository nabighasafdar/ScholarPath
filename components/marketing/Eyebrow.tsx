import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit items-center gap-3 border border-border px-4 py-2">
      <span className="h-2 w-2 bg-[hsl(var(--accent))]" />
      <span className="text-sm font-medium tracking-wide text-muted-foreground">{children}</span>
    </div>
  );
}
