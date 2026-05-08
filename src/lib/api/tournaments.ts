import { apiRequest } from "@/lib/api-client";
import type { Tournament, TournamentStatus } from "@/types/tournaments";

export type ListTournamentsOptions = {
  status?: TournamentStatus;
  gameId?: number;
  hostId?: number;
  organizationId?: number;
  // Manager-only flag — required to see draft_pending_review + draft rows.
  includeDrafts?: boolean;
};

export async function listTournaments(options: ListTournamentsOptions = {}): Promise<Tournament[]> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.gameId !== undefined) params.set("game_id", String(options.gameId));
  if (options.hostId !== undefined) params.set("host_id", String(options.hostId));
  if (options.organizationId !== undefined) params.set("organization_id", String(options.organizationId));
  if (options.includeDrafts) params.set("include_drafts", "1");
  const qs = params.toString();
  const response = await apiRequest<{ data: Tournament[] }>(`/tournaments${qs ? `?${qs}` : ""}`);
  return response.data;
}

export async function getTournament(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}`);
  return response.data;
}

export async function approveTournament(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}/approve`, {
    method: "POST",
  });
  return response.data;
}

export async function rejectTournament(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}/reject`, {
    method: "POST",
  });
  return response.data;
}

export async function cancelTournament(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}/cancel`, {
    method: "POST",
  });
  return response.data;
}

export async function openTournamentRegistration(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}/open-registration`, {
    method: "POST",
  });
  return response.data;
}

export async function closeTournamentRegistration(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}/close-registration`, {
    method: "POST",
  });
  return response.data;
}

export async function deleteTournament(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/tournaments/${id}`, {
    method: "DELETE",
  });
}
