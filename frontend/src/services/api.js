import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://ytdlp-worker-production.up.railway.app";

const client = axios.create({
  baseURL: BASE_URL,
});


// SEARCH VIDEOS
export const searchVideos = async (q) => {
  const res = await client.get("/search", {
    params: { q },
  });

  return res.data.results;
};


// GET VIDEO (DOWNLOAD + FORMATS)
export const getVideoData = async (videoUrl) => {
  const res = await client.get("/api/video", {
    params: { url: videoUrl },
  });

  return res.data;
};


// OPTIONAL (REMOVE OR KEEP LATER)
export const sendContactMessage = async (name, email, message) => {
  const res = await fetch(`${BASE_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, message }),
  });

  return res.json();
};

export default client;