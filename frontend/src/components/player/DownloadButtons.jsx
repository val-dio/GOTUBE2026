import { memo } from 'react';
import Spinner from '../ui/Spinner';

const AudioIcon = () => (
  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DownloadButtons = memo(({ formats, formatsLoading, activeFormat, isDownloading, onDownload }) => {
  if (formatsLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Spinner size="sm" />
        <span>Loading formats...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {(formats || []).map(({ value, label, type, hd }) => {
        const isActive = isDownloading && activeFormat === value;
        return (
          <button
            key={value}
            onClick={() => onDownload(value)}
            disabled={isDownloading}
            aria-label={`Download ${label}`}
            className={`
              relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border
              transition-all duration-200 text-[13px] font-semibold tracking-wide select-none
              ${isActive
                ? 'bg-gray-700 border-gray-600 text-white cursor-wait'
                : 'bg-gray-900 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-white hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100'
              }
            `}
          >
            {type === 'audio' ? <AudioIcon /> : <VideoIcon />}
            <span>{label}</span>
            {hd && (
              <span className="ml-0.5 px-1 py-0.5 text-[9px] leading-none font-bold bg-red-600 text-white rounded-sm">
                HD
              </span>
            )}
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <Spinner size="sm" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});

DownloadButtons.displayName = 'DownloadButtons';
export default DownloadButtons;
