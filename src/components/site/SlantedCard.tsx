"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type SlantedCardProps = {
  title: string;
  tag?: string;
  statusLabel?: string;
  live?: boolean;
  className?: string;
};

// Variants on the parent cascade to children that share the variant keys, so
// a single `whileHover` on the outer drives both the lift and the glow.
// Motion writes `transform` directly, so keep `skewX` in the variant rather
// than using a Tailwind class — otherwise the translateY would clobber it.
const cardVariants = {
  rest: { y: 0, skewX: -6 },
  hover: { y: -4, skewX: -6 },
};

// Glow tracks the card's -6° skew so the parallelogram halo aligns with
// the parallelogram card. Without this the glow reads as a rectangle behind
// a skewed card.
const glowVariants = {
  rest: { opacity: 0, skewX: -6 },
  hover: { opacity: 1, skewX: -6 },
};

export function SlantedCard({
  title,
  tag,
  statusLabel,
  live = false,
  className,
}: SlantedCardProps) {
  return (
    <motion.div
      className={cn("group relative", className)}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      animate="rest"
    >
      {/* Glow halo — parallelogram-shaped (skewed in glowVariants) to match
          the card's slant. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-1 bg-primary/25 blur-xl"
        variants={glowVariants}
        transition={{ duration: 0.12, ease: [0, 0, 0.2, 1] }}
      />

      {/* Skewed card — skewX + translateY composed in Motion variants so the
          two transforms don't clobber each other. */}
      <motion.div
        className="relative"
        variants={cardVariants}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      >
        <div className="corner-ticks relative aspect-[5/7] overflow-hidden border-2 border-primary/60 bg-background transition-colors duration-150 group-hover:border-primary">
          <div className="relative flex h-full skew-x-6 flex-col justify-between px-5 pt-2 pb-3">
            <div
              aria-hidden
              className="hud-grid-fine absolute inset-0 opacity-60"
            />
            {/* Slant compensation — shift top content right and bottom content
                left so both sit at the same visual distance from the slanted
                edges, not the same X inside the content box. */}
            <div className="relative translate-x-3">
              {tag ? <span className="kicker italic">{tag}</span> : null}
            </div>
            <div className="relative -translate-x-3">
              <h3 className="display text-2xl leading-[0.9]">{title}</h3>
              {statusLabel ? (
                <div
                  className={cn(
                    "mt-2 flex items-center gap-1.5 font-mono text-[10px]",
                    live ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {live ? (
                    <span className="relative inline-flex size-1.5 items-center justify-center">
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-primary"
                        animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                      <span className="absolute inset-0 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <span className="inline-block size-1.5 rounded-full bg-primary" />
                  )}
                  <span>{statusLabel}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
