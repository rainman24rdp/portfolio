import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Photography.css';

function LazyImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="lazy-image-container">
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
      />
      {!isLoaded && <div className="image-placeholder" />}
    </div>
  );
}

// Format location from coordinates using reverse geocoding (optional)
function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

function PhotoModal({ photo, onClose }) {
  const hasMetadata = photo.camera || photo.lens || photo.aperture ||
                      photo.shutter_speed || photo.iso || photo.focal_length ||
                      photo.captured_at || photo.latitude;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal" onClick={e => e.stopPropagation()}>
        <button className="photo-modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="photo-modal-content">
          <div className="photo-modal-image">
            <img src={photo.url} alt={photo.title} />
          </div>

          <div className="photo-modal-info">
            <h2>{photo.title}</h2>
            {photo.category && <span className="photo-modal-category">{photo.category}</span>}

            {photo.labels && photo.labels.length > 0 && (
              <div className="photo-modal-labels">
                {photo.labels.map(label => (
                  <span key={label} className="photo-modal-label">{label}</span>
                ))}
              </div>
            )}

            {hasMetadata && (
              <div className="photo-modal-metadata">
                {photo.captured_at && (
                  <div className="metadata-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{new Date(photo.captured_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}

                {photo.camera && (
                  <div className="metadata-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{photo.camera}</span>
                  </div>
                )}

                {photo.lens && (
                  <div className="metadata-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span>{photo.lens}</span>
                  </div>
                )}

                {(photo.aperture || photo.shutter_speed || photo.iso || photo.focal_length) && (
                  <div className="metadata-settings">
                    {photo.focal_length && <span title="Focal Length">{photo.focal_length}</span>}
                    {photo.aperture && <span title="Aperture">{photo.aperture}</span>}
                    {photo.shutter_speed && <span title="Shutter Speed">{photo.shutter_speed}</span>}
                    {photo.iso && <span title="ISO">ISO {photo.iso}</span>}
                  </div>
                )}

                {photo.latitude && photo.longitude && (
                  <div className="metadata-item location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <a
                      href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatCoordinates(photo.latitude, photo.longitude)}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Photography() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="photography">
        <div className="photography-container">
          <h1>Photography</h1>
          <p className="photography-intro">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="photography">
        <div className="photography-container">
          <h1>Photography</h1>
          <p className="photography-intro error-message">
            Error loading photos: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="photography">
      <div className="photography-container">
        <h1>Photography</h1>
        <p className="photography-intro">
          Capturing moments and stories through the lens.
        </p>
        {photos.length === 0 ? (
          <p className="no-photos">No photos uploaded yet. Visit /admin to upload photos!</p>
        ) : (
          <div className="photo-gallery">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="photo-item"
                onClick={() => setSelectedPhoto(photo)}
              >
                <LazyImage
                  src={photo.url}
                  alt={photo.title}
                  className="photo-image"
                />
                <div className="photo-info">
                  <p className="photo-title">{photo.title}</p>
                  <p className="photo-category">{photo.category}</p>
                  {photo.labels && photo.labels.length > 0 && (
                    <div className="photo-labels">
                      {photo.labels.map(label => (
                        <span key={label} className="photo-label">{label}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}

export default Photography;
