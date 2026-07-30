import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTarget, FiUsers } from 'react-icons/fi';
import { getMyJobs } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Recruiter.css';

export default function Matching() {
  const { authUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    getMyJobs(authUser.id)
      .then(data => setJobs(data.filter(j => j.is_active && new Date(j.expires_at) > new Date())))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authUser]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1><FiTarget style={{ marginRight: 8 }} /> Matching</h1>
        <p>Trouvez les candidats les plus compatibles avec vos offres</p>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune offre active</h3>
          <p>Publiez une offre pour voir les candidats potentiels</p>
          <Link to="/recruiter/post-job" className="btn btn-primary" style={{ marginTop: '16px' }}>Publier une offre</Link>
        </div>
      ) : (
        <div className="matching-jobs-list">
          {jobs.map(job => (
            <Link key={job.id} to={`/recruiter/jobs/${job.id}/matching`} className="matching-job-card card">
              <div className="matching-job-info">
                <h3>{job.title}</h3>
                <p>{job.city}, {job.country} — {job.category}</p>
                {job.skills?.length > 0 && (
                  <div className="skills-tags" style={{ marginTop: 8 }}>
                    {job.skills.map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="matching-job-action">
                <FiUsers size={16} />
                <span>Voir les candidats</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
