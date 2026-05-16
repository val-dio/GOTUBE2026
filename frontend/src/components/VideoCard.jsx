import { useVideo } from '../context/VideoContext';

const VideoCard = ({ video, compact = false }) => {
  const { openVideo } = useVideo();

  if (compact) {
    return (
      <button
        onClick={() => openVideo(video)}
        className="flex gap-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800
                   rounded-lg p-1.5 transition-colors"
      >
        <div className="shrink-0 w-36 sm:w-40 aspect-video rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {video.title}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button onClick={() => openVideo(video)} className="flex flex-col w-full text-left group">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
          {video.title}
        </p>
      </div>
    </button>
  );
};

export default VideoCard;
