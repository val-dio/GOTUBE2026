/**
 * Normalize a raw YouTube API v3 item into a flat video object.
 * Works with both search results and single video lookups.
 */
export const normalize = (item) => ({
  id:           item.id?.videoId || (typeof item.id === 'string' ? item.id : ''),
  title:        item.snippet?.title        || item.title        || 'Untitled',
  thumbnail:    item.snippet?.thumbnails?.medium?.url
             || item.snippet?.thumbnails?.default?.url
             || item.thumbnails?.[0]?.url
             || '',
  channelTitle: item.snippet?.channelTitle || '',
  description:  item.snippet?.description  || '',
});
