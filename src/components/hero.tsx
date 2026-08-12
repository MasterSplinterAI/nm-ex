"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-[center_45%]"
        style={{ backgroundImage: "url(/hero-jos-plateau.jpg)" }}
        aria-hidden
      />
      <div className="hero-veil absolute inset-0" aria-hidden />
      <div className="grain absolute inset-0 opacity-[0.3]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-20 sm:px-10 sm:pb-10 sm:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(2.4rem,7vw,4.25rem)] leading-[0.9] tracking-[-0.04em] text-[var(--ink)]"
        >
          NM-EX
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 max-w-xl font-sans text-lg font-medium tracking-tight text-[var(--ink)] sm:text-xl"
        >
          Nigerian Metals Exchange
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base"
        >
          Live market prices for Nigeria&apos;s solid mineral exports,
          in naira and US dollars.
        </motion.p>
      </div>
    </section>
  );
}
