import { participantDisplayName } from "@/types/participants";
import type { MatchStatus, TournamentMatch } from "@/types/matches";

// State mapping from our match status to @g-loot's library state strings.
// The library renders different visual treatments per state (greyed out for
// NO_PARTY / NO_SHOW, struck-through resultText for WALK_OVER, etc.).
const STATE_MAP: Record<MatchStatus, string> = {
  pending: "NO_PARTY",
  scheduled: "SCHEDULED",
  in_progress: "RUNNING",
  completed: "PLAYED",
  walkover: "WALK_OVER",
  conditional: "NO_PARTY", // GF reset until L-bracket forces activation
  cancelled: "NO_SHOW",
};

// Stable participant ID for the library — combines morph alias + numeric id so
// `team-3` and `player-3` don't collide across the same bracket (rare but
// possible if a tournament were polymorphic — schema doesn't allow it but
// belt-and-braces).
function participantKey(type: string | null | undefined, id: number | null | undefined, slot: "a" | "b"): string {
  if (type && id != null) return `${type}-${id}`;
  return `tbd-${slot}`;
}

// One match in our shape → one MatchType in the library's shape. We also
// stash the original TournamentMatch on a custom `tournamentMatch` key —
// the lib's MatchType has `[key: string]: any` so this round-trips intact
// to the matchComponent (MaiaMatch reads it for the info popover).
export function transformMatchForLib(match: TournamentMatch): {
  id: number;
  nextMatchId: number | null;
  nextLooserMatchId?: number;
  tournamentRoundText: string;
  startTime: string;
  state: string;
  participants: ReadonlyArray<{
    id: string;
    name: string;
    isWinner: boolean;
    resultText: string | null;
    status: string | null;
  }>;
  tournamentMatch: TournamentMatch;
} {
  const a = match.participant_a ?? null;
  const b = match.participant_b ?? null;

  const winnerIsA =
    match.winner_participant_id != null &&
    match.winner_participant_id === match.participant_a_id &&
    match.winner_participant_type === match.participant_a_type;
  const winnerIsB =
    match.winner_participant_id != null &&
    match.winner_participant_id === match.participant_b_id &&
    match.winner_participant_type === match.participant_b_type;

  return {
    id: match.id,
    nextMatchId: match.winner_advances_to_match_id,
    nextLooserMatchId: match.loser_advances_to_match_id ?? undefined,
    tournamentRoundText: `Round ${match.bracket_round}`,
    startTime: match.scheduled_at ?? match.created_at,
    state: STATE_MAP[match.status],
    participants: [
      {
        id: participantKey(match.participant_a_type, match.participant_a_id, "a"),
        name: participantDisplayName(a),
        isWinner: winnerIsA,
        resultText: a ? String(match.score_a) : null,
        status: match.status === "walkover" && winnerIsA ? "WALK_OVER" : null,
      },
      {
        id: participantKey(match.participant_b_type, match.participant_b_id, "b"),
        name: participantDisplayName(b),
        isWinner: winnerIsB,
        resultText: b ? String(match.score_b) : null,
        status: match.status === "walkover" && winnerIsB ? "WALK_OVER" : null,
      },
    ],
    tournamentMatch: match,
  };
}
