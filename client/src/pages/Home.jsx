import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiBriefcase, FiArrowRight, FiTrendingUp, FiShield, FiZap, FiUsers, FiUserCheck, FiSend } from 'react-icons/fi';
import { getJobs, getJobStats, getCategories, getPublicAds } from '../services/api';
import JobCard from '../components/jobs/JobCard';
import AdCarousel from '../components/common/AdCarousel';
import SEO from '../components/common/SEO';
import './Home.css';

export default function Home() {
  const [stats, setStats] = useState({ jobs: 0, companies: 0, candidates: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [categories, setCategoriesList] = useState([]);
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getJobStats().then(setStats).catch(() => { });
    getJobs({ limit: 6 }).then(res => setRecentJobs(res.jobs || [])).catch(() => { });
    getCategories().then(setCategoriesList).catch(() => { });
    getPublicAds().then(setAds).catch(() => { });
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
      <SEO
        title="Accueil - Trouvez le job idéal au Cameroun"
        description="NexJob est la plateforme de recrutement #1 au Cameroun. Découvrez des milliers d'offres d'emploi à Douala, Yaoundé et partout au Cameroun. Postulez en un clic !"
        path="/"
      />
      <section className="hero">
        <div className="hero-content">
          <h1>Trouvez le <span className="highlight">job idéal</span> qui transformera votre carrière</h1>
          <p className="hero-subtitle">Rejoignez la plateforme qui connecte les meilleurs talents aux entreprises les plus innovantes. Votre prochaine opportunité est ici.</p>

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
            <AdCarousel ads={bannerAds} className="ad-carousel-banner" />
          </div>
        </section>
      )}

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
                <AdCarousel ads={sidebarAds} className="ad-carousel-sidebar" />
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

      {inlineAds.length > 0 && (
        <section className="inline-ads-section">
          <div className="container">
            <AdCarousel ads={inlineAds} className="ad-carousel-inline" />
          </div>
        </section>
      )}

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <FiZap className="feature-icon" />
              <h3>Rapide & Efficace</h3>
              <p>Postulez en un clic et recevez des réponses rapidement.</p>
            </div>
            <div className="feature-card">
              <FiShield className="feature-icon" />
              <h3>100% Fiable</h3>
              <p>Chaque offre et entreprise est vérifiée.</p>
            </div>
            <div className="feature-card">
              <FiTrendingUp className="feature-icon" />
              <h3>Opportunités Premium</h3>
              <p>Les meilleures offres du marché, sélectionnées pour vous.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à transformer votre carrière ?</h2>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">Commencer gratuitement</Link>
              <Link to="/jobs" className="btn btn-secondary btn-lg">Explorer les offres</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-band">
        <div className="container">
          <div className="stats-band-grid">
            <div className="stats-band-item">
              <FiBriefcase className="stats-band-icon" />
              <span className="stat-number">{stats.jobs}+</span>
              <span className="stat-label">Offres actives</span>
            </div>
            <div className="stats-band-item">
              <FiUsers className="stats-band-icon" />
              <span className="stat-number">{stats.companies}+</span>
              <span className="stat-label">Entreprises</span>
            </div>
            <div className="stats-band-item">
              <FiUserCheck className="stats-band-icon" />
              <span className="stat-number">{stats.candidates}+</span>
              <span className="stat-label">Candidats</span>
            </div>
            <div className="stats-band-item">
              <FiSend className="stats-band-icon" />
              <span className="stat-number">{stats.applications}+</span>
              <span className="stat-label">Candidatures envoyées</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
