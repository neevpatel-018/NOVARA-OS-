import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { StorageService, UserDBRecord } from '../services/StorageService';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, User, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { INITIAL_FOLDERS, INITIAL_NOTES, INITIAL_TRANSACTIONS, INITIAL_TASKS, INITIAL_SCHEDULE, DEFAULT_SETTINGS } from '../data';

interface AuthScreenProps {
  onAuthSuccess: (userId: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Fields state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate Email
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Initial check
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    if (isLogin) {
      setLoading(true);
      try {
        const existingUser = await StorageService.getUserByEmail(email.toLowerCase().trim());
        if (!existingUser) {
          setError('No user account found with this email.');
          setLoading(false);
          return;
        }

        // bcrypt comparison
        const passwordMatches = bcrypt.compareSync(password, existingUser.passwordHash);
        if (!passwordMatches) {
          setError('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }

        // Remember user session
        localStorage.setItem('nexagen-session', existingUser.id);
        
        // Success
        onAuthSuccess(existingUser.id);
      } catch (err: any) {
        setError(err.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign Up validation
      if (!fullName.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      setLoading(true);
      try {
        // Check duplicate
        const duplicateUser = await StorageService.getUserByEmail(email.toLowerCase().trim());
        if (duplicateUser) {
          setError('This email address is already registered.');
          setLoading(false);
          return;
        }

        const userId = 'u_' + Date.now();
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser: UserDBRecord = {
          id: userId,
          name: fullName.trim(),
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          createdAt: new Date().toISOString()
        };

        // Create User
        await StorageService.save('users', newUser);

        // Prepopulate workspace for default clean starter templates!
        // 1. Folders
        for (const folder of INITIAL_FOLDERS) {
          await StorageService.save('folders', {
            ...folder,
            userId
          });
        }

        // 2. Clear notes copy & transform
        for (const note of INITIAL_NOTES) {
          let blockList: any[] = [];
          
          // Import blocks elegantly 
          // Let's create proper document formats that support the new documents specification
          const blockId1 = 'b_p_' + Math.random().toString(36).substr(2, 9);
          
          await StorageService.save('documents', {
            id: note.id,
            userId,
            title: note.title,
            tags: note.tags,
            blocks: [{ id: blockId1, type: 'paragraph', content: note.content }],
            content: note.content,
            folderId: note.folderId,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          });
        }

        // 3. Transactions
        for (const trans of INITIAL_TRANSACTIONS) {
          await StorageService.save('finance', {
            ...trans,
            userId,
            note: trans.description,
            createdAt: new Date(trans.date).toISOString() // seed ISO
          });
        }

        // 4. Tasks
        for (const task of INITIAL_TASKS) {
          await StorageService.save('tasks', {
            ...task,
            userId
          });
        }

        // 5. Schedule
        for (const sched of INITIAL_SCHEDULE) {
          await StorageService.save('schedule', {
            ...sched,
            userId,
            title: sched.subject
          });
        }

        // 6. Settings
        const userSettings = {
          userId,
          profile: {
            name: fullName.trim(),
            role: 'Developer Pro',
            email: email.toLowerCase().trim(),
            avatar: DEFAULT_SETTINGS.profile.avatar,
            joinedDate: new Date().toISOString().split('T')[0]
          },
          notifications: DEFAULT_SETTINGS.notifications,
          soundEnabled: DEFAULT_SETTINGS.soundEnabled,
          initialBalance: DEFAULT_SETTINGS.initialBalance,
          theme: 'dark' as 'light' | 'dark'
        };
        await StorageService.save('settings', userSettings);

        // Save session link
        localStorage.setItem('nexagen-session', userId);

        onAuthSuccess(userId);
      } catch (err: any) {
        setError(err.message || 'Creation failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-150 flex flex-col items-center justify-center p-6 select-none font-sans relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-505/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-505/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2 opacity-30" />

      <div className="w-full max-w-md z-10">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-lg border border-indigo-500/20 mb-3 relative group">
            <span className="relative z-10">N</span>
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
            NEXAGEN <span className="text-xs bg-indigo-600/20 text-indigo-400 font-mono py-0.5 px-2 rounded-full border border-indigo-500/10">OS v3.0</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
            Offline Sandbox Command Center & Secure Local Database Engine
          </p>
        </div>

        {/* Card Panel wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f12] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative"
        >
          {/* Header tabs toggle login vs signup */}
          <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-6 border border-[#27272a]/40">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-[#18181b] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-[#18181b] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs leading-relaxed" id="auth-error-banner">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-[#27272a] text-xs text-zinc-100 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-[#27272a] text-xs text-zinc-100 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-[#27272a] text-xs text-zinc-100 rounded-lg pl-9 pr-9 py-2.5 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-[#27272a] text-xs text-zinc-100 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 hover:active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 mt-2"
              id="auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing Standalone Authenticator...
                </>
              ) : (
                <>
                  <Shield size={14} />
                  {isLogin ? 'Authenticate Workspace Session' : 'Create Encrypted Identity'}
                </>
              )}
            </button>
          </form>

          {/* Secure disclaimer */}
          <div className="mt-4 pt-4 border-t border-[#27272a]/60 text-center text-[10px] text-zinc-500 leading-normal font-mono flex items-center justify-center gap-1.5">
            <Sparkles size={11} className="text-amber-500 shrink-0" />
            <span>Zero-Knowledge: keys are generated offline locally.</span>
          </div>

        </motion.div>

        {/* Footer info text */}
        <div className="text-center text-[11px] text-zinc-600 mt-6 font-mono font-semibold">
          NEXAGEN Offline Security Sub-Kernel
        </div>

      </div>
    </div>
  );
}
