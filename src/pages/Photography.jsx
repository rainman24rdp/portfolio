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
