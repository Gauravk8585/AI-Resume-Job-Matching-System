import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AVATAR_CANDIDATE_1 } from '../../data/sampleData';
import type { ApplicationStatus, RankedCandidateResult } from '../../types';
import { downloadResumeFile } from '../../utils/resumeParser';

export const RecruiterDashboard: React.FC = () => {
  const {
    jobs,
    candidatePool,
    rankedCandidates,
    shortlisted,
    applications,
    setRecruiterPage,
    setEditingJob,
    runCandidateRanking,
    isRankingCandidates,
    aiError,
    toggleShortlistCandidate,
    updateCandidateApplicationStatus,
  } = useApp();

  const activeJobs = useMemo(() => jobs.filter((j) => j.status === 'published'), [jobs]);
  const [selectedJobId, setSelectedJobId] = useState<string>(activeJobs[0]?.id || jobs[0]?.id || '');
  const selectedJob = jobs.find((j) => j.id === selectedJobId) || activeJobs[0] || jobs[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Best Match' | 'Shortlisted' | 'In Review'>('All');
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    rankedCandidates[0]?.candidateId || candidatePool[0]?.userId || ''
  );
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'skills' | 'resume' | 'remarks'>('overview');
  const [remarksDraft, setRemarksDraft] = useState('');
  const [fullResumeModal, setFullResumeModal] = useState<RankedCandidateResult | null>(null);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedCandidates
      .filter((c) => {
        if (
          q &&
          !c.candidateName.toLowerCase().includes(q) &&
          !c.matchedSkills.some((s) => s.toLowerCase().includes(q)) &&
          !c.education.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (statusFilter === 'Best Match' && c.matchScore < 85) return false;
        if (statusFilter === 'Shortlisted' && c.applicationStatus !== 'Shortlisted') return false;
        if (
          statusFilter === 'In Review' &&
          !['Under Review', 'Applied'].includes(c.applicationStatus)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        sortBy === 'name'
          ? a.candidateName.localeCompare(b.candidateName)
          : b.matchScore - a.matchScore
      );
  }, [rankedCandidates, searchQuery, statusFilter, sortBy]);

  const activeCandidate =
    filteredCandidates.find((c) => c.candidateId === selectedCandidateId) ||
    filteredCandidates[0] ||
    rankedCandidates[0];

  const totalCandidatesCount = Math.max(candidatePool.length, rankedCandidates.length, applications.length);
  const bestMatchScore = rankedCandidates.reduce((max, c) => Math.max(max, c.matchScore), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Recruiter Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage job postings, view candidate matches, and shortlist the best talent.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingJob(null);
            setRecruiterPage('post-job');
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8055F5] to-[#6425E8] hover:from-[#7044E8] hover:to-[#531BC9] text-white text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Post a New Job
        </button>
      </div>

      {/* 5 KPI Cards matching Screenshot 5 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Candidates',
            value: totalCandidatesCount,
            icon: <Users className="w-5 h-5 text-[#6425E8]" />,
            bg: 'bg-indigo-50 dark:bg-indigo-950/60',
          },
          {
            label: 'Resumes Analyzed',
            value: candidatePool.length,
            icon: <FileText className="w-5 h-5 text-blue-600" />,
            bg: 'bg-blue-50 dark:bg-blue-950/60',
          },
          {
            label: 'Shortlisted',
            value: shortlisted.length,
            icon: <Star className="w-5 h-5 text-amber-500" />,
            bg: 'bg-amber-50 dark:bg-amber-950/60',
          },
          {
            label: 'Best Match Score',
            value: `${bestMatchScore}%`,
            icon: <Trophy className="w-5 h-5 text-emerald-600" />,
            bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          },
          {
            label: 'Active Job Posts',
            value: activeJobs.length,
            icon: <Briefcase className="w-5 h-5 text-pink-600" />,
            bg: 'bg-pink-50 dark:bg-pink-950/60',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex items-center gap-3.5"
          >
            <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {aiError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {aiError}
          </span>
          {selectedJob && (
            <button
              type="button"
              onClick={() => void runCandidateRanking(selectedJob)}
              className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Split Workspace: Candidate Ranking Table Left + Candidate Profile Inspector Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Candidate Ranking Table */}
        <div className="xl:col-span-8 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Candidate Ranking – {selectedJob?.title || 'Select a Job'}
              </h2>
              {selectedJob && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Job: {selectedJob.title} &nbsp;|&nbsp; Required Skills:{' '}
                  {selectedJob.requiredSkills.slice(0, 4).join(', ')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  const j = jobs.find((x) => x.id === e.target.value);
                  if (j) void runCandidateRanking(j);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-semibold"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.companyName})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isRankingCandidates || !selectedJob}
                onClick={() => selectedJob && void runCandidateRanking(selectedJob)}
                className="px-3 py-1.5 rounded-xl bg-[#6425E8] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRankingCandidates ? 'animate-spin' : ''}`} />
                AI Rank
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-xs sm:text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'All' | 'Best Match' | 'Shortlisted' | 'In Review')
              }
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-semibold"
            >
              <option value="All">All Candidates</option>
              <option value="Best Match">Best Match (85%+)</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="In Review">In Review</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs font-semibold"
            >
              <option value="score">Sort by: Match Score</option>
              <option value="name">Sort by: Name</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-2">Rank</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Key Skills</th>
                  <th className="py-2.5 px-3">Match Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredCandidates.map((cand, idx) => {
                  const isSelected = activeCandidate?.candidateId === cand.candidateId;
                  const isShortlisted = cand.applicationStatus === 'Shortlisted';
                  return (
                    <tr
                      key={cand.candidateId}
                      onClick={() => setSelectedCandidateId(cand.candidateId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-3 px-2 font-bold tabular-nums">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700'
                              : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={cand.photoURL || AVATAR_CANDIDATE_1}
                            alt={cand.candidateName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {cand.candidateName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {cand.education}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {cand.matchedSkills.slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            >
                              {sk} ✓
                            </span>
                          ))}
                          {cand.matchedSkills.length > 3 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              +{cand.matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-20">
                          <div className="font-bold text-slate-900 dark:text-white text-xs tabular-nums">
                            {cand.matchScore}%
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${cand.matchScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                            isShortlisted
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {cand.applicationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(cand.candidateId);
                            }}
                            aria-label="Inspect candidate"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedJob) {
                                void toggleShortlistCandidate(
                                  cand.candidateId,
                                  selectedJob.id,
                                  cand.matchScore
                                );
                              }
                            }}
                            aria-label="Shortlist candidate"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isShortlisted
                                ? 'bg-indigo-50 border-[#6425E8] text-[#6425E8]'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#6425E8]'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Candidate Profile Inspector */}
        <div className="xl:col-span-4 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#6425E8]" />
            Candidate Profile
          </h2>

          {activeCandidate ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={activeCandidate.photoURL || AVATAR_CANDIDATE_1}
                    alt={activeCandidate.candidateName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white truncate">
                      {activeCandidate.candidateName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {activeCandidate.education}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {activeCandidate.location}
                    </p>
                    {activeCandidate.email && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" /> {activeCandidate.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-center shrink-0">
                  <div className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums leading-none">
                    {activeCandidate.matchScore}%
                  </div>
                  <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Match Score
                  </div>
                </div>
              </div>

              {/* Inspector Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
                {(['overview', 'skills', 'resume', 'remarks'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInspectorTab(t)}
                    className={`px-3 py-2 capitalize border-b-2 transition-colors ${
                      inspectorTab === t
                        ? 'border-[#6425E8] text-[#6425E8] dark:text-[#A78BFA]'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t === 'skills' ? 'Skills Match' : t}
                  </button>
                ))}
              </div>

              {inspectorTab === 'overview' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1.5">
                        Matched Skills ({activeCandidate.matchedSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeCandidate.matchedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded bg-white dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          >
                            {sk} ✓
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                      <div className="font-semibold text-red-800 dark:text-red-200 mb-1.5">
                        Missing Skills
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeCandidate.missingSkills.length > 0 ? (
                          activeCandidate.missingSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded bg-white dark:bg-red-950 text-red-600 dark:text-red-300"
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-emerald-600">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836] space-y-2">
                    <div className="flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-[#6425E8] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Education</div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {activeCandidate.education}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-[#6425E8] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Experience</div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {activeCandidate.profile?.experience?.[0]
                            ? `${activeCandidate.profile.experience[0].title} – ${activeCandidate.profile.experience[0].company} (${activeCandidate.profile.experience[0].duration})`
                            : 'Fresher / Academic Projects'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                      <Award className="w-4 h-4 text-[#6425E8]" /> Key Highlights
                    </div>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      {activeCandidate.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {inspectorTab === 'skills' && (
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Skills Match', val: activeCandidate.skillsMatch },
                    { label: 'Education Match', val: activeCandidate.educationMatch },
                    { label: 'Experience Match', val: activeCandidate.experienceMatch },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>{m.label}</span>
                        <span className="tabular-nums">{m.val}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[#6425E8] rounded-full"
                          style={{ width: `${m.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-slate-600 dark:text-slate-300 pt-2">
                    <strong className="font-semibold">AI Recommendation:</strong>{' '}
                    {activeCandidate.recommendation}
                  </p>
                </div>
              )}

              {inspectorTab === 'resume' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                    <div className="font-semibold text-slate-900 dark:text-white mb-1">Projects</div>
                    {activeCandidate.profile?.projects?.length ? (
                      activeCandidate.profile.projects.map((p, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-slate-500 dark:text-slate-400">{p.description}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">No projects listed.</p>
                    )}
                  </div>
                </div>
              )}

              {inspectorTab === 'remarks' && (
                <div className="space-y-3 text-xs">
                  {activeCandidate.applicationId ? (
                    <>
                      <div>
                        <label className="font-semibold block mb-1">Change Status</label>
                        <select
                          value={activeCandidate.applicationStatus}
                          onChange={(e) =>
                            void updateCandidateApplicationStatus(
                              activeCandidate.applicationId!,
                              e.target.value as ApplicationStatus,
                              remarksDraft || activeCandidate.remarks
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
                        >
                          {([
                            'Applied',
                            'Under Review',
                            'Shortlisted',
                            'Interview Scheduled',
                            'Selected',
                            'Rejected',
                          ] as ApplicationStatus[]).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Recruiter Remarks</label>
                        <textarea
                          rows={3}
                          placeholder="Add interview notes or feedback..."
                          value={remarksDraft || activeCandidate.remarks || ''}
                          onChange={(e) => setRemarksDraft(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void updateCandidateApplicationStatus(
                            activeCandidate.applicationId!,
                            (activeCandidate.applicationStatus === 'Not Applied'
                              ? 'Under Review'
                              : activeCandidate.applicationStatus) as ApplicationStatus,
                            remarksDraft
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#6425E8] text-white font-semibold"
                      >
                        Save Remarks
                      </button>
                    </>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">
                      This candidate was discovered from the talent pool. Shortlist them to track notes.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    selectedJob &&
                    void toggleShortlistCandidate(
                      activeCandidate.candidateId,
                      selectedJob.id,
                      activeCandidate.matchScore
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {activeCandidate.applicationStatus === 'Shortlisted'
                    ? 'Shortlisted'
                    : 'Shortlist Candidate'}
                </button>
                <button
                  type="button"
                  onClick={() => setFullResumeModal(activeCandidate)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Full Resume
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">
              Select a candidate from the ranking table to inspect their profile.
            </p>
          )}
        </div>
      </div>

      {/* Full Resume Modal */}
      {fullResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {fullResumeModal.candidateName} — Resume Preview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {fullResumeModal.education} · {fullResumeModal.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFullResumeModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Technical Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(fullResumeModal.profile?.technicalSkills || fullResumeModal.matchedSkills).map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Certifications</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {fullResumeModal.profile?.certifications?.join(', ') || 'None listed'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Projects &amp; Experience</h4>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {fullResumeModal.profile?.experience?.map((e, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {e.title} at {e.company} ({e.duration})
                      </div>
                    </div>
                  ))}
                  {fullResumeModal.profile?.projects?.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836]">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                      <div>{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `${fullResumeModal.candidateName}\n${fullResumeModal.education}\nSkills: ${(
                    fullResumeModal.profile?.technicalSkills || fullResumeModal.matchedSkills
                  ).join(', ')}`;
                  downloadResumeFile(`${fullResumeModal.candidateName.replace(/\s+/g, '_')}_Resume.txt`, summaryText);
                }}
                className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
