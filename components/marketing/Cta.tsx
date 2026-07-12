import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BlurText } from "@/components/marketing/BlurText";

export function Cta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="border-b border-border py-16 text-center">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
          <BlurText text="Start with your idea" />
        </h2>
        <p className="mt-4 text-muted-foreground">
          {signedIn
            ? "Head back to your dashboard to pick up where you left off."
            : "Create a free account to open your dashboard and score your first idea."}
        </p>
        <Link
          href={signedIn ? "/dashboard" : "/signup"}
          className={buttonVariants({ size: "lg", className: "mt-8" })}
        >
          {signedIn ? "Go to dashboard" : "Get started"}
        </Link>
      </div>
    </section>
  );
}
