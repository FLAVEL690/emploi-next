import { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import '../recruiter/Recruiter.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const roleLabels = { admin: 'Admin', recruiter: 'Recruteur', candidate: 'Candidat' };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des utilisateurs</h1>
        <p>{users.length} utilisateur{users.length > 1 ? 's' : ''} inscrits</p>
      </div>

      <div className="jobs-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Entreprise</th>
              <th>Date inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.firstName} {user.lastName}</strong></td>
                <td>{user.email}</td>
                <td><span className={`badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'recruiter' ? 'badge-info' : 'badge-success'}`}>{roleLabels[user.role]}</span></td>
                <td>{user.company || '-'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  {user.role !== 'admin' && (
                    <button className="action-btn red" onClick={() => handleDelete(user.id)}>
                      <FiTrash2 />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
