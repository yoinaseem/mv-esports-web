export type StageFormat = "single_elim" | "double_elim" | "round_robin" | "swiss";

export type StageStatus = "pending" | "in_progress" | "completed";

// Shared per-stage best_of (single integer applied to every match the
// stage produces). All bracket formats accept it; readers should default
// to 1 when the key is absent.
type WithBestOf = { best_of?: number };

export type SingleElimConfig = WithBestOf & { third_place_match?: boolean };
export type DoubleElimConfig = WithBestOf & { grand_final_reset?: boolean };
export type RoundRobinConfig = WithBestOf & {
  groups: number;
  group_size: number;
  allow_draws?: boolean;
  // Each pair plays `legs` times. Backend default 1 (regular RR); 2 = double
  // round-robin, etc. Backend caps at 10 and rejects the key on non-RR formats.
  legs?: number;
};
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

// Display label for a stage. RR with legs > 1 gets a "(double)" / "(triple)" /
// "(× N)" suffix so viewers understand why the same pair plays multiple times.
// Accepts the lean { format, config } shape so preview payloads (which don't
// carry the full Stage row) can call it without a synthetic Stage.
export function formatLabel(
  stage: Pick<Stage, "format"> & { config?: StageConfig },
): string {
  if (stage.format === "round_robin") {
    const legs = (stage.config as RoundRobinConfig | undefined)?.legs ?? 1;
    if (legs <= 1) return "Round robin";
    if (legs === 2) return "Round-robin (double)";
    if (legs === 3) return "Round-robin (triple)";
    return `Round-robin (× ${legs})`;
  }
  if (stage.format === "single_elim") return "Single elimination";
  if (stage.format === "double_elim") return "Double elimination";
  if (stage.format === "swiss") return "Swiss";
  return stage.format;
}
