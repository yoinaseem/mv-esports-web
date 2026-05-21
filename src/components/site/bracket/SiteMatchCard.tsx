"use client";

import { cn } from "@/lib/utils";
import { isMatchTerminal, type TournamentMatch } from "@/types/matches";
import { participantDisplayName, type Participant } from "@/types/participants";
import { MatchInfoPopover } from "@/components/tournaments/bracket/MatchInfoPopover";
import { participantKey } from "./helpers";

export const SITE_MATCH_HEIGHT = 84;

type PartyRowProps = {
  party: Participant | null | undefined;
  participantTypeForKey: string | null | undefined;
  participantIdForKey: number | null | undefined;
  score: number | null;
  isWinner: boolean;
  matchComplete: boolean;
  isFirst: boolean;
  hoveredParticipantKey: string | null;
  onParticipantHover?: (key: string | null) => void;
  // Replaces "TBD" when the slot is empty — e.g. LB "Loser of WB QF #1".
  fallbackLabel?: string;
};

function PartyRow({
  party,
  participantTypeForKey,
  participantIdForKey,
  score,
  isWinner,
  matchComplete,
  isFirst,
  hoveredParticipantKey,
  onParticipantHover,
  fallbackLabel,
}: PartyRowProps) {
  const isAbsent = !party;
  const name = party ? participantDisplayName(party) : (fallbackLabel ?? "TBD");

  const ownKey = participantKey(participantTypeForKey, participantIdForKey);
  const isHovered = ownKey != null && ownKey === hoveredParticipantKey;

  const winnerStyling = matchComplete && isWinner;
  const loserStyling = matchComplete && !isWinner;

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

  // Cross-bracket name match (same participant in another card hovered).
  if (isHovered && !winnerStyling && !isAbsent) {
    bgClass = "bg-muted";
  }

  const handleMouseEnter = () => {
    if (!onParticipantHover) return;
    if (ownKey) onParticipantHover(ownKey);
  };
  const handleMouseLeave = () => {
    if (!onParticipantHover) return;
    onParticipantHover(null);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "flex h-1/2 items-center justify-between gap-2 px-3 transition-colors",
        isFirst ? "border-b border-border" : "",
        bgClass,
      )}
    >
      <span className={cn("truncate text-sm", nameClass)}>{name}</span>
      {score !== null && !isAbsent ? (
        <span className={cn("tabular-nums text-sm", scoreClass)}>{score}</span>
      ) : null}
    </div>
  );
}

type SiteMatchCardProps = {
  match: TournamentMatch;
  onClick?: (match: TournamentMatch) => void;
  className?: string;
  hoveredParticipantKey?: string | null;
  onParticipantHover?: (key: string | null) => void;
  onMatchHover?: (matchId: number | null) => void;
  topSlotLabel?: string;
  bottomSlotLabel?: string;
};

export function SiteMatchCard({
  match,
  onClick,
  className,
  hoveredParticipantKey = null,
  onParticipantHover,
  onMatchHover,
  topSlotLabel,
  bottomSlotLabel,
}: SiteMatchCardProps) {
  const matchComplete = isMatchTerminal(match.status);

  const winnerIsA =
    match.winner_participant_id != null &&
    match.winner_participant_id === match.participant_a_id &&
    match.winner_participant_type === match.participant_a_type;
  const winnerIsB =
    match.winner_participant_id != null &&
    match.winner_participant_id === match.participant_b_id &&
    match.winner_participant_type === match.participant_b_type;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ height: SITE_MATCH_HEIGHT }}
      onMouseEnter={onMatchHover ? () => onMatchHover(match.id) : undefined}
      onMouseLeave={onMatchHover ? () => onMatchHover(null) : undefined}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm transition-colors",
          onClick && "cursor-pointer hover:border-primary/60",
        )}
        onClick={onClick ? () => onClick(match) : undefined}
      >
        <PartyRow
          isFirst
          party={match.participant_a ?? null}
          participantTypeForKey={match.participant_a_type}
          participantIdForKey={match.participant_a_id}
          score={match.participant_a ? match.score_a : null}
          isWinner={winnerIsA}
          matchComplete={matchComplete}
          hoveredParticipantKey={hoveredParticipantKey}
          onParticipantHover={onParticipantHover}
          fallbackLabel={topSlotLabel}
        />
        <PartyRow
          isFirst={false}
          party={match.participant_b ?? null}
          participantTypeForKey={match.participant_b_type}
          participantIdForKey={match.participant_b_id}
          score={match.participant_b ? match.score_b : null}
          isWinner={winnerIsB}
          matchComplete={matchComplete}
          hoveredParticipantKey={hoveredParticipantKey}
          onParticipantHover={onParticipantHover}
          fallbackLabel={bottomSlotLabel}
        />
      </div>

      {/* pointer-events: card clicks pass through the wrapper; the icon
          catches its own. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto">
          <MatchInfoPopover match={match} />
        </div>
      </div>
    </div>
  );
}
