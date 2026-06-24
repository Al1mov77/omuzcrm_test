import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Calendar,
  Gift,
  MapPin,
  LogOut,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  Globe,
  LayoutDashboard,
  BookOpen,
  DollarSign,
  GraduationCap,
  Settings
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  if (!user) return null;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', translationKey: 'dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER', 'MENTOR'] },
    { path: '/students', label: 'Students', translationKey: 'students', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER', 'MENTOR'] },
    { path: '/groups', label: 'Groups', translationKey: 'groups', icon: LayoutGrid, roles: ['STUDENT', 'MENTOR', 'TEACHER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { path: '/courses', label: 'Courses', translationKey: 'courses', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER', 'MENTOR'] },
    { path: '/timetable', label: 'Timetable', translationKey: 'timeTable', icon: Calendar, roles: ['STUDENT', 'MENTOR', 'TEACHER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { path: '/accounting', label: 'Accounting', translationKey: 'accounting', icon: DollarSign, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { path: '/rewards', label: 'Coins Shop', translationKey: 'rewards', icon: Gift, roles: ['STUDENT', 'MENTOR', 'TEACHER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { path: '/administration', label: 'Administration', translationKey: 'administration', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { path: '/branches', label: 'Branches', translationKey: 'Branches', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-gray-800 dark:text-gray-200 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 shadow-sm z-55">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo192.png" alt="Omuz Logo" className="w-8 h-8 object-contain rounded-full" />
          <span className="font-bold text-lg tracking-wider text-[#1895b0] select-none font-Montserrat">OMUZ</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-gray-500 hover:text-accent focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar - Desktop & Mobile overlay */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col w-60 bg-white dark:bg-dark-sidebar border-r border-gray-200 dark:border-gray-800/40 shadow-lg md:shadow-none h-screen md:h-auto`}
      >
        {/* Brand */}
        <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800/30">
          <img src="/logo192.png" alt="Omuz Logo" className="w-10 h-10 object-contain rounded-full" />
          <span className="font-bold text-xl tracking-wider text-[#1895b0] select-none font-Montserrat">OMUZ</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 bg-white dark:bg-dark-sidebar">
          {filteredMenuItems.map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-[14px] ${
                  isActive
                    ? 'bg-gray-100/60 dark:bg-gray-800/50 text-[#1895b0] font-semibold'
                    : 'text-gray-550 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#1895b0]' : 'text-gray-500 dark:text-gray-400'}`} />
                <span>{t(`sideBar.${item.translationKey}`, item.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account bottom info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800/40 bg-white dark:bg-dark-sidebar">
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all"
          >
            <img
              src={user.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-light-card dark:bg-dark-card rounded-3xl border border-gray-200/60 dark:border-gray-800/40 shadow-sm m-4 mb-0">
          {/* Dashboard Title depending on Route */}
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">
              {location.pathname.startsWith('/dashboard') && 'Dashboard'}
              {location.pathname.startsWith('/students') && 'Students'}
              {location.pathname.startsWith('/groups') && 'Groups'}
              {location.pathname.startsWith('/courses') && 'Courses'}
              {location.pathname.startsWith('/timetable') && 'Timetable'}
              {location.pathname.startsWith('/rewards') && (t('Rewards.title') || 'Rewards')}
              {location.pathname.startsWith('/accounting') && 'Accounting'}
              {location.pathname.startsWith('/administration') && 'Administration'}
              {location.pathname.startsWith('/branches') && 'Branches'}
              {location.pathname.startsWith('/profile') && (t('profile.title') || 'Profile')}
            </h1>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-5">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-accent/5 hover:text-accent dark:bg-dark-sidebar dark:hover:bg-accent/10 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all focus:outline-none"
              >
                <Globe className="w-4 h-4 text-accent" />
                <span className="uppercase">{i18n.language.toUpperCase() === 'TJ' ? 'TJ' : i18n.language.toUpperCase() === 'RU' ? 'RU' : 'ENG'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setLangMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-32 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-30 py-1 text-xs">
                    {['TJ', 'RU', 'EN'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => {
                          changeLanguage(lang.toLowerCase());
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-accent/5 hover:text-accent dark:hover:bg-accent/10 dark:hover:text-indigo-400 transition-colors text-gray-800 dark:text-white ${
                          i18n.language.toUpperCase() === lang ? 'text-accent font-bold' : ''
                        }`}
                      >
                        {lang === 'TJ' ? 'TJ' : lang === 'RU' ? 'RU' : 'ENG'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications (Stub) */}
            <div className="relative">
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-accent dark:hover:text-indigo-400 transition-colors hover:scale-105 focus:outline-none">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-accent dark:hover:text-indigo-400 transition-colors hover:scale-105 focus:outline-none"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500 animate-pulse-subtle" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Coins badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-dark-sidebar border border-gray-200 dark:border-gray-800 rounded-full text-slate-800 dark:text-white font-extrabold text-xs select-none">
              <span className="text-slate-800 dark:text-white text-xs font-black">{user.coins}</span>
              <div className="w-4.5 h-4.5 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-full flex items-center justify-center text-[10px] text-amber-950 font-black shadow-sm select-none">
                🪙
              </div>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <img
                  src={user.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-accent"
                />
                <ChevronDown className="w-4 h-4 text-gray-450" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setUserDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-30 py-2 animate-slide-up">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-accent/5 hover:text-accent dark:hover:bg-accent/10 dark:hover:text-indigo-400 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      <span>{t('profile.title')}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent/5 dark:hover:bg-accent/10 text-red-500 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('profile.logout')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Responsive Mobile bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-light-card dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 shadow-sm text-xs font-semibold">
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <Gift className="w-3.5 h-3.5" />
            <span>{user.coins} {t('Rewards.currencyCoins')}</span>
          </div>
          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {['TJ', 'RU', 'EN'].map(lang => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang.toLowerCase())}
                className={`px-1.5 py-0.5 rounded ${
                  i18n.language.toUpperCase() === lang ? 'bg-accent text-white' : 'text-gray-500'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <button
            onClick={toggleTheme}
            className="p-1 bg-gray-100 dark:bg-dark-sidebar rounded-lg text-gray-500 hover:text-accent dark:hover:text-indigo-400"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-yellow-500" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
};


