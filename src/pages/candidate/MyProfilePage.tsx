import React, { useEffect, useState } from 'react';
import {
  Award,
  Briefcase,
  Check,
  Edit3,
  FolderGit2,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AVATAR_CANDIDATE_1, AVATAR_CANDIDATE_2 } from '../../data/sampleData';
import type { CandidateProfile, ExperienceItem, ProjectItem } from '../../types';

export const MyProfilePage: React.FC = () => {
  const { candidateProfile, userAccount, updateCandidateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CandidateProfile>(() => ({
    userId: userAccount?.uid || '',
    fullName: candidateProfile?.fullName || userAccount?.displayName || '',
    email: candidateProfile?.email || userAccount?.email || '',
    phone: candidateProfile?.phone || '',
    headline: candidateProfile?.headline || '',
    location: candidateProfile?.location || '',
    education: candidateProfile?.education || '',
    university: candidateProfile?.university || '',
    graduationYear: candidateProfile?.graduationYear || '',
    technicalSkills: candidateProfile?.technicalSkills || [],
    softSkills: candidateProfile?.softSkills || [],
    experience: candidateProfile?.experience || [],
    projects: candidateProfile?.projects || [],
    certifications: candidateProfile?.certifications || [],
    linkedIn: candidateProfile?.linkedIn || '',
    github: candidateProfile?.github || '',
    photoURL: candidateProfile?.photoURL || AVATAR_CANDIDATE_1,
    isOpenToWork: candidateProfile?.isOpenToWork ?? true,
  }));

  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [certInput, setCertInput] = useState('');

  useEffect(() => {
    if (candidateProfile) {
      setForm({
        ...candidateProfile,
        email: candidateProfile.email || userAccount?.email || '',
      });
    }
  }, [candidateProfile, userAccount?.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCandidateProfile(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (field: 'technicalSkills' | 'softSkills' | 'certifications', value: string, clear: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!form[field].includes(trimmed)) {
      setForm((prev) => ({ ...prev, [field]: [...prev[field], trimmed] }));
    }
    clear();
  };

  const removeTag = (field: 'technicalSkills' | 'softSkills' | 'certifications', idx: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const addExperience = () => {
    const empty: ExperienceItem = {
      title: '',
      company: '',
      duration: '',
      type: 'Full-Time',
      highlights: [],
    };
    setForm((prev) => ({ ...prev, experience: [...prev.experience, empty] }));
  };

  const addProject = () => {
    const empty: ProjectItem = { name: '', description: '', technologies: [] };
    setForm((prev) => ({ ...prev, projects: [...prev.projects, empty] }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Keep your personal details, skills, projects, and links updated for accurate AI matching.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (candidateProfile) setForm(candidateProfile);
                setEditing(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="candidate-profile-form"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-[#6425E8] hover:bg-[#531BC9] text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <form id="candidate-profile-form" onSubmit={handleSave} className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="space-y-2 shrink-0">
              <img
                src={form.photoURL || AVATAR_CANDIDATE_1}
                alt={form.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900"
              />
              {editing && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, photoURL: AVATAR_CANDIDATE_1 }))}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Avatar 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, photoURL: AVATAR_CANDIDATE_2 }))}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Avatar 2
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5" /> Professional Headline
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  placeholder="e.g., Data Analyst | AI/ML Enthusiast"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <input
                  type="email"
                  disabled={!editing}
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  placeholder="+91 98765 43210"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                disabled={!editing}
                checked={form.isOpenToWork}
                onChange={(e) => setForm({ ...form, isOpenToWork: e.target.checked })}
                className="w-4 h-4 accent-[#6425E8]"
              />
              <span>Visible to verified recruiters for AI candidate ranking</span>
            </label>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Synced with AI Matcher
              </span>
            </div>
          </div>
        </div>

        {/* Location, Education & Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
              Education &amp; Location
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Degree / Education
              </label>
              <input
                type="text"
                disabled={!editing}
                placeholder="e.g., MCA (AI & ML)"
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  University
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  placeholder="University name"
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Graduation Year
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  placeholder="2027"
                  value={form.graduationYear}
                  onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input
                type="text"
                disabled={!editing}
                placeholder="City, State"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
              Social Links &amp; Certifications
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
              </label>
              <input
                type="url"
                disabled={!editing}
                placeholder="https://linkedin.com/in/..."
                value={form.linkedIn || ''}
                onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Github className="w-3.5 h-3.5" /> GitHub Profile
              </label>
              <input
                type="url"
                disabled={!editing}
                placeholder="https://github.com/..."
                value={form.github || ''}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] disabled:bg-slate-50 dark:disabled:bg-slate-900/40 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Certifications
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.certifications.map((c, idx) => (
                  <span
                    key={`${c}-${idx}`}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-900"
                  >
                    {c}
                    {editing && (
                      <button type="button" onClick={() => removeTag('certifications', idx)}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add certification..."
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('certifications', certInput, () => setCertInput(''));
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('certifications', certInput, () => setCertInput(''))}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#6425E8] dark:text-[#A78BFA] text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical & Soft Skills */}
        <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
              Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.technicalSkills.map((sk, idx) => (
                <span
                  key={`${sk}-${idx}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900"
                >
                  {sk}
                  {editing && (
                    <button type="button" onClick={() => removeTag('technicalSkills', idx)}>
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add technical skill..."
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('technicalSkills', techInput, () => setTechInput(''));
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
                />
                <button
                  type="button"
                  onClick={() => addTag('technicalSkills', techInput, () => setTechInput(''))}
                  className="px-3 py-1.5 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
              Soft Skills
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.softSkills.map((sk, idx) => (
                <span
                  key={`${sk}-${idx}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {sk}
                  {editing && (
                    <button type="button" onClick={() => removeTag('softSkills', idx)}>
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add soft skill..."
                  value={softInput}
                  onChange={(e) => setSoftInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('softSkills', softInput, () => setSoftInput(''));
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1836] text-xs"
                />
                <button
                  type="button"
                  onClick={() => addTag('softSkills', softInput, () => setSoftInput(''))}
                  className="px-3 py-1.5 rounded-xl bg-[#6425E8] text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Experience & Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
                Experience
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={addExperience}
                  className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Role
                </button>
              )}
            </div>
            {form.experience.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No work experience added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {form.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] space-y-2"
                  >
                    {editing ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => {
                              const next = [...form.experience];
                              next[idx] = { ...exp, title: e.target.value };
                              setForm({ ...form, experience: next });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                experience: form.experience.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => {
                              const next = [...form.experience];
                              next[idx] = { ...exp, company: e.target.value };
                              setForm({ ...form, experience: next });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={exp.duration}
                            onChange={(e) => {
                              const next = [...form.experience];
                              next[idx] = { ...exp, duration: e.target.value };
                              setForm({ ...form, experience: next });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">
                          {exp.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {exp.company} · {exp.duration}
                        </div>
                        {exp.highlights?.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-1">
                            {exp.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA]" />
                Projects
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={addProject}
                  className="text-xs font-semibold text-[#6425E8] dark:text-[#A78BFA] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              )}
            </div>
            {form.projects.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No projects added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {form.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1D1836] space-y-2"
                  >
                    {editing ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Project Name"
                            value={proj.name}
                            onChange={(e) => {
                              const next = [...form.projects];
                              next[idx] = { ...proj, name: e.target.value };
                              setForm({ ...form, projects: next });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                projects: form.projects.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Short description..."
                          value={proj.description}
                          onChange={(e) => {
                            const next = [...form.projects];
                            next[idx] = { ...proj, description: e.target.value };
                            setForm({ ...form, projects: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16122B] text-xs"
                        />
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">
                          {proj.name}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {proj.description}
                        </p>
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {proj.technologies.map((t) => (
                              <span
                                key={t}
                                className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
