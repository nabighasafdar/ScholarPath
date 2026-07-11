"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/uniqueness", label: "Uniqueness" },
  { href: "/dashboard/conferences", label: "Conferences" },
  { href: "/dashboard/outline", label: "Outline" },
  { href: "/dashboard/coaching", label: "Coaching" },
  { href: "/dashboard/readiness", label: "Readiness" },
  { href: "/dashboard/deadlines", label: "Deadlines" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition",
              active
                ? "bg-[hsl(var(--accent))]/15 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
