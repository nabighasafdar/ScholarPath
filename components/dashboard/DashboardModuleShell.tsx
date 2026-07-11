import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function DashboardModuleShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-border pb-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Overview
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
