import type { MorphAlias } from "@/types/matches";
import type {
  DoubleElimConfig,
  RoundRobinConfig,
  SingleElimConfig,
  StageFormat,
} from "@/types/stages";

// Per-participant snapshot in the preview payload. Mirrors what the bracket
// generator will write to stage_participants when seed-and-build runs.
// `name` is the team's name or the player's gamertag — backend resolves via
// the morphed relation so the frontend doesn't need to cross-reference.
export type PreviewParticipant = {
  seed: number;
  registration_id: number;
  participant_type: MorphAlias;
  participant_id: number;
  name: string;
};

// Round-1 slot for SE / DE winners' bracket. A bye is a pre-resolved walkover
// in the generator (top seed auto-advances); the preview surfaces it as
// kind: "bye" so the UI can label it accordingly.
export type PreviewRound1Slot =
  | {
      position: number;
      kind: "match";
      a: PreviewParticipant;
      b: PreviewParticipant;
    }
  | {
      position: number;
      kind: "bye";
      a: PreviewParticipant;
      b: null;
    };

// One RR group's pre-computed roster. matches_in_group is the closed-form
// `C(n, 2) × legs` (no need to run the circle method to count). has_phantom_bye
// fires when the group has an odd participant count and the circle method
// will pair one round per leg against a phantom seat.
export type PreviewRrGroup = {
  group_number: number;
  participants: PreviewParticipant[];
  matches_in_group: number;
  has_phantom_bye: boolean;
};

// Base fields every stage preview block carries regardless of buildable status.
type PreviewStageBase = {
  stage_id: number;
  name: string;
  approved_count: number;
};

export type PreviewStageRr = PreviewStageBase & {
  format: "round_robin";
  buildable: true;
  matches_total: number;
  config: RoundRobinConfig;
  groups: PreviewRrGroup[];
};

export type PreviewStageSe = PreviewStageBase & {
  format: "single_elim";
  buildable: true;
  matches_total: number;
  bracket_size: number;
  byes: number;
  config: SingleElimConfig;
  round_1: PreviewRound1Slot[];
};

export type PreviewStageDeBuildable = PreviewStageBase & {
  format: "double_elim";
  buildable: true;
  matches_total: number;
  config: DoubleElimConfig;
  bracket_counts: { winners: number; losers: number; grand_final: number };
  winners_round_1: PreviewRound1Slot[];
};

// Returned when the generator's preconditions would fail (RR over-capacity,
// DE count ∉ {4,8,16,32}, etc.). `supported_sizes` is DE-specific; absent for
// other formats. UI surfaces this as a blocking dialog, not a confirmation.
export type PreviewStageUnbuildable = PreviewStageBase & {
  format: StageFormat;
  buildable: false;
  reason: string;
  supported_sizes?: number[];
};

export type PreviewStage =
  | PreviewStageRr
  | PreviewStageSe
  | PreviewStageDeBuildable
  | PreviewStageUnbuildable;

export type SeedAndBuildPreview = {
  tournament_id: number;
  stages: PreviewStage[];
};

export function isStageBuildable(
  stage: PreviewStage,
): stage is PreviewStageRr | PreviewStageSe | PreviewStageDeBuildable {
  return stage.buildable === true;
}

export type SeedAssignment = {
  registration_id: number;
  seed: number;
};
