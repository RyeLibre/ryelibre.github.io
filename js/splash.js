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
  const PHOTO_SECONDS = 0.4; // each photo that follows its topic
  const RECAP_STEP_SECONDS = 0.3; // recap list: one word every 0.3 s

  const words = SPLASH_WORDS.filter(Boolean);
  const wordImages = typeof SPLASH_WORD_IMAGES !== "undefined" ? SPLASH_WORD_IMAGES : {};
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
  const showFaded = (cls, html, dur) => {
    imgEl.hidden = true;
    textEl.className = "splash-text " + cls;
    textEl.innerHTML = html;
    textEl.style.animation = "none";
    void textEl.offsetWidth; // restart the animation
    textEl.style.animation = "splash-fade " + dur + "s ease-in-out both";
  };
  const showPhoto = (src) => {
    textEl.style.animation = "none";
    textEl.innerHTML = "";
    imgEl.src = src;
    imgEl.hidden = false;
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

  const TITLE = 3.5;
  add(TITLE, () => showFaded("splash-title", 'Rye Libre<span class="splash-sub">All things Libre</span>', TITLE));

  // One run through the topics, in order
  words.forEach((w) => {
    add(WORD_SECONDS, () => showFaded("splash-word", w, WORD_SECONDS));
    (wordImages[w] || []).forEach((src) => add(PHOTO_SECONDS, () => showPhoto(src)));
  });

  // Recap by text, then the closing question
  for (let n = 1; n <= words.length; n++) add(RECAP_STEP_SECONDS, () => showList(n));
  add(1.5, () => showList(words.length));
  const END = 4.5;
  add(END, () => showFaded("splash-title", "How can I help?", END));

  const total = frames.reduce((s, f) => s + f.dur, 0);
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
