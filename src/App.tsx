import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Header } from './components/Header';
import { DailyHabitTracker } from './components/DailyHabitTracker';
import { TwoWeekExercisePlanner } from './components/TwoWeekExercisePlanner';
import { RemindersManager } from './components/RemindersManager';
import { NotificationBanner } from './components/NotificationBanner';
import { AiAssistantModal } from './components/AiAssistantModal';
import { HistoryAndTrends } from './components/HistoryAndTrends';
import { AuthModal } from './components/AuthModal';
import { User } from 'firebase/auth';
import { subscribeToAuth, logoutUser } from './services/authService';
import { saveBoardToCloud, subscribeToCloudBoard } from './services/syncService';
import {
  Habit,
  DailyHabitLog,
  ExercisePlan,
  CalendarReminder,
  ReminderLeadTime,
} from './types';
import {
  loadHabits,
  saveHabits,
  loadLogs,
  saveLogs,
  loadExercises,
  saveExercises,
  loadReminders,
  saveReminders,
  DEFAULT_HABITS,
} from './utils/storage';
import {
  formatDateToISO,
  getNext14Days,
  parseEventDateTime,
  formatLeadTimeText,
} from './utils/date';
import { playReminderChime, playCheckChime } from './utils/audio';

export default function App() {
  const [, startTransition] = useTransition();

  // Primary data states
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [logs, setLogs] = useState<Record<string, DailyHabitLog>>(() => loadLogs());
  const [exercises, setExercises] = useState<ExercisePlan[]>(() => loadExercises());
  const [reminders, setReminders] = useState<CalendarReminder[]>(() => loadReminders());

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'today' | 'planner' | 'reminders' | 'history'>('today');
  const [soundMuted, setSoundMuted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Triggered reminder alert list (currently active alerts)
  const [activeTriggeredReminders, setActiveTriggeredReminders] = useState<CalendarReminder[]>([]);

  // Quick reminder modal state
  const [quickReminderModal, setQuickReminderModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    category: CalendarReminder['category'];
    date: string;
    time: string;
    leadTimeMinutes: ReminderLeadTime;
  } | null>(null);

  // AI Assistant Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalInitialPrompt, setAiModalInitialPrompt] = useState('Remind me to drink water daily');

  // Cloud Sync & Auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isSyncingFromCloudRef = useRef(false);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore Cloud Board when user is logged in
  useEffect(() => {
    if (!currentUser) return;
    const isGoogle = currentUser.providerData.some((p) => p.providerId === 'google.com');
    // If signed up via email/password and not yet verified, skip cloud read until verified
    if (!isGoogle && !currentUser.emailVerified) {
      return;
    }

    const unsubscribe = subscribeToCloudBoard(
      currentUser.uid,
      (cloudData) => {
        isSyncingFromCloudRef.current = true;
        if (cloudData.habits && Array.isArray(cloudData.habits) && cloudData.habits.length > 0) {
          setHabits(cloudData.habits);
        }
        if (cloudData.logs && typeof cloudData.logs === 'object') {
          setLogs((prev) => ({ ...prev, ...cloudData.logs }));
        }
        if (cloudData.exercises && Array.isArray(cloudData.exercises)) {
          setExercises(cloudData.exercises);
        }
        if (cloudData.reminders && Array.isArray(cloudData.reminders)) {
          setReminders(cloudData.reminders);
        }
        setTimeout(() => {
          isSyncingFromCloudRef.current = false;
        }, 500);
      },
      (err) => {
        console.warn('Could not sync from cloud:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Debounced auto-save to Firestore Cloud when user is logged in
  useEffect(() => {
    if (!currentUser || isSyncingFromCloudRef.current) return;
    const isGoogle = currentUser.providerData.some((p) => p.providerId === 'google.com');
    if (!isGoogle && !currentUser.emailVerified) return;

    const timer = setTimeout(async () => {
      try {
        await saveBoardToCloud(currentUser.uid, {
          habits,
          logs,
          exercises,
          reminders,
        });
      } catch (err) {
        console.error('Failed to save board to cloud:', err);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentUser, habits, logs, exercises, reminders]);

  const handleOpenAiModal = (prompt?: string) => {
    if (prompt) {
      setAiModalInitialPrompt(prompt);
    }
    setIsAiModalOpen(true);
  };

  const handleApplyAiSuggestions = (data: {
    habitsToAdd: Habit[];
    exercisesToAdd: ExercisePlan[];
    remindersToAdd: CalendarReminder[];
  }) => {
    if (data.habitsToAdd.length > 0) {
      setHabits((prev) => [...prev, ...data.habitsToAdd]);
    }
    if (data.exercisesToAdd.length > 0) {
      setExercises((prev) => [...prev, ...data.exercisesToAdd]);
    }
    if (data.remindersToAdd.length > 0) {
      setReminders((prev) => [...data.remindersToAdd, ...prev]);
    }
  };

  const next14Days = getNext14Days();
  const todayStr = next14Days[0];

  // Ensure current day's log exists
  const currentLog: DailyHabitLog = logs[todayStr] || {
    date: todayStr,
    habitsCompleted: {},
    waterIntakeMl: 0,
    waterTargetMl: 2000,
    sleepHours: 7,
    sleepTargetHours: 8,
    sleepQuality: 'good',
    sleepBedTime: '23:00',
    sleepWakeTime: '07:00',
    notes: '',
  };

  // Find today's workout if scheduled
  const todayExercise = exercises.find((e) => e.date === todayStr);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save changes to storage
  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveExercises(exercises);
  }, [exercises]);

  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  const handleImportData = (imported: {
    habits?: Habit[];
    logs?: Record<string, DailyHabitLog>;
    exercises?: ExercisePlan[];
    reminders?: CalendarReminder[];
  }) => {
    if (imported.habits && Array.isArray(imported.habits)) {
      setHabits(imported.habits);
    }
    if (imported.logs && typeof imported.logs === 'object') {
      setLogs((prev) => ({ ...prev, ...imported.logs }));
    }
    if (imported.exercises && Array.isArray(imported.exercises)) {
      setExercises(imported.exercises);
    }
    if (imported.reminders && Array.isArray(imported.reminders)) {
      setReminders(imported.reminders);
    }
    if (!soundMuted) {
      playCheckChime();
    }
  };

  // Real-time Reminder engine: scans every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setReminders((prevReminders) => {
        let hasChanges = false;
        const newTriggered: CalendarReminder[] = [];

        const updated = prevReminders.map((reminder) => {
          if (reminder.status !== 'pending') return reminder;

          // Event time
          const eventDate = parseEventDateTime(reminder.date, reminder.time);
          // Trigger time = eventDate - leadTimeMinutes
          const triggerDate = new Date(eventDate.getTime() - reminder.leadTimeMinutes * 60 * 1000);

          // If current time is past trigger time and within the last 30 minutes
          const diffMs = now.getTime() - triggerDate.getTime();
          if (diffMs >= 0 && diffMs <= 30 * 60 * 1000) {
            hasChanges = true;
            newTriggered.push(reminder);
            return {
              ...reminder,
              status: 'triggered' as const,
              triggeredAt: now.toISOString(),
            };
          }
          return reminder;
        });

        if (newTriggered.length > 0) {
          // Play audio chime
          if (!soundMuted) {
            playReminderChime();
          }

          // Browser system notification if granted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            newTriggered.forEach((r) => {
              try {
                new Notification(`HabitFlow: ${r.title}`, {
                  body: `${formatLeadTimeText(r.leadTimeMinutes)} alert for ${r.time}. ${r.description || ''}`,
                  icon: '/favicon.ico',
                });
              } catch {}
            });
          }

          setActiveTriggeredReminders((current) => [...current, ...newTriggered]);
        }

        return hasChanges ? updated : prevReminders;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [soundMuted]);

  // Handlers
  const handleToggleHabit = (habitId: string) => {
    const isNowDone = !currentLog.habitsCompleted[habitId];
    const updatedLog: DailyHabitLog = {
      ...currentLog,
      habitsCompleted: {
        ...currentLog.habitsCompleted,
        [habitId]: isNowDone,
      },
    };

    // If toggled habit is exercise, sync today's exercise plan
    if (habitId === 'habit-exercise' && todayExercise) {
      setExercises((prev) =>
        prev.map((e) => (e.id === todayExercise.id ? { ...e, completed: isNowDone } : e))
      );
    }

    setLogs((prev) => ({
      ...prev,
      [todayStr]: updatedLog,
    }));
  };

  const handleUpdateWater = (newAmountMl: number) => {
    const updatedLog: DailyHabitLog = {
      ...currentLog,
      waterIntakeMl: newAmountMl,
      habitsCompleted: {
        ...currentLog.habitsCompleted,
        'habit-water': newAmountMl >= currentLog.waterTargetMl,
      },
    };
    setLogs((prev) => ({
      ...prev,
      [todayStr]: updatedLog,
    }));
  };

  const handleUpdateSleep = (
    hours: number,
    bedTime: string,
    wakeTime: string,
    quality: DailyHabitLog['sleepQuality']
  ) => {
    const updatedLog: DailyHabitLog = {
      ...currentLog,
      sleepHours: hours,
      sleepBedTime: bedTime,
      sleepWakeTime: wakeTime,
      sleepQuality: quality,
      habitsCompleted: {
        ...currentLog.habitsCompleted,
        'habit-sleep': hours >= (currentLog.sleepTargetHours || 8),
      },
    };
    setLogs((prev) => ({
      ...prev,
      [todayStr]: updatedLog,
    }));
  };

  const handleAddCustomHabit = (
    name: string,
    category: Habit['category'],
    target: number,
    unit: string
  ) => {
    const newHabit: Habit = {
      id: `habit-custom-${Date.now()}`,
      name,
      category,
      targetValue: target,
      unit,
      color: '#475569',
      icon: 'sparkles',
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const handleDeleteCustomHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const handleToggleExerciseDone = (exerciseId: string) => {
    setExercises((prev) => {
      let isDoneNow = false;
      const updated = prev.map((e) => {
        if (e.id === exerciseId) {
          isDoneNow = !e.completed;
          return { ...e, completed: isDoneNow };
        }
        return e;
      });

      // If this is today's exercise, sync habit-exercise checkbox
      if (todayExercise && todayExercise.id === exerciseId) {
        setLogs((prevLogs) => ({
          ...prevLogs,
          [todayStr]: {
            ...currentLog,
            habitsCompleted: {
              ...currentLog.habitsCompleted,
              'habit-exercise': isDoneNow,
            },
          },
        }));
      }

      return updated;
    });
  };

  const handleSaveExercise = (
    exercise: ExercisePlan,
    scheduleReminder: boolean,
    reminderLeadTime: ReminderLeadTime
  ) => {
    setExercises((prev) => {
      const exists = prev.some((e) => e.id === exercise.id);
      if (exists) {
        return prev.map((e) => (e.id === exercise.id ? exercise : e));
      }
      return [...prev, exercise];
    });

    if (scheduleReminder) {
      const newReminder: CalendarReminder = {
        id: `rem-exercise-${Date.now()}`,
        title: `Workout: ${exercise.title}`,
        description: `${exercise.targetDurationMin} min ${exercise.type} session planned for ${exercise.plannedTime}.`,
        date: exercise.date,
        time: exercise.plannedTime,
        category: 'exercise',
        linkedExerciseId: exercise.id,
        leadTimeMinutes: reminderLeadTime,
        status: 'pending',
        soundEnabled: true,
        createdAt: new Date().toISOString(),
      };
      setReminders((prev) => [newReminder, ...prev]);
    }
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    // Also remove associated reminders
    setReminders((prev) => prev.filter((r) => r.linkedExerciseId !== id));
  };

  const handleApplyPresetTemplate = (templateType: 'balanced' | 'runner' | 'strength') => {
    const plans: ExercisePlan[] = [];

    const balancedSchedule: Array<{
      dayOffset: number;
      title: string;
      type: ExercisePlan['type'];
      dur: number;
      time: string;
      intensity: ExercisePlan['intensity'];
      notes: string;
    }> =
      templateType === 'runner'
        ? [
            { dayOffset: 0, title: '5km Easy Morning Run', type: 'running', dur: 30, time: '07:30', intensity: 'light', notes: 'Pace conversation level' },
            { dayOffset: 1, title: 'Hip & Glute Mobility', type: 'yoga', dur: 25, time: '18:00', intensity: 'light', notes: 'Foam roll IT band and calves' },
            { dayOffset: 2, title: '6km Interval Speedwork', type: 'running', dur: 40, time: '07:30', intensity: 'intense', notes: '400m repeats x 6' },
            { dayOffset: 3, title: 'Core Strength & Planks', type: 'strength', dur: 30, time: '18:00', intensity: 'moderate', notes: 'Anti-rotation core exercises' },
            { dayOffset: 4, title: 'Recovery Cross-Training Cycle', type: 'cycling', time: '17:30', dur: 45, intensity: 'moderate', notes: 'Cadence 85-90 RPM' },
            { dayOffset: 5, title: '8km Weekend Long Run', type: 'running', dur: 55, time: '08:30', intensity: 'moderate', notes: 'Hydrate well before starting' },
            { dayOffset: 6, title: 'Gentle Walk & Stretch', type: 'walking', dur: 20, time: '10:00', intensity: 'light', notes: 'Rest day recovery' },
            { dayOffset: 7, title: '5km Tempo Run', type: 'running', dur: 32, time: '07:30', intensity: 'intense', notes: 'Race pace practice' },
            { dayOffset: 8, title: 'Lower Body Prehab & Strength', type: 'strength', dur: 35, time: '18:00', intensity: 'moderate', notes: 'Single leg balance & lunges' },
            { dayOffset: 9, title: '6km Easy Trail Run', type: 'running', dur: 40, time: '08:00', intensity: 'light', notes: 'Soft surface trail running' },
            { dayOffset: 10, title: 'Pilates Core Flow', type: 'pilates', dur: 30, time: '18:00', intensity: 'moderate', notes: 'Posterior chain focus' },
            { dayOffset: 11, title: 'Fast 4km Stride Intervals', type: 'running', dur: 30, time: '07:30', intensity: 'intense', notes: '6x 100m strides at finish' },
            { dayOffset: 12, title: '10km Milestone Long Run', type: 'running', dur: 65, time: '08:30', intensity: 'moderate', notes: 'Pacing discipline' },
            { dayOffset: 13, title: 'Deep Foam Rolling & Yoga', type: 'yoga', dur: 30, time: '19:00', intensity: 'light', notes: 'Full muscular reset' },
          ]
        : templateType === 'strength'
        ? [
            { dayOffset: 0, title: 'Chest, Shoulders & Triceps', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Bench press, overhead press' },
            { dayOffset: 1, title: 'Back, Lats & Biceps', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Pull-ups, bent rows' },
            { dayOffset: 2, title: 'Zone 2 Recovery Cycle', type: 'cycling', dur: 30, time: '08:00', intensity: 'light', notes: 'Low heart rate flush' },
            { dayOffset: 3, title: 'Quads, Hamstrings & Calves', type: 'strength', dur: 50, time: '17:30', intensity: 'intense', notes: 'Squats and Romanian deadlifts' },
            { dayOffset: 4, title: 'Core Stability & Abs', type: 'pilates', dur: 30, time: '18:00', intensity: 'moderate', notes: 'Hanging leg raises, planks' },
            { dayOffset: 5, title: 'Full Body Kettlebell Power', type: 'strength', dur: 40, time: '10:00', intensity: 'intense', notes: 'Clean and press, swings' },
            { dayOffset: 6, title: 'Rest & Gentle Stretch', type: 'rest', dur: 20, time: '11:00', intensity: 'light', notes: 'Complete recovery day' },
            { dayOffset: 7, title: 'Upper Body Hypertrophy', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Dumbbell incline press, rows' },
            { dayOffset: 8, title: 'Lower Body Strength Focus', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Front squats, hip thrusts' },
            { dayOffset: 9, title: 'Recovery Swim / Walk', type: 'swimming', dur: 35, time: '17:00', intensity: 'light', notes: 'Joint decompression' },
            { dayOffset: 10, title: 'Push & Pull Supersets', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Dips and pull-ups superset' },
            { dayOffset: 11, title: 'Deadlifts & Posterior Chain', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Deadlifts and farmer walks' },
            { dayOffset: 12, title: 'Cardio Intervals & Abs', type: 'hiit', dur: 30, time: '10:00', intensity: 'moderate', notes: 'Rowing machine intervals' },
            { dayOffset: 13, title: 'Full Body Passive Recovery', type: 'rest', dur: 20, time: '19:00', intensity: 'light', notes: 'Deep sleep prep' },
          ]
        : [
            { dayOffset: 0, title: 'Morning 5km Tempo Run', type: 'running', dur: 30, time: '08:00', intensity: 'moderate', notes: 'Warm up 5 min, steady pace' },
            { dayOffset: 1, title: 'Upper Body & Core Strength', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Push-ups, pull-ups, dumbbell rows' },
            { dayOffset: 2, title: 'Spine & Hip Mobility Yoga', type: 'yoga', dur: 30, time: '07:30', intensity: 'light', notes: 'Deep stretch and breathing flow' },
            { dayOffset: 3, title: 'High Intensity Interval Blast', type: 'hiit', dur: 35, time: '18:00', intensity: 'intense', notes: 'Tabata 40s on / 20s off' },
            { dayOffset: 4, title: 'Outdoor Cycling Endurance', type: 'cycling', dur: 50, time: '16:00', intensity: 'moderate', notes: 'Zone 2 steady heart rate' },
            { dayOffset: 5, title: 'Lower Body & Legs Focus', type: 'strength', dur: 45, time: '17:30', intensity: 'intense', notes: 'Squats, lunges, calf raises' },
            { dayOffset: 6, title: 'Rest & Guided Nature Walk', type: 'walking', dur: 30, time: '10:00', intensity: 'light', notes: 'Easy recovery walk' },
            { dayOffset: 7, title: 'Progressive Interval Run', type: 'running', dur: 35, time: '08:00', intensity: 'moderate', notes: 'Sprint intervals 1m on / 1m off' },
            { dayOffset: 8, title: 'Full Body Kettlebell Circuit', type: 'strength', dur: 40, time: '17:30', intensity: 'intense', notes: 'Swings, goblet squats, cleans' },
            { dayOffset: 9, title: 'Pilates Core & Alignment', type: 'pilates', dur: 30, time: '07:30', intensity: 'moderate', notes: 'Pelvic stability and core engagement' },
            { dayOffset: 10, title: 'Lap Swimming & Water Drills', type: 'swimming', dur: 45, time: '16:30', intensity: 'moderate', notes: 'Freestyle and breaststroke drills' },
            { dayOffset: 11, title: 'Shoulders & Arms Hypertrophy', type: 'strength', dur: 40, time: '17:30', intensity: 'intense', notes: 'Overhead press, lateral raises' },
            { dayOffset: 12, title: 'Weekend Long Distance Ride', type: 'cycling', dur: 60, time: '09:00', intensity: 'moderate', notes: 'Scenic loop road cycling' },
            { dayOffset: 13, title: 'Full Body Passive Recovery', type: 'rest', dur: 20, time: '19:00', intensity: 'light', notes: 'Foam rolling and deep sleep preparation' },
          ];

    balancedSchedule.forEach((item, index) => {
      const planDate = next14Days[item.dayOffset];
      plans.push({
        id: `template-${item.type}-${index}-${planDate}`,
        date: planDate,
        title: item.title,
        type: item.type,
        targetDurationMin: item.dur,
        plannedTime: item.time,
        completed: false,
        intensity: item.intensity,
        notes: item.notes,
      });
    });

    setExercises(plans);
  };

  const handleAddReminder = (data: Omit<CalendarReminder, 'id' | 'createdAt' | 'status'>) => {
    const newReminder: CalendarReminder = {
      ...data,
      id: `rem-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newReminder, ...prev]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    setActiveTriggeredReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleReminderStatus = (id: string, status: CalendarReminder['status']) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    setActiveTriggeredReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSnoozeReminder = (id: string, minutes: number) => {
    const now = new Date();
    const snoozedEventDate = new Date(now.getTime() + minutes * 60 * 1000);
    const dateStr = formatDateToISO(snoozedEventDate);
    const hours = String(snoozedEventDate.getHours()).padStart(2, '0');
    const mins = String(snoozedEventDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            date: dateStr,
            time: timeStr,
            leadTimeMinutes: 0,
            status: 'pending',
          };
        }
        return r;
      })
    );
    setActiveTriggeredReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCompleteReminder = (id: string) => {
    handleToggleReminderStatus(id, 'completed');
  };

  const handleDismissReminder = (id: string) => {
    handleToggleReminderStatus(id, 'dismissed');
  };

  const handleTriggerTestReminder = () => {
    const testReminder: CalendarReminder = {
      id: `test-${Date.now()}`,
      title: 'Hydration Check & Stretch (Test Alert)',
      description: 'This is a test notification verifying your audio chime and reminder popup alert.',
      date: todayStr,
      time: 'Now',
      category: 'habit',
      leadTimeMinutes: 0,
      status: 'triggered',
      soundEnabled: true,
      createdAt: new Date().toISOString(),
    };

    if (!soundMuted) {
      playReminderChime();
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('HabitFlow Test Alert', {
          body: 'Your reminder alert is working smoothly!',
          icon: '/favicon.ico',
        });
      } catch {}
    }

    setActiveTriggeredReminders((prev) => [testReminder, ...prev]);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch {}
    }
  };

  const handleOpenReminderModalForHabit = (
    habitName: string,
    category: CalendarReminder['category']
  ) => {
    setQuickReminderModal({
      open: true,
      title: `Habit: ${habitName}`,
      description: `Stay consistent with your daily ${habitName.toLowerCase()} commitment.`,
      category,
      date: todayStr,
      time: category === 'sleep' ? '22:30' : category === 'water' ? '14:30' : '18:00',
      leadTimeMinutes: 15,
    });
  };

  const handleOpenReminderModalForExercise = (exercise: ExercisePlan) => {
    setQuickReminderModal({
      open: true,
      title: `Workout: ${exercise.title}`,
      description: `${exercise.targetDurationMin} min ${exercise.type} scheduled for ${exercise.plannedTime}.`,
      category: 'exercise',
      date: exercise.date,
      time: exercise.plannedTime,
      leadTimeMinutes: 15,
    });
  };

  const handleSaveQuickReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReminderModal || !quickReminderModal.title.trim()) return;

    handleAddReminder({
      title: quickReminderModal.title.trim(),
      description: quickReminderModal.description.trim(),
      category: quickReminderModal.category,
      date: quickReminderModal.date,
      time: quickReminderModal.time,
      leadTimeMinutes: quickReminderModal.leadTimeMinutes,
      soundEnabled: true,
    });

    setQuickReminderModal(null);
  };

  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewReminder={() => {
          setQuickReminderModal({
            open: true,
            title: '',
            description: '',
            category: 'task',
            date: todayStr,
            time: '18:00',
            leadTimeMinutes: 15,
          });
        }}
        onOpenAiModal={() => handleOpenAiModal()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={async () => {
          await logoutUser();
          setCurrentUser(null);
        }}
        pendingRemindersCount={pendingRemindersCount}
        soundMuted={soundMuted}
        onToggleSound={() => setSoundMuted((prev) => !prev)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Active Triggered Reminder Alerts */}
        <NotificationBanner
          activeTriggeredReminders={activeTriggeredReminders}
          onDismiss={handleDismissReminder}
          onSnooze={handleSnoozeReminder}
          onComplete={handleCompleteReminder}
          notificationPermission={notificationPermission}
          onRequestNotificationPermission={handleRequestNotificationPermission}
        />

        {/* Tab 1: Today's Habits */}
        {activeTab === 'today' && (
          <DailyHabitTracker
            habits={habits}
            currentLog={currentLog}
            todayExercise={todayExercise}
            onToggleHabit={handleToggleHabit}
            onUpdateWater={handleUpdateWater}
            onUpdateSleep={handleUpdateSleep}
            onAddCustomHabit={handleAddCustomHabit}
            onDeleteCustomHabit={handleDeleteCustomHabit}
            onToggleExerciseDone={handleToggleExerciseDone}
            onOpenPlanner={() => setActiveTab('planner')}
            onOpenReminderModalForHabit={handleOpenReminderModalForHabit}
            onOpenAiAssistant={handleOpenAiModal}
            soundMuted={soundMuted}
          />
        )}

        {/* Tab 2: 2-Week Exercise Planner (Calendar View) */}
        {activeTab === 'planner' && (
          <TwoWeekExercisePlanner
            exercises={exercises}
            onToggleExerciseDone={handleToggleExerciseDone}
            onSaveExercise={handleSaveExercise}
            onDeleteExercise={handleDeleteExercise}
            onApplyPresetTemplate={handleApplyPresetTemplate}
            onOpenReminderModalForExercise={handleOpenReminderModalForExercise}
            soundMuted={soundMuted}
          />
        )}

        {/* Tab 3: Reminders & Calendar Sync */}
        {activeTab === 'reminders' && (
          <RemindersManager
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
            onToggleReminderStatus={handleToggleReminderStatus}
            onTriggerTestReminder={handleTriggerTestReminder}
            onOpenAiAssistant={handleOpenAiModal}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={handleRequestNotificationPermission}
            soundMuted={soundMuted}
          />
        )}

        {/* Tab 4: History & Multi-Week Trends */}
        {activeTab === 'history' && (
          <HistoryAndTrends
            habits={habits}
            logs={logs}
            exercises={exercises}
            reminders={reminders}
            onImportData={handleImportData}
            onOpenAiAssistant={handleOpenAiModal}
          />
        )}

      </main>

      {/* Quick Reminder Modal */}
      {quickReminderModal && quickReminderModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Set Calendar Reminder</h3>
            <p className="text-xs text-slate-500 mt-1">
              Choose an event time and self-chosen lead time for the alert.
            </p>

            <form onSubmit={handleSaveQuickReminder} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Water Break, 5km Run"
                  value={quickReminderModal.title}
                  onChange={(e) =>
                    setQuickReminderModal({ ...quickReminderModal, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <select
                    value={quickReminderModal.date}
                    onChange={(e) =>
                      setQuickReminderModal({ ...quickReminderModal, date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {next14Days.map((d) => (
                      <option key={d} value={d}>
                        {d === todayStr ? 'Today' : d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Time</label>
                  <input
                    type="time"
                    required
                    value={quickReminderModal.time}
                    onChange={(e) =>
                      setQuickReminderModal({ ...quickReminderModal, time: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Self-Chosen Lead Time */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                <label className="block text-xs font-bold text-amber-950 mb-1.5">
                  When should you be reminded? (Self-chosen lead time)
                </label>
                <select
                  value={quickReminderModal.leadTimeMinutes}
                  onChange={(e) =>
                    setQuickReminderModal({
                      ...quickReminderModal,
                      leadTimeMinutes: Number(e.target.value) as ReminderLeadTime,
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value={0}>At time of event (0 min)</option>
                  <option value={5}>5 minutes before event</option>
                  <option value={10}>10 minutes before event</option>
                  <option value={15}>15 minutes before event</option>
                  <option value={30}>30 minutes before event</option>
                  <option value={60}>1 hour before event</option>
                  <option value={120}>2 hours before event</option>
                  <option value={1440}>1 day before event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bring gear, drink water first"
                  value={quickReminderModal.description}
                  onChange={(e) =>
                    setQuickReminderModal({ ...quickReminderModal, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickReminderModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini 3.8 AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentHabits={habits}
        onApplyAiSuggestions={handleApplyAiSuggestions}
        soundMuted={soundMuted}
        initialPrompt={aiModalInitialPrompt}
      />

      {/* Cloud Account & Cross-Device Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span>HabitFlow · Daily Habits &amp; 2-Week Exercise Planner</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Checkboxes &amp; Streaks</span>
            <span aria-hidden="true">·</span>
            <span>Progress Bars &amp; Gauges</span>
            <span aria-hidden="true">·</span>
            <span>14-Day Calendar Matrix</span>
            <span aria-hidden="true">·</span>
            <span>Custom Lead-Time Reminders</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
