const getVideoId = (video) => {
  // Backend returns id field directly from yt-dlp
  if (video.id) return video.id;
  // Fallback: parse from url
  const m = (video.url || '').match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : '';
};

const VideoPlayer = ({ video }) => {
  const videoId = getVideoId(video);

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
        {videoId ? (
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="mt-3">
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
          {video.title}
        </h1>
      </div>
    </div>
  );
};

export default VideoPlayer;
