import { memo } from 'react';
import { useVideo } from '../context/VideoContext';

const VideoCard = memo(({ video }) => {
  const { openVideo } = useVideo();

  const videoId   = video?.id;
  const title     = video?.title     || 'No Title Available';
  const thumbnail = video?.thumbnail || '';

  if (!videoId) return null;

  return (
    <button
      onClick={() => openVideo(video)}
      className="flex flex-col gap-2 w-full text-left group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      aria-label={`Play ${title}`}
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = 'https://placehold.co/320x180/1f2937/4b5563?text=No+Image'; }}
        />
      </div>
      {/* Title */}
      <div className="px-1 mt-1">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-white line-clamp-2 leading-snug transition-colors">
          {title}
        </h3>
      </div>
    </button>
  );
});

VideoCard.displayName = 'VideoCard';
export default VideoCard;
