"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { SlantedButton } from "@/components/site/SlantedButton";
import { cn } from "@/lib/utils";
import type { Tournament } from "@/types/tournaments";

const containerVariants = {
  hidden: { opacity: 1 },
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

function isLive(t: Tournament): boolean {
  return (t.live_match_count ?? 0) > 0;
}

type BadgeTone = "live" | "open" | "muted" | "destructive";

function statusFor(t: Tournament): { label: string; tone: BadgeTone } {
  if (isLive(t)) return { label: "Live now", tone: "live" };
  if (t.status === "registration_open")
    return { label: "Registration open", tone: "open" };
  if (t.status === "registration_closed")
    return { label: "Registration closed", tone: "muted" };
  if (t.status === "in_progress") return { label: "Ongoing", tone: "muted" };
  if (t.status === "completed") return { label: "Completed", tone: "muted" };
  if (t.status === "cancelled")
    return { label: "Cancelled", tone: "destructive" };
  return { label: t.status, tone: "muted" } as { label: string; tone: BadgeTone };
}

const toneClasses: Record<BadgeTone, string> = {
  live: "border-primary text-primary bg-primary/10",
  open: "border-primary/70 text-primary bg-primary/5",
  muted: "border-border text-muted-foreground bg-card/50",
  destructive: "border-destructive/60 text-destructive bg-destructive/10",
};

function StatusBadge({ tournament }: { tournament: Tournament }) {
  const { label, tone } = statusFor(tournament);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
        toneClasses[tone],
      )}
    >
      {tone === "live" ? (
        <span className="relative inline-flex size-1.5 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
          <span className="absolute inset-0 rounded-full bg-primary" />
        </span>
      ) : null}
      {label}
    </span>
  );
}

function kickerFor(t: Tournament): string {
  const game = t.game?.name ?? "Tournament";
  const ptype = t.participant_type === "team" ? "Teams" : "Players";
  return `${game} · ${ptype}`;
}

export function TournamentHero({ tournament }: { tournament: Tournament }) {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const bannerY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const status = statusFor(tournament);
  const hasBanner = Boolean(tournament.banner_url);
  const showStreamCta = Boolean(tournament.stream_url);
  // Hide the bracket CTA on registration-open / closed since there's nothing
  // built yet — keep the page from teasing an anchor that lands on a
  // placeholder.
  const showBracketCta =
    tournament.status === "in_progress" ||
    tournament.status === "completed" ||
    isLive(tournament);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-background"
    >
      {hasBanner ? (
        <>
          <motion.div
            aria-hidden
            style={
              shouldReduceMotion
                ? { backgroundImage: `url(${tournament.banner_url})` }
                : {
                    y: bannerY,
                    backgroundImage: `url(${tournament.banner_url})`,
                  }
            }
            className="pointer-events-none absolute inset-x-0 top-0 -bottom-20 bg-cover bg-center"
          />
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
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-7 px-6 py-24 sm:py-28 lg:py-32"
      >
        <motion.span variants={itemVariants} className="kicker">
          {kickerFor(tournament)}
        </motion.span>

        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4"
        >
          <h1 className="display max-w-4xl text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.9]">
            {tournament.name}
          </h1>
          <StatusBadge tournament={tournament} />
        </motion.div>

        {tournament.description ? (
          <motion.p
            variants={itemVariants}
            className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {tournament.description}
          </motion.p>
        ) : null}

        {showBracketCta || showStreamCta ? (
          <motion.div
            variants={itemVariants}
            className="mt-2 flex flex-wrap items-center gap-5"
          >
            {showStreamCta ? (
              <SlantedButton
                size="lg"
                href={tournament.stream_url ?? "#"}
              >
                {status.tone === "live" ? "Watch live →" : "Watch stream"}
              </SlantedButton>
            ) : null}
            {showBracketCta ? (
              <SlantedButton
                variant={showStreamCta ? "outline" : "solid"}
                size="lg"
                href="#bracket"
              >
                View bracket
              </SlantedButton>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
