export type PriorityLevel = 'low' | 'medium' | 'high';
export type TransactionType = 'income' | 'expense';

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CodeBlockExecution {
  blockId: string;
  code: string;
  language: string;
  input: string;
  output: string;
  status: 'idle' | 'running' | 'success' | 'error';
  timestamp: string;
}

export interface CodeExecutionRecord {
  id: string;
  code: string;
  language: string;
  input: string;
  output: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: 'Food' | 'Travel' | 'Shopping' | 'Education' | 'Bills' | 'Health' | 'Other';
  date: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface ScheduleItem {
  id: string;
  subject: string;
  instructor: string;
  room: string;
  day: number; // 1 = Monday, 7 = Sunday
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  color: string; // Tailwind hex or class prefix color
}

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  avatar: string;
  joinedDate: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
}

export interface AppSettings {
  profile: UserProfile;
  notifications: NotificationSettings;
  soundEnabled: boolean;
  initialBalance: number;
}
