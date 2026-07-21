import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiFileText } from 'react-icons/fi';
import api from '../../services/api';
import './Recruiter.css';

export default function JobApplications() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/applications/job/${jobId}`).then(res => {
      setApplications(res.data || []);
    }).catch(() => navigate('/recruiter/jobs')).finally(() => setLoading(false));
  }, [jobId]);

  const updateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status } : a));
    } catch (error) {
      alert('Erreur lors de la mise à jour');
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
      <button className="back-btn-inline" onClick={() => navigate('/recruiter/jobs')}>
        <FiArrowLeft /> Retour aux offres
      </button>

      <div className="page-header">
        <h1>Candidatures reçues</h1>
        <p>{applications.length} candidature{applications.length > 1 ? 's' : ''}</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune candidature</h3>
          <p>Vous n'avez pas encore reçu de candidatures pour cette offre</p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map(app => (
            <div key={app.id} className="application-card card">
              <div className="app-card-header">
                <div className="app-avatar">{app.firstName?.[0]}{app.lastName?.[0]}</div>
                <div className="app-info">
                  <h3>{app.firstName} {app.lastName}</h3>
                  <div className="app-contacts">
                    <span><FiMail size={13} /> {app.email}</span>
                    {app.phone && <span><FiPhone size={13} /> {app.phone}</span>}
                    {app.city && <span><FiMapPin size={13} /> {app.city}, {app.country}</span>}
                  </div>
                </div>
                <span className={`badge ${statusLabels[app.status]?.class}`}>
                  {statusLabels[app.status]?.label}
                </span>
              </div>

              {app.bio && <p className="app-bio">{app.bio}</p>}
              {app.coverLetter && (
                <div className="app-cover-letter">
                  <h4><FiFileText /> Lettre de motivation</h4>
                  <p>{app.coverLetter}</p>
                </div>
              )}

              <div className="app-actions">
                <select
                  className="form-control"
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="pending">En attente</option>
                  <option value="reviewed">Consultée</option>
                  <option value="shortlisted">Présélectionné</option>
                  <option value="accepted">Accepté</option>
                  <option value="rejected">Rejeté</option>
                </select>
                <span className="app-date">Reçue le {new Date(app.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
