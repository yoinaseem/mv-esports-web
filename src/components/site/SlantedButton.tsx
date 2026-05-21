"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { SlantedButtonSize, SlantedButtonVariant } from "@/types/site";

type Variant = SlantedButtonVariant;
type Size = SlantedButtonSize;

type SlantedButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

const variantClasses: Record<Variant, string> = {
  solid: "bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-100",
  outline: "border-2 border-primary text-primary bg-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-6 text-sm",
  default: "h-14 px-10 text-lg",
  lg: "h-16 px-12 text-xl",
};

// Motion takes ownership of `transform`, so keep `skewX` in the variants
// rather than relying on a Tailwind class — otherwise translateY clobbers it.
// Matches SlantedCard's -6° so cards and buttons share one slant identity.
const wrapVariants = {
  rest: { y: 0, skewX: -6 },
  hover: { y: -2, skewX: -6 },
};

// Outline-variant fill lives INSIDE the already-skewed shell — the parent
// transform handles the skew; adding more would double-skew and distort.
const fillVariants = {
  rest: { opacity: 0 },
  hover: { opacity: 1 },
};

function SlantedButtonShell({
  variant,
  size,
  children,
}: {
  variant: Variant;
  size: Size;
  children: React.ReactNode;
}) {
  return (
    <motion.span
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      animate="rest"
      className="relative inline-block"
    >
      <motion.span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden",
          variantClasses[variant],
          sizeClasses[size],
        )}
        variants={wrapVariants}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      >
        {/* Outline-variant hover fill — fades a faint orange tint behind the
            text instead of an external glow. */}
        {variant === "outline" ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-primary/10"
            variants={fillVariants}
            transition={{ duration: 0.12, ease: [0, 0, 0.2, 1] }}
          />
        ) : null}

        {/* Inner content counter-skews so the label reads upright. */}
        <span
          className="display relative inline-block text-current"
          style={{ transform: "skewX(6deg)" }}
        >
          {children}
        </span>
      </motion.span>
    </motion.span>
  );
}

export function SlantedButton({
  variant = "solid",
  size = "default",
  className,
  children,
  href,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
}: SlantedButtonProps) {
  const shell = (
    <SlantedButtonShell variant={variant} size={size}>
      {children}
    </SlantedButtonShell>
  );

  const sharedClasses = cn(
    "inline-block select-none outline-none focus-visible:[&_span]:ring-2",
    "focus-visible:[&_span]:ring-ring focus-visible:[&_span]:ring-offset-2",
    "focus-visible:[&_span]:ring-offset-background",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={sharedClasses}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {shell}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={sharedClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {shell}
    </button>
  );
}
