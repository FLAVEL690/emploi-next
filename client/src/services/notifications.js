import { supabase } from './supabase';
import { computeMatchScore } from './matching';

export async function notifyMatchingOnJobCreated(job) {
  const { data: candidates } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'candidate');

  if (!candidates || candidates.length === 0) return;

  const matchedCandidates = candidates
    .map(c => ({ ...c, matchScore: computeMatchScore(c, job) }))
    .filter(c => c.matchScore >= 70);

  if (matchedCandidates.length === 0) return;

  const candidateNotifications = matchedCandidates.map(c => ({
    user_id: c.id,
    type: 'job_match',
    message: `Nouvelle offre "${job.title}" chez ${job.company} correspond à votre profil (${c.matchScore}% compatible)`,
    related_id: job.id
  }));

  await supabase.from('notifications').insert(candidateNotifications);

  await supabase.from('notifications').insert({
    user_id: job.recruiter_id,
    type: 'candidates_match',
    message: `${matchedCandidates.length} candidat(s) potentiel(s) correspondent à votre offre "${job.title}" à 70%+`,
    related_id: job.id
  });
}
