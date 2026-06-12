"use client";

import {
  useCallback,
  useMemo,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { SkipForward } from "lucide-react";

import { INTRO_DURATION_MS } from "@/lib/intro/config";
import { teams } from "@/lib/data/teams";
import type { Team } from "@/lib/types";

// Compliant generic backdrop: an empty night stadium with a cyan energy ring.
// No players, no crests, no sponsor marks, no watermarks (visually verified).
import stadiumBackdrop from "./stadium-master.webp";
import styles from "./IntroScene.module.css";

type IntroStyle = CSSProperties & Record<`--${string}`, string | number>;

type TeamMarker = Pick<Team, "accent" | "code" | "group" | "id" | "name"> & {
  angle: number;
  delay: number;
  radius: string;
};

interface IntroSceneProps {
  labelId?: string;
  onSkip?: () => void;
  reducedMotion: boolean;
}

const markerRadii = [
  "calc(var(--orbit-size) * 0.47)",
  "calc(var(--orbit-size) * 0.35)",
] as const;
const ringAngleOffsets = [4, -9] as const;
const waveColors = [
  "#38bdf8",
  "#22c55e",
  "#facc15",
  "#ef4444",
  "#f8fafc",
  "#fb923c",
] as const;
const featuredTeamCodes = [
  "ARG",
  "BRA",
  "FRA",
  "POR",
  "USA",
  "MAR",
  "JPN",
  "KOR",
  "GER",
  "ENG",
  "ESP",
  "NED",
  "ITA",
  "MEX",
  "COL",
  "SEN",
  "URU",
  "CRO",
] as const;

// Floodlight beams anchored to the light towers visible in the backdrop image.
const floodlightBeams = [
  { delay: "0.25s", tilt: "14deg", x: "8%" },
  { delay: "0.45s", tilt: "6deg", x: "33%" },
  { delay: "0.6s", tilt: "-6deg", x: "60%" },
  { delay: "0.35s", tilt: "-14deg", x: "86%" },
] as const;

export function IntroScene({
  labelId = "worldcup-oracle-intro-title",
  onSkip,
  reducedMotion,
}: IntroSceneProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { damping: 26, stiffness: 160 });
  const smoothY = useSpring(pointerY, { damping: 26, stiffness: 160 });
  const farX = useTransform(smoothX, [-1, 1], [-14, 14]);
  const farY = useTransform(smoothY, [-1, 1], [-10, 10]);
  const nearX = useTransform(smoothX, [-1, 1], [18, -18]);
  const nearY = useTransform(smoothY, [-1, 1], [14, -14]);
  const titleX = useTransform(smoothX, [-1, 1], [7, -7]);
  const titleY = useTransform(smoothY, [-1, 1], [5, -5]);

  const markers = useMemo(
    () => buildTeamMarkers(selectFeaturedTeams(teams)),
    [],
  );
  const parallaxOff = reducedMotion;

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reducedMotion) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      pointerX.set(clampedX * 2 - 1);
      pointerY.set(clampedY * 2 - 1);
      rootRef.current?.style.setProperty("--cursor-x", `${clampedX * 100}%`);
      rootRef.current?.style.setProperty("--cursor-y", `${clampedY * 100}%`);
    },
    [pointerX, pointerY, reducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    rootRef.current?.style.setProperty("--cursor-x", "50%");
    rootRef.current?.style.setProperty("--cursor-y", "48%");
  }, [pointerX, pointerY]);

  return (
    <section
      ref={rootRef}
      aria-labelledby={labelId}
      className={[styles.scene, reducedMotion ? styles.finished : ""]
        .join(" ")
        .trim()}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={
        {
          "--cursor-x": "50%",
          "--cursor-y": "48%",
          "--intro-duration": `${INTRO_DURATION_MS}ms`,
        } as IntroStyle
      }
    >
      <div className={styles.controlDock}>
        {onSkip ? (
          <button
            type="button"
            autoFocus
            className={styles.skipButton}
            onClick={onSkip}
            onPointerDown={onSkip}
          >
            <SkipForward className={styles.controlIcon} aria-hidden="true" />
            Skip Intro
          </button>
        ) : null}
      </div>

      <div className={styles.stage}>
        <motion.div
          aria-hidden="true"
          className={styles.deepLayer}
          style={parallaxOff ? undefined : { x: farX, y: farY }}
        >
          <Image
            src={stadiumBackdrop}
            alt=""
            fill
            preload
            placeholder="blur"
            sizes="100vw"
            className={styles.stadiumBackdrop}
          />
          <div className={styles.backdropVeil} />
          <div className={styles.pitchGlow} />
          <FloodlightRig />
          <CeremonyAtmosphere />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className={styles.motionLayer}
          style={parallaxOff ? undefined : { x: nearX, y: nearY }}
        >
          <LegendMotionGlyphs />
          <TeamOrbit markers={markers} />
          <IntelligenceOverlay />
          <MonteCarloParticles />
          <div className={styles.crescendoFlash} />
        </motion.div>

        <motion.div
          className={styles.titleFrame}
          style={parallaxOff ? undefined : { x: titleX, y: titleY }}
        >
          <div className={styles.titleHalo} aria-hidden="true" />
          <p className={styles.signalTag}>ORACLE SIGNAL ACQUIRED</p>
          <h1 id={labelId} className={styles.wordmark}>
            WorldCup Oracle
          </h1>
          <p className={styles.subtitle}>
            Where football legacy meets prediction intelligence
          </p>
          <div className={styles.titleSweep} aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}

function FloodlightRig() {
  return (
    <div className={styles.lightRig} aria-hidden="true">
      {floodlightBeams.map((beam) => (
        <span
          key={beam.x}
          style={
            {
              "--beam-delay": beam.delay,
              "--beam-tilt": beam.tilt,
              "--beam-x": beam.x,
            } as IntroStyle
          }
        />
      ))}
    </div>
  );
}

function OracleGlobe() {
  return (
    <svg
      className={styles.globeSvg}
      viewBox="0 0 220 220"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="introGlobeSphere" cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.2" />
          <stop offset="42%" stopColor="#0e7490" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#021a12" stopOpacity="0.94" />
        </radialGradient>
        <radialGradient id="introGlobeAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0" />
          <stop offset="72%" stopColor="#67e8f9" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="introGlobeCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="38%" stopColor="#67e8f9" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#021a12" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="110" cy="110" r="104" fill="url(#introGlobeAura)" />
      <circle cx="110" cy="110" r="80" fill="url(#introGlobeSphere)" />
      <circle cx="110" cy="110" r="27" fill="url(#introGlobeCore)" opacity="0.55" />

      <ellipse cx="110" cy="110" rx="80" ry="25" fill="none" stroke="#67e8f9" strokeOpacity="0.5" strokeWidth="1" />
      <ellipse cx="110" cy="86" rx="68" ry="21" fill="none" stroke="#67e8f9" strokeOpacity="0.22" strokeWidth="0.6" />
      <ellipse cx="110" cy="134" rx="68" ry="21" fill="none" stroke="#67e8f9" strokeOpacity="0.22" strokeWidth="0.6" />
      <ellipse cx="110" cy="110" rx="25" ry="80" fill="none" stroke="#67e8f9" strokeOpacity="0.18" strokeWidth="0.6" />
      <ellipse cx="110" cy="110" rx="25" ry="80" fill="none" stroke="#67e8f9" strokeOpacity="0.14" strokeWidth="0.6" transform="rotate(60,110,110)" />
      <ellipse cx="110" cy="110" rx="25" ry="80" fill="none" stroke="#67e8f9" strokeOpacity="0.14" strokeWidth="0.6" transform="rotate(120,110,110)" />
    </svg>
  );
}

function CeremonyAtmosphere() {
  return (
    <>
      <div className={styles.openingCeremonyGlow} aria-hidden="true" />
      <div className={styles.stadiumFlashBands} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--band-delay": `${0.18 + index * 0.18}s`,
                "--band-y": `${13 + index * 8}%`,
              } as IntroStyle
            }
          />
        ))}
      </div>
      <div className={styles.ledRibbonGlow} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={styles.crowdSilhouetteBand} aria-hidden="true" />
      <div className={styles.crowdLightField} aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--crowd-row-delay": `${index * 0.28}s`,
                "--crowd-row-y": `${58 + index * 5}%`,
              } as IntroStyle
            }
          />
        ))}
      </div>
      <div className={styles.audienceTwinkles} aria-hidden="true">
        {Array.from({ length: 42 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--twinkle-delay": `${0.16 + (index % 17) * 0.13}s`,
                "--twinkle-size": `${2 + (index % 3)}px`,
                "--twinkle-x": `${4 + ((index * 19) % 92)}%`,
                "--twinkle-y": `${20 + ((index * 31) % 47)}%`,
              } as IntroStyle
            }
          />
        ))}
      </div>
      <div className={styles.nationalColorWaves} aria-hidden="true">
        {waveColors.map((color, index) => (
          <span
            key={color}
            style={
              {
                "--wave-color": color,
                "--wave-delay": `${2.15 + index * 0.2}s`,
                "--wave-y": `${36 + index * 5}%`,
              } as IntroStyle
            }
          />
        ))}
      </div>
      <div className={styles.celebrationParticles} aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--celebration-delay": `${5.65 + (index % 10) * 0.065}s`,
                "--celebration-x": `${8 + ((index * 23) % 84)}%`,
                "--celebration-y": `${63 + ((index * 11) % 20)}%`,
              } as IntroStyle
            }
          />
        ))}
      </div>
      <div className={styles.confettiBurst} aria-hidden="true">
        {Array.from({ length: 22 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--confetti-color": waveColors[index % waveColors.length],
                "--confetti-delay": `${6.55 + (index % 12) * 0.04}s`,
                "--confetti-rotate": `${(index * 37) % 180}deg`,
                "--confetti-x": `${8 + ((index * 29) % 84)}%`,
              } as IntroStyle
            }
          />
        ))}
      </div>
    </>
  );
}

function buildTeamMarkers(selectedTeams: Team[]): TeamMarker[] {
  const ringPositions = [0, 0];
  const ringTotals = [0, 1].map((ring) =>
    selectedTeams.filter((_, index) => index % 2 === ring).length,
  );

  return selectedTeams.map((team, index) => {
    const ring = index % 2;
    const position = ringPositions[ring]++;
    const angle =
      (360 / Math.max(1, ringTotals[ring])) * position + ringAngleOffsets[ring];

    return {
      accent: team.accent,
      angle,
      code: team.code,
      delay: index * 0.035,
      group: team.group,
      id: team.id,
      name: team.name,
      radius: markerRadii[ring],
    };
  });
}

function selectFeaturedTeams(allTeams: Team[]) {
  const teamByCode = new Map(allTeams.map((team) => [team.code, team]));
  return featuredTeamCodes
    .map((code) => teamByCode.get(code))
    .filter((team): team is Team => Boolean(team));
}

function LegendMotionGlyphs() {
  return (
    <svg
      className={styles.legendMotionGlyphs}
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="introLegendMotion" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#f8fafc" offset="0" />
          <stop stopColor="#22d3ee" offset="0.52" />
          <stop stopColor="#facc15" offset="1" />
        </linearGradient>
      </defs>
      <g className={styles.legendStride}>
        <path d="M198 470 C274 405 325 438 402 366 C438 333 470 320 508 322" />
        <path d="M420 246 C394 268 390 314 424 337 L458 360 L430 414" />
        <circle cx="198" cy="470" r="10" />
      </g>
      <g className={styles.legendLeap}>
        <path d="M846 458 C816 388 852 315 926 284 C969 266 1007 272 1043 292" />
        <path d="M840 188 C824 226 841 265 882 284 L916 310 L874 370" />
        <circle cx="1048" cy="292" r="11" />
      </g>
      <g className={styles.legendFlare}>
        <path d="M392 545 C484 496 490 564 570 515 C624 482 604 430 680 414" />
        <path d="M644 278 C616 318 638 363 682 378 L718 391" />
        <circle cx="392" cy="545" r="9" />
      </g>
    </svg>
  );
}

function TeamOrbit({ markers }: { markers: TeamMarker[] }) {
  return (
    <div className={styles.orbitShell} aria-hidden="true">
      <div className={styles.orbitGlow} />
      <OracleGlobe />
      <div className={styles.orbitRingOuter} />
      <div className={styles.orbitRingMiddle} />
      <div className={styles.orbitRingInner} />
      <div className={styles.teamConstellation}>
        {markers.map((team) => (
          <span
            key={team.id}
            className={styles.teamMarker}
            style={
              {
                "--accent": team.accent,
                "--angle": `${team.angle}deg`,
                "--delay": `${team.delay}s`,
                "--radius": team.radius,
              } as IntroStyle
            }
            title={`${team.name} - Group ${team.group}`}
          >
            <span className={styles.teamCode}>{team.code}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function IntelligenceOverlay() {
  return (
    <svg
      className={styles.intelligenceSvg}
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="introPreviewSignal" x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#34d399" offset="0" />
          <stop stopColor="#22d3ee" offset="0.55" />
          <stop stopColor="#facc15" offset="1" />
        </linearGradient>
      </defs>
      <path
        className={`${styles.bracketPath} ${styles.bracketPathOne}`}
        d="M122 455 H250 V398 H352"
      />
      <path
        className={`${styles.bracketPath} ${styles.bracketPathTwo}`}
        d="M122 530 H250 V588 H352"
      />
      <path
        className={`${styles.bracketPath} ${styles.bracketPathThree}`}
        d="M848 398 H956 V455 H1078"
      />
      <path
        className={`${styles.bracketPath} ${styles.bracketPathFour}`}
        d="M848 588 H956 V530 H1078"
      />
      <path
        className={styles.probabilityArc}
        d="M355 500 C476 382 718 382 845 500"
      />
      <path
        className={styles.probabilityArcAlt}
        d="M415 546 C530 644 673 643 790 545"
      />
      <g className={styles.signalNodes}>
        {[
          [250, 398],
          [250, 588],
          [352, 398],
          [352, 588],
          [848, 398],
          [848, 588],
          [956, 455],
          [956, 530],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />
        ))}
      </g>
      <text className={styles.dataGlyph} x="310" y="377">
        64%
      </text>
      <text className={styles.dataGlyph} x="804" y="377">
        71%
      </text>
      <text className={styles.dataGlyph} x="548" y="612">
        10K RUNS
      </text>
    </svg>
  );
}

function MonteCarloParticles() {
  return (
    <div className={styles.particleField} aria-hidden="true">
      {Array.from({ length: 22 }, (_, index) => (
        <span
          key={index}
          className={styles.signalParticle}
          style={
            {
              "--particle-delay": `${index * 0.05}s`,
              "--particle-x": `${(index * 29) % 100}%`,
              "--particle-y": `${18 + ((index * 47) % 62)}%`,
            } as IntroStyle
          }
        />
      ))}
    </div>
  );
}
