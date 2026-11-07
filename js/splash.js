// Splash intro: a square, white-on-black sequence (~45 s).
//   1. Rye Libre / All things Libre
//   2. One run through the topics, in order: each word fades in and out on black
//      (1 s); topics that have photos then run through them, a little slower.
//   3. A recap of all the topics as text, ending on "How can I help?"
// Words and photos come from data/splash.js. Plays once per browser session;
// open the site with ?intro=1 (or use the footer link) to replay it.
(function () {
  const SEEN_KEY = "portfolio.introSeen";
  const params = new URLSearchParams(location.search);
  const forced = params.get("intro") === "1";

  let seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ((seen || reduceMotion) && !forced) return;
  if (typeof SPLASH_WORDS === "undefined") return;

  const WORD_SECONDS = 1.0; // each topic word on black, fading in and out
  const PHOTO_SECONDS = 0.35; // each photo that follows its topic (the first fades in)
  const LAST_PHOTO_SECONDS = 0.8; // the topic's last photo, fading out to black
  const RECAP_STEP_SECONDS = 0.3; // recap list: one word every 0.3 s

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

  const root = document.createElement("div");
  root.id = "splash";
  root.innerHTML =
    '<div class="splash-stage">' +
    '<img class="splash-img" alt="" hidden>' +
    '<div class="splash-text"></div>' +
    "</div>" +
    '<button type="button" class="splash-skip">Skip &rsaquo;</button>';
  document.body.appendChild(root);
  document.documentElement.classList.add("splash-active");

  const imgEl = root.querySelector(".splash-img");
  const textEl = root.querySelector(".splash-text");

  // ---- frame renderers ----
  // Text that fades in and out over `dur` seconds (a quarter fading in, a quarter out).
  const setImgAnimation = (css) => {
    imgEl.style.animation = "none";
    void imgEl.offsetWidth; // restart the animation
    imgEl.style.animation = css;
  };
  const showFaded = (cls, html, dur) => {
    imgEl.hidden = true;
    imgEl.style.animation = "none";
    textEl.className = "splash-text " + cls;
    textEl.innerHTML = html;
    textEl.style.animation = "none";
    void textEl.offsetWidth; // restart the animation
    textEl.style.animation = "splash-fade " + dur + "s ease-in-out both";
  };
  // mode: "in" fades the photo in from black, "out" fades it to black over `dur`
  // (you see less and less), anything else is a straight cut.
  const showPhoto = (src, mode, dur) => {
    textEl.style.animation = "none";
    textEl.innerHTML = "";
    imgEl.src = src;
    imgEl.hidden = false;
    if (mode === "in") setImgAnimation("splash-photo-in " + dur + "s ease-out both");
    else if (mode === "out") setImgAnimation("splash-photo-out " + dur + "s ease-in both");
    else imgEl.style.animation = "none";
  };
  // The recap list: rows of three with middle dots, revealed word by word.
  const PER_ROW = 3;
  const showList = (count) => {
    imgEl.hidden = true;
    textEl.style.animation = "none";
    textEl.className = "splash-text splash-list";
    const rows = [];
    for (let r = 0; r < words.length; r += PER_ROW) {
      const parts = words.slice(r, r + PER_ROW).map((w, k) => {
        const on = r + k < count;
        return '<span class="' + (on ? "on" : "off") + '">' + (k > 0 ? '<span class="dot"> &middot; </span>' : "") + w + "</span>";
      });
      rows.push("<div>" + parts.join("") + "</div>");
    }
    textEl.innerHTML = rows.join("");
  };

  // ---- timeline (seconds) ----
  const frames = [];
  const add = (dur, fn) => frames.push({ dur, fn });

  const TITLE = 3.0;
  add(TITLE, () => showFaded("splash-title", 'Rye Libre<span class="splash-sub">All things Libre</span>', TITLE));

  // One run through the topics, in order
  words.forEach((w) => {
    add(WORD_SECONDS, () => showFaded("splash-word", w, WORD_SECONDS));
    const photos = wordImages[w] || [];
    photos.forEach((src, i) => {
      const last = i === photos.length - 1;
      if (last) add(LAST_PHOTO_SECONDS, () => showPhoto(src, "out", LAST_PHOTO_SECONDS));
      else if (i === 0) add(PHOTO_SECONDS, () => showPhoto(src, "in", PHOTO_SECONDS));
      else add(PHOTO_SECONDS, () => showPhoto(src, "cut", 0));
    });
  });

  // Recap by text, then the closing question
  for (let n = 1; n <= words.length; n++) add(RECAP_STEP_SECONDS, () => showList(n));
  add(1.2, () => showList(words.length));
  const END = 4.0;
  add(END, () => showFaded("splash-title", "How can I help?", END));

  const total = frames.reduce((s, f) => s + f.dur, 0);

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

  let timer = null;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    root.classList.add("splash-out");
    document.documentElement.classList.remove("splash-active");
    setTimeout(() => root.remove(), 900);
  }

  function run(i) {
    if (finished) return;
    if (i >= frames.length) { finish(); return; }
    frames[i].fn();
    timer = setTimeout(() => run(i + 1), frames[i].dur * 1000);
  }

  root.querySelector(".splash-skip").addEventListener("click", finish);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") finish(); });
  run(0);

  window.replaySplashIntro = function () {
    location.href = location.pathname + "?intro=1";
  };
})();
