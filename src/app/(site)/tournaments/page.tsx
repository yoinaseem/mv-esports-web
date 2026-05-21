import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";

import { PageHero } from "@/components/site/PageHero";
import { SlantedCard } from "@/components/site/SlantedCard";
import { FilterableTournamentList } from "@/components/site/FilterableTournamentList";
import { listGames } from "@/lib/api/games";
import { listTournaments } from "@/lib/api/tournaments";
import type { Tournament } from "@/types/tournaments";
import { SiteFooter } from "../_sections/SiteFooter";

export const metadata: Metadata = {
  title: "Tournaments · MV Esports",
  description:
    "Live and upcoming tournaments across the Maldivian competitive scene — brackets, schedules, and registration.",
};

const HIGHLIGHT_LIMIT = 4;

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

function TournamentGrid({ items }: { items: ReadonlyArray<Tournament> }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((t) => (
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
  );
}

export default async function TournamentsPage() {
  const [tournaments, games] = await Promise.all([
    listTournaments(),
    listGames(),
  ]);

  const live = tournaments.filter(isLive);
  const upcoming = tournaments
    .filter(
      (t) =>
        !isLive(t) &&
        (t.status === "registration_open" ||
          t.status === "registration_closed"),
    )
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );

  return (
    <>
      <PageHero
        kicker="Tournaments · Live + upcoming"
        title="What's running."
        subtitle="Every tournament currently live or scheduled. Quick bands up top, full filterable list below."
      />

      {live.length > 0 ? (
        <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <header className="mb-10 flex items-end justify-between gap-6">
              <div className="flex flex-col gap-3">
                <span className="kicker inline-flex items-center gap-2">
                  <span className="relative inline-flex size-1.5 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
                    <span className="absolute inset-0 rounded-full bg-primary" />
                  </span>
                  Live now
                </span>
                <h2 className="display text-3xl sm:text-4xl">
                  {live.length} playing right now
                </h2>
              </div>
              <Link
                href="#all"
                className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                View all →
              </Link>
            </header>
            <TournamentGrid items={live.slice(0, HIGHLIGHT_LIMIT)} />
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <header className="mb-10 flex items-end justify-between gap-6">
              <div className="flex flex-col gap-3">
                <span className="kicker">Upcoming</span>
                <h2 className="display text-3xl sm:text-4xl">
                  {upcoming.length} on the calendar
                </h2>
              </div>
              <Link
                href="#all"
                className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                View all →
              </Link>
            </header>
            <TournamentGrid items={upcoming.slice(0, HIGHLIGHT_LIMIT)} />
          </div>
        </section>
      ) : null}

      <section
        id="all"
        className="scroll-mt-20 border-t border-primary/30 bg-background py-20 sm:py-28"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <header className="mb-10 flex flex-col gap-3">
            <span className="kicker">Browse all</span>
            <h2 className="display text-3xl sm:text-4xl">All tournaments</h2>
          </header>
          <FilterableTournamentList tournaments={tournaments} games={games} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
