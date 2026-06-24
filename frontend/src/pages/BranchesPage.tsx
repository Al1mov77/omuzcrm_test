import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Plus,
  Trash2,
  Edit,
  Check,
  AlertCircle,
  Users,
  Layers,
  Phone,
  Mail,
  UserCheck,
  X,
  Globe
} from 'lucide-react';

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Group {
  id: string;
  name: string;
  classroom?: string;
  startDate: string;
  endDate: string;
  mentor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  course?: {
    name: string;
    price: number;
  };
  _count?: {
    students: number;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  parentPhone?: string;
  coins: number;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: Manager;
  isActive: boolean;
  _count?: {
    users: number;
    groups: number;
  };
  users?: Student[];
  groups?: Group[];
}

export const BranchesPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'students'>('groups');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  // Form input states
  const [bName, setBName] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bManagerId, setBManagerId] = useState('');
  const [bIsActive, setBIsActive] = useState(true);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/api/users');
      // Filter out student roles to populate managers list
      const staff = res.data.filter((u: any) => u.role !== 'STUDENT');
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to load staff list', err);
    }
  };

  const fetchBranchDetails = async (id: string) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/api/branches/${id}`);
      setSelectedBranch(res.data);
    } catch (err) {
      console.error('Failed to load branch details', err);
      showToast('Failed to load branch details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStaffList();
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingBranchId(null);
    setBName('');
    setBAddress('');
    setBPhone('');
    setBEmail('');
    setBManagerId('');
    setBIsActive(true);
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setIsEditMode(true);
    setEditingBranchId(branch.id);
    setBName(branch.name);
    setBAddress(branch.address || '');
    setBPhone(branch.phone || '');
    setBEmail(branch.email || '');
    setBManagerId(branch.manager?.id || '');
    setBIsActive(branch.isActive);
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!bName.trim()) {
      setFormError('Branch name is required');
      return;
    }

    const payload = {
      name: bName,
      address: bAddress || undefined,
      phone: bPhone || undefined,
      email: bEmail || undefined,
      managerId: bManagerId || undefined,
      isActive: bIsActive
    };

    try {
      if (isEditMode && editingBranchId) {
        await api.patch(`/api/branches/${editingBranchId}`, payload);
        showToast('Branch successfully updated', 'success');
        if (selectedBranch && selectedBranch.id === editingBranchId) {
          fetchBranchDetails(editingBranchId);
        }
      } else {
        await api.post('/api/branches', payload);
        showToast('Branch successfully created', 'success');
      }
      setFormSuccess(t('common.success'));
      fetchBranches();
      setTimeout(() => setModalOpen(false), 1000);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"? All branch associations will be affected.`)) return;

    try {
      await api.delete(`/api/branches/${id}`);
      showToast('Branch successfully deleted', 'success');
      if (selectedBranch?.id === id) {
        setSelectedBranch(null);
      }
      fetchBranches();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error deleting branch';
      showToast(msg, 'error');
    }
  };

  const selectBranch = (branch: Branch) => {
    fetchBranchDetails(branch.id);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 animate-slide-up">
      {/* Top Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Филиалҳо (Branches)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Идоракунии филиалҳо, таъин кардани роҳбарон ва дидани рӯйхати донишҷӯёну гурӯҳҳо.</p>
        </div>

        {['SUPER_ADMIN'].includes(currentUser?.role || '') && (
          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Илова кардани филиал</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left Side Branch List, Right Side Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Branch cards list */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">Рӯйхати филиалҳо</h3>
          {loading && branches.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              {branches.map((b) => {
                const isSelected = selectedBranch?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => selectBranch(b)}
                    className={`bg-light-card dark:bg-dark-card border rounded-3xl p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:translate-y-[-2px] flex flex-col justify-between ${
                      isSelected
                        ? 'border-accent dark:border-accent ring-2 ring-accent/20'
                        : 'border-gray-200 dark:border-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          b.isActive 
                            ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' 
                            : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                        }`}>
                          {b.isActive ? 'Фаъол' : 'Ғайрифаъол'}
                        </span>
                        {['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '') && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openEditModal(b)}
                              className="p-1 rounded-lg text-accent hover:bg-accent/10 transition-colors"
                              title="Таҳрир"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {['SUPER_ADMIN'].includes(currentUser?.role || '') && (
                              <button
                                onClick={() => handleDelete(b.id, b.name)}
                                className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Нест кардан"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <h4 className="font-extrabold text-lg text-slate-800 dark:text-white leading-tight flex items-center gap-1.5">
                        <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
                        <span>{b.name}</span>
                      </h4>
                      {b.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{b.address}</span>
                        </p>
                      )}
                      {b.phone && (
                        <p className="text-xs text-gray-550 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{b.phone}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        Роҳбар: <span className="font-extrabold text-accent">{b.manager ? `${b.manager.firstName} ${b.manager.lastName}` : 'Муайян нашудааст'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-gray-150 dark:border-gray-800/60 text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4 text-accent" />
                        <span>{b._count?.groups || 0} гурӯҳ</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-[#4A3AFF]" />
                        <span>{b._count?.users || 0} донишҷӯ</span>
                      </span>
                    </div>
                  </div>
                );
              })}
              {branches.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-305" />
                  <p className="text-xs">Ягон филиал ёфт нашуд.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: selected branch details viewer */}
        <div className="lg:col-span-2">
          {detailsLoading ? (
            <div className="h-96 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-8 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedBranch ? (
            <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              
              {/* Branch Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-150 dark:border-gray-800/60 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{selectedBranch.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedBranch.isActive 
                        ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                    }`}>
                      {selectedBranch.isActive ? 'Фаъол' : 'Ғайрифаъол'}
                    </span>
                  </div>
                  {selectedBranch.address && <p className="text-xs text-gray-500 font-semibold">{selectedBranch.address}</p>}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400 font-bold">
                    {selectedBranch.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedBranch.phone}</span>}
                    {selectedBranch.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedBranch.email}</span>}
                  </div>
                </div>

                <div className="bg-gray-55 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Роҳбари филиал</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                      {selectedBranch.manager ? `${selectedBranch.manager.firstName} ${selectedBranch.manager.lastName}` : 'Муайян нашудааст'}
                    </span>
                    {selectedBranch.manager?.phone && <span className="text-xs text-gray-500 block font-semibold">{selectedBranch.manager.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="space-y-4">
                <div className="flex border-b border-gray-150 dark:border-gray-850">
                  <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-3 text-sm font-extrabold px-4 border-b-2 transition-all relative ${
                      activeTab === 'groups'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-gray-450 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Гурӯҳҳо ({selectedBranch.groups?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-3 text-sm font-extrabold px-4 border-b-2 transition-all relative ${
                      activeTab === 'students'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-gray-450 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Донишҷӯён ({selectedBranch.users?.length || 0})
                  </button>
                </div>

                {/* Tab content */}
                <div>
                  {activeTab === 'groups' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-bold">
                        <thead>
                          <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-400 uppercase font-black">
                            <th className="pb-3 pr-4">Номи гурӯҳ</th>
                            <th className="pb-3 pr-4">Курс</th>
                            <th className="pb-3 pr-4">Омӯзгор</th>
                            <th className="pb-3 pr-4 text-center">Шумораи донишҷӯён</th>
                            <th className="pb-3 text-right">Сана</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-gray-850">
                          {selectedBranch.groups?.map((g) => (
                            <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                              <td className="py-3 pr-4 font-extrabold text-slate-800 dark:text-white">{g.name}</td>
                              <td className="py-3 pr-4 text-gray-550">{g.course?.name || 'TBD'}</td>
                              <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{g.mentor ? `${g.mentor.firstName} ${g.mentor.lastName}` : 'Муайян нашудааст'}</td>
                              <td className="py-3 pr-4 text-center font-extrabold">{g._count?.students || 0} нафар</td>
                              <td className="py-3 text-right text-[10px] text-gray-400 font-bold">
                                {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                          {(!selectedBranch.groups || selectedBranch.groups.length === 0) && (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-gray-400">
                                Дар ин филиал ягон гурӯҳ сохта нашудааст.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-bold">
                        <thead>
                          <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-400 uppercase font-black">
                            <th className="pb-3 pr-4">Донишҷӯ</th>
                            <th className="pb-3 pr-4">Телефон</th>
                            <th className="pb-3 pr-4">Телефони падару модар</th>
                            <th className="pb-3 text-right">Тангаҳо (Coins)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-gray-850">
                          {selectedBranch.users?.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                              <td className="py-3 pr-4 font-extrabold text-slate-800 dark:text-white">{s.firstName} {s.lastName}</td>
                              <td className="py-3 pr-4 text-gray-550">{s.phone}</td>
                              <td className="py-3 pr-4 text-gray-500 font-semibold">{s.parentPhone || 'ТВD'}</td>
                              <td className="py-3 text-right text-amber-600 font-black flex items-center justify-end gap-1.5 mt-0.5">
                                <span>{s.coins}</span>
                                <span>🪙</span>
                              </td>
                            </tr>
                          ))}
                          {(!selectedBranch.users || selectedBranch.users.length === 0) && (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-gray-400">
                                Дар ин филиал ягон донишҷӯ ба қайд гирифта нашудааст.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-light-card dark:bg-dark-card border border-gray-200/80 dark:border-gray-800/60 rounded-3xl flex flex-col items-center justify-center text-center p-8 shadow-sm">
              <MapPin className="w-12 h-12 text-accent/30 mb-3" />
              <h4 className="font-extrabold text-slate-800 dark:text-white">Ягон филиал интихоб нашудааст</h4>
              <p className="text-xs text-gray-500 mt-1.5 max-w-sm">Барои дидани донишҷӯён, гурӯҳҳо ва маълумотҳои роҳбари филиал, аз рӯйхати чап яке аз онҳоро интихоб кунед.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create or Edit Branch */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <span>{isEditMode ? 'Таҳрири филиал' : 'Илова кардани филиали нав'}</span>
            </h3>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
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

              {/* Branch Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Номи филиал *</label>
                <input
                  type="text"
                  required
                  placeholder="Масалан: Душанбе, Хуҷанд"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Суроға (Address)</label>
                <input
                  type="text"
                  placeholder="Кӯчаи Рӯдакӣ 45, ошёнаи 3"
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Телефон</label>
                  <input
                    type="text"
                    placeholder="+992900111222"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <input
                    type="email"
                    placeholder="dushanbe@omuz.tj"
                    value={bEmail}
                    onChange={(e) => setBEmail(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Manager selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Роҳбари филиал (Leader/Manager)</label>
                <select
                  value={bManagerId}
                  onChange={(e) => setBManagerId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                  <option value="">-- Интихоб кунед --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* IsActive Status selector */}
              {isEditMode && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-150 dark:border-gray-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Статуси фаъолият</span>
                    <span className="text-[10px] text-gray-400 font-semibold">Филиалро кушоед ё муваққатан қулф кунед</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBIsActive(!bIsActive)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      bIsActive ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        bIsActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-750 text-gray-500 dark:text-gray-400 font-bold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Инкор кардан
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl text-sm transition-all"
                >
                  {isEditMode ? 'Захира кардан' : 'Илова кардан'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
