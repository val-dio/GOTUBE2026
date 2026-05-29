import { memo } from 'react';

const BAR_COLORS = {
  idle:        'bg-red-600',
  preparing:   'bg-yellow-500',
  downloading: 'bg-blue-500',
  processing:  'bg-purple-500',
  finalizing:  'bg-orange-500',
  completed:   'bg-green-500',
  error:       'bg-red-800',
};

const STATUS_TEXT = {
  idle:        '',
  preparing:   'Opening extraction tunnel...',
  downloading: 'Downloading — please wait...',
  processing:  'Processing and assembling tracks...',
  finalizing:  'Preparing file for your device...',
  completed:   'Saved to your downloads folder.',
  error:       '',
};

/**
 * DownloadBar — multi-phase progress bar.
 * Props: dlState, progress (0–100), dlError, onCancel
 */
const DownloadBar = memo(({ dlState, progress, dlError, onCancel }) => {
  if (dlState === 'idle') return null;

  const barColor   = BAR_COLORS[dlState] || 'bg-red-600';
  const statusText = dlState === 'error' ? dlError : STATUS_TEXT[dlState] || '';
  const pct        = dlState === 'downloading' ? progress : (
    dlState === 'preparing'  ? 10  :
    dlState === 'processing' ? 85  :
    dlState === 'finalizing' ? 95  :
    dlState === 'completed'  ? 100 : 0
  );

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`${barColor} h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white`}
            style={{ width: `${Math.max(pct, dlState === 'preparing' ? 10 : 0)}%` }}
          >
            {pct > 15 && `${pct}%`}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-red-500 hover:text-red-700 font-extrabold text-xl leading-none px-1 transition-colors"
          title="Cancel download"
          aria-label="Cancel download"
        >
          ×
        </button>
      </div>

      {statusText && (
        <p className={`text-xs text-center ${dlState === 'error' ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {statusText}
        </p>
      )}
    </div>
  );
});

DownloadBar.displayName = 'DownloadBar';
export default DownloadBar;
