"use client";

import { isMatchTerminal, type TournamentMatch } from "@/types/matches";
import { participantDisplayName } from "@/types/participants";
import { MatchInfoPopover } from "@/components/tournaments/bracket/MatchInfoPopover";

type Props = {
  match: TournamentMatch;
  onClick?: () => void;
};

// Single-match card rendered outside the bracket library — used for the
// 3rd-place match (which the lib's nextMatchId-walker doesn't reach since
// it's not on the final's chain) and any other one-off display.
export function StandaloneMatchCard({ match, onClick }: Props) {
  const matchComplete = isMatchTerminal(match.status);

  const aName = participantDisplayName(match.participant_a ?? null);
  const bName = participantDisplayName(match.participant_b ?? null);
  const aPresent = match.participant_a_id != null;
  const bPresent = match.participant_b_id != null;

  const winnerIsA =
    match.winner_participant_id != null &&
    match.winner_participant_id === match.participant_a_id &&
    match.winner_participant_type === match.participant_a_type;
  const winnerIsB =
    match.winner_participant_id != null &&
    match.winner_participant_id === match.participant_b_id &&
    match.winner_participant_type === match.participant_b_type;

  const row = (won: boolean, name: string, score: number, present: boolean, isFirst: boolean) => {
    const showWinnerStyling = matchComplete && won;
    const showLoserStyling = matchComplete && !won;
    let bg = "bg-card";
    let nameClass = "text-foreground";
    let scoreClass = "text-foreground";
    if (showWinnerStyling) {
      bg = "bg-primary";
      nameClass = "text-primary-foreground font-semibold";
      scoreClass = "text-primary-foreground font-bold";
    } else if (showLoserStyling) {
      nameClass = "text-muted-foreground";
      scoreClass = "text-muted-foreground";
    } else if (!present) {
      nameClass = "text-muted-foreground italic";
    }
    return (
      <div
        className={`flex h-9 items-center justify-between gap-2 px-3 ${
          isFirst ? "border-b border-border" : ""
        } ${bg}`}
      >
        <span className={`truncate text-sm ${nameClass}`}>{name}</span>
        {present ? (
          <span className={`tabular-nums text-sm ${scoreClass}`}>{score}</span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="relative w-60">
      <div
        className="flex w-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm"
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {row(winnerIsA, aName, match.score_a, aPresent, true)}
        {row(winnerIsB, bName, match.score_b, bPresent, false)}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto">
          <MatchInfoPopover match={match} />
        </div>
      </div>
    </div>
  );
}
