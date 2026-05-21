"use client";

import type { TournamentMatch } from "@/types/matches";
import { SiteMatchCard } from "./SiteMatchCard";
import { Connector } from "./Connector";
import {
  lbConnectorVariant,
  lbHalfSiblingExpr,
  lbMarginTopExpr,
  lbRoundLabel,
  winnerKeyOf,
  type DropInLabels,
} from "./helpers";

type LosersBracketSectionProps = {
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  hoveredKey: string | null;
  onParticipantHover: (key: string | null) => void;
  hoveredMatchId: number | null;
  onMatchHover: (matchId: number | null) => void;
  ancestorMap: Map<number, Set<number>>;
  dropInLabels: Map<number, DropInLabels>;
};

function LbMatchSlot({
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
  slotLabels,
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
  slotLabels?: DropInLabels;
}) {
  const variant = lbConnectorVariant(round, totalRounds);
  // Pair-up only: even position → top, odd → bottom of the parent.
  const isTopChild = positionInRound % 2 === 0;

  const winnerKey = winnerKeyOf(match);
  const isWinnerHovered = hoveredKey != null && winnerKey === hoveredKey;
  const isInAncestorChain =
    hoveredMatchId != null &&
    (ancestorMap.get(hoveredMatchId)?.has(match.id) ?? false);
  const connectorActive =
    variant !== "none" && (isWinnerHovered || isInAncestorChain);

  const style: React.CSSProperties = {
    marginTop: lbMarginTopExpr(round, positionInRound),
    height: "var(--bracket-match-height)",
    width: "var(--bracket-col-width)",
    // Sibling seg3 overlap — see WinnersBracketSection MatchSlot.
    position: "relative",
    zIndex: connectorActive ? 2 : 1,
  };
  if (variant === "pair-up") {
    (style as Record<string, string>)["--bracket-half-sibling"] =
      lbHalfSiblingExpr(round);
  }

  return (
    <div className="site-bracket-match" style={style}>
      <SiteMatchCard
        match={match}
        onClick={onMatchClick}
        hoveredParticipantKey={hoveredKey}
        onParticipantHover={onParticipantHover}
        onMatchHover={onMatchHover}
        topSlotLabel={slotLabels?.topSlotLabel}
        bottomSlotLabel={slotLabels?.bottomSlotLabel}
      />
      {variant !== "none" ? (
        <Connector
          variant={variant}
          isTopChild={isTopChild}
          isActive={connectorActive}
          bracketType="lb"
          round={round}
        />
      ) : null}
    </div>
  );
}

function LbRoundColumn({
  round,
  totalRounds,
  matches,
  onMatchClick,
  hoveredKey,
  onParticipantHover,
  hoveredMatchId,
  onMatchHover,
  ancestorMap,
  dropInLabels,
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
  dropInLabels: Map<number, DropInLabels>;
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
        <span className="kicker">{lbRoundLabel(round, totalRounds)}</span>
      </div>
      <div className="flex flex-col">
        {sorted.map((match, idx) => (
          <LbMatchSlot
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
            slotLabels={dropInLabels.get(match.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function LosersBracketSection({
  matches,
  onMatchClick,
  hoveredKey,
  onParticipantHover,
  hoveredMatchId,
  onMatchHover,
  ancestorMap,
  dropInLabels,
}: LosersBracketSectionProps) {
  if (matches.length === 0) return null;

  const totalRounds = Math.max(...matches.map((m) => m.bracket_round));

  const matchesByRound: TournamentMatch[][] = Array.from(
    { length: totalRounds },
    () => [],
  );
  for (const m of matches) {
    const idx = m.bracket_round - 1;
    if (idx >= 0 && idx < totalRounds) {
      matchesByRound[idx].push(m);
    }
  }

  return (
    <div className="mt-12 border-t border-primary/30 pt-8">
      <div className="mb-6">
        <span className="kicker">Losers bracket</span>
      </div>
      <div className="site-scrollbar overflow-x-auto pb-6">
        <div
          className="flex items-start"
          style={{ gap: "var(--bracket-col-gap)" }}
        >
          {matchesByRound.map((roundMatches, roundIdx) => (
            <LbRoundColumn
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
              dropInLabels={dropInLabels}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
