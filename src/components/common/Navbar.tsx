import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Briefcase,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AVATAR_CANDIDATE_1, AVATAR_RECRUITER } from '../../data/sampleData';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const {
    userAccount,
    role,
    isDemoMode,
    darkMode,
    toggleDarkMode,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setCandidatePage,
    setRecruiterPage,
    logout,
    emailVerifiedWarning,
    resendVerificationEmail,
    refreshEmailVerification,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const fallbackAvatar = role === 'recruiter' ? AVATAR_RECRUITER : AVATAR_CANDIDATE_1;

  return (
    <div className="sticky top-0 z-30">
      <header className="h-16 bg-white dark:bg-[#16122B] border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6425E8] to-[#4F46E5] flex items-center justify-center text-white shadow-sm shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
              AI Resume &amp; Job Matching System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <PWAInstallButton compact />
          {isDemoMode && (
            <span className="hidden md:inline-block text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-md whitespace-nowrap">
              Demo Mode · Sample Data
            </span>
          )}

          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Toggle notifications"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1D1836] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                    Notifications ({unreadCount} unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsAsRead()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      You are all caught up.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => void markNotificationAsRead(n.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                          !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="text-[11px] font-medium text-[#6425E8] dark:text-[#A78BFA] shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        {n.timeLabel && (
                          <span className="text-[11px] text-slate-400 mt-1 block">{n.timeLabel}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={userAccount?.photoURL || fallbackAvatar}
                alt={userAccount?.displayName || 'User profile'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight max-w-[140px] truncate">
                  {userAccount?.displayName || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize leading-tight">
                  {role === 'recruiter'
                    ? userAccount?.companyName || 'Recruiter'
                    : 'Candidate'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1D1836] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {userAccount?.displayName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {userAccount?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (role === 'candidate') setCandidatePage('profile');
                    else setRecruiterPage('settings');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                >
                  {role === 'candidate' ? <User className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                  {role === 'candidate' ? 'My Profile' : 'Account Settings'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    void logout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {emailVerifiedWarning && !isDemoMode && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <span>
            Please verify your email address to enable cloud persistence in Firestore.
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void refreshEmailVerification()}
              className="font-semibold px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900/70 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
            >
              I&apos;ve Verified — Refresh
            </button>
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="font-semibold underline hover:text-amber-950 dark:hover:text-white"
            >
              Resend Verification Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
