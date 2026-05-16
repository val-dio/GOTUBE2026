import { useVideo } from '../context/VideoContext';
import VideoPlayer from '../components/VideoPlayer';
import DownloadPanel from '../components/DownloadPanel';

const Player = () => {
  const { currentVideo } = useVideo();
  if (!currentVideo) return null;

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-3xl mx-auto">
      <VideoPlayer video={currentVideo} />
      <DownloadPanel video={currentVideo} />
    </div>
  );
};

export default Player;
