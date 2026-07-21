import { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { getAllJobs, deleteJob } from '../../services/api';
import '../recruiter/Recruiter.css';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllJobs().then(setJobs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      await deleteJob(id);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des offres</h1>
        <p>{jobs.length} offre{jobs.length > 1 ? 's' : ''} au total</p>
      </div>

      <div className="jobs-table">
        <table>
          <thead>
            <tr>
              <th>Poste</th>
              <th>Entreprise</th>
              <th>Recruteur</th>
              <th>Candidatures</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td><strong>{job.title}</strong><br /><small>{job.city}, {job.country}</small></td>
                <td>{job.company}</td>
                <td>{job.recruiterName}</td>
                <td><span className="badge badge-info">{job.appCount || 0}</span></td>
                <td>
                  {job.is_active && new Date(job.expires_at) > new Date()
                    ? <span className="badge badge-success">Active</span>
                    : <span className="badge badge-danger">Expirée</span>
                  }
                </td>
                <td>
                  <button className="action-btn red" onClick={() => handleDelete(job.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
