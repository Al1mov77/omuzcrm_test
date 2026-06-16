import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import {
  Gift,
  Coins,
  Search,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  X,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';

interface RewardItem {
  id: string;
  title: string;
  imageUrl?: string;
  coinCost: number;
  isAvailable: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export const RewardsPage: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [shopItems, setShopItems] = useState<RewardItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // States
  const [showInTjs, setShowInTjs] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  
  // Create Item Form State
  const [title, setTitle] = useState('');
  const [coinCost, setCoinCost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Edit Item Form State
  const [editingItemId, setEditingItemId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCoinCost, setEditCoinCost] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState(true);

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // TJS Conversion factor: 1 Coin = 1.5 TJS
  const CONVERSION_RATE = 1.5;

  const formatPrice = (coins: number) => {
    if (showInTjs) {
      return `${(coins * CONVERSION_RATE).toFixed(1)} TJS`;
    }
    return `${coins} ${t('Rewards.currencyCoins') || 'coins'}`;
  };

  const fetchShop = async () => {
    try {
      const res = await api.get('/api/rewards/shop');
      setShopItems(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/rewards/transactions', {
        params: {
          search: search || undefined,
        },
      });
      setTransactions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [search]);

  const handleRedeem = async (itemId: string) => {
    if (user?.role !== 'STUDENT') return;
    try {
      const res = await api.post(`/api/rewards/shop/${itemId}/redeem`);
      showToast(`Successfully redeemed for: ${res.data.itemRedeemed}!`, 'success');
      
      // Update local wallet and logs
      refetchUser();
      fetchShop();
      fetchTransactions();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error redeeming item';
      showToast(msg, 'error');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/api/rewards/items', {
        title,
        coinCost: parseInt(coinCost, 10),
        imageUrl: imageUrl || undefined,
        isAvailable,
      });

      setFormSuccess(t('common.success'));
      showToast('Item successfully added', 'success');
      setTitle('');
      setCoinCost('');
      setImageUrl('');
      setIsAvailable(true);
      fetchShop();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.patch(`/api/rewards/items/${editingItemId}`, {
        title: editTitle,
        coinCost: parseInt(editCoinCost, 10),
        imageUrl: editImageUrl || undefined,
        isAvailable: editIsAvailable,
      });

      setFormSuccess(t('common.success'));
      showToast('Item successfully updated', 'success');
      fetchShop();
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item from the shop?')) return;
    try {
      await api.delete(`/api/rewards/items/${id}`);
      fetchShop();
      showToast('Item deleted', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error while deleting', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Wallet Balance Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-550 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden animate-slide-up">
        {/* Decorative blur elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl translate-x-1/4 -translate-y-1/4"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Coins className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-amber-100">{t('rewards.wallet')}</h3>
            <span className="text-4xl font-black block mt-1">
              {user ? formatPrice(user.coins) : '0'}
            </span>
          </div>
        </div>

        {/* Currency Switcher Toggle */}
        <div className="flex items-center gap-3 relative z-10 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/10">
          <span className="text-sm font-bold">{t('rewards.showInTjs')}</span>
          <button
            onClick={() => setShowInTjs(!showInTjs)}
            className="text-white focus:outline-none transition-colors"
          >
            {showInTjs ? (
              <ToggleRight className="w-9 h-9 text-yellow-350" />
            ) : (
              <ToggleLeft className="w-9 h-9 text-amber-200" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: Shop layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent" />
              <span>{t('rewards.shop')}</span>
            </h3>

            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => {
                  setFormError('');
                  setFormSuccess('');
                  setCreateOpen(true);
                }}
                className="px-4 py-2 bg-accent hover:bg-opacity-95 text-white font-bold rounded-xl shadow-md glow-accent flex items-center gap-1.5 text-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('Rewards.addBtn') || 'Add Reward'}</span>
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {shopItems.map(item => {
              const hasEnoughCoins = user && user.coins >= item.coinCost;
              const isStudent = user?.role === 'STUDENT';
              
              let statusText = t('rewards.redeem');
              let statusColor = 'bg-accent hover:bg-opacity-90 text-white shadow-md glow-accent';
              let isDisabled = false;

              if (!item.isAvailable) {
                statusText = t('rewards.unavailable');
                statusColor = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200/20';
                isDisabled = true;
              } else if (isStudent && !hasEnoughCoins) {
                statusText = t('rewards.insufficient');
                statusColor = 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200/20';
                isDisabled = true;
              } else if (!isStudent) {
                statusText = 'Only for students';
                statusColor = 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200/20';
                isDisabled = true;
              }

              return (
                <div key={item.id} className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between min-h-[260px]">
                  
                  {/* Photo or placeholder */}
                  <div className="relative h-32 bg-gray-55 dark:bg-gray-850 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-800">
                    {item.imageUrl ? (
                      <img
                        src={`http://localhost:3000${item.imageUrl}`}
                        alt={item.title}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Fallback placeholder on error
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <Gift className="w-10 h-10 text-gray-300 absolute" />
                  </div>

                  {/* Title & Cost info */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm">{item.title}</h4>
                    <span className="text-xs font-black text-amber-500 block">
                      {formatPrice(item.coinCost)}
                    </span>
                  </div>

                  {/* Button Actions */}
                  <div className="space-y-2 pt-2 border-t border-gray-150 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      disabled={isDisabled}
                      onClick={() => handleRedeem(item.id)}
                      className={`w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl transition-all ${statusColor}`}
                    >
                      {statusText}
                    </button>

                    {/* Admin modifiers */}
                    {user?.role === 'SUPER_ADMIN' && (
                      <div className="flex gap-1 justify-end w-full sm:w-auto">
                        <button
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditTitle(item.title);
                            setEditCoinCost(String(item.coinCost));
                            setEditImageUrl(item.imageUrl || '');
                            setEditIsAvailable(item.isAvailable);
                            setFormError('');
                            setFormSuccess('');
                            setEditOpen(true);
                          }}
                          className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-gray-550"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Ledger Transactions & Stub Coupon */}
        <div className="space-y-8">
          {/* Coupon discount widget stub */}
          <div className="bg-gradient-to-tr from-accent/20 to-purple-650/10 border border-accent/25 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-accent">
              <Tag className="w-5 h-5 text-accent animate-pulse-subtle" />
              <span>{t('rewards.discount')}</span>
            </h3>
            <div className="py-6 text-center border-2 border-dashed border-accent/20 rounded-2xl bg-light-card/40 dark:bg-dark-card/10">
              <span className="font-extrabold text-sm tracking-wider uppercase text-accent/80 block animate-pulse">
                {t('rewards.comingSoon')}
              </span>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
                Promo codes & discounts system
              </p>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors">
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-accent" />
                <span>{t('rewards.transactions')}</span>
              </h3>

              {/* Simple transaction filters */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('rewards.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
                />
              </div>

              {/* Transactions Ledger list */}
              {loading && transactions.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-105 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[300px]">
                  {transactions.map(t => {
                    const isCredit = t.amount > 0;
                    return (
                      <div key={t.id} className="p-3 border border-gray-150 dark:border-gray-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold leading-normal">{t.reason}</p>
                          <span className="text-[10px] text-gray-400 font-medium block">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`font-black text-sm flex-shrink-0 flex items-center gap-0.5 ${
                          isCredit ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {isCredit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isCredit ? '+' : ''}{formatPrice(t.amount)}</span>
                        </span>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <p className="text-center text-gray-500 py-6 text-sm">{t('Rewards.noTransactionHistory') || 'No transaction history'}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Shop Item */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent animate-pulse-subtle" />
              <span>{t('Rewards.newReward') || 'Add item to shop'}</span>
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-4">
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

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('Rewards.rewardName') || 'Reward Name'}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Omuz Brand Hoodie"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Cost */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('Rewards.costInCoins') || 'Cost in Coins'}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={coinCost}
                  onChange={e => setCoinCost(e.target.value)}
                  placeholder="100"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('Rewards.uploadImage') || 'Item Image URL'}</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="/rewards/hoodie.png"
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Is Available Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-150 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-500 uppercase">{t('Rewards.Available') || 'In Stock'}</span>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className="text-accent focus:outline-none"
                >
                  {isAvailable ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                </button>
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

      {/* Modal: Edit Shop Item */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6 animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 text-accent" />
              <span>{t('Rewards.editBtn') || 'Edit Item'}</span>
            </h3>

            <form onSubmit={handleEditItem} className="space-y-4">
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

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-550 uppercase">{t('Rewards.rewardName') || 'Reward Name'}</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Cost */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-555 uppercase">{t('Rewards.costInCoins') || 'Cost in Coins'}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editCoinCost}
                  onChange={e => setEditCoinCost(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-555 uppercase">{t('Rewards.uploadImage') || 'Item Image URL'}</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={e => setEditImageUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {/* Is Available Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-150 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-555 uppercase">{t('Rewards.Available') || 'In Stock'}</span>
                <button
                  type="button"
                  onClick={() => setEditIsAvailable(!editIsAvailable)}
                  className="text-accent focus:outline-none"
                >
                  {editIsAvailable ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                </button>
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


