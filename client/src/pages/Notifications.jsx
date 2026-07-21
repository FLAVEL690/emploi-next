import { useState, useEffect } from 'react';
import { FiBell, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(res => {
      setNotifications(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: 1 })));
    } catch (error) {
      console.error(error);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => !notif.isRead && markRead(notif.id)}
            >
              <div className="notif-dot"></div>
              <div className="notif-content">
                <p>{notif.message}</p>
                <span className="notif-time">{new Date(notif.createdAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
