// Splash intro: a square, white-on-black sequence (~50 s).
//   1. Rye Libre / All things Libre
//   2. One run through the topics, in order. For each topic the word fades in on
//      black, photos dissolve into one another over it, and the last photo fades
//      away to black (a moment of black) before the next topic's word arrives.
//   3. A recap list, ending on "How can I help?"
// Words, photos and the recap come from data/splash.js. Plays once per browser
// session; open the site with ?intro=1 (or use the footer link) to replay it.
(function () {
  const SEEN_KEY = "portfolio.introSeen";
  const params = new URLSearchParams(location.search);
  const forced = params.get("intro") === "1";

  let seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ((seen || reduceMotion) && !forced) return;
  if (typeof SPLASH_WORDS === "undefined") return;

  // ---- pacing (seconds) ----
  const TITLE_SECONDS = 3.0;
  const WORD_SECONDS = 1.0; // a topic word stays up this long, fading in and out
  const WORD_FADE = 0.35;
  const PHOTO_START = 0.4; // first photo starts dissolving in this long after the word
  const PHOTO_STEP = 0.4; // each photo is replaced by the next after this long
  const PHOTO_FADE = 0.3; // dissolve between photos
  const LAST_FADE = 0.7; // the last photo fades away to black over this long
  const BLACK_GAP = 0.25; // a few frames of black before the next topic
  const RECAP_STEP = 0.3; // recap: one line every 0.3 s
  const END_SECONDS = 4.0;

  const words = SPLASH_WORDS.filter(Boolean);
  const wordImages = Object.assign({}, typeof SPLASH_WORD_IMAGES !== "undefined" ? SPLASH_WORD_IMAGES : {});

  // Every topic gets photos. Where data/splash.js has none for a word yet, use
  // placeholders taken from posts with that tag (cover photos first, then gallery
  // photos), skipping logos. Add the word to SPLASH_WORD_IMAGES to choose your own.
  const PLACEHOLDERS_PER_WORD = 2;
  const usedPhotos = new Set(Object.values(wordImages).flat());
  const isPhoto = (src) => src && /\.(jpe?g|png|webp)$/i.test(src);
  words.forEach((w) => {
    if (wordImages[w] && wordImages[w].length) return;
    if (typeof PROJECTS === "undefined") return;
    const key = w.toLowerCase();
    const picks = [];
    PROJECTS.forEach((p) => {
      if (picks.length >= PLACEHOLDERS_PER_WORD) return;
      if (!(p.categories || []).some((c) => c.toLowerCase() === key)) return;
      const candidates = [];
      if (!p.imageFit) candidates.push(p.image);
      (p.images || []).forEach((src) => candidates.push(src));
      const src = candidates.find((s) => isPhoto(s) && !usedPhotos.has(s));
      if (src) { picks.push(src); usedPhotos.add(src); }
    });
    if (picks.length) wordImages[w] = picks;
  });
  Object.values(wordImages).forEach((list) => list.forEach((src) => { const i = new Image(); i.src = src; })); // preload

  const recap = typeof SPLASH_RECAP !== "undefined" ? SPLASH_RECAP : words;

  // ---- DOM ----
  const root = document.createElement("div");
  root.id = "splash";
  root.innerHTML =
    '<div class="splash-stage">' +
    '<img class="splash-img" alt="">' +
    '<img class="splash-img" alt="">' +
    '<div class="splash-text"></div>' +
    "</div>" +
    '<button type="button" class="splash-skip">Skip &rsaquo;</button>';
  document.body.appendChild(root);
  document.documentElement.classList.add("splash-active");

  const layers = [...root.querySelectorAll(".splash-img")];
  const textEl = root.querySelector(".splash-text");
  let nextLayer = 0;
  let currentLayer = null;

  // ---- primitives (all fades are CSS opacity transitions, so they stay smooth) ----
  const fadeLayer = (el, to, secs, easing) => {
    el.style.transition = "opacity " + secs + "s " + (easing || "ease-in-out");
    el.style.opacity = String(to);
  };
  const setText = (cls, html) => {
    textEl.className = "splash-text " + cls;
    textEl.innerHTML = html;
  };
  const textIn = (secs) => { textEl.style.transition = "opacity " + secs + "s ease-in-out"; textEl.style.opacity = "1"; };
  const textOut = (secs) => { textEl.style.transition = "opacity " + secs + "s ease-in-out"; textEl.style.opacity = "0"; };
  const textNow = (on) => { textEl.style.transition = "none"; textEl.style.opacity = on ? "1" : "0"; };

  // Bring a photo in on the spare layer while the current one dissolves out.
  const photoIn = (src, secs) => {
    const el = layers[nextLayer];
    nextLayer = (nextLayer + 1) % layers.length;
    el.style.transition = "none";
    el.style.opacity = "0";
    el.src = src;
    void el.offsetWidth;
    fadeLayer(el, 1, secs);
    if (currentLayer && currentLayer !== el) fadeLayer(currentLayer, 0, secs);
    currentLayer = el;
  };
  const photoOut = (secs) => {
    if (currentLayer) fadeLayer(currentLayer, 0, secs, "ease-in");
    currentLayer = null;
  };
  const clearPhotos = () => layers.forEach((el) => { el.style.transition = "none"; el.style.opacity = "0"; });

  // ---- timeline: absolute-time events ----
  const events = [];
  const at = (t, fn) => events.push({ t, fn });
  let t = 0;

  // 1. Title
  at(t, () => { clearPhotos(); setText("splash-title", 'Rye Libre<span class="splash-sub">All things Libre</span>'); textIn(0.6); });
  at(t + TITLE_SECONDS - 0.6, () => textOut(0.6));
  t += TITLE_SECONDS + BLACK_GAP;

  // 2. One run through the topics
  words.forEach((w) => {
    const photos = wordImages[w] || [];
    at(t, () => { setText("splash-word", w); textIn(WORD_FADE); });
    at(t + WORD_SECONDS - WORD_FADE, () => textOut(WORD_FADE));

    photos.forEach((src, i) => {
      const start = t + PHOTO_START + i * PHOTO_STEP;
      at(start, () => photoIn(src, PHOTO_FADE));
    });
    const lastStart = t + PHOTO_START + Math.max(photos.length - 1, 0) * PHOTO_STEP;
    // Hold the last photo briefly, then let it fade away to black.
    at(lastStart + PHOTO_STEP, () => photoOut(LAST_FADE));
    const blockEnd = Math.max(t + WORD_SECONDS, lastStart + PHOTO_STEP + LAST_FADE);
    t = blockEnd + BLACK_GAP;
  });

  // 3. Recap, then the closing question
  at(t, () => { clearPhotos(); setText("splash-recap", ""); textNow(true); });
  recap.forEach((_, n) => {
    at(t + n * RECAP_STEP, () => {
      textEl.innerHTML = recap
        .map((line, i) => '<div class="' + (i <= n ? "on" : "off") + '">' + line.replace(/&/g, "&amp;") + "</div>")
        .join("");
    });
  });
  t += recap.length * RECAP_STEP + 1.5;
  at(t - 0.4, () => textOut(0.4));
  t += 0.2;
  at(t, () => { setText("splash-title", "How can I help?"); textIn(0.7); });
  at(t + END_SECONDS - 0.7, () => textOut(0.7));
  t += END_SECONDS;

  const total = t;

  // Progress ring: a thin circle that empties over the whole intro (no numbers).
  const ring = document.createElement("div");
  ring.className = "splash-ring";
  ring.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle class="splash-ring-track" cx="20" cy="20" r="17"></circle>' +
    '<circle class="splash-ring-left" cx="20" cy="20" r="17" style="animation-duration:' + total.toFixed(2) + 's"></circle>' +
    "</svg>";
  root.appendChild(ring);

  if (window.console && console.debug) console.debug("Splash intro length: " + total.toFixed(1) + "s");

  // ---- run ----
  let timers = [];
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    root.classList.add("splash-out");
    document.documentElement.classList.remove("splash-active");
    setTimeout(() => root.remove(), 900);
  }

  events.forEach((e) => timers.push(setTimeout(() => { if (!finished) e.fn(); }, e.t * 1000)));
  timers.push(setTimeout(finish, total * 1000));

  root.querySelector(".splash-skip").addEventListener("click", finish);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") finish(); });

  window.replaySplashIntro = function () {
    location.href = location.pathname + "?intro=1";
  };
})();
