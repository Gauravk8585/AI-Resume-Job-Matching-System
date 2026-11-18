import React from 'react';
import {
  BarChart3,
  Bookmark,
  Briefcase,
  FileText,
  Home,
  LogOut,
  PlusSquare,
  Search,
  Send,
  Settings,
  Target,
  UploadCloud,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp, type CandidatePage, type RecruiterPage } from '../../contexts/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    role,
    candidatePage,
    setCandidatePage,
    recruiterPage,
    setRecruiterPage,
    setEditingJob,
    logout,
  } = useApp();

  const candidateItems: { id: CandidatePage; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-[18px] h-[18px]" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-[18px] h-[18px]" /> },
    { id: 'my-resume', label: 'My Resume', icon: <FileText className="w-[18px] h-[18px]" /> },
    { id: 'upload-resume', label: 'Upload Resume', icon: <UploadCloud className="w-[18px] h-[18px]" /> },
    { id: 'find-jobs', label: 'Find Jobs', icon: <Search className="w-[18px] h-[18px]" /> },
    { id: 'job-matches', label: 'Job Matches', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: 'skill-gap', label: 'Skill Gap', icon: <Target className="w-[18px] h-[18px]" /> },
    { id: 'applications', label: 'Applications', icon: <Send className="w-[18px] h-[18px]" /> },
    { id: 'saved-jobs', label: 'Saved Jobs', icon: <Bookmark className="w-[18px] h-[18px]" /> },
  ];

  const recruiterItems: { id: RecruiterPage; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-[18px] h-[18px]" /> },
    { id: 'post-job', label: 'Post Job', icon: <PlusSquare className="w-[18px] h-[18px]" /> },
    { id: 'my-jobs', label: 'My Jobs', icon: <Briefcase className="w-[18px] h-[18px]" /> },
    { id: 'candidates', label: 'Candidates', icon: <Users className="w-[18px] h-[18px]" /> },
    { id: 'shortlisted', label: 'Shortlisted', icon: <Bookmark className="w-[18px] h-[18px]" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
  ];

  const handleCandidateSelect = (id: CandidatePage) => {
    setCandidatePage(id);
    onCloseMobile();
  };

  const handleRecruiterSelect = (id: RecruiterPage) => {
    if (id === 'post-job') setEditingJob(null);
    setRecruiterPage(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between bg-[#211747] text-slate-200 px-3.5 py-5 select-none">
      <div>
        <div className="flex items-center justify-between lg:hidden px-2 pb-4 mb-2 border-b border-white/10">
          <span className="font-display font-bold text-white text-sm">Navigation</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Primary Sidebar Navigation">
          {role === 'candidate'
            ? candidateItems.map((item) => {
                const active = candidatePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCandidateSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-[#8055F5] to-[#6425E8] text-white shadow-md shadow-indigo-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })
            : recruiterItems.map((item) => {
                const active = recruiterPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRecruiterSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-[#8055F5] to-[#6425E8] text-white shadow-md shadow-indigo-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
        </nav>
      </div>

      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-60 shrink-0 min-h-[calc(100vh-4rem)] bg-[#211747]">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
};
