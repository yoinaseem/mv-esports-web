// Shared shape used by anywhere a polymorphic participant (team or player)
// surfaces in the API — match.participant_a/_b/_winner, stage_participant.participant,
// tournament_registration.participant, match_game.winner.
//
// Backend serialiser: App\Support\ParticipantPayload (single source of truth).
// Eager-loaded via whenLoaded; absent if controller didn't `with()` the relation.

export type TeamParticipant = {
  type: "team";
  id: number;
  name: string;
  tag: string | null;
};

export type PlayerParticipant = {
  type: "player";
  id: number;
  gamertag: string;
  user: { id: number; display_name: string | null } | null;
};

export type Participant = TeamParticipant | PlayerParticipant;

export function participantDisplayName(participant: Participant | null): string {
  if (!participant) return "TBD";
  if (participant.type === "team") return participant.name;
  return participant.gamertag;
}
