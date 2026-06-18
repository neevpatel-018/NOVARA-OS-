import React, { useState } from 'react';
import { AppSettings, UserProfile, NotificationSettings } from '../types';
import { 
  User, Lock, Bell, Moon, Sun, Download, Upload, ShieldAlert, 
  Check, AlertCircle, Settings, HardDrive, Trash2, SlidersHorizontal 
} from 'lucide-react';
import { motion } from 'motion/react';
import bcrypt from 'bcryptjs';
import { StorageService } from '../services/StorageService';

interface UserSettingsProps {
  settings: AppSettings;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => Promise<boolean>;
  onClearAllData: () => void;
}

export default function UserSettings({
  settings,
  theme,
  onToggleTheme,
  onUpdateSettings,
  onExportAllData,
  onImportAllData,
  onClearAllData
}: UserSettingsProps) {

  // Visual navigation sections
  const [activePane, setActivePane] = useState<'profile' | 'security' | 'system'>('profile');

  // Input states profile
  const [name, setName] = useState(settings.profile.name);
  const [role, setRole] = useState(settings.profile.role);
  const [email, setEmail] = useState(settings.profile.email);
  const [avatar, setAvatar] = useState(settings.profile.avatar);
  const [isSavedProfile, setIsSavedProfile] = useState(false);

  // Security password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Notification states
  const [emailNotif, setEmailNotif] = useState(settings.notifications.emailNotifications);
  const [pushNotif, setPushNotif] = useState(settings.notifications.pushNotifications);
  const [weeklyDigest, setWeeklyDigest] = useState(settings.notifications.weeklyDigest);

  // Import JSON backup states
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importHistoryErr, setImportHistoryErr] = useState('');

  // Form submit profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedProfile(false);

    const updatedProfile: UserProfile = {
      ...settings.profile,
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      avatar: avatar.trim()
    };

    onUpdateSettings({
      ...settings,
      profile: updatedProfile
    });

    setIsSavedProfile(true);
    setTimeout(() => setIsSavedProfile(false), 2000);
  };

  // Form notifications toggle
  const handleToggleNotif = (key: keyof NotificationSettings) => {
    const updatedNotifs = {
      ...settings.notifications,
      [key]: !settings.notifications[key]
    };

    if (key === 'emailNotifications') setEmailNotif(!emailNotif);
    if (key === 'pushNotifications') setPushNotif(!pushNotif);
    if (key === 'weeklyDigest') setWeeklyDigest(!weeklyDigest);

    onUpdateSettings({
      ...settings,
      notifications: updatedNotifs
    });
  };

  // Form security change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All credential validation inputs are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must consist of at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Confirm passwords does not match your new password.');
      return;
    }

    const userId = localStorage.getItem('nexagen-session');
    if (!userId) {
      setPasswordError('No active authenticated session detected.');
      return;
    }

    try {
      const user = await StorageService.load('users', userId);
      if (!user) {
        setPasswordError('User account not found.');
        return;
      }

      // verify old password matches current hash
      const isMatch = bcrypt.compareSync(oldPassword, user.passwordHash);
      if (!isMatch) {
         setPasswordError('The old password you entered is incorrect.');
         return;
      }

      // hash new password
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPassword, salt);

      // save updated record
      const updatedUser = {
        ...user,
        passwordHash: newHash
      };
      await StorageService.save('users', updatedUser);

      setPasswordSuccess('Password altered and synchronized successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    }
  };

  // Import JSON backup parsing
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const textStr = event.target?.result as string;
        const result = await onImportAllData(textStr);
        if (result) {
          setImportStatus('success');
          setImportHistoryErr('');
        } else {
          setImportStatus('error');
          setImportHistoryErr('Invalid JSON scheme format detected. Ensure this is a real Nexagen OS file.');
        }
      } catch (err) {
        setImportStatus('error');
        setImportHistoryErr('Fails to read file. Corrupted data stream.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)]" id="settings-module">
      
      {/* Navigation list side columns */}
      <div className="md:col-span-1 bg-white border border-neutral-200/80 rounded-xl p-4 flex flex-col space-y-2.5 shadow-xs dark:bg-neutral-900 dark:border-neutral-800" id="settings-selector">
        
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-neutral-100 dark:border-neutral-850">
          Preferences
        </h3>

        <button
          onClick={() => setActivePane('profile')}
          className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 font-medium ${activePane === 'profile' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'}`}
          id="btn-set-profile"
        >
          <User size={13} /> Account Profile
        </button>

        <button
          onClick={() => setActivePane('security')}
          className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 font-medium ${activePane === 'security' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'}`}
          id="btn-set-security"
        >
          <Lock size={13} /> Key Security
        </button>

        <button
          onClick={() => setActivePane('system')}
          className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 font-medium ${activePane === 'system' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'}`}
          id="btn-set-system"
        >
          <HardDrive size={13} /> System Diagnostics
        </button>

        <div className="flex-1 opacity-10" />

        <div className="p-3 border border-neutral-200 rounded-lg dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 text-center space-y-1.5">
          <Settings size={20} className="mx-auto text-neutral-400" />
          <p className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Nexagen OS v2.4</p>
        </div>
      </div>

      {/* Primary configuration controls panel */}
      <div className="md:col-span-3 bg-white border border-neutral-200/80 rounded-xl p-6 shadow-xs overflow-y-auto dark:bg-neutral-900 dark:border-neutral-800" id="settings-display-workspace">
        
        {/* Panel 1: Profile Account management */}
        {activePane === 'profile' && (
          <div className="space-y-6" id="pane-set-profile">
            <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Account Profile details</h3>
                <p className="text-xs text-neutral-400 mt-1">Configure your workspace identification, display banner avatar and target development roles.</p>
              </div>

              {/* Theme toggler shortcut */}
              <div className="flex items-center gap-2 bg-neutral-50 rounded-lg p-1 border dark:bg-neutral-950 dark:border-neutral-850">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-indigo-505 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                  title="Light mode theme"
                  id="theme-light-btn"
                >
                  <Sun size={14} />
                </button>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-neutral-900 text-indigo-400' : 'text-neutral-400 hover:text-neutral-800'}`}
                  title="Dark mode theme"
                  id="theme-dark-btn"
                >
                  <Moon size={14} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              {isSavedProfile && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                  <Check size={14} /> Profile preferences saved and synchronized into storage files successfully.
                </div>
              )}

              <div>
                <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">Avatar Display Image Address (URL)</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 font-mono"
                  id="avatar-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">Developer User Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                    id="username-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">Professional Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-855 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                    id="role-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">System Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  id="email-input"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                id="save-profile-btn"
              >
                <Check size={14} /> Update Profile Info
              </button>
            </form>

            {/* Notification triggers section */}
            <div className="border-t border-neutral-100 pt-6 mt-6 dark:border-neutral-800">
              <h4 className="text-sm font-sans font-bold text-neutral-900 dark:text-white mb-4">Notification preferences</h4>
              <div className="space-y-3 max-w-xl">
                
                <div 
                  onClick={() => handleToggleNotif('emailNotifications')}
                  className="flex items-center justify-between p-3 border border-neutral-200/50 rounded-xl hover:bg-neutral-50/40 cursor-pointer dark:border-neutral-800 dark:hover:bg-neutral-950"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-neutral-900 dark:text-white">Email Digest</h5>
                    <p className="text-[10px] text-neutral-400 leading-none">Weekly summary updates parsed specifically to rachel.carter@nexagen.io</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={() => {}}
                    className="h-4.5 w-4.5 text-indigo-505 rounded-sm border-neutral-300 pointer-events-none"
                  />
                </div>

                <div 
                  onClick={() => handleToggleNotif('pushNotifications')}
                  className="flex items-center justify-between p-3 border border-neutral-200/50 rounded-xl hover:bg-neutral-50/40 cursor-pointer dark:border-neutral-800 dark:hover:bg-neutral-950"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-neutral-900 dark:text-white">Live Push notices</h5>
                    <p className="text-[10px] text-neutral-400 leading-none">Instant notifications alert banners inside checking frames when executions start.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={() => {}}
                    className="h-4.5 w-4.5 text-indigo-505 rounded-sm border-neutral-300 pointer-events-none"
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Password modifier */}
        {activePane === 'security' && (
          <div className="space-y-6" id="pane-set-security">
            <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Key Security Credentials</h3>
              <p className="text-xs text-neutral-400 mt-1">Alter or validate your private user local security passwords.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              {passwordError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs border border-red-100 text-red-655 flex items-start gap-1.5 animate-shake dark:bg-red-950/20">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> {passwordSuccess}
                </div>
              )}

              <div>
                <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">Old Password</label>
                <input
                  type="password"
                  placeholder="请输入当前密码..."
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 font-mono"
                  id="old-password-input"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new private password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-855 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 font-mono"
                  id="new-password-input"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-semibold uppercase text-neutral-400 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-type password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  id="confirm-password-input"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                id="change-pwd-btn"
              >
                <Lock size={14} /> Synchronize Passwords
              </button>
            </form>
          </div>
        )}

        {/* Panel 3: System Diagnostics and Backup Export/Imports */}
        {activePane === 'system' && (
          <div className="space-y-6" id="pane-set-system">
            <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">System Diagnostics & Datastore Backups</h3>
              <p className="text-xs text-neutral-400 mt-1">Export your documents, schedules, task workflows, and finances to files. Import them on fresh devices to restore operating state.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
              
              {/* Backups Card */}
              <div className="rounded-xl border border-neutral-250 p-5 bg-neutral-50/50 dark:bg-neutral-950 dark:border-neutral-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Download size={14} /> Download System State
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-normal">Generate and retrieve all notes, catalog folders, timetable courses, task states, and checking logs into a local .json file.</p>
                </div>
                <button
                  onClick={onExportAllData}
                  className="rounded-lg bg-neutral-900 text-white font-mono text-[11px] font-bold py-2 w-full hover:bg-neutral-800 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 dark:bg-neutral-100 dark:text-neutral-900"
                  id="export-data-btn"
                >
                  <Download size={13} /> Export Backup (.json)
                </button>
              </div>

              {/* Restore Card */}
              <div className="rounded-xl border border-neutral-250 p-5 bg-neutral-50/50 dark:bg-neutral-950/20 dark:border-neutral-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Upload size={14} /> Import/Restore State
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-normal">Load a previous exported `.json` state document to restore your full operating dashboard caches.</p>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                    id="system-import-file"
                  />
                  <label
                    htmlFor="system-import-file"
                    className="cursor-pointer rounded-lg border border-indigo-500/30 text-indigo-505 dark:text-indigo-400 text-center font-mono text-[11px] font-bold py-2 px-3 w-full block hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center gap-1"
                  >
                    <Upload size={13} /> Pick Backup File
                  </label>
                  
                  {importStatus === 'success' && (
                    <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                      <Check size={11} /> Datastore restored successfully!
                    </div>
                  )}

                  {importStatus === 'error' && (
                    <div className="text-[10px] font-mono text-red-400 flex items-start gap-1 leading-normal">
                      <ShieldAlert size={11} className="shrink-0 mt-0.5" />
                      <span>{importHistoryErr}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Danger Zone: Destroy Datatasks */}
            <div className="border-t border-red-500/10 pt-6 mt-6 max-w-xl">
              <h4 className="text-sm font-sans font-bold text-red-500 flex items-center gap-1.5">
                <ShieldAlert size={16} /> Danger Zone Control
              </h4>
              <p className="text-xs text-neutral-400 mt-1 mb-4 leading-relaxed">Clearing entire datastore is permanent. All checking accounts, calendar course records, task backlogs, and rich notes will be wiped from local disk files.</p>
              
              <button
                onClick={() => {
                  if (confirm('Are you absolutely sure you want to completely erase the entire NEXAGEN OS local database? This is irreversible.')) {
                    onClearAllData();
                    alert('NEXAGEN OS data cleared. Resetting default seed state.');
                  }
                }}
                className="rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold border border-red-200/40 px-4 py-2 text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                id="clear-all-data-btn"
              >
                <Trash2 size={13} /> WIPE LOCAL DATASTORE
              </button>
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
