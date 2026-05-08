import { apiRequest } from "@/lib/api-client";
import type { HostStatus, TournamentHost } from "@/types/tournament-hosts";

export type HostUpdatePayload = {
  display_name?: string;
  bio?: string | null;
  organization_id?: number | null;
  status?: HostStatus;
};

export async function listHosts(options: { status?: HostStatus } = {}): Promise<TournamentHost[]> {
  const params = options.status ? `?status=${encodeURIComponent(options.status)}` : "";
  const response = await apiRequest<{ data: TournamentHost[] }>(`/tournament-hosts${params}`, {
    method: "GET",
  });
  return response.data;
}

export async function getHost(id: number): Promise<TournamentHost> {
  const response = await apiRequest<{ data: TournamentHost }>(`/tournament-hosts/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function updateHost(id: number, payload: HostUpdatePayload): Promise<TournamentHost> {
  const response = await apiRequest<{ data: TournamentHost }>(`/tournament-hosts/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}

export async function deleteHost(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/tournament-hosts/${id}`, {
    method: "DELETE",
  });
}
