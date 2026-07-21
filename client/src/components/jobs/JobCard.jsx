import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiBriefcase, FiMonitor } from 'react-icons/fi';
import './JobCard.css';

export default function JobCard({ job }) {
  const modeLabels = { 'on-site': 'Présentiel', 'remote': 'En ligne', 'hybrid': 'Hybride' };
  const typeLabels = { 'full-time': 'Temps plein', 'part-time': 'Temps partiel', 'contract': 'Contrat', 'internship': 'Stage', 'freelance': 'Freelance' };

  const timeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diff = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    if (diff < 7) return `Il y a ${diff} jours`;
    if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`;
    return `Il y a ${Math.floor(diff / 30)} mois`;
  };

  return (
    <Link to={`/jobs/${job.id}`} className="job-card card">
      <div className="job-card-header">
        <div className="job-company-logo">
          {job.company?.[0] || 'E'}
        </div>
        <div className="job-card-meta">
          <h3 className="job-card-title">{job.title}</h3>
          <p className="job-card-company">{job.company}</p>
        </div>
      </div>

      <div className="job-card-tags">
        <span className="badge badge-primary">
          <FiBriefcase size={12} /> {typeLabels[job.type] || job.type}
        </span>
        <span className="badge badge-info">
          <FiMonitor size={12} /> {modeLabels[job.mode] || job.mode}
        </span>
      </div>

      <div className="job-card-details">
        <span><FiMapPin size={14} /> {job.city}, {job.country}</span>
        <span><FiClock size={14} /> {timeAgo(job.created_at)}</span>
      </div>

      {job.salary && <p className="job-card-salary">{job.salary}</p>}
    </Link>
  );
}
