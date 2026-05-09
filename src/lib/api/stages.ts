import { apiRequest } from "@/lib/api-client";
import type { Stage, StageConfig, StageFormat } from "@/types/stages";

export type StagePayload = {
  name: string;
  format: StageFormat;
  sort_order?: number;
  start_date?: string | null;
  end_date?: string | null;
  config?: StageConfig | null;
};

export type StageUpdatePayload = Partial<StagePayload>;

export async function listStages(tournamentId: number): Promise<Stage[]> {
  const response = await apiRequest<{ data: Stage[] }>(`/tournaments/${tournamentId}/stages`, {
    skipAuth: true,
  });
  return response.data;
}

export async function getStage(tournamentId: number, stageId: number): Promise<Stage> {
  const response = await apiRequest<{ data: Stage }>(
    `/tournaments/${tournamentId}/stages/${stageId}`,
    { skipAuth: true },
  );
  return response.data;
}

export async function createStage(tournamentId: number, payload: StagePayload): Promise<Stage> {
  const response = await apiRequest<{ data: Stage }>(`/tournaments/${tournamentId}/stages`, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateStage(
  tournamentId: number,
  stageId: number,
  payload: StageUpdatePayload,
): Promise<Stage> {
  const response = await apiRequest<{ data: Stage }>(
    `/tournaments/${tournamentId}/stages/${stageId}`,
    { method: "PATCH", body: payload },
  );
  return response.data;
}

export async function deleteStage(tournamentId: number, stageId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/tournaments/${tournamentId}/stages/${stageId}`, {
    method: "DELETE",
  });
}

export async function reorderStages(
  tournamentId: number,
  stages: ReadonlyArray<{ id: number; sort_order: number }>,
): Promise<Stage[]> {
  const response = await apiRequest<{ data: Stage[] }>(
    `/tournaments/${tournamentId}/stages/reorder`,
    { method: "POST", body: { stages } },
  );
  return response.data;
}
