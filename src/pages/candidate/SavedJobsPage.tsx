import React from 'react';
import { Bookmark, MapPin, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CompanyLogo } from '../../components/common/CompanyLogo';

export const SavedJobsPage: React.FC = () => {
  const {
    savedJobs,
    jobs,
    jobMatches,
    applications,
    toggleSaveJob,
    applyToJob,
    setCandidatePage,
  } = useApp();

  const savedItems = savedJobs
    .map((s) => ({
      saved: s,
      job: jobs.find((j) => j.id === s.jobId),
      match: jobMatches.find((m) => m.jobId === s.jobId),
    }))
    .filter((item) => Boolean(item.job));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Saved Jobs
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review bookmarked opportunities and apply whenever you are ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCandidatePage('find-jobs')}
          className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold"
        >
          Discover More Jobs
        </button>
      </div>

      {savedItems.length === 0 ? (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="font-display font-bold text-slate-900 dark:text-white">
            No saved jobs yet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Bookmark jobs from Find Jobs or Job Matches to keep them organized here.
          </p>
          <button
            type="button"
            onClick={() => setCandidatePage('find-jobs')}
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedItems.map(({ job, match }) => {
            if (!job) return null;
            const applied = applications.some((a) => a.jobId === job.id);
            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CompanyLogo company={job.companyName} size="lg" />
                      <div>
                        <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                          {job.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{job.companyName}</span>
                          <span>·</span>
                          <MapPin className="w-3 h-3" />
                          <span>{job.location}</span>
                        </p>
                      </div>
                    </div>
                    {match && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0">
                        {match.overallScore}% Match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.requiredSkills.slice(0, 5).map((sk) => (
                      <span
                        key={sk}
                        className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {job.salaryRange}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleSaveJob(job.id)}
                      className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                    <button
                      type="button"
                      disabled={applied}
                      onClick={() => void applyToJob(job)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold ${
                        applied
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 cursor-default'
                          : 'bg-[#6425E8] hover:bg-[#531BC9] text-white'
                      }`}
                    >
                      {applied ? 'Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
