import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Mail,
  Unlock,
  Lock,
  MapPin
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MENTOR' | 'TEACHER';
  isActive: boolean;
  branch?: Branch;
  branchId?: string;
  address?: string;
}

export const AdministrationPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MENTOR' | 'TEACHER'>('ADMIN');
  const [branchId, setBranchId] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users', {
        params: { search: search || undefined },
      });
      // Filter out students so we only show staff roles
      const staffList = res.data.filter((u: any) => u.role !== 'STUDENT');
      setStaff(staffList);
    } catch (err) {
      console.error(err);
      showToast('Error loading staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search]);

  useEffect(() => {
    fetchBranches();
  }, []);

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
        role,
        email: email || undefined,
        branchId: branchId || undefined,
        address: address || undefined,
        isActive: true,
      });

      setFormSuccess('Staff account successfully created');
      showToast('Staff account successfully created', 'success');
      setPhone('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setAddress('');
      setBranchId('');

      fetchStaff();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating staff account';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEditOpen = (member: Staff) => {
    setSelectedStaff(member);
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setPhone(member.phone);
    setEmail(member.email || '');
    setRole(member.role);
    setBranchId(member.branchId || '');
    setAddress(member.address || '');
    setIsActive(member.isActive);
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setFormError('');
    setFormSuccess('');

    try {
      await api.patch(`/api/users/${selectedStaff.id}`, {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        role,
        branchId: branchId || undefined,
        address: address || undefined,
        isActive,
      });

      setFormSuccess('Staff details updated');
      showToast('Staff details updated', 'success');
      fetchStaff();
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error updating account';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleToggleLock = async (member: Staff) => {
    const nextStatus = !member.isActive;
    const confirmMsg = nextStatus
      ? `Фаъол кардани аккаунти ${member.firstName} ${member.lastName}?`
      : `Қулф кардани аккаунти ${member.firstName} ${member.lastName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/api/users/${member.id}`, { isActive: nextStatus });
      showToast(nextStatus ? 'Account activated' : 'Account locked', 'success');
      fetchStaff();
    } catch (err: any) {
      showToast('Error modifying account status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this staff member?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      showToast('Staff member deleted', 'success');
      fetchStaff();
    } catch (err: any) {
      showToast('Error deleting staff member', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Маъмурият (Administration / Staff)</h2>
          <p className="text-sm text-gray-550 dark:text-gray-400">Идоракунии ҳайати кормандон ва ҳуқуқҳои дастрасӣ.</p>
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
            <span>Иловаи корманд</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-4 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Ҷустуҷӯи корманд аз рӯи ном, телефон..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
          />
        </div>
      </div>

      {/* Staff directory */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          {staff.map(member => {
            const roleColors =
              member.role === 'SUPER_ADMIN'
                ? 'bg-red-50 text-red-600 border border-red-200/50'
                : member.role === 'ADMIN'
                ? 'bg-blue-50 text-blue-600 border border-blue-200/50'
                : member.role === 'MANAGER'
                ? 'bg-purple-50 text-purple-600 border border-purple-200/50'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-200/50';

            return (
              <div key={member.id} className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[190px] card-hover hover:scale-[1.01] transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-850 flex items-center justify-center text-slate-500 font-extrabold text-sm border border-slate-200/30">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${roleColors}`}>
                        {member.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${member.isActive ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-red-50 text-red-650 border border-red-200/50'}`}>
                        {member.isActive ? 'Active' : 'Locked'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm mt-2.5 truncate">{member.firstName} {member.lastName}</h4>
                    <p className="text-[11px] text-gray-500 font-bold">{member.phone}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4 text-[11px] font-bold text-gray-500">
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-450" /><span>{member.email || 'Нишон дода нашудааст'}</span></div>
                  {member.branch && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-450" /><span>Филиал: {member.branch.name}</span></div>}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end border-t border-gray-150 dark:border-gray-800 pt-3 mt-4 gap-1.5">
                  <button
                    onClick={() => handleToggleLock(member)}
                    className={`p-1.5 rounded-lg border transition-colors ${member.isActive ? 'bg-yellow-50 text-yellow-600 border-yellow-250 hover:bg-yellow-100' : 'bg-green-50 text-green-600 border-green-250 hover:bg-green-100'}`}
                    title={member.isActive ? 'Lock Account' : 'Unlock Account'}
                  >
                    {member.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEditOpen(member)}
                    className="p-1.5 rounded-lg bg-gray-55 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 transition-colors"
                    title="Edit Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {currentUser?.role === 'SUPER_ADMIN' && member.id !== currentUser.id && (
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {staff.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 font-bold">
              <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <span>Ягон корманд ёфт нашуд.</span>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Staff */}
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
              <Shield className="w-5 h-5 text-accent animate-pulse-subtle" />
              <span>Иловаи корманди нав</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-605 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-605 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

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
                  <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jamshed" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Насаб (Last Name)</label>
                  <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Rahimov" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jamshed@omuz.tj" className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Суроға</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Somoni St 12..." className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Нақш (Role)</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs">
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="MENTOR">Teacher / Mentor</option>
                  </select>
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Филиал</label>
                  <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs">
                    <option value="">Интихоби филиал</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
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

      {/* Modal: Edit Staff */}
      {editOpen && selectedStaff && createPortal(
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
              <span>Таҳрири маълумоти корманд</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-655 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-655 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-550 uppercase">
                  <label>Телефон</label>
                  <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
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
                  <label>Суроға</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs" />
                </div>
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Филиал</label>
                  <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs">
                    <option value="">Интихоби филиал</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-bold text-gray-555 uppercase">
                  <label>Нақш (Role)</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs">
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="MENTOR">Teacher / Mentor</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs font-bold uppercase">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-accent focus:ring-accent" />
                <label htmlFor="isActive" className="cursor-pointer">Активӣ / Корманди фаъол (Active)</label>
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
