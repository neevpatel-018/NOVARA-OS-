import React, { useState, useEffect } from 'react';
import { 
  Folder, Note, Transaction, Task, ScheduleItem, AppSettings, CodeExecutionRecord 
} from './types';
import { 
  INITIAL_FOLDERS, INITIAL_NOTES, INITIAL_TRANSACTIONS, INITIAL_TASKS, 
  INITIAL_SCHEDULE, DEFAULT_SETTINGS 
} from './data';
import DashboardHome from './components/DashboardHome';
import SmartNotes from './components/SmartNotes';
import CodeRunner from './components/CodeRunner';
import FinanceTracker from './components/FinanceTracker';
import SchedulePlanner from './components/SchedulePlanner';
import TaskManager from './components/TaskManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserSettings from './components/UserSettings';
import AuthScreen from './components/AuthScreen';
import { StorageService } from './services/StorageService';
import { 
  Terminal, BarChart3, BookOpen, CreditCard, Calendar, CheckSquare, 
  Settings, LayoutDashboard, Clock, Sun, Moon, LogOut, ChevronRight, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Authentication & session persistence
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Core database tables states
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [codeHistory, setCodeHistory] = useState<CodeExecutionRecord[]>([]);
  const [codeExecutionsCount, setCodeExecutionsCount] = useState<number>(0);

  // Theme settings
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Real-time Operating System Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 1. Session Persistence & Auto-login
  useEffect(() => {
    const activeSession = localStorage.getItem('nexagen-session');
    if (activeSession) {
      setCurrentUser(activeSession);
    }
    setIsAuthLoading(false);

    // Dynamic clock instantiator
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch all user data from IndexedDB once currentUser is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const loadUserWorkspace = async () => {
      try {
        // Load theme from localStorage (theme storage restriction)
        const storedTheme = localStorage.getItem('nx_theme') as 'light' | 'dark' | null;
        if (storedTheme) {
          setTheme(storedTheme);
          if (storedTheme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        } else {
          setTheme('dark');
          localStorage.setItem('nx_theme', 'dark');
          document.documentElement.classList.add('dark');
        }

        // Folders
        const dbFolders = await StorageService.loadAllByUser('folders', currentUser);
        setFolders(dbFolders);

        // Code block execution count
        const rawExecCount = localStorage.getItem('nx_code_exec_count');
        if (rawExecCount) setCodeExecutionsCount(parseInt(rawExecCount));

        // Documents
        const dbDocs = await StorageService.loadAllByUser('documents', currentUser);
        const mappedNotes: Note[] = dbDocs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content || JSON.stringify(doc.blocks || []),
          folderId: doc.folderId,
          tags: doc.tags || [],
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }));
        setNotes(mappedNotes);

        // Transactions
        const dbFinance = await StorageService.loadAllByUser('finance', currentUser);
        const mappedTrans: Transaction[] = dbFinance.map((f: any) => ({
          id: f.id,
          amount: Number(f.amount),
          type: f.type,
          category: f.category || 'Other',
          date: f.date || (f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          description: f.description || f.note || ''
        }));
        setTransactions(mappedTrans);

        // Tasks
        const dbTasks = await StorageService.loadAllByUser('tasks', currentUser);
        setTasks(dbTasks);

        // Schedule
        const dbSched = await StorageService.loadAllByUser('schedule', currentUser);
        const mappedSched: ScheduleItem[] = dbSched.map((s: any) => ({
          id: s.id,
          subject: s.subject || s.title || '',
          instructor: s.instructor || '',
          room: s.room || '',
          day: Number(s.day) || 1,
          startTime: s.startTime || '',
          endTime: s.endTime || '',
          color: s.color || 'indigo'
        }));
        setSchedule(mappedSched);

        // Code execution records
        const dbHistory = await StorageService.loadAllByUser('codeHistory', currentUser);
        setCodeHistory(dbHistory);

        // App/User Settings
        const dbSettings = await StorageService.load('settings', currentUser);
        if (dbSettings) {
          setSettings(dbSettings);
        } else {
          // Fetch real user info to prevent mock data leaks
          let realName = 'Nexagen Pro Member';
          let realEmail = 'developer@nexagen.io';
          try {
            const userRec = await StorageService.load('users', currentUser);
            if (userRec) {
              realName = userRec.name;
              realEmail = userRec.email;
            }
          } catch (e) {
            console.error(e);
          }

          // create workspace initial settings defaults for user
          const defaultUserSet: AppSettings = {
            profile: {
              name: realName,
              role: 'Nexagen Pro Member',
              email: realEmail,
              avatar: '', // blank to generate stylish initials dynamically
              joinedDate: new Date().toISOString().split('T')[0]
            },
            notifications: {
              emailNotifications: true,
              pushNotifications: false,
              weeklyDigest: true
            },
            soundEnabled: true,
            initialBalance: 0 // starts at 0
          };
          setSettings(defaultUserSet);
          await StorageService.save('settings', { ...defaultUserSet, userId: currentUser });
        }

      } catch (err) {
        console.error('Failed to load user sandbox from IndexedDB:', err);
      }
    };

    loadUserWorkspace();
  }, [currentUser]);

  // Global Core Handlers
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('nx_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Logout Session Handler
  const handleLogout = () => {
    localStorage.removeItem('nexagen-session');
    setCurrentUser(null);
    setActiveTab('dashboard');

    // Reset components memory states
    setFolders([]);
    setNotes([]);
    setTransactions([]);
    setTasks([]);
    setSchedule([]);
    setCodeHistory([]);
    setCodeExecutionsCount(0);
  };

  // Smart Notes Modifiers (Double persistent client writing)
  const handleAddNote = async (newNote: Note) => {
    setNotes(prev => [newNote, ...prev]);
    if (!currentUser) return;

    let parsedBlocks: any[] = [];
    try {
      parsedBlocks = JSON.parse(newNote.content);
      if (!Array.isArray(parsedBlocks)) {
        parsedBlocks = [{ type: 'paragraph', content: newNote.content }];
      }
    } catch {
      parsedBlocks = [{ type: 'paragraph', content: newNote.content }];
    }

    const docRecord = {
      id: newNote.id,
      userId: currentUser,
      title: newNote.title,
      tags: newNote.tags || [],
      blocks: parsedBlocks,
      content: newNote.content,
      folderId: newNote.folderId,
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt
    };
    await StorageService.save('documents', docRecord);
  };

  // Auto save documents is triggered in SmartNotes and pipes through here
  const handleUpdateNote = async (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    if (!currentUser) return;

    let parsedBlocks: any[] = [];
    try {
      parsedBlocks = JSON.parse(updatedNote.content);
      if (!Array.isArray(parsedBlocks)) {
        parsedBlocks = [{ type: 'paragraph', content: updatedNote.content }];
      }
    } catch {
      parsedBlocks = [{ type: 'paragraph', content: updatedNote.content }];
    }

    const docRecord = {
      id: updatedNote.id,
      userId: currentUser,
      title: updatedNote.title,
      tags: updatedNote.tags || [],
      blocks: parsedBlocks,
      content: updatedNote.content,
      folderId: updatedNote.folderId,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt
    };
    await StorageService.save('documents', docRecord);
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
    await StorageService.delete('documents', id);
  };

  const handleAddFolder = async (f: Folder) => {
    setFolders(prev => [...prev, f]);
    if (!currentUser) return;
    await StorageService.save('folders', { ...f, userId: currentUser });
  };

  const handleDeleteFolder = async (fid: string) => {
    setFolders(prev => prev.filter(f => f.id !== fid));
    setNotes(prev => prev.map(n => n.folderId === fid ? { ...n, folderId: null } : n));
    await StorageService.delete('folders', fid);
  };

  // Finance Modifiers (Saved Instantly)
  const handleAddTransaction = async (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
    if (!currentUser) return;

    const financeRecord = {
      id: t.id,
      userId: currentUser,
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.description,
      description: t.description,
      createdAt: new Date(t.date).toISOString(),
      date: t.date
    };
    await StorageService.save('finance', financeRecord);
  };

  const handleDeleteTransaction = async (tid: string) => {
    setTransactions(prev => prev.filter(t => t.id !== tid));
    await StorageService.delete('finance', tid);
  };

  const handleUpdateInitialBalance = async (val: number) => {
    const updatedSettings = { ...settings, initialBalance: val };
    setSettings(updatedSettings);
    if (!currentUser) return;
    await StorageService.save('settings', { ...updatedSettings, userId: currentUser });
  };

  // Schedule Modifiers (Saved Instantly)
  const handleAddScheduleItem = async (s: ScheduleItem) => {
    setSchedule(prev => [...prev, s]);
    if (!currentUser) return;

    const itemRecord = {
      id: s.id,
      userId: currentUser,
      title: s.subject,
      subject: s.subject,
      instructor: s.instructor,
      room: s.room,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      color: s.color
    };
    await StorageService.save('schedule', itemRecord);
  };

  const handleDeleteScheduleItem = async (sid: string) => {
    setSchedule(prev => prev.filter(s => s.id !== sid));
    await StorageService.delete('schedule', sid);
  };

  // Task Modifiers (Saved Instantly)
  const handleAddTask = async (tk: Task) => {
    setTasks(prev => [tk, ...prev]);
    if (!currentUser) return;
    await StorageService.save('tasks', { ...tk, userId: currentUser });
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (!currentUser) return;
    await StorageService.save('tasks', { ...updatedTask, userId: currentUser });
  };

  const handleDeleteTask = async (tid: string) => {
    setTasks(prev => prev.filter(t => t.id !== tid));
    await StorageService.delete('tasks', tid);
  };

  const handleToggleTask = async (tid: string) => {
    let matchedTask: Task | null = null;
    const nextTasks = tasks.map(t => {
      if (t.id === tid) {
        const toggledStatus = !t.completed;
        matchedTask = {
          ...t,
          completed: toggledStatus,
          completedAt: toggledStatus ? new Date().toISOString() : undefined
        };
        return matchedTask;
      }
      return t;
    });
    setTasks(nextTasks);

    if (matchedTask && currentUser) {
      await StorageService.save('tasks', { ...matchedTask, userId: currentUser });
    }
  };

  // Execution Stats metrics
  const handleIncrementCodeExecutions = () => {
    setCodeExecutionsCount(prev => {
      const nextVal = prev + 1;
      localStorage.setItem('nx_code_exec_count', nextVal.toString());
      return nextVal;
    });
  };

  const handleAddExecutionRecord = async (rec: CodeExecutionRecord) => {
    setCodeHistory(prev => [rec, ...prev]);
    if (!currentUser) return;
    await StorageService.save('codeHistory', { ...rec, userId: currentUser });
  };

  // Backup Export & Import File Procedures (Aligned with "nexagen-backup.json" request)
  const handleExportAllData = async () => {
    if (!currentUser) return;

    // Fetch the absolute state of this user from local database stores
    const dbFolders = await StorageService.loadAllByUser('folders', currentUser);
    const dbDocs = await StorageService.loadAllByUser('documents', currentUser);
    const dbFinance = await StorageService.loadAllByUser('finance', currentUser);
    const dbTasks = await StorageService.loadAllByUser('tasks', currentUser);
    const dbSchedule = await StorageService.loadAllByUser('schedule', currentUser);
    const dbSettings = await StorageService.load('settings', currentUser);
    const dbCodeHistory = await StorageService.loadAllByUser('codeHistory', currentUser);

    const backupObj = {
      version: "nexagen-v3.0",
      userId: currentUser,
      folders: dbFolders,
      notes: dbDocs.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content || JSON.stringify(doc.blocks || []),
        folderId: doc.folderId,
        tags: doc.tags || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      })),
      transactions: dbFinance.map((f: any) => ({
        id: f.id,
        amount: f.amount,
        type: f.type,
        category: f.category,
        date: f.date || (f.createdAt ? f.createdAt.split('T')[0] : ''),
        description: f.description || f.note || ''
      })),
      tasks: dbTasks,
      schedule: dbSchedule.map((s: any) => ({
        id: s.id,
        subject: s.subject || s.title || '',
        instructor: s.instructor || '',
        room: s.room || '',
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        color: s.color || 'indigo'
      })),
      settings: dbSettings,
      codeHistory: dbCodeHistory,
      codeExecutionsCount,
      theme
    };

    const str = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', `nexagen-backup.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const handleImportAllData = async (jsonData: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.notes && !parsed.tasks && !parsed.schedule) {
        return false;
      }

      // Clear existing user objects before loading backup
      await StorageService.clearUserData(currentUser);

      // Recreate folders
      if (parsed.folders) {
        for (const folder of parsed.folders) {
          await StorageService.save('folders', { ...folder, userId: currentUser });
        }
      }

      // Recreate notes/documents
      if (parsed.notes) {
        for (const note of parsed.notes) {
          let parsedBlocks: any[] = [];
          try {
            parsedBlocks = JSON.parse(note.content);
            if (!Array.isArray(parsedBlocks)) {
              parsedBlocks = [{ type: 'paragraph', content: note.content }];
            }
          } catch {
            parsedBlocks = [{ type: 'paragraph', content: note.content }];
          }

          await StorageService.save('documents', {
            id: note.id,
            userId: currentUser,
            title: note.title,
            tags: note.tags || [],
            blocks: parsedBlocks,
            content: note.content,
            folderId: note.folderId,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          });
        }
      }

      // Recreate transactions/finance
      if (parsed.transactions) {
        for (const trans of parsed.transactions) {
          await StorageService.save('finance', {
            ...trans,
            userId: currentUser,
            note: trans.description || trans.note || '',
            createdAt: trans.date ? new Date(trans.date).toISOString() : new Date().toISOString()
          });
        }
      }

      // Recreate tasks
      if (parsed.tasks) {
        for (const task of parsed.tasks) {
          await StorageService.save('tasks', { ...task, userId: currentUser });
        }
      }

      // Recreate schedule
      if (parsed.schedule) {
        for (const sched of parsed.schedule) {
          await StorageService.save('schedule', {
            ...sched,
            userId: currentUser,
            title: sched.subject || sched.title || ''
          });
        }
      }

      // Settings
      if (parsed.settings) {
        await StorageService.save('settings', { ...parsed.settings, userId: currentUser });
      }

      // Code execution histories
      if (parsed.codeHistory) {
        for (const hist of parsed.codeHistory) {
          await StorageService.save('codeHistory', { ...hist, userId: currentUser });
        }
      }

      // Refresh memory states by forcing a re-fetch of current user context
      const prevUser = currentUser;
      setCurrentUser(null);
      setTimeout(() => {
        setCurrentUser(prevUser);
      }, 50);

      return true;
    } catch {
      return false;
    }
  };

  const handleClearAllData = async () => {
    if (!currentUser) return;
    await StorageService.clearUserData(currentUser);
    localStorage.removeItem('nexagen-session');
    setCurrentUser(null);
  };

  // Format Dynamic Time
  const formattedLocalTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDayStr = currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  // Tab Title helper
  const renderTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Command Center';
      case 'notes': return 'Smart Document Vault';
      case 'coderunner': return 'NEXASandbox Compiler';
      case 'finance': return 'Fiscal Double Ledger';
      case 'schedule': return 'Academic & Lab Calendar';
      case 'tasks': return 'Sprint Task Flow';
      case 'analytics': return 'Unified Performance Matrix';
      case 'settings': return 'System Settings';
      default: return 'NEXAGEN OS';
    }
  };

  // While retrieving persistent sessions, show simple loading skeleton
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-550 select-none">
        Booting NEXAGEN Subsystems...
      </div>
    );
  }

  // Redirect to sandbox login form if no session token found
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(userId) => setCurrentUser(userId)} />;
  }

  const handleUpdateSettings = async (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    await StorageService.save('settings', { ...nextSettings, userId: currentUser });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex dark:bg-[#09090b] dark:text-zinc-100 transition-colors duration-200 font-sans" id="nexagen-v24-os">
      
      {/* 1. Sidebar Brand Navigation */}
      <aside className="w-60 bg-white border-r border-neutral-200/90 flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex dark:bg-[#0f0f12] dark:border-[#27272a]" id="main-os-sidebar">
        <div>
          {/* Brand header */}
          <div className="p-6 flex items-center justify-between border-b border-neutral-150 dark:border-[#27272a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-base">N</div>
              <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white select-none uppercase">
                NEXAGEN OS
              </h1>
            </div>
            <span className="text-[10px] font-mono rounded bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-zinc-400 px-1.5 py-0.5 select-none">v3.0</span>
          </div>

          {/* User quick Profile Badge */}
          <div className="px-5 py-4 flex items-center gap-3 border-b border-neutral-100/50 dark:border-[#27272a]/50 hover:bg-neutral-50/20 dark:hover:bg-white/5 transition-all cursor-pointer" onClick={() => setActiveTab('settings')}>
            {settings.profile.avatar ? (
              <img 
                referrerPolicy="no-referrer"
                src={settings.profile.avatar} 
                alt="User Avatar" 
                className="h-8 w-8 rounded-full object-cover border border-neutral-200/40 dark:border-[#27272a] shadow-xs" 
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-650 text-white font-extrabold flex items-center justify-center text-[10px] tracking-wider border border-indigo-500/30 shrink-0">
                {settings.profile.name ? settings.profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NX'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold truncate text-neutral-850 dark:text-white">{settings.profile.name}</h4>
              <p className="text-[10px] text-neutral-450 dark:text-zinc-550 uppercase tracking-widest leading-none mt-0.5">{settings.profile.role || 'Nexagen Pro Member'}</p>
            </div>
          </div>

          {/* Nav buttons list */}
          <nav className="p-3 space-y-1" id="sidebar-navigation">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'dashboard' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-dashboard"
            >
              <span className="flex items-center gap-3">
                <LayoutDashboard size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Command Center
              </span>
              <ChevronRight size={11} className={`opacity-0 group-hover:opacity-100 transition-all ${activeTab === 'dashboard' ? 'opacity-100' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'notes' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-notes"
            >
              <span className="flex items-center gap-3">
                <BookOpen size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Smart Documents
              </span>
              <span className="text-[10px] font-mono opacity-60 bg-neutral-200/40 px-1.5 py-0.2 rounded dark:bg-neutral-800">{notes.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('coderunner')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'coderunner' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-coderunner"
            >
              <span className="flex items-center gap-3">
                <Terminal size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> NEXASandbox IDE
              </span>
              <span className="text-[9px] font-mono text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.2 rounded font-bold">ONLINE</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'finance' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-finance"
            >
              <span className="flex items-center gap-3">
                <CreditCard size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Fiscal Wallet
              </span>
              <ChevronRight size={11} className="opacity-0 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'schedule' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-schedule"
            >
              <span className="flex items-center gap-3">
                <Calendar size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Timetable Planner
              </span>
              <span className="text-[10px] font-mono opacity-60 bg-neutral-200/40 px-1.5 py-0.2 rounded dark:bg-neutral-800">{schedule.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'tasks' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-tasks"
            >
              <span className="flex items-center gap-3">
                <CheckSquare size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Sprint Task Flow
              </span>
              <span className="text-[10px] font-mono opacity-60 bg-neutral-200/40 px-1.5 py-0.2 rounded dark:bg-neutral-800">
                {tasks.filter(t => !t.completed).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'analytics' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-analytics"
            >
              <span className="flex items-center gap-3">
                <BarChart3 size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Performance Matrix
              </span>
              <ChevronRight size={11} className="opacity-0 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md flex items-center justify-between transition-colors duration-150 group ${activeTab === 'settings' ? 'bg-neutral-100 text-neutral-900 dark:bg-white/5 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'}`}
              id="sidebar-tab-settings"
            >
              <span className="flex items-center gap-3">
                <Settings size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Preferences
              </span>
              <ChevronRight size={11} className="opacity-0 group-hover:opacity-100" />
            </button>
          </nav>
        </div>

        {/* Sidebar theme toggler & Logout system */}
        <div className="p-4 border-t border-neutral-100/50 dark:border-[#27272a]/50 space-y-2">
          <button
            onClick={handleToggleTheme}
            className="w-full rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-500 dark:text-zinc-400 transition-colors"
            id="theme-quick-toggler"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? <Sun size={13} /> : <Moon size={13} />} Toggle Theme
            </span>
            <span className="text-[10px] font-mono leading-none border border-neutral-200/50 dark:border-[#27272a] rounded px-1.5 py-0.5 capitalize">{theme}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full rounded-md hover:bg-neutral-100 dark:hover:bg-red-950/20 flex items-center justify-between px-3 py-2 text-xs font-medium text-red-500 transition-colors"
            id="logout-quick-btn"
          >
            <span className="flex items-center gap-2 font-semibold">
              <LogOut size={13} /> Logout Session
            </span>
          </button>
        </div>
      </aside>

      {/* 2. Main Desktop Operating Canvas (Header + Tabs scroll space) */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden" id="canvas-main-viewport">
        {/* Header Bar */}
        <header className="h-16 border-b border-neutral-200/90 bg-white sticky top-0 shrink-0 px-6 md:px-8 flex items-center justify-between z-10 dark:bg-[#09090b] dark:border-[#27272a]" id="global-header-bar">
          <div className="flex items-center gap-3">
            {/* Quick Mobile nav button shortcut just in case */}
            <div className="md:hidden rounded bg-neutral-100 p-2 text-neutral-500 font-bold dark:bg-neutral-900">
              <span className="font-mono text-xs">M</span>
            </div>
            <h2 className="font-sans font-bold text-neutral-900 dark:text-zinc-150 text-sm md:text-base tracking-tight select-none">
              {renderTabTitle()}
            </h2>
          </div>

          {/* Date, Chronometer & clock elements */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-neutral-700 dark:text-zinc-300 tracking-wide font-sans">{formattedDayStr}</div>
              <div className="text-[10px] font-mono text-neutral-500 dark:text-zinc-550 leading-tight mt-0.5 flex items-center gap-1"><Clock size={10} /> Active: {formattedLocalTime}</div>
            </div>

            <div className="h-4.5 w-[1px] bg-slate-200 dark:bg-[#27272a]" />

            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-450 dark:text-zinc-550">Sandbox: Active</span>
            </div>
          </div>
        </header>

        {/* Inner Scroll panel mounting selected components */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" id="router-viewports">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 1 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -1 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardHome 
                  notes={notes}
                  tasks={tasks}
                  schedule={schedule}
                  transactions={transactions}
                  settings={settings}
                  codeExecutionsCount={codeExecutionsCount}
                  onNavigate={setActiveTab}
                  onSelectNote={setActiveNoteId}
                  onToggleTask={handleToggleTask}
                />
              )}

              {activeTab === 'notes' && (
                <SmartNotes 
                  notes={notes}
                  folders={folders}
                  activeNoteId={activeNoteId}
                  onSelectNote={setActiveNoteId}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onAddFolder={handleAddFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onIncrementCodeExecutions={handleIncrementCodeExecutions}
                />
              )}

              {activeTab === 'coderunner' && (
                <CodeRunner 
                  codeHistory={codeHistory}
                  onAddExecutionRecord={handleAddExecutionRecord}
                  onIncrementCodeExecutions={handleIncrementCodeExecutions}
                />
              )}

              {activeTab === 'finance' && (
                <FinanceTracker 
                  transactions={transactions}
                  settings={settings}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onUpdateInitialBalance={handleUpdateInitialBalance}
                />
              )}

              {activeTab === 'schedule' && (
                <SchedulePlanner 
                  schedule={schedule}
                  onAddScheduleItem={handleAddScheduleItem}
                  onDeleteScheduleItem={handleDeleteScheduleItem}
                />
              )}

              {activeTab === 'tasks' && (
                <TaskManager 
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleTask={handleToggleTask}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsDashboard 
                  notes={notes}
                  tasks={tasks}
                  schedule={schedule}
                  transactions={transactions}
                  codeExecutionsCount={codeExecutionsCount}
                />
              )}

              {activeTab === 'settings' && (
                <UserSettings 
                  settings={settings}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onUpdateSettings={handleUpdateSettings}
                  onExportAllData={handleExportAllData}
                  onImportAllData={handleImportAllData}
                  onClearAllData={handleClearAllData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
