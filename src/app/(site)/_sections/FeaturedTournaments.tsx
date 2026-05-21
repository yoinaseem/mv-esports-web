import Link from "next/link";
import { format } from "date-fns";

import { SlantedCard } from "@/components/site/SlantedCard";
import { listTournaments } from "@/lib/api/tournaments";
import type { Tournament } from "@/types/tournaments";

const FEATURED_LIMIT = 4;

function isLive(t: Tournament): boolean {
  return (t.live_match_count ?? 0) > 0;
}

function statusLabelFor(t: Tournament): string {
  if (isLive(t)) return "Live now";
  if (t.status === "completed") return "Completed";
  if (t.status === "cancelled") return "Cancelled";
  return format(new Date(t.start_date), "MMM d");
}

function tagFor(t: Tournament): string | undefined {
  const game = t.game?.name;
  const ptype = t.participant_type === "team" ? "TEAM" : "PLAYER";
  if (!game) return ptype;
  return `${game} · ${ptype}`;
}

// Algorithmic "featured" — live tournaments first, then registration-open
// sorted by start date. Take the top N.
function featuredOrder(t: Tournament): number {
  if (isLive(t)) return 0;
  if (
    t.status === "registration_open" ||
    t.status === "registration_closed"
  ) {
    return 1;
  }
  if (t.status === "in_progress") return 2;
  return 3;
}

export async function FeaturedTournaments() {
  const all = await listTournaments();

  const featured = [...all]
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => {
      const aOrder = featuredOrder(a);
      const bOrder = featuredOrder(b);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    })
    .slice(0, FEATURED_LIMIT);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <header className="mb-12 flex items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="kicker">Featured · Live + upcoming</span>
            <h2 className="display text-3xl sm:text-4xl">Tournaments</h2>
          </div>
          <Link
            href="/tournaments"
            className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            See all →
          </Link>
        </header>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.slug}`}
              className="block focus-visible:outline-none"
            >
              <SlantedCard
                title={t.name}
                tag={tagFor(t)}
                statusLabel={statusLabelFor(t)}
                live={isLive(t)}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
