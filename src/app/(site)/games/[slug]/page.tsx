import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { PageHero } from "@/components/site/PageHero";
import { SlantedButton } from "@/components/site/SlantedButton";
import { SlantedCard } from "@/components/site/SlantedCard";
import { ApiError } from "@/lib/api-client";
import { getGameBySlug } from "@/lib/api/games";
import { listTournaments } from "@/lib/api/tournaments";
import { GAME_GENRE_LABELS, type Game } from "@/types/games";
import {
  formatPrizePool,
  type Tournament,
} from "@/types/tournaments";
import { SiteFooter } from "../../_sections/SiteFooter";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

const COMPLETED_LIMIT = 4;

function isLive(t: Tournament): boolean {
  return (t.live_match_count ?? 0) > 0;
}

function statusLabelFor(t: Tournament): string {
  if (isLive(t)) return "Live now";
  if (t.status === "completed") return "Completed";
  if (t.status === "cancelled") return "Cancelled";
  return format(new Date(t.start_date), "MMM d");
}

function tagFor(t: Tournament): string {
  const ptype = t.participant_type === "team" ? "TEAM" : "PLAYER";
  return t.format_label ? `${ptype} · ${t.format_label}` : ptype;
}

function kickerFor(game: Game): string {
  const parts = ["Game · Catalogue"];
  if (game.genre) parts.push(GAME_GENRE_LABELS[game.genre]);
  return parts.join(" · ");
}

function fallbackSubtitleFor(game: Game): string {
  return `Tournaments hosted on MV Esports for ${game.name}. Schedules, brackets, and results — open by default.`;
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="kicker">{label}</span>
      <span
        className={`display text-5xl leading-none sm:text-6xl ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const g = await getGameBySlug(slug);
    return {
      title: `${g.name} · MV Esports`,
      description:
        g.description ??
        `Live and upcoming ${g.name} tournaments hosted on MV Esports.`,
    };
  } catch {
    return { title: "Game · MV Esports" };
  }
}

export default async function GameDetailPage({ params }: RouteProps) {
  const { slug } = await params;

  let game: Game;
  try {
    game = await getGameBySlug(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const tournaments = await listTournaments({ gameId: game.id });

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
  const completed = tournaments
    .filter((t) => t.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    )
    .slice(0, COMPLETED_LIMIT);

  const hasAnyTournaments = tournaments.length > 0;
  const liveCount = game.live_tournament_count ?? live.length;
  const upcomingCount = game.upcoming_tournament_count ?? upcoming.length;
  const totalCount = game.total_tournament_count ?? tournaments.length;

  // Compute total prize pool from completed + ongoing tournaments. Best-effort
  // (sums where backend has a prize pool object); useful as a "total awarded"
  // stat when present.
  const totalPrizePool = tournaments
    .map((t) => t.prize_pool)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .reduce<{ amount: number; currency: string } | null>((acc, p) => {
      if (!acc) return { amount: p.amount, currency: p.currency };
      if (acc.currency !== p.currency) return acc;
      return { amount: acc.amount + p.amount, currency: p.currency };
    }, null);

  return (
    <>
      <PageHero
        kicker={kickerFor(game)}
        title={game.name}
        subtitle={game.description ?? fallbackSubtitleFor(game)}
        backgroundImage={game.banner_url}
        actions={
          <>
            {hasAnyTournaments ? (
              <SlantedButton size="lg" href="#tournaments">
                View tournaments
              </SlantedButton>
            ) : null}
            <SlantedButton
              variant={hasAnyTournaments ? "outline" : "solid"}
              size="lg"
              href="/register?role=host"
            >
              Host an event
            </SlantedButton>
            {game.website_url ? (
              <Link
                href={game.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Official site →
              </Link>
            ) : null}
          </>
        }
      />

      {/* Stats strip */}
      <section className="border-t border-primary/30 bg-background py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Live now" value={liveCount} accent={liveCount > 0} />
            <Stat label="Upcoming" value={upcomingCount} />
            <Stat label="Total hosted" value={totalCount} />
            {totalPrizePool ? (
              <div className="flex flex-col gap-2">
                <span className="kicker">Prize pool total</span>
                <span className="display text-2xl leading-none text-foreground sm:text-3xl">
                  {formatPrizePool(totalPrizePool)}
                </span>
              </div>
            ) : null}
          </div>
          <p className="mt-10 max-w-xl font-mono text-xs text-muted-foreground">
            Hosting {game.name} since {format(new Date(game.created_at), "MMM yyyy")}
          </p>
        </div>
      </section>

      {/* Tournaments — anchor target for the hero CTA. */}
      {hasAnyTournaments ? (
        <div id="tournaments" className="scroll-mt-20">
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
                </header>
                <TournamentGrid items={live} />
              </div>
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
              <div className="mx-auto w-full max-w-6xl px-6">
                <header className="mb-10 flex flex-col gap-3">
                  <span className="kicker">Upcoming</span>
                  <h2 className="display text-3xl sm:text-4xl">
                    {upcoming.length} on the calendar
                  </h2>
                </header>
                <TournamentGrid items={upcoming} />
              </div>
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
              <div className="mx-auto w-full max-w-6xl px-6">
                <header className="mb-10 flex items-end justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="kicker">Recent results</span>
                    <h2 className="display text-3xl sm:text-4xl">Wrapped up</h2>
                  </div>
                  <Link
                    href={`/tournaments?game=${game.slug}`}
                    className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    See all →
                  </Link>
                </header>
                <TournamentGrid items={completed} />
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-col items-start gap-6 border border-dashed border-primary/40 bg-card/40 px-8 py-14">
              <span className="kicker">No tournaments yet</span>
              <h2 className="display text-3xl leading-tight sm:text-4xl">
                Be the first to host
                <br />
                {game.name} here.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                {game.name} is in the catalogue but no tournaments are scheduled
                yet. Apply for a host account and run the first one.
              </p>
              <div className="mt-2 flex flex-wrap gap-5">
                <SlantedButton href="/register?role=host">
                  Apply to host
                </SlantedButton>
                <SlantedButton variant="outline" href="/about">
                  Learn more
                </SlantedButton>
              </div>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </>
  );
}
