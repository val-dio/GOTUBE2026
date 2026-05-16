# GoTube

A local video downloader and viewer using YouTube API, yt-dlp, and FFmpeg.

## Prerequisites

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — must be on your system PATH
- [FFmpeg](https://ffmpeg.org/download.html) — must be on your system PATH
- A [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) key

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
#   YOUTUBE_API_KEY=your_key_here
#   API_KEY=your_secret_key_here
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
# Edit .env and set REACT_APP_API_KEY to match backend API_KEY
npm start
```

Frontend runs on http://localhost:3000  
Backend runs on http://localhost:5000

## API Routes

| Method | Route         | Description                        |
|--------|---------------|------------------------------------|
| GET    | /search       | Search YouTube videos              |
| GET    | /video-info   | Get available formats for a video  |
| POST   | /download     | Download video/audio               |

All routes require `x-api-key` header.

## Download Formats

- `360p` — MP4 up to 360p
- `720p` — MP4 up to 720p  
- `1080p` — MP4 up to 1080p
- `mp3` — Audio only MP3

## Security

- CORS restricted to `ALLOWED_ORIGIN` only
- All routes protected by API key (`x-api-key` header)
- Rate limited to 100 requests per 15 minutes
