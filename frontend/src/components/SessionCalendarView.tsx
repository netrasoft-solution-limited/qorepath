import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Video, Clock, Calendar, X, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  sessions: any[];
  role: 'instructor' | 'learner' | 'admin';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function buildGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { date: Date; current: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ date: new Date(year, month, i), current: true });
  let next = 1;
  while (cells.length % 7 !== 0)
    cells.push({ date: new Date(year, month + 1, next++), current: false });

  return cells;
}

export function SessionCalendarView({ sessions, role }: Props) {
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<any | null>(null);

  const cells = buildGrid(viewYear, viewMonth);

  const sessionsOnDay = (date: Date) =>
    sessions.filter((s) => isSameDay(new Date(s.scheduledAt), date));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); };

  const handleJoin = (s: any) => {
    setSelected(null);
    navigate(`/classroom/${s.id}`);
  };

  return (
    <div className="relative">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-qore-text">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button onClick={goToday}
            className="text-xs border border-gray-200 px-3 py-1 rounded-lg text-gray-500 hover:border-qore-medium hover:text-qore-medium transition-colors">
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="p-2 rounded-lg border border-gray-200 hover:border-qore-medium hover:text-qore-medium transition-colors text-gray-500">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth}
            className="p-2 rounded-lg border border-gray-200 hover:border-qore-medium hover:text-qore-medium transition-colors text-gray-500">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-qore-medium inline-block" /> Upcoming</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Today</span>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const daySessions = sessionsOnDay(cell.date);
            const isToday = isSameDay(cell.date, today);
            const isLastRow = idx >= cells.length - 7;

            return (
              <div key={idx}
                className={`min-h-[100px] p-2 border-b border-r border-gray-50 ${isLastRow ? 'border-b-0' : ''} ${idx % 7 === 6 ? 'border-r-0' : ''} ${!cell.current ? 'bg-gray-50/50' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                  isToday ? 'bg-qore-dark text-white' : cell.current ? 'text-qore-text' : 'text-gray-300'
                }`}>
                  {cell.date.getDate()}
                </div>

                <div className="space-y-1">
                  {daySessions.slice(0, 2).map((s) => (
                    <button key={s.id}
                      onClick={() => setSelected(s)}
                      className={`w-full text-left text-[11px] font-medium px-2 py-1 rounded-md truncate transition-colors ${
                        s.isCompleted
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-qore-light text-qore-dark hover:bg-qore-medium hover:text-white'
                      }`}
                    >
                      {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {s.title}
                    </button>
                  ))}
                  {daySessions.length > 2 && (
                    <button onClick={() => setSelected(daySessions[2])}
                      className="text-[10px] text-qore-medium font-medium pl-1">
                      +{daySessions.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session detail popover */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm mx-4 pointer-events-auto">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selected.isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-qore-light text-qore-dark'
                    }`}>
                      <Video size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-qore-text">{selected.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selected.isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                      }`}>
                        {selected.isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 mb-5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(selected.scheduledAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    {new Date(selected.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {selected.durationMinutes && ` · ${selected.durationMinutes} min`}
                  </div>
                  {selected.description && (
                    <p className="text-gray-500 text-xs pt-1">{selected.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {!selected.isCompleted && (
                    <button
                      onClick={() => handleJoin(selected)}
                      className="w-full bg-qore-dark hover:bg-qore-medium text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Video size={15} />
                      {role === 'instructor' || role === 'admin' ? 'Launch Classroom' : 'Join Classroom'}
                    </button>
                  )}
                  {selected.isCompleted && selected.recordingUrl && (
                    <a href={selected.recordingUrl} target="_blank" rel="noreferrer"
                      className="w-full bg-qore-light text-qore-dark py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 hover:bg-qore-medium hover:text-white"
                    >
                      <LinkIcon size={15} /> Watch Recording
                    </a>
                  )}
                  {selected.isCompleted && !selected.recordingUrl && (
                    <div className="w-full bg-gray-50 text-gray-400 py-2.5 rounded-xl text-sm text-center">
                      No recording available
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
