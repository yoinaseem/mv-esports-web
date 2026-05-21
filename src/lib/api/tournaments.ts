import { apiRequest } from "@/lib/api-client";
import type {
  ParticipantType,
  RegistrationType,
  Tournament,
  TournamentStatus,
} from "@/types/tournaments";

export type TournamentCreatePayload = {
  name: string;
  slug: string;
  game_id: number;
  organization_id?: number | null;
  participant_type: ParticipantType;
  registration_type: RegistrationType;
  description?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  registration_opens_at: string; // ISO 8601
  registration_closes_at: string; // ISO 8601
  stream_url?: string | null;
  banner_url?: string | null;
  max_participants?: number | null;
  // Commit 24 enrichment fields. Freeform format hint (e.g. "3v3", "1v1",
  // "BO5 finals"); tournament-level rather than game-level since e.g.
  // Rocket League and FIFA vary per tournament. Prize pool is two coupled
  // scalars on the write API (backend rule: both-or-neither on create;
  // PATCH coupling relaxed so edits can send sparse payloads).
  format_label?: string | null;
  prize_pool_amount?: number | null;
  prize_pool_currency?: string | null;
};

// Sparse update — any subset of the create fields, plus the same windows
// that the host might tweak post-create. Backend (UpdateTournamentRequest)
// rejects status changes; those go through the verb endpoints.
export type TournamentUpdatePayload = Partial<Omit<TournamentCreatePayload, "slug">> & {
  slug?: string;
};

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

// Public path — resolves by slug instead of ID. Backend route added in the
// public-API enrichment commit. Anonymous-callable (Sanctum is opportunistic).
export async function getTournamentBySlug(slug: string): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(
    `/tournaments/by-slug/${slug}`,
    { skipAuth: true },
  );
  return response.data;
}

export async function updateTournament(
  id: number,
  payload: TournamentUpdatePayload,
): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}

// Host application path — caller's tournament_hosts row must be approved.
// Lands at status `draft_pending_review`, awaiting manager approval.
export async function createTournamentApplication(
  payload: TournamentCreatePayload,
): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>("/tournaments/applications", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

// Manager direct-create path — system_manager / superadmin only.
// Lands at status `draft` (skips the review step).
export async function createTournamentDraft(
  payload: TournamentCreatePayload,
): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>("/tournaments/drafts", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function seedAndBuildTournament(id: number): Promise<Tournament> {
  const response = await apiRequest<{ data: Tournament }>(`/tournaments/${id}/seed-and-build`, {
    method: "POST",
  });
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
