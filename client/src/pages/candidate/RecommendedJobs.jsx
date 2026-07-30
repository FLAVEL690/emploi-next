import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTarget, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getMatchingJobsForCandidate } from '../../services/matching';
import JobCard from '../../components/jobs/JobCard';
import './Candidate.css';

export default function RecommendedJobs() {
  const { authUser, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    getMatchingJobsForCandidate(authUser.id)
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authUser]);

  const profileIncomplete = !user?.skills?.length && !user?.preferred_categories?.length;

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1><FiTarget style={{ marginRight: 8 }} /> Offres recommandées</h1>
        <p>Des offres sélectionnées selon votre profil et vos compétences</p>
      </div>

      {profileIncomplete && (
        <div className="match-alert">
          <FiAlertCircle size={18} />
          <div>
            <strong>Complétez votre profil pour de meilleures recommandations</strong>
            <p>Ajoutez vos compétences, catégories préférées et niveau d'expérience.</p>
          </div>
          <Link to="/profile" className="btn btn-primary btn-sm">Compléter mon profil</Link>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune recommandation pour le moment</h3>
          <p>Complétez votre profil ou revenez plus tard quand de nouvelles offres seront publiées.</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>Voir toutes les offres</Link>
        </div>
      ) : (
        <div className="recommended-jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="recommended-job-wrapper">
              <div className="match-score-badge" data-score={job.matchScore >= 70 ? 'high' : job.matchScore >= 40 ? 'mid' : 'low'}>
                {job.matchScore}% compatible
              </div>
              <JobCard job={job} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
