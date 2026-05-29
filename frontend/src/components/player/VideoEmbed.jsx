import { memo } from 'react';

/** Responsive YouTube iframe embed */
const VideoEmbed = memo(({ videoId, title }) => (
  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-gray-200 dark:border-gray-800">
    <iframe
      key={videoId}
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
      title={title || 'GoTube Video Player'}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  </div>
));

VideoEmbed.displayName = 'VideoEmbed';
export default VideoEmbed;
