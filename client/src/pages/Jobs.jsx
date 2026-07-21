import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import api from '../services/api';
import JobCard from '../components/jobs/JobCard';
import './Jobs.css';

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    country: searchParams.get('country') || '',
    district: searchParams.get('district') || '',
    mode: searchParams.get('mode') || '',
    type: searchParams.get('type') || '',
    page: parseInt(searchParams.get('page')) || 1
  });

  useEffect(() => {
    api.get('/jobs/categories').then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', city: '', country: '', district: '', mode: '', type: '', page: 1 });
  };

  const hasActiveFilters = filters.category || filters.city || filters.country || filters.district || filters.mode || filters.type;

  return (
    <div className="jobs-page">
      <div className="container">
        <div className="jobs-header">
          <h1>Offres d'emploi</h1>
          <p>{total} offre{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}</p>
        </div>

        <div className="jobs-toolbar">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Rechercher un poste, une entreprise..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /> Filtres {hasActiveFilters && <span className="filter-count">!</span>}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="form-group">
                <label>Catégorie</label>
                <select className="form-control" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
                  <option value="">Toutes</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Pays</label>
                <input className="form-control" placeholder="Ex: Cameroun" value={filters.country} onChange={(e) => updateFilter('country', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ville</label>
                <input className="form-control" placeholder="Ex: Douala" value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Quartier</label>
                <input className="form-control" placeholder="Ex: Akwa" value={filters.district} onChange={(e) => updateFilter('district', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Mode</label>
                <select className="form-control" value={filters.mode} onChange={(e) => updateFilter('mode', e.target.value)}>
                  <option value="">Tous</option>
                  <option value="on-site">Présentiel</option>
                  <option value="remote">En ligne</option>
                  <option value="hybrid">Hybride</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type de contrat</label>
                <select className="form-control" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
                  <option value="">Tous</option>
                  <option value="full-time">Temps plein</option>
                  <option value="part-time">Temps partiel</option>
                  <option value="contract">Contrat</option>
                  <option value="internship">Stage</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-sm" onClick={clearFilters} style={{ color: 'var(--danger)' }}>
                <FiX /> Effacer les filtres
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="jobs-results-grid">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {jobs.length === 0 && (
              <div className="empty-state">
                <h3>Aucune offre trouvée</h3>
                <p>Essayez de modifier vos critères de recherche</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`page-btn ${filters.page === page ? 'active' : ''}`}
                    onClick={() => setFilters(prev => ({ ...prev, page }))}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
