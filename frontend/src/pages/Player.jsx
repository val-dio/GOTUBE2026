import { useState, useRef } from 'react';
import { useVideo } from '../context/VideoContext';
import { downloadVideoBlob } from '../services/api';

/* ─── Quality Options (all 6 matching HTML + user request) ─── */
const QUALITIES = [
  { value: 'mp3', label: 'MP3 Audio Track' },
  { value: '360', label: 'MP4 Video (360p)' },
  { value: '480', label: 'MP4 Video (480p)' },
  { value: '720', label: 'MP4 Video (720p)' },
  { value: '1080', label: 'MP4 Video (1080p)' },
  { value: '2160', label: 'MP4 Video (4K)' },
];

/* ─── Download state config ─── */
const DL_STATES = {
  idle:        { label: 'Download',            barColor: 'bg-red-600',   pct: 0    },
  preparing:   { label: 'Preparing...',         barColor: 'bg-yellow-500', pct: 10  },
  downloading: { label: 'Downloading...',       barColor: 'bg-blue-500',  pct: null },
  processing:  { label: 'Processing...',        barColor: 'bg-purple-500', pct: 85  },
  finalizing:  { label: 'Finalizing...',        barColor: 'bg-orange-500', pct: 95  },
  completed:   { label: 'Completed!',           barColor: 'bg-green-500', pct: 100 },
  error:       { label: 'Error — Retry',        barColor: 'bg-red-800',   pct: 0   },
};

const STATUS_TEXT = {
  idle:        '',
  preparing:   'Opening extraction tunnel on Railway...',
  downloading: 'Please Wait to Complete',
  processing:  'Processing and assembling container tracks...',
  finalizing:  'Preparing file for download...',
  completed:   'Saved to your system download folder.',
  error:       '',
};

const Player = () => {
  const { currentVideo, videos, openVideo, goHome } = useVideo();
  const [quality, setQuality] = useState('720');
  const [dlState,   setDlState]   = useState('idle');
  const [progress,  setProgress]  = useState(0);
  const [dlError,   setDlError]   = useState('');
  const xhrRef = useRef(null);

  /* ── No video selected ── */
  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm bg-white dark:bg-gray-950 transition-colors">
        No video selected. Search and click a video to play it.
      </div>
    );
  }

  const videoId = currentVideo.id;

  /* ── Execute real blob download with XHR progress ── */
  const executeDownload = async (format) => {
    if (dlState !== 'idle' && dlState !== 'error') return;

    setDlState('preparing');
    setProgress(10);
    setDlError('');

    // Small delay to show "preparing" state
    await new Promise(r => setTimeout(r, 600));
    setDlState('downloading');
    setProgress(0);

    try {
      const blob = await downloadVideoBlob(videoId, format, (pct) => {
        setProgress(pct);
        // Once we get bytes, we're in downloading state
      });

      setDlState('processing');
      setProgress(85);
      await new Promise(r => setTimeout(r, 500));

      setDlState('finalizing');
      setProgress(95);
      await new Promise(r => setTimeout(r, 400));

      // Trigger browser file download
      const ext       = format === 'mp3' ? 'mp3' : 'mp4';
      const safeTitle = (currentVideo.title || videoId).replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
      const filename  = `${safeTitle}.${ext}`;
      const url       = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDlState('completed');
      setProgress(100);
      setTimeout(() => { setDlState('idle'); setProgress(0); }, 4000);

    } catch (err) {
      setDlError(err.message || 'Connection dropped or codec unsupported.');
      setDlState('error');
      setProgress(0);
    }
  };

  const abortDownload = () => {
    setDlState('idle');
    setProgress(0);
    setDlError('');
  };

  const isActive    = dlState !== 'idle' && dlState !== 'error' && dlState !== 'completed';
  const showBar     = dlState !== 'idle';
  const displayPct  = DL_STATES[dlState]?.pct !== null ? DL_STATES[dlState]?.pct : progress;
  const barColor    = DL_STATES[dlState]?.barColor || 'bg-red-600';
  const statusText  = STATUS_TEXT[dlState] || (dlState === 'error' ? dlError : '');

  /* ── Related: other videos from the current list ── */
  const related = videos.filter(v => v.id !== videoId).slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-950 min-h-full p-4 md:p-6 transition-colors">

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

        {/* ── Left: Player + Download Panel ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Iframe */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-gray-200 dark:border-gray-800">
            <iframe
              key={videoId}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={currentVideo.title || 'GoTube Streaming Center'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Video title */}
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug px-1">
            {currentVideo.title}
          </h1>

          {/* ── Download Panel ── */}
          <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4">

            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Download Video Here
                </h2>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {QUALITIES.map(q => (
                  <button
                    key={q.value}
                    onClick={() => {
                      setQuality(q.value);
                      executeDownload(q.value);
                    }}
                    disabled={isActive}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    {isActive && quality === q.value ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    ) : dlState === 'completed' && quality === q.value ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    )}
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {showBar && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                    <div
                      className={`${barColor} h-full transition-all duration-500 flex items-center justify-center
                                  text-[10px] font-bold text-white`}
                      style={{ width: `${Math.max(displayPct, dlState === 'preparing' ? 10 : 0)}%` }}
                    >
                      {displayPct > 15 && `${displayPct}%`}
                    </div>
                  </div>
                  <button
                    onClick={abortDownload}
                    className="text-red-500 hover:text-red-700 font-extrabold text-xl leading-none px-1"
                    title="Cancel download"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                  {dlState !== 'error' && dlState !== 'completed' ? 'Please Wait to Complete' : (dlState === 'completed' ? 'Completed!' : '')}
                </p>
                {dlState === 'error' && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 text-center">{dlError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Related Videos ── */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-300">Discover More Streams</h3>

          {related.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Use the search bar above to find more videos.
            </p>
          ) : (
            related.map(v => (
              <button
                key={v.id}
                onClick={() => openVideo(v)}
                className="flex gap-3 w-full text-left group hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors"
              >
                <div className="w-32 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = 'https://placehold.co/128x72/333333/555?text=No+Image'; }}
                  />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-white font-medium line-clamp-2 leading-snug transition-colors">
                  {v.title}
                </p>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Player;