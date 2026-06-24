import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  X,
  Printer,
  TrendingUp,
  User,
  CreditCard
} from 'lucide-react';

interface Payment {
  id: string;
  studentId: string;
  student: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  amount: number;
  paymentType: string;
  date: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
  comment?: string;
}

export const AccountingPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [report, setReport] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [studentFilter, setStudentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/payments', {
        params: {
          studentId: studentFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      showToast('Error loading payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await api.get('/api/payments/report');
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/users', { params: { role: 'STUDENT' } });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [studentFilter, startDate, endDate]);

  useEffect(() => {
    fetchReport();
    fetchStudents();
  }, []);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/api/payments', {
        studentId,
        amount: parseFloat(amount),
        paymentType,
        date: date ? new Date(date).toISOString() : undefined,
        comment: comment || undefined,
      });

      setFormSuccess('Payment successfully recorded');
      showToast('Payment successfully recorded', 'success');
      setStudentId('');
      setAmount('');
      setComment('');
      setDate('');

      fetchPayments();
      fetchReport();
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error recording payment';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await api.delete(`/api/payments/${id}`);
      showToast('Payment record deleted', 'success');
      fetchPayments();
      fetchReport();
    } catch (err: any) {
      showToast('Error deleting payment', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Муҳосибӣ (Accounting)</h2>
          <p className="text-sm text-gray-550 dark:text-gray-400">Сабт ва назорати пардохтҳои молиявии донишҷӯён.</p>
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
            <span>Сабти пардохт (Record)</span>
          </button>
        )}
      </div>

      {/* Financial Overview Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black uppercase">Умумии даромад</span>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{report.totalRevenue} TJS</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black uppercase">Имрӯз</span>
              <h4 className="text-2xl font-black text-blue-600 dark:text-blue-400">{report.todayRevenue} TJS</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black uppercase">Моҳи ҷорӣ</span>
              <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400">{report.monthRevenue} TJS</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and listing panel */}
      <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Filter */}
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold appearance-none"
            >
              <option value="">Ҳамаи донишҷӯён</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.phone})</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="date"
              placeholder="Санаи оғоз"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="date"
              placeholder="Санаи анҷом"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xs font-semibold"
            />
          </div>
        </div>

        {/* Payments Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-bold">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-400 uppercase tracking-wider font-black">
                <th className="pb-3 pr-4">Сана</th>
                <th className="pb-3 pr-4">Донишҷӯ</th>
                <th className="pb-3 pr-4">Маблағ</th>
                <th className="pb-3 pr-4">Навъ</th>
                <th className="pb-3 pr-4">Қабулкунанда</th>
                <th className="pb-3 pr-4">Шарҳ</th>
                <th className="pb-3 text-right">Амалҳо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-850">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-accent/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 text-slate-700 dark:text-slate-350">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3.5 pr-4 font-extrabold text-slate-900 dark:text-white">
                      <div>{p.student.firstName} {p.student.lastName}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{p.student.phone}</div>
                    </td>
                    <td className="py-3.5 pr-4 text-green-600 dark:text-green-450 font-black">{p.amount} TJS</td>
                    <td className="py-3.5 pr-4 uppercase"><span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">{p.paymentType}</span></td>
                    <td className="py-3.5 pr-4 text-gray-505">{p.employee ? `${p.employee.firstName} ${p.employee.lastName[0]}.` : '-'}</td>
                    <td className="py-3.5 pr-4 text-gray-500 italic max-w-xs truncate">{p.comment || '-'}</td>
                    <td className="py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setReceiptOpen(true);
                        }}
                        className="p-1.5 bg-gray-55 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-gray-550 hover:text-accent transition-colors"
                        title="Print receipt / Check"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 rounded-lg text-red-650 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 font-bold">Ягон сабти пардохт ёфт нашуд.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Receipt printable check */}
      {receiptOpen && selectedPayment && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 border border-gray-300 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative print:p-0 print:border-none print:shadow-none animate-slide-up">
            <button
              onClick={() => setReceiptOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Check Layout */}
            <div className="text-center space-y-2">
              <h3 className="font-Montserrat font-black text-xl tracking-wider text-[#1895b0]">OMUZ CRM</h3>
              <p className="text-[10px] text-gray-400 font-bold">ЧЕКИ ПАРДОХТ (PAYMENT RECEIPT)</p>
              <div className="border-b border-dashed border-gray-300 my-4"></div>
            </div>

            <div className="space-y-3 text-xs font-bold leading-loose">
              <div className="flex justify-between">
                <span className="text-gray-450">ID пардохт:</span>
                <span>{selectedPayment.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-450">Сана:</span>
                <span>{new Date(selectedPayment.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-450">Донишҷӯ:</span>
                <span>{selectedPayment.student.firstName} {selectedPayment.student.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-450">Телефон:</span>
                <span>{selectedPayment.student.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-450">Навъи пардохт:</span>
                <span className="uppercase">{selectedPayment.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-450">Корманд:</span>
                <span>{selectedPayment.employee ? `${selectedPayment.employee.firstName} ${selectedPayment.employee.lastName}` : '-'}</span>
              </div>
              {selectedPayment.comment && (
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <span className="text-gray-450 block text-[10px] uppercase">Шарҳ:</span>
                  <span className="italic text-gray-600 leading-normal block">{selectedPayment.comment}</span>
                </div>
              )}
              <div className="border-b border-dashed border-gray-300 my-4"></div>
              <div className="flex justify-between text-base font-black">
                <span>Маблағ (Total Paid):</span>
                <span className="text-green-600">{selectedPayment.amount} TJS</span>
              </div>
            </div>

            <div className="flex gap-3 pt-6 print:hidden">
              <button
                type="button"
                onClick={() => setReceiptOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
              >
                Бастан (Close)
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Чоп кардан (Print)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Record Payment */}
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
              <DollarSign className="w-5 h-5 text-green-500 animate-bounce" />
              <span>Сабти пардохти нав</span>
            </h3>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              {formError && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs">{formError}</div>}
              {formSuccess && <div className="p-4 bg-green-50 text-green-600 border border-green-100 rounded-xl text-xs">{formSuccess}</div>}

              {/* Student selection */}
              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Интихоби донишҷӯ</label>
                <select
                  required
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs"
                >
                  <option value="">Донишҷӯро интихоб кунед</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.phone})</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Маблағи пардохт (TJS)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs"
                />
              </div>

              {/* Payment Type */}
              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Намуди пардохт</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs"
                >
                  <option value="CASH">Нақд (Cash)</option>
                  <option value="CARD">Корт (Card)</option>
                  <option value="BANK">Интиқоли бонкӣ (Bank Transfer)</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Сана (холӣ бошад - имрӯз)</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1 text-xs font-bold text-gray-500 uppercase">
                <label>Шарҳ</label>
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Маблағи моҳи май..."
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-gray-800 border rounded-xl outline-none text-xs"
                />
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
    </div>
  );
};
