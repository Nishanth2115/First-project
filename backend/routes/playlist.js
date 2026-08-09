/* =============================================================
   Moodify Backend — POST /api/playlist
   -------------------------------------------------------------
   Body: { mood: "happy", intensity: 50, recentMonths: 18 }
   Response: { songs: [ { videoId, title, artist, thumbnail,
                           duration, publishedAt } ] }

   Rewritten to pull REAL songs live from the YouTube Data API
   instead of a hardcoded list. Two problems that fixes:

     1. "Wrong category" — old version picked from a fabricated,
        static song list that could be miscategorized or just
        wrong. Now every result comes straight from a YouTube
        search built around the mood, so what plays is what
        matched.

     2. "Not recent" — every request applies a `publishedAfter`
        filter so only videos uploaded within the requested
        window (default: last 18 months) are eligible.
============================================================= */

const express = require("express");
const router  = express.Router();
const fetch   = require("node-fetch");
const MOOD_QUERIES = require("../data/moodQueries.js");

const VALID_MOODS = Object.keys(MOOD_QUERIES);

/* --- PT#H#M#S -> seconds --- */
function isoDurationToSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  const h = parseInt(m[1] || 0, 10);
  const min = parseInt(m[2] || 0, 10);
  const s = parseInt(m[3] || 0, 10);
  return h * 3600 + min * 60 + s;
}

function intensityTier(value) {
  if (value < 34) return "mellow";
  if (value < 67) return "moderate";
  return "intense";
}

router.post("/", async (req, res) => {
  const { mood, intensity, recentMonths } = req.body;

  /* --- Validate mood --- */
  if (!mood || !VALID_MOODS.includes(mood)) {
    return res.status(400).json({
      error: `Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}`,
    });
  }

  /* --- Validate intensity --- */
  const intensityNum = Number(intensity);
  if (isNaN(intensityNum) || intensityNum < 0 || intensityNum > 100) {
    return res.status(400).json({
      error: "Invalid intensity. Must be a number between 0 and 100.",
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "YouTube API key not configured on server." });
  }

  /* --- Recency window: default 18 months, clamp 1-36 --- */
  const months = Math.min(36, Math.max(1, Number(recentMonths) || 18));
  const publishedAfter = new Date();
  publishedAfter.setMonth(publishedAfter.getMonth() - months);

  const tier  = intensityTier(intensityNum);
  const query = MOOD_QUERIES[mood][tier];

  try {
    /* --- 1) Search for real, recent, embeddable Kannada videos --- */
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part",              "snippet");
    searchUrl.searchParams.set("q",                 query);
    searchUrl.searchParams.set("type",               "video");
    searchUrl.searchParams.set("videoEmbeddable",    "true");
    searchUrl.searchParams.set("videoSyndicated",    "true"); // playable outside youtube.com
    searchUrl.searchParams.set("videoCategoryId",    "10"); // Music
    searchUrl.searchParams.set("videoDuration",      "medium"); // 4-20 min: cuts Shorts, trailers, reaction clips, full movies
    searchUrl.searchParams.set("safeSearch",         "strict");
    searchUrl.searchParams.set("relevanceLanguage",  "kn");
    searchUrl.searchParams.set("regionCode",         "IN");
    searchUrl.searchParams.set("order",              "relevance");
    searchUrl.searchParams.set("publishedAfter",     publishedAfter.toISOString());
    searchUrl.searchParams.set("maxResults",         "15"); // ask for extra headroom since some get filtered client-side
    searchUrl.searchParams.set("key",                apiKey);

    const searchResp = await fetch(searchUrl.toString());
    const searchData = await searchResp.json();

    if (!searchResp.ok) {
      const msg = searchData?.error?.message || `YouTube API returned ${searchResp.status}`;
      return res.status(searchResp.status).json({ error: msg });
    }

    // Keyword search returns "song"-category videos, but junk (trailers,
    // interviews, full movies, reaction videos) still slips through titles.
    // Drop obvious non-song uploads before they ever reach the player.
    const NOISE_WORDS = /trailer|teaser|interview|reaction|full movie|movie scene|making of|behind the scenes|promo|press meet|audio launch|motion poster/i;

    const items = (searchData.items || [])
      .filter((it) => it.id?.videoId)
      .filter((it) => !NOISE_WORDS.test(it.snippet?.title || ""));

    if (!items.length) {
      return res.status(404).json({
        error: `No recent Kannada ${mood} songs found in the last ${months} months. Try widening the "recent" window.`,
      });
    }

    /* --- 2) Fetch real durations for those videos --- */
    const videoIds  = items.map((it) => it.id.videoId).join(",");
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "contentDetails");
    videosUrl.searchParams.set("id",   videoIds);
    videosUrl.searchParams.set("key",  apiKey);

    const durResp = await fetch(videosUrl.toString());
    const durData = await durResp.json();
    const durationMap = {};
    (durData.items || []).forEach((v) => {
      durationMap[v.id] = isoDurationToSeconds(v.contentDetails?.duration);
    });

    /* --- 3) Shape the response --- */
    const songs = items.slice(0, 10).map((it) => {
      const videoId = it.id.videoId;
      const snippet = it.snippet;
      const thumbnail =
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId,
        title:       snippet.title,
        artist:      snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        thumbnail,
        duration:    durationMap[videoId] || 0,
      };
    });

    return res.json({ mood, intensity: intensityNum, recentMonths: months, songs });
  } catch (err) {
    console.error("[playlist] Network error:", err.message);
    return res.status(502).json({ error: "Failed to reach YouTube API. Check server network." });
  }
});

module.exports = router;
