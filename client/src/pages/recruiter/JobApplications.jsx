import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiFileText, FiMessageCircle, FiUser, FiX, FiDownload } from 'react-icons/fi';
import { getJobApplications, updateApplicationStatus, getOrCreateConversation } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../candidate/Candidate.css';

const experienceLabels = { junior: 'Junior', mid: 'Intermédiaire', senior: 'Senior', any: 'Tous niveaux' };

export default function JobApplications() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    getJobApplications(jobId).then(setApplications).catch(() => navigate('/recruiter/jobs')).finally(() => setLoading(false));
  }, [jobId]);

  const openChat = async (app) => {
    if (!authUser) return;
    try {
      const conv = await getOrCreateConversation(app.job_id, app.candidate_id, authUser.id);
      navigate(`/recruiter/chat/${conv.id}`);
    } catch {
      alert('Erreur lors de l\'ouverture de la discussion');
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
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
      <button className="back-btn-inline" onClick={() => navigate('/recruiter/jobs')}><FiArrowLeft /> Retour aux offres</button>
      <div className="page-header"><h1>Candidatures reçues</h1><p>{applications.length} candidature{applications.length > 1 ? 's' : ''}</p></div>

      {applications.length === 0 ? (
        <div className="empty-state"><h3>Aucune candidature</h3><p>Vous n'avez pas encore reçu de candidatures pour cette offre</p></div>
      ) : (
        <div className="applications-list">
          {applications.map(app => (
            <div key={app.id} className="application-card card">
              <div className="app-card-header">
                <div className="app-avatar">{app.first_name?.[0]}{app.last_name?.[0]}</div>
                <div className="app-info">
                  <h3>{app.first_name} {app.last_name}</h3>
                  <div className="app-contacts">
                    <span><FiMail size={13} /> {app.email}</span>
                    {app.phone && <span><FiPhone size={13} /> {app.phone}</span>}
                    {app.city && <span><FiMapPin size={13} /> {app.city}, {app.country}</span>}
                  </div>
                </div>
                <span className={`badge ${statusLabels[app.status]?.class}`}>{statusLabels[app.status]?.label}</span>
              </div>
              {app.bio && <p className="app-bio">{app.bio}</p>}
              {app.cover_letter && (
                <div className="app-cover-letter">
                  <h4><FiFileText /> Lettre de motivation</h4>
                  <p>{app.cover_letter}</p>
                </div>
              )}
              <div className="app-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setViewing(app)}>
                  <FiUser /> Voir le profil
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => openChat(app)}>
                  <FiMessageCircle /> Discuter
                </button>
                <select className="form-control" value={app.status} onChange={(e) => updateStatus(app.id, e.target.value)} style={{ width: 'auto' }}>
                  <option value="pending">En attente</option>
                  <option value="reviewed">Consultée</option>
                  <option value="shortlisted">Présélectionné</option>
                  <option value="accepted">Accepté</option>
                  <option value="rejected">Rejeté</option>
                </select>
                <span className="app-date">Reçue le {new Date(app.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div className="profile-modal-overlay" onClick={() => setViewing(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div className="app-avatar">
                {viewing.avatar ? <img src={viewing.avatar} alt="Profil" /> : `${viewing.first_name?.[0]}${viewing.last_name?.[0]}`}
              </div>
              <div className="profile-modal-title">
                <h3>{viewing.first_name} {viewing.last_name}</h3>
                <span className="badge badge-info">{experienceLabels[viewing.experience_level] || 'Non renseigné'}</span>
              </div>
              <button className="profile-modal-close" onClick={() => setViewing(null)} aria-label="Fermer"><FiX /></button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-modal-contact">
                <span><FiMail size={14} /> {viewing.email}</span>
                {viewing.phone && <span><FiPhone size={14} /> {viewing.phone}</span>}
                {(viewing.city || viewing.country) && (
                  <span><FiMapPin size={14} /> {[viewing.city, viewing.country].filter(Boolean).join(', ')}</span>
                )}
              </div>

              {viewing.bio && (
                <div className="profile-modal-section">
                  <h4>À propos</h4>
                  <p>{viewing.bio}</p>
                </div>
              )}

              {(viewing.skills?.length > 0 || viewing.preferred_categories?.length > 0 || viewing.preferred_types?.length > 0) && (
                <div className="profile-modal-sections">
                  {viewing.skills?.length > 0 && (
                    <div className="profile-modal-section">
                      <h4>Compétences</h4>
                      <div className="profile-tags">
                        {viewing.skills.map((s, i) => <span key={i} className="profile-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {viewing.preferred_categories?.length > 0 && (
                    <div className="profile-modal-section">
                      <h4>Catégories préférées</h4>
                      <div className="profile-tags">
                        {viewing.preferred_categories.map((c, i) => <span key={i} className="profile-tag">{c}</span>)}
                      </div>
                    </div>
                  )}
                  {viewing.preferred_types?.length > 0 && (
                    <div className="profile-modal-section">
                      <h4>Types de contrat préférés</h4>
                      <div className="profile-tags">
                        {viewing.preferred_types.map((t, i) => <span key={i} className="profile-tag">{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewing.cv && (
                <div className="profile-modal-section">
                  <h4>Curriculum Vitae</h4>
                  <a href={viewing.cv} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    <FiDownload /> Voir le CV
                  </a>
                </div>
              )}

              {viewing.cover_letter && (
                <div className="profile-modal-section">
                  <h4>Lettre de motivation</h4>
                  <p>{viewing.cover_letter}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
