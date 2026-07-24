export type GoalKey = "hair_skin" | "fitness" | "mental_health" | "knowledge";

export type GirlStatus = "pending" | "approved" | "banned" | "warned";

export interface Girl {
  id: string;
  auth_id: string;
  name: string;
  age: number;
  secret_name: string;
  follow_photo_url: string;
  profile_photo_url: string | null;
  status: GirlStatus;
  created_at: string;
}

export interface Goal {
  key: GoalKey;
  title: string;
  icon: string;
}

export interface GoalStep {
  id: string;
  goal_key: GoalKey;
  day_number: number;
  step_order: 1 | 2;
  content: string;
}

export interface GirlProgress {
  id: string;
  girl_id: string;
  goal_key: GoalKey;
  step_id: string;
  day_number: number;
  completed: boolean;
  completed_at: string | null;
}

export interface CommunityPost {
  id: string;
  girl_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string | null;
  status: "pending" | "reviewed" | "banned" | "dismissed";
  created_at: string;
}
