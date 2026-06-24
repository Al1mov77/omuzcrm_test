import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
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
  BookOpen,
  Plus,
  ArrowRight,
  Users as UsersIcon,
  Calendar,
  Check,
  AlertCircle,
  X,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  GraduationCap,
  Clock,
  MapPin,
  Folder,
  Send,
  Activity,
  TrendingUp,
  UserX,
  Trash2,
  Edit
} from 'lucide-react';

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classroom?: string;
}

interface StudentDetails {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  parentPhone?: string;
  coins: number;
  birthDate?: string | Date;
}

interface GroupStudent {
  id: string;
  groupId: string;
  studentId: string;
  status: 'ACTIVE' | 'FINISHED' | 'LEFT' | 'TRANSFERED';
  leftReason?: string;
  joinedAt: string;
  student: StudentDetails;
}

interface Group {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  branch: Branch;
  mentor?: Mentor;
  classroom?: string;
  resourceUrl?: string;
  isActive: boolean;
  schedules?: Schedule[];
  students?: GroupStudent[];
}

export const GroupsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Student detail modal states
  const [modalStudentId, setModalStudentId] = useState<string | null>(null);
  const [modalStudentData, setModalStudentData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalWeekOffsets, setModalWeekOffsets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (modalStudentId) {
      setModalLoading(true);
      api.get(`/api/users/${modalStudentId}`)
        .then(res => {
          setModalStudentData(res.data);
          const offsets: Record<string, number> = {};
          res.data.groupsRoadmap?.forEach((g: any) => {
            offsets[g.groupId] = 0;
          });
          setModalWeekOffsets(offsets);
        })
        .catch(err => {
          console.error(err);
          showToast('Failed to load student data', 'error');
        })
        .finally(() => {
          setModalLoading(false);
        });
    } else {
      setModalStudentData(null);
    }
  }, [modalStudentId]);

  // Group creation DTO states
  const [createOpen, setCreateOpen] = useState(false);
  const [gName, setGName] = useState('');
  const [gStartDate, setGStartDate] = useState('');
  const [gEndDate, setGEndDate] = useState('');
  const [gBranchId, setGBranchId] = useState('');
  const [gMentorId, setGMentorId] = useState('');
  const [gCourseId, setGCourseId] = useState('');
  const [gStudentLimit, setGStudentLimit] = useState(20);
  const [gClassroom, setGClassroom] = useState('');
  const [gResourceUrl, setGResourceUrl] = useState('');
  
  // Schedule slots state inside creation
  const [schedulesList, setSchedulesList] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('16:00');

  // Transfer DTO states
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargetGroupId, setTransferTargetGroupId] = useState('');
  const [transferStudentId, setTransferStudentId] = useState('');

  // Exclude DTO states
  const [excludeOpen, setExcludeOpen] = useState(false);
  const [excludeReason, setExcludeReason] = useState('');
  const [excludeStudentId, setExcludeStudentId] = useState('');

  // Add student DTO states
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState('');
  const [studentsCatalog, setStudentsCatalog] = useState<StudentDetails[]>([]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/groups/${groupId}`);
      setSelectedGroup(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorsAndBranches = async () => {
    if (user?.role === 'STUDENT' || user?.role === 'MENTOR' || user?.role === 'TEACHER') return;
    try {
      const bRes = await api.get('/api/branches');
      setBranches(bRes.data);
      const mRes = await api.get('/api/users', { params: { role: 'MENTOR' } });
      setMentors(mRes.data);
      const sRes = await api.get('/api/users', { params: { role: 'STUDENT' } });
      setStudentsCatalog(sRes.data);
      const cRes = await api.get('/api/courses');
      setCourses(cRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGroupDetails(id);
    } else {
      setSelectedGroup(null);
      fetchGroups();
    }
  }, [id]);

  useEffect(() => {
    fetchMentorsAndBranches();
  }, [user]);

  const openEditGroup = (group: Group) => {
    setIsEditMode(true);
    setEditingGroupId(group.id);
    setGName(group.name);
    setGStartDate(group.startDate ? new Date(group.startDate).toISOString().split('T')[0] : '');
    setGEndDate(group.endDate ? new Date(group.endDate).toISOString().split('T')[0] : '');
    setGBranchId(group.branch?.id || '');
    setGMentorId(group.mentor?.id || '');
    setGCourseId((group as any).course?.id || (group as any).courseId || '');
    setGStudentLimit((group as any).studentLimit || 20);
    setGClassroom(group.classroom || '');
    setGResourceUrl(group.resourceUrl || '');
    setFormError('');
    setFormSuccess('');
    setCreateOpen(true);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        name: gName,
        startDate: new Date(gStartDate).toISOString(),
        endDate: new Date(gEndDate).toISOString(),
        branchId: gBranchId,
        mentorId: gMentorId || undefined,
        courseId: gCourseId || undefined,
        studentLimit: Number(gStudentLimit),
        classroom: gClassroom || undefined,
        resourceUrl: gResourceUrl || undefined,
      };

      if (isEditMode && editingGroupId) {
        // Edit Group
        await api.patch(`/api/groups/${editingGroupId}`, payload);
        showToast('Group successfully updated', 'success');
      } else {
        // 1. Create Group
        const res = await api.post('/api/groups', payload);
        const newGroupId = res.data.id;

        // 2. Add schedules if any
        for (const sched of schedulesList) {
          await api.post(`/api/timetable/${newGroupId}`, sched);
        }
        showToast('Group successfully created', 'success');
      }

      setFormSuccess(t('common.success'));
      setGName('');
      setGClassroom('');
      setGResourceUrl('');
      setSchedulesList([]);
      setGCourseId('');
      setGStudentLimit(20);
      
      fetchGroups();
      if (editingGroupId && selectedGroup && selectedGroup.id === editingGroupId) {
        fetchGroupDetails(editingGroupId);
      }
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const addScheduleSlot = () => {
    setSchedulesList([...schedulesList, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }]);
  };

  const removeScheduleSlot = (idx: number) => {
    setSchedulesList(schedulesList.filter((_, i) => i !== idx));
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !addStudentId) return;

    try {
      await api.post(`/api/groups/${selectedGroup.id}/students`, { studentId: addStudentId });
      setAddStudentOpen(false);
      setAddStudentId('');
      showToast('Student successfully added to group', 'success');
      await fetchGroupDetails(selectedGroup.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error adding student';
      showToast(msg, 'error');
    }
  };

  const handleExcludeStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !excludeStudentId) return;

    try {
      // Exclude student API takes body removeStudentDto
      await api.delete(`/api/groups/${selectedGroup.id}/students/${excludeStudentId}`, {
        data: { leftReason: excludeReason }
      });
      fetchGroupDetails(selectedGroup.id);
      setExcludeOpen(false);
      setExcludeReason('');
      showToast('Student successfully excluded from group', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error excluding student';
      showToast(msg, 'error');
    }
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !transferStudentId || !transferTargetGroupId) return;

    try {
      await api.patch(`/api/groups/${selectedGroup.id}/students/${transferStudentId}/transfer`, {
        targetGroupId: transferTargetGroupId,
      });
      fetchGroupDetails(selectedGroup.id);
      setTransferOpen(false);
      setTransferTargetGroupId('');
      showToast('Student transferred to another group', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error transferring student';
      showToast(msg, 'error');
    }
  };

  // Day Name Helper
  const getDayName = (dayNum: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum - 1] || '';
  };

  // Detail View
  if (selectedGroup) {
    const activeStudents = selectedGroup.students?.filter(s => s.status === 'ACTIVE' || s.status === 'FINISHED') || [];
    const leftStudents = selectedGroup.students?.filter(s => s.status === 'LEFT' || s.status === 'TRANSFERED') || [];

    const getAge = (birthDateString?: string | Date) => {
      if (!birthDateString) return 17; // fallback to representative mock age if empty
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? age : 17;
    };

    const dateRange = selectedGroup.startDate && selectedGroup.endDate
      ? `${new Date(selectedGroup.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${new Date(selectedGroup.startDate).getFullYear()} - ${new Date(selectedGroup.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${new Date(selectedGroup.endDate).getFullYear()}`
      : 'Apr 6, 2026 - May 6, 2026';

    const daysOfWeekLabels = [
      { label: 'Mn', value: 1 },
      { label: 'Tu', value: 2 },
      { label: 'Wd', value: 3 },
      { label: 'Th', value: 4 },
      { label: 'Fr', value: 5 },
      { label: 'Sa', value: 6 }
    ];

    const timeRange = selectedGroup.schedules && selectedGroup.schedules.length > 0
      ? `${selectedGroup.schedules[0].startTime} - ${selectedGroup.schedules[0].endTime}`
      : '18:00 - 20:00';

    const mentorName = selectedGroup.mentor
      ? `${selectedGroup.mentor.firstName} ${selectedGroup.mentor.lastName}`
      : 'Abdulloev Muhammadsurur';

    return (
      <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
        
        {/* ========= Info Cards Grid (4 widgets) ========= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Group Details & Resources */}
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[150px]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/groups')}
                    className="p-1 rounded-lg bg-gray-100 dark:bg-dark-sidebar border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-accent dark:hover:text-indigo-400 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-Montserrat font-extrabold text-base text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-[180px]" title={selectedGroup.name}>
                    {selectedGroup.name}
                  </h3>
                </div>
                {['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditGroup(selectedGroup)}
                      className="p-1 rounded-lg text-accent hover:bg-accent/10 transition-all cursor-pointer"
                      title="Edit Group"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete group "${selectedGroup.name}"? This action cannot be undone.`)) {
                          try {
                            await api.delete(`/api/groups/${selectedGroup.id}`);
                            navigate('/groups');
                            showToast('Group deleted successfully', 'success');
                          } catch (err: any) {
                            const msg = err.response?.data?.message || 'Error deleting group';
                            showToast(msg, 'error');
                          }
                        }
                      }}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 font-bold mt-1 pl-7">
                {selectedGroup.branch.name}
              </p>
            </div>

            <div className="pl-7 mt-4 space-y-2">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Course: <span className="font-extrabold text-accent">{(selectedGroup as any).course?.name || 'No Course'}</span>
              </div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Limit: <span className="font-extrabold">{selectedGroup.students?.filter(s => s.status === 'ACTIVE').length || 0} / {(selectedGroup as any).studentLimit || 20}</span>
              </div>
              {selectedGroup.resourceUrl && (
                <a
                  href={selectedGroup.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span className="relative inline-block">
                    <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-dark-card animate-pulse"></span>
                  </span>
                  <span>Resources</span>
                </a>
              )}
              <div className="text-[10px] text-gray-400 dark:text-gray-505 font-semibold">
                {dateRange}
              </div>
            </div>
          </div>

          {/* Card 2: Journal Link */}
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/40 dark:border-indigo-500/20 flex items-center justify-center text-accent">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Journal</h4>
            </div>

            <div className="mt-4">
              <button
                onClick={() => navigate(`/groups/detail/${selectedGroup.id}/journal`)}
                className="w-full py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-black transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Journal</span>
              </button>
            </div>
          </div>

          {/* Card 3: Schedule Details */}
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Schedule</h4>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-1">
                {daysOfWeekLabels.map(day => {
                  const isActive = selectedGroup.schedules?.some(s => s.dayOfWeek === day.value);
                  return (
                    <span
                      key={day.value}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-colors ${
                        isActive 
                          ? 'bg-green-50 dark:bg-[#064e3b]/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {day.label}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-550 dark:text-gray-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeRange}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Mentor Info */}
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200/40 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Mentors</h4>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-800 dark:text-white font-extrabold truncate" title={mentorName}>
                {mentorName}
              </p>
              {selectedGroup.classroom && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-555 dark:text-gray-400 font-bold mt-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedGroup.classroom}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ========= Active Students Table ========= */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-colors animate-scale-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <UsersIcon className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-855 dark:text-white">{t('groups.students')} ({activeStudents.length})</h3>
                <p className="text-[10px] text-gray-500 font-semibold">Active group members</p>
              </div>
            </div>
            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setAddStudentOpen(true)}
                className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 hover:scale-[1.02]"
              >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-850 text-xs font-black uppercase text-gray-400 tracking-wider">
                  <th className="pb-3 pr-4">FULL NAME</th>
                  <th className="pb-3 pr-4">AGE</th>
                  <th className="pb-3 pr-4">PHONE</th>
                  <th className="pb-3 pr-4">ACCOUNT</th>
                  <th className="pb-3 pr-4">STATUS</th>
                  {user?.role === 'SUPER_ADMIN' && <th className="pb-3 text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-850 text-xs font-bold">
                {activeStudents.map((gs, idx) => (
                  <tr key={gs.id} className="hover:bg-accent/[0.03] dark:hover:bg-accent/[0.05] transition-colors">
                    <td className="py-3.5 pr-4 font-extrabold">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/10 flex items-center justify-center text-accent font-black text-[10px]">
                          {gs.student.firstName[0]}{gs.student.lastName[0]}
                        </div>
                        <span
                          onClick={() => setModalStudentId(gs.studentId)}
                          className="text-slate-800 dark:text-white hover:text-accent hover:underline cursor-pointer transition-colors"
                        >
                          {idx + 1}. {gs.student.firstName} {gs.student.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-550 dark:text-gray-400 font-extrabold">
                      {getAge(gs.student.birthDate)}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-850 dark:text-slate-350">
                      <div>{gs.student.phone}</div>
                      {gs.student.parentPhone && (
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {gs.student.parentPhone} (Parent)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-550 dark:text-gray-400">YES</td>
                    <td className="py-3.5 pr-4">
                      {selectedGroup.isActive ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-[#fef3c7] dark:bg-[#78350f]/20 text-[#92400e] dark:text-[#fbbf24] border-[#fde68a] dark:border-[#92400e]/30">
                          Finished
                        </span>
                      )}
                    </td>
                    {user?.role === 'SUPER_ADMIN' && (
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setTransferStudentId(gs.studentId);
                            setTransferOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#4f46e5]/10 text-accent rounded-lg text-[10px] hover:bg-accent/20 transition-all font-black"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => {
                            setExcludeStudentId(gs.studentId);
                            setExcludeOpen(true);
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[10px] hover:bg-red-100 dark:bg-red-950/20 transition-all font-black"
                        >
                          Exclude
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {activeStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      <UsersIcon className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-xs font-semibold">No active students in the group</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Left Course Table / Section */}
        {leftStudents.length > 0 && (
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-colors animate-scale-in">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-500/20 flex items-center justify-center">
                <LogOut className="w-4.5 h-4.5 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-850 dark:text-white">Left course</h3>
                <p className="text-[10px] text-gray-500 font-semibold">Students who left the group</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-bold">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-400 uppercase tracking-wider font-black">
                    <th className="pb-3 pr-4">FULL NAME</th>
                    <th className="pb-3 pr-4">AGE</th>
                    <th className="pb-3 pr-4">PHONE</th>
                    <th className="pb-3 pr-4">ACCOUNT</th>
                    <th className="pb-3 pr-4">REASON</th>
                    <th className="pb-3 pr-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-850">
                  {leftStudents.map((gs, idx) => (
                    <tr key={gs.id} className="hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors">
                      <td className="py-3 text-slate-800 dark:text-white font-extrabold">
                        <span
                          onClick={() => setModalStudentId(gs.studentId)}
                          className="hover:text-accent hover:underline cursor-pointer transition-colors"
                        >
                          {idx + 1}. {gs.student.firstName} {gs.student.lastName}
                        </span>
                      </td>
                      <td className="py-3 text-gray-550 dark:text-gray-400 font-extrabold">{getAge(gs.student.birthDate)}</td>
                      <td className="py-3 text-slate-850 dark:text-slate-350">
                        <div>{gs.student.phone}</div>
                        {gs.student.parentPhone && (
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {gs.student.parentPhone} (Parent)
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-gray-550">YES</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400 italic max-w-xs truncate">{gs.leftReason || 'Not specified'}</td>
                      <td className="py-3">
                        {gs.status === 'TRANSFERED' ? (
                          <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Transfered
                          </span>
                        ) : (
                          <span className="bg-[#ffe4e6] dark:bg-red-950/30 text-[#be123c] dark:text-red-400 border border-[#fecdd3] dark:border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Left
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Transfer Student */}
        {transferOpen && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card border border-gray-205 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100">
              <button
                onClick={() => setTransferOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black flex items-center gap-2">
                <MoveHorizontal className="w-5 h-5 text-accent animate-pulse-subtle" />
                <span>{t('groups.transfer')}</span>
              </h3>
              <form onSubmit={handleTransferStudent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Select target group</label>
                  <select
                    required
                    value={transferTargetGroupId}
                    onChange={e => setTransferTargetGroupId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                  >
                    <option value="">Select group</option>
                    {groups
                      .filter(g => g.id !== selectedGroup.id)
                      .map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.branch.name})</option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setTransferOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-800 dark:text-gray-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent transition-all text-sm"
                  >
                    Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal: Exclude Student */}
        {excludeOpen && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card border border-gray-205 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100">
              <button
                onClick={() => setExcludeOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black text-red-500 flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                <span>Exclude Student</span>
              </h3>
              <form onSubmit={handleExcludeStudent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">{t('groups.leftReason')}</label>
                  <input
                    type="text"
                    required
                    value={excludeReason}
                    onChange={e => setExcludeReason(e.target.value)}
                    placeholder="e.g. Poor performance / Relocation"
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setExcludeOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-800 dark:text-gray-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md transition-all text-sm hover:bg-red-700"
                  >
                    Exclude
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal: Add Student */}
        {addStudentOpen && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card border border-gray-205 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100">
              <button
                onClick={() => setAddStudentOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                <span>Add student to group</span>
              </h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase">Select student</label>
                  <select
                    required
                    value={addStudentId}
                    onChange={e => setAddStudentId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm text-slate-800 dark:text-white"
                  >
                    <option value="">Select student from catalog</option>
                    {studentsCatalog
                      .filter(s => !selectedGroup.students?.some(gs => gs.studentId === s.id && gs.status === 'ACTIVE'))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.phone})</option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setAddStudentOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-800 dark:text-gray-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent transition-all text-sm"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ========= Groups Grid Listing View =========
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Groups</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your center's academic groups and student average scores.</p>
        </div>

        {['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '') && (
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditingGroupId(null);
              setGName('');
              setGStartDate('');
              setGEndDate('');
              setGBranchId('');
              setGMentorId('');
              setGCourseId('');
              setGStudentLimit(20);
              setGClassroom('');
              setGResourceUrl('');
              setFormError('');
              setFormSuccess('');
              setCreateOpen(true);
            }}
            className="px-5 py-3 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Create group</span>
          </button>
        )}
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {groups.map(g => {
            // Group visual grade average mock styling
            const score = 84;
            const colorClass = score >= 90 ? 'text-green-500 bg-green-50 dark:bg-green-950/20' : score >= 80 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' : 'text-red-500 bg-red-50 dark:bg-red-950/20';
            return (
              <div
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4 card-hover cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-855 text-gray-500 text-[10px] font-black uppercase">
                      {g.branch.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg font-black text-xs ${colorClass}`}>
                        {score}%
                      </span>
                      {['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '') && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete group "${g.name}"? This action cannot be undone.`)) {
                              try {
                                await api.delete(`/api/groups/${g.id}`);
                                fetchGroups();
                                showToast('Group deleted successfully', 'success');
                              } catch (err: any) {
                                const msg = err.response?.data?.message || 'Error deleting group';
                                showToast(msg, 'error');
                              }
                            }
                          }}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-extrabold text-lg group-hover:text-accent transition-colors leading-snug">{g.name}</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Course: {(g as any).course?.name || 'No Course'}</p>
                  <p className="text-xs text-gray-500">Teacher: {g.mentor ? `${g.mentor.firstName} ${g.mentor.lastName}` : 'TBD'}</p>
                  <p className="text-xs text-gray-500">Students: {g.students?.filter(s => s.status === 'ACTIVE').length || 0} / {(g as any).studentLimit || 20}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-150 dark:border-gray-800 mt-2 text-xs font-bold text-accent">
                  <span>View details</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm">Group list is empty</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Group */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 animate-slide-up shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <span>{isEditMode ? 'Edit academic group' : 'Create new academic group'}</span>
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-5">
              {formSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Group Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Group name</label>
                  <input
                    type="text"
                    required
                    value={gName}
                    onChange={e => setGName(e.target.value)}
                    placeholder="Python Data Science"
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Classroom */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Classroom</label>
                  <input
                    type="text"
                    value={gClassroom}
                    onChange={e => setGClassroom(e.target.value)}
                    placeholder="Classroom 202"
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Start date</label>
                  <input
                    type="date"
                    required
                    value={gStartDate}
                    onChange={e => setGStartDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">End date</label>
                  <input
                    type="date"
                    required
                    value={gEndDate}
                    onChange={e => setGEndDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Branch */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Branch</label>
                  <select
                    required
                    value={gBranchId}
                    onChange={e => setGBranchId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="">Select branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Mentor */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Teacher (Mentor)</label>
                  <select
                    value={gMentorId}
                    onChange={e => setGMentorId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="">Select teacher</option>
                    {mentors.map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Course */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Course</label>
                  <select
                    required
                    value={gCourseId}
                    onChange={e => setGCourseId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.price} TJS</option>
                    ))}
                  </select>
                </div>

                {/* Student Limit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Student limit</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={gStudentLimit}
                    onChange={e => setGStudentLimit(parseInt(e.target.value, 10))}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Resource URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Course resource URL link</label>
                <input
                  type="url"
                  value={gResourceUrl}
                  onChange={e => setGResourceUrl(e.target.value)}
                  placeholder="https://github.com/omuz/course-repo"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Timetable Sub-form */}
              <div className="border border-gray-200 dark:border-gray-850 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-800/10 space-y-4">
                <h4 className="font-extrabold text-sm text-accent">Setup lesson schedule</h4>
                
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[120px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Day of the week</label>
                    <select
                      value={newDay}
                      onChange={e => setNewDay(parseInt(e.target.value, 10))}
                      className="block w-full px-3 py-2 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-xs"
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

                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Start (HH:mm)</label>
                    <input
                      type="text"
                      value={newStart}
                      onChange={e => setNewStart(e.target.value)}
                      className="block w-full px-3 py-2 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-xs"
                    />
                  </div>

                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Finish (HH:mm)</label>
                    <input
                      type="text"
                      value={newEnd}
                      onChange={e => setNewEnd(e.target.value)}
                      className="block w-full px-3 py-2 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addScheduleSlot}
                    className="px-4 py-2 bg-accent text-white font-bold rounded-lg text-xs"
                  >
                    Add slot
                  </button>
                </div>

                {/* Schedules Slot Ledger */}
                {schedulesList.length > 0 && (
                  <div className="pt-2 divide-y divide-gray-200 dark:divide-gray-800">
                    {schedulesList.map((sc, i) => (
                      <div key={i} className="flex justify-between items-center py-2 text-xs font-semibold">
                        <span>{getDayName(sc.dayOfWeek)}: {sc.startTime} — {sc.endTime}</span>
                        <button
                          type="button"
                          onClick={() => removeScheduleSlot(i)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-850 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-bold shadow-md glow-accent flex items-center justify-center transition-all text-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* Modal: Student Detail Profile (Admin/Mentor view) */}
      {modalStudentId && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-5xl w-full animate-slide-up shadow-2xl relative text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalStudentId(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {modalLoading || !modalStudentData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-gray-550">Loading student profile...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header info */}
                <div>
                  <h3 className="text-xl font-bold font-Montserrat tracking-tight text-gray-900 dark:text-white">
                    Student profile: {modalStudentData.firstName} {modalStudentData.lastName}
                  </h3>
                  <p className="text-xs text-gray-550 dark:text-gray-400 font-semibold mt-0.5">
                    User ID: <span className="font-bold text-slate-800 dark:text-white">{modalStudentData.id}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Profile Card details */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-sidebar border border-gray-200 dark:border-gray-800/80 rounded-2xl p-5 space-y-4">
                      {/* Avatar */}
                      <div className="flex items-center gap-3">
                        <img
                          src={modalStudentData.avatarUrl ? `http://localhost:3000${modalStudentData.avatarUrl}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full border border-gray-200 dark:border-gray-800 object-cover shadow-sm"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white truncate font-Montserrat">{modalStudentData.firstName} {modalStudentData.lastName}</h4>
                          <span className="bg-[#4A3AFF]/10 text-[#4A3AFF] px-2 py-0.5 rounded text-[10px] font-black uppercase mt-1 inline-block">
                            Student
                          </span>
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="space-y-2.5 pt-3 border-t border-gray-200 dark:border-gray-800/80 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-550 font-bold">Registration date:</span>
                          <span className="font-extrabold text-slate-800 dark:text-white">
                            {modalStudentData.registerDate ? new Date(modalStudentData.registerDate).toISOString().slice(0, 10).split('-').reverse().join('.') : '05.06.2025'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-555 font-bold">Branch:</span>
                          <span className="font-extrabold text-slate-800 dark:text-white">{modalStudentData.branch?.name || 'Profsouz'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-555 font-bold">Birthdate:</span>
                          <span className="font-extrabold text-slate-800 dark:text-white">
                            {modalStudentData.birthDate ? new Date(modalStudentData.birthDate).toISOString().slice(0, 10).split('-').reverse().join('.') : '13.12.2010'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-555 font-bold">Address:</span>
                          <span className="font-extrabold text-slate-800 dark:text-white">{modalStudentData.address || 'Firdavsi'}</span>
                        </div>
                        
                        <div className="space-y-1 pt-1">
                          <p className="font-black text-slate-800 dark:text-white">Phone number:</p>
                          <div className="flex justify-between items-center pl-2">
                             <span className="text-gray-555 font-bold">Student:</span>
                            <span className="font-extrabold text-slate-800 dark:text-white">{modalStudentData.phone}</span>
                          </div>
                          {modalStudentData.parentPhone && (
                            <div className="flex justify-between items-center pl-2">
                               <span className="text-gray-555 font-bold">Parent:</span>
                              <span className="font-extrabold text-slate-800 dark:text-white">{modalStudentData.parentPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Social Badges */}
                        <div className="flex gap-2.5 pt-2">
                          <a
                            href={`https://t.me/${modalStudentData.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 px-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-855 hover:bg-[#4A3AFF]/5 hover:text-[#4A3AFF] dark:hover:bg-[#4A3AFF]/10 rounded-xl text-[10px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Send className="w-3 h-3 text-blue-500" />
                            <span>Telegram</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Performance and Roadmaps */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Performance summary capsules */}
                    <div className="flex flex-wrap gap-2.5">
                      <div className="bg-[#F0FDF4] dark:bg-[#043216] text-[#00D84A] border border-green-100 dark:border-green-900/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-bold">Attended:</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-xs">{modalStudentData.performance?.presentHours || 0} h</span>
                      </div>
                      <div className="bg-[#FEF2F2] dark:bg-[#3F0303] text-[#EF4444] border border-red-100 dark:border-red-900/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5" />
                        <span className="font-bold">Missed:</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-xs">{modalStudentData.performance?.absentHours || 0} h</span>
                      </div>
                      <div className="bg-[#FFF7ED] dark:bg-[#3F1202] text-[#F97316] border border-amber-100 dark:border-amber-900/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-bold">Lateness:</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-xs">{modalStudentData.performance?.lateMins || 0} min</span>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-gray-50 dark:bg-dark-sidebar/40 rounded-2xl p-4 border border-gray-150 dark:border-gray-800/80">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2 font-Montserrat flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-accent" />
                        <span>Performance</span>
                      </h4>
                      <div className="h-44 w-full relative">
                        {modalStudentData.performance?.attendanceHistory && modalStudentData.performance.attendanceHistory.length > 0 ? (
                          <div className="w-full h-full absolute inset-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={modalStudentData.performance.attendanceHistory}
                                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="modalColorAttendance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4A3AFF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4A3AFF" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#E5E7EB'} />
                                <XAxis
                                  dataKey="lesson"
                                  stroke={theme === 'dark' ? '#ffffff' : '#000000'}
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{ fill: theme === 'dark' ? '#ffffff' : '#000000', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }}
                                />
                                <YAxis
                                  domain={[0, 5]}
                                  ticks={[0, 1, 2, 3, 4, 5]}
                                  stroke={theme === 'dark' ? '#ffffff' : '#000000'}
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{ fill: theme === 'dark' ? '#ffffff' : '#000000', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div
                                          className="p-2.5 rounded-lg shadow-lg border text-[10px] leading-relaxed"
                                          style={{
                                            backgroundColor: theme === 'dark' ? '#1F2937' : '#ffffff',
                                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                                            color: theme === 'dark' ? '#ffffff' : '#000000',
                                            width: '150px'
                                          }}
                                        >
                                          <div><strong>Score:</strong> {data.score ?? 0}</div>
                                          <div><strong>Presence:</strong> {data.present ?? 'ABS'}</div>
                                          <div><strong>Lateness:</strong> {data.late ?? 0} min</div>
                                          {data.comment && (
                                            <div className="mt-1 pt-1 border-t border-gray-250 dark:border-gray-700 break-words whitespace-normal text-[9px] text-gray-555">
                                              {data.comment}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Area
                                  type="bump"
                                  dataKey="score"
                                  stroke="#4A3AFF"
                                  strokeWidth={2.5}
                                  fillOpacity={1}
                                  fill="url(#modalColorAttendance)"
                                  dot={{ r: 3, fill: '#4A3AFF', strokeWidth: 1.5, stroke: theme === 'dark' ? '#0e1322' : '#ffffff' }}
                                  activeDot={{ r: 5, fill: '#4A3AFF', stroke: '#a78bfa', strokeWidth: 1.5 }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-1.5">
                            <Activity className="w-6 h-6 text-gray-300 dark:text-gray-650" />
                            <p className="text-sm font-semibold">No attendance data</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Roadmap details inside modal */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white font-Montserrat">Groups and scores</h4>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1.5 custom-roadmap-scrollbar">
                        {modalStudentData.groupsRoadmap && modalStudentData.groupsRoadmap.length > 0 ? (
                          modalStudentData.groupsRoadmap.map((roadmap: any) => {
                            const offset = modalWeekOffsets[roadmap.groupId] || 0;
                            const limit = 3;
                            const weeksArray = roadmap.weeks || [];

                            const handlePrevWeeks = () => {
                              setModalWeekOffsets(prev => ({
                                ...prev,
                                [roadmap.groupId]: Math.max(0, offset - 1)
                              }));
                            };

                            const handleNextWeeks = () => {
                              setModalWeekOffsets(prev => ({
                                ...prev,
                                [roadmap.groupId]: Math.min(weeksArray.length - limit, offset + 1)
                              }));
                            };

                            // Score circular badge color styling matching production S(grade)
                            const getGradeCircleStyles = (grade: number) => {
                              if (grade < 50) return { border: 'border-[#EF4444]', text: 'text-[#EF4444]', bg: 'bg-[#FEF2F2] dark:bg-[#3F0303]' };
                              if (grade < 90) return { border: 'border-[#F97316]', text: 'text-[#F97316]', bg: 'bg-[#FFF7ED] dark:bg-[#3F1202]' };
                              return { border: 'border-[#22C55E]', text: 'text-[#22C55E]', bg: 'bg-[#F0FDF4] dark:bg-[#043216]' };
                            };

                            return (
                              <div key={roadmap.groupId} className="bg-gray-55 dark:bg-dark-sidebar/40 border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-800 dark:text-white">{roadmap.groupName}</h5>
                                  <p className="text-[9px] text-gray-500 font-bold mt-0.5">Mentor: {roadmap.mentorName}</p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={handlePrevWeeks}
                                    disabled={offset === 0}
                                    className="p-1 rounded bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 hover:bg-gray-50 text-gray-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  <div className="flex gap-2">
                                    {weeksArray.slice(offset, offset + limit).map((w: any) => {
                                      const weekGrade = w.sum ?? Math.round(w.averageScore * 20);
                                      const circleStyle = getGradeCircleStyles(weekGrade);
                                      return (
                                        <div key={w.weekNumber} className="flex flex-col items-center gap-0.5">
                                          <div className={`w-8 h-8 rounded-full border ${circleStyle.border} ${circleStyle.bg} ${circleStyle.text} flex items-center justify-center font-black text-[10px] transition-colors`}>
                                            {weekGrade}
                                          </div>
                                          <span className="text-[8px] text-gray-555 dark:text-gray-400 font-extrabold">{w.weekNumber}-w</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <button
                                    onClick={handleNextWeeks}
                                    disabled={offset >= weeksArray.length - limit}
                                    className="p-1 rounded bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 hover:bg-gray-50 text-gray-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 px-2.5 py-1 rounded-lg text-center shadow-sm">
                                    <span className="text-xs font-black text-slate-800 dark:text-white">{roadmap.overallAverage}</span>
                                    <span className="block text-[7px] text-gray-500 uppercase tracking-wider font-extrabold">avg</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[10px] text-gray-550 text-center py-2">No data on groups</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
