import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Check,
  CalendarPlus,
  Download,
  ExternalLink,
  Volume2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CalendarReminder, ReminderLeadTime } from '../types';
import { formatFriendlyDate, formatLeadTimeText, getNext14Days } from '../utils/date';
import { createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarExport';
import { playReminderChime } from '../utils/audio';

interface RemindersManagerProps {
  reminders: CalendarReminder[];
  onAddReminder: (reminder: Omit<CalendarReminder, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminderStatus: (id: string, status: CalendarReminder['status']) => void;
  onTriggerTestReminder: () => void;
  onOpenAiAssistant?: (initialPrompt?: string) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  soundMuted: boolean;
}

export const RemindersManager: React.FC<RemindersManagerProps> = ({
  reminders,
  onAddReminder,
  onDeleteReminder,
  onToggleReminderStatus,
  onTriggerTestReminder,
  onOpenAiAssistant,
  notificationPermission,
  onRequestNotificationPermission,
  soundMuted,
}) => {
  const next14Days = getNext14Days();
  const todayStr = next14Days[0];

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('18:00');
  const [category, setCategory] = useState<CalendarReminder['category']>('exercise');
  const [leadTimeMinutes, setLeadTimeMinutes] = useState<ReminderLeadTime>(15);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const pendingReminders = reminders.filter((r) => r.status === 'pending');
  const completedReminders = reminders.filter((r) => r.status === 'completed' || r.status === 'dismissed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      category,
      leadTimeMinutes,
      soundEnabled,
    });

    setTitle('');
    setDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Reminders &amp; Alerts</span>
              <span>·</span>
              <span className="text-amber-700 font-bold">Self-Chosen Timing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Habit &amp; Calendar Reminders
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Receive timely alerts before workouts, hydration intervals, or bedtime. Sync to Google Calendar or Apple Calendar.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {onOpenAiAssistant && (
              <button
                onClick={() => onOpenAiAssistant('Remind me to drink water daily')}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-1.5"
                title="Use AI to generate habit notifications"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Generate Alerts</span>
              </button>
            )}

            <button
              onClick={onTriggerTestReminder}
              className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors flex items-center gap-1.5"
              title="Test notification sound and alert banner right now"
            >
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>Test Alert Chime</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Add Reminder</span>
            </button>
          </div>
        </div>

        {/* Status / Permission Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>
              <strong>{pendingReminders.length}</strong> upcoming reminders active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Browser Alerts:</span>
            {notificationPermission === 'granted' ? (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Active &amp; Permitted
              </span>
            ) : notificationPermission === 'denied' ? (
              <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                Blocked in browser
              </span>
            ) : (
              <button
                onClick={onRequestNotificationPermission}
                className="font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Pending Reminders List */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming Reminders</h2>

        {pendingReminders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No pending reminders</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Schedule reminders for your upcoming workouts, water drinking, or sleep routines with your chosen alert lead time.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              + Create First Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Reminder Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="font-semibold text-amber-800 capitalize">{reminder.category}</span>
                      <span>·</span>
                      <span className="font-mono">{formatFriendlyDate(reminder.date)} at {reminder.time}</span>
                      <span>·</span>
                      <span className="text-slate-700 font-medium">Alert: {formatLeadTimeText(reminder.leadTimeMinutes)}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {reminder.title}
                    </h3>

                    {reminder.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        {reminder.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Google Calendar, .ics, Mark Done, Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={createGoogleCalendarUrl(reminder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Add to Google Calendar"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden md:inline">Google Calendar</span>
                  </a>

                  <button
                    onClick={() => downloadIcsFile(reminder)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Download .ics Calendar file (Apple/Outlook)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden md:inline">.ics</span>
                  </button>

                  <button
                    onClick={() => onToggleReminderStatus(reminder.id, 'completed')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                    title="Mark reminder as completed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>

                  <button
                    onClick={() => onDeleteReminder(reminder.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Reminders History */}
      {completedReminders.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-700">Completed &amp; Dismissed Reminders</h2>
            <span className="text-xs text-slate-500 font-mono">{completedReminders.length} items</span>
          </div>

          <div className="space-y-2 opacity-75">
            {completedReminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700 line-through">{reminder.title}</span>
                  <span>·</span>
                  <span>{formatFriendlyDate(reminder.date)} at {reminder.time}</span>
                </div>
                <button
                  onClick={() => onDeleteReminder(reminder.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Create New Reminder</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select date, time, and your self-chosen reminder lead time.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Water Break, Evening HIIT Workout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CalendarReminder['category'])}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white capitalize"
                  >
                    <option value="exercise">Exercise Workout</option>
                    <option value="water">Water Hydration</option>
                    <option value="sleep">Sleep Routine</option>
                    <option value="habit">General Habit</option>
                    <option value="task">Custom Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {next14Days.map((d) => (
                      <option key={d} value={d}>
                        {formatFriendlyDate(d)} ({d})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                {/* SELF CHOSEN REMINDER LEAD TIME */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reminder Lead Time
                  </label>
                  <select
                    value={leadTimeMinutes}
                    onChange={(e) => setLeadTimeMinutes(Number(e.target.value) as ReminderLeadTime)}
                    className="w-full px-3 py-2 text-sm border border-amber-300 rounded-xl bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bring running shoes and water bottle"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="soundEnabled"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="soundEnabled" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Play audio chime when reminder triggers
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
    </div>
  );
};
