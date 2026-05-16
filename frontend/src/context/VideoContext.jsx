import { createContext, useContext, useState, useCallback } from 'react';
import { searchVideos as apiSearch } from '../services/api';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [view,        setView]       = useState('home');
  const [videos,      setVideos]     = useState([]);
  const [currentVideo, setCurrent]   = useState(null);
  const [related,     setRelated]    = useState([]);
  const [loading,     setLoading]    = useState(false);
  const [searchError, setSearchError] = useState('');

  const search = useCallback(async (q) => {
    setLoading(true);
    setSearchError('');
    try {
      const results = await apiSearch(q);
      setVideos(Array.isArray(results) ? results : []);
      setView('home');
      setCurrent(null);
    } catch (e) {
      setSearchError(e.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDefault = useCallback(async () => {
    setLoading(true);
    try {
      const results = await apiSearch('trending music 2025');
      setVideos(Array.isArray(results) ? results : []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  const openVideo = useCallback(async (video) => {
    setCurrent(video);
    setView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const results = await apiSearch(video.title.split(' ').slice(0, 3).join(' '));
      setRelated((Array.isArray(results) ? results : []).filter(v => v.id !== video.id));
    } catch (_) { setRelated([]); }
  }, []);

  return (
    <VideoContext.Provider value={{
      view, videos, currentVideo, related,
      loading, searchError,
      search, loadDefault, openVideo,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => useContext(VideoContext);
