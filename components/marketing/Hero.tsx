import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BlurText } from "@/components/marketing/BlurText";
import { Nav } from "@/components/marketing/Nav";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, hsl(var(--accent) / 0.18), transparent 40%), radial-gradient(circle at 85% 10%, hsl(var(--accent) / 0.1), transparent 35%), radial-gradient(circle at 50% 100%, hsl(var(--accent) / 0.08), transparent 45%), linear-gradient(to bottom, transparent 60%, hsl(var(--background)))",
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <Nav signedIn={signedIn} />

        <div className="flex flex-1 flex-col items-center px-6 pt-16 text-center md:pt-24">
          <h1 className="max-w-3xl text-balance text-5xl font-normal tracking-tight text-foreground md:text-6xl lg:text-7xl">
            <BlurText text="Know if your idea is worth writing." />
          </h1>
          <p className="mt-6 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground md:text-base">
            Paste a 2-sentence research idea, score it against real published papers, iterate
            until it&apos;s publish-worthy, then match conferences, build an outline, get
            section-by-section coaching, and check submission readiness — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href={signedIn ? "/dashboard" : "/signup"}
              className={buttonVariants({ size: "lg" })}
            >
              {signedIn ? "Go to dashboard" : "Get started"}
            </Link>
            <a href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
