export type HabitCategory = 'exercise' | 'water' | 'sleep' | 'custom';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  targetValue: number;
  unit: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface DailyHabitLog {
  date: string; // YYYY-MM-DD
  habitsCompleted: Record<string, boolean>; // habitId -> completed
  waterIntakeMl: number; // in ml
  waterTargetMl: number; // in ml (e.g. 2000ml = 8 glasses of 250ml)
  sleepHours: number; // e.g. 7.5
  sleepTargetHours: number; // e.g. 8
  sleepQuality: 'poor' | 'fair' | 'good' | 'great';
  sleepBedTime: string; // e.g. "23:00"
  sleepWakeTime: string; // e.g. "07:00"
  notes?: string;
}

export type ExerciseType =
  | 'running'
  | 'strength'
  | 'cycling'
  | 'yoga'
  | 'swimming'
  | 'hiit'
  | 'walking'
  | 'pilates'
  | 'rest';

export interface ExercisePlan {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: ExerciseType;
  targetDurationMin: number;
  plannedTime: string; // "07:30"
  completed: boolean;
  actualDurationMin?: number;
  intensity: 'light' | 'moderate' | 'intense';
  notes?: string;
}

export type ReminderLeadTime = 0 | 5 | 10 | 15 | 30 | 60 | 120 | 1440; // minutes before

export interface CalendarReminder {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // "08:00"
  category: 'exercise' | 'water' | 'sleep' | 'habit' | 'task';
  leadTimeMinutes: ReminderLeadTime;
  status: 'pending' | 'triggered' | 'completed' | 'dismissed';
  linkedExerciseId?: string;
  soundEnabled: boolean;
  createdAt: string;
  triggeredAt?: string;
}
