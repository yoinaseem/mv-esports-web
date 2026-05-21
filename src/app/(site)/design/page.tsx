import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SlantedCard } from "@/components/site/SlantedCard";
import { SlantedButton } from "@/components/site/SlantedButton";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Style tile · MV Esports",
  description: "Internal design system reference — tokens, type, surfaces, motion.",
  robots: { index: false, follow: false },
};

const COLOUR_TOKENS: ReadonlyArray<{ name: string; varName: string; classes: string }> = [
  { name: "background", varName: "--background", classes: "bg-background border border-border" },
  { name: "foreground", varName: "--foreground", classes: "bg-foreground" },
  { name: "card", varName: "--card", classes: "bg-card border border-border" },
  { name: "muted", varName: "--muted", classes: "bg-muted" },
  { name: "muted-foreground", varName: "--muted-foreground", classes: "bg-muted-foreground" },
  { name: "border", varName: "--border", classes: "bg-border" },
  { name: "primary", varName: "--primary", classes: "bg-primary" },
  { name: "primary-hover", varName: "--primary-hover", classes: "bg-primary-hover" },
  { name: "primary-foreground", varName: "--primary-foreground", classes: "bg-primary-foreground border border-border" },
  { name: "destructive", varName: "--destructive", classes: "bg-destructive" },
];

const GLOW_TOKENS: ReadonlyArray<{ name: string; shadowClass: string }> = [
  { name: "shadow-glow-xs", shadowClass: "shadow-glow-xs" },
  { name: "shadow-glow-sm", shadowClass: "shadow-glow-sm" },
  { name: "shadow-glow-md", shadowClass: "shadow-glow-md" },
  { name: "shadow-glow-lg", shadowClass: "shadow-glow-lg" },
  { name: "shadow-glow-inset", shadowClass: "shadow-glow-inset" },
];

const RADIUS_TOKENS: ReadonlyArray<{ name: string; class: string }> = [
  { name: "rounded-sm", class: "rounded-sm" },
  { name: "rounded-md", class: "rounded-md" },
  { name: "rounded-lg", class: "rounded-lg" },
  { name: "rounded-xl", class: "rounded-xl" },
  { name: "rounded-2xl", class: "rounded-2xl" },
];

function Section({
  kicker,
  title,
  note,
  children,
}: {
  kicker: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto w-full max-w-6xl px-6">
        <header className="mb-10 flex flex-col gap-3">
          <span className="kicker">{kicker}</span>
          <h2 className="display text-3xl sm:text-4xl">{title}</h2>
          {note ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{note}</p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}

function SwatchTile({
  label,
  meta,
  swatchClass,
  height = "h-20",
}: {
  label: string;
  meta?: string;
  swatchClass: string;
  height?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("w-full rounded-md", height, swatchClass)} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {meta ? (
          <span className="font-mono text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function DesignPage() {
  return (
    <main className="flex-1 pb-24">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-16">
          <span className="kicker">Internal · Style tile</span>
          <h1 className="display text-5xl leading-[0.9] sm:text-6xl">
            MV Esports —<br />
            tactical base, neon accents.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Reference page for tokens, typography, surfaces, and motion primitives that
            power the public site. Default to the tactical primitives; reach for neon
            (glow, scanlines, pulse) only on hero, live-state, and featured slots.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
            <span>not in nav</span>
            <span aria-hidden>·</span>
            <span>noindex</span>
            <span aria-hidden>·</span>
            <Link href="/" className="underline-offset-4 hover:underline">
              ← back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Colours */}
      <Section
        kicker="01 · Foundation"
        title="Colour tokens"
        note="From globals.css. Dark mode is forced via the root html.dark class; light values are vestigial."
      >
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
          {COLOUR_TOKENS.map((t) => (
            <SwatchTile key={t.name} label={t.name} meta={t.varName} swatchClass={t.classes} />
          ))}
        </div>
      </Section>

      {/* Glow shadows */}
      <Section
        kicker="02 · Foundation"
        title="Glow shadow tokens"
        note="Orange at varying alpha. Reserved for hero, live-state, and featured slots — never on default surfaces."
      >
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {GLOW_TOKENS.map((t) => (
            <div key={t.name} className="flex flex-col items-start gap-3">
              <div
                className={cn(
                  "size-24 rounded-md border border-border bg-card",
                  t.shadowClass,
                )}
              />
              <span className="font-mono text-xs text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Radius */}
      <Section
        kicker="03 · Foundation"
        title="Radius scale"
        note="Base radius is 0.625rem. The display surfaces lean sharp — most tactical cards use rounded-sm or rounded-md."
      >
        <div className="flex flex-wrap items-end gap-5">
          {RADIUS_TOKENS.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div className={cn("size-20 border border-border bg-card", r.class)} />
              <span className="font-mono text-xs text-muted-foreground">{r.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Type */}
      <Section
        kicker="04 · Type"
        title="Type specimens"
        note="Body & UI stay Figtree. Display tier is Figtree heavy + uppercase + wide tracking via the display utility."
      >
        <div className="flex flex-col gap-10">
          <figure className="flex flex-col gap-2">
            <span className="kicker">Kicker · kicker</span>
            <h3 className="display text-5xl leading-[0.9] sm:text-6xl">
              Display tier —<br />
              maldivian esports
            </h3>
            <figcaption className="font-mono text-xs text-muted-foreground">
              display · font-weight 800 · letter-spacing 0.04em · line-height 0.95 · uppercase
            </figcaption>
          </figure>

          <figure className="flex flex-col gap-2">
            <h3 className="text-3xl font-semibold tracking-tight">
              Section heading — Figtree semibold
            </h3>
            <figcaption className="font-mono text-xs text-muted-foreground">
              text-3xl · font-semibold · tracking-tight
            </figcaption>
          </figure>

          <figure className="flex flex-col gap-2">
            <p className="max-w-2xl text-base leading-relaxed">
              Body copy — Figtree at default weight. Optimised for paragraph reading at
              16px, line-height relaxed. Used for descriptions, schedule notes, match
              context, and most non-data text on tournament pages.
            </p>
            <figcaption className="font-mono text-xs text-muted-foreground">
              text-base · leading-relaxed
            </figcaption>
          </figure>

          <figure className="flex flex-col gap-2">
            <p className="font-mono text-sm text-muted-foreground">
              › data readout — Geist Mono · 14 live · 38 scheduled · 02:14:08 to start
            </p>
            <figcaption className="font-mono text-xs text-muted-foreground">
              font-mono · text-sm · for counts, timers, IDs, status lines
            </figcaption>
          </figure>

        </div>
      </Section>

      {/* Background utilities */}
      <Section
        kicker="05 · Backgrounds"
        title="Surface texture utilities"
        note="Stack as background-images on hero / featured surfaces. Default cards stay clean."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <BgTile label="hud-grid" className="hud-grid bg-background" />
          <BgTile label="hud-grid-fine" className="hud-grid-fine bg-background" />
          <BgTile label="hud-vignette" className="hud-vignette bg-background" />
          <BgTile
            label="hero stack · grid masked by vignette + glow"
            className="bg-background"
          >
            <div aria-hidden className="hud-grid mask-vignette absolute inset-0" />
            <div aria-hidden className="hud-vignette absolute inset-0" />
          </BgTile>
        </div>
      </Section>

      {/* Buttons */}
      <Section
        kicker="06 · Controls"
        title="Buttons (existing variants)"
        note="From components/ui/button.tsx. Pill-shaped by default — may add a tactical sharp variant in the next pass."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary CTA</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link style</Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg">Large</Button>
          <Button size="default">Default</Button>
          <Button size="sm">Small</Button>
          <Button size="xs">Extra small</Button>
        </div>
      </Section>

      {/* Slanted card preview — production uses live on the home page; this
          row is kept here only as a hover-state reference. */}
      <Section
        kicker="07 · Surfaces · preview"
        title="Slanted featured cards"
        note="Hover for the lift + glow Motion treatment. Production uses these on the home page games + tournaments grids."
      >
        <div className="rounded-md border border-border bg-card/40 px-6 py-12">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {SLANTED_CARDS.map((c) => (
              <SlantedCard key={c.title} title={c.title} tag={c.tag} />
            ))}
          </div>
        </div>
      </Section>

      {/* Site CTA buttons — separate from the existing shadcn Button (which
          stays as-is for admin/host/forms). These are the public-site CTAs. */}
      <Section
        kicker="08 · Controls · site CTAs"
        title="Slanted CTA buttons"
        note="Solid and outline variants, two sizes. Same -4° skew + Motion hover treatment as the cards for consistency. Renders as <button> by default or as <Link> when given an href."
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">Solid · sm + default + lg</span>
            <div className="flex flex-wrap items-center gap-6">
              <SlantedButton size="sm">View match</SlantedButton>
              <SlantedButton>Browse tournaments</SlantedButton>
              <SlantedButton size="lg">Create account</SlantedButton>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">Outline · sm + default + lg</span>
            <div className="flex flex-wrap items-center gap-6">
              <SlantedButton variant="outline" size="sm">Details</SlantedButton>
              <SlantedButton variant="outline">Watch live</SlantedButton>
              <SlantedButton variant="outline" size="lg">Host an event</SlantedButton>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">Hero pair · as Link (href passthrough)</span>
            <div className="flex flex-wrap items-center gap-6">
              <SlantedButton size="lg" href="/">Get started</SlantedButton>
              <SlantedButton variant="outline" size="lg" href="/">Sign in</SlantedButton>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">Disabled</span>
            <div className="flex flex-wrap items-center gap-6">
              <SlantedButton disabled>Disabled solid</SlantedButton>
              <SlantedButton variant="outline" disabled>Disabled outline</SlantedButton>
            </div>
          </div>
        </div>
      </Section>

      {/* Motion-vs-CSS benchmark — hover each row and decide if the Motion
          treatment is worth the JS, or if pure CSS `hover:*` utilities feel
          good enough. */}
      <Section
        kicker="09 · Benchmark"
        title="Motion vs CSS hover"
        note="Same skewX + lift + glow, two implementations. Motion uses spring + opacity-fade on a blurred halo div. CSS uses hover:-translate-y-* + hover:shadow-glow-* + transition. Hover each row and feel the difference."
      >
        <div className="flex flex-col gap-12">
          {/* Cards */}
          <div className="flex flex-col gap-5">
            <span className="font-mono text-xs text-muted-foreground">
              Cards · Motion (current production)
            </span>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {SLANTED_CARDS.map((c) => (
                <SlantedCard
                  key={`motion-${c.title}`}
                  title={c.title}
                  tag={c.tag}
                />
              ))}
            </div>
            <span className="mt-4 font-mono text-xs text-muted-foreground">
              Cards · CSS hover (benchmark) · layered halo +{" "}
              <code className="text-foreground/80">
                ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform
              </code>
            </span>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {SLANTED_CARDS.map((c) => (
                <SlantedCardCss
                  key={`css-${c.title}`}
                  title={c.title}
                  tag={c.tag}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-5">
            <span className="font-mono text-xs text-muted-foreground">
              Buttons · Motion (current production)
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <SlantedButton size="sm">View match</SlantedButton>
              <SlantedButton>Browse tournaments</SlantedButton>
              <SlantedButton variant="outline">Watch live</SlantedButton>
              <SlantedButton variant="outline" size="lg">
                Host an event
              </SlantedButton>
            </div>
            <span className="mt-4 font-mono text-xs text-muted-foreground">
              Buttons · CSS hover (benchmark) ·{" "}
              <code className="text-foreground/80">
                ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform
              </code>
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <SlantedButtonCss size="sm">View match</SlantedButtonCss>
              <SlantedButtonCss>Browse tournaments</SlantedButtonCss>
              <SlantedButtonCss variant="outline">Watch live</SlantedButtonCss>
              <SlantedButtonCss variant="outline" size="lg">
                Host an event
              </SlantedButtonCss>
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-border pt-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6">
          <span className="kicker">Next checkpoint</span>
          <p className="text-sm text-muted-foreground">
            Tactical/HUD/clipped surface variants · status indicators (live pulse,
            scheduled, complete) · motion presets (stagger, hover-lift, marquee,
            pointer-glow) · hero preview composing all of the above.
          </p>
        </div>
      </footer>
    </main>
  );
}

function BgTile({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "relative h-40 overflow-hidden rounded-md border border-border",
          className,
        )}
      >
        {children}
      </div>
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

const SLANTED_CARDS: ReadonlyArray<{ title: string; tag: string }> = [
  { title: "Valorant", tag: "FPS · 5v5" },
  { title: "MLBB", tag: "MOBA · 5v5" },
  { title: "PUBGM", tag: "BR · Squads" },
  { title: "EA FC", tag: "Sport · 1v1" },
];

// ---------------------------------------------------------------------------
// CSS-only benchmark variants — Tailwind hover:* utilities, no Motion.
// Used in Section 09 for the side-by-side feel comparison.
// ---------------------------------------------------------------------------

function SlantedCardCss({ title, tag }: { title: string; tag?: string }) {
  // Same architecture as the Motion version: a separate blurred halo behind
  // the card, opacity-faded on hover (cheap to paint). Lift uses a back-out
  // cubic-bezier that approximates Motion's spring overshoot. GPU-promoted
  // via will-change.
  return (
    <div className="group relative will-change-transform">
      {/* Glow halo — skewed to match the card's parallelogram. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 -skew-x-6 bg-primary/25 blur-xl opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
      />
      <div className="relative -skew-x-6 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1">
        <div className="corner-ticks relative aspect-[5/7] overflow-hidden border-2 border-primary/60 bg-background transition-colors duration-150 group-hover:border-primary">
          <div className="relative flex h-full skew-x-6 flex-col justify-between px-5 pt-2 pb-3">
            <div
              aria-hidden
              className="hud-grid-fine absolute inset-0 opacity-60"
            />
            <div className="relative translate-x-3">
              {tag ? <span className="kicker italic">{tag}</span> : null}
            </div>
            <div className="relative -translate-x-3">
              <h3 className="display text-2xl leading-[0.9]">{title}</h3>
              <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="inline-block size-1.5 rounded-full bg-primary" />
                <span>open</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlantedButtonCss({
  variant = "solid",
  size = "default",
  children,
}: {
  variant?: "solid" | "outline";
  size?: "sm" | "default" | "lg";
  children: React.ReactNode;
}) {
  const variantClasses =
    variant === "solid"
      ? "bg-primary text-primary-foreground group-hover:bg-primary-hover"
      : "border-2 border-primary text-primary bg-transparent group-hover:bg-primary/10";
  const sizeClasses =
    size === "sm"
      ? "h-10 px-6 text-sm"
      : size === "lg"
        ? "h-16 px-12 text-xl"
        : "h-14 px-10 text-lg";
  return (
    <button
      type="button"
      className="group inline-block transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform hover:-translate-y-0.5"
    >
      <span
        className={cn(
          "display relative inline-flex -skew-x-6 items-center justify-center transition-colors duration-100",
          variantClasses,
          sizeClasses,
        )}
      >
        <span className="inline-block skew-x-6">{children}</span>
      </span>
    </button>
  );
}
