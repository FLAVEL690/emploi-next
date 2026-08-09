import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import { getMyApplications, getOrCreateConversation } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Candidate.css';

export default function MyApplications() {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    getMyApplications(authUser.id).then(setApplications).catch(() => {}).finally(() => setLoading(false));
  }, [authUser]);

  const openChat = async (jobId, recruiterId) => {
    if (!authUser) return;
    try {
      const conv = await getOrCreateConversation(jobId, authUser.id, recruiterId);
      navigate(`/candidate/chat/${conv.id}`);
    } catch {
      alert('Erreur lors de l\'ouverture de la discussion');
    }
  };

  const statusLabels = {
    pending: { label: 'En attente', class: 'badge-warning' },
    reviewed: { label: 'Consultée', class: 'badge-info' },
    shortlisted: { label: 'Présélectionné', class: 'badge-primary' },
    rejected: { label: 'Rejeté', class: 'badge-danger' },
    accepted: { label: 'Accepté', class: 'badge-success' }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Mes Candidatures</h1>
        <p>{applications.length} candidature{applications.length > 1 ? 's' : ''} envoyée{applications.length > 1 ? 's' : ''}</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune candidature</h3>
          <p>Vous n'avez pas encore postulé à une offre</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>Voir les offres</Link>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map(app => (
            <div key={app.id} className="application-card card">
              <div className="app-card-header">
                <div className="app-info">
                  <h3><Link to={`/jobs/${app.job_id}`}>{app.title}</Link></h3>
                  <div className="app-contacts">
                    <span>{app.company}</span>
                    <span>{app.city}, {app.country}</span>
                    <span>{app.type === 'full-time' ? 'Temps plein' : app.type === 'part-time' ? 'Temps partiel' : app.type}</span>
                  </div>
                </div>
                <span className={`badge ${statusLabels[app.status]?.class}`}>
                  {statusLabels[app.status]?.label}
                </span>
              </div>
              <div className="app-date" style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
                Postulé le {new Date(app.created_at).toLocaleDateString('fr-FR')}
              </div>
              <div className="app-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openChat(app.job_id, app.recruiter_id)}>
                  <FiMessageCircle /> Discuter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
