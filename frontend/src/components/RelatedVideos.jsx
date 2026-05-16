import VideoCard from './VideoCard';

const RelatedVideos = ({ videos }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Related Videos</h3>
    {videos.length === 0 && (
      <p className="text-xs text-gray-400 dark:text-gray-500">No related videos found.</p>
    )}
    {videos.map(v => <VideoCard key={v.url} video={v} compact />)}
  </div>
);

export default RelatedVideos;
