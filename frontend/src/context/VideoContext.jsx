import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { searchVideos as apiSearch } from '../services/api';

const VideoContext = createContext();

/** Normalize a raw YouTube API v3 item into a flat video object */
const normalize = (item) => ({
  id:           item.id?.videoId || (typeof item.id === 'string' ? item.id : ''),
  title:        item.snippet?.title        || item.title        || 'Untitled',
  thumbnail:    item.snippet?.thumbnails?.medium?.url
             || item.snippet?.thumbnails?.default?.url
             || item.thumbnails?.[0]?.url
             || '',
  channelTitle: item.snippet?.channelTitle || '',
  description:  item.snippet?.description  || '',
});

const loadHistory = () => {
  try {
    const saved = localStorage.getItem('gotube_search_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history) => {
  localStorage.setItem('gotube_search_history', JSON.stringify(history));
};

export const VideoProvider = ({ children }) => {
  const [view,         setView]       = useState('home');
  const [videos,       setVideos]     = useState([]);
  const [currentVideo, setCurrent]    = useState(null);
  const [loading,      setLoading]    = useState(false);
  const [searchError,  setSearchError] = useState('');
  const [feedHeading,  setFeedHeading] = useState('Search for videos to get started');
  
  const searchCache = useRef({});
  const [historyVideos, setHistoryVideos] = useState(loadHistory);

  // Initialize home page on first load
  useEffect(() => {
    const hist = loadHistory();
    if (hist.length > 0) {
      setVideos(hist);
      setFeedHeading('Your Search History');
    } else {
      setFeedHeading('Search for videos to get started');
    }
  }, []);

  const openVideo = useCallback((video) => {
    setCurrent(video);
    setView('player');
    window.history.pushState({ view: 'player', videoId: video.id }, '', `/watch/${video.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const search = useCallback(async (q) => {
    const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i;
    const match = q.match(ytRegex);
    
    if (match && match[1]) {
      const videoId = match[1];
      setLoading(true);
      try {
        const results = await apiSearch(videoId);
        const normResults = Array.isArray(results) ? results.map(normalize) : [];
        const realVideo = normResults.find(v => v.id === videoId) || normResults[0] || {
          id: videoId,
          title: 'YouTube Video',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
        openVideo(realVideo);
      } catch (e) {
        openVideo({
          id: videoId,
          title: 'YouTube Video',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setSearchError('');
    
    // Check cache
    if (searchCache.current[q]) {
      const cachedResults = searchCache.current[q];
      setVideos(cachedResults);
      setFeedHeading(`Search results for: "${q}"`);
      
      setView(prev => {
        if (prev !== 'player') setCurrent(null);
        return prev === 'player' ? 'player' : 'home';
      });
      setLoading(false);
      return;
    }

    try {
      const results = await apiSearch(q);
      const normalizedResults = Array.isArray(results) ? results.map(normalize).filter(v => v.id) : [];
      
      // Update cache
      searchCache.current[q] = normalizedResults;
      
      // Update history
      setHistoryVideos(prevHistory => {
        const newHistory = [...normalizedResults, ...prevHistory].reduce((acc, curr) => {
          if (!acc.find(v => v.id === curr.id)) acc.push(curr);
          return acc;
        }, []).slice(0, 50);
        saveHistory(newHistory);
        return newHistory;
      });

      setVideos(normalizedResults);
      setFeedHeading(`Search results for: "${q}"`);
      
      setView(prev => {
        if (prev !== 'player') setCurrent(null);
        return prev === 'player' ? 'player' : 'home';
      });
    } catch (e) {
      setSearchError(e.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [openVideo]);

  const loadDefault = useCallback(() => {
    const history = loadHistory();
    if (history.length > 0) {
      setVideos(history);
      setFeedHeading('Your Search History');
    } else {
      setVideos([]);
      setFeedHeading('Search for videos to get started');
    }
    setView('home');
    setCurrent(null);
    setSearchError('');
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goHome = useCallback(() => {
    loadDefault();
    window.history.pushState({ view: 'home' }, '', '/');
  }, [loadDefault]);

  return (
    <VideoContext.Provider value={{
      view, videos, currentVideo, loading, searchError, feedHeading,
      search, loadDefault, openVideo, goHome,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => useContext(VideoContext);
