const { FORMAT_MAP } = require('../utils/ytdlp');

const videoInfo = async (req, res, next) => {
  try {
    const { url, id } = req.query;
    const target = url || (id ? `https://www.youtube.com/watch?v=${id}` : null);
    if (!target) return res.status(400).json({ error: 'Provide "url" or "id" query param' });

    res.json({ url: target, qualities: Object.keys(FORMAT_MAP) });
  } catch (err) {
    next(err);
  }
};

module.exports = { videoInfo };
