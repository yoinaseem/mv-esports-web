export type HostStatus = "pending" | "approved" | "suspended";

export type TournamentHost = {
  id: number;
  user_id: number | null;
  organization_id: number | null;
  display_name: string;
  bio: string | null;
  status: HostStatus;
  approved_by_user_id: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};
