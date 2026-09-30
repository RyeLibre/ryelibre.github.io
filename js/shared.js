// Shared helpers used by both index.html (js/main.js) and post.html (js/post.js).
// Posts/tags/photos added through the site's own UI are saved as drafts in this
// browser's localStorage — see the README for how to publish them for real.

const DRAFT_TAGS_KEY = "portfolio.draftTags";
const DRAFT_POSTS_KEY = "portfolio.draftPosts";
const IMAGE_OVERRIDES_KEY = "portfolio.imageOverrides";
const GALLERY_OVERRIDES_KEY = "portfolio.galleryOverrides";
const MEDIA_POOL_KEY = "portfolio.mediaPool";

function loadDraftTags() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_TAGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDraftTags(tags) {
  try {
    localStorage.setItem(DRAFT_TAGS_KEY, JSON.stringify(tags));
  } catch {}
}

function loadDraftPosts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDraftPosts(posts) {
  try {
    localStorage.setItem(DRAFT_POSTS_KEY, JSON.stringify(posts));
  } catch {}
}

function removeDraftPostStorage(id) {
  saveDraftPosts(loadDraftPosts().filter((p) => String(p.id) !== String(id)));
}

// Once a draft post gets published for real (added to data/projects.js under
// its own id), the original browser-local draft is never automatically
// deleted — it just sits in localStorage under its old numeric id and shows
// up as a duplicate copy alongside the real post. This clears out any draft
// whose title matches an already-published post, so publishing a draft is
// enough to make the duplicate disappear next time the site loads.
function pruneStaleDraftPosts() {
  const drafts = loadDraftPosts();
  const publishedTitles = new Set(PROJECTS.map((p) => (p.title || "").trim().toLowerCase()));
  const fresh = drafts.filter((d) => !publishedTitles.has((d.title || "").trim().toLowerCase()));
  if (fresh.length !== drafts.length) saveDraftPosts(fresh);
  return fresh;
}

function isDraftPostId(id) {
  return loadDraftPosts().some((p) => String(p.id) === String(id));
}

function loadImageOverrides() {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveImageOverrides(overrides) {
  try {
    localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    alert("Couldn't save that photo — it may be too large for browser storage. Try a smaller image.");
  }
}

function setImageOverride(id, dataUrl) {
  const overrides = loadImageOverrides();
  overrides[id] = dataUrl;
  saveImageOverrides(overrides);
}

function loadGalleryOverrides() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveGalleryOverrides(overrides) {
  try {
    localStorage.setItem(GALLERY_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    alert("Couldn't save that photo — it may be too large for browser storage. Try a smaller image.");
  }
}

function addGalleryImage(id, dataUrl) {
  const overrides = loadGalleryOverrides();
  if (!overrides[id]) overrides[id] = [];
  overrides[id].push(dataUrl);
  saveGalleryOverrides(overrides);
}

function removeGalleryImage(id, index) {
  const overrides = loadGalleryOverrides();
  if (overrides[id]) {
    overrides[id].splice(index, 1);
    saveGalleryOverrides(overrides);
  }
}

function getGalleryImages(project) {
  const overrides = loadGalleryOverrides()[project.id] || [];
  return [...(project.images || []), ...overrides];
}

// A pool of uploaded photos, kept independent of any one post, so a photo
// can be uploaded once and then picked for a cover or gallery slot on any
// post via the shared "photo picker" dialog (see openPhotoPicker below).
function loadMediaPool() {
  try {
    return JSON.parse(localStorage.getItem(MEDIA_POOL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMediaPool(pool) {
  try {
    localStorage.setItem(MEDIA_POOL_KEY, JSON.stringify(pool));
  } catch {
    alert("Couldn't save that photo — it may be too large for browser storage. Try a smaller image.");
  }
}

function addToMediaPool(dataUrl, name) {
  const pool = loadMediaPool();
  const item = {
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    dataUrl,
    name: name || "",
    addedAt: new Date().toISOString(),
  };
  pool.unshift(item);
  saveMediaPool(pool);
  return item;
}

function removeFromMediaPool(id) {
  saveMediaPool(loadMediaPool().filter((item) => item.id !== id));
}

let photoPickerCallback = null;

function renderPhotoPickerGrid() {
  const grid = document.getElementById("photo-picker-grid");
  if (!grid) return;
  const staticPool = typeof STATIC_MEDIA_POOL !== "undefined" ? STATIC_MEDIA_POOL : [];
  const pool = [...staticPool, ...loadMediaPool()];
  grid.innerHTML = "";
  grid.classList.toggle("media-pool-grid-selectable", !!photoPickerCallback);

  if (pool.length === 0) {
    const empty = document.createElement("p");
    empty.className = "section-hint";
    empty.textContent = "No photos in your pool yet — upload one above.";
    grid.appendChild(empty);
    return;
  }

  pool.forEach((item) => {
    const fig = document.createElement("figure");
    fig.className = "gallery-item media-pool-item";

    const img = document.createElement("img");
    img.src = item.dataUrl;
    img.alt = item.name || "";
    img.loading = "lazy";
    if (photoPickerCallback) {
      img.title = "Use this photo";
      img.addEventListener("click", () => {
        photoPickerCallback(item.dataUrl);
        document.getElementById("photo-picker-dialog").close();
      });
    }
    fig.appendChild(img);

    if (staticPool.includes(item)) {
      const badge = document.createElement("span");
      badge.className = "media-pool-builtin-badge";
      badge.textContent = "Built-in";
      fig.appendChild(badge);
    } else {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "reset-photo-btn gallery-remove";
      removeBtn.textContent = "Delete";
      removeBtn.title = "Remove this photo from your media pool (posts already using it keep it)";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromMediaPool(item.id);
        renderPhotoPickerGrid();
      });
      fig.appendChild(removeBtn);
    }

    grid.appendChild(fig);
  });
}

// Opens the shared photo-picker dialog. Pass onSelect to let the user pick a
// pool photo (or upload a new one) for a specific slot; omit it to open the
// dialog purely for managing the pool (upload/delete, nothing gets applied).
function openPhotoPicker(title, onSelect) {
  photoPickerCallback = onSelect || null;
  document.getElementById("photo-picker-title").textContent = title;
  renderPhotoPickerGrid();
  document.getElementById("photo-picker-dialog").showModal();
}

function bindPhotoPickerUpload() {
  const uploadInput = document.getElementById("photo-picker-upload");
  if (!uploadInput) return;
  uploadInput.addEventListener("change", () => {
    const file = uploadInput.files[0];
    if (!file) return;
    resizeImageForWeb(file)
      .then((dataUrl) => {
        const item = addToMediaPool(dataUrl, file.name);
        if (photoPickerCallback) {
          photoPickerCallback(item.dataUrl);
          document.getElementById("photo-picker-dialog").close();
        } else {
          renderPhotoPickerGrid();
        }
        uploadInput.value = "";
      })
      .catch((err) => alert(err.message || "Couldn't process that image."));
  });
}

function bindDialogCloseButtons() {
  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  });
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Resizes/re-encodes an uploaded image for the web: scales it down so neither
// dimension exceeds maxDim (keeps small images as-is), then re-encodes as a
// high-quality JPEG. Keeps localStorage usage down and avoids publishing
// full-resolution camera photos by accident. Rejects files over 10MB before
// doing any work, since browser storage (localStorage) has its own low
// overall quota regardless of how much any single image gets resized.
function resizeImageForWeb(file, maxDim = 2200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("That file is larger than 10MB — please choose a smaller image."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Flatten transparency onto white — avoids black backgrounds on PNGs
        // once re-encoded as JPEG.
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

// A post's `date` may be stored as "YYYY-MM" or a full "YYYY-MM-DD" — either
// way, only year and month are ever shown, e.g. "MARCH '25".
function formatPostDate(dateStr) {
  const m = /^(\d{4})-(\d{2})/.exec(dateStr || "");
  if (!m) return dateStr || "";
  const monthName = MONTH_NAMES[parseInt(m[2], 10) - 1];
  if (!monthName) return dateStr;
  return `${monthName} '${m[1].slice(-2)}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function initials(title) {
  const words = (title || "?").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeholderImage(title) {
  const hue = hashString(title || "Untitled") % 360;
  const bg = `hsl(${hue}, 45%, 82%)`;
  const fg = `hsl(${hue}, 40%, 28%)`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="50%" y="50%" font-family="Special Elite, monospace" font-size="64" ` +
    `fill="${fg}" text-anchor="middle" dominant-baseline="central">${escapeHtml(initials(title))}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function getImageSrc(project) {
  const overrides = loadImageOverrides();
  if (overrides[project.id]) return overrides[project.id];
  if (project.image) return project.image;
  return placeholderImage(project.title);
}

const POST_EDITS_KEY = "portfolio.postEdits";

function loadPostEdits() {
  try {
    return JSON.parse(localStorage.getItem(POST_EDITS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePostEdits(edits) {
  try {
    localStorage.setItem(POST_EDITS_KEY, JSON.stringify(edits));
  } catch {}
}

function setPostEdit(id, fields) {
  const edits = loadPostEdits();
  edits[id] = fields;
  savePostEdits(edits);
}

function applyPostEdit(project) {
  const edit = loadPostEdits()[project.id];
  return edit ? { ...project, ...edit } : project;
}

// Edits a post's text fields regardless of whether it's a draft (updates the
// draft object directly) or one already in data/projects.js (saved as a
// local overlay applied on top of it — see applyPostEdit).
function updatePost(id, fields) {
  if (isDraftPostId(id)) {
    const drafts = loadDraftPosts();
    const idx = drafts.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) {
      drafts[idx] = { ...drafts[idx], ...fields };
      saveDraftPosts(drafts);
    }
  } else {
    setPostEdit(id, fields);
  }
}

const CITY_COORD_OVERRIDES_KEY = "portfolio.cityCoordOverrides";

function loadCityCoordOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CITY_COORD_OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCityCoordOverrides(overrides) {
  try {
    localStorage.setItem(CITY_COORD_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {}
}

function setCityCoordOverride(name, x, y) {
  const overrides = loadCityCoordOverrides();
  overrides[name.toLowerCase()] = { label: name, x, y };
  saveCityCoordOverrides(overrides);
}

function removeCityCoordOverride(key) {
  const overrides = loadCityCoordOverrides();
  delete overrides[key];
  saveCityCoordOverrides(overrides);
}

// City coordinates: a manually-placed pin (from "+ Pin a city") always wins
// over the built-in lat/lon-derived table, since it was placed by eye
// against this exact map image.
function getCityCoord(key) {
  const overrides = loadCityCoordOverrides();
  if (overrides[key]) return overrides[key];
  if (typeof CITY_COORDS !== "undefined" && CITY_COORDS[key]) return CITY_COORDS[key];
  return null;
}

// Featured posts sort first (within any tag, or in the unfiltered "All
// Projects" view a new visitor lands on), then newest-first by date.
function compareProjects(a, b) {
  const fa = a.featured ? 1 : 0;
  const fb = b.featured ? 1 : 0;
  if (fa !== fb) return fb - fa;
  return (b.date || "").localeCompare(a.date || "");
}

function getAllProjects() {
  const projects = [...PROJECTS, ...pruneStaleDraftPosts()].map(applyPostEdit);
  projects.sort(compareProjects);
  return projects;
}

// Builds the radial "how the tags connect" SVG markup shared by the
// homepage's interactive tag map and the post page's hover-to-reveal one.
function buildTagMapSvgMarkup(tags, projects, activeKeys) {
  const n = tags.length;
  if (n === 0) return "";

  const size = 760;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 130;

  const positions = tags.map((tag, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      tag,
      key: tag.toLowerCase(),
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle,
    };
  });

  const posByKey = new Map(positions.map((p) => [p.key, p]));

  const postCounts = new Map();
  const edgeCounts = new Map();

  projects.forEach((p) => {
    const cats = [...new Set((p.categories || []).map((c) => c.toLowerCase()))];
    cats.forEach((c) => postCounts.set(c, (postCounts.get(c) || 0) + 1));
    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const key = [cats[i], cats[j]].sort().join("|");
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
    }
  });

  const edgeLines = [];
  edgeCounts.forEach((count, key) => {
    const [a, b] = key.split("|");
    const pa = posByKey.get(a);
    const pb = posByKey.get(b);
    if (!pa || !pb) return;
    const highlighted = activeKeys.has(a) || activeKeys.has(b);
    const width = Math.min(1.5 + count * 1.2, 6);
    edgeLines.push(
      `<line class="tag-edge${highlighted ? " active" : ""}" x1="${pa.x.toFixed(1)}" y1="${pa.y.toFixed(1)}" x2="${pb.x.toFixed(1)}" y2="${pb.y.toFixed(1)}" style="--edge-w:${width}"></line>`
    );
  });

  const nodeEls = positions.map((p) => {
    const count = postCounts.get(p.key) || 0;
    const r = 7 + Math.min(count * 2.5, 12);
    const isActive = activeKeys.has(p.key);

    const deg = (p.angle * 180) / Math.PI;
    let anchor = "middle";
    let dx = 0;
    let dy = -r - 8;
    if (deg > -75 && deg < 75) {
      anchor = "start";
      dx = r + 8;
      dy = 4;
    } else if (deg > 105 || deg < -105) {
      anchor = "end";
      dx = -(r + 8);
      dy = 4;
    }

    const label = escapeHtml(p.tag);
    return `
      <g class="tag-node${isActive ? " active" : ""}" data-tag="${label}" tabindex="0" role="button" aria-pressed="${isActive}" aria-label="Filter by ${label}">
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}"></circle>
        <text x="${(p.x + dx).toFixed(1)}" y="${(p.y + dy).toFixed(1)}" text-anchor="${anchor}">${label}</text>
      </g>`;
  });

  return `
    <svg viewBox="0 0 ${size} ${size}" class="tag-map-svg" xmlns="http://www.w3.org/2000/svg">
      <g class="tag-map-edges">${edgeLines.join("")}</g>
      <g class="tag-map-nodes">${nodeEls.join("")}</g>
    </svg>`;
}

// Bundles everything added through the site's own UI (draft posts, draft
// tags, edits to existing posts, and every locally-chosen cover/gallery
// photo — including ones set on posts that already exist in
// data/projects.js) into one downloadable file. Hand that file to whoever
// maintains the code to make it all permanent.
function exportDrafts() {
  const data = {
    exportedAt: new Date().toISOString(),
    draftTags: loadDraftTags(),
    draftPosts: loadDraftPosts(),
    postEdits: loadPostEdits(),
    imageOverrides: loadImageOverrides(),
    galleryOverrides: loadGalleryOverrides(),
    cityCoordOverrides: loadCityCoordOverrides(),
    mediaPool: loadMediaPool(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "portfolio-drafts-export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
