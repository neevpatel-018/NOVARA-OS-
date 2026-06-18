import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { 
  Calendar, User, MapPin, Clock, Plus, Trash2, BookOpen, AlertCircle, 
  ChevronRight, Sparkles, Check, Grid, CalendarDays, Bookmark 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SchedulePlannerProps {
  schedule: ScheduleItem[];
  onAddScheduleItem: (item: ScheduleItem) => void;
  onDeleteScheduleItem: (itemId: string) => void;
}

const COLORS = [
  { name: 'Indigo Blue', value: 'indigo', border: 'border-indigo-100 dark:border-indigo-950/40', bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Emerald Green', value: 'emerald', border: 'border-emerald-100 dark:border-emerald-950/40', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Violet Purple', value: 'purple', border: 'border-purple-100 dark:border-purple-950/40', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400' },
  { name: 'Cyan Sea', value: 'cyan', border: 'border-cyan-100 dark:border-cyan-950/40', bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'Amber Gold', value: 'amber', border: 'border-amber-100 dark:border-amber-950/40', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400' }
];

const WEEK_DAYS = [
  { val: 1, name: 'Monday', abbr: 'Mon' },
  { val: 2, name: 'Tuesday', abbr: 'Tue' },
  { val: 3, name: 'Wednesday', abbr: 'Wed' },
  { val: 4, name: 'Thursday', abbr: 'Thu' },
  { val: 5, name: 'Friday', abbr: 'Fri' },
  { val: 6, name: 'Saturday', abbr: 'Sat' },
  { val: 7, name: 'Sunday', abbr: 'Sun' }
];

export default function SchedulePlanner({
  schedule,
  onAddScheduleItem,
  onDeleteScheduleItem
}: SchedulePlannerProps) {
  // Calendar View configurations
  const [activeDayIndex, setActiveDayIndex] = useState<number>(1); // Mon as default active day

  // Form states
  const [subject, setSubject] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [color, setColor] = useState('indigo');
  const [validationError, setValidationError] = useState('');
  const [isOpenAddForm, setIsOpenAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!subject.trim()) {
      setValidationError('Please input a study subject/course title.');
      return;
    }

    if (!instructor.trim()) {
      setValidationError('Please provide the lecturer or instructor name.');
      return;
    }

    if (!room.trim()) {
      setValidationError('Please provide room number or location URL.');
      return;
    }

    // Check time overlap validations in true production builds
    if (startTime >= endTime) {
      setValidationError('Course end time must happen after start time.');
      return;
    }

    const newItem: ScheduleItem = {
      id: 'sched_' + Date.now(),
      subject: subject.trim(),
      instructor: instructor.trim(),
      room: room.trim(),
      day,
      startTime,
      endTime,
      color
    };

    onAddScheduleItem(newItem);
    
    // reset form
    setSubject('');
    setInstructor('');
    setRoom('');
    setIsOpenAddForm(false);
  };

  // Helper: map template color key to specific visual Tailwind classes
  const styleColorItem = (colorKey: string) => {
    const config = COLORS.find(c => c.value === colorKey);
    return config || COLORS[0];
  };

  // Get active agenda courses
  const dailyAgendaItems = schedule
    .filter(item => item.day === activeDayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6" id="schedule-module">
      
      {/* Module Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 border border-neutral-200/80 rounded-xl shadow-xs dark:bg-neutral-900 dark:border-neutral-800" id="schedule-header-summary">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-2.5 text-indigo-600 dark:text-indigo-400">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Lectures & Timetable Schedule</h2>
            <p className="text-xs text-neutral-400 mt-1">Configure your weekly courses, online classrooms, and lecture halls.</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpenAddForm(!isOpenAddForm)}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 text-xs flex items-center justify-center gap-2 transition-all active:scale-95 self-start sm:self-auto shadow-md"
          id="add-class-toggle-btn"
        >
          <Plus size={14} /> Add Timetable Class
        </button>
      </div>

      {isOpenAddForm && (
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 animate-slide">
          <h4 className="text-base font-bold font-sans text-neutral-900 dark:text-white border-b border-neutral-100 pb-3 mb-4 dark:border-neutral-800">
            Create Timetable Lab or Session
          </h4>

          {validationError && (
            <div className="rounded-lg bg-red-50 p-3 mb-4 border border-red-100 text-xs text-red-655 flex items-start gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Subject Title</label>
              <input
                type="text"
                placeholder="e.g. Advanced Operating Systems..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Instructor / Professor Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Arthur Pendelton..."
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Classroom / Room Location</label>
              <input
                type="text"
                placeholder="e.g. Room 402B / Auditorium..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-855 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-850 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Weekly Day</label>
              <select
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value))}
                className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-2 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                {WEEK_DAYS.map(wd => (
                  <option key={wd.val} value={wd.val}>{wd.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-850 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs dark:bg-neutral-950 dark:border-neutral-800 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Subject Color Decor</label>
              <div className="flex gap-2.5 mt-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-6 w-18 text-[10px] font-bold font-mono rounded hover:opacity-100 uppercase border border-neutral-200 focus:ring-1 focus:ring-neutral-400 capitalize ${c.bg} ${c.text} ${color === c.value ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-80'}`}
                  >
                    {c.value.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-1 md:col-span-3 flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsOpenAddForm(false)}
                className="rounded-lg hover:bg-neutral-100 border px-4 py-2 text-xs text-neutral-500 font-medium"
              >
                Close Panel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2 text-xs shadow-md"
              >
                Deploy Schedule Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Layout Split: Calendar timelining & Today's active day agenda sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Day selection tabs and Calendar timeline list */}
        <div className="lg:col-span-3 bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs dark:bg-neutral-900 dark:border-neutral-800" id="weekly-overview-calendar">
          
          {/* Day picker buttons */}
          <div className="flex flex-wrap gap-1.5 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            {WEEK_DAYS.map(wd => (
              <button
                key={wd.val}
                onClick={() => setActiveDayIndex(wd.val)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold font-sans transition-all ${activeDayIndex === wd.val ? 'bg-neutral-900 text-white shadow-md dark:bg-white dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'}`}
                id={`weekday-toggle-btn-${wd.val}`}
              >
                {wd.name}
              </button>
            ))}
          </div>

          {/* Detailed Timeline segments listings */}
          <div className="mt-6 space-y-4">
            {dailyAgendaItems.length === 0 ? (
              <div className="py-24 text-center text-neutral-400 dark:text-neutral-500" id="weekly-agenda-empty">
                <Calendar className="mx-auto mb-3 text-neutral-300 opacity-60" size={36} />
                <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-150">No studies scheduled</h3>
                <p className="text-xs max-w-xs mx-auto mt-1">Enjoy your leisure or allocate study targets for other weekdays.</p>
              </div>
            ) : (
              dailyAgendaItems.map(item => {
                const colorTheme = styleColorItem(item.color);
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-transform hover:translate-x-1 duration-150 ${colorTheme.border} ${colorTheme.bg}`}
                    id={`active-sched-node-${item.id}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Left time segments */}
                      <div className="font-mono text-sm leading-6 tracking-wide shrink-0 font-bold border-r border-neutral-300 dark:border-neutral-700/60 pr-4 mt-0.5" style={{ color: '#555555' }}>
                        <div className="flex items-center gap-1"><Clock size={12} className="opacity-70" /> {item.startTime}</div>
                        <div className="text-[11px] opacity-70 text-right">to {item.endTime}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-neutral-900 dark:text-white text-base leading-tight">
                            {item.subject}
                          </h3>
                        </div>

                        {/* Details ledger info */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-neutral-500 dark:text-neutral-400 text-xs">
                          <span className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-350"><User size={13} className="opacity-75" /> {item.instructor}</span>
                          <span className="flex items-center gap-1 font-semibold text-indigo-650 dark:text-indigo-400"><MapPin size={13} className="opacity-75" /> {item.room}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteScheduleItem(item.id)}
                      className="text-red-400 hover:text-red-600 self-end md:self-auto p-1.5 hover:bg-neutral-100/50 rounded-lg transition-colors border border-transparent hover:border-neutral-200/20"
                      title="Remove Schedule Class"
                      id={`remove-sched-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Daily agenda overview lists */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h4 className="text-sm font-sans font-bold text-neutral-955 dark:text-white border-b border-neutral-100 pb-3 mb-4 dark:border-neutral-800 flex items-center gap-1.5">
              <Bookmark className="text-indigo-400" size={16} /> Overview Timings
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Total classes scheduled:</span>
                <strong className="text-neutral-800 dark:text-neutral-100">{schedule.length} sessions</strong>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Selected Day:</span>
                <strong className="text-neutral-800 dark:text-neutral-100">{WEEK_DAYS.find(w => w.val === activeDayIndex)?.name}</strong>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Classrooms active:</span>
                <strong className="text-neutral-800 dark:text-neutral-100">
                  {new Set(schedule.map(s => s.room)).size} halls
                </strong>
              </div>
            </div>

            <div className="rounded-lg bg-indigo-50/50 border border-indigo-100/40 p-4 mt-6 text-xs text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">
              <Sparkles size={14} className="mb-1.5 text-indigo-505" />
              <p className="leading-relaxed">Keep your schedules updated. Complete assignments before lectures commence in lecture rooms!</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
