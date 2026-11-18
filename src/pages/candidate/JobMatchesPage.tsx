import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Filter,
  GraduationCap,
  Layers,
  RefreshCw,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CircularProgress } from '../../components/common/CircularProgress';
import { CompanyLogo } from '../../components/common/CompanyLogo';

export const JobMatchesPage: React.FC = () => {
  const {
    jobs,
    jobMatches,
    applications,
    savedJobs,
    runJobMatching,
    isMatchingJobs,
    aiError,
    applyToJob,
    toggleSaveJob,
    setCandidatePage,
    runSkillGapAnalysis,
  } = useApp();

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expFilter, setExpFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'best' | 'latest' | 'salary'>('best');

  const publishedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'published'),
    [jobs]
  );

  const roleCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const j of publishedJobs) {
      const role = j.roleCategory || j.title;
      map.set(role, (map.get(role) || 0) + 1);
    }
    return Array.from(map.entries());
  }, [publishedJobs]);

  const uniqueLocations = useMemo(
    () => Array.from(new Set(publishedJobs.map((j) => j.location).filter(Boolean))),
    [publishedJobs]
  );

  const matchedItems = useMemo(() => {
    return publishedJobs
      .map((job) => {
        const match = jobMatches.find((m) => m.jobId === job.id);
        return { job, match };
      })
      .filter(({ job }) => {
        const roleName = job.roleCategory || job.title;
        if (selectedRoles.length > 0 && !selectedRoles.includes(roleName)) return false;
        if (expFilter !== 'All' && !job.experienceRequired.includes(expFilter)) return false;
        if (typeFilter !== 'All' && job.jobType !== typeFilter) return false;
        if (locationFilter !== 'All' && job.location !== locationFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'salary') {
          return (b.job.salaryNumeric || 0) - (a.job.salaryNumeric || 0);
        }
        if (sortBy === 'latest') {
          return (b.job.deadline || '').localeCompare(a.job.deadline || '');
        }
        return (b.match?.overallScore ?? 0) - (a.match?.overallScore ?? 0);
      });
  }, [publishedJobs, jobMatches, selectedRoles, expFilter, typeFilter, locationFilter, sortBy]);

  const topMatch = [...jobMatches].sort((a, b) => b.overallScore - a.overallScore)[0];
  const topRolesText = matchedItems
    .slice(0, 3)
    .map((m) => m.job.title)
    .join(', ');

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Job Matching Results
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI has analyzed your resume and found the best job opportunities for you.
          </p>
        </div>
        <button
          type="button"
          disabled={isMatchingJobs}
          onClick={() => void runJobMatching()}
          className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isMatchingJobs ? 'animate-spin' : ''}`} />
          {isMatchingJobs ? 'Calculating AI Matches...' : 'Run AI Job Matching'}
        </button>
      </div>

      {aiError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button
            type="button"
            onClick={() => void runJobMatching()}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Row: Match Summary + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-center gap-6">
          <CircularProgress
            value={topMatch?.overallScore ?? 0}
            size={134}
            strokeWidth={12}
            label="Overall Match"
          />
          <div className="flex-1 w-full">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#6425E8]" />
              Match Summary
            </h2>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Skills Match', val: topMatch?.skillsMatch ?? 0 },
                { label: 'Education Match', val: topMatch?.educationMatch ?? 0 },
                { label: 'Experience Match', val: topMatch?.experienceMatch ?? 0 },
                { label: 'Overall Fit', val: topMatch?.overallScore ?? 0 },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {row.label}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {row.val}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-gradient-to-br from-[#F4F1FF] to-[#ECE7FF] dark:from-[#1E183C] dark:to-[#181330] rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[#6425E8] dark:text-[#A78BFA] font-display font-bold text-base mb-2">
            <Sparkles className="w-5 h-5" />
            AI Recommendation
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {topMatch?.explanation ||
              `You are highly suitable for ${topRolesText || 'Data Analyst and AI/ML Associate'} roles based on your verified skills and education.`}
          </p>
        </div>
      </div>

      {/* Main Split: Filter Jobs Left + Recommended Job Opportunities Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Filter Jobs Panel */}
        <aside className="lg:col-span-3 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6425E8]" />
              Filter Jobs
            </h2>
            {selectedRoles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRoles([]);
                  setExpFilter('All');
                  setTypeFilter('All');
                  setLocationFilter('All');
                }}
                className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
              Job Role
            </h3>
            <div className="space-y-2">
              {roleCounts.map(([roleName, count]) => (
                <label
                  key={roleName}
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(roleName)}
                    onChange={() => toggleRole(roleName)}
                    className="w-4 h-4 rounded accent-[#6425E8]"
                  />
                  <span className="truncate">
                    {roleName} ({count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Experience
            </label>
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-medium"
            >
              <option value="All">All Experience</option>
              <option value="0 – 1">0 – 1 Year</option>
              <option value="0 – 2">0 – 2 Years</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Job Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-medium"
            >
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Internship">Internship</option>
              <option value="Part Time">Part Time</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-medium"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void runJobMatching()}
            className="w-full py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Recalculate Matches
          </button>
        </aside>

        {/* Recommended Job Opportunities */}
        <div className="lg:col-span-9 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#6425E8]" />
              Recommended Job Opportunities ({matchedItems.length})
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'best' | 'latest' | 'salary')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-semibold"
              >
                <option value="best">Best Match</option>
                <option value="latest">Latest Jobs</option>
                <option value="salary">Highest Salary</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            {matchedItems.map(({ job, match }, index) => {
              const applied = applications.some((a) => a.jobId === job.id);
              const saved = savedJobs.some((s) => s.jobId === job.id);
              const score = match?.overallScore ?? 75;

              return (
                <div
                  key={job.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    index === 0
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1D1836]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <CompanyLogo company={job.companyName} size="lg" />
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {job.companyName} &nbsp;|&nbsp; {job.location} &nbsp;|&nbsp; {job.jobType}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 mt-2">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {job.experienceRequired}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {job.educationRequirement}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {job.requiredSkills.slice(0, 3).join(', ')}
                          </span>
                        </div>
                        {match?.explanation && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {match.explanation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0">
                      <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {score}% Match
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void runSkillGapAnalysis(job.id);
                            setCandidatePage('skill-gap');
                          }}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Skill Gap
                        </button>
                        <button
                          type="button"
                          disabled={applied}
                          onClick={() => void applyToJob(job)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            applied
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-default'
                              : 'bg-[#6425E8] hover:bg-[#531BC9] text-white'
                          }`}
                        >
                          {applied ? 'Applied' : 'Apply Now'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleSaveJob(job.id)}
                          aria-label={saved ? 'Unsave job' : 'Save job'}
                          className={`p-2 rounded-xl border transition-colors ${
                            saved
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-[#6425E8] text-[#6425E8]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#6425E8]'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
