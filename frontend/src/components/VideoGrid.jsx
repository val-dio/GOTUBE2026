import { memo } from 'react';
import VideoCard from './VideoCard';
import SkeletonCard from './ui/SkeletonCard';

const SKELETON_COUNT = 12;

const VideoGrid = memo(({ videos, loading }) => {
  const gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 w-full';

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!videos || !videos.length) return null;

  return (
    <div className={gridClass}>
      {videos.map(v => <VideoCard key={v.id} video={v} />)}
    </div>
  );
});

VideoGrid.displayName = 'VideoGrid';
export default VideoGrid;
