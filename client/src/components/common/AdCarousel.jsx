import { useState, useEffect, useRef } from 'react';
import './AdCarousel.css';

export default function AdCarousel({ ads, className = '' }) {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (ads.length <= 1) return;
    timeoutRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % ads.length);
    }, 15000);
    return () => clearInterval(timeoutRef.current);
  }, [ads.length]);

  if (!ads || ads.length === 0) return null;

  return (
    <div className={`ad-carousel ${className}`}>
      <div className="ad-carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {ads.map(ad => (
          <a
            key={ad.id}
            href={ad.link_url || '#'}
            target={ad.link_url ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="ad-carousel-slide"
          >
            {ad.media_type === 'video' ? (
              <video src={ad.media_url} className="ad-desktop-media" autoPlay muted loop playsInline />
            ) : (
              <>
                <img src={ad.media_url} alt={ad.title} className="ad-desktop-media" />
                {ad.mobile_media_url && (
                  <img src={ad.mobile_media_url} alt={ad.title} className="ad-mobile-media" />
                )}
              </>
            )}
            {ad.media_type !== 'video' && !ad.mobile_media_url && (
              <img src={ad.media_url} alt={ad.title} className="ad-mobile-media" />
            )}
          </a>
        ))}
      </div>

      {ads.length > 1 && (
        <div className="ad-carousel-dots">
          {ads.map((_, i) => (
            <button
              key={i}
              className={`ad-carousel-dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
