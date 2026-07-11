import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/marketing/Hero";
import { LogoSection } from "@/components/marketing/LogoSection";
import { Problem } from "@/components/marketing/Problem";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { Cta } from "@/components/marketing/Cta";
import { Footer } from "@/components/marketing/Footer";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40">
        <div className="mx-auto h-full max-w-5xl">
          <div className="relative h-full">
            <div className="absolute left-0 top-0 h-full w-px bg-border" />
            <div className="absolute right-0 top-0 h-full w-px bg-border" />
          </div>
        </div>
      </div>

      <main>
        <Hero signedIn={signedIn} />
        <LogoSection />
        <Problem />
        <HowItWorks />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <Cta signedIn={signedIn} />
      </main>
      <Footer />
    </>
  );
}
