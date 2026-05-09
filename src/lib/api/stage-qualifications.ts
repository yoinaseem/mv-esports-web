import { apiRequest } from "@/lib/api-client";
import type { QualificationConfig, QualificationRuleType, StageQualification } from "@/types/stage-qualifications";

export type StageQualificationPayload = {
  source_stage_id: number | null;
  rule_type: QualificationRuleType;
  rule_config?: QualificationConfig | null;
};

export async function listStageQualifications(
  tournamentId: number,
  stageId: number,
): Promise<StageQualification[]> {
  const response = await apiRequest<{ data: StageQualification[] }>(
    `/tournaments/${tournamentId}/stages/${stageId}/qualifications`,
    { skipAuth: true },
  );
  return response.data;
}

export async function createStageQualification(
  tournamentId: number,
  stageId: number,
  payload: StageQualificationPayload,
): Promise<StageQualification> {
  const response = await apiRequest<{ data: StageQualification }>(
    `/tournaments/${tournamentId}/stages/${stageId}/qualifications`,
    { method: "POST", body: payload },
  );
  return response.data;
}

export async function deleteStageQualification(
  tournamentId: number,
  stageId: number,
  qualificationId: number,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/tournaments/${tournamentId}/stages/${stageId}/qualifications/${qualificationId}`,
    { method: "DELETE" },
  );
}
