import { useVideo } from '../context/VideoContext';

const DownloadProgress = () => {
  const { downloads, dismissJob } = useVideo();
  const jobs = Object.entries(downloads);
  if (!jobs.length) return null;

  return (
    <div className="mt-4 flex flex-col gap-3">
      {jobs.map(([jobId, job]) => {
        const isError     = job.status === 'error';
        const isCompleted = job.status === 'Completed';
        const pct         = Math.min(Math.round(job.percent || 0), 100);
        const barColor    = isError ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-red-600';

        return (
          <div key={jobId}
               className="rounded-xl border border-gray-200 dark:border-gray-700
                          bg-gray-50 dark:bg-gray-800 p-3">

            {/* Header: thumbnail + title + dismiss */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {job.thumbnail && (
                  <img src={job.thumbnail} alt=""
                       className="w-10 h-7 object-cover rounded shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {job.title || 'Downloading...'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {job.format === 'MP3' ? 'MP3 Audio' : `${job.format} MP4`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissJob(jobId)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                           text-lg leading-none ml-2 shrink-0"
                aria-label="Dismiss"
              >×</button>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Bottom row: error OR percentage + speed only */}
            <div className="flex items-center justify-between text-xs">
              {isError ? (
                <span className="text-red-500 font-medium truncate">
                  {job.error || 'Download failed'}
                </span>
              ) : isCompleted ? (
                <span className="text-green-500 dark:text-green-400 font-medium">Completed</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {job.speed || ''}
                </span>
              )}
              <span className="font-semibold text-gray-600 dark:text-gray-300 shrink-0 ml-2">
                {pct}%
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default DownloadProgress;
