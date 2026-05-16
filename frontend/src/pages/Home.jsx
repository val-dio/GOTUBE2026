import { useEffect } from 'react';
import { useVideo } from '../context/VideoContext';
import VideoGrid from '../components/VideoGrid';

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-red-600 rounded-full animate-spin" />
  </div>
);

const Home = () => {
  const { videos, loading, searchError, loadDefault } = useVideo();

  useEffect(() => {
    if (!videos.length) loadDefault();
  }, []);

  return (
    <div className="px-4 py-6 max-w-screen-xl mx-auto">
      {searchError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20
                        border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {searchError}
        </div>
      )}
      {loading ? <Spinner /> : <VideoGrid videos={videos} />}
      {!loading && !videos.length && !searchError && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-20 text-sm">
          Search for a video to get started.
        </p>
      )}
    </div>
  );
};

export default Home;
