import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSavedJobs } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import JobCard from '../../components/jobs/JobCard';
import './Candidate.css';

export default function SavedJobs() {
  const { authUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    getSavedJobs(authUser.id).then(setJobs).catch(() => {}).finally(() => setLoading(false));
  }, [authUser]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Offres sauvegardées</h1>
        <p>{jobs.length} offre{jobs.length > 1 ? 's' : ''} dans vos favoris</p>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune offre sauvegardée</h3>
          <p>Sauvegardez des offres pour y revenir plus tard</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>Explorer les offres</Link>
        </div>
      ) : (
        <div className="saved-jobs-grid">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
