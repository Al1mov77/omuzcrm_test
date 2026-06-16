import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Mail,
  Send,
  Camera,
  Check,
  AlertCircle,
  KeyRound,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowRight
} from 'lucide-react';

const getGroupLogo = (name: string) => {
  const n = name ? name.toLowerCase() : '';
  if (n.includes('next')) return { text: 'NEXT', classes: 'bg-black border-gray-850 text-white' };
  if (n.includes('react')) return { text: 'REACT', classes: 'bg-blue-50 dark:bg-blue-950/45 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400' };
  if (n.includes('js') || n.includes('javascript')) return { text: 'JS', classes: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/30 text-yellow-600 dark:text-yellow-400' };
  if (n.includes('py') || n.includes('python')) return { text: 'PY', classes: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' };
  return { text: name ? name.slice(0, 2).toUpperCase() : 'GP', classes: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/30 text-purple-600 dark:text-purple-400' };
};

// ==========================================
// 1. Student Performance Component (gFe in production)
// ==========================================
const StudentPerformanceCard: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/Student/get-student-performance?StudentId=${studentId}&WeekPageNumber=${selectedWeek - 1}`);
      if (res.data.statusCode === 200) {
        setPerformanceData(res.data.data);
      } else {
        showToast('Error loading performance', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedWeek, showToast]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  if (loading && !performanceData) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 gap-3 border border-gray-150 dark:border-gray-800">
        <Activity className="w-9 h-9 animate-pulse text-gray-300 dark:text-gray-650" />
        <p className="text-sm font-semibold">{t('profile.loading') || 'Loading performance...'}</p>
      </div>
    );
  }

  const dailyPerformance = performanceData?.dailyPerformance || [];
  const chartData = dailyPerformance.map((item: any) => {
    const date = new Date(item.date);
    return {
      ...item,
      formattedDate: `${t(`profile.months.${date.getMonth()}`) || date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
    };
  });

  const presentCount = performanceData?.countOfPresent ?? 0;
  const absentCount = performanceData?.countOfAbsent ?? 0;
  const lateMinutes = performanceData?.sumMinuteOfLate ?? 0;

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-6 transition-colors border border-gray-150 dark:border-gray-800" style={{ boxShadow: 'none' }}>
      {/* Header with title and week switcher */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-Montserrat">
            {t('profile.performance.title') || 'Performance'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {performanceData?.group?.groupName}
          </p>
        </div>

        {/* Week switcher */}
        <div className="flex items-center bg-gray-105 dark:bg-[#1F2937] rounded-xl" style={{ padding: '2px 4px' }}>
          <button
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek(prev => prev - 1)}
            className="p-1.5 bg-white dark:bg-transparent rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer border-none flex items-center justify-center"
          >
            <ChevronLeft className="w-5.5 h-5.5 text-blue-600" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-650 mx-1.5"></div>
          <span className="px-3 text-sm font-bold text-slate-800 dark:text-white select-none">
            {t('profile.performance.week') || 'Week'} {selectedWeek}
          </span>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-655 mx-1.5"></div>
          <button
            disabled={selectedWeek >= 5}
            onClick={() => setSelectedWeek(prev => prev + 1)}
            className="p-1.5 bg-white dark:bg-transparent rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer border-none flex items-center justify-center"
          >
            <ChevronRight className="w-5.5 h-5.5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <div className="bg-[#F0FDF4] dark:bg-[#043216] flex items-center justify-between py-3 px-3.5 rounded-xl">
          <span className="text-[11px] text-gray-550 font-bold uppercase tracking-wider">
            {t('profile.performance.present') || 'Attended'}
          </span>
          <span className="font-extrabold text-sm text-[#00D84A]">
            {presentCount} <span className="text-[10px] font-normal">{t('profile.performance.hours') || 'hours'}</span>
          </span>
        </div>
        <div className="bg-[#FEF2F2] dark:bg-[#3F0303] flex items-center justify-between py-3 px-3.5 rounded-xl">
          <span className="text-[11px] text-gray-550 font-bold uppercase tracking-wider">
            {t('profile.performance.absent') || 'Missed'}
          </span>
          <span className="font-extrabold text-sm text-[#EF4444]">
            {absentCount} <span className="text-[10px] font-normal">{t('profile.performance.hours') || 'hours'}</span>
          </span>
        </div>
        <div className="bg-[#FFF7ED] dark:bg-[#3F1202] flex items-center justify-between py-3 px-3.5 rounded-xl">
          <span className="text-[11px] text-gray-550 font-bold uppercase tracking-wider">
            {t('profile.performance.late') || 'Lateness'}
          </span>
          <span className="font-extrabold text-sm text-[#FF5700]">
            {lateMinutes} <span className="text-[10px] font-normal">{t('profile.performance.mins') || 'minutes'}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px] w-full relative">
        {chartData.length > 0 ? (
          <div className="w-full h-full absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendanceProfile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007bff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#007bff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#E5E7EB'} />
                <XAxis dataKey="formattedDate" stroke={theme === 'dark' ? '#ffffff' : '#000000'} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B', fontSize: 11, fontFamily: 'Montserrat', fontWeight: 500 }} />
                <YAxis hide={true} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.15)',
                            background: theme === 'dark' ? '#1F2937' : 'white',
                            color: theme === 'dark' ? '#fff' : '#000',
                            fontSize: '12px',
                            border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                            width: '180px',
                          }}
                        >
                          <div><strong>{t('profile.performance.score') || 'Score'}:</strong> {data.score ?? 0}</div>
                          <div><strong>{t('profile.performance.present') || 'Presence'}:</strong> {data.present ?? 'ABS'}</div>
                          <div><strong>{t('profile.performance.late') || 'Lateness'}:</strong> {data.late ?? 0}</div>
                          <div className="mt-1.5 border-t border-gray-250 dark:border-gray-700 pt-1.5">
                            <strong>{t('profile.performance.comment') || 'Comment'}:</strong><br/>
                            <span className="text-gray-500 dark:text-gray-400">{data.comment || t('profile.noComment') || 'No comments'}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#007bff" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendanceProfile)" dot={false} activeDot={{ r: 5, fill: '#007bff', stroke: '#fff', strokeWidth: 1.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <Activity className="w-9 h-9 text-gray-300 dark:text-gray-650" />
            <p className="text-sm font-semibold">{t('profile.noAttendanceData') || 'No attendance data'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. Student Groups Roadmap Component (Joe in production)
// ==========================================
const StudentGroupsRoadmap: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [groupOffsets, setGroupOffsets] = useState<Record<string, number>>({});
  
  const visibleWeeksLimit = window.innerWidth < 640 ? 2 : 3;

  useEffect(() => {
    api.get(`/api/Student/id?id=${studentId}`)
      .then(res => {
        if (res.data.statusCode === 200) {
          setStudentDetails(res.data.data);
          const initialOffsets: Record<string, number> = {};
          res.data.data.groups?.forEach((g: any) => {
            initialOffsets[g.id] = 0;
          });
          setGroupOffsets(initialOffsets);
        }
      })
      .catch(err => console.error(err));
  }, [studentId]);

  const getGroupLogo = (name: string) => {
    const n = name ? name.toLowerCase() : '';
    if (n.includes('next')) return { text: 'NEXT', classes: 'bg-black border-gray-855 text-white' };
    if (n.includes('react')) return { text: 'REACT', classes: 'bg-blue-50 dark:bg-blue-955/45 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400' };
    if (n.includes('js') || n.includes('javascript')) return { text: 'JS', classes: 'bg-yellow-50 dark:bg-yellow-955/40 border-yellow-200 dark:border-yellow-900/30 text-yellow-600 dark:text-yellow-400' };
    if (n.includes('py') || n.includes('python')) return { text: 'PY', classes: 'bg-emerald-50 dark:bg-emerald-955/40 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' };
    return { text: name ? name.slice(0, 2).toUpperCase() : 'GP', classes: 'bg-purple-50 dark:bg-purple-955/40 border-purple-200 dark:border-purple-900/30 text-purple-600 dark:text-purple-400' };
  };

  const getGradeCircleStyles = (grade: number) => {
    if (grade < 50) {
      return { border: 'border-[#EF4444]', text: 'text-[#EF4444]', bg: 'bg-[#FEF2F2] dark:bg-[#3F0303]' };
    } else if (grade < 90) {
      return { border: 'border-[#F97316]', text: 'text-[#F97316]', bg: 'bg-[#FFF7ED] dark:bg-[#3F1202]' };
    } else {
      return { border: 'border-[#22C55E]', text: 'text-[#22C55E]', bg: 'bg-[#F0FDF4] dark:bg-[#043216]' };
    }
  };

  if (!studentDetails || !studentDetails.groups || studentDetails.groups.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-6 transition-colors border border-gray-150 dark:border-gray-800" style={{ boxShadow: 'none' }}>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-Montserrat mb-5">
        {t('profile.roadmap.title') || 'Groups'}
      </h3>

      <div className="space-y-5 max-h-[450px] overflow-y-auto pr-1.5 custom-roadmap-scrollbar">
        {studentDetails.groups.map((group: any) => {
          const logo = getGroupLogo(group.groupName);
          const weeksArray = group.weeklyGrade || [];
          const offset = groupOffsets[group.id] || 0;

          const handlePrevWeeks = () => {
            setGroupOffsets(prev => ({ ...prev, [group.id]: Math.max(0, offset - 1) }));
          };

          const handleNextWeeks = () => {
            setGroupOffsets(prev => ({ ...prev, [group.id]: Math.min(weeksArray.length - visibleWeeksLimit, offset + 1) }));
          };

          return (
            <div key={group.id} className="bg-gray-55 dark:bg-dark-sidebar border border-gray-150 dark:border-gray-855 rounded-xl p-4.5 flex flex-col gap-4">
              {/* Group Info Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-sm border ${logo.classes}`}>
                    {logo.text}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-slate-800 dark:text-white truncate font-Montserrat" style={{ lineHeight: '18px' }}>
                      {group.groupName}
                    </h4>
                    <p className="text-sm text-gray-455 mt-1.5 font-Montserrat">
                      {group.startDate ? new Date(group.startDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="bg-[#E2E0FF] dark:bg-[#080066] hover:bg-[#d4d1ff] dark:hover:bg-[#0a0080] text-[#4A3AFF] dark:text-[#B5AFFF] px-4.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-none"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                  <span>{t('profile.journal') || 'Journal'}</span>
                </button>
              </div>

              {/* Slider & Average row */}
              <div className="flex items-center justify-between gap-4 mt-1">
                {/* Weeks Slider */}
                <div className="flex items-center gap-2 overflow-hidden">
                  {weeksArray.length > visibleWeeksLimit && (
                    <button
                      onClick={handlePrevWeeks}
                      disabled={offset === 0}
                      className="p-1 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer bg-transparent"
                      style={{ width: '24px', height: '48px' }}
                    >
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                  )}

                  <div className="flex gap-1.5">
                    {weeksArray.slice(offset, offset + visibleWeeksLimit).map((w: any) => {
                      const style = getGradeCircleStyles(w.grade);
                      return (
                        <div key={w.weekNumber} className={`flex flex-col items-center justify-center border-2 ${style.border} ${style.bg} rounded-xl py-2 px-3 min-w-[64px]`}>
                          <span className={`text-base font-bold ${style.text}`}>{w.grade}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mt-0.5">{w.weekNumber}-w</span>
                        </div>
                      );
                    })}
                  </div>

                  {weeksArray.length > visibleWeeksLimit && (
                    <button
                      onClick={handleNextWeeks}
                      disabled={offset >= weeksArray.length - visibleWeeksLimit}
                      className="p-1 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer bg-transparent"
                      style={{ width: '24px', height: '48px' }}
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {/* Avg Badge */}
                <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-center shadow-sm min-w-[54px]">
                  <span className="text-base font-black text-slate-800 dark:text-white">{group.totalAverage}</span>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold font-Montserrat mt-0.5">avg</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// Main ProfilePage Component
// ==========================================
export const ProfilePage: React.FC = () => {
  const { user, updateUser, refetchUser, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Editable Profile fields state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [parentPhone, setParentPhone] = useState(user?.parentPhone || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '');
  const [telegram, setTelegram] = useState(localStorage.getItem(`tg_${user?.id}`) || '');
  const [email] = useState(localStorage.getItem(`email_${user?.id}`) || '');

  // Password reset state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [adminGroups, setAdminGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setAddress(user.address || '');
      setParentPhone(user.parentPhone || '');
      setBirthDate(user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '');
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'MENTOR')) {
      api.get('/api/groups')
        .then(res => setAdminGroups(res.data))
        .catch(err => {
          console.error(err);
          showToast('Error loading groups', 'error');
        });
    }
  }, [user, showToast]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    showToast('You logged out', 'info');
    navigate('/login');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.patch('/api/users/me', {
        firstName,
        lastName,
        address,
        parentPhone,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
      });
      localStorage.setItem(`tg_${user.id}`, telegram);
      updateUser(res.data);
      setSuccess(t('common.success'));
      showToast(t('common.success'), 'success');
      await refetchUser();
      setIsEditing(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.patch('/api/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      updateUser(res.data);
      setSuccess(t('common.success'));
      showToast('Avatar successfully updated', 'success');
      await refetchUser();
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      await api.patch('/api/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setPwdSuccess(t('common.success'));
      showToast('Password successfully changed', 'success');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPwdModalOpen(false), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setPwdError(msg);
      showToast(msg, 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 text-slate-800 dark:text-slate-100 animate-fade-in font-sans">
      
      {/* Page Title */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-extrabold font-Montserrat tracking-tight text-gray-900 dark:text-white">
          {t('profile.title') || 'Profile'}
        </h1>
      </div>

      {/* ========= Grid Container: Profile Info (Left) + Performance / Groups (Right) ========= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: User details */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-dark-card rounded-2xl p-8 relative transition-colors border border-gray-150 dark:border-gray-800" style={{ boxShadow: 'none' }}>
            
            {/* Avatar & Name Row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                <img
                  src={user.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt="Avatar"
                  className="w-[130px] h-[130px] rounded-full border-2 border-gray-200 dark:border-gray-800 object-cover shadow-sm group-hover:shadow-md transition-shadow"
                />
                <button className="absolute bottom-0 right-0 w-[45px] h-[45px] rounded-full bg-[#4A3AFF] hover:bg-[#372FEE] text-white transition-all shadow-md hover:scale-110 border-none flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate font-Montserrat">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-500 font-bold mt-1">
                  Position : <span className="text-[#509EFF] font-bold">{user.role === 'SUPER_ADMIN' ? 'Admin' : user.role === 'MENTOR' ? 'Mentor' : 'Student'}</span>
                </p>
                
                <button
                  onClick={handleLogout}
                  className="mt-3 text-[#EF4444] bg-[#FEF2F2] hover:bg-[#ff6363] hover:text-[#FEF2F2] dark:bg-[#3F0303] dark:text-[#EF4444] dark:hover:bg-[#EF4444] dark:hover:text-white font-black px-4.5 py-2.5 rounded-2xl text-sm flex items-center gap-2 transition-colors focus:outline-none cursor-pointer border-none"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>{t('profile.logout') || 'Log out'}</span>
                </button>
              </div>
            </div>

            {/* Editable Form vs Details Display */}
            {isEditing ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-xs">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-650 dark:text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-550 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="block w-full px-4.5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#4A3AFF] text-sm mt-1.5 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-550 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="block w-full px-4.5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#4A3AFF] text-sm mt-1.5 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-550 uppercase">Birth Date</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="block w-full px-4.5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#4A3AFF] text-sm mt-1.5 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-550 uppercase">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="block w-full px-4.5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#4A3AFF] text-sm mt-1.5 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-550 uppercase">Parent Phone</label>
                    <input
                      type="text"
                      value={parentPhone}
                      onChange={e => setParentPhone(e.target.value)}
                      className="block w-full px-4.5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#4A3AFF] text-sm mt-1.5 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-550 uppercase">Telegram</label>
                    <input
                      type="text"
                      value={telegram}
                      onChange={e => setTelegram(e.target.value)}
                      className="block w-full px-4.5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#4A3AFF] text-sm mt-1.5 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-transparent rounded-2xl font-black text-sm cursor-pointer text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 bg-[#4A3AFF] hover:bg-[#372FEE] text-white rounded-2xl font-black text-sm cursor-pointer border-none disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-6 border-t border-gray-250 dark:border-gray-850">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">
                    {t('profile.registrated') || 'Registration Date'}:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {user.registerDate ? new Date(user.registerDate).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-555 dark:text-gray-400 font-bold">
                    {t('profile.branch') || 'Branch'}:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {user.branch?.name || ''}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-555 dark:text-gray-400 font-bold">
                    {t('profile.birthDate') || 'Birth Date'}:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-555 dark:text-gray-400 font-bold">
                    {t('profile.address') || 'Address'}:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {address || ''}
                  </span>
                </div>
                
                <div className="space-y-2.5 pt-2">
                  <p className="text-sm font-black text-slate-800 dark:text-white">
                    {t('profile.phoneNumber') || 'Phone Number'}:
                  </p>
                  <div className="flex justify-between items-center text-sm pl-3">
                    <span className="text-gray-555 dark:text-gray-400 font-bold">
                      {user.role === 'STUDENT' ? (t('profile.userTypes.student') || 'Student') : user.role === 'MENTOR' ? (t('profile.userTypes.mentor') || 'Mentor') : (t('profile.userTypes.admin') || 'Administrator')}:
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-white">{user.phone}</span>
                  </div>
                  {parentPhone && (
                    <div className="flex justify-between items-center text-sm pl-3">
                      <span className="text-gray-500 dark:text-gray-400 font-bold">Padarash:</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">{parentPhone}</span>
                    </div>
                  )}
                </div>

                {/* Social buttons */}
                <div className="flex gap-4 pt-4">
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-[#4A3AFF] hover:bg-gray-200 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                  <a
                    href={telegram ? `https://t.me/${telegram.replace('@', '')}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-[#4A3AFF]/5 hover:text-[#4A3AFF] dark:hover:bg-[#4A3AFF]/10 rounded-2xl text-sm font-black text-slate-800 dark:text-white flex items-center justify-center gap-2.5 transition-all no-underline"
                  >
                    <Send className="w-4.5 h-4.5 text-blue-500" />
                    <span>Telegram</span>
                  </a>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-black transition-all cursor-pointer border-none"
                  >
                    Edit profile details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 flex items-center justify-between transition-colors border border-gray-150 dark:border-gray-800" style={{ boxShadow: 'none' }}>
            <span className="text-base font-black text-slate-800 dark:text-white">Account</span>
            <button
              onClick={() => setPwdModalOpen(true)}
              className="px-5 py-3.5 bg-[#4A3AFF]/10 hover:bg-[#4A3AFF]/20 text-[#4A3AFF] dark:bg-[#4A3AFF]/20 rounded-2xl font-black text-sm transition-all flex items-center gap-2 focus:outline-none cursor-pointer border-none"
            >
              <KeyRound className="w-4.5 h-4.5" />
              <span>Reset password</span>
            </button>
          </div>
        </div>

        {/* Right Column: Performance & Groups (always show, fallback to default student for admins/mentors) */}
        <div className="space-y-5">
          {/* Performance Block (gFe) */}
          <StudentPerformanceCard studentId={user.role === 'STUDENT' ? user.id : 'bab2dfbb-c5f8-47f1-a985-800a795c87b6'} />
          
          {/* Groups Roadmap Block (Joe) */}
          <StudentGroupsRoadmap studentId={user.role === 'STUDENT' ? user.id : 'bab2dfbb-c5f8-47f1-a985-800a795c87b6'} />

          {user.role !== 'STUDENT' && (
            /* Groups for Admins/Mentors */
            <div className="bg-white dark:bg-dark-card border border-gray-150 dark:border-gray-800 rounded-lg p-5 transition-colors" style={{ boxShadow: 'none' }}>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 font-Montserrat">
                {user.role === 'SUPER_ADMIN' ? 'All Groups' : 'My Mentored Groups'}
              </h3>

              <div className="space-y-3">
                {adminGroups.length > 0 ? (
                  adminGroups.map((g: any) => {
                    const logo = getGroupLogo(g.name);
                    return (
                      <div key={g.id} className="bg-gray-50 dark:bg-dark-sidebar border border-gray-250 dark:border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer" onClick={() => navigate(`/groups/${g.id}`)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${logo.classes}`}>
                            {logo.text}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{g.name}</h4>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">{g.branch?.name || 'Profsouz'}</p>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-gray-505">
                          Mentor: {g.mentor ? `${g.mentor.firstName} ${g.mentor.lastName}` : 'TBD'}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="bg-[#4A3AFF]/10 hover:bg-[#4A3AFF]/20 px-4 py-2 rounded-xl text-xs font-extrabold text-[#4A3AFF] flex items-center gap-1.5">
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 py-4 text-center">No groups available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Change Password modal */}
      {pwdModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white font-Montserrat">
              <KeyRound className="w-5 h-5 text-[#4A3AFF]" />
              <span>{t('profile.resetPassword') || 'Change Password'}</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwdSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-sm">
                  <Check className="w-5 h-5" />
                  <span>{pwdSuccess}</span>
                </div>
              )}
              {pwdError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-655 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Old Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#4A3AFF] transition-all text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-550 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#4A3AFF] transition-all text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPwdModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-transparent rounded-xl font-bold text-xs cursor-pointer text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-2.5 bg-[#4A3AFF] hover:bg-[#372FEE] text-white rounded-xl font-bold text-xs cursor-pointer border-none disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
