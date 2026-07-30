import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiTarget, FiUser, FiMapPin, FiMail, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getMatchingCandidatesForJob } from '../../services/matching';
import { supabase } from '../../services/supabase';
import './Recruiter.css';

export default function MatchingCandidates() {
  const { jobId } = useParams();
  const { authUser } = useAuth();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser || !jobId) return;

    supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('recruiter_id', authUser.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setJob(data);
        return getMatchingCandidatesForJob(data);
      })
      .then(results => {
        if (results) setCandidates(results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authUser, jobId]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  if (!job) {
    return (
      <div className="empty-state">
        <h3>Offre introuvable</h3>
        <Link to="/recruiter/jobs" className="btn btn-primary">Retour à mes offres</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/recruiter/jobs" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}>
          <FiArrowLeft /> Retour
        </Link>
        <h1><FiTarget style={{ marginRight: 8 }} /> Candidats potentiels</h1>
        <p>Profils compatibles avec : <strong>{job.title}</strong></p>
      </div>

      {candidates.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun candidat correspondant pour le moment</h3>
          <p>Les candidats apparaîtront ici lorsque des profils correspondront à votre offre.</p>
        </div>
      ) : (
        <div className="matching-candidates-list">
          {candidates.map(candidate => (
            <div key={candidate.id} className="candidate-match-card card">
              <div className="candidate-match-header">
                <div className="candidate-match-avatar">
                  {candidate.avatar ? (
                    <img src={candidate.avatar} alt="" />
                  ) : (
                    <div className="avatar-placeholder-sm">
                      <FiUser />
                    </div>
                  )}
                </div>
                <div className="candidate-match-info">
                  <h3>{candidate.first_name} {candidate.last_name}</h3>
                  {candidate.city && (
                    <p className="candidate-match-location">
                      <FiMapPin size={14} /> {candidate.city}{candidate.country ? `, ${candidate.country}` : ''}
                    </p>
                  )}
                </div>
                <div className="match-score-badge" data-score={candidate.matchScore >= 70 ? 'high' : candidate.matchScore >= 40 ? 'mid' : 'low'}>
                  {candidate.matchScore}%
                </div>
              </div>

              {candidate.skills?.length > 0 && (
                <div className="candidate-match-skills">
                  {candidate.skills.map((skill, i) => (
                    <span key={i} className={`skill-tag ${(job.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase()) ? 'skill-matched' : ''}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {candidate.bio && (
                <p className="candidate-match-bio">{candidate.bio.slice(0, 150)}{candidate.bio.length > 150 ? '...' : ''}</p>
              )}

              <div className="candidate-match-actions">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="btn btn-secondary btn-sm">
                    <FiMail size={14} /> Email
                  </a>
                )}
                {candidate.phone && (
                  <a href={`tel:${candidate.phone}`} className="btn btn-secondary btn-sm">
                    <FiPhone size={14} /> Appeler
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
