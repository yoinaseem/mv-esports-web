"use client";

import { useEffect, useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

import { listMatchGames } from "@/lib/api/match-games";
import {
  isMatchTerminal,
  type MatchGame,
  type TournamentMatch,
} from "@/types/matches";
import { participantDisplayName } from "@/types/participants";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<TournamentMatch["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  walkover: "Walkover",
  conditional: "Conditional",
  cancelled: "Cancelled",
};

const BRACKET_TYPE_LABELS: Record<string, string> = {
  winners: "Winners bracket",
  losers: "Losers bracket",
  grand_final: "Grand final",
  group: "Group stage",
};

function statusBadgeVariant(status: TournamentMatch["status"]): "default" | "outline" | "secondary" | "destructive" {
  if (status === "scheduled" || status === "in_progress") return "default";
  if (status === "completed" || status === "walkover") return "outline";
  if (status === "cancelled") return "destructive";
  return "secondary";
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return dateTimeFormatter.format(new Date(iso));
}

type Props = {
  match: TournamentMatch;
};

type GameRowProps = {
  gameNumber: number;
  game: MatchGame | null;
  match: TournamentMatch;
  aName: string;
  bName: string;
};

function GameRow({ gameNumber, game, match, aName, bName }: GameRowProps) {
  const aScore = game?.score_a;
  const bScore = game?.score_b;
  const winnerIsA =
    game !== null &&
    game.winner_participant_id != null &&
    game.winner_participant_id === match.participant_a_id &&
    game.winner_participant_type === match.participant_a_type;
  const winnerIsB =
    game !== null &&
    game.winner_participant_id != null &&
    game.winner_participant_id === match.participant_b_id &&
    game.winner_participant_type === match.participant_b_type;
  const isDrawGame = game !== null && game.winner_participant_id == null;
  const unplayed = game === null;

  const aNameClass = unplayed
    ? "text-muted-foreground"
    : winnerIsA
      ? "text-primary font-semibold"
      : "text-foreground";
  const bNameClass = unplayed
    ? "text-muted-foreground"
    : winnerIsB
      ? "text-primary font-semibold"
      : "text-foreground";
  const aScoreClass = unplayed
    ? "text-muted-foreground"
    : winnerIsA
      ? "text-primary font-bold"
      : "text-foreground";
  const bScoreClass = unplayed
    ? "text-muted-foreground"
    : winnerIsB
      ? "text-primary font-bold"
      : "text-foreground";

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_1fr] items-center gap-2 text-xs">
      <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        G{gameNumber}
      </span>
      <span className={`truncate text-right ${aNameClass}`}>{aName}</span>
      <span className={`tabular-nums ${aScoreClass}`}>{aScore ?? "—"}</span>
      <span className="text-muted-foreground">|</span>
      <span className={`tabular-nums ${bScoreClass}`}>{bScore ?? "—"}</span>
      <span className={`truncate ${bNameClass}`}>
        {bName}
        {isDrawGame ? (
          <span className="ml-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            · draw
          </span>
        ) : null}
      </span>
    </div>
  );
}

// Click trigger sits on the match-card divider. Popover lazy-loads match
// games on open. Public-safe — only data already exposed by the matches /
// match-games endpoints (both publicly readable) is surfaced here.
export function MatchInfoPopover({ match }: Props) {
  const bracketLabel = BRACKET_TYPE_LABELS[match.bracket_type] ?? match.bracket_type;

  const [open, setOpen] = useState(false);
  const [games, setGames] = useState<MatchGame[] | null>(null);
  const [error, setError] = useState("");
  const [loading, startLoadTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    startLoadTransition(async () => {
      try {
        const list = await listMatchGames(match.id);
        if (cancelled) return;
        setGames(list.slice().sort((a, b) => a.game_number - b.game_number));
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load match games.");
      }
    });
    return () => {
      cancelled = true;
    };
    // Refetch each time the popover opens — host may have just recorded a
    // game from the score dialog, and we want fresh data here. Keyed on
    // match.id so different matches don't share a stale cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, match.id]);

  const aName = participantDisplayName(match.participant_a ?? null);
  const bName = participantDisplayName(match.participant_b ?? null);
  const matchTerminal = isMatchTerminal(match.status);

  // Slot computation: terminal matches show only games that exist (the
  // remaining ones never happened — series ended early). Non-terminal
  // matches show all best_of slots so the host sees what's still to play.
  const sortedGames = (games ?? []).slice().sort((a, b) => a.game_number - b.game_number);
  const slots: Array<{ gameNumber: number; game: MatchGame | null }> = [];
  if (matchTerminal) {
    for (const g of sortedGames) {
      slots.push({ gameNumber: g.game_number, game: g });
    }
  } else {
    for (let i = 1; i <= match.best_of; i++) {
      const g = sortedGames.find((x) => x.game_number === i) ?? null;
      slots.push({ gameNumber: i, game: g });
    }
  }

  // Series tally — count games each side won (skip drawn games).
  const seriesA = sortedGames.filter(
    (g) =>
      g.winner_participant_id === match.participant_a_id &&
      g.winner_participant_type === match.participant_a_type,
  ).length;
  const seriesB = sortedGames.filter(
    (g) =>
      g.winner_participant_id === match.participant_b_id &&
      g.winner_participant_type === match.participant_b_type,
  ).length;
  const winsToTake = Math.floor(match.best_of / 2) + 1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Match details"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex size-6 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:text-primary"
        >
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        className="w-80 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-sm font-semibold">
              {bracketLabel} · Round {match.bracket_round}
            </p>
            <Badge variant={statusBadgeVariant(match.status)}>
              {STATUS_LABELS[match.status]}
            </Badge>
          </div>

          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
              Series
            </p>
            <div className="mt-1 flex items-center justify-between gap-2 text-sm">
              <span className={`flex-1 truncate text-right ${seriesA > seriesB ? "font-semibold text-primary" : ""}`}>
                {aName}
              </span>
              <span className="tabular-nums font-semibold">
                {seriesA} <span className="text-muted-foreground">—</span> {seriesB}
              </span>
              <span className={`flex-1 truncate ${seriesB > seriesA ? "font-semibold text-primary" : ""}`}>
                {bName}
              </span>
            </div>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              First to {winsToTake} (best of {match.best_of})
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
            Games
          </p>
          {loading && games === null ? (
            <div className="space-y-2">
              {Array.from({ length: match.best_of }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : match.status === "walkover" && sortedGames.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Forfeited — winner declared without play.
            </p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No games recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {slots.map((slot) => (
                <GameRow
                  key={slot.gameNumber}
                  gameNumber={slot.gameNumber}
                  game={slot.game}
                  match={match}
                  aName={aName}
                  bName={bName}
                />
              ))}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-3 text-[0.7rem]">
          <dt className="text-muted-foreground">Position</dt>
          <dd>#{match.bracket_position + 1}</dd>

          {match.group_number != null ? (
            <>
              <dt className="text-muted-foreground">Group</dt>
              <dd>{match.group_number}</dd>
            </>
          ) : null}

          <dt className="text-muted-foreground">Scheduled</dt>
          <dd>{formatDateTime(match.scheduled_at)}</dd>

          <dt className="text-muted-foreground">Completed</dt>
          <dd>{formatDateTime(match.completed_at)}</dd>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
