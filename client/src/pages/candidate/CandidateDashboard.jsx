import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiHeart, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import api from '../../services/api';
import './Candidate.css';

export default function CandidateDashboard() {
  const [applications, setApplications] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/applications/my-applications'),
      api.get('/saved')
    ]).then(([appRes, savedRes]) => {
      setApplications(appRes.data || []);
      setSaved(savedRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Mon Dashboard</h1>
        <p>Suivez vos candidatures et explorez de nouvelles opportunités</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiFileText /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{applications.length}</span>
            <span className="stat-card-label">Candidatures</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiBriefcase /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{statusCounts.shortlisted}</span>
            <span className="stat-card-label">Présélectionnées</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiHeart /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{saved.length}</span>
            <span className="stat-card-label">Favoris</span>
          </div>
        </div>
      </div>

      <div className="section-header-row">
        <h2>Mes candidatures récentes</h2>
        <Link to="/candidate/applications" className="btn btn-secondary btn-sm">
          Voir tout <FiArrowRight />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune candidature</h3>
          <p>Explorez les offres et postulez dès maintenant</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>Voir les offres</Link>
        </div>
      ) : (
        <div className="applications-compact">
          {applications.slice(0, 5).map(app => (
            <div key={app.id} className="app-compact-card card">
              <div className="app-compact-info">
                <h4>{app.title}</h4>
                <p>{app.company} - {app.city}, {app.country}</p>
              </div>
              <span className={`badge ${app.status === 'accepted' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : app.status === 'shortlisted' ? 'badge-primary' : 'badge-warning'}`}>
                {app.status === 'pending' ? 'En attente' : app.status === 'reviewed' ? 'Consultée' : app.status === 'shortlisted' ? 'Présélectionné' : app.status === 'accepted' ? 'Accepté' : 'Rejeté'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
