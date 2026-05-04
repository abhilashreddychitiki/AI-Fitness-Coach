export type FitnessGoal =
  | "strength"
  | "weight loss"
  | "endurance"
  | "mobility"
  | "muscle gain"
  | "general fitness"
  | "rehab";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export type VideoStatus = "pending" | "generating" | "ready" | "failed";

export type PlanStatus = "pending" | "generating" | "ready" | "failed";

export interface Gym {
  id: string;
  name: string;
  equipment: string[];
  class_types: string[];
  style_notes: string;
  created_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  name: string;
  goal: FitnessGoal;
  fitness_level: FitnessLevel;
  injuries: string;
  created_at: string;
}

export interface PlanVideo {
  title: string;
  description: string;
  seedancePrompt: string;
  status: VideoStatus;
  generationId?: string;
  video_url?: string;
  error?: string;
}

export interface Plan {
  id: string;
  member_id: string;
  gym_id: string;
  videos: PlanVideo[];
  status: PlanStatus;
  created_at: string;
}

export interface PlanWithRelations {
  plan: Plan;
  member: Member;
  gym: Gym;
}

export interface CreateGymInput {
  name: string;
  equipment: string[];
  class_types: string[];
  style_notes?: string;
}

export interface CreateMemberInput {
  gym_id: string;
  name: string;
  goal: FitnessGoal;
  fitness_level: FitnessLevel;
  injuries?: string;
}
