import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import type {
  ApplicationStatus,
  CandidateProfile,
  JobApplication,
  JobMatch,
  JobPosting,
  NotificationItem,
  RecruiterProfile,
  ResumeDocument,
  SavedJob,
  ShortlistedCandidate,
  UserAccount,
} from '../types';

export function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function clampStr(val: string | undefined, max: number): string {
  if (!val) return '';
  return val.slice(0, max);
}

function clampArr(arr: string[] | undefined, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, maxLen));
}

export async function getUserAccount(uid: string): Promise<UserAccount | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserAccount) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserAccount(user: UserAccount): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      stripUndefined({
        uid: user.uid,
        email: clampStr(user.email, 200),
        displayName: clampStr(user.displayName || 'User', 120),
        role: user.role,
        photoURL: user.photoURL ? clampStr(user.photoURL, 500) : undefined,
        companyName: user.companyName ? clampStr(user.companyName, 150) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getCandidateProfile(uid: string): Promise<CandidateProfile | null> {
  const path = `candidate_profiles/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'candidate_profiles', uid));
    return snap.exists() ? (snap.data() as CandidateProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function listOpenCandidateProfiles(): Promise<CandidateProfile[]> {
  const path = 'candidate_profiles';
  try {
    const q = query(collection(db, 'candidate_profiles'), where('isOpenToWork', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as CandidateProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCandidateProfile(
  profile: CandidateProfile,
  isNew: boolean
): Promise<void> {
  const path = `candidate_profiles/${profile.userId}`;
  const payload = stripUndefined({
    userId: profile.userId,
    fullName: clampStr(profile.fullName || 'Candidate', 120),
    headline: clampStr(profile.headline, 200),
    location: clampStr(profile.location, 150),
    education: clampStr(profile.education, 200),
    university: clampStr(profile.university, 200),
    graduationYear: clampStr(profile.graduationYear, 20),
    technicalSkills: clampArr(profile.technicalSkills, 60, 80),
    softSkills: clampArr(profile.softSkills, 30, 80),
    experience: (profile.experience || []).slice(0, 25),
    projects: (profile.projects || []).slice(0, 25),
    certifications: clampArr(profile.certifications, 30, 150),
    linkedIn: clampStr(profile.linkedIn, 300),
    github: clampStr(profile.github, 300),
    photoURL: profile.photoURL ? clampStr(profile.photoURL, 500) : undefined,
    isOpenToWork: Boolean(profile.isOpenToWork),
    updatedAt: serverTimestamp(),
  });

  try {
    if (isNew) {
      await setDoc(doc(db, 'candidate_profiles', profile.userId), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'candidate_profiles', profile.userId), payload);
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function getRecruiterProfile(uid: string): Promise<RecruiterProfile | null> {
  const path = `recruiter_profiles/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'recruiter_profiles', uid));
    return snap.exists() ? (snap.data() as RecruiterProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveRecruiterProfile(
  profile: RecruiterProfile,
  isNew: boolean
): Promise<void> {
  const path = `recruiter_profiles/${profile.userId}`;
  const payload = stripUndefined({
    userId: profile.userId,
    fullName: clampStr(profile.fullName || 'Recruiter', 120),
    companyName: clampStr(profile.companyName || 'Company', 150),
    companyWebsite: clampStr(profile.companyWebsite, 300),
    location: clampStr(profile.location, 150),
    industry: clampStr(profile.industry, 100),
    photoURL: profile.photoURL ? clampStr(profile.photoURL, 500) : undefined,
    updatedAt: serverTimestamp(),
  });
  try {
    if (isNew) {
      await setDoc(doc(db, 'recruiter_profiles', profile.userId), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'recruiter_profiles', profile.userId), payload);
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function uploadResumeBinary(userId: string, resumeId: string, file: File): Promise<string | null> {
  try {
    const storageRef = ref(storage, `resumes/${userId}/${resumeId}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch {
    // Graceful fallback if Firebase Storage rules/CORS are not initialized yet
    return null;
  }
}

export async function listUserResumes(userId: string): Promise<ResumeDocument[]> {
  const path = 'resumes';
  try {
    const q = query(collection(db, 'resumes'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ResumeDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listSharedResumes(): Promise<ResumeDocument[]> {
  const path = 'resumes';
  try {
    const q = query(collection(db, 'resumes'), where('isSharedWithRecruiters', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ResumeDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveResumeDocument(resume: ResumeDocument, isNew: boolean): Promise<void> {
  const path = `resumes/${resume.id}`;
  const payload = stripUndefined({
    id: resume.id,
    userId: resume.userId,
    fileName: clampStr(resume.fileName, 255),
    fileSize: Math.min(Number(resume.fileSize || 0), 10485760),
    fileType: clampStr(resume.fileType, 120),
    rawText: clampStr(resume.rawText, 50000),
    summary: clampStr(resume.summary, 3000),
    parsedData: resume.parsedData,
    status: resume.status,
    isSharedWithRecruiters: Boolean(resume.isSharedWithRecruiters),
    updatedAt: serverTimestamp(),
  });
  try {
    if (isNew) {
      await setDoc(doc(db, 'resumes', resume.id), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      const skillDocId = makeSafeId('skills');
      await setDoc(doc(db, 'extracted_skills', skillDocId), {
        id: skillDocId,
        userId: resume.userId,
        resumeId: resume.id,
        technicalSkills: clampArr(resume.parsedData.skills.technicalSkills, 60, 80),
        programmingLanguages: clampArr(resume.parsedData.skills.programmingLanguages, 40, 80),
        frameworks: clampArr(resume.parsedData.skills.frameworks, 40, 80),
        tools: clampArr(resume.parsedData.skills.tools, 40, 80),
        softSkills: clampArr(resume.parsedData.skills.softSkills, 30, 80),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'resumes', resume.id), {
        fileName: payload.fileName,
        rawText: payload.rawText,
        summary: payload.summary,
        parsedData: payload.parsedData,
        status: payload.status,
        isSharedWithRecruiters: payload.isSharedWithRecruiters,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteResumeDocument(resumeId: string): Promise<void> {
  const path = `resumes/${resumeId}`;
  try {
    await deleteDoc(doc(db, 'resumes', resumeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listPublishedJobs(): Promise<JobPosting[]> {
  const path = 'jobs';
  try {
    const q = query(collection(db, 'jobs'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as JobPosting);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listRecruiterJobs(recruiterId: string): Promise<JobPosting[]> {
  const path = 'jobs';
  try {
    const q = query(collection(db, 'jobs'), where('recruiterId', '==', recruiterId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as JobPosting);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveJobPosting(job: JobPosting, isNew: boolean): Promise<void> {
  const path = `jobs/${job.id}`;
  const payload = stripUndefined({
    id: job.id,
    recruiterId: job.recruiterId,
    title: clampStr(job.title, 150),
    companyName: clampStr(job.companyName, 150),
    description: clampStr(job.description, 15000),
    requiredSkills: clampArr(job.requiredSkills, 30, 80),
    preferredSkills: clampArr(job.preferredSkills, 30, 80),
    educationRequirement: clampStr(job.educationRequirement, 200),
    experienceRequired: clampStr(job.experienceRequired, 100),
    salaryRange: clampStr(job.salaryRange, 100),
    location: clampStr(job.location, 150),
    jobType: clampStr(job.jobType, 60),
    vacancies: Math.max(1, Math.min(500, Number(job.vacancies || 1))),
    deadline: clampStr(job.deadline, 40),
    status: job.status,
    updatedAt: serverTimestamp(),
  });
  try {
    if (isNew) {
      await setDoc(doc(db, 'jobs', job.id), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'jobs', job.id), payload);
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listUserJobMatches(userId: string): Promise<JobMatch[]> {
  const path = 'job_matches';
  try {
    const q = query(collection(db, 'job_matches'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as JobMatch);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveJobMatch(match: JobMatch): Promise<void> {
  const path = `job_matches/${match.id}`;
  try {
    await setDoc(doc(db, 'job_matches', match.id), {
      id: match.id,
      userId: match.userId,
      jobId: match.jobId,
      resumeId: match.resumeId,
      recruiterId: match.recruiterId,
      overallScore: Math.round(match.overallScore),
      skillsMatch: Math.round(match.skillsMatch),
      educationMatch: Math.round(match.educationMatch),
      experienceMatch: Math.round(match.experienceMatch),
      projectRelevance: Math.round(match.projectRelevance),
      locationMatch: Math.round(match.locationMatch),
      matchedSkills: clampArr(match.matchedSkills, 40, 80),
      missingSkills: clampArr(match.missingSkills, 40, 80),
      explanation: clampStr(match.explanation, 2000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listCandidateApplications(candidateId: string): Promise<JobApplication[]> {
  const path = 'applications';
  try {
    const q = query(collection(db, 'applications'), where('candidateId', '==', candidateId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as JobApplication);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listRecruiterApplications(recruiterId: string): Promise<JobApplication[]> {
  const path = 'applications';
  try {
    const q = query(collection(db, 'applications'), where('recruiterId', '==', recruiterId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as JobApplication);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createApplication(app: JobApplication): Promise<void> {
  const path = `applications/${app.id}`;
  try {
    await setDoc(
      doc(db, 'applications', app.id),
      stripUndefined({
        id: app.id,
        jobId: app.jobId,
        recruiterId: app.recruiterId,
        candidateId: app.candidateId,
        candidateName: clampStr(app.candidateName, 120),
        candidateEmail: clampStr(app.candidateEmail, 200),
        candidateEducation: clampStr(app.candidateEducation, 200),
        resumeId: app.resumeId,
        jobTitle: clampStr(app.jobTitle, 150),
        companyName: clampStr(app.companyName, 150),
        matchScore: Math.round(app.matchScore),
        matchedSkills: clampArr(app.matchedSkills, 40, 80),
        missingSkills: clampArr(app.missingSkills, 40, 80),
        status: 'Applied',
        remarks: app.remarks ? clampStr(app.remarks, 2000) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplicationByRecruiter(
  appId: string,
  status: ApplicationStatus,
  remarks?: string
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    await updateDoc(
      doc(db, 'applications', appId),
      stripUndefined({
        status,
        remarks: remarks !== undefined ? clampStr(remarks, 2000) : undefined,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function withdrawApplication(appId: string): Promise<void> {
  const path = `applications/${appId}`;
  try {
    await deleteDoc(doc(db, 'applications', appId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listSavedJobs(userId: string): Promise<SavedJob[]> {
  const path = 'saved_jobs';
  try {
    const q = query(collection(db, 'saved_jobs'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedJob);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addSavedJob(saved: SavedJob): Promise<void> {
  const path = `saved_jobs/${saved.id}`;
  try {
    await setDoc(doc(db, 'saved_jobs', saved.id), {
      id: saved.id,
      userId: saved.userId,
      jobId: saved.jobId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeSavedJob(savedId: string): Promise<void> {
  const path = `saved_jobs/${savedId}`;
  try {
    await deleteDoc(doc(db, 'saved_jobs', savedId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listShortlisted(recruiterId: string): Promise<ShortlistedCandidate[]> {
  const path = 'shortlisted_candidates';
  try {
    const q = query(
      collection(db, 'shortlisted_candidates'),
      where('recruiterId', '==', recruiterId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ShortlistedCandidate);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addShortlisted(item: ShortlistedCandidate): Promise<void> {
  const path = `shortlisted_candidates/${item.id}`;
  try {
    await setDoc(
      doc(db, 'shortlisted_candidates', item.id),
      stripUndefined({
        id: item.id,
        recruiterId: item.recruiterId,
        candidateId: item.candidateId,
        jobId: item.jobId,
        matchScore: Math.round(item.matchScore),
        notes: item.notes ? clampStr(item.notes, 2000) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeShortlisted(shortlistId: string): Promise<void> {
  const path = `shortlisted_candidates/${shortlistId}`;
  try {
    await deleteDoc(doc(db, 'shortlisted_candidates', shortlistId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listUserNotifications(userId: string): Promise<NotificationItem[]> {
  const path = 'notifications';
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as NotificationItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createNotification(item: NotificationItem): Promise<void> {
  const path = `notifications/${item.id}`;
  try {
    await setDoc(doc(db, 'notifications', item.id), {
      id: item.id,
      userId: item.userId,
      title: clampStr(item.title, 150),
      message: clampStr(item.message, 500),
      type: item.type,
      read: item.read,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
