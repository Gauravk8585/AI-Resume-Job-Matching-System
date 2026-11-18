import React, { useState } from 'react';
import { Calendar, Eye, Search, Send, Trash2, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import type { ApplicationStatus, JobApplication } from '../../types';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  Applied: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  'Under Review': 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  Shortlisted: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  'Interview Scheduled': 'bg-indigo-50 dark:bg-indigo-950/60 text-[#6425E8] dark:text-[#A78BFA]',
  Selected: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
  Rejected: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300',
};

export const ApplicationsPage: React.FC = () => {
  const { applications, withdrawCandidateApplication, setCandidatePage, requestConfirm } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  const filtered = applications.filter((a) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !a.jobTitle.toLowerCase().includes(q) &&
      !a.companyName.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            My Applications
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track real-time application progress, recruiter remarks, and AI match scores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCandidatePage('find-jobs')}
          className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold"
        >
          Browse More Jobs
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs sm:text-sm font-semibold"
        >
          <option value="All">All Statuses ({applications.length})</option>
          {(['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'] as ApplicationStatus[]).map(
            (st) => (
              <option key={st} value={st}>
                {st}
              </option>
            )
          )}
        </select>
      </div>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <Send className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="font-display font-bold text-slate-900 dark:text-white">
            No applications found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Apply to matching opportunities to start tracking your pipeline.
          </p>
          <button
            type="button"
            onClick={() => setCandidatePage('job-matches')}
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
          >
            View Job Matches
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">Role &amp; Company</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-4">AI Match</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <CompanyLogo company={app.companyName} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {app.jobTitle}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {app.companyName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {app.appliedDateLabel || 'Recent'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {app.matchScore}%
                        </span>
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${app.matchScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_BADGE[app.status]}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          aria-label="View application details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status === 'Applied' && (
                          <button
                            type="button"
                            onClick={() =>
                              requestConfirm({
                                title: 'Withdraw Application',
                                message: `Withdraw your application for ${app.jobTitle} at ${app.companyName}?`,
                                confirmLabel: 'Withdraw',
                                danger: true,
                                onConfirm: () => void withdrawCandidateApplication(app.id),
                              })
                            }
                            className="p-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            aria-label="Withdraw application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <CompanyLogo company={selectedApp.companyName} />
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {selectedApp.jobTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedApp.companyName} · Applied {selectedApp.appliedDateLabel || 'recently'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Current Status</div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                  {selectedApp.status}
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600 tabular-nums">
                {selectedApp.matchScore}% Match
              </span>
            </div>

            {selectedApp.remarks && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 text-xs text-slate-700 dark:text-slate-200">
                <strong className="font-semibold">Recruiter Feedback:</strong> {selectedApp.remarks}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Matched Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Missing Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.missingSkills.length > 0 ? (
                    selectedApp.missingSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
