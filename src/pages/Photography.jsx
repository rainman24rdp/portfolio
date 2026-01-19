import { useState, useEffect } from 'react';
import './Photography.css';

function Photography() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/photos');
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data = await response.json();
      setPhotos(data);
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
                <img 
                  src={`http://localhost:3001${photo.url}`}
                  alt={photo.title}
                  className="photo-image"
                />
                <p className="photo-title">{photo.title}</p>
                <p className="photo-category">{photo.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Photography;
