import { apiRequest } from "@/lib/api-client";
import type { TournamentMatch } from "@/types/matches";
import type { Paginated } from "@/types/auth";

export type ListMatchesOptions = {
  bracketType?: "winners" | "losers" | "grand_final" | "group";
  status?: string;
  perPage?: number;
};

export async function listMatches(
  tournamentId: number,
  stageId: number,
  options: ListMatchesOptions = {},
): Promise<TournamentMatch[]> {
  const params = new URLSearchParams();
  if (options.bracketType) params.set("bracket_type", options.bracketType);
  if (options.status) params.set("status", options.status);
  // Backend default is per_page=20, capped at 100. For typical tournaments
  // (32-team DE = 63 matches) one page is enough; if we ever need more we'll
  // add proper pagination here.
  params.set("per_page", String(options.perPage ?? 100));
  const qs = params.toString();
  const response = await apiRequest<Paginated<TournamentMatch>>(
    `/tournaments/${tournamentId}/stages/${stageId}/matches?${qs}`,
    { skipAuth: true },
  );
  return response.data;
}

export async function getMatch(matchId: number): Promise<TournamentMatch> {
  const response = await apiRequest<{ data: TournamentMatch }>(`/matches/${matchId}`, {
    skipAuth: true,
  });
  return response.data;
}

export type UpdateMatchPayload = {
  // Backend rule: best_of must be odd, can only change before any game is
  // recorded and only while the match is non-terminal. UI should mirror.
  best_of?: number;
  scheduled_at?: string | null;
};

export async function updateMatch(matchId: number, payload: UpdateMatchPayload): Promise<TournamentMatch> {
  const response = await apiRequest<{ data: TournamentMatch }>(`/matches/${matchId}`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}
