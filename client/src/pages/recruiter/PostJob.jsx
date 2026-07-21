import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, createJob } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Recruiter.css';

export default function PostJob() {
  const navigate = useNavigate();
  const { user, authUser } = useAuth();
  const [categories, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', type: 'full-time', mode: 'on-site',
    salary: '', country: '', city: '', district: '', requirements: '',
    benefits: '', experienceLevel: 'any', expiresAt: ''
  });

  useEffect(() => { getCategories().then(setCategoriesList).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createJob(form, authUser.id, user?.company);
      alert('Offre publiée avec succès !');
      navigate('/recruiter/jobs');
    } catch (error) {
      alert(error.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <h1>Publier une nouvelle offre</h1>
        <p>Remplissez les informations pour publier votre annonce</p>
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
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'Publication...' : "Publier l'offre"}
        </button>
      </form>
    </div>
  );
}
