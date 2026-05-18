import VideoCard from './VideoCard';

const VideoGrid = ({ videos }) => {
  if (!videos || !videos.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 w-full">
      {videos.map(v => <VideoCard key={v.id} video={v} />)}
    </div>
  );
};

export default VideoGrid;
