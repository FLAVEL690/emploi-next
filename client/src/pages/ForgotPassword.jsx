import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheck } from 'react-icons/fi';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/forgot-password'
      });
      if (error) throw error;
      setMessage('Un code de vérification a été envoyé à votre adresse email');
      setStep(2);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });
      if (error) throw error;
      setMessage('Code vérifié ! Entrez votre nouveau mot de passe');
      setStep(3);
    } catch (err) {
      setError('Code invalide ou expiré. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Mot de passe modifié avec succès !');
      setStep(4);
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {step === 1 && 'Mot de passe oublié'}
            {step === 2 && 'Vérification'}
            {step === 3 && 'Nouveau mot de passe'}
            {step === 4 && 'Terminé !'}
          </h1>
          <p>
            {step === 1 && 'Entrez votre email pour recevoir un code de réinitialisation'}
            {step === 2 && 'Entrez le code reçu par email'}
            {step === 3 && 'Choisissez un nouveau mot de passe'}
            {step === 4 && 'Votre mot de passe a été réinitialisé'}
          </p>
        </div>

        <div className="reset-steps">
          <div className={`reset-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <span className="step-dot">{step > 1 ? <FiCheck size={12} /> : '1'}</span>
            <span className="step-label">Email</span>
          </div>
          <div className="step-line" />
          <div className={`reset-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
            <span className="step-dot">{step > 2 ? <FiCheck size={12} /> : '2'}</span>
            <span className="step-label">Code</span>
          </div>
          <div className="step-line" />
          <div className={`reset-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'done' : ''}`}>
            <span className="step-dot">{step > 3 ? <FiCheck size={12} /> : '3'}</span>
            <span className="step-label">Nouveau</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && !error && <div className="auth-error" style={{ background: '#D1FAE5', color: '#059669', borderColor: '#A7F3D0' }}>{message}</div>}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Adresse email</label>
              <div className="input-icon">
                <FiMail />
                <input type="email" className="form-control" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Code de vérification</label>
              <input
                type="text"
                className="form-control token-input"
                placeholder="Collez le code reçu par email"
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                required
              />
              <p className="input-hint">Copiez-collez le code complet reçu dans votre email (vérifiez aussi les spams)</p>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || otp.length < 4}>
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>
            <button type="button" className="btn-resend" onClick={handleSendCode} disabled={loading}>
              Renvoyer le code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <div className="input-icon">
                <FiLock />
                <input type={showPass ? 'text' : 'password'} className="form-control" placeholder="Minimum 6 caractères" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <div className="input-icon">
                <FiLock />
                <input type={showPass ? 'text' : 'password'} className="form-control" placeholder="Retapez le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Modification...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="reset-success">
            <div className="success-icon"><FiCheck size={32} /></div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
        )}

        <p className="auth-footer">
          <Link to="/login"><FiArrowLeft style={{ verticalAlign: '-2px' }} /> Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
