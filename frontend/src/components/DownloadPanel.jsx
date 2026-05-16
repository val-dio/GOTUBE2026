import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getVideoData } from '../services/api';

const DownloadPanel = ({ video }) => {
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!video?.id && !video?.url) return;
    setLoading(true);
    setError('');
    setFormats([]);

    // Build full YouTube URL from id if available, else use url as-is
    const videoUrl = video.id
      ? `https://www.youtube.com/watch?v=${video.id}`
      : video.url;

    getVideoData(videoUrl)
      .then(data => setFormats(data.formats || []))
      .catch(() => setError('Could not load formats'))
      .finally(() => setLoading(false));
  }, [video?.url]);

  return (
    <div className="mt-3 sm:mt-4 rounded-xl border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Download</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Detecting available qualities...
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {formats.map(({ quality, url }) => (
            <button
              key={quality}
              onClick={() => window.open(url, '_blank')}
              className="flex flex-col items-center justify-center px-3 sm:px-4 py-2 rounded-lg
                         border-2 border-red-600 text-red-600
                         hover:bg-red-600 hover:text-white active:bg-red-700
                         transition-colors text-xs font-bold min-h-[44px]"
            >
              <span>Download {quality}</span>
              <span className="font-normal opacity-75 text-[10px]">
                {quality === 'mp3' ? 'Audio' : 'MP4'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadPanel;
