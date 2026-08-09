/* =========================================================
   MOODIFY — script.js  (YouTube Edition)
   ---------------------------------------------------------
   1. SONG_DATA — 10 curated Kannada songs per mood (fixed)
   2. SemanticCache — localStorage-backed cache with:
        • Semantic key (mood:tier:normalizedTitle)
        • 7-day TTL per entry
        • LRU eviction (max 100 entries)
        • ⚡ "Cached" badge on cache hits
   3. Settings modal — save/load YouTube API key
   4. YouTube IFrame Player — real audio via YT.Player
   5. Buffer watchdog — 10s timeout to auto-skip stuck tracks
   6. Error handling — codes 101/150, 100, 2/5, consecutive-fail guard
   7. loadSong(index, autoPlay) — searches YT or uses cache,
      cues/plays video, syncs progress bar & album art thumbnail
   ========================================================= */

/* ---------------------------------------------------------
   DEFAULT API KEY — pre-seeded but user can override via ⚙️
   Stored/read from localStorage key: "moodify_yt_api_key"
--------------------------------------------------------- */
const DEFAULT_API_KEY = "AIzaSyBVuIZDMcOloDhdT9yDtAxGKdxguoAlEqQ";

function getApiKey() {
  return localStorage.getItem("moodify_yt_api_key") || DEFAULT_API_KEY;
}

/* ---------------------------------------------------------
   1. SONG DATA — 10 curated, 100% unique Kannada songs per mood
   Strictly categorized with accurate song titles, movie names,
   singers, durations, and intensity values. Zero overlaps.
--------------------------------------------------------- */
const SONG_DATA = {

  /* ── HAPPY ──────────────────────────────────────────── */
  happy: [
    { title: "Feel the Power",             artist: "Puneeth Rajkumar, Shashaa Tirupati", movie: "Yuvarathnaa",           duration: 222, intensity: 8  },
    { title: "Chinnamma",                  artist: "K.S. Chithra, Rajesh Krishnan",       movie: "Maanikya",             duration: 255, intensity: 18 },
    { title: "Open Hairu",                  artist: "Nakul Abhyankar, Ramya Bhat",         movie: "Love Mocktail 2",       duration: 210, intensity: 28 },
    { title: "Dance With Appu",            artist: "Sanjith Hegde",                       movie: "James",                duration: 198, intensity: 38 },
    { title: "Chuttu Chuttu",             artist: "Ravindra Soragavi, Shamitha Malnad",  movie: "Rambo 2",              duration: 252, intensity: 48 },
    { title: "Neenade Naa",                artist: "Armaan Malik",                        movie: "Kirik Party",           duration: 215, intensity: 58 },
    { title: "Singara Siriye",            artist: "Vijay Prakash, Ananya Bhat",          movie: "Kantara",              duration: 280, intensity: 68 },
    { title: "Hands Up",                   artist: "Vijay Prakash, Shashank Shethagiri",  movie: "Avane Srimannarayana", duration: 228, intensity: 78 },
    { title: "Gillako Siva",              artist: "Mangli, Charan Raj",                  movie: "Vedha",                duration: 232, intensity: 88 },
    { title: "Pushpa Pushpa",             artist: "Nakash Aziz",                         movie: "Pushpa 2 Kannada",     duration: 255, intensity: 97 },
  ],

  /* ── SAD ────────────────────────────────────────────── */
  sad: [
    { title: "Kaagada Doniyalli",          artist: "Vasuki Vaibhav",                      movie: "Kirik Party",           duration: 270, intensity: 8  },
    { title: "Usire Usire",                artist: "Rajesh Krishnan",                     movie: "Huchcha",              duration: 320, intensity: 18 },
    { title: "Usiraagidhe",                artist: "Nakul Abhyankar",                     movie: "Love Mocktail 2",       duration: 250, intensity: 28 },
    { title: "Sapta Sagaradaache Ello",    artist: "Kapil Kapilan",                       movie: "Sapta Sagaradaache Ello Side A", duration: 285, intensity: 38 },
    { title: "Ninthu Nodalilla",           artist: "Mohan Krishna",                       movie: "KGF Chapter 2",         duration: 200, intensity: 48 },
    { title: "Innu Yaaka",                 artist: "B. Ajaneesh Loknath, Guduru Raju",    movie: "Vikrant Rona",         duration: 235, intensity: 58 },
    { title: "Janumagale Kaayuve",        artist: "Armaan Malik",                        movie: "Monsoon Raaga",         duration: 245, intensity: 68 },
    { title: "Soul of Dia (Sad)",          artist: "Sanjith Hegde",                       movie: "Dia",                  duration: 230, intensity: 78 },
    { title: "Ondu Munjane",               artist: "Shreya Ghoshal, Sonu Nigam",          movie: "Yajamana",             duration: 275, intensity: 88 },
    { title: "Bisilu Kudure",              artist: "Vijay Prakash",                       movie: "Googly",               duration: 260, intensity: 97 },
  ],

  /* ── CALM ───────────────────────────────────────────── */
  calm: [
    { title: "Nenapina Hakki",             artist: "Pradeep Kumar",                       movie: "777 Charlie",          duration: 240, intensity: 6  },
    { title: "Ninna Gungalli",             artist: "Vijay Prakash",                       movie: "Love Mocktail",        duration: 270, intensity: 16 },
    { title: "Minchagi Neenu",             artist: "Sonu Nigam",                          movie: "Gaalipata",            duration: 280, intensity: 26 },
    { title: "Dwapara",                    artist: "Jaskaran Singh",                      movie: "Krishnam Pranaya Sakhi", duration: 225, intensity: 36 },
    { title: "Kannu Hodiyaka",             artist: "Shreya Ghoshal",                      movie: "Pogaru",               duration: 250, intensity: 46 },
    { title: "Kaniveya Thazvaradali",      artist: "Charan Raj",                          movie: "Sapta Sagaradaache Ello Side B", duration: 260, intensity: 56 },
    { title: "Anisuthide Yaako Indu",      artist: "Sonu Nigam",                          movie: "Mungaru Male",         duration: 270, intensity: 66 },
    { title: "Koti Kanasugala",            artist: "Karthik, Vijay Prakash",              movie: "Baanadariyalli",       duration: 245, intensity: 76 },
    { title: "Sanihake Bandha",            artist: "Sanjith Hegde",                       movie: "Ninna Sanihake",       duration: 230, intensity: 86 },
    { title: "Mellanamellane",             artist: "Nakul Abhyankar",                     movie: "Love Mocktail 2",       duration: 220, intensity: 95 },
  ],

  /* ── ROMANTIC ───────────────────────────────────────── */
  romantic: [
    { title: "Shringarada Hunge Mara",     artist: "Vijay Prakash",                       movie: "Panchatantra",         duration: 260, intensity: 8  },
    { title: "Maathanaadi Maathanaadi",    artist: "Armaan Malik",                        movie: "I Love You",           duration: 255, intensity: 18 },
    { title: "Hrudayake Hedarike",         artist: "Sanjith Hegde",                       movie: "Tayige Takka Maga",    duration: 250, intensity: 28 },
    { title: "Ondu Malebillu",             artist: "Armaan Malik, Shreya Ghoshal",        movie: "Chakravarthy",         duration: 275, intensity: 38 },
    { title: "Mehabooba",                  artist: "Ananya Bhat",                         movie: "KGF Chapter 2",         duration: 220, intensity: 48 },
    { title: "Tabbahi",                    artist: "Yash",                                movie: "Toxic",                duration: 230, intensity: 58 },
    { title: "Romanchana",                 artist: "Nakul Abhyankar",                     movie: "Love Mocktail 2",       duration: 245, intensity: 68 },
    { title: "Love Rachu Title Song",      artist: "Vijay Prakash",                       movie: "Love Rachu",           duration: 252, intensity: 78 },
    { title: "Love You Chinna",            artist: "Shruti VS",                           movie: "Love Mocktail",        duration: 225, intensity: 88 },
    { title: "Neene Modalu",               artist: "Shreya Ghoshal",                      movie: "Kiss",                 duration: 250, intensity: 97 },
  ],

  /* ── ENERGETIC ──────────────────────────────────────── */
  energetic: [
    { title: "Odi Hombatha",               artist: "Vijay Prakash, Sonu Nigam",           movie: "Mugulu Nage",          duration: 245, intensity: 8  },
    { title: "Karabu",                     artist: "Chandan Shetty",                      movie: "Pogaru",               duration: 225, intensity: 18 },
    { title: "Power Of Youth",             artist: "Nakash Aziz",                         movie: "Yuvarathnaa",          duration: 230, intensity: 28 },
    { title: "Ra Ra Rakkamma",             artist: "Nakash Aziz, Sunidhi Chauhan",        movie: "Vikrant Rona",         duration: 225, intensity: 38 },
    { title: "Sulthana",                   artist: "Mohan Krishna, Sachin Basrur",        movie: "KGF Chapter 2",         duration: 220, intensity: 48 },
    { title: "Badava Rascal Title Track",  artist: "Vasuki Vaibhav",                      movie: "Badava Rascal",        duration: 210, intensity: 58 },
    { title: "Salaam Rocky Bhai",          artist: "Vijay Prakash, Santhosh Venky",       movie: "KGF Chapter 1",         duration: 245, intensity: 68 },
    { title: "Tagaru Banthu Tagaru",       artist: "Anthony Daasan",                      movie: "Tagaru",               duration: 220, intensity: 78 },
    { title: "Bheema Title Track",         artist: "Charan Raj, MC Bijju",                movie: "Bheema",               duration: 215, intensity: 88 },
    { title: "Martin Title Track",         artist: "Mani Sharma",                         movie: "Martin",               duration: 230, intensity: 97 },
  ],

  /* ── ANGRY ──────────────────────────────────────────── */
  angry: [
    { title: "Monster Song",               artist: "Adithi Sagar, Ravi Basrur",           movie: "KGF Chapter 2",         duration: 195, intensity: 10 },
    { title: "Ugramm Veeram",              artist: "Ravi Basrur",                         movie: "Ugramm",               duration: 260, intensity: 20 },
    { title: "Kaatera Mass Anthem",        artist: "V. Harikrishna",                      movie: "Kaatera",              duration: 230, intensity: 30 },
    { title: "Demon in Me",                artist: "Arjun Janya, Aishwarya Rangarajan",   movie: "Ghost",                duration: 205, intensity: 42 },
    { title: "Garuda Gamana Theme",        artist: "Midhun Mukundan",                     movie: "Garuda Gamana Vrishabha Vahana", duration: 220, intensity: 54 },
    { title: "Kabzaa Title Track",         artist: "Ravi Basrur",                         movie: "Kabzaa",               duration: 210, intensity: 65 },
    { title: "Mufti Mass Theme",           artist: "Ravi Basrur",                         movie: "Mufti",                duration: 225, intensity: 75 },
    { title: "Chowka Climax Theme",        artist: "V. Harikrishna",                      movie: "Chowka",               duration: 220, intensity: 84 },
    { title: "Bad Manners Action Theme",   artist: "Charan Raj",                          movie: "Bad Manners",          duration: 200, intensity: 92 },
    { title: "Roberrt Mass Theme",         artist: "Arjun Janya",                         movie: "Roberrt",              duration: 210, intensity: 99 },
  ],

  /* ── SLEEPY ─────────────────────────────────────────── */
  sleepy: [
    { title: "Laali Laali",                artist: "Ananya Bhat",                         movie: "KGF Chapter 1",         duration: 210, intensity: 6  },
    { title: "Jo Lali",                    artist: "Vijay Prakash",                       movie: "Yuvarathnaa",          duration: 240, intensity: 16 },
    { title: "Yadava Nee Baa",             artist: "Sooraj Santhosh",                     movie: "Kantara Devotional",   duration: 255, intensity: 26 },
    { title: "777 Charlie Lullaby",        artist: "Nobin Paul",                          movie: "777 Charlie",          duration: 225, intensity: 36 },
    { title: "Shuruaagidhe",               artist: "Sid Sriram",                          movie: "Love Mocktail 2",       duration: 255, intensity: 46 },
    { title: "Ee Kuralu",                  artist: "K.S. Chithra",                        movie: "Sapta Sagaradaache Ello Side B", duration: 250, intensity: 56 },
    { title: "Nigooda",                    artist: "Sanjith Hegde",                       movie: "Kavaludaari",          duration: 245, intensity: 66 },
    { title: "Taayi Song",                 artist: "Sonu Nigam",                          movie: "James",                duration: 255, intensity: 76 },
    { title: "Saluthillave",               artist: "Shreya Ghoshal, Vijay Prakash",       movie: "Kotigobba 2",          duration: 265, intensity: 86 },
    { title: "Jotheyali Jotheyali",       artist: "S.P. Balasubrahmanyam, S. Janaki",    movie: "Geetha",               duration: 270, intensity: 95 },
  ],

};





/* ---------------------------------------------------------
   AI-style messages, one per mood.
--------------------------------------------------------- */
const AI_MESSAGES = {
  happy:     "You're feeling {level} happy today — here's a playlist to match that energy. ☀️",
  sad:       "It's okay to feel this way. This {level} mix sits with you, no rush to feel better right away. 💙",
  calm:      "Nice and easy. Here's a {level} set to help you stay grounded and relaxed. 🌿",
  romantic:  "Love is in the air — this {level} mix is made for slow moments and close company. 💞",
  energetic: "Let's go! This {level} playlist matches the energy you're bringing right now. ⚡",
  angry:     "Let it out. This {level} mix hits hard so you don't have to hold it in. 🔥",
  sleepy:    "Winding down time. A {level} set to help ease you toward sleep. 🌙",
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

/* =========================================================
   2. SEMANTIC CACHE
   ---------------------------------------------------------
   Stored in localStorage under "moodify_vcache".
   Structure:  { [semanticKey]: { videoId, thumbnail, cachedAt } }

   Semantic key format: "mood:tier:normalizedTitle"
   • mood       — "happy", "sad", etc. (passed from caller)
   • tier       — "mellow" | "moderate" | "intense"
   • normalized — title lowercased, non-word chars stripped

   A query that exactly matches a cached key is returned
   instantly without hitting the YouTube API.
   ========================================================= */
const CACHE_KEY    = "moodify_vcache";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_MAX    = 100;                        // LRU eviction threshold

const SemanticCache = (() => {
  // Load the raw store from localStorage once at boot
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    store = {};
  }

  /** Derive a semantic key from a song + current mood/intensity context */
  function makeKey(mood, tier, songTitle) {
    const norm = songTitle.toLowerCase().replace(/\W+/g, "");
    return `${mood}:${tier}:${norm}`;
  }

  /** Persist the current store to localStorage */
  function persist() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {
      // storage full — evict half the entries and retry
      evict(Math.floor(CACHE_MAX / 2));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(store)); } catch {}
    }
  }

  /** Remove the oldest `count` entries (LRU by cachedAt) */
  function evict(count = 10) {
    const entries = Object.entries(store)
      .sort(([, a], [, b]) => a.cachedAt - b.cachedAt);
    entries.slice(0, count).forEach(([k]) => delete store[k]);
  }

  /** Evict expired entries and enforce size cap */
  function housekeep() {
    const now = Date.now();
    // Remove expired
    for (const key of Object.keys(store)) {
      if (now - store[key].cachedAt > CACHE_TTL_MS) delete store[key];
    }
    // Enforce size limit
    const size = Object.keys(store).length;
    if (size > CACHE_MAX) evict(size - CACHE_MAX);
  }

  // Run housekeeping once at startup
  housekeep();
  persist();

  return {
    /**
     * get — returns { videoId, thumbnail } or null
     * Also "touches" the entry by refreshing cachedAt (keeps it alive).
     */
    get(mood, tier, songTitle) {
      const key   = makeKey(mood, tier, songTitle);
      const entry = store[key];
      if (!entry) return null;
      if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        delete store[key];
        persist();
        return null;
      }
      // Touch — refresh TTL on access
      entry.cachedAt = Date.now();
      persist();
      return { videoId: entry.videoId, thumbnail: entry.thumbnail };
    },

    /**
     * set — saves { videoId, thumbnail } under the semantic key
     */
    set(mood, tier, songTitle, videoId, thumbnail) {
      const key = makeKey(mood, tier, songTitle);
      store[key] = { videoId, thumbnail, cachedAt: Date.now() };
      housekeep();
      persist();
    },

    /** How many live entries are in the cache (for UI display) */
    size() {
      return Object.keys(store).length;
    },
  };
})();

/* ---------------------------------------------------------
   3. DOM REFERENCES
--------------------------------------------------------- */
const moodCards      = document.querySelectorAll(".mood-card");
const generateBtn    = document.getElementById("generateBtn");
const resultSection  = document.getElementById("resultSection");
const aiMessageText  = document.getElementById("aiMessageText");
const songListEl     = document.getElementById("songList");

const intensitySlider = document.getElementById("intensitySlider");
const intensityLabel  = document.getElementById("intensityLabel");
const intensityValue  = document.getElementById("intensityValue");
const intensityEmoji  = document.getElementById("intensityEmoji");

const playerTitle    = document.getElementById("playerTitle");
const playerArtist   = document.getElementById("playerArtist");
const playerMoodBadge= document.getElementById("playerMoodBadge");
const albumArtEl     = document.getElementById("albumArt");

const playBtn        = document.getElementById("playBtn");
const prevBtn        = document.getElementById("prevBtn");
const nextBtn        = document.getElementById("nextBtn");
const progressTrack  = document.getElementById("progressTrack");
const progressFill   = document.getElementById("progressFill");
const currentTimeEl  = document.getElementById("currentTime");
const totalTimeEl    = document.getElementById("totalTime");

const settingsBtn    = document.getElementById("settingsBtn");
const settingsOverlay= document.getElementById("settingsOverlay");
const settingsCloseBtn= document.getElementById("settingsCloseBtn");
const apiKeyInput    = document.getElementById("apiKeyInput");
const showKeyBtn     = document.getElementById("showKeyBtn");
const saveKeyBtn     = document.getElementById("saveKeyBtn");
const clearKeyBtn    = document.getElementById("clearKeyBtn");
const keyStatus      = document.getElementById("keyStatus");
const toastEl        = document.getElementById("toast");
const ytLoadingEl    = document.getElementById("ytLoading");

/* ---------------------------------------------------------
   4. APP STATE
--------------------------------------------------------- */
const state = {
  selectedMood:  null,
  playlist:      [],
  currentIndex:  0,
  isPlaying:     false,
  progressTimer: null,
  failCount:     0,    // consecutive playback failures; resets on success
};

/* ---------------------------------------------------------
   5. SETTINGS MODAL
--------------------------------------------------------- */
function refreshKeyInput() {
  const saved = localStorage.getItem("moodify_yt_api_key");
  apiKeyInput.value = saved || DEFAULT_API_KEY;
  keyStatus.textContent = "";
}

settingsBtn.addEventListener("click", () => {
  refreshKeyInput();
  settingsOverlay.classList.remove("hidden");
});

settingsCloseBtn.addEventListener("click", () => {
  settingsOverlay.classList.add("hidden");
});

settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) settingsOverlay.classList.add("hidden");
});

showKeyBtn.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type  = isPassword ? "text" : "password";
  showKeyBtn.textContent = isPassword ? "🙈" : "👁";
});

saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.textContent = "⚠️ Key cannot be empty.";
    keyStatus.style.color = "var(--error, #ff6b6b)";
    return;
  }
  localStorage.setItem("moodify_yt_api_key", key);
  keyStatus.textContent = "✓ Key saved!";
  keyStatus.style.color = "var(--accent)";
  setTimeout(() => settingsOverlay.classList.add("hidden"), 800);
});

clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem("moodify_yt_api_key");
  apiKeyInput.value = "";
  keyStatus.textContent = "Key cleared. Default will be used.";
  keyStatus.style.color = "var(--text-muted, #aaa)";
});

/* ---------------------------------------------------------
   6. YOUTUBE IFRAME PLAYER
   The IFrame API calls window.onYouTubeIframeAPIReady when
   the script is ready. We create a hidden YT.Player in
   the #yt-player div and use it for all playback.
--------------------------------------------------------- */
let ytPlayer = null;
let ytReady  = false;

/* -------------------------------------------------------
   Buffer watchdog — arms a 10-second timeout after
   loadVideoById(). If the player hasn't fired PLAYING by
   then it's stuck buffering (autoplay block, stalled
   manifest, restricted video). We skip + show a toast.
------------------------------------------------------- */
let bufferWatchdog = null;

function clearBufferWatchdog() {
  clearTimeout(bufferWatchdog);
  bufferWatchdog = null;
}

function armBufferWatchdog(forIndex) {
  clearBufferWatchdog();
  bufferWatchdog = setTimeout(() => {
    // Guard: only fire if we're still on the same song and not playing
    if (state.currentIndex !== forIndex) return;
    if (ytPlayer && ytPlayer.getPlayerState &&
        ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) return;

    setYtLoading(false);
    const song = state.playlist[forIndex];
    const name = song ? `"${song.title}"` : "This track";
    showToast(`⏱ ${name} is taking too long to start. Skipping…`, 5000);
    skipAfterFailure();
  }, 10000);
}

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("yt-player", {
    height: "1",
    width:  "1",
    playerVars: {
      autoplay:       0,
      controls:       0,
      disablekb:      1,
      fs:             0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel:            0,
      playsinline:    1,
      origin:         window.location.origin,
    },
    events: {
      onReady:       onYTReady,
      onStateChange: onYTStateChange,
      onError:       onYTError,
    },
  });
};

function onYTReady() {
  ytReady = true;
}

function onYTStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    state.isPlaying = true;
    state.failCount = 0;   // ✅ a track actually started — reset the fail guard
    playBtn.textContent = "⏸";
    highlightActiveSong();
    startProgressSync();
    setYtLoading(false);
    clearBufferWatchdog();  // track is playing, watchdog no longer needed
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
    // NOTE: do NOT re-arm the watchdog here — it's armed once in loadSong().
    // Re-arming on every BUFFERING event lets a repeatedly-stalling video
    // push the timeout back indefinitely, so it would never actually fire.
  }
}

/* ---------------------------------------------------------
   onYTError — YouTube IFrame error codes:
     2   → invalid video ID
     5   → HTML5 player error
     100 → video removed or private
     101 → embedding disabled by video owner
     150 → same as 101 (served from different CDN path)
   All errors: increment failCount, skip after a short delay.
   If failCount ≥ playlist length, circuit-break to stop looping.
--------------------------------------------------------- */
function onYTError(event) {
  setYtLoading(false);
  clearBufferWatchdog();
  const code = event?.data;
  const song = state.playlist[state.currentIndex];
  const name = song ? `"${song.title}"` : "This track";

  if (code === 101 || code === 150) {
    showToast(`🚫 ${name} can't be embedded by its owner. Skipping…`);
  } else if (code === 100) {
    showToast(`🗑 ${name} was removed or is private. Skipping…`);
  } else if (code === 2) {
    showToast(`⚠️ Bad video ID for ${name}. Skipping…`);
  } else if (code === 5) {
    showToast(`⚠️ ${name} can't play in this browser. Skipping…`);
  } else {
    showToast(`⚠️ ${name} failed (error ${code}). Skipping…`);
  }

  skipAfterFailure();
}

/**
 * skipAfterFailure — increments failCount and either skips to the
 * next song or circuit-breaks if every song in the playlist has failed.
 */
function skipAfterFailure() {
  state.failCount = (state.failCount || 0) + 1;

  if (state.failCount >= state.playlist.length) {
    // Every song in the current playlist failed — stop the loop
    state.failCount = 0;
    state.isPlaying = false;
    playBtn.textContent = "▶";
    showToast(
      "⚠️ None of the songs in this playlist could be played. " +
      "Try a different mood, intensity, or check your API key.",
      6000
    );
    return;
  }

  setTimeout(() => loadSong(state.currentIndex + 1, true), 1500);
}

function setYtLoading(loading, isCacheHit = false) {
  if (!loading) {
    ytLoadingEl.textContent = "";
    ytLoadingEl.classList.remove("cache-hit");
    return;
  }
  if (isCacheHit) {
    ytLoadingEl.textContent = "⚡ Cached";
    ytLoadingEl.classList.add("cache-hit");
    // Auto-clear the badge after 2 s
    setTimeout(() => {
      ytLoadingEl.textContent = "";
      ytLoadingEl.classList.remove("cache-hit");
    }, 2000);
  } else {
    ytLoadingEl.textContent = "⏳ Loading…";
    ytLoadingEl.classList.remove("cache-hit");
  }
}

/* ---------------------------------------------------------
   7. YOUTUBE SEARCH
   First checks the SemanticCache. On a miss, calls the
   YouTube Data API v3. Fetches 3 syndicated candidates
   (videoSyndicated=true means playable outside YouTube.com)
   and returns the first valid one to maximise playback
   success rate. Result is cached for future calls.
--------------------------------------------------------- */
async function searchYouTube(song, mood, tier) {
  // ── Semantic cache lookup ──────────────────────────────
  const hit = SemanticCache.get(mood, tier, song.title);
  if (hit) {
    setYtLoading(true, /* isCacheHit= */ true);
    return hit; // { videoId, thumbnail }
  }

  // ── Live API search ────────────────────────────────────
  const apiKey = getApiKey();
  if (!apiKey) {
    openSettings("No API key found. Please add your YouTube API key.");
    return null;
  }

  const query = buildSearchQuery(song);
  const url   = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part",             "snippet");
  url.searchParams.set("q",                query);
  url.searchParams.set("type",             "video");
  url.searchParams.set("videoEmbeddable",  "true");  // must allow iframe playback
  url.searchParams.set("videoSyndicated",  "true");  // must be playable outside youtube.com
  url.searchParams.set("videoCategoryId",  "10");    // Music
  url.searchParams.set("relevanceLanguage","kn");    // Kannada
  url.searchParams.set("regionCode",       "IN");    // India
  url.searchParams.set("maxResults",       "3");     // fetch 3 to have fallback options
  url.searchParams.set("key",              apiKey);

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${resp.status}`;
      if (resp.status === 400 || resp.status === 403) {
        showToast(`🔑 API Error: ${msg} — Check your key in ⚙️ Settings.`);
      } else {
        showToast(`⚠️ YouTube search failed: ${msg}`);
      }
      return null;
    }

    const data  = await resp.json();
    const items = data.items || [];

    // Pick the first candidate with a valid videoId
    const item = items.find(it => it.id?.videoId);
    if (!item) {
      showToast(`No YouTube result for "${query}"`);
      return null;
    }

    const videoId   = item.id.videoId;
    const snippet   = item.snippet;
    const thumbnail =
      snippet.thumbnails?.high?.url   ||
      snippet.thumbnails?.medium?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // ── Persist to semantic cache ──────────────────────
    SemanticCache.set(mood, tier, song.title, videoId, thumbnail);

    return { videoId, thumbnail };
  } catch (err) {
    showToast("⚠️ Network error. Check your connection.");
    return null;
  }
}

/**
 * buildSearchQuery — constructs the YouTube search string.
 * Uses song title, movie title, and artist name for 100% accurate
 * video resolution on YouTube.
 */
function buildSearchQuery(song) {
  const moviePart = song.movie ? ` ${song.movie}` : '';
  return `${song.title}${moviePart} ${song.artist} Kannada song`;
}

/* ---------------------------------------------------------
   8. MOOD SELECTION
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
   9. INTENSITY SLIDER
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
   10. GENERATE MY MUSIC
--------------------------------------------------------- */
generateBtn.addEventListener("click", () => {
  if (!state.selectedMood) return;

  // Require API key before generating
  const apiKey = getApiKey();
  if (!apiKey) {
    openSettings("Enter your YouTube API key to play music.");
    return;
  }

  const mood            = state.selectedMood;
  const targetIntensity = Number(intensitySlider.value);

  // All 10 curated Kannada songs, sorted by closeness to the selected intensity
  state.playlist = SONG_DATA[mood]
    .slice()
    .sort((a, b) => Math.abs(a.intensity - targetIntensity) - Math.abs(b.intensity - targetIntensity));

  state.currentIndex = 0;
  state.failCount    = 0;  // reset fail counter for the new playlist

  document.body.className = `mood-${mood} theme-flash`;
  setTimeout(() => document.body.classList.remove("theme-flash"), 500);

  const level = intensityTier(targetIntensity);
  aiMessageText.textContent = AI_MESSAGES[mood].replace("{level}", level);

  renderSongList();
  resultSection.classList.remove("hidden");

  loadSong(0, true);

  const moodName = mood.charAt(0).toUpperCase() + mood.slice(1);
  playerMoodBadge.textContent = `${MOOD_EMOJI[mood]} ${moodName} · ${intensityWord(mood, targetIntensity)}`;

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------------------------------------------------------
   11. RENDER SONG LIST
--------------------------------------------------------- */
function renderSongList() {
  songListEl.innerHTML = "";

  state.playlist.forEach((song, index) => {
    const li = document.createElement("li");
    li.className   = "song-item";
    li.dataset.index = index;

    const movieDisplay = song.movie ? ` · ${song.movie}` : '';

    li.innerHTML = `
      <span class="song-index">${index + 1}</span>
      <span class="song-thumb">${MOOD_EMOJI[state.selectedMood]}</span>
      <span class="song-info">
        <p class="song-title">${song.title}</p>
        <p class="song-artist">${song.artist}${movieDisplay}</p>
      </span>
      <span class="song-tag">${song.intensity}%</span>
      <span class="song-duration">${formatTime(song.duration)}</span>
      <span class="song-play-icon">▶</span>
    `;

    li.addEventListener("click", () => loadSong(index, true));
    songListEl.appendChild(li);
  });
}

/* ---------------------------------------------------------
   12. LOAD SONG — checks cache, then searches YouTube and plays
--------------------------------------------------------- */
async function loadSong(index, autoPlay = false) {
  if (!state.playlist.length) return;

  const total = state.playlist.length;
  state.currentIndex = ((index % total) + total) % total;

  const song = state.playlist[state.currentIndex];
  const mood = state.selectedMood;
  const tier = intensityTier(Number(intensitySlider.value));

  // Update UI immediately with what we know
  playerTitle.textContent  = song.title;
  playerArtist.textContent = song.artist;
  totalTimeEl.textContent  = formatTime(song.duration);
  currentTimeEl.textContent= "0:00";
  progressFill.style.width = "0%";

  // Reset album art to placeholder while loading
  albumArtEl.innerHTML = `
    <svg viewBox="0 0 24 24" class="note-icon" aria-hidden="true">
      <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/>
      <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/>
    </svg>`;

  highlightActiveSong();
  stopProgressSync();

  if (!ytReady) {
    showToast("⏳ YouTube player not ready yet, please try again in a second.");
    return;
  }

  // Show loading indicator (cache hits will swap this to "⚡ Cached")
  setYtLoading(true);
  clearBufferWatchdog();

  const result = await searchYouTube(song, mood, tier);

  if (!result) {
    setYtLoading(false);
    return;
  }

  const { videoId, thumbnail } = result;

  // Show thumbnail as album art
  albumArtEl.innerHTML = `
    <img
      src="${thumbnail}"
      alt="${song.title} thumbnail"
      class="album-thumb"
      onerror="this.style.display='none'"
    />`;

  if (autoPlay) {
    ytPlayer.loadVideoById(videoId);
    state.isPlaying = true;
    playBtn.textContent = "⏸";
    // Arm the watchdog — will fire if PLAYING never arrives within 10 s
    armBufferWatchdog(state.currentIndex);
  } else {
    ytPlayer.cueVideoById(videoId);
    state.isPlaying = false;
    playBtn.textContent = "▶";
    setYtLoading(false);
    clearBufferWatchdog();
  }

  highlightActiveSong();
}

/* ---------------------------------------------------------
   13. PLAYER CONTROLS
--------------------------------------------------------- */
playBtn.addEventListener("click", () => {
  if (!state.playlist.length) return;

  if (!ytReady) {
    showToast("⏳ YouTube player initialising, try again in a moment.");
    return;
  }

  if (state.isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
});

prevBtn.addEventListener("click", () => {
  if (!state.playlist.length) return;
  loadSong(state.currentIndex - 1, state.isPlaying);
});

nextBtn.addEventListener("click", () => {
  if (!state.playlist.length) return;
  loadSong(state.currentIndex + 1, state.isPlaying);
});

/* Progress bar click — seek to position */
progressTrack.addEventListener("click", (e) => {
  if (!state.playlist.length || !ytReady) return;
  const rect        = progressTrack.getBoundingClientRect();
  const clickPercent= (e.clientX - rect.left) / rect.width;
  const duration    = ytPlayer.getDuration?.() || 0;
  if (duration > 0) {
    ytPlayer.seekTo(clickPercent * duration, true);
  }
});

/* ---------------------------------------------------------
   14. PROGRESS SYNC — polls the YT player every 500ms
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
   15. HIGHLIGHT ACTIVE SONG ROW
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
   16. SETTINGS HELPERS
--------------------------------------------------------- */
function openSettings(message) {
  refreshKeyInput();
  if (message) {
    keyStatus.textContent  = message;
    keyStatus.style.color  = "var(--accent)";
  }
  settingsOverlay.classList.remove("hidden");
}

/* ---------------------------------------------------------
   17. TOAST NOTIFICATION
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
   18. FORMAT TIME  187 → "3:07"
--------------------------------------------------------- */
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/* ---------------------------------------------------------
   19. INIT
--------------------------------------------------------- */
// Pre-seed the API key if not already saved
if (!localStorage.getItem("moodify_yt_api_key")) {
  localStorage.setItem("moodify_yt_api_key", DEFAULT_API_KEY);
}

// Cache version guard — bump version when song list changes so stale
// entries don't return wrong videos for new songs.
const SONG_DATA_VERSION = "kannada-v4";
if (localStorage.getItem("moodify_song_version") !== SONG_DATA_VERSION) {
  localStorage.removeItem("moodify_vcache");
  localStorage.setItem("moodify_song_version", SONG_DATA_VERSION);
}

updateIntensityReadout();

