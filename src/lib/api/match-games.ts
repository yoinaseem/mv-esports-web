import { apiRequest } from "@/lib/api-client";
import type { MatchGame, MorphAlias } from "@/types/matches";
import type { Paginated } from "@/types/auth";

export type MatchGamePayload = {
  game_number: number;
  // Nullable for drawn games on RR stages with allow_draws=true. Backend
  // accepts both halves null together (= draw) or both set (= decisive).
  winner_participant_type: MorphAlias | null;
  winner_participant_id: number | null;
  score_a?: number | null;
  score_b?: number | null;
  map_or_mode?: string | null;
};

export type MatchGameUpdatePayload = Partial<MatchGamePayload>;

export async function listMatchGames(matchId: number): Promise<MatchGame[]> {
  // Same backend pagination cap as matches/registrations — set per_page so
  // even best-of-7 (5 games max) fits in one page; the cap is 100, way above
  // anything realistic for a single match.
  const response = await apiRequest<Paginated<MatchGame>>(
    `/matches/${matchId}/games?per_page=100`,
    { skipAuth: true },
  );
  return response.data;
}

export async function createMatchGame(matchId: number, payload: MatchGamePayload): Promise<MatchGame> {
  const response = await apiRequest<{ data: MatchGame }>(`/matches/${matchId}/games`, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateMatchGame(gameId: number, payload: MatchGameUpdatePayload): Promise<MatchGame> {
  const response = await apiRequest<{ data: MatchGame }>(`/match-games/${gameId}`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}

export async function deleteMatchGame(gameId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/match-games/${gameId}`, {
    method: "DELETE",
  });
}
