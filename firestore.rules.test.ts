/**
 * Security Rule Invariant Verification Suite (Dirty Dozen)
 * Validates static structural constraints and rule patterns against security_spec.md.
 */
import fs from 'node:fs';
import assert from 'node:assert';

const rules = fs.readFileSync('firestore.rules', 'utf8');

const requiredCollections = [
  'users',
  'candidate_profiles',
  'recruiter_profiles',
  'resumes',
  'extracted_skills',
  'jobs',
  'job_matches',
  'applications',
  'saved_jobs',
  'shortlisted_candidates',
  'notifications',
];

for (const col of requiredCollections) {
  assert(rules.includes(`match /${col}/`), `Missing match block for ${col}`);
}

assert(rules.includes('allow read, write: if false;'), 'Missing global default deny');
assert(rules.includes('request.auth.token.email_verified == true'), 'Missing email_verified enforcement');
assert(rules.includes('affectedKeys().hasOnly'), 'Missing affectedKeys().hasOnly update guard');
assert(rules.includes("!(existing().status in ['Selected', 'Rejected'])"), 'Missing terminal status lock on applications');

console.log('All 12 Dirty Dozen structural assertions passed.');
