# Moodify — Mood Music Generator

A simple, beginner-friendly web app: pick a mood, get a matching playlist,
and a mini music player that "plays" it — all with plain HTML, CSS, and
JavaScript. No backend, no API key, no build tools.

## How to run it

1. Unzip/open the `moodify` folder.
2. Double-click `index.html` — it opens in your browser and works right away.
   (Or, in VS Code, install the "Live Server" extension and click "Go Live"
   for auto-reload while you edit.)

That's it — there's no installation or server required.

## Files in this project

- **index.html** — the structure/content of the page (the "skeleton"):
  headings, mood buttons, the results area, and the player bar.
- **style.css** — all the visual design: colors, fonts, glass-card look,
  gradients, animations, and mobile responsiveness.
- **script.js** — the "brain": stores the sample songs, reacts to clicks,
  swaps the color theme, and runs the fake music player.

## How the mood selection works

1. Every mood button in `index.html` has a `data-mood="happy"` (etc.)
   attribute.
2. In `script.js`, we listen for clicks on all `.mood-card` buttons. When
   one is clicked, we read its `data-mood` value and save it in
   `state.selectedMood`, then enable the "Generate My Music" button.
3. Clicking "Generate My Music" does five things, in order:
   - Looks up 5 songs for that mood from the `SONG_DATA` object.
   - Changes `document.body.className` to `mood-<mood>`. Since the CSS
     defines different `--accent` / `--accent-2` variables for each
     `body.mood-xxx` class, and the rest of the site is built with
     `var(--accent)`, the whole page re-colors itself instantly.
   - Sets the AI-style message from the `AI_MESSAGES` object.
   - Renders the 5 songs into the list.
   - Loads the first song into the bottom player bar.

## How the player works (important: no real audio)

There are no actual audio files in this project — that would need real
licensed music and a backend to serve it. Instead, `script.js` **simulates**
playback:

- Each song has a `duration` (in seconds).
- Pressing play starts a `setInterval` timer that ticks once per second,
  increasing `state.elapsedSeconds` and filling in the progress bar.
- When elapsed time reaches the song's duration, it automatically loads
  the next song.
- Prev/Next buttons just move `state.currentIndex` and reload the player.
- Clicking anywhere on the progress bar "seeks" by calculating what
  percentage of the bar you clicked.

## How the intensity slider works

Each song in `SONG_DATA` has an `intensity` value from 0–100 (0 = the
mellowest version of that mood, 100 = the most extreme). When you drag
the slider and click "Generate My Music", `script.js`:

1. Copies the mood's song list.
2. Sorts it by how close each song's `intensity` is to the slider's value
   (`Math.abs(song.intensity - sliderValue)` — smaller = closer match).
3. Takes the 5 closest songs.

So sliding to `10` for "Sad" pulls gentle, wistful songs; sliding to `90`
pulls the heaviest, most heartbroken ones. The little emoji + word above
the slider (e.g. "Melancholy") also updates live as you drag, using the
`INTENSITY_LABELS` lookup table.

## How to add more songs

Open `script.js` and find the `SONG_DATA` object near the top. Each mood
is an array — just add another object to the array, matching the same
shape:

```js
happy: [
  { title: "Sunshine Parade", artist: "The Bright Sides", duration: 198, intensity: 50 },
  // 👇 add a new song like this:
  { title: "My New Song", artist: "My Artist", duration: 200, intensity: 70 },
],
```

`duration` is in seconds (200 = 3 minutes 20 seconds). `intensity` is a
number from 0–100 — pick roughly where this song sits on the mellow →
intense scale for that mood. You can add as many songs as you like, or
even add a brand-new mood by:

1. Adding a new key to `SONG_DATA` (e.g. `focused: [...]`).
2. Adding a matching entry to `AI_MESSAGES` and `MOOD_EMOJI`.
3. Adding a new mood card `<button>` in `index.html`.
4. Adding a `body.mood-focused { --accent: ...; --accent-2: ...; }` rule
   near the top of `style.css` for its color theme.

## How to later connect it to Spotify (or another music API)

Right now songs are hard-coded local data. To use real music later:

1. **Pick an API** — Spotify's Web API is the most common choice. You'd
   register an app on the Spotify Developer Dashboard to get a Client ID.
2. **Add authentication** — Spotify requires OAuth login, which normally
   needs a small backend (or Spotify's newer PKCE flow, which can work
   from the browser alone) to securely exchange codes for an access token.
3. **Replace `SONG_DATA` lookups with API calls** — for example, instead
   of reading `SONG_DATA[mood]`, you'd call Spotify's
   `GET /v1/recommendations` or `GET /v1/search` endpoint with mood-related
   genres/keywords (e.g. "happy" → `seed_genres=pop,dance`), using
   JavaScript's `fetch()`.
4. **Use real audio previews** — Spotify tracks include a `preview_url`
   (a 30-second clip) you can drop straight into an HTML `<audio>` element
   and control with `.play()` / `.pause()` instead of the fake timer.
5. **Swap album art placeholders** — each Spotify track includes real
   album art image URLs you can set directly as the `<img>` source.

Because `script.js` already separates "get the songs" (`SONG_DATA`) from
"render the songs" (`renderSongList`, `loadSong`), you mostly just need to
replace how the song list is *fetched* — the rendering and player logic
can stay almost the same.

## Ideas for extending it further

- Save the last selected mood using `localStorage` so it's remembered on
  reload.
- Add a shuffle button that randomizes `state.playlist` order.
- Add more moods (e.g. Focused, Nostalgic, Anxious).
- Add real `<audio>` playback using royalty-free sample tracks.
