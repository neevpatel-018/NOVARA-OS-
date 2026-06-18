import React, { useState } from 'react';
import { Transaction, AppSettings } from '../types';
import { 
  CreditCard, TrendingUp, TrendingDown, Landmark, Sparkles, Plus, 
  Trash2, Filter, DollarSign, Calendar, Tag, FileText, Check, AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceTrackerProps {
  transactions: Transaction[];
  settings: AppSettings;
  onAddTransaction: (trans: Transaction) => void;
  onDeleteTransaction: (transId: string) => void;
  onUpdateInitialBalance: (val: number) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: '#f59e0b', // Amber
  Travel: '#3b82f6', // Blue
  Shopping: '#ec4899', // Pink
  Education: '#6366f1', // Indigo
  Bills: '#9061f9', // Purple
  Health: '#ef4444', // Red
  Other: '#6b7280' // Gray
};

export default function FinanceTracker({
  transactions,
  settings,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateInitialBalance
}: FinanceTrackerProps) {
  // Balance management states
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(settings.initialBalance.toString());
  const [forceProceed, setForceProceed] = useState(false);

  // Transaction form states
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<'Food' | 'Travel' | 'Shopping' | 'Education' | 'Bills' | 'Health' | 'Other'>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [validationError, setValidationError] = useState('');

  // Filtering ledger states
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [ledgerCategory, setLedgerCategory] = useState<string>('all');

  // Math Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = settings.initialBalance + totalIncome - totalExpense;
  const savings = totalIncome > totalExpense ? totalIncome - totalExpense : 0;
  const monthlyCashFlow = totalIncome - totalExpense;

  // Add trans form submission
  const handleSubmitTrans = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setValidationError('Please input a valid transaction amount greater than $0.');
      return;
    }

    if (!desc.trim()) {
      setValidationError('Please enter a brief transaction description.');
      return;
    }

    const newTrans: Transaction = {
      id: 'trans_' + Date.now(),
      amount: parsedAmt,
      type,
      category,
      date,
      description: desc.trim()
    };

    onAddTransaction(newTrans);
    
    // Reset Form
    setAmount('');
    setDesc('');
    setValidationError('');
  };

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(balanceInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateInitialBalance(parsed);
      setIsEditingBalance(false);
    }
  };

  // Filter Transactions for visual list representation
  const filteredLedger = transactions.filter(t => {
    const matchesType = ledgerFilter === 'all' || t.type === ledgerFilter;
    const matchesCategory = ledgerCategory === 'all' || t.category === ledgerCategory;
    return matchesType && matchesCategory;
  });

  // Recharts: Prep data for Income vs Expense Area Chart
  // Map recent days (group transactions by date)
  const sortedDates = [...new Set(transactions.map(t => t.date))].sort();
  const balanceTrendData = sortedDates.map(d => {
    const dayTransactions = transactions.filter(t => t.date === d);
    const inc = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      date: d.substring(5), // MM-DD
      income: inc,
      expense: exp,
      net: inc - exp
    };
  });

  // Recharts: Data for Category Breakdown Pie Chart
  const categorySummaryData = Object.keys(CATEGORY_COLORS).map(cat => {
    const catTotal = transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value: catTotal };
  }).filter(item => item.value > 0);

  // Recharts: Cumulative balance progress graph data
  let cumBalance = settings.initialBalance;
  const cumulativeBalanceData = sortedDates.map(d => {
    const dayTransactions = transactions.filter(t => t.date === d);
    const profit = dayTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    cumBalance += profit;
    return {
      date: d.substring(5),
      balance: cumBalance
    };
  });

  if (settings.initialBalance === 0 && transactions.length === 0 && !forceProceed) {
    return (
      <div className="flex items-center justify-center py-20 px-4" id="welcome-fiscal-wallet">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 text-center max-w-sm w-full shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 w-12 h-12 flex items-center justify-center mx-auto mb-4 text-indigo-550 border border-indigo-500/20">
            <CreditCard size={22} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">Welcome to Fiscal Wallet</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
            Please enter your starting balance to begin tracking transactions, income channels, and cash flow trendlines.
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseFloat(balanceInput);
            if (!isNaN(parsed) && parsed >= 0) {
              onUpdateInitialBalance(parsed);
              setForceProceed(true);
            }
          }} className="space-y-4">
            <div className="text-left">
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-400 mb-1.5">Starting Balance (USD)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  value={balanceInput || ''}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 pl-7 pr-3 py-2.5 text-neutral-850 dark:text-white border border-neutral-250 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2.5 text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              [ Enter Balance ]
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="finance-module">
      
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" id="finance-stat-cards">
        
        {/* Card 1: Balance with Inline Editing option */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1 flex flex-col justify-between" id="card-fin-balance">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">Total Checking Cash</span>
            {isEditingBalance ? (
              <form onSubmit={handleUpdateBalance} className="mt-2 flex items-center gap-1.5">
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full text-sm rounded bg-neutral-50 px-2 py-1 text-neutral-800 border focus:outline-none dark:bg-neutral-950 dark:text-white dark:border-neutral-800 font-mono"
                  autoFocus
                />
                <button type="submit" className="bg-indigo-500 text-white rounded p-1 hover:bg-indigo-600">
                  <Check size={14} />
                </button>
              </form>
            ) : (
              <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
                <h3 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans">
                  ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingBalance(true)}
                  className="text-[10px] text-indigo-505 font-mono underline hover:text-indigo-400 font-bold"
                >
                  Adjust Initial
                </button>
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-neutral-400 font-mono flex items-center gap-1">
            <Landmark size={12} className="text-neutral-500 shrink-0" />
            <span>Init: ${settings.initialBalance}</span>
          </p>
        </div>

        {/* Card 2: Income */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1" id="card-fin-income">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">Ledger Income In</span>
            <span className="rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 p-1">
              <TrendingUp size={14} />
            </span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans">
            +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono">Realized client inflows</p>
        </div>

        {/* Card 3: Expenses */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1" id="card-fin-expenses">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">Total Expense Out</span>
            <span className="rounded bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 p-1">
              <TrendingDown size={14} />
            </span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold tracking-tight text-red-600 dark:text-red-400 font-sans">
            -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono">Consumable charges out</p>
        </div>

        {/* Card 4: Monthly Cash Flow */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1" id="card-fin-cashflow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">Period Net Surplus</span>
            <span className={`rounded p-1 ${monthlyCashFlow >= 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp size={14} />
            </span>
          </div>
          <h3 className={`mt-3 text-xl font-extrabold tracking-tight font-sans ${monthlyCashFlow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
            {monthlyCashFlow >= 0 ? '+' : ''}${monthlyCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono">Net operational cushion</p>
        </div>

        {/* Card 5: Cumulative Savings Progress */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1" id="card-fin-savings">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">Calculated Savings</span>
            <span className="rounded bg-teal-50 text-teal-655 dark:bg-teal-950/20 dark:text-teal-400 p-1">
              <Sparkles size={14} />
            </span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400 font-sans">
            ${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono">Retained cash flow margins</p>
        </div>
      </div>

      {/* Main visual interface layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="fin-dashboard-grid">
        
        {/* Left 2 Cols: Financial Analytics & Recharts widgets */}
        <div className="lg:col-span-2 space-y-6" id="fin-charts-column">
          
          {/* Chart 1: Cash Flow Area Flow trend (Income vs Expense) */}
          <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="income-expense-graph-box">
            <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-indigo-500" /> Cash Flow Chronology (Inflows vs Outflows)
            </h4>

            {balanceTrendData.length === 0 ? (
              <div className="py-20 text-center text-neutral-400 font-mono text-xs">
                <span>Not enough daily chronologic points to plot cash flow trends. Add ledger actions below.</span>
              </div>
            ) : (
              <div className="h-64" id="recharts-cashflow-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" className="dark:stroke-neutral-800"/>
                    <XAxis dataKey="date" stroke="#999999" fontSize={10} fontStyle="italic"/>
                    <YAxis stroke="#999999" fontSize={10}/>
                    <Tooltip contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '8px', color: 'white', fontFamily: 'monospace', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="Inflow (Income)" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Outflow (Expense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 2: Category Pie chart */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="pie-category-box">
              <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
                <Tag size={16} className="text-pink-500" /> Expense Allocation Category
              </h4>

              {categorySummaryData.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 font-mono text-xs">
                  <span>No recorded expense transactions to construct pie.</span>
                </div>
              ) : (
                <div className="h-56 flex flex-col justify-between" id="recharts-pie-container">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySummaryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categorySummaryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#999'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value}`} contentStyle={{ background: '#111', fontSize: '11px', color: '#fff', borderRadius: '6px', border: 'none' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend guide custom */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center py-1">
                    {categorySummaryData.map(item => (
                      <div key={item.name} className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name] }}></span>
                        <span>{item.name}: ${item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chart 3: Checking Balance Trend */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="balance-trend-box">
              <h4 className="text-sm font-sans font-bold text-neutral-900 tracking-tight dark:text-white mb-4 flex items-center gap-1.5">
                <Landmark size={16} className="text-teal-500" /> Checking Net Accumulative Progress
              </h4>

              {cumulativeBalanceData.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 font-mono text-xs">
                  <span>Add ledger operations to chart compounding balance increments.</span>
                </div>
              ) : (
                <div className="h-52" id="recharts-compounding-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeBalanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" className="dark:stroke-neutral-800"/>
                      <XAxis dataKey="date" stroke="#999999" fontSize={9} fontStyle="italic"/>
                      <YAxis stroke="#999999" fontSize={9}/>
                      <Tooltip formatter={(value) => `$${value}`} contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '6px', color: 'white', fontFamily: 'monospace', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" name="Wallet Cash" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Add transaction validation form */}
        <div className="lg:col-span-1 space-y-6" id="fin-form-column">
          {/* Validation Add Form */}
          <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h4 className="text-base font-bold font-sans text-neutral-900 dark:text-white border-b border-neutral-100 pb-3 mb-4 dark:border-neutral-800 flex items-center gap-1.5">
              <Plus size={18} className="text-indigo-500" /> Log Cash Ledger Actions
            </h4>

            <form onSubmit={handleSubmitTrans} className="space-y-4">
              {validationError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100 text-xs text-red-600 flex items-start gap-2 animate-shake dark:bg-red-950/20">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Inflow vs Outflow toggle */}
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-0.5 rounded-lg dark:bg-neutral-950">
                  <button
                    type="button"
                    onClick={() => { setType('expense'); setCategory('Food'); }}
                    className={`rounded-md py-1.5 text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${type === 'expense' ? 'bg-red-500 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    <TrendingDown size={12} /> Expense Out
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('income'); setCategory('Other'); }}
                    className={`rounded-md py-1.5 text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${type === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    <TrendingUp size={12} /> Income In
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Amount ($ USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-neutral-400 h-4.5 w-4.5" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-850 dark:bg-neutral-950 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    id="trans-amount-input"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Category Group</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200 focus:outline-none"
                  id="trans-category-select"
                >
                  {type === 'expense' ? (
                    <>
                      <option value="Food">Food & Beverage ($)</option>
                      <option value="Travel">Transit & Commutes ($)</option>
                      <option value="Shopping">Shopping & Fashion ($)</option>
                      <option value="Education">Education & Certs ($)</option>
                      <option value="Bills">Bills & Subscriptions ($)</option>
                      <option value="Health">Health & Fitness ($)</option>
                      <option value="Other">Other Expenses ($)</option>
                    </>
                  ) : (
                    <>
                      <option value="Other">Salary / Consultation ($)</option>
                      <option value="Education">Scholarships / Grants ($)</option>
                      <optgroup label="Dividends">
                        <option value="Other">Stock Dividends ($)</option>
                        <option value="Other">Other Miscellaneous Inflow ($)</option>
                      </optgroup>
                    </>
                  )}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Accounting Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-neutral-400 h-4.5 w-4.5" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg pl-9 pr-4 py-2 text-xs font-mono dark:bg-neutral-950 dark:border-neutral-850 dark:text-neutral-200 focus:outline-none"
                    id="trans-date-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 text-neutral-400 h-4.5 w-4.5" />
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Server fees..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg pl-9 pr-4 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-250 focus:outline-none"
                    id="trans-desc-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white py-2 text-xs font-extrabold tracking-wider uppercase shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                id="trans-submit-btn"
              >
                <Check size={14} /> Commit Entry
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Ledger history list at the bottom */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900" id="ledger-history-table">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-850 mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="text-indigo-500" size={18} />
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Wallet Checkings Ledger</h2>
          </div>

          {/* Filtering buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter size={12} className="text-neutral-400" />
              <span className="text-[10px] font-mono uppercase text-neutral-400">Class:</span>
            </div>
            <div className="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-850">
              <button
                onClick={() => setLedgerFilter('all')}
                className={`rounded px-2.5 py-1 text-[10.5px] font-mono font-bold transition-all ${ledgerFilter === 'all' ? 'bg-white text-neutral-950 dark:bg-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setLedgerFilter('income')}
                className={`rounded px-2.5 py-1 text-[10.5px] font-mono font-bold transition-all ${ledgerFilter === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Inflows
              </button>
              <button
                onClick={() => setLedgerFilter('expense')}
                className={`rounded px-2.5 py-1 text-[10.5px] font-mono font-bold transition-all ${ledgerFilter === 'expense' ? 'bg-red-500 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Outflows
              </button>
            </div>

            <select
              value={ledgerCategory}
              onChange={(e) => setLedgerCategory(e.target.value)}
              className="rounded bg-neutral-100 dark:bg-neutral-950 text-[10.5px] font-mono border border-neutral-200/50 dark:border-neutral-850 px-2 py-1 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">Every Category</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Education">Education</option>
              <option value="Bills">Bills</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Ledger Grid list */}
        <div className="overflow-x-auto">
          {filteredLedger.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 font-mono text-xs" id="ledger-empty">
              <span>No ledger records match search bounds.</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800 text-left">
              <thead>
                <tr className="text-[10px] font-mono uppercase text-neutral-400 bg-neutral-50/50 dark:bg-neutral-950/20">
                  <th className="px-4 py-3">Accounting Date</th>
                  <th className="px-4 py-3">Transaction Name</th>
                  <th className="px-4 py-3">Category Allocation</th>
                  <th className="px-4 py-3 text-right">Flow Value ($ USD)</th>
                  <th className="px-4 py-3 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {filteredLedger.slice().reverse().map(t => (
                  <tr key={t.id} className="hover:bg-neutral-50/55 dark:hover:bg-neutral-850" id={`ledger-row-${t.id}`}>
                    <td className="px-4 py-3.5 font-mono text-neutral-500 shrink-0">{t.date}</td>
                    <td className="px-4 py-3.5 font-semibold text-neutral-850 dark:text-neutral-150">{t.description}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono text-white leading-none font-bold" style={{ backgroundColor: CATEGORY_COLORS[t.category] }}>
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
