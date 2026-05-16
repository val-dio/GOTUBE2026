const VideoPlayer = ({ video }) => (
  <div className="w-full">
    {/* Embed */}
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
      <iframe
        key={video.videoId}
        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>

    {/* Meta */}
    <div className="mt-3">
      <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
        {video.title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{video.channel}</p>
    </div>
  </div>
);

export default VideoPlayer;
