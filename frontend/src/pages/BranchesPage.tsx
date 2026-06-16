import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

export const BranchesPage: React.FC = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSuccess('');
    setError('');

    try {
      await api.post('/api/branches', { name });
      setSuccess(t('common.success'));
      setName('');
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    setSuccess('');
    setError('');

    try {
      await api.delete(`/api/branches/${id}`);
      setSuccess(t('common.success'));
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          <span>Branch Management</span>
        </h2>

        {success && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleCreate} className="flex gap-4 mb-8">
          <input
            type="text"
            required
            placeholder="Branch name (e.g. Khujand)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center gap-2 text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* List of branches */}
        {loading && branches.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-150 dark:divide-gray-800">
            {branches.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold">{b.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {branches.length === 0 && (
              <p className="text-center text-gray-500 py-6 text-sm">Branch list is empty</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


