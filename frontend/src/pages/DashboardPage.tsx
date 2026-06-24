import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Users,
  LayoutGrid,
  BookOpen,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard');
      setStats(res.data);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-32 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl"></div>
        ))}
      </div>
    );
  }

  // Chart data using actual revenue + mock previous months
  const chartData = [
    { name: 'Feb', revenue: 2400 },
    { name: 'Mar', revenue: 1398 },
    { name: 'Apr', revenue: 9800 },
    { name: 'May', revenue: 3908 },
    { name: 'Jun', revenue: stats.monthRevenue || 0 },
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 animate-slide-up">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm transition-all hover:translate-y-[-2px] flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Шумораи донишҷӯён</p>
            <h3 className="text-3xl font-black">{stats.totalStudents}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-[#4A3AFF] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm transition-all hover:translate-y-[-2px] flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Гурӯҳҳо</p>
            <h3 className="text-3xl font-black">{stats.totalGroups}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <LayoutGrid className="w-6 h-6" />
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm transition-all hover:translate-y-[-2px] flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Курсҳо</p>
            <h3 className="text-3xl font-black">{stats.totalCourses}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm transition-all hover:translate-y-[-2px] flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Омӯзгорон</p>
            <h3 className="text-3xl font-black">{stats.totalTeachers}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Today's Revenue */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl shadow-sm">
            TJS
          </div>
          <div>
            <p className="text-xs text-gray-500 font-extrabold uppercase">Даромади имрӯз</p>
            <h4 className="text-2xl font-black text-blue-650 dark:text-blue-400 mt-1">{stats.todayRevenue} <span className="text-sm font-semibold">сомонӣ</span></h4>
          </div>
        </div>

        {/* Month's Revenue */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-500 to-emerald-300 text-emerald-950 flex items-center justify-center font-black text-xl shadow-sm">
            TJS
          </div>
          <div>
            <p className="text-xs text-gray-500 font-extrabold uppercase">Даромади моҳ</p>
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-450 mt-1">{stats.monthRevenue} <span className="text-sm font-semibold">сомонӣ</span></h4>
          </div>
        </div>

        {/* Debtors count widget */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 flex items-center justify-center font-black text-xl shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-extrabold uppercase">Донишҷӯёни қарздор</p>
            <h4 className="text-2xl font-black text-red-650 dark:text-red-400 mt-1">{stats.debtorsCount} <span className="text-sm font-semibold">нафар</span></h4>
          </div>
        </div>
      </div>

      {/* Chart and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Revenue Bar */}
        <div className="lg:col-span-2 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#4A3AFF]" />
              <span>Таҳлили даромадҳо</span>
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                <Bar dataKey="revenue" radius={[10, 10, 0, 0]} maxBarSize={45}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4A3AFF' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notifications feed */}
        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <h4 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-yellow-500" />
            <span>Огоҳиномаҳо</span>
          </h4>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-64">
            {stats.notifications?.map((n: any) => (
              <div key={n.id} className="flex gap-3 p-3 bg-gray-55 dark:bg-gray-800/40 border border-gray-150/40 dark:border-gray-800 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 animate-ping"></div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold leading-relaxed">{n.text}</p>
                  <span className="text-[10px] text-gray-400 font-bold block">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debtor students details */}
      <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <h4 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-1.5">
          <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
          <span>Донишҷӯёни қарздор (Рӯйхат)</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-bold">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-400 uppercase tracking-wider font-black">
                <th className="pb-3 pr-4">Ф.И.О</th>
                <th className="pb-3 pr-4">ТЕЛЕФОН</th>
                <th className="pb-3 pr-4">ГУРӮҲ</th>
                <th className="pb-3 pr-4">Нархи курс</th>
                <th className="pb-3 pr-4">Пардохтшуда</th>
                <th className="pb-3 text-red-500 text-right">МАБЛАҒИ ҚАРЗ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-850">
              {stats.debtorsList?.map((d: any) => (
                <tr key={d.id} className="hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-colors">
                  <td className="py-3.5 pr-4 text-slate-800 dark:text-white font-extrabold">{d.firstName} {d.lastName}</td>
                  <td className="py-3.5 pr-4 text-gray-500 font-bold">{d.phone}</td>
                  <td className="py-3.5 pr-4 text-gray-700 dark:text-gray-300 font-semibold">{d.groupName}</td>
                  <td className="py-3.5 pr-4 text-gray-600 dark:text-gray-450">{d.totalPrice} сомонӣ</td>
                  <td className="py-3.5 pr-4 text-green-600 dark:text-green-450">{d.totalPaid} сомонӣ</td>
                  <td className="py-3.5 text-right text-red-650 dark:text-red-400 font-black">{d.debt} сомонӣ</td>
                </tr>
              ))}
              {stats.debtorsList?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400 font-semibold">
                    Ягон донишҷӯи қарздор ёфт нашуд.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
