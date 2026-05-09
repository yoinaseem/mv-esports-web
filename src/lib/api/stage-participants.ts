import { apiRequest } from "@/lib/api-client";
import type { StageParticipant, StageParticipantStatus } from "@/types/stage-participants";

export type ListStageParticipantsOptions = {
  status?: StageParticipantStatus;
  groupNumber?: number;
};

export async function listStageParticipants(
  tournamentId: number,
  stageId: number,
  options: ListStageParticipantsOptions = {},
): Promise<StageParticipant[]> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.groupNumber !== undefined) params.set("group_number", String(options.groupNumber));
  const qs = params.toString();
  const response = await apiRequest<{ data: StageParticipant[] }>(
    `/tournaments/${tournamentId}/stages/${stageId}/participants${qs ? `?${qs}` : ""}`,
    { skipAuth: true },
  );
  return response.data;
}
