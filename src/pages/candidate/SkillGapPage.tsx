import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  Info,
  Lightbulb,
  Play,
  RefreshCw,
  Target,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { CircularProgress } from '../../components/common/CircularProgress';
import type { MissingSkillPlan } from '../../types';

export const SkillGapPage: React.FC = () => {
  const { jobs, skillGap, runSkillGapAnalysis, isAnalyzingSkillGap, aiError } = useApp();
  const [selectedJobId, setSelectedJobId] = useState<string>(skillGap?.jobId || jobs[0]?.id || '');
  const [learningPlanModal, setLearningPlanModal] = useState<MissingSkillPlan | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const publishedJobs = jobs.filter((j) => j.status === 'published');

  const chartData = [
    ...(skillGap?.matchedSkills.slice(0, 4) || []),
    ...(skillGap?.missingSkills || []),
  ].map((item) => ({
    name: item.skill,
    yourLevel: item.candidateLevel,
    requiredLevel: item.requiredLevel,
  }));

  return (
    <div className="space-y-6">
      {/* Header + Target Job Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Skill Gap Analysis
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Compare your current skills with job requirements and find what to improve.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              void runSkillGapAnalysis(e.target.value);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs sm:text-sm font-semibold text-slate-800 dark:text-white"
          >
            {publishedJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} — {j.companyName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isAnalyzingSkillGap || !selectedJobId}
            onClick={() => void runSkillGapAnalysis(selectedJobId)}
            className="px-4 py-2 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzingSkillGap ? 'animate-spin' : ''}`} />
            {isAnalyzingSkillGap ? 'Analyzing...' : 'Analyze Gap'}
          </button>
        </div>
      </div>

      {aiError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button
            type="button"
            onClick={() => void runSkillGapAnalysis(selectedJobId)}
            className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {skillGap ? (
        <>
          {/* Top Row: Overall Evaluation + AI Insight */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-center gap-6">
              <CircularProgress
                value={skillGap.overallMatchScore}
                size={134}
                strokeWidth={12}
                label="Job Match"
              />
              <div className="flex-1 w-full">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
                  Overall Evaluation
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Matched Skills
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {skillGap.matchedSkills.length} /{' '}
                      {skillGap.matchedSkills.length + skillGap.missingSkills.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Missing Skills
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {skillGap.missingSkills.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Readiness Level
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {skillGap.readinessLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-[#F4F1FF] to-[#ECE7FF] dark:from-[#1E183C] dark:to-[#181330] rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 font-display font-bold text-base text-slate-900 dark:text-white mb-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                AI Insight
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {skillGap.aiInsight}
              </p>
            </div>
          </div>

          {/* Middle Row: Matched Skills + Missing Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Matched Skills ({skillGap.matchedSkills.length})
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {skillGap.matchedSkills.map((item) => (
                  <span
                    key={item.skill}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {item.skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Missing Skills / Skill Gaps ({skillGap.missingSkills.length})
                </h2>
                {skillGap.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {skillGap.missingSkills.map((item) => (
                      <span
                        key={item.skill}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {item.skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">
                    No missing skills detected for this role.
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5FF] dark:bg-[#1D1836] border border-indigo-100 dark:border-slate-800 flex items-start gap-2.5 text-xs">
                <Info className="w-4 h-4 text-[#6425E8] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Why These Skills?</div>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    These skills are required in the job description but are not found or are at a beginner level in your resume.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Skill Comparison + Improvement Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Skill Comparison Horizontal Progress Bars + Recharts */}
            <div className="lg:col-span-7 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#6425E8]" />
                  Skill Comparison
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#6425E8]" /> Your Level
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" /> Required Level
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {chartData.map((row) => (
                  <div key={row.name} className="grid grid-cols-12 items-center gap-3 text-xs sm:text-sm">
                    <div className="col-span-4 sm:col-span-3 font-medium text-slate-700 dark:text-slate-200 truncate">
                      {row.name}
                    </div>
                    <div className="col-span-6 sm:col-span-7 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-200 dark:bg-slate-700 absolute left-0 top-0"
                        style={{ width: `${Math.min(100, row.requiredLevel * 10)}%` }}
                      />
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8055F5] to-[#6425E8] relative z-10 transition-all duration-500"
                        style={{ width: `${Math.min(100, row.yourLevel * 10)}%` }}
                      />
                    </div>
                    <div className="col-span-2 text-right font-semibold text-slate-800 dark:text-white tabular-nums">
                      {row.yourLevel} / 10
                    </div>
                  </div>
                ))}
              </div>

              {/* Recharts Visualization */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="yourLevel" name="Your Level" fill="#6425E8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="requiredLevel" name="Required Level" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Improvement Plan */}
            <div className="lg:col-span-5 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#6425E8]" />
                Improvement Plan
              </h2>

              <div className="space-y-3">
                {skillGap.missingSkills.map((item) => (
                  <div
                    key={item.skill}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        Learn {item.skill}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {item.whyImportant}
                      </p>
                      <div className="text-[11px] font-medium text-[#6425E8] dark:text-[#A78BFA] mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Est. {item.estimatedHours}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLearningPlanModal(item)}
                      className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#16122B] text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Learning
                    </button>
                  </div>
                ))}

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        Suggested Resources
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Courses, tutorials, and practice projects
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResourcesOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#16122B] text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-50 shrink-0"
                  >
                    View Resources
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
          Select a target job above to generate your personalized skill gap roadmap.
        </div>
      )}

      {/* Learning Roadmap Modal */}
      {learningPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Learning Roadmap: {learningPlanModal.skill}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estimated time: {learningPlanModal.estimatedHours} · Target proficiency:{' '}
                  {learningPlanModal.requiredLevel}/10
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLearningPlanModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 text-xs text-slate-700 dark:text-slate-200">
              <strong className="font-semibold">Why it matters:</strong> {learningPlanModal.whyImportant}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Step-by-Step Roadmap
              </h4>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {learningPlanModal.roadmapSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#6425E8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Recommended Resources
              </h4>
              <div className="space-y-2">
                {learningPlanModal.suggestedResources.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{res.title}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {res.provider} · {res.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Suggested Resources Modal */}
      {resourcesOpen && skillGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Curated Learning Resources
              </h3>
              <button
                type="button"
                onClick={() => setResourcesOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {skillGap.missingSkills.flatMap((m) =>
                m.suggestedResources.map((r, i) => (
                  <div
                    key={`${m.skill}-${i}`}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836]"
                  >
                    <div className="text-xs font-bold text-[#6425E8] dark:text-[#A78BFA]">
                      {m.skill}
                    </div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                      {r.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {r.provider} · {r.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
