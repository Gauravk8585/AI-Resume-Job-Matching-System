import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Layers,
  Lightbulb,
  Mail,
  MapPin,
  Pencil,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AVATAR_CANDIDATE_1 } from '../../data/sampleData';
import { CircularProgress } from '../../components/common/CircularProgress';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import { downloadResumeFile, formatFileSize } from '../../utils/resumeParser';

export const CandidateDashboard: React.FC = () => {
  const {
    userAccount,
    candidateProfile,
    resumes,
    activeResumeId,
    jobs,
    jobMatches,
    skillGap,
    applications,
    setCandidatePage,
    reanalyzeResume,
    isAnalyzingResume,
    applyToJob,
  } = useApp();

  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];
  const sortedMatches = [...jobMatches].sort((a, b) => b.overallScore - a.overallScore);
  const topMatch = sortedMatches[0];
  const bestMatchScore = topMatch?.overallScore ?? 0;
  const extractedSkills =
    candidateProfile?.technicalSkills?.length
      ? candidateProfile.technicalSkills
      : activeResume?.parsedData.skills.technicalSkills || [];

  const recommendedItems = sortedMatches.slice(0, 3).map((m) => ({
    match: m,
    job: jobs.find((j) => j.id === m.jobId),
  })).filter((x) => Boolean(x.job));

  const missingSkillNames =
    skillGap?.missingSkills.map((s) => s.skill) || topMatch?.missingSkills || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Candidate Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Welcome back, {candidateProfile?.fullName?.split(' ')[0] || userAccount?.displayName || 'Candidate'}! Here&apos;s your job matching overview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCandidatePage('upload-resume')}
          className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
        >
          Upload New Resume
        </button>
      </div>

      {/* Top Row: Profile Summary + 4 KPI Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Profile Summary Card */}
        <div className="xl:col-span-5 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={candidateProfile?.photoURL || userAccount?.photoURL || AVATAR_CANDIDATE_1}
                  alt={candidateProfile?.fullName || 'Candidate'}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900"
                />
                <button
                  type="button"
                  onClick={() => setCandidatePage('profile')}
                  aria-label="Edit profile photo"
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#231D42] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#6425E8] dark:text-[#A78BFA] shadow-xs"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate">
                  {candidateProfile?.fullName || userAccount?.displayName}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                  {candidateProfile?.education || 'Education not added'}
                  {candidateProfile?.university ? ` · ${candidateProfile.university}` : ''}
                </p>
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#6425E8] dark:text-[#A78BFA]" />
                    <span>{candidateProfile?.location || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-[#6425E8] dark:text-[#A78BFA]" />
                    <span>{candidateProfile?.email || userAccount?.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCandidatePage('profile')}
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
            >
              Edit Profile
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-[#4B3F72] dark:text-indigo-200 bg-[#F5F5FF] dark:bg-[#1E1938] px-3.5 py-2 rounded-xl truncate">
            {candidateProfile?.headline || 'Add your target role headline in My Profile'}
          </div>
        </div>

        {/* 4 KPI Stat Cards */}
        <div className="xl:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Resume Uploaded',
              value: resumes.length,
              icon: <FileText className="w-5 h-5 text-[#6425E8]" />,
              bg: 'bg-indigo-50 dark:bg-indigo-950/50',
              onClick: () => setCandidatePage('my-resume'),
            },
            {
              label: 'Matched Jobs',
              value: jobMatches.length,
              icon: <Briefcase className="w-5 h-5 text-blue-600" />,
              bg: 'bg-blue-50 dark:bg-blue-950/50',
              onClick: () => setCandidatePage('job-matches'),
            },
            {
              label: 'Best Match Score',
              value: `${bestMatchScore}%`,
              icon: <Star className="w-5 h-5 text-amber-500" />,
              bg: 'bg-amber-50 dark:bg-amber-950/50',
              onClick: () => setCandidatePage('job-matches'),
            },
            {
              label: 'Applications',
              value: applications.length,
              icon: <BarChart2 className="w-5 h-5 text-emerald-600" />,
              bg: 'bg-emerald-50 dark:bg-emerald-950/50',
              onClick: () => setCandidatePage('applications'),
            },
          ].map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left flex flex-col justify-between"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className="mt-4">
                <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {stat.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left & Middle 7 Columns */}
        <div className="xl:col-span-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* My Resume Card */}
            <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  My Resume
                </h2>
              </div>

              {activeResume ? (
                <>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E1938] border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {activeResume.fileName.toLowerCase().endsWith('.docx') ? 'DOC' : 'PDF'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {activeResume.fileName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {activeResume.uploadedDateLabel || 'Recently uploaded'} · {formatFileSize(activeResume.fileSize)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {activeResume.status === 'analyzed' ? 'Analyzed' : activeResume.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCandidatePage('my-resume')}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadResumeFile(
                          activeResume.fileName,
                          activeResume.rawText,
                          activeResume.fileDataUrl
                        )
                      }
                      className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      disabled={isAnalyzingResume}
                      onClick={() => void reanalyzeResume(activeResume.id)}
                      className="py-2 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingResume ? 'animate-spin' : ''}`} />
                      Re-analyze
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    No resume uploaded yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCandidatePage('upload-resume')}
                    className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>

            {/* Matching Result Card */}
            <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Matching Result
                </h2>
              </div>

              <div className="flex items-center gap-5">
                <CircularProgress value={bestMatchScore} size={116} label="Match Score" />
                <div className="flex-1 space-y-2 text-xs">
                  {[
                    { label: 'Skills Match', val: topMatch?.skillsMatch ?? 0 },
                    { label: 'Qualification Match', val: topMatch?.educationMatch ?? 0 },
                    { label: 'Experience Match', val: topMatch?.experienceMatch ?? 0 },
                    { label: 'Overall Fit', val: bestMatchScore },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {row.label}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {row.val}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Extracted Skills & Skill Gap Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Extracted Skills */}
            <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Extracted Skills
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCandidatePage('my-resume')}
                  className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                >
                  View All
                </button>
              </div>
              {extractedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.slice(0, 12).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload a resume to extract your verified skills automatically.
                </p>
              )}
            </div>

            {/* Skill Gap Analysis Summary */}
            <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
                    <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Skill Gap Analysis
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCandidatePage('skill-gap')}
                    className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                  >
                    Open Plan
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Skills to improve for better job matches:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {missingSkillNames.length > 0 ? (
                    missingSkillNames.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/50"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">
                      No critical skill gaps detected for your top role!
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-slate-700 dark:text-amber-100">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold">Recommendation:</strong> Learn these skills to increase your match score up to{' '}
                  <strong className="tabular-nums">{skillGap?.potentialScoreAfterLearning ?? 96}%</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Recommended Jobs for You */}
        <div className="xl:col-span-5 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Recommended Jobs for You
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCandidatePage('job-matches')}
              className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {recommendedItems.length > 0 ? (
              recommendedItems.map(({ match, job }) => {
                if (!job) return null;
                const applied = applications.some((a) => a.jobId === job.id);
                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#1D1836] hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <CompanyLogo company={job.companyName} />
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                            {job.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {job.companyName} ({job.location})
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.requiredSkills.slice(0, 3).map((sk) => (
                              <span
                                key={sk}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {match.overallScore}% Match
                        </span>
                        <button
                          type="button"
                          disabled={applied}
                          onClick={() => void applyToJob(job)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
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
              })
            ) : (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Upload a resume and run AI Job Matching to see personalized recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
