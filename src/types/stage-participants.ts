import type { MorphAlias } from "@/types/matches";
import type { Participant } from "@/types/participants";

export type StageParticipantStatus = "active" | "eliminated" | "withdrawn";

export type StageParticipant = {
  id: number;
  stage_id: number;
  participant_type: MorphAlias;
  participant_id: number;
  seed: number;
  group_number: number | null;
  status: StageParticipantStatus;
  final_position: number | null;
  created_at: string;
  updated_at: string;

  participant?: Participant | null;
};
