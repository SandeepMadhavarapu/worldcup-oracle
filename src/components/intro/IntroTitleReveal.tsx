"use client";

import { motion } from "framer-motion";

export function IntroTitleReveal({ reducedMotion }: { reducedMotion: boolean }) {
  const titleDelay = reducedMotion ? 0.2 : 3.05;

  return (
    <motion.div
      className="pointer-events-none relative z-20 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 22, scale: reducedMotion ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0.35 : 0.85, delay: titleDelay, ease: "easeOut" }}
    >
      <motion.div
        className="mb-5 rounded border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-xs font-semibold uppercase text-cyan-100 shadow-[0_0_36px_rgba(103,232,249,0.22)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: titleDelay + 0.15 }}
        style={{ letterSpacing: 0 }}
      >
        Oracle signal acquired
      </motion.div>
      <div className="relative overflow-hidden">
        <h1
          className="text-5xl font-semibold leading-none text-white sm:text-7xl"
          style={{ letterSpacing: 0 }}
        >
          <span className="bg-gradient-to-b from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_34px_rgba(103,232,249,0.34)]">
            WorldCup Oracle
          </span>
        </h1>
        {!reducedMotion ? (
          <span
            aria-hidden="true"
            className="intro-title-sheen absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />
        ) : null}
      </div>
      <motion.p
        className="mt-5 max-w-2xl text-base font-medium leading-7 text-zinc-300 sm:text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: titleDelay + 0.35 }}
      >
        Simulation. Intelligence. Football.
      </motion.p>
    </motion.div>
  );
}
