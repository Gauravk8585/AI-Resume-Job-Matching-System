export type UserRole = 'candidate' | 'recruiter';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected';

export interface ScoringWeights {
  technicalSkills: number;
  education: number;
  experience: number;
  projectRelevance: number;
  location: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  technicalSkills: 40,
  education: 15,
  experience: 20,
  projectRelevance: 15,
  location: 10,
};

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  companyName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  type: string;
  highlights: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface CandidateProfile {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  headline: string;
  location: string;
  education: string;
  university: string;
  graduationYear: string;
  technicalSkills: string[];
  softSkills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: string[];
  linkedIn?: string;
  github?: string;
  photoURL?: string;
  isOpenToWork: boolean;
  isSampleData?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RecruiterProfile {
  userId: string;
  fullName: string;
  companyName: string;
  companyWebsite?: string;
  location: string;
  industry?: string;
  photoURL?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ParsedResumeData {
  candidateName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  totalExperienceText: string;
  expectedSalary: string;
  noticePeriod: string;
  summary: string;
  education: EducationItem[];
  skills: {
    technicalSkills: string[];
    programmingLanguages: string[];
    frameworks: string[];
    tools: string[];
    softSkills: string[];
  };
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: string[];
  achievements: string[];
}

export interface ResumeDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  rawText: string;
  summary: string;
  parsedData: ParsedResumeData;
  status: 'pending' | 'analyzed' | 'failed';
  isSharedWithRecruiters: boolean;
  uploadedDateLabel?: string;
  fileDataUrl?: string;
  isSampleData?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JobPosting {
  id: string;
  recruiterId: string;
  title: string;
  companyName: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirement: string;
  experienceRequired: string;
  salaryRange: string;
  salaryNumeric?: number;
  location: string;
  jobType: 'Full Time' | 'Part Time' | 'Internship' | 'Contract' | 'Remote';
  vacancies: number;
  deadline: string;
  status: 'published' | 'draft' | 'closed';
  roleCategory?: string;
  isSampleData?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JobMatch {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  recruiterId: string;
  overallScore: number;
  skillsMatch: number;
  educationMatch: number;
  experienceMatch: number;
  projectRelevance: number;
  locationMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  isSampleData?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SkillProficiency {
  skill: string;
  candidateLevel: number;
  requiredLevel: number;
}

export interface MissingSkillPlan {
  skill: string;
  candidateLevel: number;
  requiredLevel: number;
  whyImportant: string;
  estimatedHours: string;
  roadmapSteps: string[];
  suggestedResources: {
    title: string;
    provider: string;
    type: string;
  }[];
}

export interface SkillGapResult {
  jobId: string;
  jobTitle: string;
  overallMatchScore: number;
  potentialScoreAfterLearning: number;
  readinessLevel: string;
  aiInsight: string;
  matchedSkills: SkillProficiency[];
  missingSkills: MissingSkillPlan[];
  isSampleData?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  recruiterId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateEducation: string;
  resumeId?: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  status: ApplicationStatus;
  remarks?: string;
  appliedDateLabel?: string;
  isSampleData?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  createdAt?: unknown;
}

export interface ShortlistedCandidate {
  id: string;
  recruiterId: string;
  candidateId: string;
  jobId: string;
  matchScore: number;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'application' | 'shortlist' | 'analysis' | 'system';
  read: boolean;
  timeLabel?: string;
  createdAt?: unknown;
}

export interface RankedCandidateResult {
  candidateId: string;
  candidateName: string;
  photoURL?: string;
  education: string;
  location: string;
  email?: string;
  matchScore: number;
  skillsMatch: number;
  educationMatch: number;
  experienceMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
  highlights: string[];
  recommendation: string;
  applicationStatus: ApplicationStatus | 'Not Applied';
  applicationId?: string;
  remarks?: string;
  resume?: ResumeDocument;
  profile?: CandidateProfile;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
