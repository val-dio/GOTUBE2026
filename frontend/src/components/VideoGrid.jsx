import VideoCard from './VideoCard';

const VideoGrid = ({ videos }) => {
  if (!videos.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {videos.map(v => <VideoCard key={v.url} video={v} />)}
    </div>
  );
};

export default VideoGrid;
