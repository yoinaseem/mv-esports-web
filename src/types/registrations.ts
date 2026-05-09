import type { MorphAlias } from "@/types/matches";
import type { Participant } from "@/types/participants";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type TournamentRegistration = {
  id: number;
  tournament_id: number;
  participant_type: MorphAlias;
  participant_id: number;
  registered_by_user_id: number;
  status: RegistrationStatus;
  seed: number | null;
  registered_at: string;
  created_at: string;
  updated_at: string;

  participant?: Participant | null;
};

export const TERMINAL_REGISTRATION_STATUSES: ReadonlySet<RegistrationStatus> = new Set([
  "rejected",
  "withdrawn",
]);
