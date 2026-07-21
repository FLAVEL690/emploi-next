import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">E</span>
              <span>EmploiPro</span>
            </div>
            <p>La plateforme de recrutement qui connecte les talents aux meilleures opportunités professionnelles.</p>
          </div>

          <div className="footer-section">
            <h4>Liens rapides</h4>
            <Link to="/jobs">Offres d'emploi</Link>
            <Link to="/register">Créer un compte</Link>
            <Link to="/login">Se connecter</Link>
          </div>

          <div className="footer-section">
            <h4>Pour les recruteurs</h4>
            <Link to="/register">Publier une offre</Link>
            <Link to="/recruiter">Dashboard recruteur</Link>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <div className="footer-contact">
              <FiMail /> contact@emploipro.com
            </div>
            <div className="footer-contact">
              <FiPhone /> +237 6XX XXX XXX
            </div>
            <div className="footer-contact">
              <FiMapPin /> Douala, Cameroun
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 EmploiPro. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
