import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Download,
  Eye,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AVATAR_CANDIDATE_1 } from '../../data/sampleData';
import type { ApplicationStatus, RankedCandidateResult } from '../../types';
import { downloadResumeFile } from '../../utils/resumeParser';

export const CandidatesPage: React.FC<{ mode?: 'all' | 'shortlisted' }> = ({ mode = 'all' }) => {
  const {
    jobs,
    rankedCandidates,
    isRankingCandidates,
    runCandidateRanking,
    toggleShortlistCandidate,
    updateCandidateApplicationStatus,
  } = useApp();

  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'best' | 'shortlisted' | 'review'>(
    mode === 'shortlisted' ? 'shortlisted' : 'all'
  );
  const [modalCand, setModalCand] = useState<RankedCandidateResult | null>(null);
  const [remarksInput, setRemarksInput] = useState('');

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rankedCandidates.filter((c) => {
      if (mode === 'shortlisted' && c.applicationStatus !== 'Shortlisted') return false;
      if (filterMode === 'shortlisted' && c.applicationStatus !== 'Shortlisted') return false;
      if (filterMode === 'best' && c.matchScore < 85) return false;
      if (
        filterMode === 'review' &&
        !['Under Review', 'Applied'].includes(c.applicationStatus)
      ) {
        return false;
      }
      if (
        q &&
        !c.candidateName.toLowerCase().includes(q) &&
        !c.matchedSkills.some((s) => s.toLowerCase().includes(q)) &&
        !c.location.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [rankedCandidates, mode, filterMode, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {mode === 'shortlisted' ? 'Shortlisted Candidates' : 'Candidates & AI Ranking'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {mode === 'shortlisted'
              ? 'Review shortlisted top talent, update interview statuses, and add hiring remarks.'
              : 'Compare candidate profiles against job requirements using explainable AI scoring.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedJob?.id || ''}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              const j = jobs.find((x) => x.id === e.target.value);
              if (j) void runCandidateRanking(j);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs font-semibold"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} — {j.companyName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isRankingCandidates || !selectedJob}
            onClick={() => selectedJob && void runCandidateRanking(selectedJob)}
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRankingCandidates ? 'animate-spin' : ''}`} />
            Run AI Ranking
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates by name, location, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1D1836] text-sm"
          />
        </div>

        {mode === 'all' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: 'All Candidates' },
                { id: 'best', label: 'Best Match' },
                { id: 'shortlisted', label: 'Shortlisted' },
                { id: 'review', label: 'In Review' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterMode === tab.id
                    ? 'bg-white dark:bg-[#16122B] text-[#6425E8] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="font-display font-bold text-slate-900 dark:text-white">
            No candidates in this view
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your filters or shortlist candidates from the Recruiter Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {list.map((c) => {
            const isShort = c.applicationStatus === 'Shortlisted';
            return (
              <div
                key={c.candidateId}
                className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={c.photoURL || AVATAR_CANDIDATE_1}
                        alt={c.candidateName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white truncate">
                          {c.candidateName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {c.education}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3" /> {c.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0">
                      {c.matchScore}% Match
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                    {c.recommendation}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.matchedSkills.slice(0, 5).map((sk) => (
                      <span
                        key={sk}
                        className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      >
                        {sk} ✓
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {c.applicationStatus}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalCand(c);
                        setRemarksInput(c.remarks || '');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        selectedJob &&
                        void toggleShortlistCandidate(c.candidateId, selectedJob.id, c.matchScore)
                      }
                      className={`p-2 rounded-xl border transition-colors ${
                        isShort
                          ? 'bg-indigo-50 border-[#6425E8] text-[#6425E8]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#6425E8]'
                      }`}
                      aria-label="Toggle shortlist"
                    >
                      <Bookmark className={`w-4 h-4 ${isShort ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Full Profile Modal */}
      {modalCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-start gap-3.5">
                <img
                  src={modalCand.photoURL || AVATAR_CANDIDATE_1}
                  alt={modalCand.candidateName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {modalCand.candidateName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {modalCand.education} · {modalCand.location}
                  </p>
                  {modalCand.email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" /> {modalCand.email}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCand(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
                <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                  Matched Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {modalCand.matchedSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-white dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/30">
                <div className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Missing Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {modalCand.missingSkills.length > 0 ? (
                    modalCand.missingSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-white dark:bg-red-950 text-red-600 dark:text-red-300">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-emerald-600">None</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">AI Recommendations</div>
              <p className="text-slate-600 dark:text-slate-300">{modalCand.recommendation}</p>
            </div>

            {modalCand.applicationId && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Application Status</label>
                    <select
                      value={modalCand.applicationStatus}
                      onChange={(e) => {
                        const next = e.target.value as ApplicationStatus;
                        setModalCand({ ...modalCand, applicationStatus: next });
                        void updateCandidateApplicationStatus(modalCand.applicationId!, next, remarksInput);
                      }}
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
                    <label className="font-semibold block mb-1">Remarks</label>
                    <input
                      type="text"
                      placeholder="Interview notes..."
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void updateCandidateApplicationStatus(
                      modalCand.applicationId!,
                      (modalCand.applicationStatus === 'Not Applied'
                        ? 'Under Review'
                        : modalCand.applicationStatus) as ApplicationStatus,
                      remarksInput
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#6425E8] text-white font-semibold"
                >
                  Save Remarks
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  downloadResumeFile(
                    `${modalCand.candidateName.replace(/\s+/g, '_')}_Resume.txt`,
                    `${modalCand.candidateName}\n${modalCand.education}\nSkills: ${modalCand.matchedSkills.join(', ')}`
                  )
                }
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedJob) {
                    void toggleShortlistCandidate(
                      modalCand.candidateId,
                      selectedJob.id,
                      modalCand.matchScore
                    );
                  }
                  setModalCand(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
              >
                {modalCand.applicationStatus === 'Shortlisted' ? 'Remove Shortlist' : 'Shortlist Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
