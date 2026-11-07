// Splash intro: a square, white-on-black sequence (~50 s) that runs the tag
// words and a few photos at an increasing pace, then hands over to the site.
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
  if (typeof SPLASH_WORDS === "undefined" || typeof SPLASH_IMAGES === "undefined") return;

  const words = SPLASH_WORDS.filter(Boolean);
  const images = SPLASH_IMAGES.slice();
  const wordImages = typeof SPLASH_WORD_IMAGES !== "undefined" ? SPLASH_WORD_IMAGES : {};
  images.concat(...Object.values(wordImages)).forEach((src) => { const i = new Image(); i.src = src; }); // preload

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
  let imgIndex = 0;
  const nextImage = () => images[imgIndex++ % images.length];

  // ---- frame renderers ----
  // A word with its own photos runs through ALL of them, quickly, while it is on screen.
  let cycleTimer = null;
  const showWord = (w, onImage, dur) => {
    const own = wordImages[w];
    if (own && own.length) {
      let k = 0;
      imgEl.src = own[0];
      imgEl.hidden = false;
      const step = (dur * 1000) / own.length;
      if (own.length > 1) {
        cycleTimer = setInterval(() => {
          k += 1;
          if (k >= own.length) { clearInterval(cycleTimer); return; }
          imgEl.src = own[k];
        }, step);
      }
    } else if (onImage) { imgEl.src = nextImage(); imgEl.hidden = false; } else { imgEl.hidden = true; }
    textEl.className = "splash-text splash-word";
    textEl.textContent = w;
  };
  const showImage = () => {
    imgEl.src = nextImage();
    imgEl.hidden = false;
    textEl.textContent = "";
  };
  const showTitle = () => {
    imgEl.hidden = true;
    textEl.className = "splash-text splash-title";
    textEl.innerHTML = 'Rye Libre<span class="splash-sub">All things Libre</span>';
  };
  // The list is written in rows of three with middle dots, revealed word by word.
  const PER_ROW = 3;
  const showList = (count) => {
    imgEl.hidden = true;
    textEl.className = "splash-text splash-list";
    const rows = [];
    for (let r = 0; r < words.length; r += PER_ROW) {
      const parts = words.slice(r, r + PER_ROW).map((w, k) => {
        const on = r + k < count;
        return '<span class="' + (on ? "on" : "off") + '">' + (k > 0 ? '<span class="dot"> &middot; </span>' : '') + w + "</span>";
      });
      rows.push("<div>" + parts.join('') + "</div>");
    }
    textEl.innerHTML = rows.join("");
  };

  // ---- timeline (seconds) ----
  const frames = [];
  const add = (dur, fn) => frames.push({ dur, fn });
  // Duration for a word frame: long enough that each of its own photos gets at least ~0.14 s.
  const wordDur = (w, base) => Math.max(base, ((wordImages[w] || []).length) * 0.14);
  const addWord = (w, base, onImage) => { const d = wordDur(w, base); add(d, () => showWord(w, onImage, d)); };

  add(3.0, showTitle);
  // Round 1: one word at a time, every 4th over a photo
  words.forEach((w, i) => addWord(w, 1.0, i % 4 === 3));
  // Round 2: the list builds line by line, then holds
  for (let n = 1; n <= words.length; n++) add(0.42, () => showList(n));
  add(1.5, () => showList(words.length));
  // Round 3: faster, a photo flash after every third word
  words.forEach((w, i) => {
    addWord(w, 0.32, false);
    if (i % 3 === 2) add(0.18, showImage);
  });
  // Round 4: fastest
  words.forEach((w, i) => {
    addWord(w, 0.22, false);
    if (i % 3 === 2) add(0.12, showImage);
  });
  // Photo burst
  images.forEach(() => add(0.5, showImage));
  // Close
  add(2.5, () => showList(words.length));
  add(3.5, showTitle);

  const total = frames.reduce((s, f) => s + f.dur, 0);
  if (window.console && console.debug) console.debug("Splash intro length: " + total.toFixed(1) + "s");

  let timer = null;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clearInterval(cycleTimer);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    root.classList.add("splash-out");
    document.documentElement.classList.remove("splash-active");
    setTimeout(() => root.remove(), 900);
  }

  function run(i) {
    if (finished) return;
    if (i >= frames.length) { finish(); return; }
    clearInterval(cycleTimer);
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
