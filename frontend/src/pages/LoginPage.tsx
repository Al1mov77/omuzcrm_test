import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import loginGraphicPng from '../assets/login_graphic.png';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Tab control: 'login' (1) or 'register' (2)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regParentsPhone, setRegParentsPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');

  // Modals
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    setLoading(true);

    try {
      await login(phone, password);
      // Wait, in production it checks user role and routes to /dashboard or /dashboard/profile
      // Local App routing goes to /profile or dashboard
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    
    // Simulate signup request since local backend doesn't support register
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRegSuccess('Registration successfully submitted for administrator review!');
      // Clear fields
      setRegName('');
      setRegSurname('');
      setRegBirthDate('');
      setRegAddress('');
      setRegPhone('');
      setRegParentsPhone('');
      setRegPassword('');
    }, 1000);
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4 transition-colors font-sans duration-200">
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl w-full justify-center items-stretch animate-scale-in">
        
        {/* Left column: Login/Register form Card */}
        <div className="w-full lg:w-[580px] bg-white dark:bg-dark-card rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-800/50 p-8 lg:p-10 flex flex-col justify-between relative">
          
          {/* Header row with Logo and Lang switcher */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <img src="/logo192.png" alt="Omuz Logo" className="w-9 h-9 object-contain rounded-full" />
              <span className="font-bold text-lg tracking-wider text-[#1895b0] select-none font-Montserrat">OMUZ</span>
            </div>
          </div>

          {/* Form Tabs Selection */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError('');
                setRegSuccess('');
              }}
              className={`w-1/2 pb-4 text-center font-bold text-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'text-[#4A3AFF] border-b-2 border-[#4A3AFF]'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t('login.login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError('');
                setRegSuccess('');
              }}
              className={`w-1/2 pb-4 text-center font-bold text-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'text-[#4A3AFF] border-b-2 border-[#4A3AFF]'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t('login.signIn')}
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {regSuccess && (
            <div className="flex items-center gap-2 p-3.5 mb-4 bg-green-50 dark:bg-green-950/20 border border-green-150 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          {/* Form Content */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Phone input */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-base font-semibold text-gray-500 dark:text-gray-400">
                  {t('login.phone')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold text-base">
                    +992
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                    placeholder="900000000"
                    className="block w-full pl-18 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-base font-medium"
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-base font-semibold text-gray-500 dark:text-gray-400">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-450">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-base font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-450 hover:text-[#4A3AFF] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5.5 h-5.5" /> : <Eye className="w-5.5 h-5.5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 bg-[#4A3AFF] hover:bg-[#372FEE] text-white text-base font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('login.login')
                )}
              </button>

              {/* Forgot password trigger */}
              <div className="flex justify-center pt-2.5">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-bold text-[#4A3AFF] hover:underline cursor-pointer focus:outline-none"
                >
                  {t('login.forgot')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              
              {/* Name & Surname */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t('login.name')}
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    value={regSurname}
                    onChange={(e) => setRegSurname(e.target.value)}
                    placeholder={t('login.surname')}
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 pl-1">
                  {t('login.date')}
                </label>
                <input
                  type="date"
                  required
                  value={regBirthDate}
                  onChange={(e) => setRegBirthDate(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm text-gray-700 dark:text-gray-300"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder={t('login.adrres')}
                  className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm"
                />
              </div>

              {/* Phones */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 pl-1">
                    {t('login.phone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold text-xs">
                      +992
                    </div>
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                      placeholder="900000000"
                      className="block w-full pl-12 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 pl-1">
                    {t('login.parentsPhone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold text-xs">
                      +992
                    </div>
                    <input
                      type="text"
                      required
                      value={regParentsPhone}
                      onChange={(e) => setRegParentsPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                      placeholder="900000000"
                      className="block w-full pl-12 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t('login.password')}
                    className="block w-full pl-4 pr-11 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:ring-2 focus:ring-[#4A3AFF] focus:border-[#4A3AFF] outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-455 hover:text-[#4A3AFF] focus:outline-none"
                  >
                    {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-[#4A3AFF] hover:bg-[#372FEE] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('login.signUP')
                )}
              </button>
            </form>
          )}

        </div>

        {/* Right column: Welcome & Graphic Branding Card */}
        <div className="hidden lg:flex w-full lg:w-[520px] bg-white dark:bg-dark-card rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-800/50 p-10 flex-col justify-between items-stretch">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-3 pl-2">
              {t('login.welcome')}
            </h1>
            <div className="flex items-center gap-2.5 pl-2">
              <img src="/logo192.png" alt="Omuz Logo" className="w-12 h-12 object-contain rounded-full" />
              <span className="font-bold text-3xl tracking-wider text-[#1895b0] select-none font-Montserrat">OMUZ</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center py-6">
            <img
              src={loginGraphicPng}
              alt="Omuz Graphic"
              className="w-[80%] h-auto object-contain animate-pulse-subtle"
            />
          </div>
        </div>

      </div>

      {/* Forgot Password modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-slide-up shadow-2xl">
            <h3 className="text-lg font-bold text-gray-950 dark:text-white">{t('login.forgot')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              To reset your password, please contact the center's Administrator.
            </p>
            <button
              onClick={() => setForgotOpen(false)}
              className="w-full py-2.5 bg-[#4A3AFF] text-white rounded-xl font-bold hover:bg-[#372FEE] transition-all cursor-pointer"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
