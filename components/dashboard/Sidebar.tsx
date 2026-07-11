"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Target,
  Landmark,
  ListTree,
  MessagesSquare,
  CheckCircle2,
  CalendarClock,
  Settings,
  Menu,
  X,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/uniqueness", label: "Uniqueness", icon: Target },
  { href: "/dashboard/conferences", label: "Conferences", icon: Landmark },
  { href: "/dashboard/outline", label: "Outline", icon: ListTree },
  { href: "/dashboard/coaching", label: "Coaching", icon: MessagesSquare },
  { href: "/dashboard/readiness", label: "Readiness", icon: CheckCircle2 },
  { href: "/dashboard/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-[hsl(var(--accent))]/12 text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <item.icon
              className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--accent))]" : "text-muted-foreground")}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--accent))]/15">
        <GraduationCap className="h-4 w-4 text-[hsl(var(--accent))]" />
      </div>
      <span className="text-sm font-medium tracking-wide text-foreground">ScholarPath</span>
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 ease-out lg:translate-x-0",
          "lg:sticky lg:top-0 lg:h-screen lg:bg-transparent",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, hsl(var(--accent) / 0.14), transparent 60%)",
          }}
        />
        <div className="relative flex h-full flex-col">
          <div className="hidden py-5 lg:block">
            <Brand />
          </div>

          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />

          <div className="border-t border-border px-3 py-4">
            <p className="truncate px-3 pb-3 text-xs text-muted-foreground">{userEmail}</p>
            <div className="px-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
