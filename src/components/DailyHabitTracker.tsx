import React, { useState } from 'react';
import {
  Check,
  Droplets,
  Moon,
  Dumbbell,
  Sparkles,
  Plus,
  Flame,
  Clock,
  ChevronRight,
  Smile,
  Minus,
  CheckCircle2,
  Bell,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, DailyHabitLog, ExercisePlan } from '../types';
import { playCheckChime, playWaterSipSound } from '../utils/audio';
import { AiCoachWidget } from './AiCoachWidget';

interface DailyHabitTrackerProps {
  habits: Habit[];
  currentLog: DailyHabitLog;
  todayExercise?: ExercisePlan;
  onToggleHabit: (habitId: string) => void;
  onUpdateWater: (newAmountMl: number) => void;
  onUpdateSleep: (hours: number, bedTime: string, wakeTime: string, quality: DailyHabitLog['sleepQuality']) => void;
  onAddCustomHabit: (name: string, category: Habit['category'], target: number, unit: string) => void;
  onDeleteCustomHabit: (habitId: string) => void;
  onToggleExerciseDone: (exerciseId: string) => void;
  onOpenPlanner: () => void;
  onOpenReminderModalForHabit: (habitName: string, category: 'exercise' | 'water' | 'sleep' | 'habit') => void;
  onOpenAiAssistant: (initialPrompt?: string) => void;
  soundMuted: boolean;
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({
  habits,
  currentLog,
  todayExercise,
  onToggleHabit,
  onUpdateWater,
  onUpdateSleep,
  onAddCustomHabit,
  onDeleteCustomHabit,
  onToggleExerciseDone,
  onOpenPlanner,
  onOpenReminderModalForHabit,
  onOpenAiAssistant,
  soundMuted,
}) => {
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitTarget, setNewHabitTarget] = useState(1);
  const [newHabitUnit, setNewHabitUnit] = useState('times');

  // Sleep local state
  const [sleepHours, setSleepHours] = useState(currentLog.sleepHours);
  const [bedTime, setBedTime] = useState(currentLog.sleepBedTime || '23:00');
  const [wakeTime, setWakeTime] = useState(currentLog.sleepWakeTime || '07:00');
  const [sleepQuality, setSleepQuality] = useState<DailyHabitLog['sleepQuality']>(currentLog.sleepQuality || 'good');
  const [sleepSavedToast, setSleepSavedToast] = useState(false);

  // Compute daily progress
  const totalHabits = habits.length;
  const completedCount = habits.filter((h) => currentLog.habitsCompleted[h.id]).length;
  const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Water calculation
  const waterGlasses = Math.round(currentLog.waterIntakeMl / 250);
  const totalTargetGlasses = Math.max(1, Math.round(currentLog.waterTargetMl / 250));
  const waterPercent = Math.min(100, Math.round((currentLog.waterIntakeMl / currentLog.waterTargetMl) * 100));

  // Sleep percentage
  const sleepPercent = Math.min(100, Math.round((sleepHours / (currentLog.sleepTargetHours || 8)) * 100));

  const handleHabitClick = (habitId: string) => {
    const isNowDone = !currentLog.habitsCompleted[habitId];
    if (isNowDone && !soundMuted) {
      playCheckChime();
    }
    // Confetti if this check completes all habits
    if (isNowDone && completedCount + 1 === totalHabits) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
    onToggleHabit(habitId);
  };

  const handleAddWater = (deltaMl: number) => {
    const updated = Math.max(0, currentLog.waterIntakeMl + deltaMl);
    if (!soundMuted && deltaMl > 0) {
      playWaterSipSound();
    }
    onUpdateWater(updated);
  };

  const handleSetGlassCount = (targetGlassIndex: number) => {
    const updated = (targetGlassIndex + 1) * 250;
    if (!soundMuted) {
      playWaterSipSound();
    }
    onUpdateWater(updated);
  };

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSleep(Number(sleepHours), bedTime, wakeTime, sleepQuality);
    setSleepSavedToast(true);
    setTimeout(() => setSleepSavedToast(false), 2000);
  };

  const handleCreateCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddCustomHabit(newHabitName.trim(), 'custom', Number(newHabitTarget) || 1, newHabitUnit.trim() || 'times');
    setNewHabitName('');
    setShowAddHabitModal(false);
  };

  return (
    <div className="space-y-8">
      {/* AI Habit & Notification Copilot */}
      <AiCoachWidget
        stats={{
          habitsCount: totalHabits,
          completedCount: completedCount,
          waterIntake: currentLog.waterIntakeMl,
          waterTarget: currentLog.waterTargetMl,
          sleepHours: sleepHours,
          sleepQuality: sleepQuality,
          todayWorkout: todayExercise ? { title: todayExercise.title, completed: todayExercise.completed } : null,
        }}
        onOpenAiAssistant={onOpenAiAssistant}
      />

      {/* 1. Overall Daily Progress Header & Metric Bar */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Today's Daily Rhythm</span>
              <span>·</span>
              <span className="text-emerald-700">Live Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Keep Your Momentum Flowing
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Check off daily commitments, maintain hydration, and support restorative sleep.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-xs text-slate-500 font-medium">Daily Completion</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {progressPercent}%
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-right">
              <div className="text-xs text-emerald-700 font-medium">Habits Done</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-0.5">
                {completedCount}/{totalHabits}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Element */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
            <span>Overall Daily Progress</span>
            <span className="font-mono tabular-nums">{completedCount} of {totalHabits} habits completed</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Interactive Checkboxes & Habit List */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Habit Check-off</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click checkbox to toggle completion and hear satisfying feedback
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAiAssistant('Suggest 3 healthy daily habits with reminder schedules')}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Ask AI to generate habit suggestions"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Suggest</span>
            </button>
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Habit</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {habits.map((habit) => {
            const isCompleted = !!currentLog.habitsCompleted[habit.id];

            return (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Left: Interactive Checkbox + Title */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleHabitClick(habit.id)}
                    aria-label={`Mark ${habit.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-105'
                        : 'border-slate-300 hover:border-emerald-500 bg-white'
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="truncate">
                    <span
                      onClick={() => handleHabitClick(habit.id)}
                      className={`text-sm font-semibold cursor-pointer select-none transition-colors ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {habit.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Target: {habit.targetValue} {habit.unit}</span>
                      {habit.category === 'exercise' && todayExercise && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-medium">
                            Today: {todayExercise.title} ({todayExercise.targetDurationMin}m)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Reminder & Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      onOpenReminderModalForHabit(
                        habit.name,
                        habit.category === 'custom' ? 'habit' : habit.category
                      )
                    }
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title={`Set reminder for ${habit.name}`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  {habit.category === 'custom' && (
                    <button
                      onClick={() => onDeleteCustomHabit(habit.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Water Drinking Tracker & Sleep Tracker (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* WATER TRACKER WITH PROGRESS BAR & CUPS */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hydration Tracker</h3>
                  <p className="text-xs text-slate-500">Target: {currentLog.waterTargetMl} ml ({totalTargetGlasses} glasses)</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold font-mono tabular-nums text-sky-700">
                  {currentLog.waterIntakeMl}
                </span>
                <span className="text-xs text-slate-500 font-mono"> / {currentLog.waterTargetMl} ml</span>
              </div>
            </div>

            {/* Progress Bar Element */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Hydration Progress</span>
                <span className="font-mono tabular-nums font-semibold text-sky-700">{waterPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-linear-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>

            {/* Interactive Cups Grid */}
            <div className="mt-6">
              <div className="text-xs text-slate-500 font-medium mb-2.5">
                Tap a glass to log intake (250ml each):
              </div>
              <div className="grid grid-cols-8 gap-2">
                {Array.from({ length: 8 }).map((_, index) => {
                  const isFilled = index < waterGlasses;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSetGlassCount(index)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all border ${
                        isFilled
                          ? 'bg-sky-500 border-sky-600 text-white shadow-xs scale-102'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-sky-300 hover:bg-sky-50/50'
                      }`}
                      title={`Glass ${index + 1} (${(index + 1) * 250}ml)`}
                    >
                      <Droplets className={`w-3.5 h-3.5 ${isFilled ? 'fill-current' : ''}`} />
                      <span className="text-[10px] mt-0.5">{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => handleAddWater(-250)}
              disabled={currentLog.waterIntakeMl <= 0}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>-250 ml</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAiAssistant('Remind me to drink water daily')}
                className="px-2.5 py-1.5 text-xs text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg font-medium flex items-center gap-1 transition-colors"
                title="Generate daily water reminders using AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>AI Water Reminders</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenReminderModalForHabit('Drink Water', 'water')}
                className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Custom Alert</span>
              </button>
            </div>

            <button
              onClick={() => handleAddWater(250)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+250 ml (1 Cup)</span>
            </button>
          </div>
        </section>

        {/* SLEEP TRACKER WITH PROGRESS BAR & QUALITY RATINGS */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSaveSleep}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sleep &amp; Recovery</h3>
                  <p className="text-xs text-slate-500">Target: {currentLog.sleepTargetHours || 8} hours</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold font-mono tabular-nums text-indigo-700">
                  {sleepHours}h
                </span>
                <span className="text-xs text-slate-500 font-mono"> / {currentLog.sleepTargetHours || 8}h</span>
              </div>
            </div>

            {/* Progress Bar Element */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Sleep Target Met</span>
                <span className="font-mono tabular-nums font-semibold text-indigo-700">{sleepPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${sleepPercent}%` }}
                />
              </div>
            </div>

            {/* Inputs: Sleep Hours, Bed Time, Wake Time */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hours Slept</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bedtime</label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Wake Up</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Quality Selector */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Sleep Quality</label>
              <div className="grid grid-cols-4 gap-2">
                {(['poor', 'fair', 'good', 'great'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSleepQuality(q)}
                    className={`py-1.5 text-xs font-semibold capitalize rounded-lg border transition-colors ${
                      sleepQuality === q
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenReminderModalForHabit('Sleep Wind-down', 'sleep')}
                className="text-xs text-indigo-700 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Bedtime Alert</span>
              </button>

              <div className="flex items-center gap-2">
                {sleepSavedToast && (
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Save Sleep
                </button>
              </div>
            </div>
          </form>
        </section>

      </div>

      {/* 4. Today's Exercise Spotlight (Direct connection to 2-week plan) */}
      <section className="bg-linear-to-r from-emerald-50 to-teal-50/70 border border-emerald-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                <span>Today's Exercise Plan</span>
                <span>·</span>
                <span>2-Week Schedule</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {todayExercise ? todayExercise.title : 'No exercise scheduled for today'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {todayExercise
                  ? `${todayExercise.targetDurationMin} min target at ${todayExercise.plannedTime} · ${todayExercise.intensity} intensity · ${todayExercise.notes || ''}`
                  : 'Open the 2-week calendar to schedule running, strength, cycling, or yoga!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {todayExercise ? (
              <button
                onClick={() => onToggleExerciseDone(todayExercise.id)}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs ${
                  todayExercise.completed
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300'
                }`}
              >
                <Check className={`w-4 h-4 ${todayExercise.completed ? 'stroke-[3]' : ''}`} />
                <span>{todayExercise.completed ? 'Workout Done!' : 'Mark Finished'}</span>
              </button>
            ) : null}

            <button
              onClick={onOpenPlanner}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-900 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>View 2-Week Plan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Add Custom Habit Modal */}
      {showAddHabitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Add New Habit</h3>
            <p className="text-xs text-slate-500 mt-1">Create a custom routine to track every day.</p>

            <form onSubmit={handleCreateCustomHabit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15min Meditation, Take Vitamins"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Target</label>
                  <input
                    type="number"
                    min="1"
                    value={newHabitTarget}
                    onChange={(e) => setNewHabitTarget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="times, mins, pages"
                    value={newHabitUnit}
                    onChange={(e) => setNewHabitUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
