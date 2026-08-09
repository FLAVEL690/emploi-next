import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiBriefcase, FiMonitor, FiCalendar, FiEye, FiHeart, FiArrowLeft, FiDollarSign, FiStar, FiFileText, FiGlobe, FiLinkedin, FiFacebook, FiTwitter, FiMessageCircle } from 'react-icons/fi';
import { getJobById, applyToJob, toggleSaveJob, checkJobSaved, getMyApplications, getOrCreateConversation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/common/SEO';
import './JobDetail.css';

export default function JobDetail() {
  const { id } = useParams();
  const { user, authUser } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => { fetchJob(); }, [id]);

  useEffect(() => {
    if (user && user.role === 'candidate' && authUser) {
      checkJobSaved(authUser.id, id).then(setSaved).catch(() => {});
      getMyApplications(authUser.id).then(apps => {
        setHasApplied(apps.some(a => a.job_id === parseInt(id)));
      }).catch(() => {});
    }
  }, [user, authUser, id]);

  const fetchJob = async () => {
    try {
      const data = await getJobById(id);
      setJob(data);
    } catch (error) {
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = () => {
    if (!user) return false;
    return user.skills?.length > 0 && user.preferred_categories?.length > 0 && user.experience_level;
  };

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'candidate') return;

    if (!isProfileComplete()) {
      if (confirm('Vous devez compléter votre profil (compétences, catégories préférées, niveau d\'expérience) avant de postuler.\n\nVoulez-vous compléter votre profil maintenant ?')) {
        navigate('/profile');
      }
      return;
    }

    setApplying(true);
    try {
      await applyToJob(parseInt(id), authUser.id, coverLetter);
      setHasApplied(true);
      setShowApplyModal(false);
      openChat();
    } catch (error) {
      alert(error.message || 'Erreur lors de la candidature');
    } finally {
      setApplying(false);
    }
  };

  const openChat = async () => {
    if (!job || !authUser) return;
    try {
      const conv = await getOrCreateConversation(job.id, authUser.id, job.recruiter_id);
      navigate(`/candidate/chat/${conv.id}`);
    } catch {
      alert('Candidature envoyée avec succès ! Vous pouvez retrouver la discussion dans votre messagerie.');
    }
  };

  const handleToggleSave = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await toggleSaveJob(authUser.id, parseInt(id));
      setSaved(res.saved);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!job) return null;

  const modeLabels = { 'on-site': 'Présentiel', 'remote': 'En ligne', 'hybrid': 'Hybride' };
  const typeLabels = { 'full-time': 'Temps plein', 'part-time': 'Temps partiel', 'cdd': 'CDD', 'cdi': 'CDI', 'contract': 'Contrat', 'internship': 'Stage', 'freelance': 'Freelance' };
  const levelLabels = { 'junior': 'Junior', 'mid': 'Intermédiaire', 'senior': 'Senior', 'any': 'Tous niveaux' };

  const recruiter = job.profiles;

  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.created_at,
    "employmentType": job.type === 'full-time' ? 'FULL_TIME' : job.type === 'part-time' ? 'PART_TIME' : job.type === 'internship' ? 'INTERN' : 'CONTRACTOR',
    "jobLocation": {
      "@type": "Place",
      "address": { "@type": "PostalAddress", "addressLocality": job.location || 'Cameroun', "addressCountry": "CM" }
    },
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company || 'Entreprise',
      "sameAs": "https://nexjob.nexadigic.cm/"
    }
  };

  return (
    <div className="job-detail-page">
      <SEO
        title={`${job.title} - ${job.company || 'Emploi'}`}
        description={`Offre d'emploi: ${job.title} chez ${job.company || 'une entreprise'} à ${job.location || 'Cameroun'}. Postulez maintenant sur NexJob !`}
        path={`/jobs/${id}`}
        jsonLd={jobJsonLd}
      />
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Retour
        </button>

        <div className="job-detail-layout">
          <div className="job-detail-main">
            <div className="job-detail-header">
              <div className="job-detail-logo">
                {recruiter?.avatar ? (
                  <img src={recruiter.avatar} alt={job.company} className="company-logo-img" />
                ) : (
                  job.company?.[0] || 'E'
                )}
              </div>
              <div>
                <h1>{job.title}</h1>
                <p className="job-detail-company">{job.company}</p>
              </div>
            </div>

            <div className="job-detail-badges">
              <span className="badge badge-primary"><FiBriefcase /> {typeLabels[job.type]}</span>
              <span className="badge badge-info"><FiMonitor /> {modeLabels[job.mode]}</span>
              <span className="badge badge-success"><FiStar /> {levelLabels[job.experience_level]}</span>
            </div>

            <div className="job-detail-info">
              <span><FiMapPin /> {job.city}{job.district ? `, ${job.district}` : ''}, {job.country}</span>
              <span><FiCalendar /> Expire le {new Date(job.expires_at).toLocaleDateString('fr-FR')}</span>
              <span><FiEye /> {job.views} vues</span>
              <span><FiDollarSign /> {job.salary || 'Non renseigné'}</span>
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
                  {!isProfileComplete() && (
                    <div className="profile-incomplete-warning">
                      <p>Complétez votre profil pour postuler</p>
                      <Link to="/profile" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                        Compléter mon profil
                      </Link>
                    </div>
                  )}
                  {isProfileComplete() && (
                    <>
                      {hasApplied ? (
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={openChat}>
                          <FiMessageCircle /> Discuter avec l'entreprise
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setShowApplyModal(true)}>
                          Postuler maintenant
                        </button>
                      )}
                    </>
                  )}
                  <button className={`btn btn-secondary btn-lg save-btn ${saved ? 'saved' : ''}`} onClick={handleToggleSave}>
                    <FiHeart /> {saved ? 'Sauvegardé' : 'Sauvegarder'}
                  </button>
                </>
              ) : null}

              {(job.require_cv || job.require_cover_letter || job.other_documents) && (
                <div className="sidebar-info">
                  <h3><FiFileText /> Documents requis</h3>
                  <ul className="required-docs-list">
                    {job.require_cv && <li>CV (Curriculum Vitae)</li>}
                    {job.require_cover_letter && <li>Lettre de motivation</li>}
                    {job.other_documents && <li>{job.other_documents}</li>}
                  </ul>
                </div>
              )}

              <div className="sidebar-info about-company">
                <h3>A propos de l'entreprise</h3>
                <div className="company-header">
                  <div className="company-avatar">
                    {recruiter?.avatar ? (
                      <img src={recruiter.avatar} alt={recruiter?.company || job.company} className="company-avatar-img" />
                    ) : (
                      <span>{(recruiter?.company || job.company)?.[0] || 'E'}</span>
                    )}
                  </div>
                  <p className="company-name">{recruiter?.company || job.company}</p>
                </div>
                {recruiter?.company_description ? (
                  <p className="company-description">{recruiter.company_description}</p>
                ) : (
                  <p className="company-description company-absent">Aucune description disponible</p>
                )}
                <div className="company-contacts">
                  <div className="company-contact-item">
                    <FiGlobe size={14} />
                    {recruiter?.website ? (
                      <a href={recruiter.website} target="_blank" rel="noopener noreferrer">{recruiter.website.replace(/^https?:\/\//, '')}</a>
                    ) : (
                      <span className="company-absent">Non renseigné</span>
                    )}
                  </div>
                </div>
                {(recruiter?.linkedin || recruiter?.facebook || recruiter?.twitter) && (
                  <div className="company-socials">
                    {recruiter.linkedin && (
                      <a href={recruiter.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn"><FiLinkedin /></a>
                    )}
                    {recruiter.facebook && (
                      <a href={recruiter.facebook} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook"><FiFacebook /></a>
                    )}
                    {recruiter.twitter && (
                      <a href={recruiter.twitter} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter"><FiTwitter /></a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showApplyModal && (
          <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Postuler - {job.title}</h2>
              <p className="modal-subtitle">Chez {job.company}</p>

              <div className="apply-docs-notice">
                <strong><FiMessageCircle /> Candidature via la messagerie interne</strong>
                <p>
                  Votre candidature sera envoyée via le chat de la plateforme. Vous pourrez
                  y joindre vos documents (CV, lettre de motivation...) jusqu'à 2 Mo chacun
                  et échanger directement avec le recruteur.
                </p>
              </div>

              {(job.require_cv || job.require_cover_letter || job.other_documents) && (
                <div className="apply-docs-notice">
                  <strong>Documents demandés :</strong>
                  <ul>
                    {job.require_cv && <li>CV (Curriculum Vitae)</li>}
                    {job.require_cover_letter && <li>Lettre de motivation</li>}
                    {job.other_documents && <li>{job.other_documents}</li>}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>Lettre de motivation {job.require_cover_letter ? '*' : '(optionnel)'}</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Expliquez pourquoi vous êtes le candidat idéal..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required={job.require_cover_letter}
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
