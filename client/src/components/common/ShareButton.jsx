import { useState } from 'react';
import { FiCheck, FiLink, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import './ShareButton.css';

export default function ShareButton({ job, className = '' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/jobs/${job.id}`;
  const text = job.title;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copiez le lien de l’offre', url);
    }
  };

  return (
    <div className={`share-wrapper ${className}`} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="share-button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Partager l'offre ${job.title}`}
      >
        <FiShare2 /> <span>Partager</span>
      </button>
      {open && (
        <div className="share-menu" role="menu">
          <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" role="menuitem">
            <FiMessageCircle /> WhatsApp
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" role="menuitem">
            <span className="share-network-icon">f</span> Facebook
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" role="menuitem">
            <span className="share-network-icon">in</span> LinkedIn
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" role="menuitem">
            <span className="share-network-icon">X</span> X
          </a>
          <button type="button" onClick={copyLink} role="menuitem">
            {copied ? <FiCheck /> : <FiLink />} {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
        </div>
      )}
    </div>
  );
}
