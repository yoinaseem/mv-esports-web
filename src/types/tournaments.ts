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
