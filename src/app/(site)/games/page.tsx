import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/PageHero";
import { SlantedButton } from "@/components/site/SlantedButton";
import { SlantedCard } from "@/components/site/SlantedCard";
import { listGames } from "@/lib/api/games";
import type { Game } from "@/types/games";
import { SiteFooter } from "../_sections/SiteFooter";

export const metadata: Metadata = {
  title: "Games · MV Esports",
  description:
    "Every game MV Esports runs tournaments for — current live and upcoming activity per title.",
};

// Renders only when backend ships the denormalised count fields. Until then,
// the card just shows the title — no fake "open for tournaments" pretending.
function statusLabelFor(g: Game): string | undefined {
  if (
    g.live_tournament_count === undefined &&
    g.upcoming_tournament_count === undefined
  ) {
    return undefined;
  }
  const live = g.live_tournament_count ?? 0;
  const upcoming = g.upcoming_tournament_count ?? 0;
  if (live > 0) return `${live} live · ${upcoming} upcoming`;
  if (upcoming > 0) return `${upcoming} upcoming`;
  return "Open for tournaments";
}

export default async function GamesPage() {
  const games = await listGames();

  return (
    <>
      <PageHero
        kicker="Catalogue · Supported titles"
        title="Games we host."
        subtitle="Every game we run tournaments for, with current live and upcoming activity. Don't see yours? Submit it below — new titles are reviewed in days."
      />

      <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          {games.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {games.map((g) => (
                <Link
                  key={g.id}
                  href={`/games/${g.slug}`}
                  className="block focus-visible:outline-none"
                >
                  <SlantedCard
                    title={g.name}
                    statusLabel={statusLabelFor(g)}
                    live={(g.live_tournament_count ?? 0) > 0}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                No games yet — check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6">
          <span className="kicker">Add a game</span>
          <h2 className="display text-3xl sm:text-4xl">Want your game added?</h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            We add games when there&apos;s a host willing to run a tournament for
            them. Email us with the title, expected format, and rough player
            count and we&apos;ll get back to you within a couple of days.
          </p>
          <div className="mt-2">
            <SlantedButton href="mailto:hello@mvesports.mv?subject=Game%20submission">
              Submit a game
            </SlantedButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
