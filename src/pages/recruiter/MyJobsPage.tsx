import React, { useState } from 'react';
import { Briefcase, Edit3, Lock, Play, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CompanyLogo } from '../../components/common/CompanyLogo';

export const MyJobsPage: React.FC = () => {
  const {
    jobs,
    applications,
    setEditingJob,
    setRecruiterPage,
    deleteJob,
    toggleJobStatus,
    runCandidateRanking,
    requestConfirm,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');

  const filtered = jobs.filter((j) => statusFilter === 'all' || j.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            My Job Postings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Edit, publish, close, or run AI candidate ranking on your open vacancies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingJob(null);
            setRecruiterPage('post-job');
          }}
          className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Post New Job
        </button>
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-[#16122B] p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 w-fit">
        {(['all', 'published', 'draft', 'closed'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              statusFilter === st
                ? 'bg-[#6425E8] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="font-display font-bold text-slate-900 dark:text-white">No jobs found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Create your first job posting to start receiving and ranking candidates.
          </p>
          <button
            type="button"
            onClick={() => setRecruiterPage('post-job')}
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
          >
            Post a Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => {
            const appCount = applications.filter((a) => a.jobId === job.id).length;
            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <CompanyLogo company={job.companyName} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                        {job.title}
                      </h2>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                          job.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : job.status === 'draft'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {job.companyName} · {job.location} · {job.jobType} · {job.vacancies} Vacancies · Deadline {job.deadline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.requiredSkills.slice(0, 6).map((sk) => (
                        <span
                          key={sk}
                          className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      void runCandidateRanking(job);
                      setRecruiterPage('dashboard');
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6425E8] dark:text-[#A78BFA] text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Rank Candidates ({appCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingJob(job);
                      setRecruiterPage('post-job');
                    }}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    aria-label="Edit job"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void toggleJobStatus(
                        job.id,
                        job.status === 'published' ? 'closed' : 'published'
                      )
                    }
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    aria-label={job.status === 'published' ? 'Close job' : 'Publish job'}
                    title={job.status === 'published' ? 'Close Job' : 'Publish Job'}
                  >
                    {job.status === 'published' ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: 'Delete Job Posting',
                        message: `Are you sure you want to permanently delete "${job.title}"?`,
                        confirmLabel: 'Delete Job',
                        danger: true,
                        onConfirm: () => void deleteJob(job.id),
                      })
                    }
                    className="p-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    aria-label="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
