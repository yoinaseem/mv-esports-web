export type QualificationRuleType = "top_n" | "top_n_per_group" | "manual" | "all";

export type TopNConfig = { n: number };
export type TopNPerGroupConfig = { per_group: number; placement_strategy: "cross_group" };
export type EmptyQualificationConfig = Record<string, never>;

export type QualificationConfig =
  | TopNConfig
  | TopNPerGroupConfig
  | EmptyQualificationConfig;

export type StageQualification = {
  id: number;
  source_stage_id: number | null;
  target_stage_id: number;
  rule_type: QualificationRuleType;
  rule_config: QualificationConfig;
  created_at: string;
  updated_at: string;
};
