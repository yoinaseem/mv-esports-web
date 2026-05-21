"use client";

import type { TournamentMatch } from "@/types/matches";
import { StandaloneMatchCard } from "@/components/tournaments/bracket/StandaloneMatchCard";
import { SiteMatchCard } from "./SiteMatchCard";
import { Connector } from "./Connector";
import {
  halfSiblingExpr,
  marginTopExpr,
  roundLabel,
  winnerKeyOf,
} from "./helpers";

type WinnersBracketSectionProps = {
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  hoveredKey: string | null;
  onParticipantHover: (key: string | null) => void;
  hoveredMatchId: number | null;
  onMatchHover: (matchId: number | null) => void;
  ancestorMap: Map<number, Set<number>>;
  labelPrefix?: string;
  sectionLabel?: string | null;
  // SE-only: scan for the 3rd-place match (target of a
  // loser_advances_to_match_id pointer) and render it separately.
  detectThirdPlace?: boolean;
};

function MatchSlot({
  match,
  round,
  totalRounds,
  positionInRound,
  onMatchClick,
  hoveredKey,
  onParticipantHover,
  hoveredMatchId,
  onMatchHover,
  ancestorMap,
}: {
  match: TournamentMatch;
  round: number;
  totalRounds: number;
  positionInRound: number;
  onMatchClick?: (match: TournamentMatch) => void;
  hoveredKey: string | null;
  onParticipantHover: (key: string | null) => void;
  hoveredMatchId: number | null;
  onMatchHover: (matchId: number | null) => void;
  ancestorMap: Map<number, Set<number>>;
}) {
  const isFinalRound = round === totalRounds;
  const isTopChild = positionInRound % 2 === 0;

  const winnerKey = winnerKeyOf(match);
  const isWinnerHovered = hoveredKey != null && winnerKey === hoveredKey;
  const isInAncestorChain =
    hoveredMatchId != null &&
    (ancestorMap.get(hoveredMatchId)?.has(match.id) ?? false);
  const connectorActive =
    !isFinalRound && (isWinnerHovered || isInAncestorChain);

  const style: React.CSSProperties = {
    marginTop: marginTopExpr(round, positionInRound),
    height: "var(--bracket-match-height)",
    width: "var(--bracket-col-width)",
    // Sibling seg3s overlap at the parent meeting-point Y; lift the active
    // slot so its SVG paints above the sibling's gray.
    position: "relative",
    zIndex: connectorActive ? 2 : 1,
  };
  if (!isFinalRound) {
    (style as Record<string, string>)["--bracket-half-sibling"] =
      halfSiblingExpr(round);
  }

  return (
    <div className="site-bracket-match" style={style}>
      <SiteMatchCard
        match={match}
        onClick={onMatchClick}
        hoveredParticipantKey={hoveredKey}
        onParticipantHover={onParticipantHover}
        onMatchHover={onMatchHover}
      />
      {!isFinalRound ? (
        <Connector
          variant="pair-up"
          isTopChild={isTopChild}
          isActive={connectorActive}
          bracketType="wb"
          round={round}
        />
      ) : null}
    </div>
  );
}

function RoundColumn({
  round,
  totalRounds,
  matches,
  onMatchClick,
  hoveredKey,
  onParticipantHover,
  hoveredMatchId,
  onMatchHover,
  ancestorMap,
  labelPrefix,
}: {
  round: number;
  totalRounds: number;
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  hoveredKey: string | null;
  onParticipantHover: (key: string | null) => void;
  hoveredMatchId: number | null;
  onMatchHover: (matchId: number | null) => void;
  ancestorMap: Map<number, Set<number>>;
  labelPrefix: string;
}) {
  const sorted = [...matches].sort(
    (a, b) => a.bracket_position - b.bracket_position,
  );

  return (
    <div
      className="flex flex-shrink-0 flex-col"
      style={{ width: "var(--bracket-col-width)" }}
    >
      <div className="mb-4 flex items-center justify-center">
        <span className="kicker">
          {roundLabel(round, totalRounds, labelPrefix)}
        </span>
      </div>
      <div className="flex flex-col">
        {sorted.map((match, idx) => (
          <MatchSlot
            key={match.id}
            match={match}
            round={round}
            totalRounds={totalRounds}
            positionInRound={idx}
            onMatchClick={onMatchClick}
            hoveredKey={hoveredKey}
            onParticipantHover={onParticipantHover}
            hoveredMatchId={hoveredMatchId}
            onMatchHover={onMatchHover}
            ancestorMap={ancestorMap}
          />
        ))}
      </div>
    </div>
  );
}

export function WinnersBracketSection({
  matches,
  onMatchClick,
  hoveredKey,
  onParticipantHover,
  hoveredMatchId,
  onMatchHover,
  ancestorMap,
  labelPrefix = "",
  sectionLabel = null,
  detectThirdPlace = false,
}: WinnersBracketSectionProps) {
  // 3rd-place match isn't on the final's winner chain; find it by being
  // the target of any loser_advances pointer.
  let thirdPlaceMatch: TournamentMatch | null = null;
  let mainBracket: ReadonlyArray<TournamentMatch> = matches;
  if (detectThirdPlace) {
    const thirdPlaceTargetIds = new Set<number>();
    for (const m of matches) {
      if (m.loser_advances_to_match_id != null) {
        thirdPlaceTargetIds.add(m.loser_advances_to_match_id);
      }
    }
    thirdPlaceMatch =
      matches.find((m) => thirdPlaceTargetIds.has(m.id)) ?? null;
    mainBracket = thirdPlaceMatch
      ? matches.filter((m) => m.id !== thirdPlaceMatch!.id)
      : matches;
  }

  if (mainBracket.length === 0) {
    return null;
  }

  const totalRounds = Math.max(...mainBracket.map((m) => m.bracket_round));

  const matchesByRound: TournamentMatch[][] = Array.from(
    { length: totalRounds },
    () => [],
  );
  for (const m of mainBracket) {
    const idx = m.bracket_round - 1;
    if (idx >= 0 && idx < totalRounds) {
      matchesByRound[idx].push(m);
    }
  }

  return (
    <>
      {sectionLabel ? (
        <div className="mb-6">
          <span className="kicker">{sectionLabel}</span>
        </div>
      ) : null}
      <div className="site-scrollbar overflow-x-auto pb-6">
        <div
          className="flex items-start"
          style={{ gap: "var(--bracket-col-gap)" }}
        >
          {matchesByRound.map((roundMatches, roundIdx) => (
            <RoundColumn
              key={roundIdx}
              round={roundIdx + 1}
              totalRounds={totalRounds}
              matches={roundMatches}
              onMatchClick={onMatchClick}
              hoveredKey={hoveredKey}
              onParticipantHover={onParticipantHover}
              hoveredMatchId={hoveredMatchId}
              onMatchHover={onMatchHover}
              ancestorMap={ancestorMap}
              labelPrefix={labelPrefix}
            />
          ))}
        </div>
      </div>

      {thirdPlaceMatch ? (
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-primary/30 pt-6">
          <span className="kicker">Third place match</span>
          <StandaloneMatchCard
            match={thirdPlaceMatch}
            onClick={
              onMatchClick ? () => onMatchClick(thirdPlaceMatch!) : undefined
            }
          />
        </div>
      ) : null}
    </>
  );
}
