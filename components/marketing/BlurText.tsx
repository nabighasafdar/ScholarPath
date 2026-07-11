"use client";

import { motion } from "framer-motion";

export function BlurText({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0 }}
          whileInView={{ filter: "blur(0px)", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}
