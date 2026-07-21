import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiBriefcase, FiUsers, FiImage, FiFileText, FiHeart, FiBell, FiUser, FiLogOut, FiPlusCircle, FiBarChart2 } from 'react-icons/fi';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLinks = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/admin', icon: <FiBarChart2 />, label: 'Statistiques', end: true },
        { to: '/admin/users', icon: <FiUsers />, label: 'Utilisateurs' },
        { to: '/admin/jobs', icon: <FiBriefcase />, label: 'Toutes les offres' },
        { to: '/admin/ads', icon: <FiImage />, label: 'Publicités' },
        { to: '/recruiter/jobs', icon: <FiBriefcase />, label: 'Mes Offres' },
        { to: '/recruiter/post-job', icon: <FiPlusCircle />, label: 'Nouvelle Offre' },
        { to: '/notifications', icon: <FiBell />, label: 'Notifications' },
      ];
    }
    if (user?.role === 'recruiter') {
      return [
        { to: '/recruiter', icon: <FiGrid />, label: 'Dashboard', end: true },
        { to: '/recruiter/jobs', icon: <FiBriefcase />, label: 'Mes Offres' },
        { to: '/recruiter/post-job', icon: <FiPlusCircle />, label: 'Nouvelle Offre' },
        { to: '/notifications', icon: <FiBell />, label: 'Notifications' },
      ];
    }
    return [
      { to: '/candidate', icon: <FiGrid />, label: 'Dashboard', end: true },
      { to: '/candidate/applications', icon: <FiFileText />, label: 'Candidatures' },
      { to: '/candidate/saved', icon: <FiHeart />, label: 'Favoris' },
      { to: '/notifications', icon: <FiBell />, label: 'Notifications' },
    ];
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-name">{user?.first_name} {user?.last_name}</span>
            <span className="sidebar-role">{user?.role === 'admin' ? 'Administrateur' : user?.role === 'recruiter' ? 'Recruteur' : 'Candidat'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {getLinks().map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FiUser />
            <span>Mon Profil</span>
          </NavLink>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <FiLogOut />
          <span>Déconnexion</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
