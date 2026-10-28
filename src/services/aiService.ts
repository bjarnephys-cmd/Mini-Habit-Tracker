import { Habit, ExercisePlan, CalendarReminder, ReminderLeadTime } from '../types';

export interface AiSuggestedHabit {
  name: string;
  category: 'exercise' | 'water' | 'sleep' | 'custom';
  targetValue: number;
  unit: string;
  icon?: string;
}

export interface AiSuggestedExercise {
  title: string;
  type: ExercisePlan['type'];
  targetDurationMin: number;
  plannedTime: string;
  dayOffset: number;
  intensity?: ExercisePlan['intensity'];
  notes?: string;
}

export interface AiSuggestedReminder {
  title: string;
  description?: string;
  category: CalendarReminder['category'];
  time: string;
  leadTimeMinutes: ReminderLeadTime;
  dayOffset: number;
  repeatDaily?: boolean;
}

export interface AiHabitIntentResult {
  summary: string;
  motivationalTip: string;
  suggestedHabits: AiSuggestedHabit[];
  suggestedExercises: AiSuggestedExercise[];
  suggestedReminders: AiSuggestedReminder[];
}

export async function requestHabitAiSuggestions(
  prompt: string,
  currentHabits: Habit[],
  todayDate: string
): Promise<AiHabitIntentResult> {
  const response = await fetch('/api/ai/parse-habit-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, currentHabits, todayDate }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate AI habit suggestions');
  }

  return json.data;
}

export interface DailyCoachResponse {
  comment: string;
  actionableMicroTip: string;
}

export async function requestDailyCoach(stats: {
  habitsCount: number;
  completedCount: number;
  waterIntake: number;
  waterTarget: number;
  sleepHours: number;
  sleepQuality?: string;
  todayWorkout?: { title: string; completed: boolean } | null;
}): Promise<DailyCoachResponse> {
  const response = await fetch('/api/ai/daily-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats),
  });

  const json = await response.json();
  if (!response.ok || !json.comment) {
    throw new Error(json.error || 'Failed to get coaching tip');
  }

  return json;
}
