/* =============================================================
   Moodify Backend — mood → YouTube search query mapping
   -------------------------------------------------------------
   IMPORTANT: this file intentionally contains NO song titles,
   artists, or movie names. Hardcoding actual songs is what
   caused the old bug (stale picks, wrong mood, songs that don't
   even exist anymore). Instead we describe the *kind* of song
   to look for, per mood + intensity tier, and let the YouTube
   Data API return real, current results at request time
   (see routes/playlist.js, which also filters by publish date).
============================================================= */

const MOOD_QUERIES = {
  happy: {
    mellow:   "kannada feel good happy song",
    moderate: "kannada happy dance song",
    intense:  "kannada high energy party song",
  },
  sad: {
    mellow:   "kannada emotional song",
    moderate: "kannada sad melody song",
    intense:  "kannada heartbreak song",
  },
  calm: {
    mellow:   "kannada soothing melody song",
    moderate: "kannada calm acoustic song",
    intense:  "kannada peaceful devotional song",
  },
  romantic: {
    mellow:   "kannada sweet love song",
    moderate: "kannada romantic melody song",
    intense:  "kannada passionate love song",
  },
  energetic: {
    mellow:   "kannada upbeat song",
    moderate: "kannada mass beat song",
    intense:  "kannada high energy mass anthem song",
  },
  angry: {
    mellow:   "kannada intense background song",
    moderate: "kannada fight anthem song",
    intense:  "kannada aggressive mass anthem song",
  },
  sleepy: {
    mellow:   "kannada soft lullaby song",
    moderate: "kannada slow melody song",
    intense:  "kannada deep calm instrumental song",
  },
};

module.exports = MOOD_QUERIES;
