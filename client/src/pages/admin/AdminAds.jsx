import { useState, useEffect, useRef } from 'react';
import { FiTrash2, FiPlus, FiUpload, FiImage, FiVideo, FiX } from 'react-icons/fi';
import { getAdminAds, uploadAdMedia, createAd, updateAd, deleteAd } from '../../services/api';
import '../recruiter/Recruiter.css';
import './AdminAds.css';

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', linkUrl: '', position: 'banner' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = () => {
    getAdminAds().then(setAds).catch(() => {}).finally(() => setLoading(false));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    if (file.type.startsWith('video/')) {
      setPreview({ type: 'video', url: URL.createObjectURL(file) });
    } else {
      setPreview({ type: 'image', url: URL.createObjectURL(file) });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier image ou vidéo');
      return;
    }
    if (!form.title.trim()) {
      alert('Veuillez entrer un titre');
      return;
    }

    setUploading(true);
    try {
      const mediaUrl = await uploadAdMedia(selectedFile);
      const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';

      await createAd({
        title: form.title,
        mediaUrl,
        mediaType,
        linkUrl: form.linkUrl,
        position: form.position
      });

      setForm({ title: '', linkUrl: '', position: 'banner' });
      removeFile();
      setShowForm(false);
      fetchAds();
    } catch (error) {
      alert(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette publicité ?')) return;
    try {
      await deleteAd(id);
      setAds(ads.filter(a => a.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (ad) => {
    try {
      await updateAd(ad.id, { is_active: !ad.is_active });
      fetchAds();
    } catch (error) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="section-header-row">
        <div className="page-header">
          <h1>Gestion des publicités</h1>
          <p>{ads.length} publicité{ads.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> Ajouter
        </button>
      </div>

      {showForm && (
        <form className="ad-upload-form" onSubmit={handleSubmit}>
          <h3>Nouvelle publicité</h3>

          <div className="form-group">
            <label>Titre *</label>
            <input
              className="form-control"
              placeholder="Nom de la publicité"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Image ou Vidéo *</label>
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              {!preview ? (
                <div className="upload-placeholder">
                  <FiUpload size={32} />
                  <p>Cliquez pour importer une image ou vidéo</p>
                  <span>JPG, PNG, GIF, WebP, SVG, MP4, WebM, OGG (max 50MB)</span>
                </div>
              ) : (
                <div className="upload-preview">
                  {preview.type === 'image' ? (
                    <img src={preview.url} alt="Preview" />
                  ) : (
                    <video src={preview.url} controls />
                  )}
                  <button type="button" className="remove-file-btn" onClick={(e) => { e.stopPropagation(); removeFile(); }}>
                    <FiX />
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-group">
            <label>Lien de redirection (optionnel)</label>
            <input
              className="form-control"
              placeholder="https://site-annonceur.com"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Position d'affichage</label>
            <select className="form-control" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
              <option value="banner">Bannière principale (page d'accueil)</option>
              <option value="sidebar">Barre latérale</option>
              <option value="inline">Intégré entre les offres</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); removeFile(); }}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Upload en cours...' : 'Publier la publicité'}
            </button>
          </div>
        </form>
      )}

      {ads.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune publicité</h3>
          <p>Ajoutez des images ou vidéos publicitaires qui s'afficheront sur la page d'accueil</p>
        </div>
      ) : (
        <div className="ads-grid">
          {ads.map(ad => (
            <div key={ad.id} className="ad-card card">
              <div className="ad-card-media">
                {ad.media_type === 'video' ? (
                  <video src={ad.media_url} controls />
                ) : (
                  <img src={ad.media_url} alt={ad.title} />
                )}
              </div>
              <div className="ad-card-content">
                <div className="ad-card-header">
                  <h4>{ad.title}</h4>
                  <span className={`badge ${ad.media_type === 'video' ? 'badge-info' : 'badge-primary'}`}>
                    {ad.media_type === 'video' ? <><FiVideo size={11} /> Vidéo</> : <><FiImage size={11} /> Image</>}
                  </span>
                </div>
                <div className="ad-card-meta">
                  <span className="badge badge-warning">
                    {ad.position === 'banner' ? 'Bannière' : ad.position === 'sidebar' ? 'Latérale' : 'Intégré'}
                  </span>
                  <button
                    className={`badge ${ad.is_active ? 'badge-success' : 'badge-danger'}`}
                    onClick={() => toggleActive(ad)}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="ad-card-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ad.id)}>
                    <FiTrash2 /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
