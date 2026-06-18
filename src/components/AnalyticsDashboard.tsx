import React from 'react';
import { Note, Task, ScheduleItem, Transaction } from '../types';
import { 
  BarChart3, TrendingUp, BookOpen, Clock, PlaySquare, GraduationCap, 
  Percent, Star, Target, Sparkles, TrendingDown, DollarSign 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

interface AnalyticsDashboardProps {
  notes: Note[];
  tasks: Task[];
  schedule: ScheduleItem[];
  transactions: Transaction[];
  codeExecutionsCount: number;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: '#f59e0b',
  Travel: '#3b82f6',
  Shopping: '#ec4899',
  Education: '#6366f1',
  Bills: '#9061f9',
  Health: '#ef4444',
  Other: '#6b7280'
};

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AnalyticsDashboard({
  notes,
  tasks,
  schedule,
  transactions,
  codeExecutionsCount
}: AnalyticsDashboardProps) {

  // Maths
  // 1. Study Analytics: Estimate study hours as 1.5 hours per scheduled class
  const classHours = schedule.length * 1.5;
  const homeworkHours = notes.length * 0.8;
  const totalStudyHours = parseFloat((classHours + homeworkHours).toFixed(1));

  // 2. Finance
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savings = totalIncome > totalExpense ? totalIncome - totalExpense : 0;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  // 3. Task completeness rate, streak tracker
  const completedCount = tasks.filter(t => t.completed).length;
  const completionPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const isTargetAchieved = completionPercent >= 75;

  // Recharts prep 1: Weekday workloads (distribution of courses per day of week)
  const workloadByDayData = WEEKDAY_NAMES.map((dayName, idx) => {
    // day index (1 = Monday, 7 = Sunday)
    const dayVal = idx + 1;
    const classesCount = schedule.filter(s => s.day === dayVal).length;
    return {
      day: dayName.substring(0, 3), // e.g. Mon
      Hours: classesCount * 1.5,
      Sessions: classesCount
    };
  });

  // Recharts Prep 2: Financial category chart
  const financeCategoryData = Object.keys(CATEGORY_COLORS).map(cat => {
    const totalCat = transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value: totalCat };
  }).filter(item => item.value > 0);

  // Recharts Prep 3: Cash Flow trend line
  const uniqueDates = [...new Set(transactions.map(t => t.date))].sort();
  const cashTrendLineData = uniqueDates.map(dateStr => {
    const dateTransactions = transactions.filter(t => t.date === dateStr);
    const inc = dateTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = dateTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      date: dateStr.substring(5), // MM-DD
      Income: inc,
      Expense: exp
    };
  });

  // Recharts Prep 4: Productive velocity (Tasks completed vs total count)
  const tasksComplexityData = [
    { name: 'Completed Tasks', count: completedCount, color: '#10b981' },
    { name: 'Pending Backlog', count: tasks.length - completedCount, color: '#6366f1' }
  ];

  if (notes.length === 0 && tasks.length === 0 && schedule.length === 0 && transactions.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-12 text-center max-w-sm mx-auto my-12 shadow-md dark:border-neutral-800 dark:bg-neutral-900" id="analytics-empty-state">
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 w-12 h-12 flex items-center justify-center mx-auto mb-4 text-indigo-550 border border-indigo-500/20">
          <BarChart3 size={22} className="text-indigo-505" />
        </div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Analytics View</h3>
        <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1">
          Analytics will appear after you start using the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analytics-module">
      
      {/* Bento Stats Top row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-stats-bento">
        {/* Study summary */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-401 text-neutral-500">Estimated Study Velocity</span>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-none font-sans">{totalStudyHours} Hours</h3>
            <p className="text-[10px] text-neutral-400 font-mono mt-1">{notes.length} Notes / {codeExecutionsCount} Code Compilation Traces</p>
          </div>
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-indigo-505 shrink-0">
            <GraduationCap size={20} />
          </div>
        </div>

        {/* Financial margins */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-410 text-neutral-500">Compounded Savings margin</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none font-sans">${savings.toLocaleString()}</h3>
            <p className="text-[10px] text-neutral-400 font-mono mt-1">{savingsRate}% Saved from Incommings</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-emerald-505 shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Task resolution */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-450 text-neutral-500">Resolution Rate</span>
            <h3 className="text-2xl font-black text-indigo-505 dark:text-indigo-400 leading-none font-sans">{completionPercent}%</h3>
            <p className="text-[10px] text-neutral-405 font-mono mt-1">{completedCount} resolved / {tasks.length} total tasks</p>
          </div>
          <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 p-3 text-orange-555 shrink-0">
            <Percent size={20} />
          </div>
        </div>

        {/* Overall active index */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Nexagen Health Indexes</span>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-none font-sans">OPTIMIZED</h3>
            <p className="text-[10px] text-emerald-600 font-mono mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Operating within target multipliers
            </p>
          </div>
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/40 p-3 text-teal-555 shrink-0">
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid bento charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-charts-grid">
        
        {/* Chart 1: Study Weekly academic timeline workloads */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="weekly-workloads-chart-widget">
          <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
            <Clock size={16} className="text-indigo-500" /> Weekly Class Workload distribution
          </h4>

          <div className="h-60" id="chart-workload-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadByDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-neutral-800" />
                <XAxis dataKey="day" stroke="#999999" fontSize={10} fontStyle="italic" />
                <YAxis stroke="#999999" fontSize={10} />
                <Tooltip contentStyle={{ background: '#111', fontSize: '11px', color: '#fff', border: 'none', borderRadius: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Academic Hours (hrs)" />
                <Bar dataKey="Sessions" fill="#ec4899" radius={[4, 4, 0, 0]} name="Scheduled Classes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily fiscal cash flow (Inflow vs Outflow) */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="income-outflow-weekly-chart-widget">
          <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-emerald-500" /> Ledger inflows vs outflows
          </h4>

          {cashTrendLineData.length === 0 ? (
            <div className="py-24 text-center text-neutral-400 font-mono text-xs">
              <span>No ledger records found to plot trends.</span>
            </div>
          ) : (
            <div className="h-60" id="chart-financials-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashTrendLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-neutral-800" />
                  <XAxis dataKey="date" stroke="#999999" fontSize={10} fontStyle="italic" />
                  <YAxis stroke="#999999" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#111', fontSize: '11px', color: '#fff', border: 'none', borderRadius: '6px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Total Cash In ($)" />
                  <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Total Cash Out ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Expense category allocation */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="expense-pie-chart-widget">
          <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
            <BarChart3 size={16} className="text-pink-500" /> Expense Allocation Breakdown
          </h4>

          {financeCategoryData.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 font-mono text-xs">
              <span>Log expense item ledger points to compile allocation pies.</span>
            </div>
          ) : (
            <div className="h-56 select-none flex items-center justify-center" id="chart-pie-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financeCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {financeCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} contentStyle={{ background: '#111', fontSize: '11px', color: '#fff', borderRadius: '6px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom Legend layout */}
              <div className="flex flex-col gap-2 shrink-0 pr-4">
                {financeCategoryData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name] }}></span>
                    <span>{item.name}: <strong>${item.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 4: Task completion overview */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="tasks-resolution-chart-widget">
          <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
            <Target size={16} className="text-indigo-500" /> Task Queue completion ratio
          </h4>

          {tasks.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 font-mono text-xs">
              <span>No recorded tasks in pipeline.</span>
            </div>
          ) : (
            <div className="h-[210px]" id="chart-tasks-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksComplexityData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" className="dark:stroke-neutral-800" />
                  <XAxis type="number" stroke="#999999" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#999999" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ background: '#111', fontSize: '11px', color: '#fff', border: 'none', borderRadius: '6px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tasks Count">
                    {tasksComplexityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Fallback clean text progress display bar for high aesthetic reliability */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-neutral-500">
                  <span>Task performance velocity:</span>
                  <strong className="text-neutral-800 dark:text-white">{completedCount} of {tasks.length} resolved</strong>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden dark:bg-neutral-800">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${completionPercent}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// End of AnalyticsDashboard component
