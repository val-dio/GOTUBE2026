import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchVideos as apiSearch } from '../services/api';
import { normalize } from '../utils/normalize';
import { loadHistory, saveHistory, mergeHistory } from '../utils/history';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const navigate = useNavigate();

  const [videos,       setVideos]      = useState([]);
  const [currentVideo, setCurrent]     = useState(null);
  const [loading,      setLoading]     = useState(false);
  const [searchError,  setSearchError] = useState('');
  const [feedHeading,  setFeedHeading] = useState('Search for videos to get started');

  const searchCache = useRef({});
  const pendingRequests = useRef({});

  /* Initialize home feed from history on first load */
  useEffect(() => {
    const hist = loadHistory();
    if (hist.length > 0) {
      setVideos(hist);
      setFeedHeading('Your Search History');
    }
  }, []);

  /* ── Open a video → navigate to player ── */
  const openVideo = useCallback((video) => {
    setCurrent(video);
    navigate(`/watch/${video.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  /* ── Go home → clear player state ── */
  const loadDefault = useCallback(() => {
    const history = loadHistory();
    if (history.length > 0) {
      setVideos(history);
      setFeedHeading('Your Search History');
    } else {
      setVideos([]);
      setFeedHeading('Search for videos to get started');
    }
    setCurrent(null);
    setSearchError('');
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goHome = useCallback(() => {
    loadDefault();
    navigate('/');
  }, [loadDefault, navigate]);

  /* ── Search ── */
  const search = useCallback(async (q, customHeading = null) => {
    if (!q || !q.trim()) return;

    const CATEGORY_LABELS = {
      trending: 'Trending',
      highlights: 'Highlights',
      movies: 'Movies',
      gaming: 'Gaming',
      music: 'Music',
      sports: 'Sports',
      news: 'News',
      live: 'Live',
      podcasts: 'Podcasts',
      shorts: 'Shorts'
    };
    
    const resolvedHeading = customHeading || CATEGORY_LABELS[q.toLowerCase()] || `Results for: "${q}"`;


    /* Handle direct YouTube URL paste → open player immediately */
    const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\\w-]{11})/i;
    const match   = q.match(ytRegex);

    if (match && match[1]) {
      const videoId = match[1];
      setLoading(true);
      try {
        const results     = await apiSearch(videoId);
        const normalized  = Array.isArray(results) ? results.map(normalize) : [];
        const video       = normalized.find(v => v.id === videoId) || normalized[0] || {
          id:        videoId,
          title:     'YouTube Video',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
        openVideo(video);
      } catch {
        openVideo({
          id:        videoId,
          title:     'YouTube Video',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    /* Cache hit */
    if (searchCache.current[q]) {
      setVideos(searchCache.current[q]);
      setFeedHeading(resolvedHeading);
      setLoading(false);
      return;
    }

    if (pendingRequests.current[q]) return;
    pendingRequests.current[q] = true;

    /* Regular text search */
    setLoading(true);
    setSearchError('');

    try {
      const results    = await apiSearch(q);
      const normalized = Array.isArray(results) ? results.map(normalize).filter(v => v.id) : [];

      searchCache.current[q] = normalized;

      /* Persist to history */
      const newHistory = mergeHistory(normalized, loadHistory());
      saveHistory(newHistory);

      setVideos(normalized);
      setFeedHeading(resolvedHeading);
    } catch (e) {
      setSearchError(e.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      delete pendingRequests.current[q];
      setLoading(false);
    }
  }, [openVideo]);

  return (
    <VideoContext.Provider value={{
      videos, currentVideo, loading, searchError, feedHeading,
      search, loadDefault, openVideo, goHome,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => useContext(VideoContext);
