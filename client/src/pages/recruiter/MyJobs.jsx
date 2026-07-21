import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiRefreshCw, FiUsers } from 'react-icons/fi';
import api from '../../services/api';
import './Recruiter.css';

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs/recruiter/my-jobs');
      setJobs(res.data || []);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleReactivate = async (job) => {
    const newDate = prompt('Nouvelle date d\'expiration (AAAA-MM-JJ):');
    if (!newDate) return;
    try {
      await api.put(`/jobs/${job.id}`, { ...job, expiresAt: newDate, isActive: 1 });
      fetchJobs();
      alert('Offre réactivée !');
    } catch (error) {
      alert('Erreur lors de la réactivation');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="section-header-row">
        <div className="page-header">
          <h1>Mes Offres</h1>
          <p>{jobs.length} offre{jobs.length > 1 ? 's' : ''} publiée{jobs.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/recruiter/post-job" className="btn btn-primary">Nouvelle offre</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune offre</h3>
          <p>Publiez votre première offre d'emploi</p>
        </div>
      ) : (
        <div className="jobs-table">
          <table>
            <thead>
              <tr>
                <th>Poste</th>
                <th>Candidatures</th>
                <th>Vues</th>
                <th>Statut</th>
                <th>Expiration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => {
                const isExpired = !job.isActive || new Date(job.expiresAt) <= new Date();
                return (
                  <tr key={job.id}>
                    <td>
                      <span className="job-link">{job.title}</span>
                      <small>{job.city}, {job.country}</small>
                    </td>
                    <td>
                      <Link to={`/recruiter/jobs/${job.id}`} className="badge badge-info">
                        <FiUsers size={12} /> {job.applicationCount || 0}
                      </Link>
                    </td>
                    <td>{job.views || 0}</td>
                    <td>
                      {isExpired
                        ? <span className="badge badge-danger">Expirée</span>
                        : <span className="badge badge-success">Active</span>
                      }
                    </td>
                    <td>{new Date(job.expiresAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/recruiter/jobs/${job.id}`} className="action-btn" title="Voir candidatures">
                          <FiEye />
                        </Link>
                        {isExpired && (
                          <button className="action-btn green" title="Réactiver" onClick={() => handleReactivate(job)}>
                            <FiRefreshCw />
                          </button>
                        )}
                        <button className="action-btn red" title="Supprimer" onClick={() => handleDelete(job.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
