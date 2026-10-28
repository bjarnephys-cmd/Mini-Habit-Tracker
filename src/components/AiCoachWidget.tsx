import React, { useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb, Bell, Droplets, CheckCircle2 } from 'lucide-react';
import { requestDailyCoach, DailyCoachResponse } from '../services/aiService';

interface AiCoachWidgetProps {
  stats: {
    habitsCount: number;
    completedCount: number;
    waterIntake: number;
    waterTarget: number;
    sleepHours: number;
    sleepQuality?: string;
    todayWorkout?: { title: string; completed: boolean } | null;
  };
  onOpenAiAssistant: (initialPrompt?: string) => void;
}

export const AiCoachWidget: React.FC<AiCoachWidgetProps> = ({
  stats,
  onOpenAiAssistant,
}) => {
  const [coachData, setCoachData] = useState<DailyCoachResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const data = await requestDailyCoach(stats);
      setCoachData(data);
    } catch {
      // Fallback advice if server is offline or key missing
      setCoachData({
        comment: `You've checked off ${stats.completedCount} of ${stats.habitsCount} habits today. Stay hydrated and consistent!`,
        actionableMicroTip: 'Drink a glass of water right now and schedule a 5-minute stretch.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
      {/* Decorative subtle backdrop accent */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-20 -bottom-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>AI Habit Copilot · Gemini 3.8</span>
          </div>

          <h3 className="text-xl font-bold text-white mt-1">
            {coachData ? coachData.comment : 'Personalized Habit Coaching & Notifications'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {coachData
              ? `Action Tip: ${coachData.actionableMicroTip}`
              : 'Ask AI to generate smart habit suggestions, water reminders, or workout routines customized to your schedule.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchAdvice}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5"
            title="Get instant coaching insights on today's progress"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : coachData ? 'Refresh Advice' : 'Get Daily Tip'}</span>
          </button>

          <button
            onClick={() => onOpenAiAssistant('Remind me to drink water daily')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>AI Suggestions</span>
          </button>
        </div>
      </div>

      {/* Quick Prompt shortcuts */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 text-[11px] font-medium mr-1">Try asking:</span>
        <button
          onClick={() => onOpenAiAssistant('Remind me to drink water daily')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          💧 "Remind me to drink water daily"
        </button>
        <button
          onClick={() => onOpenAiAssistant('Plan 3 morning runs next week with 15m reminders')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          🏃 "Plan 3 runs next week with 15m reminders"
        </button>
        <button
          onClick={() => onOpenAiAssistant('Remind me to wind down for bed at 10:30 PM')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          🌙 "Bedtime reminder at 10:30 PM"
        </button>
      </div>
    </div>
  );
};
