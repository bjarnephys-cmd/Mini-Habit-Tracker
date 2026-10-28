import React from 'react';
import { Calendar, CheckCircle2, Bell, Sparkles, Volume2, VolumeX, TrendingUp } from 'lucide-react';

interface HeaderProps {
  activeTab: 'today' | 'planner' | 'reminders' | 'history';
  setActiveTab: (tab: 'today' | 'planner' | 'reminders' | 'history') => void;
  onOpenNewReminder: () => void;
  onOpenAiModal: () => void;
  onOpenAuthModal: () => void;
  currentUser: import('firebase/auth').User | null;
  onLogout: () => void;
  pendingRemindersCount: number;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewReminder,
  onOpenAiModal,
  onOpenAuthModal,
  currentUser,
  onLogout,
  pendingRemindersCount,
  soundMuted,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            HabitFlow
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1 md:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Today's Habits</span>
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>2-Week Exercise</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === 'reminders'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Reminders</span>
            {pendingRemindersCount > 0 && (
              <span className="text-[11px] font-bold text-amber-700 font-mono ml-1">
                ({pendingRemindersCount})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Trends &amp; Historik</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Sound Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSound}
            title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Cloud Sync Account Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 py-1 px-2.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-900 truncate max-w-[120px] hidden md:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                className="text-[11px] text-slate-500 hover:text-rose-600 ml-1 underline cursor-pointer"
                title="Log ud"
              >
                Log ud
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Log ind for at synkronisere mellem PC og mobil"
            >
              <span>☁️</span>
              <span className="hidden sm:inline">Fælles Login</span>
            </button>
          )}

          <button
            onClick={onOpenAiModal}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Use AI to generate habit suggestions or reminders"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">AI Suggest</span>
          </button>

          <button
            onClick={onOpenNewReminder}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs hover:shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Reminder</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="sm:hidden grid grid-cols-4 border-t border-slate-200 bg-slate-50/80 px-2 py-1.5 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('today')}
          className={`py-1.5 flex flex-col items-center gap-1 rounded-md transition-colors ${
            activeTab === 'today' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px]">Idag</span>
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`py-1.5 flex flex-col items-center gap-1 rounded-md transition-colors ${
            activeTab === 'planner' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-sky-600" />
          <span className="text-[10px]">2-Ugers Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`py-1.5 flex flex-col items-center gap-1 rounded-md transition-colors relative ${
            activeTab === 'reminders' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span className="text-[10px]">Alarmer</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-1.5 flex flex-col items-center gap-1 rounded-md transition-colors ${
            activeTab === 'history' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px]">Historik</span>
        </button>
      </div>
    </header>
  );
};
