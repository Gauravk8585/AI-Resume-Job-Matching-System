import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  Calendar,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import type { JobPosting } from '../../types';

export const FindJobsPage: React.FC = () => {
  const { jobs, jobMatches, applications, savedJobs, applyToJob, toggleSaveJob } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [expFilter, setExpFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('');
  const [minSalary, setMinSalary] = useState(0);
  const [sortBy, setSortBy] = useState<'latest' | 'salary' | 'match'>('match');
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const publishedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'published'),
    [jobs]
  );

  const uniqueLocations = useMemo(
    () => Array.from(new Set(publishedJobs.map((j) => j.location).filter(Boolean))),
    [publishedJobs]
  );
  const uniqueCompanies = useMemo(
    () => Array.from(new Set(publishedJobs.map((j) => j.companyName).filter(Boolean))),
    [publishedJobs]
  );
  const uniqueRoles = useMemo(
    () => Array.from(new Set(publishedJobs.map((j) => j.roleCategory || j.title).filter(Boolean))),
    [publishedJobs]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sk = skillFilter.trim().toLowerCase();

    return publishedJobs
      .filter((j) => {
        if (
          q &&
          !j.title.toLowerCase().includes(q) &&
          !j.companyName.toLowerCase().includes(q) &&
          !j.description.toLowerCase().includes(q) &&
          !j.requiredSkills.some((s) => s.toLowerCase().includes(q))
        ) {
          return false;
        }
        if (roleFilter !== 'All' && (j.roleCategory || j.title) !== roleFilter) return false;
        if (locationFilter !== 'All' && j.location !== locationFilter) return false;
        if (expFilter !== 'All' && !j.experienceRequired.includes(expFilter)) return false;
        if (typeFilter !== 'All' && j.jobType !== typeFilter) return false;
        if (companyFilter !== 'All' && j.companyName !== companyFilter) return false;
        if (sk && !j.requiredSkills.some((s) => s.toLowerCase().includes(sk))) return false;
        if (minSalary > 0 && (j.salaryNumeric || 0) < minSalary) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'salary') return (b.salaryNumeric || 0) - (a.salaryNumeric || 0);
        if (sortBy === 'match') {
          const ma = jobMatches.find((m) => m.jobId === a.id)?.overallScore ?? 0;
          const mb = jobMatches.find((m) => m.jobId === b.id)?.overallScore ?? 0;
          return mb - ma;
        }
        return (b.deadline || '').localeCompare(a.deadline || '');
      });
  }, [
    publishedJobs,
    searchQuery,
    roleFilter,
    locationFilter,
    expFilter,
    typeFilter,
    companyFilter,
    skillFilter,
    minSalary,
    sortBy,
    jobMatches,
  ]);

  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('All');
    setLocationFilter('All');
    setExpFilter('All');
    setTypeFilter('All');
    setCompanyFilter('All');
    setSkillFilter('');
    setMinSalary(0);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Find Jobs
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Explore open positions, filter by skills or salary, and apply with your AI-analyzed profile.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'salary' | 'match')}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs font-semibold text-slate-800 dark:text-white"
          >
            <option value="match">Best Match</option>
            <option value="salary">Highest Salary</option>
            <option value="latest">Latest Deadline</option>
          </select>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, company, description, or skills..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6425E8]/40"
            />
          </div>
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Filter by skill (e.g. Python)"
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-sm text-slate-900 dark:text-white"
            >
              <option value="All">All Job Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Internship">Internship</option>
              <option value="Part Time">Part Time</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More filters:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
            >
              <option value="All">All Roles</option>
              {uniqueRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
            >
              <option value="All">All Companies</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={expFilter}
              onChange={(e) => {
                setExpFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
            >
              <option value="All">Any Experience</option>
              <option value="0 – 1">0 – 1 Year</option>
              <option value="0 – 2">0 – 2 Years</option>
              <option value="2+">2+ Years</option>
            </select>
            <select
              value={minSalary}
              onChange={(e) => {
                setMinSalary(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
            >
              <option value={0}>Any Salary</option>
              <option value={50000}>$50k+</option>
              <option value={75000}>$75k+</option>
              <option value={95000}>$95k+</option>
            </select>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Job Cards List */}
      {paginated.length === 0 ? (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-slate-900 dark:text-white">
            No jobs match your filters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Try clearing one or more filters to view available opportunities.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paginated.map((job) => {
            const match = jobMatches.find((m) => m.jobId === job.id);
            const applied = applications.some((a) => a.jobId === job.id);
            const saved = savedJobs.some((s) => s.jobId === job.id);

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <CompanyLogo company={job.companyName} size="lg" />
                      <div className="min-w-0">
                        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate">
                          {job.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {job.companyName}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                          <span>·</span>
                          <span>{job.jobType}</span>
                        </div>
                      </div>
                    </div>

                    {match && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0">
                        {match.overallScore}% Match
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.requiredSkills.slice(0, 6).map((sk) => (
                      <span
                        key={sk}
                        className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {job.salaryRange} · {job.experienceRequired}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Deadline: {job.deadline || 'Open'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleSaveJob(job.id)}
                      aria-label={saved ? 'Remove from saved' : 'Save job'}
                      className={`p-2 rounded-xl border transition-colors ${
                        saved
                          ? 'bg-indigo-50 dark:bg-indigo-950 border-[#6425E8] text-[#6425E8] dark:text-[#A78BFA]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#6425E8]'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3.5">
                <CompanyLogo company={selectedJob.companyName} size="lg" />
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {selectedJob.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedJob.companyName} · {selectedJob.location} · {selectedJob.jobType}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                  <div className="text-slate-500 dark:text-slate-400">Salary</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedJob.salaryRange}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                  <div className="text-slate-500 dark:text-slate-400">Experience</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedJob.experienceRequired}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                  <div className="text-slate-500 dark:text-slate-400">Education</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedJob.educationRequirement}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                  <div className="text-slate-500 dark:text-slate-400">Vacancies</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {selectedJob.vacancies}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-1.5">
                  Job Description
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((sk) => (
                    <span
                      key={sk}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => void toggleSaveJob(selectedJob.id)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {savedJobs.some((s) => s.jobId === selectedJob.id) ? 'Saved' : 'Save Job'}
              </button>
              <button
                type="button"
                disabled={applications.some((a) => a.jobId === selectedJob.id)}
                onClick={() => {
                  void applyToJob(selectedJob);
                  setSelectedJob(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold hover:bg-[#531BC9] disabled:opacity-50"
              >
                {applications.some((a) => a.jobId === selectedJob.id) ? 'Already Applied' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
