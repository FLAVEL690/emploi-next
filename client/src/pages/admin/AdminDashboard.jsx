import { useState, useEffect } from 'react';
import { FiUsers, FiBriefcase, FiFileText, FiImage, FiTrendingUp } from 'react-icons/fi';
import { getAdminStats } from '../../services/api';
import '../recruiter/Recruiter.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Administration</h1>
        <p>Vue d'ensemble de la plateforme</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiUsers /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.totalUsers || 0}</span>
            <span className="stat-card-label">Utilisateurs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiBriefcase /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.activeJobs || 0}</span>
            <span className="stat-card-label">Offres actives</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiFileText /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.applications || 0}</span>
            <span className="stat-card-label">Candidatures</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><FiImage /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.activeAds || 0}</span>
            <span className="stat-card-label">Publicités</span>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '16px' }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiTrendingUp /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.recruiters || 0}</span>
            <span className="stat-card-label">Recruteurs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiUsers /></div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.candidates || 0}</span>
            <span className="stat-card-label">Candidats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
