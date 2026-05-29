import { useState, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideo } from '../context/VideoContext';
import { downloadVideoBlob } from '../services/api';
import VideoEmbed from '../components/player/VideoEmbed';
import DownloadButtons from '../components/player/DownloadButtons';
import DownloadBar from '../components/player/DownloadBar';
import RecommendedVideos from '../components/player/RecommendedVideos';

const Player = memo(() => {
  const { videoId: paramId } = useParams();
  const navigate = useNavigate();
  const { currentVideo, videos, openVideo } = useVideo();

  const [activeFormat, setActiveFormat] = useState(null);
  const [dlState,      setDlState]      = useState('idle');
  const [progress,     setProgress]     = useState(0);
  const [dlError,      setDlError]      = useState('');

  /* Use currentVideo from context, or fall back to a minimal object from URL param */
  const video   = currentVideo || (paramId ? { id: paramId, title: 'GoTube Video' } : null);
  const videoId = video?.id;

  if (!video || !videoId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500 dark:text-gray-400 text-sm">
        <p>No video selected.</p>
        <button
          onClick={() => navigate('/')}
          className="text-red-600 hover:underline font-medium"
        >
          Go back home
        </button>
      </div>
    );
  }

  const isDownloading = dlState !== 'idle' && dlState !== 'error' && dlState !== 'completed';

  /* ── Execute download with XHR progress ── */
  const handleDownload = useCallback(async (format) => {
    if (isDownloading) return;

    setActiveFormat(format);
    setDlState('preparing');
    setProgress(10);
    setDlError('');

    await new Promise(r => setTimeout(r, 600));
    setDlState('downloading');
    setProgress(0);

    try {
      const blob = await downloadVideoBlob(videoId, format, (pct) => setProgress(pct));

      setDlState('processing');
      setProgress(85);
      await new Promise(r => setTimeout(r, 500));

      setDlState('finalizing');
      setProgress(95);
      await new Promise(r => setTimeout(r, 400));

      /* Trigger browser file save */
      const ext       = format === 'mp3' ? 'mp3' : 'mp4';
      const safeTitle = (video.title || videoId).replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
      const filename  = `${safeTitle}.${ext}`;
      const url       = URL.createObjectURL(blob);
      const a         = document.createElement('a');
      a.href          = url;
      a.download      = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDlState('completed');
      setProgress(100);
      setTimeout(() => { setDlState('idle'); setProgress(0); setActiveFormat(null); }, 4000);

    } catch (err) {
      setDlError(err.message || 'Connection dropped or format unavailable.');
      setDlState('error');
      setProgress(0);
    }
  }, [videoId, video, isDownloading]);

  const handleCancel = useCallback(() => {
    setDlState('idle');
    setProgress(0);
    setDlError('');
    setActiveFormat(null);
  }, []);

  /* Related videos: everything in current list except the playing one */
  const related = videos.filter(v => v.id !== videoId).slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-950 min-h-full p-4 md:p-6 transition-colors">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

        {/* ── Left: player + download panel ── */}
        <div className="lg:col-span-2 space-y-4">

          <VideoEmbed videoId={videoId} title={video.title} />

          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug px-1">
            {video.title}
          </h1>

          {/* Download panel */}
          <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Download Video
              </h2>
              <DownloadButtons
                activeFormat={activeFormat}
                isDownloading={isDownloading}
                onDownload={handleDownload}
              />
            </div>
            <DownloadBar
              dlState={dlState}
              progress={progress}
              dlError={dlError}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* ── Right: recommended ── */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-300">
            Discover More
          </h3>
          <RecommendedVideos videos={related} onVideoClick={openVideo} />
        </div>

      </div>
    </div>
  );
});

Player.displayName = 'Player';
export default Player;