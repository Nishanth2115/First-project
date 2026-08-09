/* =============================================================
   Moodify Backend — server.js
   -------------------------------------------------------------
   Entry point. Loads environment variables, sets up Express,
   mounts routes, and starts listening.

   Endpoints:
     GET  /api/health            → { status: "ok" }
     POST /api/playlist          → { songs: [...] }
     GET  /api/search?q=…        → { videoId, thumbnail, title }
============================================================= */

require("dotenv").config();

const express  = require("express");
const cors     = require("cors");

const playlistRouter = require("./routes/playlist.js");
const searchRouter   = require("./routes/search.js");

const app  = express();
const PORT = process.env.PORT || 4000;

/* ---------------------------------------------------------
   Middleware
--------------------------------------------------------- */

// Allow the frontend (localhost:3000) to call this server
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "OPTIONS"],
}));

// Parse JSON request bodies
app.use(express.json());

/* ---------------------------------------------------------
   Routes
--------------------------------------------------------- */

// Health check — confirms the server is up
app.get("/api/health", (_req, res) => {
  res.json({
    status:  "ok",
    service: "Moodify Backend",
    time:    new Date().toISOString(),
  });
});

// Playlist generation
app.use("/api/playlist", playlistRouter);

// YouTube search proxy
app.use("/api/search", searchRouter);

// 404 fallback for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

/* ---------------------------------------------------------
   Start
--------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`\n🎧 Moodify Backend running at http://localhost:${PORT}`);
  console.log(`   Health : http://localhost:${PORT}/api/health`);
  console.log(`   Playlist: POST http://localhost:${PORT}/api/playlist`);
  console.log(`   Search  : GET  http://localhost:${PORT}/api/search?q=...\n`);

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn("⚠️  WARNING: YOUTUBE_API_KEY is not set in .env — search will fail.");
  }
});
