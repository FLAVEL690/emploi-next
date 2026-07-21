import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiBriefcase, FiPhone } from 'react-icons/fi';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    role: 'candidate', company: '', phone: '', city: '', country: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const profile = await register(form);
      if (profile) {
        if (profile.role === 'recruiter') navigate('/recruiter');
        else navigate('/candidate');
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1>Inscription</h1>
          <p>Créez votre compte gratuitement</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="role-selector">
          <button className={`role-btn ${form.role === 'candidate' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'candidate' })} type="button">
            <FiUser /> Candidat
          </button>
          <button className={`role-btn ${form.role === 'recruiter' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'recruiter' })} type="button">
            <FiBriefcase /> Recruteur
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-control" placeholder="Votre prénom" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input className="form-control" placeholder="Votre nom" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-icon">
              <FiMail />
              <input type="email" className="form-control" placeholder="votre@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          {form.role === 'recruiter' && (
            <div className="form-group">
              <label>Entreprise</label>
              <div className="input-icon">
                <FiBriefcase />
                <input className="form-control" placeholder="Nom de votre entreprise" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Téléphone (optionnel)</label>
            <div className="input-icon">
              <FiPhone />
              <input className="form-control" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pays</label>
              <input className="form-control" placeholder="Cameroun" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Ville</label>
              <input className="form-control" placeholder="Douala" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-icon">
              <FiLock />
              <input type={showPass ? 'text' : 'password'} className="form-control" placeholder="Minimum 6 caractères" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>{showPass ? <FiEyeOff /> : <FiEye />}</button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <div className="input-icon">
              <FiLock />
              <input type="password" className="form-control" placeholder="Confirmez votre mot de passe" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-footer">
          Déjà un compte ? <Link to="/login">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}
