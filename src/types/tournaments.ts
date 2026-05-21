import type { Game } from "@/types/games";
import type { TournamentHost } from "@/types/tournament-hosts";

export type TournamentStatus =
  | "draft_pending_review"
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ParticipantType = "team" | "player";

export type RegistrationType = "open" | "invite_only" | "signed_only";

// Backend ships prize pool as a nested object (or null) so we don't deal
// with both-null on two scalars. Format the amount in the renderer.
export type PrizePool = { amount: number; currency: string };

export function formatPrizePool(pp: PrizePool | null | undefined): string | null {
  if (!pp) return null;
  return `${pp.currency} ${pp.amount.toLocaleString()}`;
}

export type Tournament = {
  id: number;
  name: string;
  slug: string;
  game_id: number;
  host_id: number | null;
  organization_id: number | null;
  created_by_user_id: number;
  approved_by_user_id: number | null;
  approved_at: string | null;
  participant_type: ParticipantType;
  registration_type: RegistrationType;
  status: TournamentStatus;
  description: string | null;
  start_date: string;
  end_date: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  // Lifecycle timestamps. started_at is stamped when seed-and-build flips
  // status to InProgress; completed_at is stamped when the cascade flips to
  // Completed. Cancelled tournaments leave completed_at null — the status
  // enum carries the rest. Host-set start_date / end_date stay advisory.
  started_at: string | null;
  completed_at: string | null;
  stream_url: string | null;
  banner_url: string | null;
  max_participants: number | null;
  // Freeform tournament-level format hint (e.g. "5v5", "1v1", "BO5 finals").
  // Tournament-level rather than game-level since different tournaments of the
  // same game can run different formats.
  format_label: string | null;
  // Nested `{ amount, currency }` or null. Use `formatPrizePool` to render.
  prize_pool: PrizePool | null;
  created_at: string;
  updated_at: string;

  // Eager-loaded relationships — present on the index/show responses, which
  // call ->with(['game', 'host.user', 'organization']).
  game?: Game;
  host?: TournamentHost;

  // Optional denormalised counts — backend adds these via withCount when the
  // pending public-API enrichment commit ships. Present on the public list
  // endpoint, undefined elsewhere. Front-end falls back gracefully.
  live_match_count?: number;
  registrations_count?: number;
};

export const TERMINAL_STATUSES: ReadonlySet<TournamentStatus> = new Set([
  "completed",
  "cancelled",
]);

export function isTerminal(status: TournamentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
