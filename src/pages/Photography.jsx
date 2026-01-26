import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Photography.css';

function getOptimizedUrl(originalUrl, width) {
  if (!originalUrl) return '';

  // Check if it's a Supabase storage URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && originalUrl.includes(supabaseUrl)) {
    // Extract the path after /storage/v1/object/public/
    const match = originalUrl.match(/\/storage\/v1\/object\/public\/(.+)/);
    if (match) {
      const path = match[1];
      // Use Supabase image transformation
      return `${supabaseUrl}/storage/v1/render/image/public/${path}?width=${width}&quality=80`;
    }
  }

  return originalUrl;
}

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

function Photography() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              <div key={photo.id} className="photo-item">
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
    </div>
  );
}

export default Photography;
