import { FiMessageCircle } from 'react-icons/fi';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/237672342582?text=Bonjour%2C%20je%20vous%20contacte%20depuis%20NexadigicPro."
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Contacter sur WhatsApp"
    >
      <FiMessageCircle />
      <span className="whatsapp-tooltip">Discuter sur WhatsApp</span>
    </a>
  );
}
