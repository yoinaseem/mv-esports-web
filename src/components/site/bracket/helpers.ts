import type { TournamentMatch } from "@/types/matches";

// `team-3` and `player-3` must not collide — prepend the morph alias.
export function participantKey(
  type: string | null | undefined,
  id: number | null | undefined,
): string | null {
  if (!type || id == null) return null;
  return `${type}-${id}`;
}

export function winnerKeyOf(match: TournamentMatch): string | null {
  return participantKey(
    match.winner_participant_type,
    match.winner_participant_id,
  );
}

// Vertical-centering marginTop. First match in round R offsets by
// (2^(R-1) - 1) × (M+H) / 2 to centre on its children's midpoint;
// subsequent matches gap by 2^(R-1) × (M+H) - M.
export function marginTopExpr(round: number, positionInRound: number): string {
  const RH = "(var(--bracket-match-height) + var(--bracket-row-gap))";
  if (positionInRound === 0) {
    const factor = Math.pow(2, round - 1) - 1;
    if (factor === 0) return "0px";
    return `calc(${RH} * ${factor / 2})`;
  }
  const factor = Math.pow(2, round - 1);
  return `calc(${RH} * ${factor} - var(--bracket-match-height))`;
}

export function halfSiblingExpr(round: number): string {
  const factor = Math.pow(2, round - 2);
  return `calc((var(--bracket-match-height) + var(--bracket-row-gap)) * ${factor})`;
}

// Named for the round's participant count: 2→Final, 4→Semi-finals,
// 8→Quarter-finals, else "Round of N". Prefix is "WB "/"LB " in DE.
export function roundLabel(
  round: number,
  totalRounds: number,
  prefix = "",
): string {
  const competing = Math.pow(2, totalRounds - round + 1);
  if (competing === 2) return `${prefix}Final`;
  if (competing === 4) return `${prefix}Semi-finals`;
  if (competing === 8) return `${prefix}Quarter-finals`;
  return `${prefix}Round of ${competing}`;
}

// LB has 2(N-1) rounds for an N-round WB; rounds alternate between feed
// (odd R, 1:1 to next round) and pair-up (even R, two matches merge into
// one). Each LB match "represents" 2^floor((R-1)/2) LB-R1 matches — the
// groupSize — and positions/geometry derive from that.
export function lbGroupSize(round: number): number {
  return Math.pow(2, Math.floor((round - 1) / 2));
}

export function lbMarginTopExpr(
  round: number,
  positionInRound: number,
): string {
  const RH = "(var(--bracket-match-height) + var(--bracket-row-gap))";
  const group = lbGroupSize(round);
  if (positionInRound === 0) {
    const factor = (group - 1) / 2;
    if (factor === 0) return "0px";
    return `calc(${RH} * ${factor})`;
  }
  return `calc(${RH} * ${group} - var(--bracket-match-height))`;
}

// Only meaningful for pair-up rounds (even R); irrelevant for feed rounds.
export function lbHalfSiblingExpr(round: number): string {
  const group = lbGroupSize(round);
  return `calc((var(--bracket-match-height) + var(--bracket-row-gap)) * ${group / 2})`;
}

export function lbConnectorVariant(
  round: number,
  totalLbRounds: number,
): "feed" | "pair-up" | "none" {
  if (round === totalLbRounds) return "none";
  if (round % 2 === 0) return "pair-up";
  return "feed";
}

// "LB Semi-final" would be ambiguous in 4-team DE (only 2 LB rounds).
export function lbRoundLabel(round: number, totalLbRounds: number): string {
  if (round === totalLbRounds) return "LB Final";
  return `LB Round ${round}`;
}

// Loser drop-ins deliberately excluded — their cross-section connector
// isn't rendered (deferred), so including them would mis-highlight WB
// intra-bracket connectors when an LB match is hovered.
export function buildWinnerAncestorMap(
  matches: ReadonlyArray<TournamentMatch>,
): Map<number, Set<number>> {
  const direct = new Map<number, number[]>();
  for (const m of matches) {
    if (m.winner_advances_to_match_id == null) continue;
    const list = direct.get(m.winner_advances_to_match_id) ?? [];
    list.push(m.id);
    direct.set(m.winner_advances_to_match_id, list);
  }

  const memo = new Map<number, Set<number>>();
  function compute(matchId: number, visited: Set<number>): Set<number> {
    if (memo.has(matchId)) return memo.get(matchId)!;
    if (visited.has(matchId)) return new Set();
    visited.add(matchId);
    const result = new Set<number>();
    for (const sourceId of direct.get(matchId) ?? []) {
      result.add(sourceId);
      for (const further of compute(sourceId, visited)) {
        result.add(further);
      }
    }
    visited.delete(matchId);
    memo.set(matchId, result);
    return result;
  }

  for (const m of matches) {
    if (!memo.has(m.id)) compute(m.id, new Set());
  }
  return memo;
}

export type DropInLabels = {
  topSlotLabel?: string;
  bottomSlotLabel?: string;
};

// Abbreviated so labels fit the narrow match-card width.
function wbRoundShortLabel(round: number, totalWbRounds: number): string {
  const distFromEnd = totalWbRounds - round;
  if (distFromEnd === 0) return "Final";
  if (distFromEnd === 1) return "SF";
  if (distFromEnd === 2) return "QF";
  return `R${round}`;
}

export function buildDropInLabels(
  matches: ReadonlyArray<TournamentMatch>,
): Map<number, DropInLabels> {
  const result = new Map<number, DropInLabels>();

  // Per-round match count drives whether labels need a `#N` suffix to
  // disambiguate within the round.
  let totalWbRounds = 0;
  const matchesPerWbRound = new Map<number, number>();
  for (const m of matches) {
    if (m.bracket_type !== "winners") continue;
    if (m.bracket_round > totalWbRounds) totalWbRounds = m.bracket_round;
    matchesPerWbRound.set(
      m.bracket_round,
      (matchesPerWbRound.get(m.bracket_round) ?? 0) + 1,
    );
  }

  for (const m of matches) {
    if (m.bracket_type !== "winners") continue;
    if (
      m.loser_advances_to_match_id == null ||
      m.loser_advances_to_slot == null
    ) {
      continue;
    }

    const targetId = m.loser_advances_to_match_id;
    const slot = m.loser_advances_to_slot;
    const roundName = wbRoundShortLabel(m.bracket_round, totalWbRounds);
    const isSingleMatchRound =
      (matchesPerWbRound.get(m.bracket_round) ?? 0) === 1;
    const label = isSingleMatchRound
      ? `Loser of WB ${roundName}`
      : `Loser of WB ${roundName} #${m.bracket_position + 1}`;

    const existing = result.get(targetId) ?? {};
    if (slot === "a") existing.topSlotLabel = label;
    else if (slot === "b") existing.bottomSlotLabel = label;
    result.set(targetId, existing);
  }

  return result;
}
