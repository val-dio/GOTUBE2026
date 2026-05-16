import { useVideo } from '../context/VideoContext';
import VideoPlayer from '../components/VideoPlayer';
import DownloadPanel from '../components/DownloadPanel';
import RelatedVideos from '../components/RelatedVideos';

const Player = () => {
  const { currentVideo, related } = useVideo();
  if (!currentVideo) return null;

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          <VideoPlayer video={currentVideo} />
          <DownloadPanel video={currentVideo} />
        </div>

        {/* Sidebar — below on mobile, right on desktop */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0">
          <RelatedVideos videos={related} />
        </aside>
      </div>
    </div>
  );
};

export default Player;
