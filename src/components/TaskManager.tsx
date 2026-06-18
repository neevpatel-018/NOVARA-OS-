import React, { useState } from 'react';
import { Task, PriorityLevel } from '../types';
import { 
  CheckSquare, Plus, Trash2, Calendar, ClipboardList, Grid, BarChart3, 
  Flame, Award, ShieldAlert, CheckCircle, Search, Edit2, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export default function TaskManager({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask
}: TaskManagerProps) {
  // Navigation states
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'calendar'>('kanban');

  // Add Task form states
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Editing task states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Search & Filter
  const [searchTasks, setSearchTasks] = useState('');

  // Submit new Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task: Task = {
      id: 'task_' + Date.now(),
      title: title.trim(),
      description: desc.trim(),
      priority,
      dueDate,
      completed: false
    };

    onAddTask(task);
    setTitle('');
    setDesc('');
    setIsOpenForm(false);
  };

  // Submit Edited Task
  const handleSaveEdit = (task: Task) => {
    const updated = { ...task, title: editTitle.trim(), description: editDesc.trim() };
    onUpdateTask(updated);
    setEditingTaskId(null);
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  // Metrics Evaluations
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Productivity score multipliers based on counts
  const dailyProdScore = completedCount * 15;
  const weeklyProdScore = completedCount * 95;
  const streakDays = Math.min(Math.floor(completedCount / 2), 7) + 1; // logical multiplier

  // Filter tasks based on Search bar
  const searchedTasksList = tasks.filter(t => t.title.toLowerCase().includes(searchTasks.toLowerCase()) || t.description.toLowerCase().includes(searchTasks.toLowerCase()));

  // Kanban categorising
  const todoQueue = searchedTasksList.filter(t => !t.completed && t.priority !== 'high');
  const urgentQueue = searchedTasksList.filter(t => !t.completed && t.priority === 'high');
  const completedQueue = searchedTasksList.filter(t => t.completed);

  // Calendar render structure: standard 31-day mock layout for active month June 2026
  // June 2026 starts on Monday (1). June has 30 days.
  const daysInMonth = 30;
  const calendarCells = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);

  return (
    <div className="space-y-6" id="tasks-module">
      
      {/* Top Banner metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="tasks-top-metrics">
        
        {/* Metric Card 1 */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Completion Percent</span>
            <h3 className="text-xl font-black text-neutral-850 dark:text-white">{completionRatio}% Done</h3>
          </div>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2 text-indigo-505 shrink-0">
            <ClipboardList size={18} />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Productivity Score</span>
            <h3 className="text-xl font-black text-neutral-850 dark:text-white">+{dailyProdScore} pts</h3>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-505 shrink-0">
            <Award size={18} />
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Weekly Target</span>
            <h3 className="text-xl font-black text-neutral-850 dark:text-white">+{weeklyProdScore} pts</h3>
          </div>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/40 p-2 text-orange-550 shrink-0">
            <BarChart3 size={18} />
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Activity Streak</span>
            <h3 className="text-xl font-black text-neutral-850 dark:text-white">{streakDays} Day Streaks</h3>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2 text-amber-550 shrink-0 animate-pulse">
            <Flame size={18} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* View Options Ribbon */}
      <div className="bg-white border border-neutral-200/80 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 dark:bg-neutral-900 dark:border-neutral-800" id="tasks-ribbon">
        
        {/* Toggle selectors */}
        <div className="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-850">
          <button
            onClick={() => setActiveView('kanban')}
            className={`rounded px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${activeView === 'kanban' ? 'bg-white text-neutral-950 dark:bg-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-750'}`}
            id="tab-task-kanban-btn"
          >
            <Grid size={13} /> Kanban Board
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`rounded px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${activeView === 'list' ? 'bg-white text-neutral-950 dark:bg-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-750'}`}
            id="tab-task-list-btn"
          >
            <ClipboardList size={13} /> List View
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`rounded px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${activeView === 'calendar' ? 'bg-white text-neutral-950 dark:bg-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-750'}`}
            id="tab-task-calendar-btn"
          >
            <Calendar size={13} /> Grid Calendar
          </button>
        </div>

        {/* Searching and creating tasks actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTasks}
              onChange={(e) => setSearchTasks(e.target.value)}
              className="bg-neutral-50 text-xs px-8 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-neutral-950 dark:text-white dark:border-neutral-800"
              id="search-tasks-field"
            />
          </div>

          <button
            onClick={() => setIsOpenForm(!isOpenForm)}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
            id="add-task-modal-btn"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Task Creation Drawer Form */}
      {isOpenForm && (
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 animate-slide">
          <h4 className="text-sm font-sans font-bold text-neutral-900 dark:text-white border-b border-neutral-100 pb-2 mb-4 dark:border-neutral-800">
            Form: Instantiate Task Target
          </h4>
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Task Title</label>
              <input
                type="text"
                placeholder="Submit milestone codebase..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Details / Description</label>
              <input
                type="text"
                placeholder="Refactor backend endpoints..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-855 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Priority LEVEL</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg p-2 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-250 focus:outline-none"
              >
                <option value="low">Low Priority (Green)</option>
                <option value="medium">Medium Priority (Amber)</option>
                <option value="high">High Priority / Urgent (Red)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white font-mono"
              />
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setIsOpenForm(false)}
                className="rounded-lg hover:bg-neutral-100 border px-3 py-1.5 text-xs text-neutral-600 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 text-xs shadow-md"
              >
                Launch Task Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Multi-View Space */}
      <div id="tasks-main-workspace">

        {/* Kanban Board View layout */}
        {activeView === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tasks-kaban-grid">
            
            {/* Column 1: Backlog / To Do (Medium, Low priority task items) */}
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:bg-neutral-950/20 dark:border-neutral-850" id="kanban-col-todo">
              <div className="flex items-center justify-between border-b border-neutral-200/40 pb-2 mb-4 dark:border-neutral-800">
                <span className="text-xs font-mono font-bold uppercase text-neutral-400 flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-neutral-500" /> Backlog / Projects ({todoQueue.length})
                </span>
              </div>

              <div className="space-y-3 h-[450px] overflow-y-auto pr-1">
                {todoQueue.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                    <span>Backlog pipeline empty.</span>
                  </div>
                ) : (
                  todoQueue.map(task => (
                    <TaskCardNode 
                      key={task.id} 
                      task={task} 
                      onToggle={onToggleTask} 
                      onDelete={onDeleteTask}
                      onStartEdit={handleStartEdit}
                      editingTaskId={editingTaskId}
                      editTitle={editTitle}
                      editDesc={editDesc}
                      setEditTitle={setEditTitle}
                      setEditDesc={setEditDesc}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingTaskId(null)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 2: In Progress / High Priority (Action items) */}
            <div className="rounded-xl border border-neutral-250/90 bg-neutral-50/50 p-4 dark:bg-neutral-950/20 dark:border-neutral-800" id="kanban-col-urgent">
              <div className="flex items-center justify-between border-b border-neutral-20s0/40 pb-2 mb-4 dark:border-neutral-800">
                <span className="text-xs font-mono font-bold uppercase text-red-500 dark:text-red-400 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="animate-pulse" /> Focus / Urgent ({urgentQueue.length})
                </span>
              </div>

              <div className="space-y-3 h-[450px] overflow-y-auto pr-1 animate-pulse">
                {urgentQueue.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                    <span>No critical focus milestones.</span>
                  </div>
                ) : (
                  urgentQueue.map(task => (
                    <TaskCardNode 
                      key={task.id} 
                      task={task} 
                      onToggle={onToggleTask} 
                      onDelete={onDeleteTask}
                      onStartEdit={handleStartEdit}
                      editingTaskId={editingTaskId}
                      editTitle={editTitle}
                      editDesc={editDesc}
                      setEditTitle={setEditTitle}
                      setEditDesc={setEditDesc}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingTaskId(null)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:bg-neutral-950/20 dark:border-neutral-850" id="kanban-col-completed">
              <div className="flex items-center justify-between border-b border-neutral-200/40 pb-2 mb-4 dark:border-neutral-800">
                <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Completed ({completedQueue.length})
                </span>
              </div>

              <div className="space-y-3 h-[450px] overflow-y-auto pr-1">
                {completedQueue.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                    <span>Clear completed ledger.</span>
                  </div>
                ) : (
                  completedQueue.map(task => (
                    <TaskCardNode 
                      key={task.id} 
                      task={task} 
                      onToggle={onToggleTask} 
                      onDelete={onDeleteTask}
                      onStartEdit={handleStartEdit}
                      editingTaskId={editingTaskId}
                      editTitle={editTitle}
                      editDesc={editDesc}
                      setEditTitle={setEditTitle}
                      setEditDesc={setEditDesc}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingTaskId(null)}
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* Regular list view row template */}
        {activeView === 'list' && (
          <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs dark:bg-neutral-900 dark:border-neutral-800" id="list-tasks-workspace">
            {searchedTasksList.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 font-mono text-xs">
                <span>No matching tasks recorded.</span>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                {searchedTasksList.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-3 cursor-pointer first:pt-0 last:pb-0 hover:bg-neutral-50/40 rounded px-1.5" id={`task-list-row-${task.id}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(task.id)}
                        className="mt-1 h-4.5 w-4.5 rounded-sm border-neutral-300 text-indigo-650"
                        id={`task-list-check-${task.id}`}
                      />
                      <div>
                        <h4 className={`text-sm font-bold text-neutral-900 dark:text-white ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{task.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                        task.priority === 'high' ? 'bg-red-50 text-red-650 dark:bg-red-950/20' : task.priority === 'medium' ? 'bg-amber-50 text-amber-650' : 'bg-green-50 text-green-650'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">{task.dueDate}</span>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Delete Task"
                        id={`delete-list-task-${task.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Structural Month Calendar View Grid */}
        {activeView === 'calendar' && (
          <div className="bg-white border border-neutral-200/80 rounded-xl p-6 shadow-xs dark:bg-neutral-900 dark:border-neutral-800" id="calendar-tasks-workspace">
            {/* Calendar title of simulated current month June 2026 */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 dark:border-neutral-800">
              <h3 className="text-base font-bold font-sans text-neutral-900 dark:text-white">Active Calendar: June 2026</h3>
              <span className="text-xs font-mono opacity-60 text-neutral-400">30 days scheduled</span>
            </div>

            {/* Small week block columns */}
            <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-mono uppercase text-neutral-400 mb-2 font-black">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* 30 block cells June 2026 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map(dayNum => {
                // Formatting day (e.g., "2026-06-18")
                const dayStr = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                const dailyTasks = tasks.filter(t => t.dueDate === dayStr);
                
                return (
                  <div
                    key={dayNum}
                    className="min-h-24 bg-neutral-50/60 border border-neutral-200/30 rounded-lg p-2 flex flex-col justify-between hover:bg-neutral-150/40 dark:bg-neutral-950 dark:border-neutral-850"
                  >
                    <span className="text-[10px] font-mono tracking-normal text-neutral-400 dark:text-neutral-500 font-bold">{dayNum}</span>

                    <div className="mt-1 space-y-1 overflow-hidden">
                      {dailyTasks.map(t => (
                        <div
                          key={t.id}
                          className={`text-[9px] font-mono rounded px-1 py-0.5 truncate leading-none ${t.completed ? 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 line-through' : t.priority === 'high' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

// Subcomponent: Kanban Task Card with Inline Edit features
interface TaskCardNodeProps {
  key?: any;
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (task: Task) => void;
  editingTaskId: string | null;
  editTitle: string;
  editDesc: string;
  setEditTitle: (val: string) => void;
  setEditDesc: (val: string) => void;
  onSaveEdit: (task: Task) => void;
  onCancelEdit: () => void;
}

function TaskCardNode({
  task,
  onToggle,
  onDelete,
  onStartEdit,
  editingTaskId,
  editTitle,
  editDesc,
  setEditTitle,
  setEditDesc,
  onSaveEdit,
  onCancelEdit
}: TaskCardNodeProps) {
  const isEditing = editingTaskId === task.id;

  return (
    <div
      className={`rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-all dark:bg-neutral-900 dark:border-neutral-800`}
      id={`kanban-card-${task.id}`}
    >
      <div className="flex justify-between items-start">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="mt-1.5 h-4.5 w-4.5 rounded-sm border-neutral-300 text-indigo-500 focus:ring-0 cursor-pointer"
          id={`kanban-check-${task.id}`}
        />

        <div className="flex-1 ml-2.5 pr-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xs rounded bg-neutral-100 p-1 font-bold text-neutral-800 dark:bg-neutral-950 dark:text-white dark:border-neutral-800"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full text-[10px] rounded bg-neutral-100 p-1 text-neutral-700 dark:bg-neutral-950 dark:text-white"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={onCancelEdit}
                  className="rounded px-2 py-0.5 text-[9px] hover:bg-neutral-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSaveEdit(task)}
                  className="rounded bg-indigo-500 text-white px-2 py-0.5 text-[9px] font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h4 className={`text-xs font-bold leading-tight text-neutral-900 dark:text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                {task.title}
              </h4>
              <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onStartEdit(task)}
            className="text-neutral-400 hover:text-neutral-600"
            title="Edit Task"
            id={`edit-task-trigger-${task.id}`}
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-neutral-400 hover:text-red-500"
            title="Delete Task"
            id={`delete-kanban-task-${task.id}`}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="mt-3.5 border-t border-neutral-100 dark:border-neutral-850 pt-2 flex items-center justify-between text-[9px] font-mono text-neutral-400">
        <span className={`rounded-sm px-1.5 py-0.2 uppercase font-bold leading-none ${
          task.priority === 'high'
            ? 'bg-red-50 text-red-500 dark:bg-red-950/20'
            : task.priority === 'medium'
              ? 'bg-amber-50 text-amber-500'
              : 'bg-green-50 text-green-500'
        }`}>
          {task.priority}
        </span>
        <span className="flex items-center gap-0.5 font-semibold">
          <Calendar size={10} /> {task.dueDate}
        </span>
      </div>
    </div>
  );
}
