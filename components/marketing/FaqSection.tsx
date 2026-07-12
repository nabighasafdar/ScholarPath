"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { BlurText } from "@/components/marketing/BlurText";

const FAQS = [
  {
    id: "free",
    question: "Is ScholarPath free right now?",
    answer:
      "Yes. Billing isn't built yet — everything is free while the product is early, starting with uniqueness scoring.",
  },
  {
    id: "privacy",
    question: "Is my research idea kept private?",
    answer:
      "Your ideas and sessions are stored in your own account in Postgres, protected by row-level security — only you can read or write your own rows.",
  },
  {
    id: "fields",
    question: "Which fields does the paper corpus cover?",
    answer:
      "It starts with CS, EE, and biomedical abstracts from Semantic Scholar and arXiv, expanding to more fields as the corpus grows.",
  },
  {
    id: "google",
    question: "Can I sign in with Google?",
    answer: "Not yet — it's coming soon. Email and password sign-in works today.",
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className="border-b border-border py-16">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
            <BlurText text="Common questions" />
          </h2>
          <p className="max-w-md text-balance text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? The product is still early — reach out
            and ask.
          </p>
        </div>

        <div className="flex flex-col">
          {FAQS.map((faq, index) => (
            <div
              key={faq.id}
              className={cn("border-t border-border", index === FAQS.length - 1 && "border-b")}
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="flex w-full items-center justify-between gap-4 py-6 text-left"
              >
                <span className="text-lg font-normal text-foreground">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openId === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pr-12 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
