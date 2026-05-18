import { useVideo } from '../context/VideoContext';

const VideoCard = ({ video }) => {
  const { openVideo } = useVideo();

  const videoId   = video?.id;
  const title     = video?.title     || 'No Title Available';
  const thumbnail = video?.thumbnail || '';

  if (!videoId) return null;

  return (
    <div
      onClick={() => openVideo(video)}
      className="flex flex-col gap-2 w-full group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = 'https://placehold.co/320x180/333/gray?text=No+Image'; }}
        />
      </div>

      {/* Title */}
      <div className="px-1 mt-1">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-white line-clamp-2 leading-snug transition-colors">
          {title}
        </h3>
      </div>
    </div>
  );
};

export default VideoCard;

