import { useState, useEffect } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2500);
    const finish = setTimeout(() => onFinish(), 3000);
    return () => { clearTimeout(timer); clearTimeout(finish); };
  }, [onFinish]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-bg-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" style={{
            '--x': `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}%`,
            '--delay': `${Math.random() * 2}s`,
            '--size': `${Math.random() * 6 + 2}px`,
            '--duration': `${Math.random() * 3 + 2}s`
          }} />
        ))}
      </div>

      <div className="loading-content">
        <div className="loading-logo-wrapper">
          <div className="loading-ring">
            <div className="ring-segment"></div>
            <div className="ring-segment"></div>
            <div className="ring-segment"></div>
          </div>
          <div className="loading-logo-glow"></div>
          <img src="/logo_loading.jpeg" alt="NexJob" className="loading-logo" />
        </div>

        <div className="loading-text">
          <h1 className="loading-brand">
            <span className="brand-nex">NEX</span>
            <span className="brand-job">JOB</span>
          </h1>
          <p className="loading-tagline">Votre carrière commence ici</p>
        </div>

        <div className="loading-bar-container">
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
            <div className="loading-bar-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
