import { useState, useEffect } from 'react';
import { FiBell, FiCheckCircle } from 'react-icons/fi';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

export default function Notifications() {
  const { authUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    getNotifications(authUser.id).then(setNotifications).catch(() => {}).finally(() => setLoading(false));
  }, [authUser]);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead(authUser.id);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="section-header-row">
        <div className="page-header">
          <h1>Notifications</h1>
          <p>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <FiCheckCircle /> Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <FiBell size={40} />
          <h3>Aucune notification</h3>
          <p>Vous recevrez des notifications ici</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => !notif.is_read && markRead(notif.id)}
            >
              <div className="notif-dot"></div>
              <div className="notif-content">
                <p>{notif.message}</p>
                <span className="notif-time">{new Date(notif.created_at).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
