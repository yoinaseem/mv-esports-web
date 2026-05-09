import type { Participant } from "@/types/participants";

export type MatchStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "walkover"
  | "conditional"
  | "cancelled";

export type BracketType = "winners" | "losers" | "grand_final" | "group";

export type BracketSlot = "a" | "b";

export type MorphAlias = "team" | "player";

export type TournamentMatch = {
  id: number;
  stage_id: number;
  bracket_round: number;
  bracket_position: number;
  bracket_type: BracketType;
  group_number: number | null;
  participant_a_type: MorphAlias | null;
  participant_a_id: number | null;
  participant_b_type: MorphAlias | null;
  participant_b_id: number | null;
  winner_participant_type: MorphAlias | null;
  winner_participant_id: number | null;
  score_a: number;
  score_b: number;
  best_of: number;
  winner_advances_to_match_id: number | null;
  winner_advances_to_slot: BracketSlot | null;
  loser_advances_to_match_id: number | null;
  loser_advances_to_slot: BracketSlot | null;
  status: MatchStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;

  // Eager-loaded by the matches index/show endpoints.
  participant_a?: Participant | null;
  participant_b?: Participant | null;
  winner?: Participant | null;
};

export type MatchGameStatus = "pending" | "in_progress" | "completed";

export type MatchGame = {
  id: number;
  match_id: number;
  game_number: number;
  winner_participant_type: MorphAlias | null;
  winner_participant_id: number | null;
  score_a: number | null;
  score_b: number | null;
  map_or_mode: string | null;
  status: MatchGameStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;

  winner?: Participant | null;
};

export const TERMINAL_MATCH_STATUSES: ReadonlySet<MatchStatus> = new Set([
  "completed",
  "walkover",
  "cancelled",
]);

export function isMatchTerminal(status: MatchStatus): boolean {
  return TERMINAL_MATCH_STATUSES.has(status);
}
