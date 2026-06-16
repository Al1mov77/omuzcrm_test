import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Gift,
  Award,
  MapPin,
  User as UserIcon,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'MENTOR' | 'SUPER_ADMIN';
  avatarUrl?: string;
  coins: number;
  language: 'TJ' | 'RU' | 'EN';
  birthDate?: string;
  address?: string;
  parentPhone?: string;
  branch?: Branch;
}

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Modals/Drawers
  const [createOpen, setCreateOpen] = useState(false);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Create Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'MENTOR' | 'SUPER_ADMIN'>('STUDENT');
  const [branchId, setBranchId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [language, setLanguage] = useState<'TJ' | 'RU' | 'EN'>('RU');

  // Give Coins Form State
  const [coinsAmount, setCoinsAmount] = useState('');
  const [coinsReason, setCoinsReason] = useState('');

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users', {
        params: {
          role: roleFilter || undefined,
          branchId: branchFilter || undefined,
          search: search || undefined,
        },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
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
    fetchUsers();
  }, [search, roleFilter, branchFilter]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
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
        branchId: branchId || undefined,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
        address: address || undefined,
        parentPhone: parentPhone || undefined,
        language,
      });

      setFormSuccess(t('common.success'));
      showToast('User successfully created', 'success');
      // Reset form
      setPhone('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setBranchId('');
      setBirthDate('');
      setAddress('');
      setParentPhone('');
      
      fetchUsers();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
      showToast('User deleted', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error deleting user', 'error');
    }
  };

  const handleMakeMentor = async (id: string) => {
    if (!window.confirm('Are you sure you want to make this user a mentor?')) return;
    try {
      await api.patch(`/api/users/${id}`, { role: 'MENTOR' });
      fetchUsers();
      showToast('User assigned as mentor', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error changing role', 'error');
    }
  };

  const handleGiveCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError('');
    setFormSuccess('');

    try {
      await api.post(`/api/users/${selectedStudent.id}/coins`, {
        amount: parseInt(coinsAmount, 10),
        reason: coinsReason,
      });

      setFormSuccess(t('common.success'));
      showToast('Coins successfully credited', 'success');
      setCoinsAmount('');
      setCoinsReason('');
      fetchUsers();
      setTimeout(() => setCoinsOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title + Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage student, mentor, and administrator accounts.</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setCreateOpen(true);
          }}
          className="px-5 py-3 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Create User</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl p-4 transition-colors">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, surname, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold appearance-none"
          >
            <option value="">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="MENTOR">Mentors</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>
        </div>

        {/* Branch Filter */}
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold appearance-none"
          >
            <option value="">All branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {users.map(u => {
            const roleColors = u.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50' : u.role === 'MENTOR' ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50' : 'bg-green-50 text-green-650 dark:bg-green-950/20 dark:text-green-400 border border-green-200/50';
            return (
              <div key={u.id} className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                {/* User card header */}
                <div className="flex items-start gap-4">
                  <img
                    src={u.avatarUrl ? `http://localhost:3000${u.avatarUrl}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover border border-gray-150"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase ${roleColors}`}>
                        {u.role}
                      </span>
                      {u.branch && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200/20">
                          {u.branch.name}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-base truncate mt-1.5">{u.firstName} {u.lastName}</h4>
                    <p className="text-xs text-gray-500 font-semibold">{u.phone}</p>
                  </div>
                </div>

                {/* Bottom stats/tools */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-150 dark:border-gray-800 mt-auto">
                  {u.role === 'STUDENT' ? (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold text-xs">
                      <Gift className="w-3.5 h-3.5 text-yellow-500" />
                      <span>{u.coins} coins</span>
                    </div>
                  ) : (
                    <div></div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    {u.role === 'STUDENT' && (
                      <>
                        <button
                          onClick={() => handleMakeMentor(u.id)}
                          title="Make Mentor"
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-650 rounded-xl transition-all"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(u);
                            setFormError('');
                            setFormSuccess('');
                            setCoinsOpen(true);
                          }}
                          title="Credit Coins"
                          className="p-2 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 text-yellow-600 rounded-xl transition-all"
                        >
                          <Gift className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      title="Delete User"
                      className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm">Users not found</p>
            </div>
          )}
        </div>
      )}

      {/* Create User Drawer/Modal */}
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
              <UserIcon className="w-5 h-5 text-accent" />
              <span>Register New User</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-5">
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
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone (+992...)</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="992000000000"
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="John"
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {/* Branch */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Branch</label>
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="">Select branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Birth Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Birthdate</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Parent's Phone (for students)</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="+992..."
                    className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ayni street, Dushanbe..."
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as any)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                  <option value="TJ">Tajik</option>
                  <option value="RU">Russian</option>
                  <option value="EN">English</option>
                </select>
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
      )}

      {/* Give Coins Modal */}
      {coinsOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setCoinsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500 animate-bounce" />
              <span>Credit Coins</span>
            </h3>
            <p className="text-xs text-gray-500">Crediting to student's balance: <strong className="text-gray-800 dark:text-white">{selectedStudent.firstName} {selectedStudent.lastName}</strong></p>

            <form onSubmit={handleGiveCoinsSubmit} className="space-y-4">
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

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Amount of Coins</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={coinsAmount}
                  onChange={e => setCoinsAmount(e.target.value)}
                  placeholder="50"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Reason for Crediting</label>
                <input
                  type="text"
                  required
                  value={coinsReason}
                  onChange={e => setCoinsReason(e.target.value)}
                  placeholder="Hackathon win / activity"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCoinsOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/25 dark:hover:text-indigo-400 text-gray-700 rounded-xl font-bold transition-all text-sm dark:bg-gray-850 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold shadow-md glow-accent flex items-center justify-center transition-all text-sm"
                >
                  Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


