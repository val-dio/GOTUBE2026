const { getAvailableFormats, getVideoMeta } = require('../utils/ytdlp');

const formats = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: '"id" query param required' });

    const url = `https://www.youtube.com/watch?v=${id}`;

    const [fmts, meta] = await Promise.all([
      getAvailableFormats(url),
      getVideoMeta(url).catch(() => ({ title: '', thumbnail: '' })),
    ]);

    res.json({ title: meta.title, thumbnail: meta.thumbnail, formats: fmts });
  } catch (err) {
    next(err);
  }
};

module.exports = { formats };
