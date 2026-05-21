"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const container = {
  hidden: { opacity: 1 },
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

type PageHeroProps = {
  kicker: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  // When set, swaps the HUD-grid background for the image (with a dark
  // gradient for readability). Vignette glow stays on top to maintain brand
  // identity. Used for game detail pages with banner art.
  backgroundImage?: string | null;
};

export function PageHero({
  kicker,
  title,
  subtitle,
  actions,
  backgroundImage,
}: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Two parallax targets driven by the same scroll progress — the grid for
  // the default hero, the banner for the image hero. Only one renders at a
  // time so there's no overlap.
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const bannerY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const hasBanner = Boolean(backgroundImage);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-background"
    >
      {hasBanner ? (
        <>
          {/* Banner image — parallaxes slightly. Cover + center crops to fill
              any aspect ratio the host pasted. */}
          <motion.div
            aria-hidden
            style={
              shouldReduceMotion
                ? { backgroundImage: `url(${backgroundImage})` }
                : { y: bannerY, backgroundImage: `url(${backgroundImage})` }
            }
            className="pointer-events-none absolute inset-x-0 top-0 -bottom-20 bg-cover bg-center"
          />
          {/* Dark gradient overlay — denser at the bottom where copy sits. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40"
          />
        </>
      ) : (
        <motion.div
          aria-hidden
          style={shouldReduceMotion ? undefined : { y: gridY }}
          className="hud-grid mask-vignette pointer-events-none absolute inset-x-0 top-0 -bottom-32"
        />
      )}

      <div
        aria-hidden
        className="hud-vignette pointer-events-none absolute inset-0"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-7 px-6 py-28 sm:py-32 lg:py-40"
      >
        <motion.span variants={item} className="kicker">
          {kicker}
        </motion.span>
        <motion.h1
          variants={item}
          className="display max-w-5xl whitespace-pre-line text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.88]"
        >
          {title}
        </motion.h1>
        {subtitle ? (
          <motion.p
            variants={item}
            className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {subtitle}
          </motion.p>
        ) : null}
        {actions ? (
          <motion.div
            variants={item}
            className="mt-2 flex flex-wrap items-center gap-5"
          >
            {actions}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
