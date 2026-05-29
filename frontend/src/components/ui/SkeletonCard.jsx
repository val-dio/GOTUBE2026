/** YouTube-style skeleton card shown while videos are loading */
const SkeletonCard = () => (
  <div className="flex flex-col gap-2 w-full p-2" aria-hidden="true">
    {/* Thumbnail skeleton */}
    <div className="w-full aspect-video rounded-lg bg-gray-200 dark:bg-gray-800 skeleton-pulse" />
    {/* Title skeleton lines */}
    <div className="px-1 flex flex-col gap-1.5 mt-1">
      <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse w-full" />
      <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse w-3/4" />
    </div>
  </div>
);

export default SkeletonCard;
