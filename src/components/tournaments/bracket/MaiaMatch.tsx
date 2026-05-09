"use client";

import type {
  MatchComponentProps,
  ParticipantType,
} from "@g-loot/react-tournament-brackets";

import type { TournamentMatch } from "@/types/matches";
import { MatchInfoPopover } from "@/components/tournaments/bracket/MatchInfoPopover";

const BOX_HEIGHT = 72;

type PartyRowProps = {
  party: ParticipantType | undefined;
  won: boolean;
  hovered: boolean;
  matchComplete: boolean;
  showWinnerStyling: boolean;
  isFirst: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function PartyRow({
  party,
  won,
  hovered,
  matchComplete,
  showWinnerStyling,
  isFirst,
  onMouseEnter,
  onMouseLeave,
}: PartyRowProps) {
  const name = party?.name ?? "TBD";
  const result = party?.resultText;
  const isAbsent = !party?.id || party?.id?.toString().startsWith("tbd-");

  const winnerStyling = showWinnerStyling && won;
  const loserStyling = matchComplete && !won;

  let bgClass = "bg-card";
  let nameClass = "text-foreground";
  let scoreClass = "text-foreground";

  if (winnerStyling) {
    bgClass = "bg-primary";
    nameClass = "text-primary-foreground font-semibold";
    scoreClass = "text-primary-foreground font-bold";
  } else if (loserStyling) {
    nameClass = "text-muted-foreground";
    scoreClass = "text-muted-foreground";
  } else if (isAbsent) {
    nameClass = "text-muted-foreground italic";
  }

  if (hovered && !winnerStyling) {
    bgClass = "bg-muted";
  }

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex h-1/2 items-center justify-between gap-2 px-3 transition-colors ${
        isFirst ? "border-b border-border" : ""
      } ${bgClass}`}
    >
      <span className={`truncate text-sm ${nameClass}`}>{name}</span>
      {result !== null && result !== undefined ? (
        <span className={`tabular-nums text-sm ${scoreClass}`}>{result}</span>
      ) : null}
    </div>
  );
}

export function MaiaMatch({
  match,
  topParty,
  bottomParty,
  topWon,
  bottomWon,
  topHovered,
  bottomHovered,
  onMatchClick,
  onMouseEnter,
  onMouseLeave,
}: MatchComponentProps) {
  const matchComplete = match.state === "PLAYED" || match.state === "WALK_OVER";
  const showWinnerStyling = matchComplete;

  // The original TournamentMatch is stashed by the transform under
  // `tournamentMatch`. The lib's MatchType allows arbitrary keys so we
  // round-trip the full row through to here.
  const tournamentMatch = (match as unknown as { tournamentMatch?: TournamentMatch })
    .tournamentMatch;

  return (
    <div className="relative w-full" style={{ height: BOX_HEIGHT }}>
      <div
        className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(e: any) => onMatchClick?.({ match, topWon, bottomWon, event: e })}
      >
        <PartyRow
          isFirst
          party={topParty}
          won={topWon}
          hovered={topHovered}
          matchComplete={matchComplete}
          showWinnerStyling={showWinnerStyling}
          onMouseEnter={() => topParty?.id != null && onMouseEnter?.(topParty.id)}
          onMouseLeave={() => onMouseLeave?.()}
        />
        <PartyRow
          isFirst={false}
          party={bottomParty}
          won={bottomWon}
          hovered={bottomHovered}
          matchComplete={matchComplete}
          showWinnerStyling={showWinnerStyling}
          onMouseEnter={() => bottomParty?.id != null && onMouseEnter?.(bottomParty.id)}
          onMouseLeave={() => onMouseLeave?.()}
        />
      </div>

      {/* Info popover trigger floats over the divider. pointer-events-none on
          the wrapper lets clicks fall through to the match card; pointer-
          events-auto on the icon catches the targeted click. */}
      {tournamentMatch ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <MatchInfoPopover match={tournamentMatch} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
