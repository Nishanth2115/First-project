/* =========================================================
   MOODIFY — script.js  (Frontend — Backend Edition)
   ---------------------------------------------------------
   All song data, YouTube API key, and search logic live on
   the backend (localhost:4000). This file only:

     1. Calls POST /api/playlist to get a live, mood-matched,
        recency-filtered list of real YouTube songs (the
        response already includes each song's videoId — no
        second lookup needed)
     2. Plays audio via the YouTube IFrame Player API
     3. Manages UI state (mood, intensity, recency, player bar)
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG — backend base URL
   Change this if you deploy the backend elsewhere.
--------------------------------------------------------- */
const API_BASE = "http://localhost:4000";

/* ---------------------------------------------------------
   AI MESSAGES & DISPLAY HELPERS
   (display-only data — does not contain song data)
--------------------------------------------------------- */
const AI_MESSAGES = {
  happy:     "You're feeling {level} happy today — here's a playlist to match that energy. ☀️",
  sad:       "It's okay to feel this way. This {level} mix sits with you, no rush. 💙",
  calm:      "Nice and easy. Here's a {level} set to keep you grounded. 🌿",
  romantic:  "Love is in the air — this {level} mix is for slow moments. 💞",
  energetic: "Let's go! This {level} playlist matches your energy right now. ⚡",
  angry:     "Let it out. This {level} mix hits hard so you don't have to hold it. 🔥",
  sleepy:    "Winding down. A {level} set to ease you toward sleep. 🌙",
};

const MOOD_EMOJI = {
  happy: "😊", sad: "😢", calm: "😌", romantic: "❤️",
  energetic: "⚡", angry: "😡", sleepy: "🌙",
};

const INTENSITY_LABELS = {
  happy:     ["Content",   "Cheerful",   "Euphoric"],
  sad:       ["Wistful",   "Melancholy", "Heartbroken"],
  calm:      ["Relaxed",   "Peaceful",   "Meditative"],
  romantic:  ["Sweet",     "Passionate", "Head-over-heels"],
  energetic: ["Upbeat",    "Pumped",     "Explosive"],
  angry:     ["Irritated", "Frustrated", "Furious"],
  sleepy:    ["Drowsy",    "Sleepy",     "Zonked"],
};

function intensityTier(value) {
  if (value < 34) return "mellow";
  if (value < 67) return "moderate";
  return "intense";
}

function intensityWord(mood, value) {
  const words = INTENSITY_LABELS[mood];
  if (value < 34) return words[0];
  if (value < 67) return words[1];
  return words[2];
}

/* ---------------------------------------------------------
   DOM REFERENCES
--------------------------------------------------------- */
const moodCards       = document.querySelectorAll(".mood-card");
const generateBtn     = document.getElementById("generateBtn");
const resultSection   = document.getElementById("resultSection");
const aiMessageText   = document.getElementById("aiMessageText");
const songListEl      = document.getElementById("songList");

const intensitySlider = document.getElementById("intensitySlider");
const intensityLabel  = document.getElementById("intensityLabel");
const intensityValue  = document.getElementById("intensityValue");
const intensityEmoji  = document.getElementById("intensityEmoji");

const recencySelect   = document.getElementById("recencySelect");

const playerTitle     = document.getElementById("playerTitle");
const playerArtist    = document.getElementById("playerArtist");
const playerMoodBadge = document.getElementById("playerMoodBadge");
const albumArtEl      = document.getElementById("albumArt");
const playerYtLink    = document.getElementById("playerYtLink");

const playBtn         = document.getElementById("playBtn");
const prevBtn         = document.getElementById("prevBtn");
const nextBtn         = document.getElementById("nextBtn");
const progressTrack   = document.getElementById("progressTrack");
const progressFill    = document.getElementById("progressFill");
const currentTimeEl   = document.getElementById("currentTime");
const totalTimeEl     = document.getElementById("totalTime");

const toastEl         = document.getElementById("toast");
const ytLoadingEl     = document.getElementById("ytLoading");
const statusDot       = document.getElementById("statusDot");
const statusLabel     = document.getElementById("statusLabel");

/* ---------------------------------------------------------
   APP STATE
--------------------------------------------------------- */
const state = {
  selectedMood:  null,
  playlist:      [],      // array of { videoId, title, artist, thumbnail, duration, publishedAt }
  currentIndex:  0,
  isPlaying:     false,
  progressTimer: null,
};

/* ---------------------------------------------------------
   BACKEND API HELPERS
--------------------------------------------------------- */

/**
 * fetchPlaylist — calls POST /api/playlist
 * Returns an array of real, mood-matched YouTube songs
 * (each already carrying its videoId) or throws on error.
 */
async function fetchPlaylist(mood, intensity, recentMonths) {
  const resp = await fetch(`${API_BASE}/api/playlist`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ mood, intensity, recentMonths }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Playlist request failed");
  return data.songs;
}

/* ---------------------------------------------------------
   SERVER HEALTH CHECK
   Pings /api/health on load and shows a badge in the nav.
--------------------------------------------------------- */
async function checkServerHealth() {
  try {
    const resp = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(4000) });
    if (resp.ok) {
      statusDot.classList.add("online");
      statusLabel.textContent = "Backend online";
    } else {
      throw new Error();
    }
  } catch {
    statusDot.classList.add("offline");
    statusLabel.textContent = "Backend offline";
    showToast("⚠️ Cannot reach backend at localhost:4000 — run: npm start in the backend/ folder.", 6000);
  }
}

/* ---------------------------------------------------------
   MOOD SELECTION
--------------------------------------------------------- */
moodCards.forEach((card) => {
  card.addEventListener("click", () => {
    moodCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    state.selectedMood = card.dataset.mood;
    intensitySlider.disabled = false;
    generateBtn.disabled = false;
    updateIntensityReadout();
  });
});

/* ---------------------------------------------------------
   INTENSITY SLIDER
--------------------------------------------------------- */
intensitySlider.addEventListener("input", updateIntensityReadout);

function updateIntensityReadout() {
  const value = Number(intensitySlider.value);
  intensityValue.textContent = value;

  intensitySlider.style.background =
    `linear-gradient(to right, var(--accent) 0%, var(--accent) ${value}%, var(--surface-border) ${value}%, var(--surface-border) 100%)`;

  if (!state.selectedMood) {
    intensityLabel.textContent = "Pick a mood first";
    intensityEmoji.textContent = "🎚️";
    return;
  }

  intensityEmoji.textContent = MOOD_EMOJI[state.selectedMood];
  intensityLabel.textContent = intensityWord(state.selectedMood, value);
}

/* ---------------------------------------------------------
   GENERATE MY MUSIC
--------------------------------------------------------- */
generateBtn.addEventListener("click", async () => {
  if (!state.selectedMood) return;

  const mood         = state.selectedMood;
  const intensity    = Number(intensitySlider.value);
  const recentMonths = Number(recencySelect.value);

  generateBtn.disabled    = true;
  generateBtn.textContent = "Building playlist…";

  try {
    /* Ask the backend for the playlist */
    const songs = await fetchPlaylist(mood, intensity, recentMonths);
    state.playlist     = songs;
    state.currentIndex = 0;

    /* Swap color theme */
    document.body.className = `mood-${mood} theme-flash`;
    setTimeout(() => document.body.classList.remove("theme-flash"), 500);

    /* AI message */
    const level = intensityTier(intensity);
    aiMessageText.textContent = AI_MESSAGES[mood].replace("{level}", level);

    /* Render list & reveal results */
    renderSongList();
    resultSection.classList.remove("hidden");

    /* Update player badge */
    const moodName = mood.charAt(0).toUpperCase() + mood.slice(1);
    playerMoodBadge.textContent = `${MOOD_EMOJI[mood]} ${moodName} · ${intensityWord(mood, intensity)}`;

    /* Load and auto-play the first song */
    await loadSong(0, true);

    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showToast(`⚠️ ${err.message}`);
  } finally {
    generateBtn.disabled    = false;
    generateBtn.textContent = "Generate My Music";
  }
});

/* ---------------------------------------------------------
   RENDER SONG LIST
--------------------------------------------------------- */
function renderSongList() {
  songListEl.innerHTML = "";

  state.playlist.forEach((song, index) => {
    const li = document.createElement("li");
    li.className     = "song-item";
    li.dataset.index = index;

    li.innerHTML = `
      <span class="song-index">${index + 1}</span>
      <span class="song-thumb">${MOOD_EMOJI[state.selectedMood]}</span>
      <span class="song-info">
        <p class="song-title">${song.title}</p>
        <p class="song-artist">${song.artist}</p>
      </span>
      <span class="song-tag">${formatPublished(song.publishedAt)}</span>
      <span class="song-duration">${formatTime(song.duration)}</span>
      <span class="song-play-icon">▶</span>
    `;

    li.addEventListener("click", () => loadSong(index, true));
    songListEl.appendChild(li);
  });
}

/* ---------------------------------------------------------
   YOUTUBE IFRAME PLAYER
--------------------------------------------------------- */
let ytPlayer = null;
let ytReady  = false;
let bufferWatchdog = null;

function clearBufferWatchdog() {
  clearTimeout(bufferWatchdog);
  bufferWatchdog = null;
}

/**
 * armBufferWatchdog — YouTube sometimes never fires PLAYING *or*
 * an error event (silent autoplay block, stalled manifest, etc.),
 * so "⏳ Loading…" can hang forever with no feedback. This gives
 * it a fixed window to actually start, then treats it like a
 * playback failure (same skip + fallback-link path as onYTError).
 */
function armBufferWatchdog(forIndex) {
  clearBufferWatchdog();
  bufferWatchdog = setTimeout(() => {
    if (state.currentIndex !== forIndex || state.isPlaying === false) return;
    // still marked "playing" but never actually started — likely stuck
    if (ytPlayer?.getPlayerState?.() === YT.PlayerState.PLAYING) return;
    setYtLoading(false);
    const song = state.playlist[forIndex];
    showToast(
      `⚠️ "${song?.title || "This track"}" is stuck buffering — try tapping ▶ again, or use "Open on YouTube ↗".`,
      6000
    );
  }, 9000);
}

function initYTPlayer() {
  if (ytPlayer || !window.YT || !window.YT.Player) return;
  try {
    ytPlayer = new YT.Player("yt-player", {
      height: "1",
      width:  "1",
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1,
        fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0,
        playsinline: 1, origin: window.location.origin,
      },
      events: {
        onReady:       () => { ytReady = true; },
        onStateChange: onYTStateChange,
        onError:       onYTError,
      },
    });
  } catch (err) {
    console.error("YT Player init error:", err);
  }
}

window.onYouTubeIframeAPIReady = function () {
  initYTPlayer();
};

// If YouTube API already loaded before script.js ran
if (window.YT && window.YT.Player) {
  initYTPlayer();
}

function onYTStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    state.isPlaying = true;
    playBtn.textContent = "⏸";
    highlightActiveSong();
    startProgressSync();
    setYtLoading(false);
    clearBufferWatchdog();
  } else if (event.data === YT.PlayerState.PAUSED) {
    state.isPlaying = false;
    playBtn.textContent = "▶";
    stopProgressSync();
    highlightActiveSong();
    clearBufferWatchdog();
  } else if (event.data === YT.PlayerState.ENDED) {
    stopProgressSync();
    clearBufferWatchdog();
    loadSong(state.currentIndex + 1, true);
  } else if (event.data === YT.PlayerState.BUFFERING) {
    setYtLoading(true);
    // NOTE: do not re-arm the watchdog here — it's already armed once
    // in loadSong() when the track starts loading. Re-arming on every
    // BUFFERING event let a repeatedly-stalling player push the
    // timeout back indefinitely, so it never actually fired.
  }

  if (event.data === YT.PlayerState.PLAYING) {
    state.failCount = 0; // a track actually played — reset the skip guard
  }
}

/**
 * onYTError — YouTube error codes:
 *   2   invalid video ID / bad request
 *   5   HTML5 player error
 *   100 video removed or private
 *   101 / 150  embedding disabled by the video owner (very common for
 *              official film-label uploads — the search API's
 *              "videoEmbeddable" flag isn't always reliable)
 */
function onYTError(event) {
  setYtLoading(false);
  clearBufferWatchdog();
  const code = event?.data;
  const song = state.playlist[state.currentIndex];
  const name = song ? `"${song.title}"` : "This track";

  if (code === 101 || code === 150) {
    showToast(`⚠️ ${name} can't be embedded by its uploader. Skipping…`);
  } else if (code === 100) {
    showToast(`⚠️ ${name} was removed or is private. Skipping…`);
  } else {
    showToast(`⚠️ ${name} failed to play (error ${code}). Skipping…`);
  }

  state.failCount = (state.failCount || 0) + 1;
  if (state.failCount >= state.playlist.length) {
    showToast(
      `⚠️ None of these songs allow embedded playback. Try a different mood/intensity, or widen the "recent" window.`,
      6000
    );
    state.failCount = 0;
    return;
  }

  setTimeout(() => loadSong(state.currentIndex + 1, true), 1500);
}

function setYtLoading(loading) {
  ytLoadingEl.textContent = loading ? "⏳ Loading…" : "";
}

/* ---------------------------------------------------------
   LOAD SONG — fetches video ID from backend, cues YT player
--------------------------------------------------------- */
async function loadSong(index, autoPlay = false) {
  if (!state.playlist.length) return;

  const total = state.playlist.length;
  state.currentIndex = ((index % total) + total) % total;

  const song = state.playlist[state.currentIndex];

  /* Instant UI update — videoId/thumbnail/duration all came */
  /* straight from the live YouTube search, no fabricated data */
  playerTitle.textContent   = song.title;
  playerArtist.textContent  = song.artist;
  totalTimeEl.textContent   = formatTime(song.duration);
  currentTimeEl.textContent = "0:00";
  progressFill.style.width  = "0%";
  playerYtLink.href = `https://www.youtube.com/watch?v=${song.videoId}`;
  playerYtLink.classList.remove("hidden");

  albumArtEl.innerHTML = `
    <img
      src="${song.thumbnail}"
      alt="${song.title} thumbnail"
      class="album-thumb"
      onerror="this.style.display='none'"
    />`;
  highlightActiveSong();
  stopProgressSync();

  if (!ytReady) {
    if (window.YT && window.YT.Player && !ytPlayer) {
      initYTPlayer();
    }
    if (!ytReady) {
      showToast("⏳ YouTube player not ready yet. Try again in a moment.");
      return;
    }
  }

  setYtLoading(true);

  if (autoPlay) {
    ytPlayer.loadVideoById(song.videoId);
    state.isPlaying = true;
    playBtn.textContent = "⏸";
    armBufferWatchdog(state.currentIndex);
  } else {
    ytPlayer.cueVideoById(song.videoId);
    state.isPlaying = false;
    playBtn.textContent = "▶";
    setYtLoading(false);
    clearBufferWatchdog();
  }

  highlightActiveSong();
}

function resetAlbumArt() {
  albumArtEl.innerHTML = `
    <svg viewBox="0 0 24 24" class="note-icon" aria-hidden="true">
      <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/>
      <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/>
    </svg>`;
}

/* ---------------------------------------------------------
   PLAYER CONTROLS
--------------------------------------------------------- */
playBtn.addEventListener("click", () => {
  if (!state.playlist.length || !ytReady) return;
  state.isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
});

prevBtn.addEventListener("click", () => {
  if (!state.playlist.length) return;
  loadSong(state.currentIndex - 1, state.isPlaying);
});

nextBtn.addEventListener("click", () => {
  if (!state.playlist.length) return;
  loadSong(state.currentIndex + 1, state.isPlaying);
});

progressTrack.addEventListener("click", (e) => {
  if (!state.playlist.length || !ytReady) return;
  const rect     = progressTrack.getBoundingClientRect();
  const percent  = (e.clientX - rect.left) / rect.width;
  const duration = ytPlayer.getDuration?.() || 0;
  if (duration > 0) ytPlayer.seekTo(percent * duration, true);
});

/* ---------------------------------------------------------
   PROGRESS SYNC
--------------------------------------------------------- */
function startProgressSync() {
  stopProgressSync();
  state.progressTimer = setInterval(() => {
    if (!ytReady || !ytPlayer.getCurrentTime) return;
    const current  = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();
    if (!duration || duration <= 0) return;
    progressFill.style.width  = `${(current / duration) * 100}%`;
    currentTimeEl.textContent = formatTime(Math.floor(current));
    totalTimeEl.textContent   = formatTime(Math.floor(duration));
  }, 500);
}

function stopProgressSync() {
  clearInterval(state.progressTimer);
  state.progressTimer = null;
}

/* ---------------------------------------------------------
   HIGHLIGHT ACTIVE SONG ROW
--------------------------------------------------------- */
function highlightActiveSong() {
  document.querySelectorAll(".song-item").forEach((item) => {
    const isActive = Number(item.dataset.index) === state.currentIndex;
    item.classList.toggle("active", isActive);

    const icon = item.querySelector(".song-play-icon");
    if (isActive && state.isPlaying) {
      icon.innerHTML = `<span class="playing-bars"><span></span><span></span><span></span></span>`;
    } else {
      icon.textContent = "▶";
    }
  });
}

/* ---------------------------------------------------------
   TOAST NOTIFICATION
--------------------------------------------------------- */
let toastTimer = null;

function showToast(message, duration = 3500) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("visible");
    setTimeout(() => toastEl.classList.add("hidden"), 400);
  }, duration);
}

/* ---------------------------------------------------------
   FORMAT TIME   187 → "3:07"
--------------------------------------------------------- */
function formatTime(totalSeconds) {
  const s       = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/* ---------------------------------------------------------
   FORMAT PUBLISHED DATE   "2025-07-19T..." → "Jul 2025"
--------------------------------------------------------- */
function formatPublished(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
updateIntensityReadout();
checkServerHealth();
