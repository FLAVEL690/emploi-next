import { FiTarget, FiHeart, FiGlobe, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>A propos de <span className="highlight">NexJob</span></h1>
          <p>Nous connectons les talents aux opportunites qui transforment des vies. Notre mission est de rendre le recrutement simple, rapide et accessible a tous.</p>
        </div>
      </section>

      <section className="about-mission">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">
                <FiTarget />
              </div>
              <h3>Notre Mission</h3>
              <p>Faciliter la mise en relation entre les chercheurs d'emploi et les recruteurs a travers une plateforme moderne, intuitive et efficace.</p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">
                <FiHeart />
              </div>
              <h3>Nos Valeurs</h3>
              <p>Transparence, accessibilite et innovation sont au coeur de tout ce que nous faisons. Chaque candidat merite une chance equitable.</p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">
                <FiGlobe />
              </div>
              <h3>Notre Vision</h3>
              <p>Devenir la reference du recrutement en Afrique en offrant des outils technologiques de pointe aux entreprises et aux candidats.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="container">
          <h2 className="section-title">NexJob en chiffres</h2>
          <p className="section-subtitle">Des resultats concrets qui parlent d'eux-memes</p>
          <div className="about-stats-grid">
            <div className="about-stat-card">
              <FiUsers className="about-stat-icon" />
              <span className="about-stat-number">500+</span>
              <span className="about-stat-label">Candidats inscrits</span>
            </div>
            <div className="about-stat-card">
              <FiAward className="about-stat-icon" />
              <span className="about-stat-number">100+</span>
              <span className="about-stat-label">Entreprises partenaires</span>
            </div>
            <div className="about-stat-card">
              <FiTrendingUp className="about-stat-icon" />
              <span className="about-stat-number">300+</span>
              <span className="about-stat-label">Offres publiees</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-why">
        <div className="container">
          <h2 className="section-title">Pourquoi nous choisir ?</h2>
          <div className="why-grid">
            <div className="why-item">
              <span className="why-number">01</span>
              <div>
                <h4>Plateforme 100% gratuite pour les candidats</h4>
                <p>Creez votre profil, postulez et suivez vos candidatures sans aucun frais.</p>
              </div>
            </div>
            <div className="why-item">
              <span className="why-number">02</span>
              <div>
                <h4>Offres verifiees et entreprises authentiques</h4>
                <p>Chaque offre est validee pour garantir votre securite et votre confiance.</p>
              </div>
            </div>
            <div className="why-item">
              <span className="why-number">03</span>
              <div>
                <h4>Accompagnement personnalise</h4>
                <p>Notre equipe est disponible pour vous guider dans votre recherche d'emploi.</p>
              </div>
            </div>
            <div className="why-item">
              <span className="why-number">04</span>
              <div>
                <h4>Technologie de pointe</h4>
                <p>Une interface moderne et rapide adaptee a tous les appareils.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
