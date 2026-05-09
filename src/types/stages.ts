export type StageFormat = "single_elim" | "double_elim" | "round_robin" | "swiss";

export type StageStatus = "pending" | "in_progress" | "completed";

export type SingleElimConfig = { third_place_match?: boolean };
export type DoubleElimConfig = { grand_final_reset?: boolean };
export type RoundRobinConfig = { groups: number; group_size: number };
// Swiss is schema-only in MVP; the bracket builder rejects it. Keeping the shape
// here for completeness with backend validation.
export type SwissConfig = { rounds: number };
export type EmptyStageConfig = Record<string, never>;

export type StageConfig =
  | SingleElimConfig
  | DoubleElimConfig
  | RoundRobinConfig
  | SwissConfig
  | EmptyStageConfig;

export type Stage = {
  id: number;
  tournament_id: number;
  name: string;
  format: StageFormat;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  status: StageStatus;
  config: StageConfig;
  created_at: string;
  updated_at: string;
};
