// Home-page content. Plain typed data — pages import + render. CTAs are
// declarative so the rendering component owns the actual SlantedButton JSX.
// Swap this whole file for a fetch when a CMS lands.

import type { SlantedButtonSize, SlantedButtonVariant } from "@/types/site";

export type CTAConfig = {
  label: string;
  href: string;
  variant?: SlantedButtonVariant;
  size?: SlantedButtonSize;
};

export type HomeHeroContent = {
  kicker: string;
  // `\n` renders as a line break via the consumer's `whitespace-pre-line`.
  title: string;
  subtitle: string;
  ctas: ReadonlyArray<CTAConfig>;
};

export const homeHero: HomeHeroContent = {
  kicker: "Maldivian eSports · 2026 season",
  title: "Open brackets.\nPublic results.",
  subtitle:
    "Compete, host, and follow tournaments across the Maldives' competitive scene. Bracket structure, match results, stream links — open by default.",
  ctas: [
    { label: "Browse tournaments", href: "/tournaments", size: "lg" },
    { label: "Host an event", href: "/host", variant: "outline", size: "lg" },
  ],
};
