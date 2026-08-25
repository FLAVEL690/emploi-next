import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiX } from 'react-icons/fi';
import './CookieBanner.css';

const CONSENT_KEY = 'nexjob_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(CONSENT_KEY));
  }, []);

  const saveConsent = (choice) => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-banner" role="dialog" aria-label="Preferences de confidentialite">
      <div className="cookie-banner-icon" aria-hidden="true">
        <FiShield />
      </div>
      <div className="cookie-banner-content">
        <h2>Votre vie privee compte</h2>
        <p>
          NexJob utilise uniquement les stockages necessaires au fonctionnement du compte et de vos preferences. Aucun cookie publicitaire n'est utilise. Vous pouvez accepter ou refuser les cookies optionnels.
        </p>
        <Link to="/privacy" className="cookie-banner-link">Lire la politique de confidentialite</Link>
      </div>
      <div className="cookie-banner-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => saveConsent('rejected')}>
          Refuser les optionnels
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => saveConsent('accepted')}>
          Accepter
        </button>
      </div>
      <button className="cookie-banner-close" onClick={() => saveConsent('rejected')} aria-label="Refuser et fermer">
        <FiX />
      </button>
    </aside>
  );
}
