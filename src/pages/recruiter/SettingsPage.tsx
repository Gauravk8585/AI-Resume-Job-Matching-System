import React, { useState } from 'react';
import { Building2, Moon, RotateCcw, Save, Sliders, Sun } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { DEFAULT_WEIGHTS, type RecruiterProfile, type ScoringWeights } from '../../types';
import { AVATAR_RECRUITER } from '../../data/sampleData';

export const SettingsPage: React.FC = () => {
  const {
    recruiterProfile,
    userAccount,
    updateRecruiterProfile,
    weights,
    setWeights,
    darkMode,
    toggleDarkMode,
    addToast,
  } = useApp();

  const [profile, setProfile] = useState<RecruiterProfile>({
    userId: userAccount?.uid || '',
    fullName: recruiterProfile?.fullName || userAccount?.displayName || '',
    companyName: recruiterProfile?.companyName || userAccount?.companyName || '',
    companyWebsite: recruiterProfile?.companyWebsite || '',
    location: recruiterProfile?.location || '',
    industry: recruiterProfile?.industry || 'Technology',
    photoURL: recruiterProfile?.photoURL || AVATAR_RECRUITER,
  });

  const [localWeights, setLocalWeights] = useState<ScoringWeights>(weights);
  const weightSum =
    localWeights.technicalSkills +
    localWeights.education +
    localWeights.experience +
    localWeights.projectRelevance +
    localWeights.location;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRecruiterProfile(profile);
  };

  const handleSaveWeights = () => {
    if (weightSum !== 100) {
      addToast({
        type: 'warning',
        title: 'Weights Must Sum to 100%',
        message: `Current total is ${weightSum}%. Adjust sliders so total equals 100%.`,
      });
      return;
    }
    setWeights(localWeights);
    addToast({
      type: 'success',
      title: 'AI Scoring Weights Saved',
      message: 'Future AI candidate rankings and job matches will use your updated weights.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Recruiter Settings &amp; AI Weights
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure your organization details and customize how Gemini AI weights candidate ranking criteria.
        </p>
      </div>

      {/* Organization Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4"
      >
        <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#6425E8]" />
          Company &amp; Recruiter Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Company Name</label>
            <input
              type="text"
              required
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Industry</label>
            <input
              type="text"
              value={profile.industry || ''}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836]"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Save Profile
          </button>
        </div>
      </form>

      {/* Configurable AI Matching Weights */}
      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#6425E8]" />
              Configurable AI Matching Weights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Adjust how heavily each criterion contributes to the 0–100% explainable match score.
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-lg tabular-nums ${
              weightSum === 100
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
            }`}
          >
            Total: {weightSum}%
          </span>
        </div>

        <div className="space-y-4">
          {(
            [
              { key: 'technicalSkills', label: 'Technical Skills' },
              { key: 'experience', label: 'Experience' },
              { key: 'education', label: 'Education' },
              { key: 'projectRelevance', label: 'Project Relevance' },
              { key: 'location', label: 'Location' },
            ] as const
          ).map((item) => (
            <div key={item.key} className="grid grid-cols-12 items-center gap-4 text-sm">
              <label className="col-span-4 sm:col-span-3 font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                {item.label}
              </label>
              <input
                type="range"
                min={0}
                max={70}
                value={localWeights[item.key]}
                onChange={(e) =>
                  setLocalWeights((prev) => ({ ...prev, [item.key]: Number(e.target.value) }))
                }
                className="col-span-6 sm:col-span-7 accent-[#6425E8]"
              />
              <span className="col-span-2 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                {localWeights[item.key]}%
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLocalWeights(DEFAULT_WEIGHTS)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults (40/20/15/15/10)
          </button>
          <button
            type="button"
            onClick={handleSaveWeights}
            className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
          >
            Apply Weights
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Interface Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between Lavender Light Mode and Deep Slate Dark Mode.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-2"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6425E8]" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </div>
  );
};
