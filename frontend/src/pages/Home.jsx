import { useEffect, memo } from 'react';
import { useParams } from 'react-router-dom';
import { useVideo } from '../context/VideoContext';
import VideoGrid from '../components/VideoGrid';
import EmptyState from '../components/ui/EmptyState';

const Home = memo(() => {
  const { query } = useParams();
  const { videos, loading, searchError, feedHeading, search, loadDefault } = useVideo();

  /* Trigger search when URL has /search/:query */
  useEffect(() => {
    if (query) {
      search(query);
    } else if (!videos.length) {
      loadDefault();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="px-4 py-6 max-w-screen-xl mx-auto min-h-full">

      {/* Feed heading */}
      {feedHeading && !loading && (
        <h1 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-5 tracking-wide">
          {feedHeading}
        </h1>
      )}

      {/* Search error */}
      {searchError && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {searchError}
        </div>
      )}

      {/* Video grid — passes loading for skeleton display */}
      <VideoGrid videos={videos} loading={loading} />

      {/* Empty state — only when not loading and no videos */}
      {!loading && !videos.length && !searchError && <EmptyState />}
    </div>
  );
});

Home.displayName = 'Home';
export default Home;
