# Security Specification — AI Resume & Job Matching System

## 1. Data Invariants
1. **User Identity Integrity**: A `users/{userId}` document can only be created or read by `request.auth.uid == userId`. Role (`candidate` or `recruiter`) is immutable after creation to prevent privilege escalation.
2. **PII Isolation**: Sensitive user account fields (`email`, `uid`) in `users` are never listable (`allow list: if false`). Candidate public/recruiter-discoverable profiles (`candidate_profiles`) do not expose raw contact PII unless the candidate explicitly applies to a recruiter's job (`applications`, readable only by `candidateId` and `recruiterId`).
3. **Resume Ownership**: Only the owning candidate (`userId == request.auth.uid`) can create, update, or delete their `resumes` and `extracted_skills` documents.
4. **Job Posting Authority**: Only verified recruiters (`users/{uid}.role == 'recruiter'`) can create `jobs` with `recruiterId == request.auth.uid`. Only the owning recruiter can edit or close their job postings.
5. **Application Lifecycle & Terminal Locking**: Only the candidate (`candidateId == request.auth.uid`) can submit an application, and initial `status` must be `'Applied'` for an existing published job (`exists(/databases/$(database)/documents/jobs/$(incoming().jobId))`). Only the hiring recruiter (`recruiterId == request.auth.uid`) can transition `status` or add `remarks`. Terminal outcomes (`Selected`, `Rejected`) cannot transition `status` again.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must equal `request.time`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Shadow Field Injection on User Create**: `{ uid: "u1", email: "a@b.com", displayName: "A", role: "candidate", isAdmin: true, createdAt: serverTime, updatedAt: serverTime }` -> Rejected (`hasOnly` check).
2. **Privilege Escalation Role Flip on User Update**: `{ role: "recruiter", updatedAt: serverTime }` by a candidate -> Rejected (immutable `role` check).
3. **UID Spoofing on Resume Create**: `{ id: "r1", userId: "victimUid", fileName: "cv.pdf", ... }` -> Rejected (`userId == request.auth.uid`).
4. **Oversized ID Poisoning**: Document ID of 200 chars or containing `/../` -> Rejected (`isValidId` regex + max 128 chars).
5. **Unbounded RawText Exhaustion**: Resume `rawText` > 50,000 chars -> Rejected (`.size() <= 50000`).
6. **Candidate Posting a Job**: Candidate UID attempting `create` on `/jobs/j1` -> Rejected (`isRecruiter()` check).
7. **Orphaned Application Create**: Application referencing non-existent `jobId: "fake_job"` -> Rejected (`exists()` check on `/jobs/$(incoming().jobId)`).
8. **Self-Accepting Application**: Candidate updating their own application `status` to `'Selected'` -> Rejected (status update restricted to `recruiterId == request.auth.uid`).
9. **Terminal State Bypass**: Recruiter changing an application from `'Rejected'` back to `'Applied'` -> Rejected (terminal state gate).
10. **Client-Spoofed Timestamp**: Creating a job with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> Rejected.
11. **Non-Verified Email Write**: Unverified email user attempting write to `/resumes/r1` -> Rejected (`email_verified == true`).
12. **Blanket User List Scrape**: Authenticated user running `getDocs(collection(db, 'users'))` -> Rejected (`allow list: if false`).
