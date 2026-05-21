import Link from "next/link";

import { SlantedCard } from "@/components/site/SlantedCard";
import { listGames } from "@/lib/api/games";
import type { Game } from "@/types/games";

const HOME_PREVIEW_LIMIT = 4;

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

export async function GamesGrid() {
  const games = (await listGames()).slice(0, HOME_PREVIEW_LIMIT);

  if (games.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <header className="mb-12 flex items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="kicker">Catalogue · Supported titles</span>
            <h2 className="display text-3xl sm:text-4xl">Games</h2>
          </div>
          <Link
            href="/games"
            className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            See all →
          </Link>
        </header>

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
      </div>
    </section>
  );
}
