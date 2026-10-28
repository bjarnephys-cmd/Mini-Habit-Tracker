import React from 'react';
import { Bell, Check, Clock, X, BellRing, Sparkles } from 'lucide-react';
import { CalendarReminder } from '../types';
import { formatLeadTimeText } from '../utils/date';

interface NotificationBannerProps {
  activeTriggeredReminders: CalendarReminder[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onComplete: (id: string) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  activeTriggeredReminders,
  onDismiss,
  onSnooze,
  onComplete,
  notificationPermission,
  onRequestNotificationPermission,
}) => {
  if (activeTriggeredReminders.length === 0 && notificationPermission !== 'default') {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Permission request strip if user hasn't chosen yet */}
      {notificationPermission === 'default' && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-900">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Enable browser alerts to receive habit reminders even when this tab is in background</span>
          </div>
          <button
            onClick={onRequestNotificationPermission}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Active Triggered Reminder Alerts */}
      {activeTriggeredReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="bg-white border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-500/10 transition-all animate-bounce-short"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                  <span className="font-semibold uppercase tracking-wider">Reminder Due</span>
                  <span>·</span>
                  <span>{reminder.time} ({formatLeadTimeText(reminder.leadTimeMinutes)})</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {reminder.title}
                </h4>
                {reminder.description && (
                  <p className="text-sm text-slate-600 mt-1 max-w-xl">
                    {reminder.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => onSnooze(reminder.id, 5)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Snooze for 5 minutes"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Snooze 5m</span>
              </button>

              <button
                onClick={() => onComplete(reminder.id)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Done</span>
              </button>

              <button
                onClick={() => onDismiss(reminder.id)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
