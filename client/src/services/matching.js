import { supabase } from './supabase';

export function computeMatchScore(candidate, job) {
  let score = 0;
  const maxScore = 100;

  // Skills match (40 points max)
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
  const jobSkills = (job.skills || []).map(s => s.toLowerCase().trim());
  if (jobSkills.length > 0 && candidateSkills.length > 0) {
    const matched = candidateSkills.filter(s => jobSkills.includes(s)).length;
    score += Math.round((matched / jobSkills.length) * 40);
  } else if (jobSkills.length === 0 && candidateSkills.length > 0) {
    // Pas de skills sur l'offre — bonus partiel si le candidat a des compétences
    score += 15;
  }

  // Category match (25 points)
  const preferredCategories = (candidate.preferred_categories || []).map(c => c.toLowerCase());
  if (preferredCategories.length > 0 && job.category) {
    if (preferredCategories.includes(job.category.toLowerCase())) {
      score += 25;
    }
  }

  // Location match (15 points)
  if (candidate.city && job.city) {
    if (candidate.city.toLowerCase().trim() === job.city.toLowerCase().trim()) {
      score += 15;
    } else if (candidate.country && job.country &&
      candidate.country.toLowerCase().trim() === job.country.toLowerCase().trim()) {
      score += 8;
    }
  }

  // Experience level match (10 points)
  if (candidate.experience_level && job.experience_level && job.experience_level !== 'any') {
    if (candidate.experience_level === job.experience_level) {
      score += 10;
    } else {
      const levels = ['junior', 'mid', 'senior'];
      const diff = Math.abs(levels.indexOf(candidate.experience_level) - levels.indexOf(job.experience_level));
      if (diff === 1) score += 5;
    }
  } else if (job.experience_level === 'any') {
    score += 5;
  }

  // Job type match (10 points)
  const preferredTypes = (candidate.preferred_types || []).map(t => t.toLowerCase());
  if (preferredTypes.length > 0 && job.type) {
    if (preferredTypes.includes(job.type.toLowerCase())) {
      score += 10;
    }
  }

  return Math.min(score, maxScore);
}

export async function getMatchingJobsForCandidate(candidateId) {
  const { data: candidate } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (!candidate) return [];

  const now = new Date().toISOString();
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, profiles!jobs_recruiter_id_fkey(first_name, last_name, avatar)')
    .eq('is_active', true)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!jobs || jobs.length === 0) return [];

  const { data: applied } = await supabase
    .from('applications')
    .select('job_id')
    .eq('candidate_id', candidateId);

  const appliedIds = new Set((applied || []).map(a => a.job_id));

  return jobs
    .filter(job => !appliedIds.has(job.id))
    .map(job => ({
      ...job,
      matchScore: computeMatchScore(candidate, job)
    }))
    .filter(job => job.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getMatchingCandidatesForJob(job) {
  const { data: candidates } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'candidate');

  if (!candidates || candidates.length === 0) return [];

  const scored = candidates.map(candidate => ({
    ...candidate,
    matchScore: computeMatchScore(candidate, job)
  }));

  // Afficher tous les candidats triés par score, ceux avec score > 0 d'abord
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 30);
}

export function generateJobDescription({ title, category, type, mode, experienceLevel, skills, city, country, salary }) {
  const typeLabels = {
    'full-time': 'temps plein',
    'part-time': 'temps partiel',
    'contract': 'contrat',
    'internship': 'stage',
    'freelance': 'freelance'
  };

  const modeLabels = {
    'on-site': 'présentiel',
    'remote': 'télétravail',
    'hybrid': 'hybride'
  };

  const levelLabels = {
    'junior': 'junior (0-2 ans)',
    'mid': 'intermédiaire (2-5 ans)',
    'senior': 'senior (5+ ans)',
    'any': 'tous niveaux'
  };

  const location = [city, country].filter(Boolean).join(', ');
  const skillsList = (skills || []).filter(Boolean);

  let description = `Nous recherchons un(e) ${title} en ${typeLabels[type] || type}`;
  if (mode) description += ` (${modeLabels[mode] || mode})`;
  if (location) description += ` basé(e) à ${location}`;
  description += '.\n\n';

  description += `**Catégorie :** ${category}\n`;
  description += `**Niveau :** ${levelLabels[experienceLevel] || 'Tous niveaux'}\n`;
  if (salary) description += `**Rémunération :** ${salary}\n`;
  description += '\n';

  if (skillsList.length > 0) {
    description += '**Compétences requises :**\n';
    skillsList.forEach(skill => {
      description += `- ${skill}\n`;
    });
    description += '\n';
  }

  description += '**Responsabilités principales :**\n';
  description += `- Contribuer activement aux projets dans le domaine ${category}\n`;
  description += `- Collaborer avec les équipes internes pour atteindre les objectifs fixés\n`;
  description += `- Participer à l'amélioration continue des processus\n\n`;

  description += '**Profil recherché :**\n';
  description += `- Niveau d'expérience : ${levelLabels[experienceLevel] || 'Tous niveaux'}\n`;
  if (skillsList.length > 0) {
    description += `- Maîtrise de : ${skillsList.join(', ')}\n`;
  }
  description += '- Capacité à travailler en équipe et bonne communication\n';
  description += '- Autonomie et sens de l\'organisation\n';

  return description;
}
