import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  AVATAR_CANDIDATE_1,
  AVATAR_RECRUITER,
  SAMPLE_APPLICATIONS,
  SAMPLE_CANDIDATE_PROFILE,
  SAMPLE_JOB_MATCHES,
  SAMPLE_JOBS,
  SAMPLE_NOTIFICATIONS,
  SAMPLE_OTHER_CANDIDATES,
  SAMPLE_RECRUITER_PROFILE,
  SAMPLE_RESUMES,
  SAMPLE_SKILL_GAP,
} from '../data/sampleData';
import * as fsService from '../services/firestoreService';
import {
  analyzeSkillGapWithAi,
  matchJobsWithAi,
  parseResumeWithAi,
  rankCandidatesWithAi,
} from '../services/aiService';
import { extractTextFromResumeFile } from '../utils/resumeParser';
import {
  DEFAULT_WEIGHTS,
  type ApplicationStatus,
  type CandidateProfile,
  type JobApplication,
  type JobMatch,
  type JobPosting,
  type NotificationItem,
  type RankedCandidateResult,
  type RecruiterProfile,
  type ResumeDocument,
  type SavedJob,
  type ScoringWeights,
  type ShortlistedCandidate,
  type SkillGapResult,
  type ToastMessage,
  type UserAccount,
  type UserRole,
} from '../types';

export type CandidatePage =
  | 'dashboard'
  | 'profile'
  | 'my-resume'
  | 'upload-resume'
  | 'find-jobs'
  | 'job-matches'
  | 'skill-gap'
  | 'applications'
  | 'saved-jobs';

export type RecruiterPage =
  | 'dashboard'
  | 'post-job'
  | 'my-jobs'
  | 'candidates'
  | 'shortlisted'
  | 'analytics'
  | 'settings';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface AppContextValue {
  // Auth & Mode
  authReady: boolean;
  firebaseUser: FirebaseUser | null;
  userAccount: UserAccount | null;
  isDemoMode: boolean;
  role: UserRole | null;
  emailVerifiedWarning: boolean;

  // Navigation & Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  candidatePage: CandidatePage;
  setCandidatePage: (p: CandidatePage) => void;
  recruiterPage: RecruiterPage;
  setRecruiterPage: (p: RecruiterPage) => void;
  editingJob: JobPosting | null;
  setEditingJob: (j: JobPosting | null) => void;

  // Data
  candidateProfile: CandidateProfile | null;
  recruiterProfile: RecruiterProfile | null;
  resumes: ResumeDocument[];
  activeResumeId: string | null;
  setActiveResumeId: (id: string | null) => void;
  jobs: JobPosting[];
  jobMatches: JobMatch[];
  skillGap: SkillGapResult | null;
  applications: JobApplication[];
  savedJobs: SavedJob[];
  shortlisted: ShortlistedCandidate[];
  notifications: NotificationItem[];
  candidatePool: CandidateProfile[];
  rankedCandidates: RankedCandidateResult[];
  weights: ScoringWeights;
  setWeights: (w: ScoringWeights) => void;

  // Loading & AI Error States
  isLoadingData: boolean;
  isAnalyzingResume: boolean;
  isMatchingJobs: boolean;
  isAnalyzingSkillGap: boolean;
  isRankingCandidates: boolean;
  aiError: string | null;
  clearAiError: () => void;

  // Auth Actions
  loginWithGoogle: (selectedRole: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string, selectedRole: UserRole) => Promise<void>;
  registerWithEmail: (
    fullName: string,
    email: string,
    password: string,
    selectedRole: UserRole,
    companyName?: string
  ) => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
  enterDemoMode: (selectedRole: UserRole) => void;
  logout: () => Promise<void>;

  // Candidate Actions
  updateCandidateProfile: (profile: CandidateProfile) => Promise<void>;
  uploadAndAnalyzeResume: (file: File) => Promise<ResumeDocument | null>;
  reanalyzeResume: (resumeId: string) => Promise<void>;
  deleteResume: (resumeId: string) => Promise<void>;
  runJobMatching: (customWeights?: ScoringWeights) => Promise<void>;
  runSkillGapAnalysis: (jobId: string) => Promise<void>;
  applyToJob: (job: JobPosting) => Promise<void>;
  withdrawCandidateApplication: (appId: string) => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;

  // Recruiter Actions
  createOrUpdateJob: (job: Omit<JobPosting, 'id' | 'recruiterId'>, existingId?: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  toggleJobStatus: (jobId: string, nextStatus: 'published' | 'closed' | 'draft') => Promise<void>;
  runCandidateRanking: (job: JobPosting) => Promise<void>;
  toggleShortlistCandidate: (candidateId: string, jobId: string, matchScore: number, notes?: string) => Promise<void>;
  updateCandidateApplicationStatus: (appId: string, status: ApplicationStatus, remarks?: string) => Promise<void>;
  updateRecruiterProfile: (profile: RecruiterProfile) => Promise<void>;

  // Notifications, Toasts, Confirmations
  markNotificationAsRead: (notifId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  confirmDialog: ConfirmState;
  requestConfirm: (cfg: Omit<ConfirmState, 'open'>) => void;
  closeConfirm: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_STORAGE_KEY = 'ai_resume_matcher_demo_v1';
const THEME_STORAGE_KEY = 'ai_resume_matcher_theme';
const WEIGHTS_STORAGE_KEY = 'ai_resume_matcher_weights';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [emailVerifiedWarning, setEmailVerifiedWarning] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });

  const [candidatePage, setCandidatePage] = useState<CandidatePage>('dashboard');
  const [recruiterPage, setRecruiterPage] = useState<RecruiterPage>('dashboard');
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [shortlisted, setShortlisted] = useState<ShortlistedCandidate[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [candidatePool, setCandidatePool] = useState<CandidateProfile[]>([]);
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidateResult[]>([]);

  const [weights, setWeightsState] = useState<ScoringWeights>(() => {
    try {
      const saved = localStorage.getItem(WEIGHTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as ScoringWeights;
    } catch {
      // ignore
    }
    return DEFAULT_WEIGHTS;
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [isMatchingJobs, setIsMatchingJobs] = useState(false);
  const [isAnalyzingSkillGap, setIsAnalyzingSkillGap] = useState(false);
  const [isRankingCandidates, setIsRankingCandidates] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const manualAuthInProgressRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((prev) => !prev), []);

  const setWeights = useCallback((w: ScoringWeights) => {
    setWeightsState(w);
    localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(w));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestConfirm = useCallback((cfg: Omit<ConfirmState, 'open'>) => {
    setConfirmDialog({ ...cfg, open: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const clearAiError = useCallback(() => setAiError(null), []);

  // Build deterministic recruiter candidate ranking list from available profiles/applications/sample
  const buildFallbackRankedCandidates = useCallback(
    (
      job: JobPosting,
      profiles: CandidateProfile[],
      apps: JobApplication[],
      shortlistedItems: ShortlistedCandidate[]
    ): RankedCandidateResult[] => {
      return profiles.map((p) => {
        const req = job.requiredSkills || [];
        const matched = req.filter((r) =>
          p.technicalSkills.some((s) => s.toLowerCase() === r.toLowerCase())
        );
        const missing = req.filter(
          (r) => !p.technicalSkills.some((s) => s.toLowerCase() === r.toLowerCase())
        );
        const skillRatio = req.length > 0 ? Math.round((matched.length / req.length) * 100) : 78;
        const baseScore = Math.min(96, Math.max(55, Math.round(skillRatio * 0.65 + 32)));
        const app = apps.find((a) => a.candidateId === p.userId && a.jobId === job.id);
        const isShortlisted = shortlistedItems.some(
          (s) => s.candidateId === p.userId && s.jobId === job.id
        );
        return {
          candidateId: p.userId,
          candidateName: p.fullName,
          photoURL: p.photoURL,
          education: `${p.education}${p.university ? ` – ${p.university}` : ''}`,
          location: p.location,
          email: p.email,
          matchScore: app?.matchScore ?? baseScore,
          skillsMatch: skillRatio,
          educationMatch: 88,
          experienceMatch: p.experience.length > 0 ? 85 : 68,
          matchedSkills: matched,
          missingSkills: missing,
          highlights: [
            p.technicalSkills.slice(0, 3).length
              ? `Strong in ${p.technicalSkills.slice(0, 3).join(' and ')}`
              : 'Core analytical foundation',
            p.experience[0]
              ? `${p.experience[0].title} at ${p.experience[0].company}`
              : `${p.projects.length} completed technical projects`,
            p.softSkills[0] ? `Demonstrated ${p.softSkills[0].toLowerCase()}` : 'Ready for technical review',
          ],
          recommendation:
            missing.length === 0
              ? 'Strong match across all listed core skills.'
              : `Good fit; assess familiarity with ${missing.slice(0, 2).join(', ')}.`,
          applicationStatus: isShortlisted
            ? 'Shortlisted'
            : app?.status || 'Under Review',
          applicationId: app?.id,
          remarks: app?.remarks,
          profile: p,
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
    },
    []
  );

  // Hydrate Demo Mode state
  const hydrateDemoState = useCallback(
    (selectedRole: UserRole, stored?: Record<string, unknown>) => {
      const demoUid = selectedRole === 'candidate' ? 'demo-candidate-1' : 'demo-recruiter-1';
      const demoUser: UserAccount =
        selectedRole === 'candidate'
          ? {
              uid: demoUid,
              email: 'k9k7gaurav@gmail.com',
              displayName: 'Gaurav Kumar',
              role: 'candidate',
              photoURL: AVATAR_CANDIDATE_1,
            }
          : {
              uid: demoUid,
              email: 'ananya@techhire.example.com',
              displayName: 'Ananya Verma',
              role: 'recruiter',
              companyName: 'TechHire Solutions',
              photoURL: AVATAR_RECRUITER,
            };

      const dCandidateProfile =
        (stored?.candidateProfile as CandidateProfile) || SAMPLE_CANDIDATE_PROFILE;
      const dRecruiterProfile =
        (stored?.recruiterProfile as RecruiterProfile) || SAMPLE_RECRUITER_PROFILE;
      const dResumes = (stored?.resumes as ResumeDocument[]) || SAMPLE_RESUMES;
      const dJobs = (stored?.jobs as JobPosting[]) || SAMPLE_JOBS;
      const dMatches = (stored?.jobMatches as JobMatch[]) || SAMPLE_JOB_MATCHES;
      const dSkillGap = (stored?.skillGap as SkillGapResult) || SAMPLE_SKILL_GAP;
      const dApps = (stored?.applications as JobApplication[]) || SAMPLE_APPLICATIONS;
      const dSaved = (stored?.savedJobs as SavedJob[]) || [
        { id: 'saved-1', userId: 'demo-candidate-1', jobId: 'job-google-ml-assoc' },
      ];
      const dShortlisted = (stored?.shortlisted as ShortlistedCandidate[]) || [
        {
          id: 'short-1',
          recruiterId: 'demo-recruiter-1',
          candidateId: 'demo-candidate-1',
          jobId: 'job-meta-data-analyst',
          matchScore: 92,
        },
        {
          id: 'short-2',
          recruiterId: 'demo-recruiter-1',
          candidateId: 'demo-candidate-2',
          jobId: 'job-meta-data-analyst',
          matchScore: 88,
        },
      ];
      const dNotifs = (stored?.notifications as NotificationItem[]) || SAMPLE_NOTIFICATIONS;

      setIsDemoMode(true);
      setUserAccount(demoUser);
      setCandidateProfile(dCandidateProfile);
      setRecruiterProfile(dRecruiterProfile);
      setResumes(dResumes);
      setActiveResumeId(dResumes[0]?.id || null);
      setJobs(dJobs);
      setJobMatches(dMatches);
      setSkillGap(dSkillGap);
      setApplications(dApps);
      setSavedJobs(dSaved);
      setShortlisted(dShortlisted);
      setNotifications(dNotifs);
      setCandidatePool(SAMPLE_OTHER_CANDIDATES);
      if (dJobs[0]) {
        setRankedCandidates(
          buildFallbackRankedCandidates(dJobs[0], SAMPLE_OTHER_CANDIDATES, dApps, dShortlisted)
        );
      }
      setCandidatePage('dashboard');
      setRecruiterPage('dashboard');
    },
    [buildFallbackRankedCandidates]
  );

  // Persist Demo Mode state on changes
  useEffect(() => {
    if (!isDemoMode || !userAccount) return;
    try {
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({
          role: userAccount.role,
          candidateProfile,
          recruiterProfile,
          resumes,
          jobs,
          jobMatches,
          skillGap,
          applications,
          savedJobs,
          shortlisted,
          notifications,
        })
      );
    } catch {
      // Ignore storage quota issues for large data URLs
    }
  }, [
    isDemoMode,
    userAccount,
    candidateProfile,
    recruiterProfile,
    resumes,
    jobs,
    jobMatches,
    skillGap,
    applications,
    savedJobs,
    shortlisted,
    notifications,
  ]);

  // Load Firestore data for authenticated user
  const loadFirebaseUserData = useCallback(
    async (fbUser: FirebaseUser, preferredRole?: UserRole, companyName?: string) => {
      setIsLoadingData(true);
      try {
        let account = await fsService.getUserAccount(fbUser.uid);
        if (!account) {
          const roleToCreate: UserRole =
            preferredRole ||
            (localStorage.getItem('pending_auth_role') as UserRole) ||
            'candidate';
          const pendingName = localStorage.getItem('pending_auth_name') || undefined;
          const pendingCompany = companyName || localStorage.getItem('pending_auth_company') || undefined;
          account = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || pendingName || fbUser.email?.split('@')[0] || 'User',
            role: roleToCreate,
            photoURL: fbUser.photoURL || (roleToCreate === 'recruiter' ? AVATAR_RECRUITER : AVATAR_CANDIDATE_1),
            companyName: pendingCompany || (roleToCreate === 'recruiter' ? 'Talent Corp' : undefined),
          };
          if (fbUser.emailVerified) {
            await fsService.createUserAccount(account);
            localStorage.removeItem('pending_auth_name');
            localStorage.removeItem('pending_auth_company');
          }
        }

        setUserAccount(account);
        setEmailVerifiedWarning(!fbUser.emailVerified);
        setIsDemoMode(false);

        const publishedJobs = await fsService.listPublishedJobs();
        const combinedJobs = publishedJobs.length > 0 ? publishedJobs : SAMPLE_JOBS;
        setJobs(combinedJobs);

        if (account.role === 'candidate') {
          let cProf = await fsService.getCandidateProfile(fbUser.uid);
          if (!cProf) {
            cProf = {
              userId: fbUser.uid,
              fullName: account.displayName,
              email: account.email,
              headline: 'Candidate',
              location: '',
              education: '',
              university: '',
              graduationYear: '',
              technicalSkills: [],
              softSkills: [],
              experience: [],
              projects: [],
              certifications: [],
              photoURL: account.photoURL || AVATAR_CANDIDATE_1,
              isOpenToWork: true,
            };
            if (fbUser.emailVerified) {
              await fsService.saveCandidateProfile(cProf, true);
            }
          } else {
            cProf.email = cProf.email || account.email;
          }
          setCandidateProfile(cProf);

          const [userResumes, userMatches, userApps, userSaved, userNotifs] = await Promise.all([
            fsService.listUserResumes(fbUser.uid),
            fsService.listUserJobMatches(fbUser.uid),
            fsService.listCandidateApplications(fbUser.uid),
            fsService.listSavedJobs(fbUser.uid),
            fsService.listUserNotifications(fbUser.uid),
          ]);
          setResumes(userResumes);
          setActiveResumeId(userResumes[0]?.id || null);
          setJobMatches(userMatches);
          setApplications(userApps);
          setSavedJobs(userSaved);
          setNotifications(userNotifs);
        } else {
          let rProf = await fsService.getRecruiterProfile(fbUser.uid);
          if (!rProf) {
            rProf = {
              userId: fbUser.uid,
              fullName: account.displayName,
              companyName: account.companyName || 'My Organization',
              location: '',
              industry: 'Technology',
              photoURL: account.photoURL || AVATAR_RECRUITER,
            };
            if (fbUser.emailVerified) {
              await fsService.saveRecruiterProfile(rProf, true);
            }
          }
          setRecruiterProfile(rProf);

          const [recJobs, recApps, recShort, openProfiles, recNotifs] = await Promise.all([
            fsService.listRecruiterJobs(fbUser.uid),
            fsService.listRecruiterApplications(fbUser.uid),
            fsService.listShortlisted(fbUser.uid),
            fsService.listOpenCandidateProfiles(),
            fsService.listUserNotifications(fbUser.uid),
          ]);

          const effectiveJobs = recJobs.length > 0 ? recJobs : publishedJobs;
          setJobs(effectiveJobs);
          setApplications(recApps);
          setShortlisted(recShort);
          setCandidatePool(openProfiles);
          setNotifications(recNotifs);
          if (effectiveJobs[0] && openProfiles.length > 0) {
            setRankedCandidates(
              buildFallbackRankedCandidates(effectiveJobs[0], openProfiles, recApps, recShort)
            );
          }
        }
      } catch (err) {
        console.error('Error loading Firebase user state:', err);
        addToast({
          type: 'error',
          title: 'Data Sync Issue',
          message: err instanceof Error ? err.message : 'Could not load profile from Firestore.',
        });
      } finally {
        setIsLoadingData(false);
      }
    },
    [addToast, buildFallbackRankedCandidates]
  );

  // Listen to Firebase Auth state OR restore Demo Mode on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        if (!manualAuthInProgressRef.current) {
          await loadFirebaseUserData(fbUser);
        }
      } else {
        const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo) as Record<string, unknown>;
            const savedRole = (parsed.role as UserRole) || 'candidate';
            hydrateDemoState(savedRole, parsed);
          } catch {
            localStorage.removeItem(DEMO_STORAGE_KEY);
          }
        }
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [hydrateDemoState, loadFirebaseUserData]);

  // --- Auth Methods ---
  const loginWithGoogle = useCallback(
    async (selectedRole: UserRole) => {
      localStorage.setItem('pending_auth_role', selectedRole);
      manualAuthInProgressRef.current = true;
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        await loadFirebaseUserData(cred.user, selectedRole);
        addToast({
          type: 'success',
          title: 'Signed in with Google',
          message: `Welcome back, ${cred.user.displayName || 'User'}!`,
        });
      } finally {
        manualAuthInProgressRef.current = false;
      }
    },
    [addToast, loadFirebaseUserData]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string, selectedRole: UserRole) => {
      localStorage.setItem('pending_auth_role', selectedRole);
      manualAuthInProgressRef.current = true;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await loadFirebaseUserData(cred.user, selectedRole);
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome back to AI Resume & Job Matching System.',
        });
      } finally {
        manualAuthInProgressRef.current = false;
      }
    },
    [addToast, loadFirebaseUserData]
  );

  const registerWithEmail = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
      selectedRole: UserRole,
      companyName?: string
    ) => {
      localStorage.setItem('pending_auth_role', selectedRole);
      localStorage.setItem('pending_auth_name', fullName);
      if (companyName) {
        localStorage.setItem('pending_auth_company', companyName);
      } else {
        localStorage.removeItem('pending_auth_company');
      }
      manualAuthInProgressRef.current = true;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await sendEmailVerification(cred.user).catch(() => {});
        await loadFirebaseUserData(cred.user, selectedRole, companyName);
        addToast({
          type: 'info',
          title: 'Account Created',
          message: 'Verification email sent. Please verify your email to enable cloud saves.',
        });
      } finally {
        manualAuthInProgressRef.current = false;
      }
    },
    [addToast, loadFirebaseUserData]
  );

  const sendResetPassword = useCallback(
    async (email: string) => {
      await sendPasswordResetEmail(auth, email);
      addToast({
        type: 'success',
        title: 'Password Reset Sent',
        message: `Check ${email} for reset instructions.`,
      });
    },
    [addToast]
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    addToast({
      type: 'success',
      title: 'Verification Email Sent',
      message: 'Please check your inbox, click the link, then click "I\'ve Verified — Refresh".',
    });
  }, [addToast]);

  const refreshEmailVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setFirebaseUser(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await loadFirebaseUserData(auth.currentUser, userAccount?.role, userAccount?.companyName);
      addToast({
        type: 'success',
        title: 'Email Verified',
        message: 'Cloud persistence is now active for your account.',
      });
    } else {
      addToast({
        type: 'warning',
        title: 'Not Verified Yet',
        message: 'Please click the verification link in your inbox first, then try refreshing again.',
      });
    }
  }, [addToast, loadFirebaseUserData, userAccount?.companyName, userAccount?.role]);

  const enterDemoMode = useCallback(
    (selectedRole: UserRole) => {
      hydrateDemoState(selectedRole);
      addToast({
        type: 'info',
        title: `Demo Mode (${selectedRole === 'candidate' ? 'Candidate' : 'Recruiter'})`,
        message: 'Explore with clearly labeled sample data. Real AI resume & matching endpoints remain active!',
      });
    },
    [addToast, hydrateDemoState]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem('pending_auth_role');
    localStorage.removeItem('pending_auth_name');
    localStorage.removeItem('pending_auth_company');
    setIsDemoMode(false);
    setUserAccount(null);
    setCandidateProfile(null);
    setRecruiterProfile(null);
    setResumes([]);
    setJobMatches([]);
    setApplications([]);
    setSavedJobs([]);
    setShortlisted([]);
    setNotifications([]);
    if (auth.currentUser) {
      await signOut(auth);
    }
    addToast({ type: 'info', title: 'Signed Out', message: 'You have been logged out safely.' });
  }, [addToast]);

  // --- Candidate Actions ---
  const updateCandidateProfile = useCallback(
    async (profile: CandidateProfile) => {
      if (!userAccount) return;
      const updated = { ...profile, userId: userAccount.uid };
      setCandidateProfile(updated);
      if (!isDemoMode && firebaseUser?.emailVerified) {
        const exists = await fsService.getCandidateProfile(userAccount.uid);
        await fsService.saveCandidateProfile(updated, !exists);
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your candidate profile has been saved to cloud.',
        });
      } else if (!isDemoMode) {
        addToast({
          type: 'warning',
          title: 'Saved Locally Only',
          message: 'Verify your email address in the banner above to sync changes to Firestore.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your candidate profile has been saved.',
        });
      }
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, userAccount]
  );

  const runJobMatching = useCallback(
    async (customWeights?: ScoringWeights) => {
      if (!userAccount) return;
      const activeWeights = customWeights || weights;
      const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];
      const publishedJobs = jobs.filter((j) => j.status === 'published');
      if (publishedJobs.length === 0) return;

      setIsMatchingJobs(true);
      setAiError(null);
      try {
        const profilePayload = {
          ...(candidateProfile || {}),
          parsedResume: activeResume?.parsedData,
        };
        const aiResult = await matchJobsWithAi(profilePayload, publishedJobs, activeWeights);
        const computed: JobMatch[] = aiResult.matches.map((m) => {
          const jobObj = publishedJobs.find((j) => j.id === m.jobId);
          return {
            id: fsService.makeSafeId(`match_${m.jobId}`),
            userId: userAccount.uid,
            jobId: m.jobId,
            resumeId: activeResume?.id || 'profile_only',
            recruiterId: jobObj?.recruiterId || 'demo-recruiter-1',
            overallScore: m.overallScore,
            skillsMatch: m.skillsMatch,
            educationMatch: m.educationMatch,
            experienceMatch: m.experienceMatch,
            projectRelevance: m.projectRelevance,
            locationMatch: m.locationMatch,
            matchedSkills: m.matchedSkills,
            missingSkills: m.missingSkills,
            explanation: m.explanation,
            isSampleData: false,
          };
        });
        setJobMatches(computed);
        if (!isDemoMode && firebaseUser?.emailVerified && activeResume) {
          for (const match of computed) {
            await fsService.saveJobMatch(match);
          }
        }
        addToast({
          type: 'success',
          title: 'AI Job Matching Complete',
          message: `Evaluated ${computed.length} opportunities using Gemini AI.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI matching failed.';
        setAiError(msg);
        addToast({ type: 'error', title: 'Job Matching Failed', message: msg });
      } finally {
        setIsMatchingJobs(false);
      }
    },
    [activeResumeId, addToast, candidateProfile, firebaseUser?.emailVerified, isDemoMode, jobs, resumes, userAccount, weights]
  );

  const runSkillGapAnalysis = useCallback(
    async (jobId: string) => {
      const targetJob = jobs.find((j) => j.id === jobId) || jobs[0];
      if (!targetJob) return;
      const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];
      setIsAnalyzingSkillGap(true);
      setAiError(null);
      try {
        const aiGap = await analyzeSkillGapWithAi(
          { ...(candidateProfile || {}), parsedResume: activeResume?.parsedData },
          targetJob
        );
        setSkillGap({
          jobId: targetJob.id,
          jobTitle: `${targetJob.title} — ${targetJob.companyName}`,
          ...aiGap,
          isSampleData: false,
        });
        addToast({
          type: 'success',
          title: 'Skill Gap Updated',
          message: `Analyzed against ${targetJob.title} at ${targetJob.companyName}.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Skill gap analysis failed.';
        setAiError(msg);
        addToast({ type: 'error', title: 'Skill Gap Analysis Failed', message: msg });
      } finally {
        setIsAnalyzingSkillGap(false);
      }
    },
    [activeResumeId, addToast, candidateProfile, jobs, resumes]
  );

  const uploadAndAnalyzeResume = useCallback(
    async (file: File): Promise<ResumeDocument | null> => {
      if (!userAccount) return null;
      setIsAnalyzingResume(true);
      setAiError(null);
      try {
        const { rawText, fileDataUrl } = await extractTextFromResumeFile(file);
        const parsedData = await parseResumeWithAi(rawText, file.name);
        const resumeId = fsService.makeSafeId('res');
        if (!isDemoMode && firebaseUser) {
          await fsService.uploadResumeBinary(userAccount.uid, resumeId, file);
        }

        const newResume: ResumeDocument = {
          id: resumeId,
          userId: userAccount.uid,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          rawText,
          summary: parsedData.summary,
          parsedData,
          status: 'analyzed',
          isSharedWithRecruiters: true,
          uploadedDateLabel: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          fileDataUrl,
          isSampleData: false,
        };

        setResumes((prev) => [newResume, ...prev]);
        setActiveResumeId(newResume.id);

        // Merge extracted skills & info into candidate profile (never overwriting user's explicit values with empty strings)
        const allSkills = Array.from(
          new Set([
            ...(parsedData.skills.technicalSkills || []),
            ...(parsedData.skills.programmingLanguages || []),
            ...(parsedData.skills.frameworks || []),
            ...(parsedData.skills.tools || []),
          ])
        );
        const mergedProfile: CandidateProfile = {
          ...(candidateProfile || SAMPLE_CANDIDATE_PROFILE),
          userId: userAccount.uid,
          fullName: parsedData.candidateName || candidateProfile?.fullName || userAccount.displayName,
          email: parsedData.email || candidateProfile?.email || userAccount.email,
          phone: parsedData.phone || candidateProfile?.phone || '',
          location: parsedData.location || candidateProfile?.location || '',
          headline: parsedData.headline || candidateProfile?.headline || '',
          education: parsedData.education[0]?.degree || candidateProfile?.education || '',
          university: parsedData.education[0]?.institution || candidateProfile?.university || '',
          graduationYear: parsedData.education[0]?.year || candidateProfile?.graduationYear || '',
          technicalSkills: allSkills.length > 0 ? allSkills : candidateProfile?.technicalSkills || [],
          softSkills:
            parsedData.skills.softSkills.length > 0
              ? parsedData.skills.softSkills
              : candidateProfile?.softSkills || [],
          experience:
            parsedData.experience.length > 0
              ? parsedData.experience
              : candidateProfile?.experience || [],
          projects:
            parsedData.projects.length > 0
              ? parsedData.projects
              : candidateProfile?.projects || [],
          certifications:
            parsedData.certifications.length > 0
              ? parsedData.certifications
              : candidateProfile?.certifications || [],
          isOpenToWork: true,
          isSampleData: false,
        };
        setCandidateProfile(mergedProfile);

        if (!isDemoMode && firebaseUser?.emailVerified) {
          await fsService.saveResumeDocument(newResume, true);
          const existingProfile = await fsService.getCandidateProfile(userAccount.uid);
          await fsService.saveCandidateProfile(mergedProfile, !existingProfile);

          const notif: NotificationItem = {
            id: fsService.makeSafeId('notif'),
            userId: userAccount.uid,
            title: 'Resume Analysis Completed',
            message: `${file.name} was parsed successfully with Gemini AI.`,
            type: 'analysis',
            read: false,
            timeLabel: 'Just now',
          };
          await fsService.createNotification(notif);
          setNotifications((prev) => [notif, ...prev]);
        } else {
          setNotifications((prev) => [
            {
              id: fsService.makeSafeId('notif'),
              userId: userAccount.uid,
              title: 'Resume Analysis Completed',
              message: `${file.name} was parsed successfully with Gemini AI.`,
              type: 'analysis',
              read: false,
              timeLabel: 'Just now',
            },
            ...prev,
          ]);
        }

        addToast({
          type: 'success',
          title: 'Resume Analyzed',
          message: `Extracted ${allSkills.length} skills from ${file.name}.`,
        });
        return newResume;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to parse resume.';
        setAiError(msg);
        addToast({ type: 'error', title: 'Resume Analysis Failed', message: msg });
        return null;
      } finally {
        setIsAnalyzingResume(false);
      }
    },
    [addToast, candidateProfile, firebaseUser, isDemoMode, userAccount]
  );

  const reanalyzeResume = useCallback(
    async (resumeId: string) => {
      const target = resumes.find((r) => r.id === resumeId);
      if (!target) return;
      setIsAnalyzingResume(true);
      setAiError(null);
      try {
        const parsedData = await parseResumeWithAi(target.rawText, target.fileName);
        const updated: ResumeDocument = {
          ...target,
          summary: parsedData.summary,
          parsedData,
          status: 'analyzed',
          isSampleData: false,
        };
        setResumes((prev) => prev.map((r) => (r.id === resumeId ? updated : r)));
        if (!isDemoMode && firebaseUser?.emailVerified) {
          await fsService.saveResumeDocument(updated, false);
        }
        addToast({
          type: 'success',
          title: 'Re-analysis Complete',
          message: `${target.fileName} has been re-evaluated.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Re-analysis failed.';
        setAiError(msg);
        addToast({ type: 'error', title: 'Re-analysis Failed', message: msg });
      } finally {
        setIsAnalyzingResume(false);
      }
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, resumes]
  );

  const deleteResume = useCallback(
    async (resumeId: string) => {
      setResumes((prev) => {
        const next = prev.filter((r) => r.id !== resumeId);
        if (activeResumeId === resumeId) {
          setActiveResumeId(next[0]?.id || null);
        }
        return next;
      });
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.deleteResumeDocument(resumeId);
      }
      addToast({ type: 'info', title: 'Resume Deleted', message: 'The resume has been removed.' });
    },
    [activeResumeId, addToast, firebaseUser?.emailVerified, isDemoMode]
  );

  const applyToJob = useCallback(
    async (job: JobPosting) => {
      if (!userAccount || !candidateProfile) return;
      const alreadyApplied = applications.some(
        (a) => a.jobId === job.id && a.candidateId === userAccount.uid
      );
      if (alreadyApplied) {
        addToast({
          type: 'warning',
          title: 'Already Applied',
          message: `You have already applied to ${job.title} at ${job.companyName}.`,
        });
        return;
      }
      const match = jobMatches.find((m) => m.jobId === job.id);
      const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];
      const newApp: JobApplication = {
        id: fsService.makeSafeId('app'),
        jobId: job.id,
        recruiterId: job.recruiterId,
        candidateId: userAccount.uid,
        candidateName: candidateProfile.fullName,
        candidateEmail: candidateProfile.email || userAccount.email,
        candidateEducation: `${candidateProfile.education || 'Graduate'}${
          candidateProfile.university ? ` – ${candidateProfile.university}` : ''
        }`,
        resumeId: activeResume?.id,
        jobTitle: job.title,
        companyName: job.companyName,
        matchScore: match?.overallScore ?? 78,
        matchedSkills: match?.matchedSkills || [],
        missingSkills: match?.missingSkills || [],
        status: 'Applied',
        appliedDateLabel: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        isSampleData: false,
      };

      setApplications((prev) => [newApp, ...prev]);
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.createApplication(newApp);
      }
      addToast({
        type: 'success',
        title: 'Application Submitted',
        message: `Applied to ${job.title} at ${job.companyName}.`,
      });
    },
    [
      activeResumeId,
      addToast,
      applications,
      candidateProfile,
      firebaseUser?.emailVerified,
      isDemoMode,
      jobMatches,
      resumes,
      userAccount,
    ]
  );

  const withdrawCandidateApplication = useCallback(
    async (appId: string) => {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.withdrawApplication(appId);
      }
      addToast({ type: 'info', title: 'Application Withdrawn' });
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode]
  );

  const toggleSaveJob = useCallback(
    async (jobId: string) => {
      if (!userAccount) return;
      const existing = savedJobs.find((s) => s.jobId === jobId);
      if (existing) {
        setSavedJobs((prev) => prev.filter((s) => s.id !== existing.id));
        if (!isDemoMode && firebaseUser?.emailVerified) {
          await fsService.removeSavedJob(existing.id);
        }
        addToast({ type: 'info', title: 'Removed from Saved Jobs' });
      } else {
        const newSaved: SavedJob = {
          id: fsService.makeSafeId('saved'),
          userId: userAccount.uid,
          jobId,
        };
        setSavedJobs((prev) => [newSaved, ...prev]);
        if (!isDemoMode && firebaseUser?.emailVerified) {
          await fsService.addSavedJob(newSaved);
        }
        addToast({ type: 'success', title: 'Job Saved', message: 'Added to your Saved Jobs list.' });
      }
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, savedJobs, userAccount]
  );

  // --- Recruiter Actions ---
  const createOrUpdateJob = useCallback(
    async (jobInput: Omit<JobPosting, 'id' | 'recruiterId'>, existingId?: string) => {
      if (!userAccount) return;
      const isNew = !existingId;
      const job: JobPosting = {
        ...jobInput,
        id: existingId || fsService.makeSafeId('job'),
        recruiterId: userAccount.uid,
        isSampleData: false,
      };
      setJobs((prev) => (isNew ? [job, ...prev] : prev.map((j) => (j.id === job.id ? job : j))));
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.saveJobPosting(job, isNew);
      }
      addToast({
        type: 'success',
        title: isNew ? 'Job Posted' : 'Job Updated',
        message: `${job.title} at ${job.companyName} (${job.status}).`,
      });
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, userAccount]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.deleteJobPosting(jobId);
      }
      addToast({ type: 'info', title: 'Job Deleted' });
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode]
  );

  const toggleJobStatus = useCallback(
    async (jobId: string, nextStatus: 'published' | 'closed' | 'draft') => {
      const target = jobs.find((j) => j.id === jobId);
      if (!target) return;
      const updated = { ...target, status: nextStatus };
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.saveJobPosting(updated, false);
      }
      addToast({ type: 'success', title: `Job marked as ${nextStatus}` });
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, jobs]
  );

  const runCandidateRanking = useCallback(
    async (job: JobPosting) => {
      const pool = candidatePool.length > 0 ? candidatePool : SAMPLE_OTHER_CANDIDATES;
      setIsRankingCandidates(true);
      setAiError(null);
      try {
        const aiRank = await rankCandidatesWithAi(
          job,
          pool.map((c) => ({
            candidateId: c.userId,
            fullName: c.fullName,
            education: `${c.education} – ${c.university}`,
            location: c.location,
            technicalSkills: c.technicalSkills,
            experience: c.experience,
            projects: c.projects,
            certifications: c.certifications,
          })),
          weights
        );
        const mapped: RankedCandidateResult[] = aiRank.rankings
          .map((r) => {
            const prof = pool.find((p) => p.userId === r.candidateId);
            const app = applications.find(
              (a) => a.candidateId === r.candidateId && a.jobId === job.id
            );
            const isShort = shortlisted.some(
              (s) => s.candidateId === r.candidateId && s.jobId === job.id
            );
            return {
              candidateId: r.candidateId,
              candidateName: prof?.fullName || 'Candidate',
              photoURL: prof?.photoURL,
              education: prof ? `${prof.education} – ${prof.university}` : 'Graduate',
              location: prof?.location || 'India',
              email: prof?.email,
              matchScore: r.matchScore,
              skillsMatch: r.skillsMatch,
              educationMatch: r.educationMatch,
              experienceMatch: r.experienceMatch,
              matchedSkills: r.matchedSkills,
              missingSkills: r.missingSkills,
              highlights: r.highlights,
              recommendation: r.recommendation,
              applicationStatus: isShort ? 'Shortlisted' : app?.status || 'Under Review',
              applicationId: app?.id,
              remarks: app?.remarks,
              profile: prof,
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore);
        setRankedCandidates(mapped);
        addToast({
          type: 'success',
          title: 'AI Candidate Ranking Complete',
          message: `Ranked ${mapped.length} candidates for ${job.title}.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Candidate ranking failed.';
        setAiError(msg);
        addToast({ type: 'error', title: 'Ranking Failed', message: msg });
      } finally {
        setIsRankingCandidates(false);
      }
    },
    [addToast, applications, candidatePool, shortlisted, weights]
  );

  const toggleShortlistCandidate = useCallback(
    async (candidateId: string, jobId: string, matchScore: number, notes?: string) => {
      if (!userAccount) return;
      const existing = shortlisted.find(
        (s) => s.candidateId === candidateId && s.jobId === jobId
      );
      if (existing) {
        setShortlisted((prev) => prev.filter((s) => s.id !== existing.id));
        setRankedCandidates((prev) =>
          prev.map((c) =>
            c.candidateId === candidateId ? { ...c, applicationStatus: 'Under Review' } : c
          )
        );
        if (!isDemoMode && firebaseUser?.emailVerified) {
          await fsService.removeShortlisted(existing.id);
        }
        addToast({ type: 'info', title: 'Removed from Shortlist' });
      } else {
        const item: ShortlistedCandidate = {
          id: fsService.makeSafeId('short'),
          recruiterId: userAccount.uid,
          candidateId,
          jobId,
          matchScore,
          notes,
        };
        setShortlisted((prev) => [item, ...prev]);
        setRankedCandidates((prev) =>
          prev.map((c) =>
            c.candidateId === candidateId ? { ...c, applicationStatus: 'Shortlisted' } : c
          )
        );
        if (!isDemoMode && firebaseUser?.emailVerified) {
          await fsService.addShortlisted(item);
        }
        addToast({
          type: 'success',
          title: 'Candidate Shortlisted',
          message: 'Added to your Shortlisted talent pipeline.',
        });
      }
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, shortlisted, userAccount]
  );

  const updateCandidateApplicationStatus = useCallback(
    async (appId: string, status: ApplicationStatus, remarks?: string) => {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, status, remarks: remarks !== undefined ? remarks : a.remarks }
            : a
        )
      );
      setRankedCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === appId
            ? {
                ...c,
                applicationStatus: status,
                remarks: remarks !== undefined ? remarks : c.remarks,
              }
            : c
        )
      );
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.updateApplicationByRecruiter(appId, status, remarks);
      }
      addToast({ type: 'success', title: 'Application Updated', message: `Status set to ${status}.` });
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode]
  );

  const updateRecruiterProfile = useCallback(
    async (profile: RecruiterProfile) => {
      if (!userAccount) return;
      const updated = { ...profile, userId: userAccount.uid };
      setRecruiterProfile(updated);
      if (!isDemoMode && firebaseUser?.emailVerified) {
        const exists = await fsService.getRecruiterProfile(userAccount.uid);
        await fsService.saveRecruiterProfile(updated, !exists);
      }
      addToast({ type: 'success', title: 'Settings Saved' });
    },
    [addToast, firebaseUser?.emailVerified, isDemoMode, userAccount]
  );

  const markNotificationAsRead = useCallback(
    async (notifId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      if (!isDemoMode && firebaseUser?.emailVerified) {
        await fsService.markNotificationRead(notifId);
      }
    },
    [firebaseUser?.emailVerified, isDemoMode]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!isDemoMode && firebaseUser?.emailVerified) {
      await Promise.all(unreadIds.map((id) => fsService.markNotificationRead(id)));
    }
  }, [firebaseUser?.emailVerified, isDemoMode, notifications]);

  return (
    <AppContext.Provider
      value={{
        authReady,
        firebaseUser,
        userAccount,
        isDemoMode,
        role: userAccount?.role ?? null,
        emailVerifiedWarning,
        darkMode,
        toggleDarkMode,
        candidatePage,
        setCandidatePage,
        recruiterPage,
        setRecruiterPage,
        editingJob,
        setEditingJob,
        candidateProfile,
        recruiterProfile,
        resumes,
        activeResumeId,
        setActiveResumeId,
        jobs,
        jobMatches,
        skillGap,
        applications,
        savedJobs,
        shortlisted,
        notifications,
        candidatePool,
        rankedCandidates,
        weights,
        setWeights,
        isLoadingData,
        isAnalyzingResume,
        isMatchingJobs,
        isAnalyzingSkillGap,
        isRankingCandidates,
        aiError,
        clearAiError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        sendResetPassword,
        resendVerificationEmail,
        refreshEmailVerification,
        enterDemoMode,
        logout,
        updateCandidateProfile,
        uploadAndAnalyzeResume,
        reanalyzeResume,
        deleteResume,
        runJobMatching,
        runSkillGapAnalysis,
        applyToJob,
        withdrawCandidateApplication,
        toggleSaveJob,
        createOrUpdateJob,
        deleteJob,
        toggleJobStatus,
        runCandidateRanking,
        toggleShortlistCandidate,
        updateCandidateApplicationStatus,
        updateRecruiterProfile,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        toasts,
        addToast,
        removeToast,
        confirmDialog,
        requestConfirm,
        closeConfirm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
