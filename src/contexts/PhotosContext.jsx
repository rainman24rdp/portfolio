import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const PhotosContext = createContext(null);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function PhotosProvider({ children }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchedAt = useRef(0);

  const fetchPhotos = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && lastFetchedAt.current && now - lastFetchedAt.current < CACHE_TTL) {
      return; // Use cached data
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
      setError(null);
      lastFetchedAt.current = Date.now();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Force refresh (e.g. after admin uploads)
  const refresh = useCallback(() => fetchPhotos(true), [fetchPhotos]);

  return (
    <PhotosContext.Provider value={{ photos, loading, error, fetchPhotos, refresh }}>
      {children}
    </PhotosContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotosContext);
  if (!context) {
    throw new Error('usePhotos must be used within a PhotosProvider');
  }
  return context;
}
