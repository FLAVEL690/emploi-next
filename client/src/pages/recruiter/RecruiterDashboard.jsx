import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiUsers, FiEye, FiPlusCircle } from 'react-icons/fi';
import { getMyJobs } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Recruiter.css';

export default function RecruiterDashboard() {
  const { authUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      getMyJobs(authUser.id).then(setJobs).catch(() => {}).finally(() => setLoading(false));
    }
  }, [authUser]);

  const totalApps = jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0);
  const activeJobs = jobs.filter(j => j.is_active && new Date(j.expires_at) > new Date()).length;
  const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="recruiter-dashboard">
      <div className="page-header">
        <h1>Dashboard Recruteur</h1>
        <p>Gérez vos offres et suivez vos candidatures</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiBriefcase /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{activeJobs}</span>
            <span className="stat-card-label">Offres actives</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiUsers /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{totalApps}</span>
            <span className="stat-card-label">Candidatures</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiEye /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{totalViews}</span>
            <span className="stat-card-label">Vues totales</span>
          </div>
        </div>
      </div>

      <div className="section-header-row">
        <h2>Mes offres récentes</h2>
        <Link to="/recruiter/post-job" className="btn btn-primary btn-sm"><FiPlusCircle /> Nouvelle offre</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune offre publiée</h3>
          <p>Commencez par publier votre première offre d'emploi</p>
          <Link to="/recruiter/post-job" className="btn btn-primary" style={{ marginTop: '16px' }}>Publier une offre</Link>
        </div>
      ) : (
        <div className="jobs-table">
          <table>
            <thead><tr><th>Poste</th><th>Candidatures</th><th>Vues</th><th>Statut</th><th>Expiration</th></tr></thead>
            <tbody>
              {jobs.slice(0, 5).map(job => (
                <tr key={job.id}>
                  <td><Link to={`/recruiter/jobs/${job.id}`} className="job-link">{job.title}</Link><small>{job.company}</small></td>
                  <td><span className="badge badge-info">{job.applicationCount || 0}</span></td>
                  <td>{job.views || 0}</td>
                  <td>{job.is_active && new Date(job.expires_at) > new Date() ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Expirée</span>}</td>
                  <td>{new Date(job.expires_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
