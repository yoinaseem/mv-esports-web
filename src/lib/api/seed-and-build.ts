import { apiRequest } from "@/lib/api-client";
import type { SeedAndBuildPreview } from "@/types/seed-preview";

// Dry-run of the bracket generator. Backend gates on RegistrationClosed status
// and tournament-admin auth. Returns one preview block per entry stage with a
// format-specific shape (see types/seed-preview.ts). Side-effect-free.
export async function getSeedAndBuildPreview(
  tournamentId: number,
): Promise<SeedAndBuildPreview> {
  return apiRequest<SeedAndBuildPreview>(
    `/tournaments/${tournamentId}/seed-and-build/preview`,
  );
}
