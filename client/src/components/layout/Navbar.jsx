import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut, FiGrid, FiLogIn, FiUserPlus } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'recruiter') return '/recruiter';
    return '/candidate';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">N</span>
          <span className="logo-text">NexJob</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className={isActive('/') ? 'nav-active' : ''}>Accueil</Link>
          <Link to="/jobs" className={isActive('/jobs') ? 'nav-active' : ''}>Offres</Link>
          <Link to="/about" className={isActive('/about') ? 'nav-active' : ''}>A propos</Link>
          <Link to="/contact" className={isActive('/contact') ? 'nav-active' : ''}>Contact</Link>
          {!user && (
            <div className="navbar-auth">
              <Link to="/login" className="nav-btn nav-btn-outline">
                <FiLogIn size={15} />
                <span>Connexion</span>
              </Link>
              <Link to="/register" className="nav-btn nav-btn-filled">
                <FiUserPlus size={15} />
                <span>Inscription</span>
              </Link>
            </div>
          )}
          {user && (
            <div className="navbar-user" ref={dropdownRef}>
              <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profil" className="user-avatar-img" />
                  ) : (
                    <>{user.first_name?.[0]}{user.last_name?.[0]}</>
                  )}
                </div>
                <span className="user-name">{user.first_name}</span>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <Link to={getDashboardLink()} onClick={() => setDropdownOpen(false)}>
                    <FiGrid /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    <FiUser /> Mon Profil
                  </Link>
                  <Link to="/notifications" onClick={() => setDropdownOpen(false)}>
                    <FiBell /> Notifications
                  </Link>
                  <button onClick={handleLogout}>
                    <FiLogOut /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </nav>
  );
}
