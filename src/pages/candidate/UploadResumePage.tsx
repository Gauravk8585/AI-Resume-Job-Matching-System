import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Tag,
  Trash2,
  UploadCloud,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CircularProgress } from '../../components/common/CircularProgress';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import {
  downloadResumeFile,
  formatFileSize,
  validateResumeFile,
} from '../../utils/resumeParser';

type AnalysisTab = 'overview' | 'extracted' | 'skills' | 'experience' | 'education' | 'raw';

export const UploadResumePage: React.FC<{ mode?: 'upload' | 'manage' }> = ({ mode = 'upload' }) => {
  const {
    resumes,
    activeResumeId,
    setActiveResumeId,
    uploadAndAnalyzeResume,
    reanalyzeResume,
    deleteResume,
    isAnalyzingResume,
    aiError,
    clearAiError,
    jobMatches,
    jobs,
    setCandidatePage,
    requestConfirm,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0] || null;
  const topMatch = [...jobMatches].sort((a, b) => b.overallScore - a.overallScore)[0];

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLocalError(null);
    clearAiError();

    const file = fileList[0];
    const validationErr = validateResumeFile(file);
    if (validationErr) {
      setLocalError(validationErr);
      return;
    }

    setLastFile(file);
    await uploadAndAnalyzeResume(file);
  };

  const allSkills = activeResume
    ? Array.from(
        new Set([
          ...(activeResume.parsedData.skills.programmingLanguages || []),
          ...(activeResume.parsedData.skills.frameworks || []),
          ...(activeResume.parsedData.skills.technicalSkills || []),
          ...(activeResume.parsedData.skills.tools || []),
        ])
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {mode === 'manage' ? 'My Resumes & AI Analysis' : 'Upload Resume & Get AI Analysis'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Upload your resume in PDF or DOCX format. Our AI will extract your information, analyze your skills and provide personalized job recommendations.
        </p>
      </div>

      {/* Upload Zone + Quick Options */}
      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`lg:col-span-8 rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-colors ${
            dragOver
              ? 'border-[#6425E8] bg-indigo-50/70 dark:bg-indigo-950/40'
              : 'border-indigo-200 dark:border-slate-700 bg-[#F8F8FF] dark:bg-[#1D1836]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="font-display font-semibold text-base text-slate-900 dark:text-white">
            {isAnalyzingResume ? 'Extracting & Analyzing Resume with AI...' : 'Drag & drop your resume here'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 my-1.5">or</p>
          <button
            type="button"
            disabled={isAnalyzingResume}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            {isAnalyzingResume ? 'Analyzing...' : 'Choose File'}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Supported formats: PDF, DOCX &nbsp;|&nbsp; Max size: 10MB
          </p>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#1D1836] p-5 flex flex-col justify-between space-y-3">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Quick Options
          </h2>
          <button
            type="button"
            disabled={isAnalyzingResume}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 rounded-xl bg-white dark:bg-[#16122B] border border-slate-200 dark:border-slate-700 hover:border-[#6425E8] flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Upload PDF</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Most common format</div>
            </div>
          </button>

          <button
            type="button"
            disabled={isAnalyzingResume}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 rounded-xl bg-white dark:bg-[#16122B] border border-slate-200 dark:border-slate-700 hover:border-[#6425E8] flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Upload DOCX</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Microsoft Word format</div>
            </div>
          </button>

          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#6425E8] dark:text-[#A78BFA] shrink-0 mt-0.5" />
            <span>You can upload multiple resumes and switch between them for comparison.</span>
          </div>
        </div>
      </div>

      {/* Error / Retry Alert */}
      {(localError || aiError) && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                Resume Processing Error
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{localError || aiError}</p>
            </div>
          </div>
          {lastFile && (
            <button
              type="button"
              onClick={() => void uploadAndAnalyzeResume(lastFile)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              Retry Analysis
            </button>
          )}
        </div>
      )}

      {/* Multiple Resume Switcher */}
      {resumes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Uploaded Resumes ({resumes.length}):
          </span>
          {resumes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveResumeId(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                activeResume?.id === r.id
                  ? 'bg-[#6425E8] text-white border-[#6425E8]'
                  : 'bg-white dark:bg-[#16122B] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#6425E8]'
              }`}
            >
              {r.fileName}
            </button>
          ))}
        </div>
      )}

      {/* Main Analysis Workspace */}
      {activeResume ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left 8 Columns: Resume Analysis Tabs */}
          <div className="xl:col-span-8 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            {/* Resume Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-bold text-base text-slate-900 dark:text-white truncate">
                      {activeResume.fileName}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {activeResume.status === 'analyzed' ? 'Analysis Completed' : activeResume.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Uploaded on {activeResume.uploadedDateLabel || 'Today'} · {formatFileSize(activeResume.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadResumeFile(
                      activeResume.fileName,
                      activeResume.rawText,
                      activeResume.fileDataUrl
                    )
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  disabled={isAnalyzingResume}
                  onClick={() => void reanalyzeResume(activeResume.id)}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingResume ? 'animate-spin' : ''}`} />
                  Re-analyze
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestConfirm({
                      title: 'Delete Resume',
                      message: `Are you sure you want to delete "${activeResume.fileName}"?`,
                      confirmLabel: 'Delete',
                      danger: true,
                      onConfirm: () => void deleteResume(activeResume.id),
                    })
                  }
                  aria-label="Delete resume"
                  className="p-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6 Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800 mt-3 mb-5">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'extracted', label: 'Extracted Information' },
                  { id: 'skills', label: 'Skills' },
                  { id: 'experience', label: 'Experience' },
                  { id: 'education', label: 'Education' },
                  { id: 'raw', label: 'Raw Text' },
                ] as { id: AnalysisTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#6425E8] text-[#6425E8] dark:text-[#A78BFA]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2.5">
                      <FileText className="w-4 h-4 text-[#6425E8]" />
                      Resume Summary
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeResume.summary || activeResume.parsedData.summary || 'No summary generated.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-700/70 text-xs">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#6425E8] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Total Experience</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {activeResume.parsedData.totalExperienceText || 'Not Mentioned'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#6425E8] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Current Location</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {activeResume.parsedData.location || 'Not Mentioned'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Wallet className="w-4 h-4 text-[#6425E8] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Expected Salary</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {activeResume.parsedData.expectedSalary || 'Not Mentioned'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#6425E8] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Notice Period</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {activeResume.parsedData.noticePeriod || 'Not Mentioned'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]">
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-[#6425E8]" />
                      Key Skills ({allSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {allSkills.slice(0, 14).map((sk) => (
                        <span
                          key={sk}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]">
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
                      Match Readiness
                    </h3>
                    <div className="flex items-center gap-4">
                      <CircularProgress
                        value={topMatch?.overallScore ?? 78}
                        size={104}
                        strokeWidth={9}
                        label="Overall Match"
                      />
                      <div className="flex-1 space-y-1.5 text-xs">
                        {[
                          { label: 'Skills Match', val: topMatch?.skillsMatch ?? 85, color: 'text-emerald-600' },
                          { label: 'Experience Match', val: topMatch?.experienceMatch ?? 70, color: 'text-indigo-600' },
                          { label: 'Education Match', val: topMatch?.educationMatch ?? 80, color: 'text-blue-600' },
                          { label: 'Location Match', val: topMatch?.locationMatch ?? 75, color: 'text-amber-600' },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                            <span className={`font-semibold tabular-nums ${row.color}`}>
                              {row.val}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'extracted' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Candidate Name', val: activeResume.parsedData.candidateName },
                  { label: 'Email', val: activeResume.parsedData.email },
                  { label: 'Phone Number', val: activeResume.parsedData.phone },
                  { label: 'Location', val: activeResume.parsedData.location },
                  { label: 'Headline', val: activeResume.parsedData.headline },
                  { label: 'Total Experience', val: activeResume.parsedData.totalExperienceText },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {item.val || 'Not mentioned in document'}
                    </div>
                  </div>
                ))}
                {activeResume.parsedData.certifications.length > 0 && (
                  <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      Certifications &amp; Achievements
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      {[...activeResume.parsedData.certifications, ...activeResume.parsedData.achievements].map(
                        (c, i) => (
                          <li key={i}>{c}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4">
                {[
                  { title: 'Programming Languages', list: activeResume.parsedData.skills.programmingLanguages },
                  { title: 'Frameworks & Libraries', list: activeResume.parsedData.skills.frameworks },
                  { title: 'Technical & Domain Skills', list: activeResume.parsedData.skills.technicalSkills },
                  { title: 'Tools & Platforms', list: activeResume.parsedData.skills.tools },
                  { title: 'Soft Skills', list: activeResume.parsedData.skills.softSkills },
                ].map((group) => (
                  <div
                    key={group.title}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                      {group.title}
                    </h3>
                    {group.list && group.list.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {group.list.map((s) => (
                          <span
                            key={s}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">None detected in resume.</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2.5">
                    Work Experience &amp; Internships
                  </h3>
                  {activeResume.parsedData.experience.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No professional experience or internships listed in this resume.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeResume.parsedData.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]"
                        >
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {exp.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {exp.company} · {exp.duration} · {exp.type}
                          </div>
                          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                            {exp.highlights?.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2.5">
                    Projects
                  </h3>
                  {activeResume.parsedData.projects.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No projects listed in this resume.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeResume.parsedData.projects.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]"
                        >
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {p.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.technologies?.map((t) => (
                              <span
                                key={t}
                                className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-3">
                {activeResume.parsedData.education.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No education entries extracted.
                  </p>
                ) : (
                  activeResume.parsedData.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]"
                    >
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {edu.degree}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {edu.institution} {edu.year ? `· ${edu.year}` : ''}
                      </div>
                      {edu.details && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{edu.details}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'raw' && (
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-96 leading-relaxed">
                {activeResume.rawText}
              </pre>
            )}
          </div>

          {/* Right 4 Columns: Extracted Information Summary Rail */}
          <div className="xl:col-span-4 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Extracted Information
              </h2>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white mb-0.5">Education</div>
                  {activeResume.parsedData.education.length > 0 ? (
                    activeResume.parsedData.education.map((e, idx) => (
                      <p key={idx} className="text-slate-600 dark:text-slate-300">
                        {e.degree} {e.institution ? `– ${e.institution}` : ''} {e.year ? `(${e.year})` : ''}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-400">Not specified</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white mb-0.5">Experience</div>
                  {activeResume.parsedData.experience.length > 0 ? (
                    activeResume.parsedData.experience.map((ex, idx) => (
                      <p key={idx} className="text-slate-600 dark:text-slate-300">
                        {ex.title} at {ex.company} ({ex.duration})
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300">
                      {activeResume.parsedData.totalExperienceText || 'Fresher / Entry Level'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white mb-0.5">Skills</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {allSkills.slice(0, 10).join(', ')}
                    {allSkills.length > 10 ? ` (+${allSkills.length - 10} more)` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Resume processed successfully!
                </div>
                <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                  You can now view matching jobs and skill gap analysis.
                </p>
                <div className="flex items-center gap-3 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setCandidatePage('job-matches')}
                    className="font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
                  >
                    View Job Matches
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidatePage('skill-gap')}
                    className="font-semibold text-emerald-800 dark:text-emerald-200 hover:underline"
                  >
                    Skill Gap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Upload a PDF or DOCX resume above to start AI extraction and matching.
          </p>
        </div>
      )}

      {/* Bottom Recommended Jobs Strip */}
      {jobs.length > 0 && (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#6425E8]" />
              Recommended Jobs for You
            </h2>
            <button
              type="button"
              onClick={() => setCandidatePage('job-matches')}
              className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.slice(0, 3).map((job) => {
              const m = jobMatches.find((x) => x.jobId === job.id);
              return (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo company={job.companyName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {job.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {job.companyName} · {job.location}
                      </div>
                    </div>
                  </div>
                  {m && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg tabular-nums shrink-0">
                      {m.overallScore}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
