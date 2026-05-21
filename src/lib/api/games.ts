import { apiRequest } from "@/lib/api-client";
import type { Game, GameGenre } from "@/types/games";

export type GamePayload = {
  name: string;
  slug: string;
  icon_url?: string | null;
  is_active?: boolean;
  // Commit 24 enrichment fields. All nullable on the backend so existing
  // catalog entries stay valid. genre is one of the five GameGenre cases
  // or null; the strings live on @/types/games next to GAME_GENRE_LABELS.
  banner_url?: string | null;
  description?: string | null;
  genre?: GameGenre | null;
  website_url?: string | null;
};

export type GameUpdatePayload = Partial<GamePayload>;

export async function listGames(options: { includeInactive?: boolean } = {}): Promise<Game[]> {
  const params = options.includeInactive ? "?include_inactive=1" : "";
  const response = await apiRequest<{ data: Game[] }>(`/games${params}`, {
    method: "GET",
    skipAuth: true,
  });
  return response.data;
}

export async function getGame(id: number): Promise<Game> {
  const response = await apiRequest<{ data: Game }>(`/games/${id}`, {
    method: "GET",
    skipAuth: true,
  });
  return response.data;
}

// Public path — resolves by slug instead of ID. Backend route added in the
// public-API enrichment commit.
export async function getGameBySlug(slug: string): Promise<Game> {
  const response = await apiRequest<{ data: Game }>(`/games/by-slug/${slug}`, {
    method: "GET",
    skipAuth: true,
  });
  return response.data;
}

export async function createGame(payload: GamePayload): Promise<Game> {
  const response = await apiRequest<{ data: Game }>("/games", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateGame(id: number, payload: GameUpdatePayload): Promise<Game> {
  const response = await apiRequest<{ data: Game }>(`/games/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}

export async function deleteGame(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/games/${id}`, {
    method: "DELETE",
  });
}
