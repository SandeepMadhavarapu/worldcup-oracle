"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

import { IntroTitleReveal } from "@/components/intro/IntroTitleReveal";

const particles = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${(index * 23) % 100}%`,
  top: `${12 + ((index * 37) % 76)}%`,
  delay: `${(index % 9) * 0.18}s`,
  duration: `${3.6 + (index % 5) * 0.45}s`,
  size: 2 + (index % 3),
}));

const tacticalPaths = [
  "M70 410 C205 295 280 232 438 279 C566 317 607 191 766 144 C850 120 905 147 950 188",
  "M92 250 C210 214 305 350 427 328 C575 302 602 454 744 398 C825 366 888 378 944 426",
  "M174 506 C252 418 335 407 424 456 C528 512 624 493 720 416 C791 360 857 338 926 350",
  "M154 152 L305 250 L478 201 L635 299 L838 215",
];

function StadiumLights({ reducedMotion }: { reducedMotion: boolean }) {
  const beamClass =
    "intro-light-beam absolute top-0 h-[74vh] w-24 origin-top rounded-full bg-gradient-to-b from-white/42 via-cyan-100/13 to-transparent blur-xl";

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute left-[8%] top-0 h-14 w-48 rounded-b-full bg-white/20 blur-2xl" />
      <div className="absolute right-[8%] top-0 h-14 w-48 rounded-b-full bg-white/20 blur-2xl" />
      {[0, 1, 2].map((item) => (
        <span
          key={`left-${item}`}
          className={beamClass}
          style={{
            left: `${7 + item * 4}%`,
            "--beam-rotate": `${18 + item * 10}deg`,
            animationDelay: reducedMotion ? "0s" : `${item * 0.28}s`,
          } as CSSProperties}
        />
      ))}
      {[0, 1, 2].map((item) => (
        <span
          key={`right-${item}`}
          className={beamClass}
          style={{
            right: `${7 + item * 4}%`,
            "--beam-rotate": `${-18 - item * 10}deg`,
            animationDelay: reducedMotion ? "0s" : `${item * 0.28}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function ParticleField({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="intro-particle absolute rounded-full bg-cyan-100/80 shadow-[0_0_16px_rgba(103,232,249,0.75)]"
          style={{
            animationDelay: reducedMotion ? "0s" : particle.delay,
            animationDuration: reducedMotion ? "1s" : particle.duration,
            height: particle.size,
            left: particle.left,
            top: particle.top,
            width: particle.size,
          }}
        />
      ))}
    </div>
  );
}

function TacticalMap({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 z-10 h-full w-full opacity-80"
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.04 }}
      animate={{ opacity: reducedMotion ? 0.38 : 0.88, scale: 1 }}
      transition={{ duration: reducedMotion ? 0.3 : 1.2, delay: reducedMotion ? 0 : 1.4 }}
    >
      <defs>
        <linearGradient id="intro-path-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
          <stop offset="46%" stopColor="#67e8f9" stopOpacity="0.94" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="intro-core-gradient">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#07100d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="190" y="150" width="620" height="300" rx="28" fill="none" stroke="rgba(255,255,255,0.08)" />
      <circle cx="500" cy="300" r="62" fill="none" stroke="rgba(255,255,255,0.08)" />
      <line x1="500" y1="150" x2="500" y2="450" stroke="rgba(255,255,255,0.06)" />
      {tacticalPaths.map((path, index) => (
        <motion.path
          key={path}
          d={path}
          fill="none"
          stroke="url(#intro-path-gradient)"
          strokeLinecap="round"
          strokeWidth={index === 3 ? 1.5 : 2.4}
          initial={{ pathLength: reducedMotion ? 1 : 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: reducedMotion ? 0.45 : 1 }}
          transition={{
            duration: reducedMotion ? 0.2 : 1.15,
            delay: reducedMotion ? 0.05 : 1.65 + index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.g
        className={reducedMotion ? "" : "intro-orbit"}
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0.35 : 1, delay: reducedMotion ? 0.12 : 2.35 }}
        style={{ transformOrigin: "500px 300px" }}
      >
        <circle cx="500" cy="300" r="116" fill="url(#intro-core-gradient)" />
        <circle cx="500" cy="300" r="92" fill="none" stroke="#67e8f9" strokeOpacity="0.62" strokeWidth="1.2" />
        <ellipse cx="500" cy="300" rx="92" ry="28" fill="none" stroke="#fef3c7" strokeOpacity="0.42" />
        <ellipse cx="500" cy="300" rx="36" ry="92" fill="none" stroke="#67e8f9" strokeOpacity="0.36" />
        <path d="M408 300 C455 246 546 246 592 300 C546 354 455 354 408 300Z" fill="none" stroke="#34d399" strokeOpacity="0.48" />
      </motion.g>
    </motion.svg>
  );
}

export function IntroScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020604]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(8,145,178,0.24),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.24),transparent_38%),linear-gradient(180deg,#010303_0%,#07100d_58%,#020403_100%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[42vh] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.13),transparent_56%)] blur-2xl" />
      <StadiumLights reducedMotion={reducedMotion} />
      <ParticleField reducedMotion={reducedMotion} />
      <TacticalMap reducedMotion={reducedMotion} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_47%,rgba(0,0,0,0.58)_100%)]" />
      <div className="relative z-30 flex h-full items-center justify-center">
        <IntroTitleReveal reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}
