import { createContext, useContext, useState, useCallback } from 'react';
import { searchVideos as apiSearch } from '../services/api';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [view,         setView]        = useState('home');
  const [videos,       setVideos]      = useState([]);
  const [currentVideo, setCurrent]     = useState(null);
  const [related,      setRelated]     = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [searchError,  setSearchError] = useState('');


  const search = useCallback(async (q) => {
    setLoading(true);
    setSearchError('');
    try {
      const results = await apiSearch(q);
      setVideos(results);
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
      const year = new Date().getFullYear();
      const results = await apiSearch(`trending music ${year}`);
      setVideos(results);
      setView('home');
      setCurrent(null);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  const openVideo = useCallback(async (video) => {
    setCurrent(video);
    setView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const results = await apiSearch(video.title.split(' ').slice(0, 3).join(' '));
      setRelated(results.filter(v => v.videoId !== video.videoId));
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
