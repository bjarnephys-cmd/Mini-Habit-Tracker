import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Dumbbell,
  Plus,
  Flame,
  Clock,
  Bell,
  Trash2,
  Edit2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExercisePlan, ExerciseType, ReminderLeadTime } from '../types';
import {
  formatDateToISO,
  formatFriendlyDate,
  formatDayOfWeek,
  formatDayNumber,
  formatMonthName,
  getNext14Days,
} from '../utils/date';
import { playCheckChime } from '../utils/audio';

interface TwoWeekExercisePlannerProps {
  exercises: ExercisePlan[];
  onToggleExerciseDone: (id: string) => void;
  onSaveExercise: (exercise: ExercisePlan, scheduleReminder: boolean, reminderLeadTime: ReminderLeadTime) => void;
  onDeleteExercise: (id: string) => void;
  onApplyPresetTemplate: (templateType: 'balanced' | 'runner' | 'strength') => void;
  onOpenReminderModalForExercise: (exercise: ExercisePlan) => void;
  soundMuted: boolean;
}

const EXERCISE_ICONS: Record<ExerciseType, { label: string; color: string; bg: string }> = {
  running: { label: 'Running', color: 'text-amber-600', bg: 'bg-amber-100' },
  strength: { label: 'Strength', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  cycling: { label: 'Cycling', color: 'text-sky-600', bg: 'bg-sky-100' },
  yoga: { label: 'Yoga & Mobility', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  hiit: { label: 'HIIT & Cardio', color: 'text-rose-600', bg: 'bg-rose-100' },
  swimming: { label: 'Swimming', color: 'text-cyan-600', bg: 'bg-cyan-100' },
  walking: { label: 'Walk & Recover', color: 'text-teal-600', bg: 'bg-teal-100' },
  pilates: { label: 'Pilates', color: 'text-purple-600', bg: 'bg-purple-100' },
  rest: { label: 'Rest Day', color: 'text-slate-500', bg: 'bg-slate-100' },
};

export const TwoWeekExercisePlanner: React.FC<TwoWeekExercisePlannerProps> = ({
  exercises,
  onToggleExerciseDone,
  onSaveExercise,
  onDeleteExercise,
  onApplyPresetTemplate,
  onOpenReminderModalForExercise,
  soundMuted,
}) => {
  const next14Days = getNext14Days();
  const todayStr = next14Days[0];

  const [viewMode, setViewMode] = useState<'all' | 'week1' | 'week2'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExercisePlan | null>(null);

  // Form states
  const [modalDate, setModalDate] = useState<string>(todayStr);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ExerciseType>('running');
  const [modalDuration, setModalDuration] = useState(30);
  const [modalTime, setModalTime] = useState('08:00');
  const [modalIntensity, setModalIntensity] = useState<ExercisePlan['intensity']>('moderate');
  const [modalNotes, setModalNotes] = useState('');
  const [modalCreateReminder, setModalCreateReminder] = useState(true);
  const [modalLeadTime, setModalLeadTime] = useState<ReminderLeadTime>(15);

  // Filter days based on tab
  const displayedDays =
    viewMode === 'week1'
      ? next14Days.slice(0, 7)
      : viewMode === 'week2'
      ? next14Days.slice(7, 14)
      : next14Days;

  // Exercise statistics across the 14 days
  const totalPlannedWorkouts = exercises.filter((e) => next14Days.includes(e.date) && e.type !== 'rest').length;
  const completedWorkouts = exercises.filter(
    (e) => next14Days.includes(e.date) && e.type !== 'rest' && e.completed
  ).length;
  const totalMinutes = exercises
    .filter((e) => next14Days.includes(e.date) && e.type !== 'rest')
    .reduce((acc, curr) => acc + (curr.targetDurationMin || 0), 0);
  const adherencePercent =
    totalPlannedWorkouts > 0 ? Math.round((completedWorkouts / totalPlannedWorkouts) * 100) : 0;

  const handleToggle = (id: string, isNowDone: boolean) => {
    if (isNowDone && !soundMuted) {
      playCheckChime();
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
    onToggleExerciseDone(id);
  };

  const openCreateModal = (dateStr: string) => {
    setEditingExercise(null);
    setModalDate(dateStr);
    setModalTitle('');
    setModalType('running');
    setModalDuration(30);
    setModalTime('08:00');
    setModalIntensity('moderate');
    setModalNotes('');
    setModalCreateReminder(true);
    setModalLeadTime(15);
    setShowModal(true);
  };

  const openEditModal = (plan: ExercisePlan) => {
    setEditingExercise(plan);
    setModalDate(plan.date);
    setModalTitle(plan.title);
    setModalType(plan.type);
    setModalDuration(plan.targetDurationMin);
    setModalTime(plan.plannedTime);
    setModalIntensity(plan.intensity);
    setModalNotes(plan.notes || '');
    setModalCreateReminder(false);
    setModalLeadTime(15);
    setShowModal(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    const newOrUpdatedPlan: ExercisePlan = {
      id: editingExercise ? editingExercise.id : `plan-${Date.now()}`,
      date: modalDate,
      title: modalTitle.trim(),
      type: modalType,
      targetDurationMin: Number(modalDuration) || 30,
      plannedTime: modalTime,
      completed: editingExercise ? editingExercise.completed : false,
      intensity: modalIntensity,
      notes: modalNotes.trim(),
    };

    onSaveExercise(newOrUpdatedPlan, modalCreateReminder, modalLeadTime);
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & 2-Week Adherence Progress Bar */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Next 14 Days Planner</span>
              <span>·</span>
              <span className="text-sky-700">Exercise Horizon</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              2-Week Exercise Calendar
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Structure your workouts for the next two weeks. Add custom sessions and schedule timely reminders.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-xs text-slate-500 font-medium">Planned Workouts</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {completedWorkouts}/{totalPlannedWorkouts}
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-sky-50 border border-sky-200 text-right">
              <div className="text-xs text-sky-700 font-medium">Target Minutes</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-sky-800 mt-0.5">
                {totalMinutes}m
              </div>
            </div>
          </div>
        </div>

        {/* Adherence Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
            <span>2-Week Exercise Adherence</span>
            <span className="font-mono tabular-nums">{adherencePercent}% completed</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-linear-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>
        </div>

        {/* View Controls & Template Presets */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 14 Days
            </button>
            <button
              onClick={() => setViewMode('week1')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'week1'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week 1 (Days 1–7)
            </button>
            <button
              onClick={() => setViewMode('week2')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'week2'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week 2 (Days 8–14)
            </button>
          </div>

          {/* Preset Routines */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Templates:</span>
            <button
              onClick={() => onApplyPresetTemplate('balanced')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Apply balanced mix of cardio, strength, and mobility"
            >
              Balanced Mix
            </button>
            <button
              onClick={() => onApplyPresetTemplate('runner')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Apply runner's 2-week plan"
            >
              Runner's Plan
            </button>
            <button
              onClick={() => openCreateModal(todayStr)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Workout</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Calendar Grid View (Interface Element 3) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">14-Day Calendar Matrix</h2>
          <span className="text-xs text-slate-500">
            Click any workout to toggle completion or edit schedule
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {displayedDays.map((dateStr, index) => {
            const isToday = dateStr === todayStr;
            const dayWorkouts = exercises.filter((e) => e.date === dateStr);

            return (
              <div
                key={dateStr}
                className={`min-h-[220px] rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                  isToday
                    ? 'bg-sky-50/50 border-sky-300 ring-1 ring-sky-300/40 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Day Header */}
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {formatDayOfWeek(dateStr)}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {formatDayNumber(dateStr)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatMonthName(dateStr)}
                        </span>
                      </div>
                    </div>

                    {isToday && (
                      <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day's Planned Workouts */}
                  <div className="mt-3 space-y-2">
                    {dayWorkouts.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-slate-400 italic">Rest / Open</p>
                      </div>
                    ) : (
                      dayWorkouts.map((workout) => {
                        const style = EXERCISE_ICONS[workout.type] || EXERCISE_ICONS.running;

                        return (
                          <div
                            key={workout.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              workout.completed
                                ? 'bg-slate-50 border-slate-200 opacity-80'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {/* Interactive Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => handleToggle(workout.id, !workout.completed)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                    workout.completed
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-emerald-500 bg-white'
                                  }`}
                                  title={workout.completed ? 'Mark uncompleted' : 'Mark completed'}
                                >
                                  {workout.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>

                                <div className="min-w-0">
                                  <div
                                    className={`text-xs font-bold truncate ${
                                      workout.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                    }`}
                                  >
                                    {workout.title}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => onOpenReminderModalForExercise(workout)}
                                  className="text-slate-400 hover:text-amber-600 p-0.5 rounded transition-colors"
                                  title="Add reminder for this workout"
                                >
                                  <Bell className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openEditModal(workout)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                  title="Edit workout"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                              <span>{workout.plannedTime}</span>
                              <span className="font-semibold text-slate-700">{workout.targetDurationMin}m</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Day Footer Action */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openCreateModal(dateStr)}
                    className="w-full py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Plan Workout</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plan/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingExercise ? 'Edit Exercise Plan' : 'Plan New Workout'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure exercise details, duration, time, and automatic reminder.
            </p>

            <form onSubmit={handleModalSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workout Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5km Morning Run, Leg Day Squats"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                  <select
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {next14Days.map((d) => (
                      <option key={d} value={d}>
                        {formatFriendlyDate(d)} ({d})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise Type</label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as ExerciseType)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="running">Running</option>
                    <option value="strength">Strength Training</option>
                    <option value="cycling">Cycling</option>
                    <option value="yoga">Yoga &amp; Mobility</option>
                    <option value="hiit">HIIT &amp; Cardio</option>
                    <option value="swimming">Swimming</option>
                    <option value="walking">Walking / Recovery</option>
                    <option value="pilates">Pilates</option>
                    <option value="rest">Rest Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    step="5"
                    value={modalDuration}
                    onChange={(e) => setModalDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Time</label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Intensity</label>
                  <select
                    value={modalIntensity}
                    onChange={(e) => setModalIntensity(e.target.value as ExercisePlan['intensity'])}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white capitalize"
                  >
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="intense">Intense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workout Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bring water bottle, stretch hamstrings first"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Automatic Reminder Section with Self-Chosen Lead Time */}
              {!editingExercise && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                      <input
                        type="checkbox"
                        checked={modalCreateReminder}
                        onChange={(e) => setModalCreateReminder(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Schedule Calendar Reminder for this workout</span>
                    </label>
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>

                  {modalCreateReminder && (
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Get reminded before event:
                      </label>
                      <select
                        value={modalLeadTime}
                        onChange={(e) => setModalLeadTime(Number(e.target.value) as ReminderLeadTime)}
                        className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        <option value={0}>At time of event (0 min)</option>
                        <option value={5}>5 minutes before</option>
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                        <option value={60}>1 hour before</option>
                        <option value={120}>2 hours before</option>
                        <option value={1440}>1 day before</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingExercise ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteExercise(editingExercise.id);
                      setShowModal(false);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
                  >
                    {editingExercise ? 'Save Changes' : 'Schedule Workout'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
