import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Check,
  MapPin,
  Mail,
  User as UserIcon,
  Phone,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Student {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: string;
  address?: string;
  parentPhone?: string;
  createdAt: string;
  isActive: boolean;
  branch?: Branch;
  branchId?: string;
  coins: number;
  groupStudents?: any[];
}

export const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Nested logs
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'attendance'>('info');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users', {
        params: {
          role: 'STUDENT',
          branchId: branchFilter || undefined,
          search: search || undefined,
          groupId: groupFilter || undefined,
          courseId: courseFilter || undefined,
        },
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      showToast('Error loading students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersCatalog = async () => {
    try {
      const [bRes, cRes, gRes] = await Promise.all([
        api.get('/api/branches'),
        api.get('/api/courses'),
        api.get('/api/groups'),
      ]);
      setBranches(bRes.data);
      setCourses(cRes.data);
      setGroups(gRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branchFilter, courseFilter, groupFilter]);

  useEffect(() => {
    fetchFiltersCatalog();
  }, []);

  const handleOpenDetail = async (student: Student) => {
    setSelectedStudent(student);
    setActiveTab('info');
    setDetailOpen(true);

    // Fetch payments
    try {
      const pRes = await api.get('/api/payments', { params: { studentId: student.id } });
      setPayments(pRes.data);
    } catch (e) {
      setPayments([]);
    }

    // Fetch performance/attendance details
    try {
      const aRes = await api.get('/api/Student/get-student-performance', {
        params: { StudentId: student.id, WeekPageNumber: '0' },
      });
      setAttendance(aRes.data.data);
    } catch (e) {
      setAttendance(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/api/users', {
        phone,
        password,
        firstName,
        lastName,
        role: 'STUDENT',
        email: email || undefined,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
        address: address || undefined,
        parentPhone: parentPhone || undefined,
        branchId: branchId || undefined,
        isActive: true,
      });

      setFormSuccess('Student successfully created');
      showToast('Student successfully created', 'success');
      // Reset form
      setPhone('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setBirthDate('');
      setAddress('');
      setParentPhone('');
      setBranchId('');

      fetchStudents();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating student';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEditOpen = (student: Student) => {
    setSelectedStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setPhone(student.phone);
    setEmail(student.email || '');
    setAddress(student.address || '');
    setParentPhone(student.parentPhone || '');
    setBranchId(student.branchId || '');
    setIsActive(student.isActive);
    if (student.birthDate) {
      setBirthDate(new Date(student.birthDate).toISOString().split('T')[0]);
    } else {
      setBirthDate('');
    }
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError('');
    setFormSuccess('');

    try {
      await api.patch(`/api/users/${selectedStudent.id}`, {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        address: address || undefined,
        parentPhone: parentPhone || undefined,
        branchId: branchId || undefined,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
        isActive,
      });

      setFormSuccess('Student details updated');
      showToast('Student details updated', 'success');
      fetchStudents();
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error updating student';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student account?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      showToast('Student successfully deleted', 'success');
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting student', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Донишҷӯён (Students)</h2>
          <p className="text-sm text-gray-550 dark:text-gray-400">Рӯйхат ва идоракунии донишҷӯён.</p>
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setCreateOpen(true);
            }}
            className="px-5 py-3 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center justify-center gap-2 text-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Илова кардани донишҷӯ</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Ҷустуҷӯ аз рӯи ном, телефон..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
          />
        </div>

        {/* Branch Filter */}
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold appearance-none"
          >
            <option value="">Ҳамаи филиалҳо</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Course Filter */}
        <div className="relative">
          <FileSpreadsheet className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold appearance-none"
          >
            <option value="">Ҳамаи курсҳо</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Group Filter */}
        <div className="relative">
          <Users className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold appearance-none"
          >
            <option value="">Ҳамаи гурӯҳҳо</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of students */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          {students.map(student => (
            <div key={student.id} className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[190px] card-hover hover:scale-[1.01] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A3AFF]/20 to-purple-500/20 border border-[#4A3AFF]/10 flex items-center justify-center text-[#4A3AFF] font-black text-sm">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${student.isActive ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-red-50 text-red-600 border border-red-200/50'}`}>
                      {student.isActive ? 'Active' : 'Locked'}
                    </span>
                    {student.branch && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wider bg-slate-100 dark:bg-gray-850 text-gray-500 border border-slate-200/30">
                        {student.branch.name}
                      </span>
                    )}
                  </div>
                  <h4
                    onClick={() => handleOpenDetail(student)}
                    className="font-extrabold text-sm hover:text-accent hover:underline cursor-pointer transition-colors mt-2 truncate"
                  >
                    {student.firstName} {student.lastName}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-bold">{student.phone}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-150 dark:border-gray-800 mt-4">
                <div className="text-[10px] text-gray-450 font-bold">
                  Қайд: {new Date(student.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenDetail(student)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-accent transition-colors"
                    title="Profile & logs"
                  >
                    <UserIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditOpen(student)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit info"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 font-bold">
              <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <span>Ягон донишҷӯ ёфт нашуд.</span>
            </div>
          )}
        </div>
      )}

      {/* Modal: View Details, Payments & Attendance */}
      {detailOpen && selectedStudent && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-250 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full space-y-6 animate-slide-up shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/10 flex items-center justify-center text-accent font-black text-lg">
                {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
              </div>
              <div>
                <h3 className="text-lg font-black">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                <span className="text-xs text-gray-400 font-bold">ID: {selectedStudent.id}</span>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-gray-150 dark:border-gray-800 gap-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-2.5 px-3 font-black text-xs transition-colors uppercase tracking-wider ${activeTab === 'info' ? 'border-b-2 border-accent text-accent' : 'text-gray-400 hover:text-gray-700'}`}
              >
                Маълумот (Info)
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-2.5 px-3 font-black text-xs transition-colors uppercase tracking-wider ${activeTab === 'payments' ? 'border-b-2 border-accent text-accent' : 'text-gray-400 hover:text-gray-700'}`}
              >
                Пардохтҳо (Payments)
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`pb-2.5 px-3 font-black text-xs transition-colors uppercase tracking-wider ${activeTab === 'attendance' ? 'border-b-2 border-accent text-accent' : 'text-gray-400 hover:text-gray-700'}`}
              >
                Иштирок (Attendance)
              </button>
            </div>

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold leading-relaxed">
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-450" /><span>Телефон: {selectedStudent.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-450" /><span>Email: {selectedStudent.email || 'Нишон дода нашудааст'}</span></div>
                  <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-gray-450" /><span>Падар: {selectedStudent.parentPhone || 'Нишон дода нашудааст'}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-450" /><span>Санаи таваллуд: {selectedStudent.birthDate ? new Date(selectedStudent.birthDate).toLocaleDateString() : 'Нишон дода нашудааст'}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-450" /><span>Суроға: {selectedStudent.address || 'Нишон дода нашудааст'}</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-gray-450" /><span>Бақайдгирӣ: {new Date(selectedStudent.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            )}

            {/* Tab: Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-black text-gray-400">Таърихи пардохтҳо</h4>
                <div className="overflow-x-auto border border-gray-150 dark:border-gray-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-150 dark:border-gray-700 text-gray-500 font-extrabold uppercase text-[10px]">
                        <th className="p-3">Сана</th>
                        <th className="p-3">Маблағ</th>
                        <th className="p-3">Навъ</th>
                        <th className="p-3">Шарҳ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b border-gray-150 dark:border-gray-800 font-semibold hover:bg-gray-50/50">
                          <td className="p-3">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="p-3 font-extrabold text-green-600">{p.amount} сомонӣ</td>
                          <td className="p-3 uppercase">{p.paymentType}</td>
                          <td className="p-3 text-gray-500 italic">{p.comment || '-'}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-400 font-medium">Ягон пардохт сабт нашудааст.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Attendance */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200/50 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-green-700 dark:text-green-400">Иштирок (Present)</span>
                    <p className="text-xl font-black text-green-800 dark:text-green-300 mt-1">{attendance?.countOfPresent || 0} дарс</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-red-700 dark:text-red-400">Ғоиб (Absent)</span>
                    <p className="text-xl font-black text-red-800 dark:text-red-300 mt-1">{attendance?.countOfAbsent || 0} дарс</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-yellow-700 dark:text-yellow-400">Деркунӣ (Late)</span>
                    <p className="text-xl font-black text-yellow-800 dark:text-yellow-300 mt-1">{attendance?.sumMinuteOfLate || 0} дақиқа</p>
                  </div>
                </div>

                <h4 className="text-xs uppercase font-black text-gray-400 mt-4">Таърихи иштироки рӯзона</h4>
                <div className="overflow-y-auto max-h-56 border border-gray-150 dark:border-gray-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-150 dark:border-gray-700 text-gray-500 font-extrabold uppercase text-[10px]">
                        <th className="p-3">Сана</th>
                        <th className="p-3">Ҳолат</th>
                        <th className="p-3">Баҳо (Score)</th>
                        <th className="p-3">Шарҳ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance?.dailyPerformance?.map((dp: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-150 dark:border-gray-800 font-semibold hover:bg-gray-50/50">
                          <td className="p-3">{new Date(dp.date).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${dp.present === 'Был' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-650'}`}>
                              {dp.present}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-blue-600">{dp.score || '-'}</td>
                          <td className="p-3 text-gray-500 italic">{dp.comment || '-'}</td>
                        </tr>
                      ))}
                      {(!attendance || attendance.dailyPerformance?.length === 0) && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-400 font-medium">Ягон маълумоти иштирок ёфт нашуд.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Student */}
      {createOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-250 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 animate-slide-up shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-accent" />
              <span>Илова кардани донишҷӯи нав</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-600 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                  <label>Телефон (+992...)</label>
                  <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="992000000000" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Парол</label>
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Ном (First Name)</label>
                  <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Исо" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Насаб (Last Name)</label>
                  <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Мусоев" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="iso@example.com" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Санаи таваллуд</label>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Суроға</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="кӯчаи Айнӣ..." className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Телефони Падар</label>
                  <input type="text" value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="992..." className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
              </div>

              <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                <label>Филиал</label>
                <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs">
                  <option value="">Интихоби филиал</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl font-bold text-xs">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 py-3 bg-accent text-white rounded-xl font-bold text-xs shadow-md glow-accent">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Student */}
      {editOpen && selectedStudent && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-250 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 animate-slide-up shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black flex items-center gap-2">
              <Edit className="w-5 h-5 text-accent" />
              <span>Таҳрири маълумоти донишҷӯ</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-600 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Телефон</label>
                  <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Ном (First Name)</label>
                  <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Насаб (Last Name)</label>
                  <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Санаи таваллуд</label>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Суроға</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Телефони Падар</label>
                  <input type="text" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Филиал</label>
                  <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs">
                    <option value="">Интихоби филиал</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs font-bold uppercase">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-accent focus:ring-accent" />
                <label htmlFor="isActive" className="cursor-pointer">Фаъол / Статуси аккаунт (Active)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl font-bold text-xs">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 py-3 bg-accent text-white rounded-xl font-bold text-xs shadow-md glow-accent">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
