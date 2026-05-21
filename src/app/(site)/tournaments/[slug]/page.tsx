import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { SlantedButton } from "@/components/site/SlantedButton";
import { StageView } from "@/components/tournaments/bracket/StageView";
import { ApiError } from "@/lib/api-client";
import { listMatches } from "@/lib/api/matches";
import { listStages } from "@/lib/api/stages";
import { getTournamentBySlug } from "@/lib/api/tournaments";
import type { TournamentMatch } from "@/types/matches";
import {
  formatPrizePool,
  type Tournament,
  type TournamentStatus,
} from "@/types/tournaments";
import { SiteFooter } from "../../_sections/SiteFooter";
import { TournamentHero } from "./_components/TournamentHero";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

function isLive(t: Tournament): boolean {
  return (t.live_match_count ?? 0) > 0;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, yyyy");
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d · HH:mm");
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const t = await getTournamentBySlug(slug);
    return {
      title: `${t.name} · MV Esports`,
      description:
        t.description ??
        `${t.game?.name ?? "Tournament"} bracket, schedule, and results.`,
    };
  } catch {
    return { title: "Tournament · MV Esports" };
  }
}

type InfoRow = { kicker: string; value: string };

function infoRowsFor(t: Tournament): ReadonlyArray<InfoRow> {
  const rows: InfoRow[] = [];
  rows.push({ kicker: "Starts", value: formatDate(t.start_date) });
  if (t.end_date && t.end_date !== t.start_date) {
    rows.push({ kicker: "Ends", value: formatDate(t.end_date) });
  }
  rows.push({
    kicker: "Participants",
    value: t.max_participants
      ? `${t.registrations_count ?? 0} / ${t.max_participants}`
      : `${t.registrations_count ?? 0}`,
  });
  rows.push({
    kicker: "Type",
    value: t.participant_type === "team" ? "Teams" : "Solo players",
  });
  if (t.format_label) {
    rows.push({ kicker: "Format", value: t.format_label });
  }
  const prize = formatPrizePool(t.prize_pool);
  if (prize) {
    rows.push({ kicker: "Prize pool", value: prize });
  }
  if (t.host?.display_name) {
    rows.push({ kicker: "Hosted by", value: t.host.display_name });
  }
  if (
    t.status === "registration_open" &&
    t.registration_closes_at
  ) {
    rows.push({
      kicker: "Registration closes",
      value: formatDateTime(t.registration_closes_at),
    });
  }
  if (isLive(t)) {
    rows.push({
      kicker: "Live matches",
      value: `${t.live_match_count ?? 0} playing now`,
    });
  }
  return rows;
}

const REGISTRATION_TYPE_LABELS: Record<string, string> = {
  open: "Open registration",
  invite_only: "Invite-only",
  signed_only: "Signed players only",
};

const STAGE_PENDING_STATUSES: ReadonlyArray<TournamentStatus> = [
  "registration_open",
  "registration_closed",
];

export default async function TournamentDetailPage({ params }: RouteProps) {
  const { slug } = await params;

  let tournament: Tournament;
  try {
    tournament = await getTournamentBySlug(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const stages = (await listStages(tournament.id)).slice().sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  // Pull matches for any stage that's past "pending" (bracket built). For
  // pre-build statuses we skip the fetch entirely — the bracket section
  // shows a placeholder instead.
  const stagesWithMatches = stages.filter((s) => s.status !== "pending");
  const matchPairs = await Promise.all(
    stagesWithMatches.map((s) =>
      listMatches(tournament.id, s.id).then(
        (matches) => [s.id, matches] as const,
      ),
    ),
  );
  const matchesByStageId: Record<number, TournamentMatch[]> =
    Object.fromEntries(matchPairs);

  const rows = infoRowsFor(tournament);
  const bracketPending = STAGE_PENDING_STATUSES.includes(tournament.status);
  const hasAnyMatches = Object.values(matchesByStageId).some(
    (list) => list.length > 0,
  );
  // Render the bracket section only when there's an actual bracket to show.
  // Pre-build / no stages / no matches all hide the section entirely rather
  // than showing a placeholder — the hero's status badge already conveys the
  // tournament state, and an empty placeholder mid-page is just noise.
  const showBracket = !bracketPending && stages.length > 0 && hasAnyMatches;

  return (
    <>
      <TournamentHero tournament={tournament} />

      {/* Bracket — placed above the stats so it gets immediate eye when it
          exists. Hidden entirely when no bracket is built yet. */}
      {showBracket ? (
        <section
          id="bracket"
          className="scroll-mt-20 border-t border-primary/30 bg-background py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <header className="mb-10 flex flex-col gap-3">
              <span className="kicker">Bracket</span>
              <h2 className="display text-3xl sm:text-4xl">
                {stages.length > 1 ? "Stages" : "Knockout"}
              </h2>
            </header>

            <div className="flex flex-col gap-12">
              {stages.map((stage) => {
                const stageMatches = matchesByStageId[stage.id] ?? [];
                if (stage.status === "pending" || stageMatches.length === 0) {
                  return null;
                }
                return (
                  <div key={stage.id} className="flex flex-col gap-4">
                    {stages.length > 1 ? (
                      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/30 pb-3">
                        <h3 className="display text-xl sm:text-2xl">
                          {stage.name}
                        </h3>
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          {stage.format.replace("_", " ")} ·{" "}
                          {stage.status.replace("_", " ")}
                        </span>
                      </div>
                    ) : null}
                    <StageView
                      stage={stage}
                      matches={stageMatches}
                      size="large"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Info strip */}
      <section className="border-t border-primary/30 bg-background py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((row) => (
              <div key={row.kicker} className="flex flex-col gap-2">
                <span className="kicker">{row.kicker}</span>
                <span className="display text-2xl leading-none sm:text-3xl">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-2xl font-mono text-xs text-muted-foreground">
            {REGISTRATION_TYPE_LABELS[tournament.registration_type] ??
              tournament.registration_type}
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-primary/30 bg-background py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6">
          <span className="kicker">Browse more</span>
          <h2 className="display text-3xl sm:text-4xl">
            More tournaments running.
          </h2>
          <div className="mt-2 flex flex-wrap gap-5">
            <SlantedButton href="/tournaments">All tournaments</SlantedButton>
            {tournament.game?.slug ? (
              <SlantedButton variant="outline" href={`/games/${tournament.game.slug}`}>
                More {tournament.game.name}
              </SlantedButton>
            ) : null}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
