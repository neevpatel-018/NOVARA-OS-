import React from 'react';
import { Note, Task, ScheduleItem, Transaction, AppSettings } from '../types';
import { BookOpen, Calendar, CheckSquare, CreditCard, Play, Plus, TrendingUp, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardHomeProps {
  notes: Note[];
  tasks: Task[];
  schedule: ScheduleItem[];
  transactions: Transaction[];
  settings: AppSettings;
  codeExecutionsCount: number;
  onNavigate: (tab: string) => void;
  onSelectNote: (noteId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export default function DashboardHome({
  notes,
  tasks,
  schedule,
  transactions,
  settings,
  codeExecutionsCount,
  onNavigate,
  onSelectNote,
  onToggleTask
}: DashboardHomeProps) {
  // Current local day (1 = Monday, 7 = Sunday)
  const today = new Date();
  let dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday,...
  const currentWeekDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  // Calculate balance metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = settings.initialBalance + totalIncome - totalExpense;

  // Tasks overview
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Today's classes
  const todaysSchedule = schedule
    .filter(s => s.day === currentWeekDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingClasses = todaysSchedule.filter(s => {
    const [hours, minutes] = s.startTime.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);
    return classTime > new Date();
  });

  // Greetings depending on hours
  const hours = today.getHours();
  let greeting = 'Good morning';
  if (hours >= 12 && hours < 17) greeting = 'Good afternoon';
  if (hours >= 17) greeting = 'Good evening';

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 md:p-8 text-white shadow-xl dark:from-neutral-950 dark:to-neutral-900 border border-neutral-800" id="welcome-banner">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800/80 px-3 py-1 text-xs font-mono text-neutral-300 backdrop-blur-xs border border-neutral-700/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SYSTEMS STABLE • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="text-2xl md:text-4xl font-sans font-bold tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{settings.profile.name}</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
            Welcome to <strong className="text-white">NEXAGEN OS</strong>. You have <strong className="text-white">{pendingTasks.length} pending tasks</strong> and <strong className="text-white">{todaysSchedule.length} sessions</strong> scheduled for today.
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('notes')}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-900 px-4 py-2 text-sm font-medium transition-all shadow-md active:scale-95"
              id="quick-start-note-btn"
            >
              <Plus size={16} /> New Document
            </button>
            <button
              onClick={() => onNavigate('coderunner')}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 text-sm font-medium border border-neutral-700 transition-all active:scale-95"
              id="quick-start-code-btn"
            >
              <Play size={16} /> Run Scratchpad
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 bg-radial-[circle_at_right_top] from-blue-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {/* Metric 1 */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
          id="metric-card-balance"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-500 dark:text-neutral-400">Net Portfolio Cash</span>
            <span className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <TrendingUp size={12} className="text-emerald-500" />
              <span>Initial +${settings.initialBalance}</span>
            </p>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
          id="metric-card-tasks"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-500 dark:text-neutral-400">Task Performance</span>
            <span className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2 text-blue-600 dark:text-blue-400">
              <CheckSquare size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {completionRate}% completed
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              {pendingTasks.length} pending / {tasks.length} total
            </p>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
          id="metric-card-schedule"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-500 dark:text-neutral-400">Lectures & Labs</span>
            <span className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-2 text-indigo-600 dark:text-indigo-400">
              <Calendar size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {todaysSchedule.length} Scheduled
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              {upcomingClasses.length} remaining today
            </p>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
          id="metric-card-executions"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-500 dark:text-neutral-400">Compiler Exercises</span>
            <span className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-2 text-orange-600 dark:text-orange-400">
              <Play size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {codeExecutionsCount} Executed
            </h3>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Sandbox active
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-widgets-grid">
        {/* Left / Middle: Today Agenda & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Widget */}
          <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="agenda-widget">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-500" size={18} />
                <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Today's Academic & Lab Class</h2>
              </div>
              <button
                onClick={() => onNavigate('schedule')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-0.5"
                id="view-timetable-btn"
              >
                Timetable Calendar <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todaysSchedule.length === 0 ? (
                <div className="py-6 text-center text-neutral-400 dark:text-neutral-500" id="schedule-empty-state">
                  <Calendar className="mx-auto mb-2 opacity-55" size={28} />
                  <p className="text-sm">No lectures or lab sessions scheduled for today.</p>
                  <button
                    onClick={() => onNavigate('schedule')}
                    className="mt-2 text-xs text-indigo-500 underline font-medium hover:text-indigo-400"
                  >
                    Add custom schedule course
                  </button>
                </div>
              ) : (
                todaysSchedule.map(s => {
                  const isUpcoming = upcomingClasses.some(u => u.id === s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-850"
                      id={`schedule-item-${s.id}`}
                    >
                      <div className="flex gap-4">
                        <div className="font-mono text-sm text-neutral-500 mt-1">
                          <div>{s.startTime}</div>
                          <div className="text-xs opacity-60 text-right">{s.endTime}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-neutral-900 dark:text-white">{s.subject}</h4>
                            {!isUpcoming && (
                              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                COMPLETED
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-mono text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 animate-pulse">
                                UPCOMING
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {s.instructor} &bull; <strong className="text-neutral-700 dark:text-neutral-300 font-medium">{s.room}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Tasks Widget */}
          <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="tasks-quickview-widget">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-blue-500" size={18} />
                <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Task Tracker Queue</h2>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-medium text-blue-600 hover:text-blue-500 flex items-center gap-0.5"
                id="view-tasks-btn"
              >
                Flow View <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
              {pendingTasks.length === 0 ? (
                <div className="py-6 text-center text-neutral-400 dark:text-neutral-500" id="tasks-empty-state">
                  <CheckCircle2 className="mx-auto mb-2 text-emerald-500 opacity-80" size={28} />
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">All tasks completed!</p>
                  <p className="text-xs text-neutral-400 mt-1">Excellent productivity today.</p>
                </div>
              ) : (
                pendingTasks.slice(0, 4).map(t => (
                  <div
                    key={t.id}
                    className="flex justify-between items-start py-3 first:pt-0 last:pb-0"
                    id={`task-item-row-${t.id}`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => onToggleTask(t.id)}
                        className="mt-1 h-4.5 w-4.5 rounded-sm border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
                        id={`task-checkbox-dash-${t.id}`}
                      />
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white text-sm">{t.title}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{t.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold ${
                        t.priority === 'high'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          : t.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {t.dueDate}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Layout: Recent Notes & Finance Forecast Widget */}
        <div className="space-y-6">
          {/* Recent Notes */}
          <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="recent-notes-widget">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <BookOpen className="text-amber-500" size={18} />
                <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Recent Documents</h2>
              </div>
              <button
                onClick={() => onNavigate('notes')}
                className="text-xs font-medium text-amber-600 hover:text-amber-500 flex items-center gap-0.5"
                id="view-all-notes-btn"
              >
                All Papers <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <div className="py-6 text-center text-neutral-400 dark:text-neutral-500" id="notes-widget-empty">
                  <p className="text-sm">No documents found.</p>
                </div>
              ) : (
                notes.slice(0, 3).map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onSelectNote(n.id);
                      onNavigate('notes');
                    }}
                    className="group cursor-pointer rounded-lg border border-neutral-100 p-3 transition-all hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-850"
                    id={`note-card-dash-${n.id}`}
                  >
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm group-hover:text-amber-500 transition-colors line-clamp-1">{n.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {n.content.replace(/[#*`\-[\]]/g, '').trim()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {n.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[9px] font-mono text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Finance Overview Widget */}
          <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="finance-widget">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CreditCard className="text-emerald-500" size={18} />
                <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Finance Tracker</h2>
              </div>
              <button
                onClick={() => onNavigate('finance')}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5"
                id="view-financials-btn"
              >
                Track Cash <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-850 p-3">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Income In</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">${totalIncome.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-850 p-3">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Expenses Out</span>
                  <p className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">${totalExpense.toLocaleString()}</p>
                </div>
              </div>

              {/* Mini ledger of 2 recent transactions */}
              <div className="space-y-2">
                <h5 className="text-xs font-mono tracking-wider uppercase text-neutral-400">Ledger Actions</h5>
                {transactions.length === 0 ? (
                  <p className="text-xs text-neutral-500">No transactions yet.</p>
                ) : (
                  transactions.slice(-2).reverse().map(t => (
                    <div key={t.id} className="flex justify-between text-xs items-center p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded" id={`trans-row-dash-${t.id}`}>
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">{t.description}</p>
                        <p className="text-[10px] text-neutral-400 leading-none">{t.date} &bull; {t.category}</p>
                      </div>
                      <span className={`font-mono font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
