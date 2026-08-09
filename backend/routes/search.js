/* =============================================================
   Moodify Backend — GET /api/search?q=…
   -------------------------------------------------------------
   Query param: q  (e.g. "Happy Pharrell Williams official audio")
   Response: { videoId, thumbnail, title, channelTitle }

   The YouTube API key stays on the server — the browser never
   sees it. All YouTube Data API calls happen here.

   NOTE: /api/playlist no longer calls this route — it now does
   its own YouTube search (see routes/playlist.js) so playlists
   arrive with a videoId already attached. This endpoint is kept
   as a standalone "look up one song" utility.
============================================================= */

const express = require("express");
const router  = express.Router();
const fetch   = require("node-fetch");

router.get("/", async (req, res) => {
  const query = (req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter: q" });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "YouTube API key not configured on server." });
  }

  /* --- Build the YouTube Data API v3 search URL --- */
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part",            "snippet");
  url.searchParams.set("q",              query);
  url.searchParams.set("type",           "video");
  url.searchParams.set("videoEmbeddable","true");  // Ensures video allows iframe playback
  url.searchParams.set("maxResults",     "1");
  url.searchParams.set("key",            apiKey);

  try {
    const ytResp = await fetch(url.toString());
    const data   = await ytResp.json();

    /* --- Propagate YouTube API errors cleanly --- */
    if (!ytResp.ok) {
      const msg = data?.error?.message || `YouTube API returned ${ytResp.status}`;
      return res.status(ytResp.status).json({ error: msg });
    }

    const item = data.items?.[0];
    if (!item) {
      return res.status(404).json({ error: `No YouTube result found for: "${query}"` });
    }

    const videoId     = item.id.videoId;
    const snippet     = item.snippet;
    const thumbnail   =
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return res.json({
      videoId,
      thumbnail,
      title:        snippet.title,
      channelTitle: snippet.channelTitle,
    });
  } catch (err) {
    console.error("[search] Network error:", err.message);
    return res.status(502).json({ error: "Failed to reach YouTube API. Check server network." });
  }
});

module.exports = router;
