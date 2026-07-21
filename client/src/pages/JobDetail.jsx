import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiBriefcase, FiMonitor, FiCalendar, FiEye, FiHeart, FiArrowLeft, FiDollarSign, FiStar } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './JobDetail.css';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (user && user.role === 'candidate') {
      api.get('/saved/check/' + id).then(res => setSaved(res.data.saved)).catch(() => {});
      api.get('/applications/my-applications').then(res => {
        const applied = res.data.some(app => app.jobId === parseInt(id));
        setHasApplied(applied);
      }).catch(() => {});
    }
  }, [user, id]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (error) {
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'candidate') return;

    setApplying(true);
    try {
      await api.post('/applications', { jobId: parseInt(id), coverLetter });
      setHasApplied(true);
      setShowApplyModal(false);
      alert('Candidature envoyée avec succès !');
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la candidature');
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post(`/saved/${id}`);
      setSaved(res.data.saved);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!job) return null;

  const modeLabels = { 'on-site': 'Présentiel', 'remote': 'En ligne', 'hybrid': 'Hybride' };
  const typeLabels = { 'full-time': 'Temps plein', 'part-time': 'Temps partiel', 'contract': 'Contrat', 'internship': 'Stage', 'freelance': 'Freelance' };
  const levelLabels = { 'junior': 'Junior', 'mid': 'Intermédiaire', 'senior': 'Senior', 'any': 'Tous niveaux' };

  return (
    <div className="job-detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Retour
        </button>

        <div className="job-detail-layout">
          <div className="job-detail-main">
            <div className="job-detail-header">
              <div className="job-detail-logo">
                {job.company?.[0] || 'E'}
              </div>
              <div>
                <h1>{job.title}</h1>
                <p className="job-detail-company">{job.company}</p>
              </div>
            </div>

            <div className="job-detail-badges">
              <span className="badge badge-primary"><FiBriefcase /> {typeLabels[job.type]}</span>
              <span className="badge badge-info"><FiMonitor /> {modeLabels[job.mode]}</span>
              <span className="badge badge-success"><FiStar /> {levelLabels[job.experienceLevel]}</span>
            </div>

            <div className="job-detail-info">
              <span><FiMapPin /> {job.city}{job.district ? `, ${job.district}` : ''}, {job.country}</span>
              <span><FiCalendar /> Expire le {new Date(job.expiresAt).toLocaleDateString('fr-FR')}</span>
              <span><FiEye /> {job.views} vues</span>
              {job.salary && <span><FiDollarSign /> {job.salary}</span>}
            </div>

            <div className="job-detail-section">
              <h2>Description du poste</h2>
              <div className="job-description">{job.description}</div>
            </div>

            {job.requirements && (
              <div className="job-detail-section">
                <h2>Exigences</h2>
                <div className="job-description">{job.requirements}</div>
              </div>
            )}

            {job.benefits && (
              <div className="job-detail-section">
                <h2>Avantages</h2>
                <div className="job-description">{job.benefits}</div>
              </div>
            )}
          </div>

          <div className="job-detail-sidebar">
            <div className="sidebar-card">
              {!user ? (
                <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Connectez-vous pour postuler
                </Link>
              ) : user.role === 'candidate' ? (
                <>
                  {hasApplied ? (
                    <button className="btn btn-lg" style={{ width: '100%', background: 'var(--gray-200)', color: 'var(--gray-600)' }} disabled>
                      Candidature envoyée
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setShowApplyModal(true)}>
                      Postuler maintenant
                    </button>
                  )}
                  <button className={`btn btn-secondary btn-lg save-btn ${saved ? 'saved' : ''}`} onClick={toggleSave}>
                    <FiHeart /> {saved ? 'Sauvegardé' : 'Sauvegarder'}
                  </button>
                </>
              ) : null}

              <div className="sidebar-info">
                <h3>A propos de l'entreprise</h3>
                <p className="company-name">{job.recruiterCompany || job.company}</p>
                <p className="recruiter-name">Publié par {job.recruiterFirstName} {job.recruiterLastName}</p>
              </div>
            </div>
          </div>
        </div>

        {showApplyModal && (
          <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Postuler - {job.title}</h2>
              <p className="modal-subtitle">Chez {job.company}</p>
              <div className="form-group">
                <label>Lettre de motivation (optionnel)</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Expliquez pourquoi vous êtes le candidat idéal..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
                  {applying ? 'Envoi...' : 'Envoyer ma candidature'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
