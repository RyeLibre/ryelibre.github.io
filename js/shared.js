// Shared helpers used by both index.html (js/main.js) and post.html (js/post.js).
// Posts/tags/photos added through the site's own UI are saved as drafts in this
// browser's localStorage — see the README for how to publish them for real.

const DRAFT_TAGS_KEY = "portfolio.draftTags";
const DRAFT_POSTS_KEY = "portfolio.draftPosts";
const IMAGE_OVERRIDES_KEY = "portfolio.imageOverrides";
const GALLERY_OVERRIDES_KEY = "portfolio.galleryOverrides";

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

function clearImageOverride(id) {
  const overrides = loadImageOverrides();
  delete overrides[id];
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

function getAllProjects() {
  const projects = [...PROJECTS, ...loadDraftPosts()].map(applyPostEdit);
  projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return projects;
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
