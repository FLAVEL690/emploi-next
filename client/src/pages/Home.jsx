import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUsers, FiBriefcase, FiCheckCircle, FiArrowRight, FiStar, FiTrendingUp, FiShield } from 'react-icons/fi';
import { getJobs, getJobStats, getCategories, getPublicAds } from '../services/api';
import JobCard from '../components/jobs/JobCard';
import './Home.css';

export default function Home() {
  const [stats, setStats] = useState({ jobs: 0, companies: 0, candidates: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [categories, setCategoriesList] = useState([]);
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getJobStats().then(setStats).catch(() => {});
    getJobs({ limit: 6 }).then(res => setRecentJobs(res.jobs || [])).catch(() => {});
    getCategories().then(setCategoriesList).catch(() => {});
    getPublicAds().then(setAds).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?search=${encodeURIComponent(search)}`);
  };

  const bannerAds = ads.filter(a => a.position === 'banner');
  const sidebarAds = ads.filter(a => a.position === 'sidebar');
  const inlineAds = ads.filter(a => a.position === 'inline');

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Trouvez le <span className="highlight">job idéal</span> qui correspond à vos ambitions</h1>
          <p className="hero-subtitle">Des milliers d'offres d'emploi vous attendent. Connectez-vous avec les meilleurs recruteurs et lancez votre carrière.</p>

          <form className="hero-search" onSubmit={handleSearch}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un poste, une entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Rechercher</button>
          </form>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.jobs}+</span>
              <span className="stat-label">Offres actives</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.companies}+</span>
              <span className="stat-label">Entreprises</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.candidates}+</span>
              <span className="stat-label">Candidats</span>
            </div>
          </div>
        </div>
      </section>

      {bannerAds.length > 0 && (
        <section className="ads-banner">
          <div className="container">
            <div className="ads-banner-grid">
              {bannerAds.map(ad => (
                <a key={ad.id} href={ad.link_url || '#'} target={ad.link_url ? '_blank' : '_self'} rel="noopener noreferrer" className="ad-banner-item">
                  {ad.media_type === 'video' ? (
                    <video src={ad.media_url} autoPlay muted loop playsInline />
                  ) : (
                    <img src={ad.media_url} alt={ad.title} />
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Comment ça marche ?</h2>
          <p className="section-subtitle">Un processus simple et efficace pour trouver votre prochain emploi</p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon"><FiUsers /></div>
              <h3>Créez votre compte</h3>
              <p>Inscrivez-vous gratuitement et complétez votre profil professionnel</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon"><FiSearch /></div>
              <h3>Explorez les offres</h3>
              <p>Recherchez parmi des centaines d'offres et filtrez selon vos critères</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon"><FiBriefcase /></div>
              <h3>Postulez facilement</h3>
              <p>Envoyez votre candidature en un clic avec votre lettre de motivation</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon"><FiCheckCircle /></div>
              <h3>Décrochez le job</h3>
              <p>Suivez vos candidatures et recevez des notifications en temps réel</p>
            </div>
          </div>
        </div>
      </section>

      <section className="recent-jobs">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Offres récentes</h2>
              <p className="section-subtitle">Découvrez les dernières opportunités</p>
            </div>
            <Link to="/jobs" className="btn btn-secondary">
              Voir toutes les offres <FiArrowRight />
            </Link>
          </div>

          <div className="recent-jobs-layout">
            <div className="jobs-grid">
              {recentJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {sidebarAds.length > 0 && (
              <aside className="home-sidebar-ads">
                {sidebarAds.map(ad => (
                  <a key={ad.id} href={ad.link_url || '#'} target={ad.link_url ? '_blank' : '_self'} rel="noopener noreferrer" className="sidebar-ad-item">
                    {ad.media_type === 'video' ? (
                      <video src={ad.media_url} autoPlay muted loop playsInline />
                    ) : (
                      <img src={ad.media_url} alt={ad.title} />
                    )}
                  </a>
                ))}
              </aside>
            )}
          </div>

          {recentJobs.length === 0 && (
            <div className="empty-state">
              <h3>Aucune offre pour le moment</h3>
              <p>Revenez bientôt pour découvrir de nouvelles opportunités</p>
            </div>
          )}
        </div>
      </section>

      {inlineAds.length > 0 && (
        <section className="inline-ads-section">
          <div className="container">
            <div className="inline-ads-grid">
              {inlineAds.map(ad => (
                <a key={ad.id} href={ad.link_url || '#'} target={ad.link_url ? '_blank' : '_self'} rel="noopener noreferrer" className="inline-ad-item">
                  {ad.media_type === 'video' ? (
                    <video src={ad.media_url} autoPlay muted loop playsInline />
                  ) : (
                    <img src={ad.media_url} alt={ad.title} />
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Parcourir par catégorie</h2>
          <p className="section-subtitle">Trouvez des offres dans votre domaine d'expertise</p>

          <div className="categories-grid">
            {categories.slice(0, 8).map(cat => (
              <Link key={cat.id} to={`/jobs?category=${encodeURIComponent(cat.name)}`} className="category-card">
                <FiBriefcase className="cat-icon" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Pourquoi EmploiPro ?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FiTrendingUp className="feature-icon" />
              <h3>Performance</h3>
              <p>Plateforme rapide et intuitive pour une expérience optimale</p>
            </div>
            <div className="feature-card">
              <FiShield className="feature-icon" />
              <h3>Fiabilité</h3>
              <p>Offres vérifiées et entreprises authentiques pour votre sécurité</p>
            </div>
            <div className="feature-card">
              <FiStar className="feature-icon" />
              <h3>Qualité</h3>
              <p>Les meilleures opportunités sélectionnées pour vous</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à trouver votre prochain emploi ?</h2>
            <p>Rejoignez des milliers de candidats et recruteurs sur EmploiPro</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">Créer un compte gratuit</Link>
              <Link to="/jobs" className="btn btn-secondary btn-lg">Explorer les offres</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
