"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Nav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-50 w-full px-6 py-6 sm:px-10 lg:px-14">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <GraduationCap className="h-5 w-5 text-[hsl(var(--accent))]" />
          <span className="font-medium tracking-tight">ScholarPath</span>
        </Link>

        <div className="hidden items-center justify-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </div>

        <div className="flex items-center justify-self-end">
          <div className="hidden items-center gap-3 sm:flex">
            {signedIn ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Sign in
                </Link>
                <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="text-foreground sm:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 border border-border bg-card px-6 py-6 sm:hidden">
          <div className="flex flex-col gap-4">
            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              How it works
            </a>
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className={buttonVariants({ className: "justify-center" })}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ variant: "outline", className: "justify-center" })}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ className: "justify-center" })}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
