import React, { useEffect, useState } from 'react';
import { Save, Send, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analyzeJobDescriptionWithAi } from '../../services/aiService';
import type { JobPosting } from '../../types';

export const PostJobPage: React.FC = () => {
  const {
    recruiterProfile,
    userAccount,
    editingJob,
    setEditingJob,
    createOrUpdateJob,
    setRecruiterPage,
    addToast,
  } = useApp();

  const [title, setTitle] = useState(editingJob?.title || '');
  const [companyName, setCompanyName] = useState(
    editingJob?.companyName || recruiterProfile?.companyName || userAccount?.companyName || ''
  );
  const [description, setDescription] = useState(editingJob?.description || '');
  const [requiredSkillsStr, setRequiredSkillsStr] = useState(
    editingJob?.requiredSkills.join(', ') || ''
  );
  const [preferredSkillsStr, setPreferredSkillsStr] = useState(
    editingJob?.preferredSkills.join(', ') || ''
  );
  const [educationRequirement, setEducationRequirement] = useState(
    editingJob?.educationRequirement || "Bachelor's / Master's"
  );
  const [experienceRequired, setExperienceRequired] = useState(
    editingJob?.experienceRequired || '0 – 2 Years'
  );
  const [salaryRange, setSalaryRange] = useState(editingJob?.salaryRange || '$70,000 – $95,000');
  const [location, setLocation] = useState(
    editingJob?.location || recruiterProfile?.location || 'Gurugram, Haryana'
  );
  const [jobType, setJobType] = useState<JobPosting['jobType']>(editingJob?.jobType || 'Full Time');
  const [vacancies, setVacancies] = useState(editingJob?.vacancies || 2);
  const [deadline, setDeadline] = useState(editingJob?.deadline || '2026-12-31');

  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingJob) {
      setTitle(editingJob.title);
      setCompanyName(editingJob.companyName);
      setDescription(editingJob.description);
      setRequiredSkillsStr(editingJob.requiredSkills.join(', '));
      setPreferredSkillsStr(editingJob.preferredSkills.join(', '));
      setEducationRequirement(editingJob.educationRequirement);
      setExperienceRequired(editingJob.experienceRequired);
      setSalaryRange(editingJob.salaryRange);
      setLocation(editingJob.location);
      setJobType(editingJob.jobType);
      setVacancies(editingJob.vacancies);
      setDeadline(editingJob.deadline);
    }
  }, [editingJob]);

  const handleAiExtract = async () => {
    if (description.trim().length < 20) {
      addToast({
        type: 'warning',
        title: 'Description Too Short',
        message: 'Enter at least 20 characters in Job Description to extract requirements.',
      });
      return;
    }
    setExtracting(true);
    try {
      const res = await analyzeJobDescriptionWithAi(title, description);
      if (res.requiredSkills?.length) setRequiredSkillsStr(res.requiredSkills.join(', '));
      if (res.preferredSkills?.length) setPreferredSkillsStr(res.preferredSkills.join(', '));
      if (res.educationRequirement) setEducationRequirement(res.educationRequirement);
      if (res.experienceRequired) setExperienceRequired(res.experienceRequired);
      addToast({
        type: 'success',
        title: 'Requirements Extracted',
        message: 'AI populated required skills and qualifications.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'AI Extraction Failed',
        message: err instanceof Error ? err.message : 'Could not analyze job description.',
      });
    } finally {
      setExtracting(false);
    }
  };

  const submitJob = async (status: 'published' | 'draft') => {
    if (!title.trim() || !companyName.trim() || !description.trim()) {
      addToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Job Title, Company Name, and Description are required.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const splitList = (s: string) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
      const numericMatch = salaryRange.replace(/,/g, '').match(/\d+/g);
      const salaryNumeric = numericMatch ? Number(numericMatch[numericMatch.length - 1]) : 0;

      await createOrUpdateJob(
        {
          title: title.trim(),
          companyName: companyName.trim(),
          description: description.trim(),
          requiredSkills: splitList(requiredSkillsStr),
          preferredSkills: splitList(preferredSkillsStr),
          educationRequirement: educationRequirement.trim(),
          experienceRequired: experienceRequired.trim(),
          salaryRange: salaryRange.trim(),
          salaryNumeric,
          location: location.trim(),
          jobType,
          vacancies: Math.max(1, Number(vacancies || 1)),
          deadline,
          status,
          roleCategory: title.trim(),
        },
        editingJob?.id
      );
      setEditingJob(null);
      setRecruiterPage('my-jobs');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {editingJob ? 'Edit Job Posting' : 'Post a New Job'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Publish a vacancy to Firestore and automatically match qualified candidates.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Data Analyst"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., TechHire Solutions"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Job Description *
            </label>
            <button
              type="button"
              disabled={extracting}
              onClick={() => void handleAiExtract()}
              className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] inline-flex items-center gap-1 hover:underline disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {extracting ? 'Extracting...' : 'AI Extract Requirements'}
            </button>
          </div>
          <textarea
            rows={5}
            required
            placeholder="Describe responsibilities, technical stack, and expectations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Python, SQL, Power BI, Data Analysis"
              value={requiredSkillsStr}
              onChange={(e) => setRequiredSkillsStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Preferred Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Docker, Kubernetes, Machine Learning"
              value={preferredSkillsStr}
              onChange={(e) => setPreferredSkillsStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Education Requirements
            </label>
            <input
              type="text"
              value={educationRequirement}
              onChange={(e) => setEducationRequirement(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Experience Required
            </label>
            <input
              type="text"
              value={experienceRequired}
              onChange={(e) => setExperienceRequired(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Salary Range
            </label>
            <input
              type="text"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Job Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Job Type
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobPosting['jobType'])}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            >
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Vacancies
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={vacancies}
              onChange={(e) => setVacancies(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Application Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitJob('draft')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitJob('published')}
            className="px-5 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {editingJob ? 'Update & Publish' : 'Publish Job'}
          </button>
        </div>
      </div>
    </div>
  );
};
