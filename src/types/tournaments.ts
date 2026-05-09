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
  created_at: string;
  updated_at: string;
};

export const TERMINAL_STATUSES: ReadonlySet<TournamentStatus> = new Set([
  "completed",
  "cancelled",
]);

export function isTerminal(status: TournamentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
