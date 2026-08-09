import { useState, useEffect, useRef, useCallback } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { enablePushNotifications, getPushStatus, isIOS, isStandalone } from '../../services/push';
import { useAuth } from '../../context/AuthContext';
import './NotificationPrompt.css';

const REPROMPT_DELAY = 60 * 1000;
const DONE_KEY = 'push_prompt_done';
const NEXT_KEY = 'push_prompt_next';

export default function NotificationPrompt() {
  const { authUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [visible, setVisible] = useState(false);
  const [asking, setAsking] = useState(false);
  const timerRef = useRef(null);

  const hideForever = () => {
    localStorage.setItem(DONE_KEY, '1');
    setVisible(false);
  };

  const scheduleReprompt = () => {
    localStorage.setItem(NEXT_KEY, String(Date.now() + REPROMPT_DELAY));
    setVisible(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), REPROMPT_DELAY);
  };

  const evaluate = useCallback(async () => {
    if (!authUser) return;
    if (localStorage.getItem(DONE_KEY) === '1') return;

    const s = await getPushStatus();
    setStatus(s);

    if (s === 'enabled') {
      localStorage.setItem(DONE_KEY, '1');
      return;
    }
    // iPhone sans PushManager : afficher l'aide une seule fois
    if (s === 'unsupported') {
      if (isIOS()) setVisible(true);
      return;
    }

    const next = parseInt(localStorage.getItem(NEXT_KEY) || '0', 10);
    if (Date.now() >= next) setVisible(true);
  }, [authUser]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleEnable = async () => {
    if (asking) return;
    setAsking(true);
    try {
      const result = await enablePushNotifications();
      if (result.granted) {
        hideForever();
        setStatus('enabled');
      } else {
        setStatus(result.reason === 'denied' ? 'denied' : 'default');
        scheduleReprompt();
      }
    } catch (error) {
      console.error(error);
      scheduleReprompt();
    } finally {
      setAsking(false);
    }
  };

  const handleClose = () => {
    if (status === 'unsupported' && isIOS()) {
      hideForever();
      return;
    }
    scheduleReprompt();
  };

  if (!authUser || !visible) return null;

  const denied = status === 'denied';
  const iosNotStandalone = isIOS() && !isStandalone();

  return (
    <div className="notification-prompt" role="alertdialog" aria-label="Notifications">
      <div className="notification-prompt-icon">
        <FiBell />
      </div>
      <div className="notification-prompt-text">
        <strong>
          {denied ? 'Notifications bloquées' : iosNotStandalone ? 'Notifications sur iPhone' : 'Activez les notifications'}
        </strong>
        <p>
          {denied
            ? 'Votre navigateur bloque les notifications NexJob. Cliquez sur « Réessayer » après les avoir réactivées dans les paramètres du navigateur.'
            : iosNotStandalone
              ? 'Ajoutez NexJob à l\'écran d\'accueil (menu Partager) puis relancez-le depuis l\'icône pour activer les notifications.'
              : 'Recevez en temps réel vos messages, nouvelles offres et candidatures, même hors de l\'application.'}
        </p>
      </div>
      <div className="notification-prompt-actions">
        {!iosNotStandalone && (
          <button className="btn btn-primary btn-sm" onClick={handleEnable} disabled={asking}>
            {asking ? 'Activation...' : denied ? 'Réessayer' : 'Activer les notifications'}
          </button>
        )}
        <button className="btn btn-secondary btn-sm" onClick={handleClose}>
          Plus tard
        </button>
      </div>
      <button className="notification-prompt-close" onClick={handleClose} aria-label="Fermer">
        <FiX />
      </button>
    </div>
  );
}
