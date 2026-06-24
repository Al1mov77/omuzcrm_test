import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit,
  DollarSign,
  Clock,
  X,
  FileText,
  Users
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  _count?: {
    groups: number;
  };
  groups?: any[];
}

export const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/courses', {
        params: { search: search || undefined },
      });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      showToast('Error loading courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search]);

  const handleOpenDetail = async (courseId: string) => {
    try {
      const res = await api.get(`/api/courses/${courseId}`);
      setSelectedCourse(res.data);
      setDetailOpen(true);
    } catch (e) {
      showToast('Failed to load course details', 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/api/courses', {
        name,
        description: description || undefined,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        isActive,
      });

      setFormSuccess('Course successfully created');
      showToast('Course successfully created', 'success');
      setName('');
      setDescription('');
      setPrice('');
      setDuration('');
      fetchCourses();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating course';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEditOpen = (course: Course) => {
    setSelectedCourse(course);
    setName(course.name);
    setDescription(course.description || '');
    setPrice(course.price.toString());
    setDuration(course.duration.toString());
    setIsActive(course.isActive);
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setFormError('');
    setFormSuccess('');

    try {
      await api.patch(`/api/courses/${selectedCourse.id}`, {
        name,
        description: description || undefined,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        isActive,
      });

      setFormSuccess('Course details updated');
      showToast('Course details updated', 'success');
      fetchCourses();
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error updating course';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course? All group associations will be cleared.')) return;
    try {
      await api.delete(`/api/courses/${id}`);
      showToast('Course deleted successfully', 'success');
      fetchCourses();
    } catch (err: any) {
      showToast('Error deleting course', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Курсҳо (Courses)</h2>
          <p className="text-sm text-gray-550 dark:text-gray-400">Рӯйхати курсҳои таълимии CRM.</p>
        </div>
        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
          <button
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setCreateOpen(true);
            }}
            className="px-5 py-3 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center justify-center gap-2 text-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Илова кардани курс</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-4 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Ҷустуҷӯи курс аз рӯи ном..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
          />
        </div>
      </div>

      {/* Courses Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          {courses.map(course => (
            <div key={course.id} className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between card-hover hover:scale-[1.01] transition-all">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 onClick={() => handleOpenDetail(course.id)} className="font-extrabold text-sm hover:text-accent hover:underline cursor-pointer transition-colors truncate">
                    {course.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${course.isActive ? 'bg-green-50 text-green-600 border border-green-200/30' : 'bg-gray-150 text-gray-500 border border-gray-200/30'}`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{course.description || 'Тавсифи курс мавҷуд нест.'}</p>

                <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] font-extrabold">
                  <div className="flex items-center gap-1.5 text-green-650 dark:text-green-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{course.price} TJS</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{course.duration} ҳафта (weeks)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-150 dark:border-gray-800 pt-3 mt-5">
                <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Гурӯҳҳо: {course._count?.groups || 0}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenDetail(course.id)}
                    className="p-1.5 rounded-lg bg-gray-55 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-accent transition-colors"
                    title="Details"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                    <>
                      <button
                        onClick={() => handleEditOpen(course)}
                        className="p-1.5 rounded-lg bg-gray-55 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 transition-colors"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 font-bold">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <span>Ягон курс ёфт нашуд.</span>
            </div>
          )}
        </div>
      )}

      {/* Modal: Course Details */}
      {detailOpen && selectedCourse && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-250 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black">{selectedCourse.name}</h3>
                <span className="text-xs text-gray-400 font-bold">ID: {selectedCourse.id}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold leading-relaxed">
              <div>
                <span className="text-gray-450 uppercase block mb-1">Тавсиф (Description)</span>
                <p className="bg-gray-55 dark:bg-gray-850 p-3 rounded-xl font-medium text-slate-700 dark:text-slate-350">{selectedCourse.description || 'Тавсиф мавҷуд нест.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-55 dark:bg-gray-850 p-3 rounded-xl">
                  <span className="text-gray-450 uppercase block mb-1">Нарх (Price)</span>
                  <p className="text-sm font-black text-green-650 dark:text-green-400">{selectedCourse.price} сомонӣ (TJS)</p>
                </div>
                <div className="bg-gray-55 dark:bg-gray-850 p-3 rounded-xl">
                  <span className="text-gray-450 uppercase block mb-1">Давомнокӣ (Duration)</span>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{selectedCourse.duration} ҳафта (weeks)</p>
                </div>
              </div>

              <div>
                <span className="text-gray-450 uppercase block mb-2">Гурӯҳҳои пайвастшуда ({selectedCourse.groups?.length || 0})</span>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {selectedCourse.groups?.map((g: any) => (
                    <div key={g.id} className="flex justify-between items-center p-2.5 bg-gray-55 dark:bg-gray-850 border border-gray-150/40 rounded-xl">
                      <span className="text-slate-800 dark:text-white font-extrabold">{g.name}</span>
                      <span className="text-[10px] text-gray-450">Филиал: {g.branch?.name}</span>
                    </div>
                  ))}
                  {selectedCourse.groups?.length === 0 && (
                    <p className="text-gray-400 font-semibold italic">Ягон гурӯҳ ба ин курс пайваст нашудааст.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Course */}
      {createOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-250 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent animate-pulse-subtle" />
              <span>Илова кардани курси нав</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-605 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-605 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Номи курс</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Next.js Development" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
              </div>

              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Тавсиф</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Тавсифи курс..." className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                  <label>Нархи курс (TJS)</label>
                  <input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="800" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                  <label>Давомнокӣ (ҳафта)</label>
                  <input required type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="5" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
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

      {/* Modal: Edit Course */}
      {editOpen && selectedCourse && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-250 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black flex items-center gap-2">
              <Edit className="w-5 h-5 text-accent" />
              <span>Таҳрири курс</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-605 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-605 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Номи курс</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
              </div>

              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Тавсиф</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                  <label>Нархи курс (TJS)</label>
                  <input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                  <label>Давомнокӣ (ҳафта)</label>
                  <input required type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs font-bold uppercase">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-accent focus:ring-accent" />
                <label htmlFor="isActive" className="cursor-pointer">Фаъол (Active)</label>
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
