import { useEffect } from 'react';
import { useVideo } from '../context/VideoContext';
import VideoGrid from '../components/VideoGrid';

const Spinner = () => (
  <div className="flex justify-center items-center py-20 col-span-full">
    <svg className="w-8 h-8 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  </div>
);

const Home = () => {
  const { videos, loading, searchError, loadDefault } = useVideo();

  useEffect(() => {
    if (!videos.length) loadDefault();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-4 py-6 max-w-screen-xl mx-auto min-h-full bg-white dark:bg-gray-950 transition-colors">
      {searchError && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {searchError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Spinner />
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}

      {!loading && !videos.length && !searchError && (
        <p className="text-center text-gray-500 py-20 text-sm">
          Search for a video to get started.
        </p>
      )}
    </div>
  );
};

export default Home;
