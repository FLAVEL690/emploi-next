import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, createJob } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiSave, FiTrash2 } from 'react-icons/fi';
import './Recruiter.css';

const DRAFT_KEY = 'postjob_draft';
const INITIAL_FORM = {
  title: '', description: '', category: '', type: 'full-time', mode: 'on-site',
  salary: '', country: '', city: '', district: '', requirements: '',
  benefits: '', experienceLevel: 'any', expiresAt: '',
  requireCv: true, requireCoverLetter: false, otherDocuments: '',
  applicationMethod: 'platform', whatsappNumber: '', contactEmail: ''
};

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export default function PostJob() {
  const navigate = useNavigate();
  const { user, authUser } = useAuth();
  const [categories, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draftStatus, setDraftStatus] = useState(null);
  const draft = loadDraft();
  const [form, setForm] = useState(draft || INITIAL_FORM);
  const [hasDraft, setHasDraft] = useState(!!draft);
  const saveTimeout = useRef(null);

  useEffect(() => { getCategories().then(setCategoriesList).catch(() => {}); }, []);

  const saveDraft = useCallback((formData) => {
    const hasContent = formData.title || formData.description || formData.category || formData.country || formData.city;
    if (!hasContent) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    setHasDraft(true);
    setDraftStatus('saved');
    setTimeout(() => setDraftStatus(null), 2000);
  }, []);

  const update = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveDraft(next), 800);
      return next;
    });
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(INITIAL_FORM);
    setHasDraft(false);
    setDraftStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createJob(form, authUser.id, user?.company);
      localStorage.removeItem(DRAFT_KEY);
      alert('Offre publiée avec succès !');
      navigate('/recruiter/jobs');
    } catch (error) {
      alert(error.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Publier une nouvelle offre</h1>
            <p>Remplissez les informations pour publier votre annonce</p>
          </div>
          <div className="draft-actions">
            {draftStatus === 'saved' && (
              <span className="draft-indicator">
                <FiSave size={14} /> Brouillon sauvegardé
              </span>
            )}
            {hasDraft && (
              <button type="button" className="btn-draft-clear" onClick={clearDraft}>
                <FiTrash2 size={14} /> Effacer le brouillon
              </button>
            )}
          </div>
        </div>
        {hasDraft && !draftStatus && (
          <p className="draft-notice">Brouillon restauré automatiquement</p>
        )}
      </div>

      <form className="post-job-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Titre du poste *</label>
          <input className="form-control" placeholder="Ex: Développeur Frontend React" value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea className="form-control" rows={5} placeholder="Décrivez le poste en détail..." value={form.description} onChange={(e) => update('description', e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Catégorie *</label>
            <select className="form-control" value={form.category} onChange={(e) => update('category', e.target.value)} required>
              <option value="">Sélectionner</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Niveau d'expérience</label>
            <select className="form-control" value={form.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value)}>
              <option value="any">Tous niveaux</option>
              <option value="junior">Junior</option>
              <option value="mid">Intermédiaire</option>
              <option value="senior">Senior</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type de contrat *</label>
            <select className="form-control" value={form.type} onChange={(e) => update('type', e.target.value)} required>
              <option value="full-time">Temps plein</option>
              <option value="part-time">Temps partiel</option>
              <option value="contract">Contrat</option>
              <option value="internship">Stage</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mode de travail *</label>
            <select className="form-control" value={form.mode} onChange={(e) => update('mode', e.target.value)} required>
              <option value="on-site">Présentiel</option>
              <option value="remote">En ligne</option>
              <option value="hybrid">Hybride</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Salaire (optionnel)</label>
          <input className="form-control" placeholder="Ex: 300 000 - 500 000 FCFA/mois" value={form.salary} onChange={(e) => update('salary', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Pays *</label>
            <input className="form-control" placeholder="Cameroun" value={form.country} onChange={(e) => update('country', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Ville *</label>
            <input className="form-control" placeholder="Douala" value={form.city} onChange={(e) => update('city', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label>Quartier (optionnel)</label>
          <input className="form-control" placeholder="Ex: Akwa, Bonanjo..." value={form.district} onChange={(e) => update('district', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Exigences</label>
          <textarea className="form-control" rows={4} placeholder="Compétences requises, diplômes, expérience..." value={form.requirements} onChange={(e) => update('requirements', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Avantages</label>
          <textarea className="form-control" rows={3} placeholder="Avantages offerts (assurance, transport, prime...)" value={form.benefits} onChange={(e) => update('benefits', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date d'expiration *</label>
          <input type="date" className="form-control" value={form.expiresAt} onChange={(e) => update('expiresAt', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="form-section">
          <h3>Documents requis pour postuler</h3>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.requireCv} onChange={(e) => update('requireCv', e.target.checked)} />
              CV (Curriculum Vitae)
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.requireCoverLetter} onChange={(e) => update('requireCoverLetter', e.target.checked)} />
              Lettre de motivation
            </label>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Autres documents demandés (optionnel)</label>
            <input className="form-control" placeholder="Ex: Diplôme, certificat, portfolio, permis de conduire..." value={form.otherDocuments} onChange={(e) => update('otherDocuments', e.target.value)} />
          </div>
        </div>

        <div className="form-section">
          <h3>Mode de réception des candidatures</h3>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" name="applicationMethod" value="platform" checked={form.applicationMethod === 'platform'} onChange={(e) => update('applicationMethod', e.target.value)} />
              Via la plateforme (par défaut)
            </label>
            <label className="radio-label">
              <input type="radio" name="applicationMethod" value="whatsapp" checked={form.applicationMethod === 'whatsapp'} onChange={(e) => update('applicationMethod', e.target.value)} />
              Par WhatsApp
            </label>
            <label className="radio-label">
              <input type="radio" name="applicationMethod" value="email" checked={form.applicationMethod === 'email'} onChange={(e) => update('applicationMethod', e.target.value)} />
              Par Email
            </label>
          </div>
          {form.applicationMethod === 'whatsapp' && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Numéro WhatsApp *</label>
              <input className="form-control" placeholder="Ex: +237 6XX XXX XXX" value={form.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} required />
            </div>
          )}
          {form.applicationMethod === 'email' && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Adresse email *</label>
              <input type="email" className="form-control" placeholder="recrutement@entreprise.com" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} required />
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'Publication...' : "Publier l'offre"}
        </button>
      </form>
    </div>
  );
}
