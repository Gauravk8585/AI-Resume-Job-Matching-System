import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  Info,
  Lock,
  Mail,
  Moon,
  Search,
  Sun,
  User,
  UserPlus,
  Building2,
  ArrowRight,
  MapPin,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { firebaseProjectId } from '../lib/firebase';
import { SAMPLE_JOBS } from '../data/sampleData';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import type { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendResetPassword,
    enterDemoMode,
  } = useApp();

  const [publicTab, setPublicTab] = useState<'home' | 'jobs' | 'about'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('candidate');

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailProviderDisabled, setEmailProviderDisabled] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firebaseProvidersUrl = firebaseProjectId
    ? `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`
    : 'https://console.firebase.google.com/';

  const formatAuthError = (err: unknown, fallback: string): string => {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.includes('auth/operation-not-allowed')) {
      setEmailProviderDisabled(true);
      return 'Email/Password sign-in is disabled on this Firebase project.';
    }
    if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please check your credentials or use Forgot Password.';
    }
    if (raw.includes('auth/user-not-found')) {
      return 'No account found with this email. Switch to Register to create one.';
    }
    if (raw.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please switch to Login.';
    }
    if (raw.includes('auth/weak-password')) {
      return 'Password is too weak. Use at least 6 characters with letters and numbers.';
    }
    if (raw.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (raw.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before finishing. Please try again.';
    }
    if (raw.includes('auth/popup-blocked')) {
      return 'Sign-in popup was blocked by your browser. Allow popups for this site and try again.';
    }
    if (raw.includes('auth/unauthorized-domain')) {
      return 'This domain is not yet authorized in Firebase Console → Authentication → Settings → Authorized domains.';
    }
    if (raw.includes('auth/network-request-failed')) {
      return 'Network error while contacting Firebase Authentication. Check your connection and retry.';
    }
    return raw || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailProviderDisabled(false);
    setInfoMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (authMode === 'forgot') {
      setSubmitting(true);
      try {
        await sendResetPassword(email.trim());
        setInfoMsg(`Password reset link sent to ${email.trim()}.`);
      } catch (err) {
        setErrorMsg(formatAuthError(err, 'Could not send reset email.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'register' && fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email.trim(), password, selectedRole);
      } else {
        await registerWithEmail(
          fullName.trim(),
          email.trim(),
          password,
          selectedRole,
          selectedRole === 'recruiter' ? companyName.trim() || 'TechHire Partner' : undefined
        );
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err, 'Authentication failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setEmailProviderDisabled(false);
    setSubmitting(true);
    try {
      await loginWithGoogle(selectedRole);
    } catch (err) {
      setErrorMsg(formatAuthError(err, 'Google login could not be completed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F5F5FF] via-[#EEF0FF] to-[#E9EAFF] dark:from-[#0D0B1A] dark:via-[#14102B] dark:to-[#1B153A] transition-colors">
      {/* Top Bar */}
      <header className="h-16 bg-white/95 dark:bg-[#16122B]/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 px-6 lg:px-10 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => setPublicTab('home')}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6425E8] to-[#4F46E5] flex items-center justify-center text-white shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
            AI Resume &amp; Job Matching System
          </span>
        </button>

        <nav className="flex items-center gap-5 sm:gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setPublicTab('home')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              publicTab === 'home'
                ? 'text-[#6425E8] dark:text-[#A78BFA] font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            type="button"
            onClick={() => setPublicTab('jobs')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              publicTab === 'jobs'
                ? 'text-[#6425E8] dark:text-[#A78BFA] font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Jobs</span>
          </button>
          <button
            type="button"
            onClick={() => setPublicTab('about')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              publicTab === 'about'
                ? 'text-[#6425E8] dark:text-[#A78BFA] font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </button>
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle color theme"
            className="p-2 rounded-full bg-indigo-50 dark:bg-slate-800 text-[#6425E8] dark:text-amber-300 hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {publicTab === 'jobs' ? (
          <div className="max-w-5xl w-full bg-white dark:bg-[#16122B] rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Featured Opportunities
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sample roles available for AI resume matching once you sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPublicTab('home')}
                className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-sm font-semibold hover:bg-[#531BC9] transition-colors"
              >
                Sign In to Match &amp; Apply
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_JOBS.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] flex items-start gap-3.5"
                >
                  <CompanyLogo company={job.companyName} />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-semibold text-slate-900 dark:text-white">
                      {job.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{job.companyName}</span>
                      <span>·</span>
                      <MapPin className="w-3 h-3" />
                      <span>{job.location}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                      {job.requiredSkills.slice(0, 5).join(' · ')}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {job.salaryRange}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPublicTab('home')}
                        className="text-[#6425E8] dark:text-[#A78BFA] font-semibold hover:underline"
                      >
                        Login to Check Match
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : publicTab === 'about' ? (
          <div className="max-w-4xl w-full bg-white dark:bg-[#16122B] rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              About AI Resume &amp; Job Matching System
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              Built for both job seekers and hiring teams, the platform pairs real PDF/DOCX text extraction with server-side Gemini AI evaluation to eliminate guesswork from career matching and candidate screening.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
              {[
                {
                  title: 'Strict Grounded Parsing',
                  desc: 'Extracts education, skills, experience, and projects directly from your uploaded PDF or DOCX without fabricating credentials.',
                },
                {
                  title: 'Explainable Weighted Scoring',
                  desc: 'Evaluates Technical Skills (40%), Experience (20%), Education (15%), Project Relevance (15%), and Location (10%) with customizable weights.',
                },
                {
                  title: 'Actionable Skill Gap Roadmaps',
                  desc: 'Identifies missing requirements for target roles and creates step-by-step learning paths with estimated hours.',
                },
                {
                  title: 'Recruiter Talent Pipeline',
                  desc: 'Publishes vacancies, ranks applicants with AI explanations, manages shortlists, and tracks conversion analytics.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#1D1836]"
                >
                  <h2 className="font-display font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setPublicTab('home')}
                className="px-5 py-2.5 rounded-xl bg-[#6425E8] text-white text-sm font-semibold hover:bg-[#531BC9]"
              >
                Get Started
              </button>
            </div>
          </div>
        ) : (
          /* Main Split Auth Card matching Reference Screenshot */
          <div className="max-w-5xl w-full bg-white dark:bg-[#16122B] rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-200/70 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Purple-Blue Gradient Feature Panel */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#6D73F6] via-[#6425E8] to-[#4A14C8] text-white p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <h1 className="font-display text-3xl sm:text-[34px] font-bold leading-tight tracking-tight">
                  Find the Right Job with AI
                </h1>
                <p className="text-indigo-100/90 text-sm sm:text-[15px] mt-3 leading-relaxed">
                  Upload your resume, analyze your skills, and get job recommendations that match your profile.
                </p>
              </div>

              {/* Clean Resume + Magnifying Glass Vector Illustration */}
              <div className="my-8 flex items-center justify-center">
                <div className="relative w-52 h-44 flex items-center justify-center">
                  <div className="w-36 h-40 rounded-2xl bg-white/95 shadow-xl p-4 flex flex-col gap-2.5 text-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[#6425E8]">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-16 rounded-full bg-indigo-200" />
                        <div className="h-2 w-12 rounded-full bg-slate-200" />
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-indigo-100 mt-1" />
                    <div className="h-2 w-5/6 rounded-full bg-slate-200" />
                    <div className="h-2 w-4/6 rounded-full bg-slate-200" />
                    <div className="h-2 w-3/4 rounded-full bg-indigo-100 mt-1" />
                  </div>
                  <div className="absolute -left-2 bottom-2 w-14 h-12 rounded-xl bg-gradient-to-br from-indigo-300 to-indigo-500 border-2 border-white/60 shadow-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -right-1 bottom-0 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/80 shadow-xl flex items-center justify-center">
                    <Search className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-sm font-medium">
                {[
                  'AI Resume Analysis',
                  'Job Matching & Recommendations',
                  'Skill Gap Analysis',
                  'Candidate Ranking',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-200 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Login / Register Panel */}
            <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-center">
              {/* Top Segmented Tabs */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl grid grid-cols-2 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                    setEmailProviderDisabled(false);
                    setInfoMsg(null);
                  }}
                  className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    authMode === 'login' || authMode === 'forgot'
                      ? 'bg-white dark:bg-[#1D1836] text-[#6425E8] dark:text-white shadow-sm border border-indigo-200/70 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg(null);
                    setEmailProviderDisabled(false);
                    setInfoMsg(null);
                  }}
                  className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-[#1D1836] text-[#6425E8] dark:text-white shadow-sm border border-indigo-200/70 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </button>
              </div>

              <div className="text-center mb-5">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {authMode === 'login'
                    ? 'Welcome Back'
                    : authMode === 'register'
                      ? 'Create Account'
                      : 'Reset Password'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {authMode === 'login'
                    ? 'Login to access your account'
                    : authMode === 'register'
                      ? 'Select your portal role and register below'
                      : 'Enter your email to receive a password reset link'}
                </p>
              </div>

              {/* Account Type Radio Selection */}
              {authMode !== 'forgot' && (
                <div className="flex flex-wrap items-center justify-center gap-5 mb-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="accountRole"
                      value="candidate"
                      checked={selectedRole === 'candidate'}
                      onChange={() => setSelectedRole('candidate')}
                      className="w-4 h-4 accent-[#6425E8]"
                    />
                    <span
                      className={`text-sm font-semibold ${
                        selectedRole === 'candidate'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Candidate (Job Seeker)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="accountRole"
                      value="recruiter"
                      checked={selectedRole === 'recruiter'}
                      onChange={() => setSelectedRole('recruiter')}
                      className="w-4 h-4 accent-[#6425E8]"
                    />
                    <span
                      className={`text-sm font-semibold ${
                        selectedRole === 'recruiter'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Recruiter (Employer)
                    </span>
                  </label>
                </div>
              )}

              {emailProviderDisabled ? (
                <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-950 dark:text-amber-100 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                        Enable Email/Password in Firebase Console
                      </p>
                      <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                        Firebase provisioning enables Google Sign-In by default. To activate Email &amp; Password login on project <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">{firebaseProjectId || 'your project'}</code>:
                      </p>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-amber-900 dark:text-amber-200 pl-1">
                    <li>Open <strong>Authentication → Sign-in method</strong> in Firebase Console.</li>
                    <li>Click <strong>Add new provider → Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                    <li>Return here and submit your login or registration form.</li>
                  </ol>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={firebaseProvidersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
                    >
                      Open Firebase Sign-in Providers
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleGoogle()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1D1836] border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 font-semibold hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      Use Google Instead
                    </button>
                  </div>
                </div>
              ) : errorMsg ? (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  {errorMsg}
                </div>
              ) : null}

              {infoMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  {infoMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {authMode === 'register' && (
                  <>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6425E8]/40 focus:border-[#6425E8]"
                      />
                    </div>
                    {selectedRole === 'recruiter' && (
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Company name (e.g., TechHire Solutions)"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6425E8]/40 focus:border-[#6425E8]"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6425E8]/40 focus:border-[#6425E8]"
                  />
                </div>

                {authMode !== 'forgot' && (
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6425E8]/40 focus:border-[#6425E8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  {authMode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMsg(null);
                        setEmailProviderDisabled(false);
                      }}
                      className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  ) : authMode === 'forgot' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg(null);
                        setEmailProviderDisabled(false);
                      }}
                      className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                    >
                      Back to Login
                    </button>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6425E8] to-[#531BC9] hover:from-[#571FD1] hover:to-[#4514B0] text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Please wait...'
                      : authMode === 'login'
                        ? 'Login'
                        : authMode === 'register'
                          ? 'Create Account'
                          : 'Send Reset Link'}
                  </span>
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span>Or continue with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleGoogle()}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
                Continue with Google
              </button>

              {/* Quick Demo Mode Launchers */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mb-2.5">
                  Want to explore immediately with sample data &amp; live Gemini AI?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => enterDemoMode('candidate')}
                    className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-100 dark:hover:bg-indigo-950 text-xs font-semibold transition-colors"
                  >
                    Try Candidate Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => enterDemoMode('recruiter')}
                    className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-100 dark:hover:bg-indigo-950 text-xs font-semibold transition-colors"
                  >
                    Try Recruiter Demo
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-5">
                {authMode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMsg(null);
                        setEmailProviderDisabled(false);
                      }}
                      className="font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                    >
                      Register Now
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg(null);
                        setEmailProviderDisabled(false);
                      }}
                      className="font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
