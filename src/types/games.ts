export type GameGenre =
  | "moba"
  | "fps"
  | "sports"
  | "fighting"
  | "strategy";

export const GAME_GENRE_LABELS: Record<GameGenre, string> = {
  moba: "MOBA",
  fps: "FPS",
  sports: "Sports",
  fighting: "Fighting",
  strategy: "Strategy",
};

export type Game = {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
  banner_url: string | null;
  description: string | null;
  genre: GameGenre | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Denormalised counts via withCount on the public list / show / by-slug
  // endpoints. Undefined when fetched elsewhere — front-end falls back.
  live_tournament_count?: number;
  upcoming_tournament_count?: number;
  total_tournament_count?: number;
};
