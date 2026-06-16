import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface TimetableEvent {
  id: string;
  groupId: string;
  groupName: string;
  mentorName: string;
  classroom: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
}

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // States
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  // Modal forms
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  
  // Create Schedule form state
  const [schedGroupId, setSchedGroupId] = useState('');
  const [schedDay, setSchedDay] = useState(1);
  const [schedStart, setSchedStart] = useState('14:00');
  const [schedEnd, setSchedEnd] = useState('16:00');
  const [schedClassroom, setSchedClassroom] = useState('');

  // Edit Schedule state
  const [editingGroupId, setEditingGroupId] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState('');
  const [editDay, setEditDay] = useState(1);
  const [editStart, setEditStart] = useState('14:00');
  const [editEnd, setEditEnd] = useState('16:00');
  const [editClassroom, setEditClassroom] = useState('');

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      // Format YYYY-MM-DD
      const dateStr = currentDate.toISOString().split('T')[0];
      const res = await api.get('/api/timetable', {
        params: {
          branchId: selectedBranchId || undefined,
          date: dateStr,
          view,
        },
      });
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchesAndGroups = async () => {
    try {
      const bRes = await api.get('/api/branches');
      setBranches(bRes.data);
      const gRes = await api.get('/api/groups');
      setGroups(gRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedBranchId, currentDate, view]);

  useEffect(() => {
    fetchBranchesAndGroups();
  }, []);

  if (!user) return null;

  const handleNavigate = (direction: 'prev' | 'next') => {
    const nextDate = new Date(currentDate);
    const amount = view === 'day' ? 1 : view === 'week' ? 7 : 30;
    
    if (view === 'month') {
      nextDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      nextDate.setDate(currentDate.getDate() + (direction === 'next' ? amount : -amount));
    }
    
    setCurrentDate(nextDate);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.post(`/api/timetable/${schedGroupId}`, {
        dayOfWeek: schedDay,
        startTime: schedStart,
        endTime: schedEnd,
        classroom: schedClassroom || undefined,
      });

      setFormSuccess(t('common.success'));
      showToast('Schedule successfully added', 'success');
      setSchedGroupId('');
      setSchedClassroom('');
      fetchTimetable();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.patch(`/api/timetable/${editingGroupId}/${editingScheduleId}`, {
        dayOfWeek: editDay,
        startTime: editStart,
        endTime: editEnd,
        classroom: editClassroom || undefined,
      });

      setFormSuccess(t('common.success'));
      showToast('Schedule successfully updated', 'success');
      fetchTimetable();
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDeleteSchedule = async (gId: string, sId: string) => {
    if (!window.confirm('Are you sure you want to delete this slot from the schedule?')) return;
    try {
      await api.delete(`/api/timetable/${gId}/${sId}`);
      fetchTimetable();
      showToast('Slot successfully deleted', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error deleting', 'error');
    }
  };

  // Group events by date for Week/Month displays
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  // Week View Dates Generator
  const getWeekDays = () => {
    const days = [];
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(currentDate.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Month View Days Generator
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Padding for first day of the week
    const padding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days = [];

    for (let i = padding; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    return days;
  };

  const formattedHeaderDate = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (view === 'week') {
      const days = getWeekDays();
      return `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const getDayLabel = (d: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]}, ${d.getDate()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top filter dashboard */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm transition-colors">
        
        {/* Navigation & date title */}
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-accent hidden sm:block" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNavigate('prev')}
              className="p-2 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:bg-dark-sidebar dark:border dark:border-gray-800/60 dark:hover:bg-accent/15 dark:hover:text-indigo-400 rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm sm:text-base px-3 text-center min-w-[150px] capitalize">
              {formattedHeaderDate()}
            </span>
            <button
              onClick={() => handleNavigate('next')}
              className="p-2 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:bg-dark-sidebar dark:border dark:border-gray-800/60 dark:hover:bg-accent/15 dark:hover:text-indigo-400 rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and actions toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Branch filter */}
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-bold"
          >
            <option value="">All branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* View Toggles */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 text-xs font-bold">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  view === v ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-accent'
                }`}
              >
                {v === 'day' ? 'Day' : v === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>

          {/* Create Button (Mentor/SA) */}
          {user.role !== 'STUDENT' && (
            <button
              onClick={() => {
                setFormError('');
                setFormSuccess('');
                setCreateOpen(true);
              }}
              className="px-4 py-2 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center justify-center gap-1.5 text-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* TIMETABLE RENDER VIEWS */}
      {loading ? (
        <div className="h-64 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse flex items-center justify-center">
          <span className="text-gray-400 font-bold">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="animate-slide-up">
          {/* 1. Day view */}
          {view === 'day' && (
            <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-base mb-4 text-accent">Lessons for the Day</h3>
              
              <div className="space-y-4 max-w-xl">
                {events.map(ev => (
                  <div key={ev.id} className="p-4 border border-gray-150 dark:border-gray-800 rounded-2xl flex justify-between items-start gap-4 hover:shadow-sm transition-shadow">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-bold text-[9px] uppercase">
                        Classroom: {ev.classroom}
                      </span>
                      <h4 className="font-extrabold text-sm">{ev.groupName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Teacher: {ev.mentorName}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 text-right">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ev.startTime} — {ev.endTime}</span>
                      </span>
                      
                      {/* Editor actions */}
                      {user.role !== 'STUDENT' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setEditingGroupId(ev.groupId);
                              setEditingScheduleId(ev.id);
                              setEditStart(ev.startTime);
                              setEditEnd(ev.endTime);
                              setEditClassroom(ev.classroom);
                              setFormError('');
                              setFormSuccess('');
                              setEditOpen(true);
                            }}
                            className="p-1.5 hover:bg-accent/10 hover:text-accent rounded text-gray-500 dark:hover:bg-accent/20 dark:hover:text-indigo-400"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDeleteSchedule(ev.groupId, ev.id)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-center text-gray-550 py-8 text-sm font-semibold">No lessons scheduled for this day</p>
                )}
              </div>
            </div>
          )}

          {/* 2. Week View */}
          {view === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {getWeekDays().map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const dayEvents = getEventsForDate(dateStr);
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <div
                    key={dateStr}
                    className={`bg-light-card dark:bg-dark-card border ${
                      isToday ? 'border-accent shadow-sm' : 'border-gray-255 dark:border-gray-800'
                    } rounded-2xl p-4 flex flex-col space-y-3 min-h-[220px] transition-colors`}
                  >
                    {/* Header */}
                    <div className="pb-2 border-b border-gray-150 dark:border-gray-800">
                      <span className={`font-black text-xs block ${isToday ? 'text-accent' : 'text-gray-400'}`}>
                        {getDayLabel(day)}
                      </span>
                    </div>

                    {/* Day cards */}
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {dayEvents.map(ev => (
                        <div key={ev.id} className="p-2.5 border border-gray-105 dark:border-gray-850 rounded-xl space-y-1.5 hover:shadow-sm transition-shadow bg-gray-50/50 dark:bg-gray-900/10">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-extrabold text-xs leading-snug truncate" title={ev.groupName}>
                              {ev.groupName}
                            </h4>
                            {user.role === 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleDeleteSchedule(ev.groupId, ev.id)}
                                className="text-red-500 hover:text-red-700 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Classroom: {ev.classroom}</span>
                          <span className="text-[10px] text-accent block font-bold">{ev.startTime}—{ev.endTime}</span>
                        </div>
                      ))}
                      {dayEvents.length === 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center block pt-8">No lessons</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Month View */}
          {view === 'month' && (
            <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-4 overflow-x-auto transition-colors">
              <div className="min-w-[600px] grid grid-cols-7 gap-1">
                {/* Week headers */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(h => (
                  <div key={h} className="text-center py-2 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    {h}
                  </div>
                ))}

                {/* Day boxes */}
                {getMonthDays().map((cell, idx) => {
                  const dateStr = cell.date.toISOString().split('T')[0];
                  const dayEvents = getEventsForDate(dateStr);
                  const isToday = new Date().toDateString() === cell.date.toDateString();

                  return (
                    <div
                      key={idx}
                      className={`min-h-[90px] border border-gray-100 dark:border-gray-850 p-2 flex flex-col justify-between ${
                        cell.isCurrentMonth ? '' : 'opacity-30'
                      } ${isToday ? 'bg-accent/5 font-extrabold' : ''}`}
                    >
                      <span className={`text-[10px] self-end ${isToday ? 'text-accent' : 'text-gray-500'}`}>
                        {cell.date.getDate()}
                      </span>

                      {/* Event dot items */}
                      <div className="space-y-1 mt-1 overflow-y-hidden max-h-[60px]">
                        {dayEvents.map(ev => (
                          <div
                            key={ev.id}
                            title={`${ev.groupName} (${ev.startTime}-${ev.endTime})`}
                            className="px-1.5 py-0.5 bg-accent/10 border-l-2 border-accent text-[9px] font-bold text-accent truncate"
                          >
                            {ev.startTime} {ev.groupName}
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
      )}

      {/* Modal: Create Schedule slot */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-accent" />
              <span>Create Schedule Slot</span>
            </h3>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {formSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-sm">
                  <Check className="w-5 h-5" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Group selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Group</label>
                <select
                  required
                  value={schedGroupId}
                  onChange={e => setSchedGroupId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                  <option value="">Select group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Day of Week selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Day of the Week</label>
                <select
                  required
                  value={schedDay}
                  onChange={e => setSchedDay(parseInt(e.target.value, 10))}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={7}>Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Start (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={schedStart}
                    onChange={e => setSchedStart(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">End (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={schedEnd}
                    onChange={e => setSchedEnd(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Classroom */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Classroom (optional)</label>
                <input
                  type="text"
                  value={schedClassroom}
                  onChange={e => setSchedClassroom(e.target.value)}
                  placeholder="Classroom 101"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-850 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent transition-all text-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Schedule slot */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-accent" />
              <span>Edit Schedule Slot</span>
            </h3>

            <form onSubmit={handleEditSchedule} className="space-y-4">
              {formSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-sm">
                  <Check className="w-5 h-5" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Day of Week selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Day of the Week</label>
                <select
                  required
                  value={editDay}
                  onChange={e => setEditDay(parseInt(e.target.value, 10))}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={7}>Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Start (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">End (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={editEnd}
                    onChange={e => setEditEnd(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Classroom */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Classroom</label>
                <input
                  type="text"
                  required
                  value={editClassroom}
                  onChange={e => setEditClassroom(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-850 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent transition-all text-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


