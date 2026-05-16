import { apiRequest } from "@/lib/api-client";
import type {
  RegistrationStatus,
  TournamentRegistration,
} from "@/types/registrations";
import type { SeedAssignment } from "@/types/seed-preview";
import type { Paginated } from "@/types/auth";

export type RegistrationUpdatePayload = {
  status?: RegistrationStatus;
  seed?: number | null;
};

export async function listRegistrations(
  tournamentId: number,
  options: { status?: RegistrationStatus; perPage?: number } = {},
): Promise<TournamentRegistration[]> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  // Backend caps per_page at 100. Adequate for MVP-sized tournaments; add
  // proper pagination if/when registration counts cross that line.
  params.set("per_page", String(options.perPage ?? 100));
  const qs = params.toString();
  const response = await apiRequest<Paginated<TournamentRegistration>>(
    `/tournaments/${tournamentId}/registrations?${qs}`,
    { skipAuth: true },
  );
  return response.data;
}

export async function updateRegistration(
  tournamentId: number,
  registrationId: number,
  payload: RegistrationUpdatePayload,
): Promise<TournamentRegistration> {
  const response = await apiRequest<{ data: TournamentRegistration }>(
    `/tournaments/${tournamentId}/registrations/${registrationId}`,
    { method: "PATCH", body: payload },
  );
  return response.data;
}

export async function deleteRegistration(
  tournamentId: number,
  registrationId: number,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/tournaments/${tournamentId}/registrations/${registrationId}`,
    { method: "DELETE" },
  );
}

// Atomic full-set seed assignment. Backend requires every approved registration
// to appear exactly once with seeds forming a contiguous 1..N sequence. Returns
// the updated approved set ordered by seed. Available in RegistrationOpen and
// RegistrationClosed; tournament-admin only.
export async function bulkUpdateSeeds(
  tournamentId: number,
  assignments: ReadonlyArray<SeedAssignment>,
): Promise<TournamentRegistration[]> {
  const response = await apiRequest<{ data: TournamentRegistration[] }>(
    `/tournaments/${tournamentId}/registrations/seeds`,
    { method: "PATCH", body: { assignments } },
  );
  return response.data;
}
