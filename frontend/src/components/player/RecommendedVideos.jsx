import { memo } from 'react';

const RecommendedVideos = memo(({ videos, onVideoClick }) => {
  if (!videos || videos.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        Search for more videos to see recommendations here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {videos.map(v => (
        <button
          key={v.id}
          onClick={() => onVideoClick(v)}
          className="flex gap-3 w-full text-left group hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors"
        >
          {/* Thumbnail */}
          <div className="w-32 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={v.thumbnail}
              alt={v.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.src = 'https://placehold.co/128x72/1f2937/4b5563?text=No+Image'; }}
            />
          </div>
          {/* Title */}
          <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-white font-medium line-clamp-2 leading-snug transition-colors">
            {v.title}
          </p>
        </button>
      ))}
    </div>
  );
});

RecommendedVideos.displayName = 'RecommendedVideos';
export default RecommendedVideos;
