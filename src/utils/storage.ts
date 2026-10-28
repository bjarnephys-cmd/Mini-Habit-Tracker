import { Habit, DailyHabitLog, ExercisePlan, CalendarReminder } from '../types';
import { formatDateToISO, getNext14Days } from './date';

const STORAGE_KEY_HABITS = 'habitflow_habits_v1';
const STORAGE_KEY_LOGS = 'habitflow_logs_v1';
const STORAGE_KEY_EXERCISES = 'habitflow_exercises_v1';
const STORAGE_KEY_REMINDERS = 'habitflow_reminders_v1';

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-water',
    name: 'Hydration Goal',
    category: 'water',
    targetValue: 2000,
    unit: 'ml',
    color: '#0284c7', // Sky 600
    icon: 'droplets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-sleep',
    name: '8h Restful Sleep',
    category: 'sleep',
    targetValue: 8,
    unit: 'hours',
    color: '#6366f1', // Indigo 500
    icon: 'moon',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-exercise',
    name: 'Daily Planned Workout',
    category: 'exercise',
    targetValue: 30,
    unit: 'mins',
    color: '#059669', // Emerald 600
    icon: 'dumbbell',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-stretch',
    name: 'Morning Mobility & Stretch',
    category: 'custom',
    targetValue: 10,
    unit: 'mins',
    color: '#d97706', // Amber 600
    icon: 'sparkles',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-reading',
    name: 'Mindful Reading',
    category: 'custom',
    targetValue: 20,
    unit: 'pages',
    color: '#8b5cf6', // Violet 500
    icon: 'book-open',
    createdAt: new Date().toISOString(),
  },
];

export function getInitialSeedData() {
  const next14 = getNext14Days();
  const todayStr = next14[0];

  const defaultWorkouts: Array<{
    offset: number;
    title: string;
    type: ExercisePlan['type'];
    time: string;
    dur: number;
    intensity: ExercisePlan['intensity'];
    notes: string;
  }> = [
    { offset: 0, title: 'Morning 5km Tempo Run', type: 'running', time: '08:00', dur: 30, intensity: 'moderate', notes: 'Warm up 5 min, steady pace' },
    { offset: 1, title: 'Upper Body & Core Strength', type: 'strength', time: '17:30', dur: 45, intensity: 'intense', notes: 'Push-ups, pull-ups, dumbbell rows, planks' },
    { offset: 2, title: 'Spine & Hip Mobility Yoga', type: 'yoga', time: '07:30', dur: 30, intensity: 'light', notes: 'Deep stretch and breathing flow' },
    { offset: 3, title: 'High Intensity Interval Blast', type: 'hiit', time: '18:00', dur: 35, intensity: 'intense', notes: 'Tabata 40s on / 20s off' },
    { offset: 4, title: 'Outdoor Cycling Endurance', type: 'cycling', time: '16:00', dur: 50, intensity: 'moderate', notes: 'Zone 2 steady heart rate' },
    { offset: 5, title: 'Lower Body & Legs Focus', type: 'strength', time: '17:30', dur: 45, intensity: 'intense', notes: 'Squats, lunges, calf raises' },
    { offset: 6, title: 'Rest & Guided Nature Walk', type: 'walking', time: '10:00', dur: 30, intensity: 'light', notes: 'Easy recovery walk' },
    { offset: 7, title: 'Progressive Interval Run', type: 'running', time: '08:00', dur: 35, intensity: 'moderate', notes: 'Sprint intervals 1 min on / 1 min off' },
    { offset: 8, title: 'Full Body Kettlebell Circuit', type: 'strength', time: '17:30', dur: 40, intensity: 'intense', notes: 'Swings, goblet squats, cleans' },
    { offset: 9, title: 'Pilates Core & Alignment', type: 'pilates', time: '07:30', dur: 30, intensity: 'moderate', notes: 'Pelvic stability and core engagement' },
    { offset: 10, title: 'Lap Swimming & Water Drills', type: 'swimming', time: '16:30', dur: 45, intensity: 'moderate', notes: 'Freestyle and breaststroke drills' },
    { offset: 11, title: 'Shoulders & Arms Hypertrophy', type: 'strength', time: '17:30', dur: 40, intensity: 'intense', notes: 'Overhead press, lateral raises, dips' },
    { offset: 12, title: 'Weekend Long Distance Ride', type: 'cycling', time: '09:00', dur: 60, intensity: 'moderate', notes: 'Scenic loop road cycling' },
    { offset: 13, title: 'Full Body Passive Recovery', type: 'rest', time: '19:00', dur: 20, intensity: 'light', notes: 'Foam rolling and deep sleep preparation' },
  ];

  const exercises: ExercisePlan[] = defaultWorkouts.map((w, index) => ({
    id: `plan-${index}-${next14[w.offset]}`,
    date: next14[w.offset],
    title: w.title,
    type: w.type,
    targetDurationMin: w.dur,
    plannedTime: w.time,
    completed: w.offset === 0 ? false : false,
    intensity: w.intensity,
    notes: w.notes,
  }));

  const logs: Record<string, DailyHabitLog> = {
    [todayStr]: {
      date: todayStr,
      habitsCompleted: {
        'habit-water': false,
        'habit-sleep': true,
        'habit-exercise': false,
        'habit-stretch': true,
        'habit-reading': false,
      },
      waterIntakeMl: 1250, // 5 glasses of 250ml
      waterTargetMl: 2000,
      sleepHours: 7.5,
      sleepTargetHours: 8,
      sleepQuality: 'good',
      sleepBedTime: '23:15',
      sleepWakeTime: '06:45',
      notes: 'Feeling energized today! Ready for evening run.',
    },
  };

  const reminders: CalendarReminder[] = [
    {
      id: 'rem-1',
      title: 'Afternoon Hydration Check-in (Drink 250ml)',
      description: 'Drink a fresh glass of water to keep your daily hydration target on track.',
      date: todayStr,
      time: '14:30',
      category: 'water',
      leadTimeMinutes: 10,
      status: 'pending',
      soundEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-2',
      title: 'Upcoming Workout: Morning 5km Tempo Run',
      description: 'Lace up running shoes, drink some water, and do 5-min dynamic warm-up.',
      date: todayStr,
      time: '18:00',
      category: 'exercise',
      linkedExerciseId: exercises[0]?.id,
      leadTimeMinutes: 15,
      status: 'pending',
      soundEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-3',
      title: 'Strength Session: Upper Body & Core',
      description: 'Prep workout space and stretch shoulders.',
      date: next14[1],
      time: '17:30',
      category: 'exercise',
      linkedExerciseId: exercises[1]?.id,
      leadTimeMinutes: 30,
      status: 'pending',
      soundEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-4',
      title: 'Bedtime Wind-down & Digital Sunset',
      description: 'Turn off screens, lower lights, prepare for 8h quality rest.',
      date: todayStr,
      time: '22:30',
      category: 'sleep',
      leadTimeMinutes: 30,
      status: 'pending',
      soundEnabled: true,
      createdAt: new Date().toISOString(),
    },
  ];

  return { habits: DEFAULT_HABITS, logs, exercises, reminders };
}

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HABITS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_HABITS;
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
  } catch {}
}

export function loadLogs(): Record<string, DailyHabitLog> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getInitialSeedData().logs;
}

export function saveLogs(logs: Record<string, DailyHabitLog>): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch {}
}

export function loadExercises(): ExercisePlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXERCISES);
    if (raw) {
      const parsed: ExercisePlan[] = JSON.parse(raw);
      // Ensure there are plans for the current 14 days
      const currentDays = getNext14Days();
      if (parsed.length > 0 && parsed.some(p => currentDays.includes(p.date))) {
        return parsed;
      }
    }
  } catch {}
  return getInitialSeedData().exercises;
}

export function saveExercises(exercises: ExercisePlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(exercises));
  } catch {}
}

export function loadReminders(): CalendarReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getInitialSeedData().reminders;
}

export function saveReminders(reminders: CalendarReminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
  } catch {}
}
