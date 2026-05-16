import { createContext, useContext, useState, useCallback } from 'react';
import { searchVideos as apiSearch, downloadFile } from '../services/api';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [view,         setView]        = useState('home');
  const [videos,       setVideos]      = useState([]);
  const [currentVideo, setCurrent]     = useState(null);
  const [related,      setRelated]     = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [searchError,  setSearchError] = useState('');
  const [downloads,    setDownloads]   = useState({});
  // downloads: { [jobId]: { format, progress, status, speed, error } }

  const updateJob = useCallback((jobId, patch) =>
    setDownloads(prev => ({ ...prev, [jobId]: { ...prev[jobId], ...patch } }))
  , []);

  const dismissJob = useCallback((jobId) =>
    setDownloads(prev => { const n = { ...prev }; delete n[jobId]; return n; })
  , []);

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

  const download = useCallback(async (video, formatId, quality) => {
    const jobId    = `${video.videoId}-${formatId}-${Date.now()}`;
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

    updateJob(jobId, {
      format:    quality || formatId,   // human-readable label e.g. "1080p" or "MP3"
      formatId,                         // technical selector — used for the API call only
      title:     video.title,
      thumbnail: video.thumbnail,
      url:       videoUrl,
      percent:   0,
      status:    'Preparing...',
      speed:     '',
      eta:       '',
    });

    try {
      await downloadFile(videoUrl, formatId, (patch) => {
        updateJob(jobId, patch);
      });
      updateJob(jobId, { percent: 100, status: 'Completed', speed: '', eta: '' });
    } catch (e) {
      updateJob(jobId, { status: 'error', error: e.message || 'Download failed' });
    }
  }, [updateJob]);

  return (
    <VideoContext.Provider value={{
      view, videos, currentVideo, related,
      loading, searchError, downloads,
      search, loadDefault, openVideo, download, dismissJob,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => useContext(VideoContext);
