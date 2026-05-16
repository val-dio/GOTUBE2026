const { getVideoFromWorker } = require('../utils/railwayWorker');

const getVideo = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !url.trim())
      return res.status(400).json({ error: '"url" query parameter is required' });

    // Accept both full URLs and plain video IDs
    const videoUrl = url.startsWith('http')
      ? url.trim()
      : `https://www.youtube.com/watch?v=${url.trim()}`;

    const data = await getVideoFromWorker(videoUrl);

    res.json({
      title:     data.title,
      thumbnail: data.thumbnail,
      duration:  data.duration,
      formats:   data.formats,   // [{ quality, url, type }]
    });
  } catch (err) {
    console.error('[/api/video]', err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message || 'Failed to fetch video info' });
  }
};

module.exports = { getVideo };
