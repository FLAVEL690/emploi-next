import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, uploadAvatar } from '../services/api';
import { FiCamera, FiUser } from 'react-icons/fi';
import './Auth.css';

export default function Profile() {
  const { user, authUser, updateUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
    country: user?.country || '',
    company: user?.company || '',
    company_description: user?.company_description || ''
  });
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('profile');
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      const avatarUrl = await uploadAvatar(authUser.id, file);
      const updated = await updateProfile(authUser.id, { avatar: avatarUrl });
      updateUser(updated);
      setMessage('Photo de profil mise à jour');
    } catch (error) {
      setMessage(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const updated = await updateProfile(authUser.id, form);
      updateUser(updated);
      setMessage('Profil mis à jour avec succès');
    } catch (error) {
      setMessage(error.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await changePassword(passwords.newPassword);
      setMessage('Mot de passe modifié avec succès');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage(error.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Mon Profil</h1>
        <p>Gérez vos informations personnelles</p>
      </div>

      <div className="profile-tabs">
        <button className={`profile-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Informations</button>
        <button className={`profile-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Mot de passe</button>
      </div>

      {message && <div className="auth-error" style={{ background: message.includes('succès') || message.includes('mise à jour') ? '#D1FAE5' : '#FEE2E2', color: message.includes('succès') || message.includes('mise à jour') ? '#059669' : '#DC2626', marginBottom: '16px' }}>{message}</div>}

      {tab === 'profile' && (
        <form className="post-job-form" onSubmit={handleProfileUpdate}>
          <div className="avatar-section">
            <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Photo de profil" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <FiUser size={32} />
                </div>
              )}
              <div className="avatar-overlay">
                <FiCamera size={18} />
              </div>
              {uploading && <div className="avatar-loading"><div className="spinner" /></div>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p className="avatar-hint">Cliquez pour changer la photo (max 2 Mo)</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-control" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input className="form-control" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>

          {user?.role === 'recruiter' && (
            <>
              <div className="form-group">
                <label>Nom de l'entreprise</label>
                <input className="form-control" placeholder="Nom de votre entreprise" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description de l'entreprise</label>
                <textarea className="form-control" rows={4} placeholder="Décrivez votre entreprise, ses activités, sa culture..." value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Téléphone</label>
            <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pays</label>
              <input className="form-control" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Ville</label>
              <input className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea className="form-control" rows={4} placeholder="Parlez un peu de vous..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form className="post-job-form" onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" className="form-control" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" className="form-control" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
}
