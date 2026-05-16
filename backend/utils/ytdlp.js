const { execSync, spawn, exec } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const https = require('https');
const http  = require('http');

const YTDLP    = process.env.YTDLP_PATH  ? path.resolve(process.env.YTDLP_PATH)  : 'yt-dlp';
const FFMPEG   = process.env.FFMPEG_PATH ? path.resolve(process.env.FFMPEG_PATH) : 'ffmpeg';
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './temp');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Startup debug: confirm yt-dlp + ffmpeg are reachable ─────────────────────
console.log('[debug] YTDLP_PATH env:', process.env.YTDLP_PATH || 'not set (using yt-dlp)');
console.log('[debug] FFMPEG_PATH env:', process.env.FFMPEG_PATH || 'not set (using ffmpeg)');
console.log('[debug] YTDLP resolved:', YTDLP);
console.log('[debug] FFMPEG resolved:', FFMPEG);

exec(`"${YTDLP}" --version`, (err, stdout) =>
  console.log('[debug] yt-dlp version:', err ? `NOT FOUND — ${err.message}` : stdout.trim())
);
exec(`"${FFMPEG}" -version`, (err, stdout) =>
  console.log('[debug] ffmpeg version:', err ? `NOT FOUND — ${err.message}` : stdout.split('\n')[0].trim())
);


// ── Browser-like headers injected into every yt-dlp call ─────────────────────
const BROWSER_HEADERS = [
  '--user-agent',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  '--add-header', 'Accept-Language:en-US,en;q=0.9',
  '--add-header', 'Referer:https://www.youtube.com/',
];

// Use tv + web player clients — tv client bypasses most format restrictions
const EXTRACTOR_ARGS = [
  '--extractor-args', 'youtube:player_client=tv,web,android',
];

// Cookies file path — required on server IPs to bypass YouTube bot detection
const COOKIES_PATH = process.env.COOKIES_PATH
  ? path.resolve(process.env.COOKIES_PATH)
  : path.resolve(__dirname, '../cookies.txt');

const cookiesFlag = () => {
  const exists = fs.existsSync(COOKIES_PATH);
  console.log('[debug] cookies.txt:', exists ? `FOUND at ${COOKIES_PATH}` : `NOT FOUND at ${COOKIES_PATH}`);
  return exists ? ['--cookies', COOKIES_PATH] : [];
};

// Common flags for all yt-dlp calls
const COMMON_FLAGS = [
  '--no-playlist',
  '--no-warnings',
  '--force-ipv4',
  '--no-check-certificates',
  ...BROWSER_HEADERS,
  ...EXTRACTOR_ARGS,
];

// Returns COMMON_FLAGS + cookies if cookies.txt exists
const flags = () => [...COMMON_FLAGS, ...cookiesFlag()];

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Resolve ffmpeg directory — uses FFMPEG_PATH env var or 'which ffmpeg' */
const getFfmpegDir = () => {
  // If FFMPEG_PATH is explicitly set, use its directory directly
  if (process.env.FFMPEG_PATH) {
    const dir = path.dirname(path.resolve(process.env.FFMPEG_PATH));
    console.log('[debug] getFfmpegDir from env:', dir);
    return dir;
  }
  try {
    const bin = execSync('which ffmpeg', { encoding: 'utf8' }).split('\n')[0].trim();
    console.log('[debug] getFfmpegDir which:', bin);
    return path.dirname(bin);
  } catch (e) {
    console.warn('[debug] getFfmpegDir fallback /usr/bin:', e.message);
    return '/usr/bin';
  }
};

const sanitizeFilename = (name) =>
  name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);

const safeDelete = (filePath) => {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
};

const fetchFile = (url, dest) =>
  new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { safeDelete(dest); reject(err); });
  });

// ── Retry wrapper with exponential backoff ────────────────────────────────────
/**
 * Runs fn(), retries up to maxRetries times on failure.
 * Waits 2^attempt * 1000ms between retries (1s, 2s, 4s).
 */
const withRetry = async (fn, maxRetries = 3) => {
  let lastErr;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const is429 = err.message?.includes('429') || err.message?.includes('Too Many');
      if (i < maxRetries) {
        const delay = Math.pow(2, i) * 1500; // 1.5s, 3s, 6s
        console.warn(`[yt-dlp] attempt ${i + 1} failed${is429 ? ' (429)' : ''}, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
};

// ── Spawn helper ──────────────────────────────────────────────────────────────
/** Spawn yt-dlp, collect stdout/stderr, resolve on close */
const spawnYtDlp = (args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(YTDLP, args, { shell: false });
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code !== 0 && !out.trim()) return reject(new Error(err || `yt-dlp exited ${code}`));
      resolve({ out, err, code });
    });
    proc.on('error', reject);
  });

// ── Progress parsers ──────────────────────────────────────────────────────────
const PROGRESS_RE = /\[download\]\s+([\d.]+)%\s+of\s+[\d.]+\S+\s+at\s+([\d.]+\S+)\s+ETA\s+(\S+)/;

const parseProgress = (line) => {
  const m = line.match(PROGRESS_RE);
  if (m) return { percent: parseFloat(m[1]), speed: m[2], eta: m[3] };
  return null;
};

const parseStage = (line) => {
  if (/\[download\].*Destination/i.test(line))          return 'Downloading';
  if (/\[Merger\]|Merging formats/i.test(line))         return 'Processing';
  if (/\[ffmpeg\]|\[ExtractAudio\]/i.test(line))        return 'Processing';
  return null;
};

// ── Video meta ────────────────────────────────────────────────────────────────
const getVideoMeta = (url) =>
  withRetry(() => new Promise((resolve, reject) => {
    // Use --dump-single-json instead of --print to avoid format selection errors
    const args = [
      url,
      '--dump-single-json',
      '--skip-download',
      ...flags(),
    ];
    console.log('[debug] getVideoMeta:', url);
    const proc = spawn(YTDLP, args, { shell: false });
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', (code) => {
      try {
        const info      = JSON.parse(out.trim());
        const title     = info.title     || '';
        const thumbnail = info.thumbnail || `https://i.ytimg.com/vi/${info.id}/mqdefault.jpg`;
        console.log('[debug] getVideoMeta result:', title || 'EMPTY');
        if (title) return resolve({ title, thumbnail });
        reject(new Error('No title in metadata'));
      } catch (_) {
        console.log('[debug] getVideoMeta parse failed | err:', err.slice(0, 120));
        reject(new Error(err || 'Could not fetch video metadata'));
      }
    });
    proc.on('error', reject);
    setTimeout(() => { proc.kill(); reject(new Error('getVideoMeta timeout')); }, 30000);
  }));

// ── Dynamic format detection ──────────────────────────────────────────────────
const HEIGHT_LABELS = {
  144: '144p', 240: '240p', 360: '360p', 480: '480p',
  720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4K', 4320: '8K',
};

const getAvailableFormats = (url) =>
  withRetry(() => new Promise((resolve, reject) => {
    const args = [url, '-F', ...flags()];
    console.log('[debug] getAvailableFormats args:', args.join(' '));
    const proc = spawn(YTDLP, args, { shell: false });
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      console.log('[debug] yt-dlp -F exit code:', code);
      console.log('[debug] yt-dlp -F stdout:\n', out);
      if (err) console.log('[debug] yt-dlp -F stderr:\n', err);

      if (code !== 0 && !out) return reject(new Error(err || 'yt-dlp -F failed'));

      const heights = new Set();
      for (const line of out.split('\n')) {
        // Pattern 1: "137  mp4  1920x1080  1080p"
        const m1 = line.match(/\s(\d{2,4})x(\d{2,4})\s/);
        // Pattern 2: "1080p" label directly in the line
        const m2 = line.match(/\b(\d{3,4})p\b/);

        let h = 0;
        if (m1) h = parseInt(m1[2], 10);
        else if (m2) h = parseInt(m2[1], 10);

        if (h > 0) {
          const standard = Object.keys(HEIGHT_LABELS).map(Number)
            .find(s => Math.abs(s - h) <= 30);
          if (standard) heights.add(standard);
        }
      }

      console.log('[debug] detected heights:', [...heights]);

      // If no video formats found, the video may be restricted
      // Still return MP3 as the only option
      if (heights.size === 0) {
        console.warn('[debug] No video formats detected — video may be restricted or storyboard-only');
      }

      const formats = [...heights].sort((a, b) => a - b).map(h => ({
        quality:  HEIGHT_LABELS[h],
        height:   h,
        formatId: buildFormatSelector(h),
        ext:      'mp4',
      }));

      formats.push({ quality: 'MP3', height: 0, formatId: 'mp3', ext: 'mp3' });
      console.log('[debug] final formats:', formats.map(f => f.quality).join(', '));
      resolve(formats);
    });
    proc.on('error', (e) => { console.error('[debug] spawn error:', e.message); reject(e); });
    setTimeout(() => { proc.kill(); reject(new Error('getAvailableFormats timeout')); }, 35000);
  }));

const buildFormatSelector = (height) => {
  if (height >= 4320) return 'bestvideo[height<=4320][ext=mp4]+bestaudio[ext=m4a]/best[height<=4320]';
  if (height >= 2160) return 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]';
  return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best[height<=${height}]`;
};

// ── Download with real progress ───────────────────────────────────────────────
const downloadMedia = async (url, formatId, onProgress) => {
  const ffmpegDir = getFfmpegDir();
  const isAudio   = formatId === 'mp3';

  onProgress({ status: 'Fetching video info...', percent: 0 });

  let title = `video_${Date.now()}`;
  try {
    const meta = await getVideoMeta(url);
    title = meta.title;
  } catch (_) {}

  const safeName = sanitizeFilename(title);
  const ext      = isAudio ? 'mp3' : 'mp4';
  const outPath  = path.join(TEMP_DIR, `${safeName}_${Date.now()}.${ext}`);

  onProgress({ status: 'Downloading...', percent: 2 });

  await withRetry(() => new Promise((resolve, reject) => {
    const args = [
      url,
      '--ffmpeg-location', ffmpegDir,
      '-o', outPath,
      '--embed-thumbnail',
      '--add-metadata',
      '--newline',
      ...flags(),
    ];

    if (isAudio) {
      args.push(
        '-f', 'bestaudio/best',
        '-x', '--audio-format', 'mp3', '--audio-quality', '0'
      );
    } else {
      args.push('-f', formatId, '--merge-output-format', 'mp4');
    }

    const proc = spawn(YTDLP, args, { shell: false });

    proc.stdout.on('data', (chunk) => {
      for (const line of chunk.toString().split('\n')) {
        const prog  = parseProgress(line);
        const stage = parseStage(line);
        if (prog)  onProgress({ percent: Math.min(prog.percent, 95), speed: prog.speed, eta: prog.eta });
        if (stage) onProgress({ status: stage, ...(stage === 'Processing' ? { speed: '', eta: '' } : {}) });
      }
    });

    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      resolve();
    });
    proc.on('error', err => reject(new Error(`Failed to start yt-dlp: ${err.message}`)));
  }), 2); // max 2 retries for downloads

  onProgress({ status: 'Finalizing...', percent: 98 });

  const finalPath = findFile(outPath, ext);
  return { filePath: finalPath, filename: `${safeName}.${ext}` };
};

const findFile = (expectedPath, ext) => {
  if (fs.existsSync(expectedPath)) return expectedPath;
  const match = fs.readdirSync(TEMP_DIR)
    .filter(f => f.endsWith(`.${ext}`))
    .map(f => ({ f, t: fs.statSync(path.join(TEMP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (match) return path.join(TEMP_DIR, match.f);
  throw new Error('Downloaded file not found');
};

// ── Search ────────────────────────────────────────────────────────────────────
const searchYtDlp = (query, maxResults = 16) =>
  withRetry(() => new Promise((resolve, reject) => {
    const args = [
      `ytsearch${maxResults}:${query}`,
      '--flat-playlist',
      '--dump-single-json',
      ...flags(),
    ];
    const proc = spawn(YTDLP, args, { shell: false });
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
  }));

// ── Helpers ───────────────────────────────────────────────────────────────────
const bestThumb = (thumbs) => {
  if (!Array.isArray(thumbs) || !thumbs.length) return null;
  return [...thumbs].sort((a, b) =>
    Math.abs((a.width || 0) - 320) - Math.abs((b.width || 0) - 320)
  )[0]?.url || thumbs[thumbs.length - 1]?.url;
};

const fmtDate = (d) =>
  d?.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T00:00:00Z` : null;

module.exports = { downloadMedia, getAvailableFormats, getVideoMeta, safeDelete, TEMP_DIR, searchYtDlp };
