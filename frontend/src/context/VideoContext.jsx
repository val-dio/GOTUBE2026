import { createContext, useContext, useState, useCallback } from 'react';
import { searchVideos as apiSearch, getTrending } from '../services/api';

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

export const VideoProvider = ({ children }) => {
  const [view,         setView]       = useState('home');
  const [videos,       setVideos]     = useState([]);
  const [currentVideo, setCurrent]    = useState(null);
  const [loading,      setLoading]    = useState(false);
  const [searchError,  setSearchError] = useState('');
  const [feedHeading,  setFeedHeading] = useState('Recommended Streams');

  const openVideo = useCallback((video) => {
    setCurrent(video);
    setView('player');
    window.history.pushState({ view: 'player', videoId: video.id }, '', `/watch/${video.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const search = useCallback(async (q) => {
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = q.match(ytRegex);
    
    if (match && match[1]) {
      const videoId = match[1];
      openVideo({
        id: videoId,
        title: 'Video from URL',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
      return;
    }

    setLoading(true);
    setSearchError('');
    try {
      const results = await apiSearch(q);
      setVideos(Array.isArray(results) ? results.map(normalize).filter(v => v.id) : []);
      setFeedHeading(`Search results for: "${q}"`);
      setView('home');
      setCurrent(null);
    } catch (e) {
      setSearchError(e.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [openVideo]);

  const loadDefault = useCallback(async () => {
    setLoading(true);
    setSearchError('');
    setFeedHeading('Recommended Streams');
    try {
      const results = await getTrending();
      setVideos(Array.isArray(results) ? results.map(normalize).filter(v => v.id) : []);
    } catch (_) {
      /* silent fallback */
    } finally {
      setView('home');
      setCurrent(null);
      setLoading(false);
    }
  }, []);

  const goHome = useCallback(() => {
    setView('home');
    setCurrent(null);
    window.history.pushState({ view: 'home' }, '', '/');
  }, []);

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
