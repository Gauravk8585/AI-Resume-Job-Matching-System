import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseJsonSafe<T>(rawText: string | undefined, fallbackMsg: string): T {
  if (!rawText) {
    throw new Error(fallbackMsg);
  }
  const trimmed = rawText.trim();
  const cleaned = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    : trimmed;
  return JSON.parse(cleaned) as T;
}

function formatAiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('GEMINI_API_KEY')) {
    return { status: 503, message: 'Gemini API key is not configured in Settings > Secrets.' };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return { status: 403, message: 'Gemini API key is invalid or unauthorized. Please check Settings > Secrets.' };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return { status: 429, message: 'AI rate limit reached. Please wait a moment and retry.' };
  }
  return { status: 500, message: msg || 'AI analysis failed. Please try again.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  });

  // 1. Parse Resume & Extract Structured Information + Summary
  app.post('/api/ai/parse-resume', async (req, res) => {
    try {
      const { rawText, fileName } = req.body as { rawText?: string; fileName?: string };
      if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
        return res.status(400).json({ error: 'Resume text is empty or too short to analyze.' });
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze the following resume document (${fileName || 'resume'}) and extract ONLY facts explicitly present in the text.
CRITICAL RULE: Do NOT invent, assume, or fabricate any skills, degrees, companies, dates, or contact info that do not appear in the document. Use empty strings "" or empty arrays [] for missing fields.

RESUME TEXT:
${rawText.slice(0, 32000)}`,
        config: {
          systemInstruction:
            'You are a precise ATS resume parser. Extract structured facts verbatim or faithfully from the resume text without hallucinating missing credentials.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              candidateName: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              headline: { type: Type.STRING },
              totalExperienceText: { type: Type.STRING },
              expectedSalary: { type: Type.STRING },
              noticePeriod: { type: Type.STRING },
              summary: { type: Type.STRING },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    year: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                },
              },
              skills: {
                type: Type.OBJECT,
                properties: {
                  technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  programmingLanguages: { type: Type.ARRAY, items: { type: Type.STRING } },
                  frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                  softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    company: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    type: { type: Type.STRING },
                    highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
              achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });

      const parsed = parseJsonSafe<Record<string, unknown>>(
        response.text,
        'AI returned an empty response while parsing the resume.'
      );
      return res.json({ parsed });
    } catch (err) {
      const formatted = formatAiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Match Candidate Resume Against Job Postings with Explainable Weights
  app.post('/api/ai/match-jobs', async (req, res) => {
    try {
      const { candidateProfile, jobs, weights } = req.body as {
        candidateProfile?: Record<string, unknown>;
        jobs?: Array<Record<string, unknown>>;
        weights?: {
          technicalSkills: number;
          education: number;
          experience: number;
          projectRelevance: number;
          location: number;
        };
      };

      if (!candidateProfile || !Array.isArray(jobs) || jobs.length === 0) {
        return res.status(400).json({ error: 'Candidate profile and at least one job are required.' });
      }

      const w = weights || {
        technicalSkills: 40,
        education: 15,
        experience: 20,
        projectRelevance: 15,
        location: 10,
      };

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Evaluate how well this candidate matches each job posting.
Use ONLY the candidate's actual documented skills, education, experience, projects, and location. Do not invent skills.
Scoring Weights:
- Technical Skills: ${w.technicalSkills}%
- Education: ${w.education}%
- Experience: ${w.experience}%
- Project Relevance: ${w.projectRelevance}%
- Location: ${w.location}%

Calculate each sub-score (0-100) and compute overallScore as the weighted average rounded to an integer.

CANDIDATE:
${JSON.stringify(candidateProfile).slice(0, 14000)}

JOBS:
${JSON.stringify(jobs.slice(0, 15)).slice(0, 16000)}`,
        config: {
          systemInstruction:
            'You are an explainable AI career matching engine. Compare candidate facts strictly against job requirements and output calibrated scores and honest explanations.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSummary: { type: Type.STRING },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    jobId: { type: Type.STRING },
                    overallScore: { type: Type.INTEGER },
                    skillsMatch: { type: Type.INTEGER },
                    educationMatch: { type: Type.INTEGER },
                    experienceMatch: { type: Type.INTEGER },
                    projectRelevance: { type: Type.INTEGER },
                    locationMatch: { type: Type.INTEGER },
                    matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    explanation: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const result = parseJsonSafe<Record<string, unknown>>(
        response.text,
        'AI returned an empty matching result.'
      );
      return res.json(result);
    } catch (err) {
      const formatted = formatAiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Skill Gap Analysis & Personalized Learning Roadmap
  app.post('/api/ai/skill-gap', async (req, res) => {
    try {
      const { candidateProfile, targetJob } = req.body as {
        candidateProfile?: Record<string, unknown>;
        targetJob?: Record<string, unknown>;
      };

      if (!candidateProfile || !targetJob) {
        return res.status(400).json({ error: 'Candidate profile and target job are required.' });
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Perform an honest skill gap analysis comparing the candidate's actual resume/profile against the target job requirements.
Do not assume skills the candidate has not listed. Rate proficiency on a 1-10 scale based on evidence in the resume (projects, experience, certifications). For missing skills, set candidateLevel between 0 and 4.

CANDIDATE:
${JSON.stringify(candidateProfile).slice(0, 14000)}

TARGET JOB:
${JSON.stringify(targetJob).slice(0, 8000)}`,
        config: {
          systemInstruction:
            'You are a technical career mentor. Provide accurate skill gap diagnostics and structured, realistic learning roadmaps.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallMatchScore: { type: Type.INTEGER },
              potentialScoreAfterLearning: { type: Type.INTEGER },
              readinessLevel: { type: Type.STRING },
              aiInsight: { type: Type.STRING },
              matchedSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    candidateLevel: { type: Type.INTEGER },
                    requiredLevel: { type: Type.INTEGER },
                  },
                },
              },
              missingSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    candidateLevel: { type: Type.INTEGER },
                    requiredLevel: { type: Type.INTEGER },
                    whyImportant: { type: Type.STRING },
                    estimatedHours: { type: Type.STRING },
                    roadmapSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedResources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          provider: { type: Type.STRING },
                          type: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const result = parseJsonSafe<Record<string, unknown>>(
        response.text,
        'AI returned an empty skill gap analysis.'
      );
      return res.json(result);
    } catch (err) {
      const formatted = formatAiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 4. Recruiter AI Candidate Ranking
  app.post('/api/ai/rank-candidates', async (req, res) => {
    try {
      const { job, candidates, weights } = req.body as {
        job?: Record<string, unknown>;
        candidates?: Array<Record<string, unknown>>;
        weights?: {
          technicalSkills: number;
          education: number;
          experience: number;
          projectRelevance: number;
          location: number;
        };
      };

      if (!job || !Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: 'Job details and candidates are required.' });
      }

      const w = weights || {
        technicalSkills: 40,
        education: 15,
        experience: 20,
        projectRelevance: 15,
        location: 10,
      };

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Rank the following candidates for this job vacancy based ONLY on their documented profiles.
Weights: Technical Skills ${w.technicalSkills}%, Education ${w.education}%, Experience ${w.experience}%, Project Relevance ${w.projectRelevance}%, Location ${w.location}%.

JOB:
${JSON.stringify(job).slice(0, 8000)}

CANDIDATES:
${JSON.stringify(candidates.slice(0, 20)).slice(0, 18000)}`,
        config: {
          systemInstruction:
            'You are a recruitment evaluation engine. Rank candidates objectively with explainable match scores, matched/missing skills, and concise key highlights.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rankings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    candidateId: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER },
                    skillsMatch: { type: Type.INTEGER },
                    educationMatch: { type: Type.INTEGER },
                    experienceMatch: { type: Type.INTEGER },
                    matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendation: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const result = parseJsonSafe<Record<string, unknown>>(
        response.text,
        'AI returned an empty candidate ranking.'
      );
      return res.json(result);
    } catch (err) {
      const formatted = formatAiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 5. Analyze Job Description to assist recruiters
  app.post('/api/ai/analyze-job', async (req, res) => {
    try {
      const { title, description } = req.body as { title?: string; description?: string };
      if (!description || description.trim().length < 20) {
        return res.status(400).json({ error: 'Please provide a job description of at least 20 characters.' });
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Extract structured job requirements from this job posting:
Title: ${title || ''}
Description: ${description.slice(0, 12000)}`,
        config: {
          systemInstruction:
            'Extract clean required skills, preferred skills, education requirement, and experience level from the job description.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              educationRequirement: { type: Type.STRING },
              experienceRequired: { type: Type.STRING },
            },
          },
        },
      });

      const result = parseJsonSafe<Record<string, unknown>>(
        response.text,
        'AI could not extract job requirements.'
      );
      return res.json(result);
    } catch (err) {
      const formatted = formatAiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Mount Vite dev middleware or serve static build
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { index: 'index.html' }));
      app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'API endpoint not found.' });
      });
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Resume & Job Matching System listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
