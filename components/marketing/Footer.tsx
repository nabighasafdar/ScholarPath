import Link from "next/link";
import { GraduationCap } from "lucide-react";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/login", label: "Sign in" },
];

export function Footer() {
  return (
    <footer className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <GraduationCap className="h-4 w-4 text-[hsl(var(--accent))]" />
          <span className="font-medium">ScholarPath</span>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Built for students turning a research idea into a submitted paper.
      </p>
    </footer>
  );
}
