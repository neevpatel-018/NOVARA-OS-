import { Note, Folder, Transaction, Task, ScheduleItem, AppSettings, CodeExecutionRecord } from '../types';

export interface UserDBRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface DocumentDBRecord {
  id: string;
  userId: string;
  title: string;
  tags: string[];
  blocks: any[]; // JSON array of Notion-style block objects
  content: string; // fallback string for backward compatibility
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDBRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completedAt?: string;
}

export interface FinanceDBRecord {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  createdAt: string;
}

export interface ScheduleDBRecord {
  id: string;
  userId: string;
  title: string;
  subject?: string; // backward compat
  instructor?: string; // backward compat
  room?: string; // backward compat
  color?: string; // backward compat
  day: number;
  startTime: string;
  endTime: string;
}

export interface SettingsDBRecord {
  userId: string;
  profile: {
    name: string;
    role: string;
    email: string;
    avatar: string;
    joinedDate: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
  };
  soundEnabled: boolean;
  initialBalance: number;
  theme: 'light' | 'dark';
}

const DB_NAME = 'nexagen_os_db';
const DB_VERSION = 2;

export class StorageServiceClass {
  private db: IDBDatabase | null = null;

  private initPromise: Promise<IDBDatabase>;

  constructor() {
    this.initPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB requires a browser environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // 1. Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // 2. Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('userId', 'userId', { unique: false });
        }

        // 3. Folders store
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('userId', 'userId', { unique: false });
        }

        // 4. Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId', { unique: false });
        }

        // 5. Finance store
        if (!db.objectStoreNames.contains('finance')) {
          const financeStore = db.createObjectStore('finance', { keyPath: 'id' });
          financeStore.createIndex('userId', 'userId', { unique: false });
        }

        // 6. Schedule store
        if (!db.objectStoreNames.contains('schedule')) {
          const schedStore = db.createObjectStore('schedule', { keyPath: 'id' });
          schedStore.createIndex('userId', 'userId', { unique: false });
        }

        // 7. Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'userId' });
        }

        // 8. Code history store
        if (!db.objectStoreNames.contains('codeHistory')) {
          const codeStore = db.createObjectStore('codeHistory', { keyPath: 'id' });
          codeStore.createIndex('userId', 'userId', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.initPromise;
  }

  // Future Ready standard methods requested: save, load, update, delete
  async save(storeName: string, data: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(storeName: string, id: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName: string, id: string, data: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result || {};
        const merged = { ...existing, ...data, id }; // retain id
        const putReq = store.put(merged);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Additional helper query methods useful for user query separation
  async loadAllByUser(storeName: string, userId: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      if (!store.indexNames.contains('userId')) {
        // Fallback: fetch all and filter in memory if index not yet initialized
        const request = store.getAll();
        request.onsuccess = () => {
          const filtered = (request.result || []).filter((item: any) => item.userId === userId);
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
        return;
      }

      const index = store.index('userId');
      const request = index.getAll(IDBKeyRange.only(userId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByEmail(email: string): Promise<UserDBRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<UserDBRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearUserData(userId: string): Promise<void> {
    const db = await this.getDB();
    const stores = ['documents', 'folders', 'tasks', 'finance', 'schedule', 'settings', 'codeHistory'];
    
    for (const storeName of stores) {
      const list = await this.loadAllByUser(storeName, userId);
      for (const item of list) {
        await this.delete(storeName, item.id || item.userId);
      }
    }
  }
}

export const StorageService = new StorageServiceClass();
