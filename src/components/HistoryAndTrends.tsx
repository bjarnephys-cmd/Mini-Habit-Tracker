import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Moon,
  Dumbbell,
  CheckCircle2,
  Download,
  Upload,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  FileJson,
} from 'lucide-react';
import { Habit, DailyHabitLog, ExercisePlan, CalendarReminder } from '../types';
import { formatDateToISO, parseISODate, formatDayOfWeek, formatFriendlyDate } from '../utils/date';

interface HistoryAndTrendsProps {
  habits: Habit[];
  logs: Record<string, DailyHabitLog>;
  exercises: ExercisePlan[];
  reminders: CalendarReminder[];
  onImportData: (imported: {
    habits?: Habit[];
    logs?: Record<string, DailyHabitLog>;
    exercises?: ExercisePlan[];
    reminders?: CalendarReminder[];
  }) => void;
  onOpenAiAssistant: (initialPrompt?: string) => void;
}

export const HistoryAndTrends: React.FC<HistoryAndTrendsProps> = ({
  habits,
  logs,
  exercises,
  reminders,
  onImportData,
  onOpenAiAssistant,
}) => {
  // Week offset: 0 = current week, -1 = last week, -2 = 2 weeks ago, etc.
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Compute 7 days for the selected week
  const getDaysForWeek = (offset: number) => {
    const today = new Date();
    // Find current Monday
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + offset * 7);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(formatDateToISO(d));
    }
    return days;
  };

  const weekDays = getDaysForWeek(weekOffset);
  const firstDayStr = weekDays[0];
  const lastDayStr = weekDays[6];

  // Calculate statistics for the selected week
  let totalHabitOpportunities = 0;
  let totalHabitsCompleted = 0;
  let totalWaterMl = 0;
  let daysWithWaterLogged = 0;
  let totalSleepHours = 0;
  let daysWithSleepLogged = 0;

  weekDays.forEach((dateStr) => {
    const log = logs[dateStr];
    if (log) {
      habits.forEach((h) => {
        totalHabitOpportunities++;
        if (log.habitsCompleted[h.id]) {
          totalHabitsCompleted++;
        }
      });

      if (log.waterIntakeMl > 0) {
        totalWaterMl += log.waterIntakeMl;
        daysWithWaterLogged++;
      }

      if (log.sleepHours > 0) {
        totalSleepHours += log.sleepHours;
        daysWithSleepLogged++;
      }
    } else {
      totalHabitOpportunities += habits.length;
    }
  });

  const weekCompliancePercent =
    totalHabitOpportunities > 0
      ? Math.round((totalHabitsCompleted / totalHabitOpportunities) * 100)
      : 0;

  const avgWaterMl = daysWithWaterLogged > 0 ? Math.round(totalWaterMl / 7) : 0;
  const avgSleepHours = daysWithSleepLogged > 0 ? (totalSleepHours / 7).toFixed(1) : '0';

  // Export data as JSON
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      habits,
      logs,
      exercises,
      reminders,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitflow_backup_${formatDateToISO(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.habits || parsed.logs || parsed.exercises) {
          onImportData({
            habits: parsed.habits,
            logs: parsed.logs,
            exercises: parsed.exercises,
            reminders: parsed.reminders,
          });
          setImportStatus('Data blev importeret med succes! Alle uger er nu opdateret.');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Ugyldig filstruktur. Kontrollér venligst filen.');
        }
      } catch {
        setImportStatus('Kunne ikke læse JSON-filen. Kontrollér filformatet.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Header & Week Selector */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Langtids-historik</span>
              <span>·</span>
              <span className="text-emerald-700 font-bold">Ugentlige Trends</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Følg Udviklingen Over Uger
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Dine daglige optegnelser gemmes automatisk dag for dag, så du kan analysere konsistens og vaner over mange uger.
            </p>
          </div>

          {/* Week Navigation Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors"
              title="Forrige uge"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="px-3 py-1 text-xs font-bold text-slate-900 text-center min-w-[130px]">
              {weekOffset === 0
                ? 'Denne Uge'
                : weekOffset === -1
                ? 'Sidste Uge'
                : `${Math.abs(weekOffset)} uger siden`}
              <div className="text-[10px] text-slate-500 font-mono font-normal">
                {firstDayStr.slice(5)} til {lastDayStr.slice(5)}
              </div>
            </div>

            <button
              onClick={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
              disabled={weekOffset >= 0}
              className="p-2 hover:bg-white disabled:opacity-30 rounded-xl text-slate-700 transition-colors"
              title="Næste uge"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekly Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Gennemførelse i Ugen</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950 mt-1">
              {weekCompliancePercent}%
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              {totalHabitsCompleted} af {totalHabitOpportunities} vaner klaret
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
              <span>Gns. Daglig Hydration</span>
              <Droplets className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-950 mt-1">
              {avgWaterMl} ml
            </div>
            <div className="text-[11px] text-sky-700 mt-0.5">
              svarende til ca. {Math.round(avgWaterMl / 250)} glas om dagen
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-800">
              <span>Gns. Nattesøvn</span>
              <Moon className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-950 mt-1">
              {avgSleepHours} timer
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">
              mål: 8 timer per nat
            </div>
          </div>
        </div>
      </section>

      {/* Week Day-by-Day Matrix */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Dag-for-dag Oversigt for Ugen
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((dateStr) => {
            const log = logs[dateStr];
            const completedCount = log
              ? habits.filter((h) => log.habitsCompleted[h.id]).length
              : 0;
            const habitPercent =
              habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
            const dayWorkouts = exercises.filter((e) => e.date === dateStr);

            return (
              <div
                key={dateStr}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between min-h-[170px]"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {formatDayOfWeek(dateStr)}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {dateStr.slice(5)}
                    </span>
                  </div>

                  {/* Habit completion */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>Vaner</span>
                      <span className="font-mono font-bold text-slate-900">{habitPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${habitPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Water */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-500" /> Vand
                    </span>
                    <span className="font-mono font-semibold text-sky-800">
                      {log ? `${log.waterIntakeMl}ml` : '0ml'}
                    </span>
                  </div>

                  {/* Sleep */}
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-500" /> Søvn
                    </span>
                    <span className="font-mono font-semibold text-indigo-800">
                      {log ? `${log.sleepHours}h` : '0h'}
                    </span>
                  </div>
                </div>

                {/* Workout badge */}
                <div className="mt-3 pt-2 border-t border-slate-200/60">
                  {dayWorkouts.length > 0 ? (
                    <div className="text-[10px] font-bold text-emerald-800 truncate flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{dayWorkouts[0].title}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Ingen træning</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cross-Device Sync & Backup Guide (Addressing User's specific questions) */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Enhedssynkronisering</span>
            <span>·</span>
            <span className="text-sky-700 font-bold">PC &amp; Mobil</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Sådan Bruger Du Appen på Både PC og Mobil
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Her er mulighederne for at dele dine optegnelser mellem enheder:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Cloud Sync with shared account */}
          <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Mulighed 1: Fælles Cloud-Konto (Firebase)
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Anbefalet til automatisk synkronisering
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Når vi aktiverer Cloud Login via Firebase, logger du blot ind med din <strong>Google-konto</strong> på både PC og mobil.
                Dine dagsoptegnelser, vaner, 2-ugers træninger og påmindelser synkroniseres automatisk i realtid mellem alle dine enheder.
              </p>

              <div className="mt-3 text-xs text-emerald-800 font-medium bg-emerald-100/60 p-2.5 rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Skriv blot <em>"Ja, opsæt cloud sync med Google login"</em>, hvis du vil aktivere dette!</span>
              </div>
            </div>
          </div>

          {/* Option B: Local JSON Backup & Import */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Mulighed 2: Eksport &amp; Import (Uden konto)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    100% privat · Virker med det samme
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Uden en cloud-konto gemmes data i browserens lokale lager på den enkelte enhed.
                Du kan når som helst hente en backup-fil og indlæse den på din anden enhed:
              </p>

              {importStatus && (
                <div className="mt-3 p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold">
                  {importStatus}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Eksportér Data (JSON)</span>
                </button>

                <label className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Importér Data</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
