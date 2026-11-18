import type {
  CandidateProfile,
  JobPosting,
  ParsedResumeData,
  ScoringWeights,
} from '../types';

async function postAi<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI request failed (${res.status}).`);
  }
  return data as T;
}

export async function parseResumeWithAi(
  rawText: string,
  fileName: string
): Promise<ParsedResumeData> {
  const data = await postAi<{ parsed: ParsedResumeData }>('/api/ai/parse-resume', {
    rawText,
    fileName,
  });
  return data.parsed;
}

export interface AiJobMatchResponse {
  overallSummary: string;
  matches: Array<{
    jobId: string;
    overallScore: number;
    skillsMatch: number;
    educationMatch: number;
    experienceMatch: number;
    projectRelevance: number;
    locationMatch: number;
    matchedSkills: string[];
    missingSkills: string[];
    explanation: string;
  }>;
}

export async function matchJobsWithAi(
  candidateProfile: Partial<CandidateProfile> & { parsedResume?: ParsedResumeData },
  jobs: JobPosting[],
  weights: ScoringWeights
): Promise<AiJobMatchResponse> {
  return postAi<AiJobMatchResponse>('/api/ai/match-jobs', {
    candidateProfile,
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      companyName: j.companyName,
      description: j.description,
      requiredSkills: j.requiredSkills,
      preferredSkills: j.preferredSkills,
      educationRequirement: j.educationRequirement,
      experienceRequired: j.experienceRequired,
      location: j.location,
      jobType: j.jobType,
    })),
    weights,
  });
}

export interface AiSkillGapResponse {
  overallMatchScore: number;
  potentialScoreAfterLearning: number;
  readinessLevel: string;
  aiInsight: string;
  matchedSkills: Array<{ skill: string; candidateLevel: number; requiredLevel: number }>;
  missingSkills: Array<{
    skill: string;
    candidateLevel: number;
    requiredLevel: number;
    whyImportant: string;
    estimatedHours: string;
    roadmapSteps: string[];
    suggestedResources: { title: string; provider: string; type: string }[];
  }>;
}

export async function analyzeSkillGapWithAi(
  candidateProfile: Partial<CandidateProfile> & { parsedResume?: ParsedResumeData },
  targetJob: JobPosting
): Promise<AiSkillGapResponse> {
  return postAi<AiSkillGapResponse>('/api/ai/skill-gap', {
    candidateProfile,
    targetJob: {
      id: targetJob.id,
      title: targetJob.title,
      companyName: targetJob.companyName,
      description: targetJob.description,
      requiredSkills: targetJob.requiredSkills,
      preferredSkills: targetJob.preferredSkills,
      educationRequirement: targetJob.educationRequirement,
      experienceRequired: targetJob.experienceRequired,
    },
  });
}

export interface AiCandidateRankResponse {
  rankings: Array<{
    candidateId: string;
    matchScore: number;
    skillsMatch: number;
    educationMatch: number;
    experienceMatch: number;
    matchedSkills: string[];
    missingSkills: string[];
    highlights: string[];
    recommendation: string;
  }>;
}

export async function rankCandidatesWithAi(
  job: JobPosting,
  candidates: Array<{
    candidateId: string;
    fullName: string;
    education: string;
    location: string;
    technicalSkills: string[];
    experience: unknown[];
    projects: unknown[];
    certifications: string[];
  }>,
  weights: ScoringWeights
): Promise<AiCandidateRankResponse> {
  return postAi<AiCandidateRankResponse>('/api/ai/rank-candidates', {
    job: {
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      educationRequirement: job.educationRequirement,
      experienceRequired: job.experienceRequired,
      location: job.location,
    },
    candidates,
    weights,
  });
}

export async function analyzeJobDescriptionWithAi(
  title: string,
  description: string
): Promise<{
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirement: string;
  experienceRequired: string;
}> {
  return postAi('/api/ai/analyze-job', { title, description });
}
