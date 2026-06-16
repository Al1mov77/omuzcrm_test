import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  FileSpreadsheet,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Calendar,
  ChevronLeft,
  MessageSquare,
  TrendingUp,
  Trash2
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface JournalEntry {
  id: string;
  lessonId: string;
  studentId: string;
  attended: boolean;
  score: number;
  note?: string;
  student: Student;
}

interface Lesson {
  id: string;
  weekId: string;
  date: string;
  journalEntries: JournalEntry[];
}

interface WeekExam {
  id: string;
  weekId: string;
  studentId: string;
  attended: boolean;
  bonus: number;
  examScore: number;
  sum: number;
  student: Student;
}

interface Week {
  id: string;
  groupId: string;
  weekNumber: number;
  lessons: Lesson[];
  exams: WeekExam[];
}

interface GroupStudent {
  id: string;
  studentId: string;
  student: Student;
}

interface Group {
  id: string;
  name: string;
  resourceUrl?: string;
  students?: GroupStudent[];
}

const formatStudentDisplayName = (fullName: string) => {
  const mapping: Record<string, string> = {
    'Ahmadshoh Hayotov': 'Ahmadshoh',
    'Amirjon Shukurov': 'Shukurov A.',
    'Muhammadumar Azizov': 'Muhammadumar',
    'Alijon Fazilzod': 'Alijon F.',
    'Firuz Sharipov': 'Firuz S.',
    'Valid Qodiri': 'Valid Q.',
    'Ahmadsho Raufov': 'Ahmadsho R.',
    'Test Student': 'Test S.',
    'Abubakr Umarov': 'Abubakr',
    'Yusuf Karimov': 'Yusuf K.',
    'Iso Musoev': 'Iso M.',
    'Kawsar Temirov': 'Kawsar T.',
    'Muhammadyusuf Samadov': 'Samadov M.',
    'Ismoil Abdulloev': 'Abdullo I.',
  };
  return mapping[fullName] || fullName;
};

// Extended 14-color palette for chart lines
const chartColors = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7',
  '#e11d48', '#84cc16', '#6366f1', '#fb923c'
];

// Inline editable number input for bonus/exam
const InlineNumberInput: React.FC<{
  value: number;
  onCommit: (val: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}> = ({ value, onCommit, disabled, className = '', placeholder = '0' }) => {
  const [localVal, setLocalVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const handleBlur = () => {
    const parsed = parseInt(localVal, 10);
    if (!isNaN(parsed) && parsed !== value) {
      onCommit(parsed);
    } else {
      setLocalVal(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      disabled={disabled}
      value={localVal}
      placeholder={placeholder}
      onChange={e => setLocalVal(e.target.value.replace(/[^0-9]/g, ''))}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-14 text-center bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg py-1 px-1.5 outline-none focus:ring-2 focus:ring-accent text-sm font-bold transition-all ${className}`}
    />
  );
};

export const JournalPage: React.FC = () => {
  const { id: groupIdFromParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Use only the URL param group ID — no local selector
  const selectedGroupId = groupIdFromParam || '';

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [chartData, setChartData] = useState<{ students: any[]; data: any[] }>({ students: [], data: [] });

  // Process chart data to add the "average" data point at the end
  const processedChartData = React.useMemo(() => {
    if (!chartData.data || chartData.data.length === 0 || !chartData.students) {
      return [];
    }

    const dataPoints = chartData.data.map(pt => ({ ...pt, dummy: 1 }));

    // Create the average point
    const avgPoint: any = { week: 'average', isAveragePoint: true, dummy: 1 };
    
    const hasAnyWeekExamsSet = dataPoints.some(pt => pt.hasExamsSet);

    chartData.students.forEach(st => {
      let sum = 0;
      let count = 0;
      dataPoints.forEach(pt => {
        if (!hasAnyWeekExamsSet || pt.hasExamsSet) {
          const val = pt[st.name];
          if (typeof val === 'number') {
            sum += val;
            count++;
          }
        }
      });
      avgPoint[`avg_${st.name}`] = count > 0 ? Math.round(sum / count) : 0;
      avgPoint[st.name] = null;
    });

    return [...dataPoints, avgPoint];
  }, [chartData]);

  const [loading, setLoading] = useState(false);
  const [hoveredStudentName, setHoveredStudentName] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Group Details state
  const [group, setGroup] = useState<Group | null>(null);
  const [viewMode, setViewMode] = useState<'graphics' | 'sheets'>('graphics');

  // Add Coins state
  const [addCoinsOpen, setAddCoinsOpen] = useState(false);
  const [addCoinsStudentId, setAddCoinsStudentId] = useState('');
  const [addCoinsAmount, setAddCoinsAmount] = useState(1);
  const [addCoinsReason, setAddCoinsReason] = useState('');
  const [addCoinsLoading, setAddCoinsLoading] = useState(false);

  // Send Results state
  const [sendResultsOpen, setSendResultsOpen] = useState(false);
  const [sendResultsLoading, setSendResultsLoading] = useState(false);

  // Accordion collapsed state for weeks
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  // Add Lesson state
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [activeWeekId, setActiveWeekId] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);

  // Note/Comment modal states
  const [activeNoteEntry, setActiveNoteEntry] = useState<JournalEntry | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    if (activeNoteEntry) {
      setNoteText(activeNoteEntry.note || '');
    }
  }, [activeNoteEntry]);

  const fetchJournal = async (gId: string) => {
    setLoading(true);
    setError('');
    try {
      // Fetch Group details (for resourceUrl & name)
      const groupRes = await api.get(`/api/groups/${gId}`);
      setGroup(groupRes.data);

      const res = await api.get(`/api/journal/${gId}`);
      setWeeks(res.data);
      // Expand first week by default
      if (res.data.length > 0) {
        setExpandedWeeks({ [res.data[0].id]: true });
      }

      // Fetch chart data
      const chartRes = await api.get(`/api/journal/${gId}/chart`);
      setChartData(chartRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchJournal(selectedGroupId);
    }
  }, [selectedGroupId]);

  if (!user) return null;

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const handleCellAttUpdate = async (entryId: string, attended: boolean, currentScore: number) => {
    if (user?.role === 'STUDENT') return;
    try {
      setWeeks(prevWeeks =>
        prevWeeks.map(w => ({
          ...w,
          lessons: w.lessons.map(l => ({
            ...l,
            journalEntries: l.journalEntries.map(je =>
              je.id === entryId ? { ...je, attended } : je
            ),
          })),
        }))
      );

      await api.patch(`/api/journal/${selectedGroupId}/entry/${entryId}`, {
        attended,
        score: attended ? currentScore : 0,
      });
      fetchJournal(selectedGroupId);
      showToast('Attendance updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error updating attendance', 'error');
    }
  };

  const handleCellScoreUpdate = async (entryId: string, score: number) => {
    if (user?.role === 'STUDENT') return;
    try {
      setWeeks(prevWeeks =>
        prevWeeks.map(w => ({
          ...w,
          lessons: w.lessons.map(l => ({
            ...l,
            journalEntries: l.journalEntries.map(je =>
              je.id === entryId ? { ...je, score } : je
            ),
          })),
        }))
      );

      await api.patch(`/api/journal/${selectedGroupId}/entry/${entryId}`, {
        score,
        attended: true,
      });
      fetchJournal(selectedGroupId);
      showToast('Score updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error updating score', 'error');
    }
  };

  const handleAddWeek = async () => {
    if (user?.role === 'STUDENT') return;
    if (weeks.length >= 4) {
      showToast('Maximum of 4 weeks allowed', 'error');
      return;
    }
    try {
      const nextWeekNumber = weeks.length + 1;
      await api.post(`/api/journal/${selectedGroupId}/weeks`, { weekNumber: nextWeekNumber });
      fetchJournal(selectedGroupId);
      showToast('Week successfully created', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating week';
      showToast(msg, 'error');
    }
  };

  const handleAddLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWeekId || !lessonDate) return;

    try {
      await api.post(`/api/journal/${selectedGroupId}/weeks/${activeWeekId}/lessons`, {
        date: new Date(lessonDate).toISOString(),
      });
      setAddLessonOpen(false);
      setLessonDate(new Date().toISOString().split('T')[0]);
      fetchJournal(selectedGroupId);
      showToast('Lesson successfully created', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating lesson';
      showToast(msg, 'error');
    }
  };

  // Inline exam/bonus update — called from InlineNumberInput onBlur
  const handleInlineExamUpdate = async (examId: string, field: 'bonus' | 'examScore', value: number) => {
    if (user?.role === 'STUDENT') return;
    try {
      // Find current exam values
      let currentExam: WeekExam | undefined;
      for (const w of weeks) {
        const found = w.exams.find(e => e.id === examId);
        if (found) { currentExam = found; break; }
      }
      if (!currentExam) return;

      const payload = {
        examScore: field === 'examScore' ? value : currentExam.examScore,
        bonus: field === 'bonus' ? value : currentExam.bonus,
      };

      // Optimistic update
      setWeeks(prevWeeks =>
        prevWeeks.map(w => ({
          ...w,
          exams: w.exams.map(ex =>
            ex.id === examId ? { ...ex, [field]: value, sum: payload.bonus + payload.examScore } : ex
          ),
        }))
      );

      await api.patch(`/api/journal/${selectedGroupId}/exam/${examId}`, payload);
      fetchJournal(selectedGroupId);
      showToast(field === 'bonus' ? 'Bonus updated' : 'Exam score updated', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error updating';
      showToast(msg, 'error');
    }
  };

  const handleExamAttUpdate = async (examId: string, attended: boolean) => {
    if (user?.role === 'STUDENT') return;
    try {
      let currentExam: WeekExam | undefined;
      for (const w of weeks) {
        const found = w.exams.find(e => e.id === examId);
        if (found) { currentExam = found; break; }
      }
      if (!currentExam) return;

      // Optimistic update
      setWeeks(prevWeeks =>
        prevWeeks.map(w => ({
          ...w,
          exams: w.exams.map(ex =>
            ex.id === examId ? { ...ex, attended, sum: attended ? (ex.examScore + ex.bonus) : 0 } : ex
          ),
        }))
      );

      await api.patch(`/api/journal/${selectedGroupId}/exam/${examId}`, {
        attended,
      });
      fetchJournal(selectedGroupId);
      showToast('Exam attendance updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error updating exam attendance', 'error');
    }
  };

  const handleGiveCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCoinsStudentId || addCoinsAmount <= 0) return;

    setAddCoinsLoading(true);
    try {
      await api.post(`/api/users/${addCoinsStudentId}/coins`, {
        amount: addCoinsAmount,
        reason: addCoinsReason || 'Activity reward',
      });
      showToast('Coins successfully credited', 'success');
      setAddCoinsOpen(false);
      setAddCoinsStudentId('');
      setAddCoinsAmount(1);
      setAddCoinsReason('');
      fetchJournal(selectedGroupId);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error crediting coins';
      showToast(msg, 'error');
    } finally {
      setAddCoinsLoading(false);
    }
  };

  const handleSendResultsSubmit = async () => {
    setSendResultsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Results successfully sent to students via Telegram!', 'success');
      setSendResultsOpen(false);
    } catch (err) {
      showToast('Error sending results', 'error');
    } finally {
      setSendResultsLoading(false);
    }
  };

  const handleToggleAllLessonAttendance = async (lessonId: string, attended: boolean) => {
    if (user?.role === 'STUDENT') return;
    try {
      let targetLesson: Lesson | undefined;
      for (const w of weeks) {
        const found = w.lessons.find(l => l.id === lessonId);
        if (found) { targetLesson = found; break; }
      }
      if (!targetLesson) return;

      setWeeks(prevWeeks =>
        prevWeeks.map(w => ({
          ...w,
          lessons: w.lessons.map(l =>
            l.id === lessonId
              ? {
                  ...l,
                  journalEntries: l.journalEntries.map(je => ({ ...je, attended })),
                }
              : l
          ),
        }))
      );

      await Promise.all(
        targetLesson.journalEntries.map(je =>
          api.patch(`/api/journal/${selectedGroupId}/entry/${je.id}`, {
            attended,
            score: attended ? je.score : 0,
          })
        )
      );

      fetchJournal(selectedGroupId);
      showToast('All students attendance updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error updating attendance', 'error');
    }
  };

  const handleToggleAllExamAttendance = async (weekId: string, attended: boolean) => {
    if (user?.role === 'STUDENT') return;
    try {
      const targetWeek = weeks.find(w => w.id === weekId);
      if (!targetWeek) return;

      setWeeks(prevWeeks =>
        prevWeeks.map(w =>
          w.id === weekId
            ? {
                ...w,
                exams: w.exams.map(ex => ({ ...ex, attended, sum: attended ? (ex.examScore + ex.bonus) : 0 })),
              }
            : w
        )
      );

      await Promise.all(
        targetWeek.exams.map(ex =>
          api.patch(`/api/journal/${selectedGroupId}/exam/${ex.id}`, {
            attended,
          })
        )
      );

      fetchJournal(selectedGroupId);
      showToast('All students exam attendance updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error updating exam attendance', 'error');
    }
  };

  const handleNoteSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteEntry) return;

    setNoteLoading(true);
    try {
      await api.patch(`/api/journal/${selectedGroupId}/entry/${activeNoteEntry.id}`, {
        note: noteText,
        attended: activeNoteEntry.attended,
        score: activeNoteEntry.score,
      });

      setWeeks(prevWeeks =>
        prevWeeks.map(w => ({
          ...w,
          lessons: w.lessons.map(l => ({
            ...l,
            journalEntries: l.journalEntries.map(je =>
              je.id === activeNoteEntry.id ? { ...je, note: noteText } : je
            ),
          })),
        }))
      );

      showToast('Comment saved successfully', 'success');
      setActiveNoteEntry(null);
      fetchJournal(selectedGroupId);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error saving comment';
      showToast(msg, 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  // Custom legend renderer for chart — matching original
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-4 px-4">
        {payload.map((entry: any, index: number) => {
          const isHighlighted = hoveredStudentName === entry.value;
          const hasAnyHovered = hoveredStudentName !== null;
          return (
            <div
              key={index}
              className="flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              onMouseEnter={() => setHoveredStudentName(entry.value)}
              onMouseLeave={() => setHoveredStudentName(null)}
              style={{ opacity: hasAnyHovered ? (isHighlighted ? 1.0 : 0.3) : 0.85 }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {formatStudentDisplayName(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Custom tooltip component that sorts values descending
  const CustomTooltip: React.FC<any> = ({ active, payload, chartStudentColors, hoveredStudentName }) => {
    if (active && payload && payload.length) {
      const dataPoint = { ...payload[0].payload };
      const weekName = String(dataPoint.week || '');
      const isAverage = !!dataPoint.isAveragePoint;
      const weekLabel = isAverage ? "Average" : weekName;
      
      delete dataPoint.week;
      delete dataPoint.isAveragePoint;
      delete dataPoint.dummy;

      const cleanedDataPoint: Record<string, number> = {};
      Object.entries(dataPoint).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          const cleanKey = isAverage && key.startsWith('avg_') ? key.slice(4) : key;
          cleanedDataPoint[cleanKey] = val as number;
        }
      });

      const sorted = Object.entries(cleanedDataPoint)
        .sort(([, a], [, b]) => b - a);
      return (
        <div
          className="rounded-2xl shadow-2xl p-4 border border-gray-800 font-sans max-h-[380px] overflow-y-auto"
          style={{
            backgroundColor: 'rgba(15, 22, 36, 0.95)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            minWidth: '220px',
            color: '#fff',
            pointerEvents: 'none',
          }}
        >
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-800 font-Montserrat">
            {weekLabel}
          </div>
          <div className="space-y-1.5">
            {sorted.map(([name, value], idx) => {
              const color = chartStudentColors[name] || '#64748B';
              const isHovered = name === hoveredStudentName;
              return (
                <div
                  key={idx}
                  className={`flex justify-between items-center text-[12px] font-bold font-Montserrat transition-all ${isHovered ? 'scale-105 bg-white/10 px-2 py-0.5 rounded-lg' : ''}`}
                  style={{ color, opacity: hoveredStudentName && !isHovered ? 0.35 : 1 }}
                >
                  <span className="truncate max-w-[170px]">{name}</span>
                  <span className="font-black ml-3">{String(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Build a map of student name -> color for tooltip
  const chartStudentColors: Record<string, string> = {};
  if (chartData.students) {
    if (theme === 'dark') {
      chartData.students.forEach((st, i) => {
        chartStudentColors[st.name] = chartColors[i % chartColors.length];
      });
    } else {
      chartData.students.forEach((st, i) => {
        chartStudentColors[st.name] = chartColors[i % chartColors.length];
      });
    }
  }



  const isMentorOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MENTOR';
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const getLessonAttendanceInfo = (w: Week, lessonId: string, sIds: string[]) => {
    const lesson = w.lessons.find(l => l.id === lessonId);
    if (!lesson) return { checked: false, indeterminate: false };
    const entries = lesson.journalEntries.filter(je => sIds.includes(je.studentId));
    const checkedCount = entries.filter(je => je.attended).length;
    return {
      checked: entries.length > 0 && checkedCount === entries.length,
      indeterminate: checkedCount > 0 && checkedCount < entries.length,
    };
  };

  const getExamAttendanceInfo = (w: Week, sIds: string[]) => {
    const exams = w.exams.filter(ex => sIds.includes(ex.studentId));
    const checkedCount = exams.filter(ex => ex.attended).length;
    return {
      checked: exams.length > 0 && checkedCount === exams.length,
      indeterminate: checkedCount > 0 && checkedCount < exams.length,
    };
  };

  return (
    <div className="space-y-6 max-w-full mx-auto text-slate-800 dark:text-slate-100 animate-fade-in font-sans">
      
      {/* ========= Header ========= */}
      <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-purple-500 to-pink-500 rounded-t-3xl"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(groupIdFromParam ? `/groups/${groupIdFromParam}` : '/groups')}
              className="p-2 rounded-xl bg-gray-100 dark:bg-dark-sidebar border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-accent dark:hover:text-indigo-400 transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <FileSpreadsheet className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-850 dark:text-white">Journal</h2>
                <p className="text-[10px] text-gray-500 font-semibold">{group?.name || 'Loading...'}</p>
              </div>
            </div>
          </div>

          {/* Center: Toggle Button Group */}
          {group?.resourceUrl && (
            <div className="flex bg-gray-100 dark:bg-dark-sidebar p-1 rounded-xl w-fit self-center lg:self-auto border border-gray-200 dark:border-gray-800/40">
              <button
                onClick={() => setViewMode('graphics')}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                  viewMode === 'graphics'
                    ? 'text-[#2E5A85]'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                style={viewMode === 'graphics' ? { background: '#E0F2FE' } : {}}
              >
                Exam graphics
              </button>
              <button
                onClick={() => setViewMode('sheets')}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                  viewMode === 'sheets'
                    ? 'text-[#2E5A85]'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                style={viewMode === 'sheets' ? { background: '#E0F2FE' } : {}}
              >
                Google sheets
              </button>
            </div>
          )}

          {/* Right: Actions */}
          {isMentorOrAdmin && (
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                onClick={() => {
                  if (group?.students && group.students.length > 0) {
                    setAddCoinsStudentId(group.students[0].studentId);
                  }
                  setAddCoinsOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
                  <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
                  <path d="m2 16 6 6" />
                  <circle cx="16" cy="9" r="2.9" />
                  <circle cx="6" cy="5" r="3" />
                </svg>
                <span>ADD COINS</span>
              </button>

              <button
                onClick={() => setSendResultsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                <span>SEND RESULTS</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    if (weeks.length > 0) {
                      setActiveWeekId(weeks[weeks.length - 1].id);
                    }
                    setAddLessonOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD NEW DATE</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========= Progress Line Chart / Google Sheet ========= */}
      {viewMode === 'sheets' && group?.resourceUrl ? (
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-0 shadow-sm overflow-hidden transition-colors h-[500px] animate-scale-in">
          <iframe
            title="Google Sheets"
            src={group.resourceUrl}
            className="w-full h-full border-none"
            allowFullScreen
          />
        </div>
      ) : (
        chartData.data && chartData.data.length > 0 && (
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-colors animate-scale-in">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-800 dark:text-white">Students Progress</h3>
                <p className="text-[10px] text-gray-500 font-semibold">Grades dynamics by weeks</p>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-[320px] bg-gray-50/50 dark:bg-dark-sidebar/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 relative w-full">
              <div className="w-full h-full absolute inset-0 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={processedChartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#E5E7EB'} />
                    <XAxis
                      dataKey="week"
                      stroke={theme === 'dark' ? '#ffffff' : '#000000'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: theme === 'dark' ? '#ffffff' : '#000000', fontSize: 11, fontFamily: 'Montserrat', fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[0, 120]}
                      stroke={theme === 'dark' ? '#ffffff' : '#000000'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      ticks={[0, 30, 60, 90, 120]}
                      tick={{ fill: theme === 'dark' ? '#ffffff' : '#000000', fontSize: 11, fontFamily: 'Montserrat', fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip chartStudentColors={chartStudentColors} hoveredStudentName={hoveredStudentName} />} />
                    <Legend content={renderCustomLegend} />
                    {/* Dummy line to force tooltip trigger on average point */}
                    <Line
                      type="monotone"
                      dataKey="dummy"
                      stroke="transparent"
                      strokeWidth={0}
                      dot={false}
                      activeDot={false}
                    />
                    {chartData.students.map((st, i) => {
                      const isHighlighted = hoveredStudentName === st.name;
                      const hasAnyHovered = hoveredStudentName !== null;
                      return (
                        <Line
                          key={st.id}
                          type="monotone"
                          dataKey={st.name}
                          stroke={chartColors[i % chartColors.length]}
                          strokeWidth={isHighlighted ? 4.5 : 2.5}
                          opacity={hasAnyHovered ? (isHighlighted ? 1.0 : 0.15) : 0.85}
                          dot={isHighlighted ? { r: 5, fill: chartColors[i % chartColors.length] } : { r: 3, fill: chartColors[i % chartColors.length], opacity: hasAnyHovered ? 0.15 : 0.8 }}
                          activeDot={{
                            r: 6,
                            fill: chartColors[i % chartColors.length],
                            stroke: '#fff',
                            strokeWidth: 1.5
                          }}
                          onMouseEnter={() => setHoveredStudentName(st.name)}
                          onMouseLeave={() => setHoveredStudentName(null)}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      )}

      {/* ========= Weekly Accordion Lists ========= */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map(week => {
            const isExpanded = expandedWeeks[week.id];

            const uniqueStudentIds = Array.from(
              new Set([
                ...week.lessons.flatMap(l => l.journalEntries.map(je => je.studentId)),
                ...week.exams.map(e => e.studentId),
              ])
            );

            const studentIds = user.role === 'STUDENT'
              ? uniqueStudentIds.filter(sid => sid === user.id)
              : uniqueStudentIds;

            return (
              <div
                key={week.id}
                className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors"
              >
                {/* Accordion header */}
                <div
                  onClick={() => toggleWeek(week.id)}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-accent/10 rounded-xl text-accent flex items-center justify-center font-black text-sm border border-accent/20">
                      {week.weekNumber}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-base">
                        {t('journal.week')} {week.weekNumber}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-semibold">
                        {week.lessons.length} lessons
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {user.role !== 'STUDENT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWeekId(week.id);
                          setAddLessonOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-accent/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('journal.addLesson')}</span>
                      </button>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.delete(`/api/journal/${selectedGroupId}/weeks/${week.id}`);
                            fetchJournal(selectedGroupId);
                            showToast('Week deleted successfully', 'success');
                          } catch (err: any) {
                            const msg = err.response?.data?.message || 'Error deleting week';
                            showToast(msg, 'error');
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-red-200 dark:border-red-900/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Week</span>
                      </button>
                    )}
                    <div className={`p-1 rounded-lg transition-transform ${isExpanded ? 'rotate-0' : ''}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Accordion body table */}
                {isExpanded && (
                  <div className="border-t border-gray-150 dark:border-gray-800 overflow-x-auto p-4 md:p-5">
                    <table className="w-full text-left border-collapse border-2 border-[#F3F4F6] dark:border-[#070C16] text-xs font-semibold font-Montserrat" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        {/* Row 1 Headers */}
                        <tr className="text-gray-650 dark:text-gray-300 uppercase bg-[#f8fafc] dark:bg-[#070C16]">
                          <th className="py-2 px-3 min-w-[150px] sticky left-0 z-20 bg-[#f8fafc] dark:bg-[#070C16] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16] font-bold text-[12px] text-slate-800 dark:text-white" rowSpan={2}>Students</th>
                          {week.lessons.map((lesson) => {
                            const dateObj = new Date(lesson.date);
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const year = dateObj.getFullYear();
                            const formattedDate = `${day}.${month}.${year}`;
                            return (
                              <th key={lesson.id} className="py-1.5 px-1 text-center border-l-2 border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16] font-semibold text-[12px] text-slate-800 dark:text-white" colSpan={2}>
                                {formattedDate}
                              </th>
                            );
                          })}
                          <th className="py-1.5 px-1 text-center text-slate-800 dark:text-white border-l-2 border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16] font-semibold text-[12px]" colSpan={4}>
                            END OF WEEK
                          </th>
                        </tr>
                        {/* Row 2 Headers */}
                        <tr className="text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider bg-[#f8fafc] dark:bg-[#070C16]">
                          {week.lessons.map((lesson) => {
                            const { checked, indeterminate } = getLessonAttendanceInfo(week, lesson.id, studentIds);
                            return (
                              <React.Fragment key={lesson.id}>
                                <th className="py-1 px-1 text-center font-extrabold text-[10px] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                  <div className="flex items-center justify-center gap-1">
                                    {user.role !== 'STUDENT' ? (
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        ref={el => {
                                          if (el) el.indeterminate = indeterminate;
                                        }}
                                        onChange={e => handleToggleAllLessonAttendance(lesson.id, e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                                      />
                                    ) : null}
                                    <span>Att</span>
                                  </div>
                                </th>
                                <th className="py-1 px-1 text-center font-extrabold text-[10px] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">Score</th>
                              </React.Fragment>
                            );
                          })}
                          {(() => {
                            const { checked, indeterminate } = getExamAttendanceInfo(week, studentIds);
                            return (
                              <th className="py-1 px-1 text-center text-yellow-500 font-extrabold text-[10px] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                <div className="flex items-center justify-center gap-1">
                                  {user.role !== 'STUDENT' ? (
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      ref={el => {
                                        if (el) el.indeterminate = indeterminate;
                                      }}
                                      onChange={e => handleToggleAllExamAttendance(week.id, e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                                    />
                                  ) : null}
                                  <span>Att</span>
                                </div>
                              </th>
                            );
                          })()}
                          <th className="py-1 px-1 text-center text-yellow-600 dark:text-yellow-400 font-extrabold text-[10px] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">Bonus</th>
                          <th className="py-1 px-1 text-center text-gray-500 dark:text-gray-400 font-extrabold text-[10px] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">Exam</th>
                          <th className="py-1 px-1 text-center text-accent font-extrabold text-[10px] border-b-2 border-[#F3F4F6] dark:border-[#070C16]">Sum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                        {[...studentIds].sort((aId, bId) => {
                          const aExam = week.exams.find(e => e.studentId === aId);
                          let aLessonAttCount = 0;
                          let aLessonScoreSum = 0;
                          week.lessons.forEach(lesson => {
                            const entry = lesson.journalEntries.find(je => je.studentId === aId);
                            if (entry && entry.attended) {
                              aLessonAttCount++;
                              aLessonScoreSum += entry.score;
                            }
                          });
                          const aExamScore = aExam && aExam.attended ? aExam.examScore : 0;
                          const aBonus = aExam && aExam.attended ? aExam.bonus : 0;
                          const aTotal = aLessonAttCount + aLessonScoreSum + aExamScore + aBonus;

                          const bExam = week.exams.find(e => e.studentId === bId);
                          let bLessonAttCount = 0;
                          let bLessonScoreSum = 0;
                          week.lessons.forEach(lesson => {
                            const entry = lesson.journalEntries.find(je => je.studentId === bId);
                            if (entry && entry.attended) {
                              bLessonAttCount++;
                              bLessonScoreSum += entry.score;
                            }
                          });
                          const bExamScore = bExam && bExam.attended ? bExam.examScore : 0;
                          const bBonus = bExam && bExam.attended ? bExam.bonus : 0;
                          const bTotal = bLessonAttCount + bLessonScoreSum + bExamScore + bBonus;

                          return bTotal - aTotal;
                        }).map((stId, rowIdx) => {
                          const studentEntrySample = week.lessons
                            .flatMap(l => l.journalEntries)
                            .find(je => je.studentId === stId);
                          const studentExam = week.exams.find(e => e.studentId === stId);
                          const studentName = studentEntrySample
                            ? `${studentEntrySample.student.firstName} ${studentEntrySample.student.lastName}`
                            : studentExam
                            ? `${studentExam.student.firstName} ${studentExam.student.lastName}`
                            : 'Student';

                          const isMentor = user.role !== 'STUDENT';

                          // Calculate weekly lesson average/total
                          let lessonAttCount = 0;
                          let lessonScoreSum = 0;
                          week.lessons.forEach(lesson => {
                            const entry = lesson.journalEntries.find(je => je.studentId === stId);
                            if (entry && entry.attended) {
                              lessonAttCount++;
                              lessonScoreSum += entry.score;
                            }
                          });

                          const examScoreVal = studentExam && studentExam.attended ? studentExam.examScore : 0;
                          const examBonusVal = studentExam && studentExam.attended ? studentExam.bonus : 0;
                          const weeklyTotal = lessonAttCount + lessonScoreSum + examScoreVal + examBonusVal;

                          return (
                            <tr key={stId} className="hover:bg-accent/[0.02] dark:hover:bg-accent/[0.04] transition-colors">
                              {/* Student name (Sticky Left) */}
                              <td className="py-1.5 px-2 font-bold text-xs text-slate-700 dark:text-slate-200 sticky left-0 z-10 bg-[#f8fafc] dark:bg-[#070C16] border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                <div className="flex items-center gap-2">
                                  <div className="w-5.5 h-5.5 rounded-md bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/10 flex items-center justify-center text-accent font-black text-[9px] flex-shrink-0">
                                    {rowIdx + 1}
                                  </div>
                                  <span className="truncate max-w-[120px] text-xs" title={studentName}>
                                    {studentName}
                                  </span>
                                </div>
                              </td>

                              {/* Lessons score cells */}
                              {week.lessons.map(lesson => {
                                const entry = lesson.journalEntries.find(je => je.studentId === stId);
                                if (!entry) {
                                  return (
                                    <React.Fragment key={lesson.id}>
                                      <td className="py-1.5 px-1 text-center text-gray-400 text-xs border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">-</td>
                                      <td className="py-1.5 px-1 text-center text-gray-400 text-xs border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">-</td>
                                    </React.Fragment>
                                  );
                                }

                                return (
                                  <React.Fragment key={lesson.id}>
                                    {/* Att cell */}
                                    <td className="py-1.5 px-1 text-center border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                      <div className="flex items-center justify-center gap-1">
                                        {/* Note bubble icon */}
                                        <button
                                          onClick={() => setActiveNoteEntry(entry)}
                                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                                            entry.note
                                              ? 'text-[#4A3AFF] hover:bg-[#4A3AFF]/10'
                                              : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
                                          }`}
                                          title={entry.note || "Comment"}
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                        
                                        {/* Checkbox */}
                                        {isMentor ? (
                                          <input
                                            type="checkbox"
                                            checked={entry.attended}
                                            onChange={() => handleCellAttUpdate(entry.id, !entry.attended, entry.score)}
                                            className="w-4.5 h-4.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-accent focus:ring-accent cursor-pointer transition-colors"
                                          />
                                        ) : (
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                            entry.attended ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-655 dark:bg-red-950/30 dark:text-red-400'
                                          }`}>
                                            {entry.attended ? 'Present' : 'Absent'}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Score cell */}
                                    <td className="py-1.5 px-1 text-center border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                      {isMentor ? (
                                        <select
                                          disabled={!entry.attended}
                                          value={entry.score}
                                          onChange={(e) => handleCellScoreUpdate(entry.id, parseInt(e.target.value, 10))}
                                          className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-sm font-bold text-center text-slate-800 dark:text-white rounded-lg px-1 py-1 outline-none focus:ring-2 focus:ring-accent w-14 cursor-pointer transition-all hover:border-accent font-sans"
                                        >
                                          {[0, 1, 2, 3, 4, 5].map(v => (
                                            <option key={v} value={v} className="bg-white dark:bg-dark-card">{v}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="font-bold text-xs text-green-500">
                                          {entry.attended ? entry.score : '-'}
                                        </span>
                                      )}
                                    </td>
                                  </React.Fragment>
                                );
                              })}

                              {/* END OF WEEK: Exam Att Checkbox */}
                              <td className="py-1.5 px-1 text-center border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                {isMentor && studentExam ? (
                                  <input
                                    type="checkbox"
                                    checked={studentExam.attended}
                                    onChange={() => handleExamAttUpdate(studentExam.id, !studentExam.attended)}
                                    className="w-4.5 h-4.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-accent focus:ring-accent cursor-pointer transition-colors"
                                  />
                                ) : (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                    studentExam && studentExam.attended ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-655 dark:bg-red-950/30 dark:text-red-400'
                                  }`}>
                                    {studentExam && studentExam.attended ? 'Present' : 'Absent'}
                                  </span>
                                )}
                              </td>

                              {/* END OF WEEK: Bonus */}
                              <td className="py-1.5 px-1 text-center border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                {isMentor && studentExam ? (
                                  <InlineNumberInput
                                    disabled={!studentExam.attended}
                                    value={studentExam.bonus}
                                    onCommit={(val) => handleInlineExamUpdate(studentExam.id, 'bonus', val)}
                                    className="text-yellow-500 dark:text-yellow-400"
                                  />
                                ) : (
                                  <span className="font-bold text-xs text-yellow-500">{studentExam ? studentExam.bonus : 0}</span>
                                )}
                              </td>

                              {/* END OF WEEK: Exam score */}
                              <td className="py-1.5 px-1 text-center border-r-2 border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                {isMentor && studentExam ? (
                                  <InlineNumberInput
                                    disabled={!studentExam.attended}
                                    value={studentExam.examScore}
                                    onCommit={(val) => handleInlineExamUpdate(studentExam.id, 'examScore', val)}
                                  />
                                ) : (
                                  <span className="font-bold text-xs">{studentExam ? studentExam.examScore : 0}</span>
                                )}
                              </td>

                              {/* END OF WEEK: Sum with color coding */}
                              <td className="py-1.5 px-1 text-center border-b-2 border-[#F3F4F6] dark:border-[#070C16]">
                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-black ${
                                  weeklyTotal >= 90
                                    ? 'bg-[#DDF1E5] dark:bg-[#284D3C] text-[#1B5E20] dark:text-[#D4EDE1]'
                                    : weeklyTotal >= 85
                                    ? 'bg-[#FFF9D9] dark:bg-[#6F6E32] text-[#795548] dark:text-[#FFF2CC]'
                                    : weeklyTotal >= 80
                                    ? 'bg-[#FFF5DC] dark:bg-[#7A5E39] text-[#7E5109] dark:text-[#FFEB99]'
                                    : weeklyTotal >= 50
                                    ? 'bg-[#FFEBE5] dark:bg-[#713B33] text-[#6E2C00] dark:text-[#FFE0CC]'
                                    : 'bg-[#FDE2E4] dark:bg-[#8E282C] text-[#B71C1C] dark:text-[#F8D7DA]'
                                }`} style={{ minWidth: '30px', textAlign: 'center' }}>
                                  {weeklyTotal}
                                </span>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {user.role !== 'STUDENT' && (
        <button
          onClick={handleAddWeek}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-800 hover:border-accent text-gray-500 hover:text-accent font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>{t('journal.addWeek')}</span>
        </button>
      )}

      {/* Modal: Add Lesson */}
      {addLessonOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setAddLessonOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <span>Add Lesson</span>
            </h3>
            <form onSubmit={handleAddLessonSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 uppercase">Lesson Date</label>
                <input
                  type="date"
                  required
                  value={lessonDate}
                  onChange={e => setLessonDate(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddLessonOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-800 dark:text-gray-300"
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
        </div>,
        document.body
      )}

      {/* Modal: Note / Reason for Absence */}
      {activeNoteEntry && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100">
            <button
              onClick={() => setActiveNoteEntry(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black flex items-center gap-2 text-slate-850 dark:text-white">
              <MessageSquare className="w-5 h-5 text-accent" />
              <span>Reason for Absence / Lateness</span>
            </h3>

            <p className="text-xs text-gray-500 font-bold">
              Student: {activeNoteEntry.student.firstName} {activeNoteEntry.student.lastName}
            </p>

            <form onSubmit={handleNoteSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason Description</label>
                {user.role === 'STUDENT' ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-sm italic text-gray-600 dark:text-gray-300 min-h-[80px]">
                    {activeNoteEntry.note || 'No comments.'}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    placeholder="State reason for absence or lateness (e.g.: Sick / Late due to traffic)"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNoteEntry(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:bg-gray-800 dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all text-sm"
                >
                  {user.role === 'STUDENT' ? 'Close' : 'Cancel'}
                </button>
                {user.role !== 'STUDENT' && (
                  <button
                    type="submit"
                    disabled={noteLoading}
                    className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent transition-all text-sm flex items-center justify-center"
                  >
                    {noteLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Save'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Add Coins */}
      {addCoinsOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100">
            <button
              onClick={() => setAddCoinsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
                <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
                <path d="m2 16 6 6" />
                <circle cx="16" cy="9" r="2.9" />
                <circle cx="6" cy="5" r="3" />
              </svg>
              <span>Credit Coins</span>
            </h3>

            <form onSubmit={handleGiveCoinsSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase">Student</label>
                <select
                  required
                  value={addCoinsStudentId}
                  onChange={e => setAddCoinsStudentId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white font-sans font-semibold"
                >
                  {group?.students?.map(gs => (
                    <option key={gs.student.id} value={gs.student.id}>
                      {gs.student.firstName} {gs.student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-555 dark:text-gray-400 uppercase">Amount of Coins</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={addCoinsAmount}
                  onChange={e => setAddCoinsAmount(parseInt(e.target.value, 10) || 1)}
                  className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-555 dark:text-gray-400 uppercase">Reason for Crediting</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. For class activity"
                  value={addCoinsReason}
                  onChange={e => setAddCoinsReason(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddCoinsOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:bg-gray-850 dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCoinsLoading}
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent transition-all text-sm cursor-pointer flex items-center justify-center"
                >
                  {addCoinsLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Credit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Send Results */}
      {sendResultsOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100">
            <button
              onClick={() => setSendResultsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-[#229ED9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>Send Results</span>
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to send the current weekly grades to all students in this group via Telegram?
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setSendResultsOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:bg-gray-800 dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResultsSubmit}
                disabled={sendResultsLoading}
                className="flex-1 py-2.5 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white rounded-xl font-bold shadow-md transition-all text-sm cursor-pointer flex items-center justify-center"
              >
                {sendResultsLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
