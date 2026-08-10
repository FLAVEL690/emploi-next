import { useState, useEffect, useMemo } from 'react';
import {
  FiUsers, FiBriefcase, FiFileText, FiCheckCircle, FiMail, FiPhone, FiMapPin,
  FiDownload, FiX, FiSearch, FiEye
} from 'react-icons/fi';
import { getAllApplications, getAllCandidates, getAllJobs, updateApplicationStatus } from '../../services/api';
import '../recruiter/Recruiter.css';
import '../candidate/Candidate.css';

const statusLabels = {
  pending: { label: 'En attente', class: 'badge-warning' },
  reviewed: { label: 'Consultée', class: 'badge-info' },
  shortlisted: { label: 'Présélectionné', class: 'badge-primary' },
  rejected: { label: 'Rejeté', class: 'badge-danger' },
  accepted: { label: 'Accepté', class: 'badge-success' }
};

const experienceLabels = { junior: 'Junior', mid: 'Intermédiaire', senior: 'Senior', any: 'Tous niveaux' };

export default function AdminActivity() {
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('applications');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    Promise.all([getAllApplications(), getAllCandidates(), getAllJobs()])
      .then(([apps, cands, allJobs]) => {
        setApplications(apps);
        setCandidates(cands);
        setJobs(allJobs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, accepted: 0 };
    applications.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
    return counts;
  }, [applications]);

  const activeJobs = useMemo(() => jobs.filter(j => j.is_active && new Date(j.expires_at) > new Date()).length, [jobs]);

  const filteredApps = useMemo(() => applications.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return `${a.first_name} ${a.last_name} ${a.email} ${a.jobTitle} ${a.company}`.toLowerCase().includes(q);
  }), [applications, statusFilter, search]);

  const filteredCandidates = useMemo(() => {
    if (!search) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(c => `${c.first_name} ${c.last_name} ${c.email} ${c.city || ''} ${c.skills?.join(' ') || ''}`.toLowerCase().includes(q));
  }, [candidates, search]);

  const updateStatus = async (id, status) => {
    try {
      await updateApplicationStatus(id, status);
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a));
    } catch {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Suivi global de la plateforme</h1>
        <p>Activités, candidatures, recrutements et profils</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiBriefcase /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{jobs.length}</span>
            <span className="stat-card-label">Offres ({activeJobs} actives)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiFileText /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{applications.length}</span>
            <span className="stat-card-label">Candidatures</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiCheckCircle /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{statusCounts.accepted}</span>
            <span className="stat-card-label">Recrutements (acceptées)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiUsers /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{candidates.length}</span>
            <span className="stat-card-label">Candidats</span>
          </div>
        </div>
      </div>

      <div className="status-filter-bar">
        <button className={`status-filter-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
          Toutes ({applications.length})
        </button>
        {Object.entries(statusLabels).map(([key, s]) => (
          <button key={key} className={`status-filter-chip ${statusFilter === key ? 'active' : ''}`} onClick={() => setStatusFilter(key)}>
            <span className={`badge ${s.class}`}>{s.label}</span> ({statusCounts[key]})
          </button>
        ))}
      </div>

      <div className="activity-tabs">
        <button className={`activity-tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
          Candidatures ({applications.length})
        </button>
        <button className={`activity-tab ${tab === 'candidates' ? 'active' : ''}`} onClick={() => setTab('candidates')}>
          Candidats ({candidates.length})
        </button>
      </div>

      <div className="activity-toolbar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder={tab === 'applications' ? 'Rechercher candidat, poste, entreprise...' : 'Rechercher un candidat...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tab === 'applications' ? (
        <div className="jobs-table">
          <table>
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Poste</th>
                <th>Entreprise</th>
                <th>Statut</th>
                <th>Reçue le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id}>
                  <td>
                    <div className="app-card-header" style={{ marginBottom: 0, gap: 10 }}>
                      <div className="app-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                        {app.avatar ? <img src={app.avatar} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : `${app.first_name?.[0]}${app.last_name?.[0]}`}
                      </div>
                      <div className="app-info">
                        <strong>{app.first_name} {app.last_name}</strong>
                        <small>{app.email}</small>
                      </div>
                    </div>
                  </td>
                  <td><strong>{app.jobTitle}</strong><br /><small>Recruteur : {app.recruiterName}</small></td>
                  <td>{app.company}</td>
                  <td>
                    <select className="form-control" value={app.status} onChange={(e) => updateStatus(app.id, e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}>
                      <option value="pending">En attente</option>
                      <option value="reviewed">Consultée</option>
                      <option value="shortlisted">Présélectionné</option>
                      <option value="accepted">Accepté</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </td>
                  <td><small>{new Date(app.created_at).toLocaleDateString('fr-FR')}</small></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setViewing(app)}>
                      <FiEye /> Profil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredApps.length === 0 && (
            <div className="empty-state"><h3>Aucune candidature</h3><p>Modifiez les filtres pour voir plus de résultats</p></div>
          )}
        </div>
      ) : (
        <div className="jobs-table">
          <table>
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Email</th>
                <th>Ville</th>
                <th>Expérience</th>
                <th>Compétences</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="app-card-header" style={{ marginBottom: 0, gap: 10 }}>
                      <div className="app-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                        {c.avatar ? <img src={c.avatar} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : `${c.first_name?.[0]}${c.last_name?.[0]}`}
                      </div>
                      <div className="app-info"><strong>{c.first_name} {c.last_name}</strong></div>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.city ? `${c.city}${c.country ? ', ' + c.country : ''}` : '-'}</td>
                  <td><span className="badge badge-info">{experienceLabels[c.experience_level] || 'Non renseigné'}</span></td>
                  <td>
                    {c.skills?.length > 0 ? (
                      <div className="profile-tags">
                        {c.skills.slice(0, 3).map((s, i) => <span key={i} className="profile-tag">{s}</span>)}
                        {c.skills.length > 3 && <span className="profile-tag">+{c.skills.length - 3}</span>}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setViewing(c)}>
                      <FiEye /> Profil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && (
            <div className="empty-state"><h3>Aucun candidat</h3><p>Modifiez les filtres pour voir plus de résultats</p></div>
          )}
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
