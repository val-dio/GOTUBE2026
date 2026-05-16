const { execSync, spawn } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const https = require('https');
const http  = require('http');

const YTDLP    = process.env.YTDLP_PATH  || 'yt-dlp';
const FFMPEG   = process.env.FFMPEG_PATH || 'ffmpeg';
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

const getFfmpegDir = () => {
  try {
    const bin = FFMPEG === 'ffmpeg'
      ? execSync('where ffmpeg', { encoding: 'utf8' }).split('\n')[0].trim()
      : FFMPEG;
    return path.dirname(bin);
  } catch { return '.'; }
};

const sanitizeFilename = (name) =>
  name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);

/** Safely delete a file, silently ignore errors */
const safeDelete = (filePath) => {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
};

/** Download URL to dest path */
const fetchFile = (url, dest) =>
  new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { safeDelete(dest); reject(err); });
  });

// ── Progress line parser ──────────────────────────────────────────────────────
// Parses: [download]  25.4% of   50.00MiB at    2.00MiB/s ETA 00:10
const PROGRESS_RE = /\[download\]\s+([\d.]+)%\s+of\s+[\d.]+\S+\s+at\s+([\d.]+\S+)\s+ETA\s+(\S+)/;
const MERGE_RE    = /\[Merger\]|Merging formats|Destination:/i;
const FFMPEG_RE   = /\[ffmpeg\]/i;

const parseProgress = (line) => {
  const m = line.match(PROGRESS_RE);
  if (m) return { percent: parseFloat(m[1]), speed: m[2], eta: m[3] };
  return null;
};

const parseStage = (line) => {
  if (/\[download\].*Destination/i.test(line)) return 'Downloading';
  if (/\[download\].*audio/i.test(line))        return 'Downloading';
  if (MERGE_RE.test(line))                       return 'Processing';
  if (FFMPEG_RE.test(line))                      return 'Processing';
  if (/\[ExtractAudio\]/i.test(line))            return 'Processing';
  return null;
};

// ── Video meta ────────────────────────────────────────────────────────────────

const getVideoMeta = (url) =>
  new Promise((resolve, reject) => {
    const proc = spawn(
      YTDLP,
      [url, '--print', 'title', '--print', 'thumbnail', '--no-playlist', '--no-warnings'],
      { shell: false }
    );
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', () => {
      const lines = out.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines[0]) return resolve({ title: lines[0], thumbnail: lines[1] || '' });
      reject(new Error(err || 'Could not fetch video metadata'));
    });
    proc.on('error', reject);
    setTimeout(() => { proc.kill(); reject(new Error('getVideoMeta timeout')); }, 25000);
  });

// ── Dynamic format detection ──────────────────────────────────────────────────

const HEIGHT_LABELS = { 144: '144p', 240: '240p', 360: '360p', 480: '480p',
                        720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4K', 4320: '8K' };

/**
 * Returns array of available quality labels for a video URL.
 * Always includes 'mp3'. Only includes video qualities that actually exist.
 */
const getAvailableFormats = (url) =>
  new Promise((resolve, reject) => {
    const proc = spawn(YTDLP, [url, '-F', '--no-playlist', '--no-warnings'], { shell: false });
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code !== 0 && !out) return reject(new Error(err || 'yt-dlp -F failed'));

      const heights = new Set();
      for (const line of out.split('\n')) {
        // Match lines like: 137  mp4  1920x1080  1080p ...
        const m = line.match(/\s(\d{3,4})x(\d{3,4})\s/);
        if (m) {
          const h = parseInt(m[2], 10);
          // Round to nearest standard height
          const standard = Object.keys(HEIGHT_LABELS).map(Number)
            .find(s => Math.abs(s - h) <= 20);
          if (standard) heights.add(standard);
        }
      }

      const sorted  = [...heights].sort((a, b) => a - b);
      const formats = sorted.map(h => ({
        quality:  HEIGHT_LABELS[h],
        height:   h,
        formatId: buildFormatSelector(h),
        ext:      'mp4',
      }));

      // Always add MP3
      formats.push({ quality: 'MP3', height: 0, formatId: 'mp3', ext: 'mp3' });

      resolve(formats);
    });
    proc.on('error', reject);
    setTimeout(() => { proc.kill(); reject(new Error('getAvailableFormats timeout')); }, 30000);
  });

const buildFormatSelector = (height) => {
  if (height >= 4320) return 'bestvideo[height<=4320][ext=mp4]+bestaudio[ext=m4a]/best[height<=4320]';
  if (height >= 2160) return 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]';
  return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best[height<=${height}]`;
};

// ── Download with real progress ───────────────────────────────────────────────

/**
 * Download to TEMP_DIR, call onProgress(patch) with real yt-dlp updates.
 * Returns temp file path — caller MUST delete it after use.
 */
const downloadMedia = async (url, formatId, onProgress) => {
  const ffmpegDir = getFfmpegDir();
  const isAudio   = formatId === 'mp3';

  onProgress({ status: 'Fetching video info...', percent: 0 });

  // Get title for filename
  let title = `video_${Date.now()}`;
  try {
    const meta = await getVideoMeta(url);
    title = meta.title;
  } catch (_) {}

  const safeName = sanitizeFilename(title);
  const ext      = isAudio ? 'mp3' : 'mp4';
  const outPath  = path.join(TEMP_DIR, `${safeName}_${Date.now()}.${ext}`);

  onProgress({ status: 'Downloading...', percent: 2 });

  await new Promise((resolve, reject) => {
    const args = [
      url,
      '--no-playlist',
      '--ffmpeg-location', ffmpegDir,
      '-o', outPath,
      '--embed-thumbnail',
      '--add-metadata',
      '--newline',          // one progress line per line — easier to parse
    ];

    if (isAudio) {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      args.push('-f', formatId, '--merge-output-format', 'mp4');
    }

    const proc = spawn(YTDLP, args, { shell: false });

    // yt-dlp writes progress lines to stdout (not stderr)
    proc.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const prog  = parseProgress(line);
        const stage = parseStage(line);
        if (prog) {
          onProgress({ percent: Math.min(prog.percent, 95), speed: prog.speed, eta: prog.eta });
        }
        if (stage) {
          // Clear speed/eta when entering merge/processing phase
          const isProcessing = stage === 'Processing';
          onProgress({ status: stage, ...(isProcessing ? { speed: '', eta: '' } : {}) });
        }
      }
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      resolve();
    });
    proc.on('error', err => reject(new Error(`Failed to start yt-dlp: ${err.message}`)));
  });

  onProgress({ status: 'Finalizing...', percent: 98 });

  // Find the actual file (yt-dlp may adjust extension slightly)
  const finalPath = findFile(outPath, ext);
  return { filePath: finalPath, filename: `${safeName}.${ext}` };
};

const findFile = (expectedPath, ext) => {
  if (fs.existsSync(expectedPath)) return expectedPath;
  // Scan temp dir for newest matching extension
  const match = fs.readdirSync(TEMP_DIR)
    .filter(f => f.endsWith(`.${ext}`))
    .map(f => ({ f, t: fs.statSync(path.join(TEMP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (match) return path.join(TEMP_DIR, match.f);
  throw new Error('Downloaded file not found');
};

// ── Search ────────────────────────────────────────────────────────────────────

const searchYtDlp = (query, maxResults = 16) =>
  new Promise((resolve, reject) => {
    const proc = spawn(YTDLP,
      [`ytsearch${maxResults}:${query}`, '--flat-playlist', '--dump-single-json', '--no-warnings'],
      { shell: false }
    );
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code !== 0 && !out.trim()) return reject(new Error(err || 'yt-dlp search failed'));
      try {
        const playlist = JSON.parse(out);
        const results  = (playlist.entries || []).map(v => ({
          videoId:     v.id,
          title:       v.title    || 'Unknown title',
          channel:     v.uploader || v.channel || v.uploader_id || 'Unknown',
          thumbnail:   v.thumbnails ? bestThumb(v.thumbnails)
                                    : `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
          publishedAt: v.upload_date ? fmtDate(v.upload_date) : null,
        })).filter(v => v.videoId);
        resolve(results);
      } catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
    });
    proc.on('error', reject);
  });

const bestThumb = (thumbs) => {
  if (!Array.isArray(thumbs) || !thumbs.length) return null;
  return [...thumbs].sort((a, b) =>
    Math.abs((a.width || 0) - 320) - Math.abs((b.width || 0) - 320)
  )[0]?.url || thumbs[thumbs.length - 1]?.url;
};

const fmtDate = (d) =>
  d?.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T00:00:00Z` : null;

module.exports = { downloadMedia, getAvailableFormats, getVideoMeta, safeDelete, TEMP_DIR, searchYtDlp };
