import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import {
  ConfirmDialog,
  ErrorBoundary,
  ToastContainer,
} from './components/common/FeedbackComponents';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AuthPage } from './pages/AuthPage';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { MyProfilePage } from './pages/candidate/MyProfilePage';
import { UploadResumePage } from './pages/candidate/UploadResumePage';
import { FindJobsPage } from './pages/candidate/FindJobsPage';
import { JobMatchesPage } from './pages/candidate/JobMatchesPage';
import { SkillGapPage } from './pages/candidate/SkillGapPage';
import { ApplicationsPage } from './pages/candidate/ApplicationsPage';
import { SavedJobsPage } from './pages/candidate/SavedJobsPage';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { PostJobPage } from './pages/recruiter/PostJobPage';
import { MyJobsPage } from './pages/recruiter/MyJobsPage';
import { CandidatesPage } from './pages/recruiter/CandidatesPage';
import { AnalyticsPage } from './pages/recruiter/AnalyticsPage';
import { SettingsPage } from './pages/recruiter/SettingsPage';

const PortalRouter: React.FC = () => {
  const { authReady, userAccount, role, candidatePage, recruiterPage, isLoadingData } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F5F5FF] dark:bg-[#0D0B1A] flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-[#6425E8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Initializing AI Resume &amp; Job Matching System...
          </p>
        </div>
      </div>
    );
  }

  if (!userAccount || !role) {
    return <AuthPage />;
  }

  const renderCandidateContent = () => {
    switch (candidatePage) {
      case 'dashboard':
        return <CandidateDashboard />;
      case 'profile':
        return <MyProfilePage />;
      case 'my-resume':
        return <UploadResumePage mode="manage" />;
      case 'upload-resume':
        return <UploadResumePage mode="upload" />;
      case 'find-jobs':
        return <FindJobsPage />;
      case 'job-matches':
        return <JobMatchesPage />;
      case 'skill-gap':
        return <SkillGapPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'saved-jobs':
        return <SavedJobsPage />;
      default:
        return <CandidateDashboard />;
    }
  };

  const renderRecruiterContent = () => {
    switch (recruiterPage) {
      case 'dashboard':
        return <RecruiterDashboard />;
      case 'post-job':
        return <PostJobPage />;
      case 'my-jobs':
        return <MyJobsPage />;
      case 'candidates':
        return <CandidatesPage mode="all" />;
      case 'shortlisted':
        return <CandidatesPage mode="shortlisted" />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <RecruiterDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5FF] dark:bg-[#0D0B1A] text-[#111827] dark:text-slate-100 transition-colors">
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px]">
          {isLoadingData ? (
            <div className="space-y-5 animate-pulse">
              <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-28 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/70 dark:border-slate-800" />
                ))}
              </div>
              <div className="h-72 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/70 dark:border-slate-800" />
            </div>
          ) : role === 'candidate' ? (
            renderCandidateContent()
          ) : (
            renderRecruiterContent()
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <PortalRouter />
        <ToastContainer />
        <ConfirmDialog />
        <OfflineIndicator />
      </AppProvider>
    </ErrorBoundary>
  );
}
