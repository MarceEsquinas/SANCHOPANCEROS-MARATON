
export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

export interface WeightEntry {
  month: string;
  value: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  weightHistory?: WeightEntry[];
  monthlyKmGoal?: number;
  activePlanId?: string; // Tracks which marathon is the primary target
}

export interface Workout {
  id: string;
  planId: string;
  week: number;
  order: number;
  description: string;
  completed: boolean;
  skipped: boolean;
  distanceKm: number; // Planned distance
  actualDistanceKm?: number; // Realized distance
  duration?: string; // Time taken (e.g., "01:20:00")
  feelings?: string;
  hasInjury: boolean;
  injuryNote?: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  date: string;
}

export interface MarathonInfo {
  id: string;
  name: string;
  date: string;
}
