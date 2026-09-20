// Data/image helpers (loadDraftTags, getImageSrc, etc.) live in js/shared.js,
// shared with post.html. Use the generated code snippet shown after adding a
// post or tag to paste it into data/projects.js or data/tags.js to publish it.

const state = {
  projects: [],
  tags: [],
  draftTagKeys: new Set(), // lowercase tag names added as drafts
  draftPostIds: new Set(),
  activeTags: new Set(), // lowercase tag names currently filtering
  activeSubtag: null, // lowercase sub-tag narrowing the grid without changing the heading
  mapZoom: 25, // 25/50/75/100 — 25 shows the whole (cropped) map, 100 is most zoomed in
  pinningCity: false, // true while "+ Pin a city" mode is active
};

let editingProjectId = null; // set while the post dialog is in "edit" mode

const tagListEl = document.getElementById("tag-list");
const gridEl = document.getElementById("project-grid");
const emptyStateEl = document.getElementById("empty-state");
const tagMapEl = document.getElementById("tag-map");
const categoryIntroEl = document.getElementById("category-intro");

const tagDialog = document.getElementById("tag-dialog");
const tagForm = document.getElementById("tag-form");
const tagGenerated = document.getElementById("tag-generated");

const postDialog = document.getElementById("post-dialog");
const postForm = document.getElementById("post-form");
const postGenerated = document.getElementById("post-generated");

const cityPinDialog = document.getElementById("city-pin-dialog");
const cityPinForm = document.getElementById("city-pin-form");
const cityPinGenerated = document.getElementById("city-pin-generated");
let pendingCityPin = null; // { x, y } captured from the last map click

const ideaActionDialog = document.getElementById("idea-action-dialog");
const ideaActionForm = document.getElementById("idea-action-form");
let pendingIdeaAction = null; // { project, action } for the open idea-action dialog

function init() {
  state.tags = [...FEATURED_TAGS];
  loadDraftTags().forEach((t) => addTagToState(t, { persist: false }));

  state.projects = getAllProjects();
  loadDraftPosts().forEach((p) => state.draftPostIds.add(p.id));

  const params = new URLSearchParams(window.location.search);

  const queryTag = params.get("tag");
  if (queryTag) {
    const match = state.tags.find((t) => t.toLowerCase() === queryTag.toLowerCase());
    if (match) state.activeTags.add(match.toLowerCase());
  }

  renderTagList();
  renderProjects();
  renderTagMap();
  bindDialogs();

  const editId = params.get("edit");
  if (editId) {
    const project = state.projects.find((p) => String(p.id) === editId);
    if (project) openPostDialog(project);
  }
}

function tagExists(name) {
  const key = name.toLowerCase();
  return state.tags.some((t) => t.toLowerCase() === key);
}

function addTagToState(name, { persist = true } = {}) {
  const trimmed = (name || "").trim();
  if (!trimmed || tagExists(trimmed)) return false;

  state.tags.push(trimmed);
  state.draftTagKeys.add(trimmed.toLowerCase());

  if (persist) {
    const drafts = loadDraftTags();
    drafts.push(trimmed);
    saveDraftTags(drafts);
  }
  return true;
}

function removeDraftTag(name) {
  const key = name.toLowerCase();
  state.tags = state.tags.filter((t) => t.toLowerCase() !== key);
  state.draftTagKeys.delete(key);
  state.activeTags.delete(key);
  saveDraftTags(loadDraftTags().filter((t) => t.toLowerCase() !== key));
  renderTagList();
  renderProjects();
  renderTagMap();
}

function removeDraftPost(id) {
  removeDraftPostStorage(id);
  state.projects = state.projects.filter((p) => p.id !== id);
  state.draftPostIds.delete(id);
  renderProjects();
  renderTagMap();
}

function renderTagList() {
  tagListEl.innerHTML = "";

  const bioLink = document.getElementById("bio-nav-link");
  if (bioLink) {
    bioLink.classList.toggle("active", state.activeTags.has("bio"));
  }

  const allRow = document.createElement("div");
  allRow.className = "tag-row";
  const allBtn = makeTagButton("All Projects", state.activeTags.size === 0);
  allBtn.addEventListener("click", () => {
    state.activeTags.clear();
    state.activeSubtag = null;
    renderTagList();
    renderProjects();
    renderTagMap();
  });
  allRow.appendChild(allBtn);
  tagListEl.appendChild(allRow);

  state.tags.forEach((tag) => {
    const key = tag.toLowerCase();
    const row = document.createElement("div");
    row.className = "tag-row";

    const btn = makeTagButton(tag, state.activeTags.has(key));
    btn.addEventListener("click", () => {
      if (state.activeTags.has(key)) {
        state.activeTags.delete(key);
      } else {
        state.activeTags.add(key);
      }
      state.activeSubtag = null;
      renderTagList();
      renderProjects();
      renderTagMap();
    });
    row.appendChild(btn);

    if (state.draftTagKeys.has(key)) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "tag-remove";
      removeBtn.textContent = "×";
      removeBtn.title = "Remove draft tag";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeDraftTag(tag);
      });
      row.appendChild(removeBtn);
    }

    tagListEl.appendChild(row);
  });
}

function makeTagButton(label, active) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tag-btn" + (active ? " active" : "");
  btn.textContent = label;
  return btn;
}

function renderProjects() {
  const filtered = state.projects.filter((p) => {
    const categories = (p.categories || []).map((c) => c.toLowerCase());
    if (state.activeSubtag) return categories.includes(state.activeSubtag);
    if (state.activeTags.size === 0) return true;
    return categories.some((c) => state.activeTags.has(c));
  });

  gridEl.innerHTML = "";
  emptyStateEl.hidden = filtered.length !== 0;

  filtered.forEach((p) => {
    gridEl.appendChild(renderCard(p));
  });

  renderCategoryIntro();
}

function renderCategoryIntro() {
  if (!categoryIntroEl) return;

  if (state.activeTags.size !== 1) {
    categoryIntroEl.hidden = true;
    categoryIntroEl.innerHTML = "";
    return;
  }

  const activeKey = [...state.activeTags][0];
  const activeTag = state.tags.find((t) => t.toLowerCase() === activeKey);
  const introKey = Object.keys(TAG_INTROS || {}).find((k) => k.toLowerCase() === activeKey);
  const intro = introKey ? TAG_INTROS[introKey] : null;

  if (!intro || !activeTag) {
    categoryIntroEl.hidden = true;
    categoryIntroEl.innerHTML = "";
    return;
  }

  const subtags =
    (typeof TAG_SUBTAGS !== "undefined" &&
      (TAG_SUBTAGS[activeTag] || TAG_SUBTAGS[introKey])) ||
    null;

  const subtagsHtml =
    subtags && subtags.length
      ? `<div class="category-subtags">${subtags
          .map((s) => {
            const isActive = state.activeTags.has(s.toLowerCase());
            return `<span class="subtag-row"><button type="button" class="subtag-btn${isActive ? " active" : ""}" data-subtag="${escapeHtml(s)}">${escapeHtml(s)}</button></span>`;
          })
          .join("")}</div>`
      : "";

  categoryIntroEl.hidden = false;
  categoryIntroEl.innerHTML =
    `<h2 class="category-intro-title">${escapeHtml(activeTag)}</h2>` +
    subtagsHtml +
    `<div class="category-intro-text">${window.marked ? marked.parse(intro) : intro}</div>`;

  if (subtags && subtags.length) {
    categoryIntroEl.querySelectorAll(".subtag-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-subtag").toLowerCase();
        state.activeSubtag = state.activeSubtag === key ? null : key;
        renderProjects();
      });
    });
  }
}

function renderMedia(project) {
  const media = document.createElement("div");
  media.className = "project-media";

  const img = document.createElement("img");
  img.src = getImageSrc(project);
  img.alt = project.title;
  img.loading = "lazy";
  if (project.imagePosition) img.style.objectPosition = project.imagePosition;
  media.appendChild(img);

  const changeBtn = document.createElement("button");
  changeBtn.type = "button";
  changeBtn.className = "change-photo-btn";
  changeBtn.textContent = "Change photo";
  changeBtn.addEventListener("click", () => {
    openPhotoPicker("Choose a cover photo", (dataUrl) => {
      setImageOverride(project.id, dataUrl);
      renderProjects();
    });
  });
  media.appendChild(changeBtn);

  const overrides = loadImageOverrides();
  if (overrides[project.id]) {
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "reset-photo-btn";
    resetBtn.textContent = "Reset";
    resetBtn.title = "Remove your chosen photo and go back to the default";
    resetBtn.addEventListener("click", () => {
      clearImageOverride(project.id);
      renderProjects();
    });
    media.appendChild(resetBtn);
  }

  return media;
}

function isStealIdeaProject(project) {
  return (project.categories || []).some((c) => c.toLowerCase() === "steal this idea");
}

function renderIndexCard(project) {
  const card = document.createElement("div");
  card.className = "index-card";

  const title = document.createElement("div");
  title.className = "index-card-title";
  title.textContent = project.title;
  card.appendChild(title);

  const redLine = document.createElement("div");
  redLine.className = "index-card-red-line";
  card.appendChild(redLine);

  const body = document.createElement("div");
  body.className = "index-card-body";
  body.textContent = project.description || "";
  card.appendChild(body);

  return card;
}

const IDEA_ACTION_EMAIL = "ryanlibre@gmail.com";

function buildIdeaActionRow(project) {
  const row = document.createElement("div");
  row.className = "idea-action-row";

  const stealBtn = document.createElement("button");
  stealBtn.type = "button";
  stealBtn.className = "idea-action-btn steal";
  stealBtn.textContent = "Steal this idea";
  stealBtn.addEventListener("click", () => openIdeaActionDialog(project, "Steal this idea"));
  row.appendChild(stealBtn);

  const supportBtn = document.createElement("button");
  supportBtn.type = "button";
  supportBtn.className = "idea-action-btn support";
  supportBtn.textContent = "Support this idea";
  supportBtn.addEventListener("click", () => openIdeaActionDialog(project, "Support this idea"));
  row.appendChild(supportBtn);

  return row;
}

function buildStealSupportDetails(project) {
  const categories = (project.categories || []).map((c) => c.toLowerCase());
  const wrap = document.createElement("div");
  wrap.className = "steal-support-details";

  if (categories.includes("all projects to steal")) {
    const block = document.createElement("div");
    block.className = "steal-support-detail-block steal";
    block.innerHTML =
      `<h4>Steal details</h4><p>${escapeHtml(project.stealDetails || "Details coming soon — check back later.")}</p>`;
    wrap.appendChild(block);
  }

  if (categories.includes("all projects to support")) {
    const block = document.createElement("div");
    block.className = "steal-support-detail-block support";
    block.innerHTML =
      `<h4>Support details</h4><p>${escapeHtml(project.supportDetails || "Details coming soon — check back later.")}</p>`;
    wrap.appendChild(block);
  }

  return wrap.childElementCount ? wrap : null;
}

function renderCard(project) {
  const isDraft = state.draftPostIds.has(project.id);
  const isStealIdea = isStealIdeaProject(project);

  const card = document.createElement("article");
  card.className = "project-card";

  card.appendChild(isStealIdea ? renderIndexCard(project) : renderMedia(project));

  const titleRow = document.createElement("div");
  titleRow.className = "project-card-header";

  const title = document.createElement("h2");
  const titleLink = document.createElement("a");
  titleLink.href = "post.html?id=" + encodeURIComponent(project.id);
  titleLink.textContent = project.title;
  title.appendChild(titleLink);
  titleRow.appendChild(title);

  if (isDraft) {
    const badge = document.createElement("span");
    badge.className = "draft-badge";
    badge.textContent = "Draft";
    titleRow.appendChild(badge);
  }
  card.appendChild(titleRow);

  if (project.featured) {
    const badge = document.createElement("span");
    badge.className = "featured-badge featured-badge-corner";
    badge.textContent = "Featured";
    card.appendChild(badge);
  }

  if (project.date || project.location || project.place) {
    const meta = document.createElement("div");
    meta.className = "project-meta";
    meta.textContent = [formatPostDate(project.date), project.location, project.place].filter(Boolean).join(" · ");
    card.appendChild(meta);
  }

  if (project.categories && project.categories.length) {
    const tags = document.createElement("div");
    tags.className = "project-tags";
    project.categories.forEach((c) => {
      const tag = document.createElement("span");
      tag.className = "tag" + (c.toLowerCase() === "steal this idea" ? " tag-steal-idea" : "");
      tag.textContent = c;
      tags.appendChild(tag);
    });
    card.appendChild(tags);
  }

  if (isStealIdea) {
    card.appendChild(buildIdeaActionRow(project));
    const details = buildStealSupportDetails(project);
    if (details) card.appendChild(details);
  } else {
    const desc = document.createElement("div");
    desc.className = "project-description";
    desc.innerHTML = window.marked ? marked.parse(project.description || "") : (project.description || "");
    card.appendChild(desc);
  }

  const linkRow = document.createElement("div");
  linkRow.className = "card-link-row";

  const viewLink = document.createElement("a");
  viewLink.className = "view-post-link";
  viewLink.href = "post.html?id=" + encodeURIComponent(project.id);
  viewLink.textContent = "View post →";
  linkRow.appendChild(viewLink);

  const editLink = document.createElement("button");
  editLink.type = "button";
  editLink.className = "view-post-link";
  editLink.textContent = "Edit";
  editLink.addEventListener("click", () => openPostDialog(project));
  linkRow.appendChild(editLink);

  card.appendChild(linkRow);

  if (isDraft) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-text-remove";
    removeBtn.textContent = "Remove draft";
    removeBtn.addEventListener("click", () => removeDraftPost(project.id));
    card.appendChild(removeBtn);
  }

  return card;
}

function renderTagMap() {
  if (!tagMapEl) return;

  const tags = state.tags;
  const n = tags.length;
  if (n === 0) {
    tagMapEl.innerHTML = "";
    return;
  }

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

  state.projects.forEach((p) => {
    const cats = [...new Set((p.categories || []).map((c) => c.toLowerCase()))];
    cats.forEach((c) => postCounts.set(c, (postCounts.get(c) || 0) + 1));
    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const key = [cats[i], cats[j]].sort().join("|");
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
    }
  });

  const activeKeys = state.activeTags;

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

  tagMapEl.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" class="tag-map-svg" xmlns="http://www.w3.org/2000/svg">
      <g class="tag-map-edges">${edgeLines.join("")}</g>
      <g class="tag-map-nodes">${nodeEls.join("")}</g>
    </svg>`;

  tagMapEl.querySelectorAll(".tag-node").forEach((g) => {
    const key = g.getAttribute("data-tag").toLowerCase();
    const toggle = () => {
      if (state.activeTags.has(key)) {
        state.activeTags.delete(key);
      } else {
        state.activeTags.add(key);
      }
      state.activeSubtag = null;
      renderTagList();
      renderProjects();
      renderTagMap();
    };
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  renderLocationMap();
}

// Everything below this y (out of the 0-500 grid CITY_COORDS uses) is
// cropped out of the map image — keep in sync with the aspect-ratio set on
// .location-map-crop in css/style.css.
const MAP_VISIBLE_Y_MAX = 300;

const MAP_ZOOM_LEVELS = [25, 50, 75, 100];
// Display label per zoom level above — same order, purely cosmetic (the
// underlying scale math still uses the MAP_ZOOM_LEVELS numbers unchanged).
const MAP_ZOOM_LABELS = ["Full Map", "2X", "4X", "8X"];
// Where to auto-center the view when zoomed in past 25% — the Asia cluster
// is where pins overlap most, so that's the default focus point.
const MAP_ZOOM_FOCUS = { x: 820, y: 170 };

function renderMapZoomControls() {
  const el = document.getElementById("map-zoom-controls");
  if (!el) return;

  const zoomBtns = MAP_ZOOM_LEVELS.map(
    (z, i) => `<button type="button" class="map-zoom-btn${z === state.mapZoom ? " active" : ""}" data-zoom="${z}">${MAP_ZOOM_LABELS[i]}</button>`
  ).join("");
  const pinBtn = `<button type="button" id="pin-city-btn" class="map-zoom-btn${state.pinningCity ? " active" : ""}">${state.pinningCity ? "Click the map to pin…" : "+ Pin a city"}</button>`;

  el.innerHTML = zoomBtns + pinBtn;

  el.querySelectorAll(".map-zoom-btn[data-zoom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mapZoom = parseInt(btn.getAttribute("data-zoom"), 10);
      renderLocationMap();
    });
  });

  document.getElementById("pin-city-btn").addEventListener("click", () => {
    state.pinningCity = !state.pinningCity;
    renderLocationMap();
  });
}

function renderLocationMap() {
  const mapEl = document.getElementById("location-map");
  if (!mapEl) return;

  renderMapZoomControls();

  const counts = new Map(); // lowercase city -> { label, count }
  state.projects.forEach((p) => {
    const loc = (p.location || "").trim();
    if (!loc) return;
    const key = loc.toLowerCase();
    if (!counts.has(key)) counts.set(key, { label: loc, count: 0 });
    counts.get(key).count++;
  });

  const pins = [];
  const unmapped = [];
  counts.forEach(({ label, count }, key) => {
    const coord = getCityCoord(key);
    if (coord) {
      pins.push({ label, count, x: coord.x, y: coord.y });
    } else {
      unmapped.push(label);
    }
  });

  // CITY_COORDS is plotted on a 1000x500 grid — convert to percentages so
  // pins land in the same place regardless of the map image's own size.
  // The map is cropped to MAP_VISIBLE_Y_MAX (hides everything south of
  // Indonesia) via .location-map-crop's aspect-ratio, so top% is relative
  // to that visible slice, not the full 500 — this stays true at every
  // zoom level since the crop box scales as a whole.
  const pinEls = pins
    .map(({ label, count, x, y }) => {
      const size = 10 + Math.min(count * 4, 26);
      const left = (x / 1000) * 100;
      const top = (y / MAP_VISIBLE_Y_MAX) * 100;
      const label2 = escapeHtml(label);
      const titleText = `${label2} — ${count} post${count === 1 ? "" : "s"}`;
      return `
        <div class="location-pin" style="left:${left.toFixed(2)}%; top:${top.toFixed(2)}%;">
          <span class="location-pin-dot" style="width:${size}px; height:${size}px;" title="${titleText}"></span>
          <span class="location-pin-label">${label2}</span>
        </div>`;
    })
    .join("");

  const unmappedNote = unmapped.length
    ? `<p class="section-hint">Not shown on the map yet — add these to <code>data/city-coords.js</code>: ${unmapped.map(escapeHtml).join(", ")}</p>`
    : "";

  const localOverrides = loadCityCoordOverrides();
  const overrideKeys = Object.keys(localOverrides);
  const overridesNote = overrideKeys.length
    ? `<div class="section-hint">Local pins not yet published: ${overrideKeys
        .map((key) => {
          const label = escapeHtml(localOverrides[key].label || key);
          return `${label} <button type="button" class="city-pin-remove" data-city-key="${escapeHtml(key)}">remove</button>`;
        })
        .join(" · ")}</div>`
    : "";

  const scale = state.mapZoom / MAP_ZOOM_LEVELS[0];

  mapEl.innerHTML = `
    <div class="location-map-inner${state.pinningCity ? " pinning" : ""}">
      <div class="location-map-crop" style="width:${(scale * 100).toFixed(0)}%;">
        <img src="images/world-map.png" alt="World map" class="location-map-img">
        <div class="location-pins-overlay">${pinEls}</div>
      </div>
    </div>
    ${unmappedNote}
    ${overridesNote}`;

  mapEl.querySelectorAll(".city-pin-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeCityCoordOverride(btn.getAttribute("data-city-key"));
      renderLocationMap();
    });
  });

  const viewport = mapEl.querySelector(".location-map-inner");
  if (viewport && scale > 1) {
    requestAnimationFrame(() => {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      viewport.scrollLeft = Math.max(0, (MAP_ZOOM_FOCUS.x / 1000) * (vw * scale) - vw / 2);
      viewport.scrollTop = Math.max(0, (MAP_ZOOM_FOCUS.y / MAP_VISIBLE_Y_MAX) * (vh * scale) - vh / 2);
    });
  } else if (viewport) {
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  const crop = mapEl.querySelector(".location-map-crop");
  if (crop) {
    crop.addEventListener("click", (e) => {
      if (!state.pinningCity) return;
      const rect = crop.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * MAP_VISIBLE_Y_MAX);
      openCityPinDialog(x, y);
    });
  }

  renderTimeline();
}

const TIMELINE_START_YEAR = 2000;

function monthIndexOf(dateStr) {
  const m = /^(\d{4})-(\d{2})/.exec(dateStr || "");
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  return (year - TIMELINE_START_YEAR) * 12 + (month - 1);
}

// Timeline dots are colored by the first of these tags a post has (in this
// order); posts with none of them fall back to TIMELINE_OTHER_COLOR.
const TIMELINE_TAG_COLORS = [
  ["Exhibitions", "#ef4444"],
  ["Curation", "#f97316"],
  ["Design", "#eab308"],
  ["Photography", "#22c55e"],
  ["Film", "#14b8a6"],
  ["Workshops", "#3b82f6"],
  ["Production", "#8b5cf6"],
  ["Studios", "#ec4899"],
  ["CV", "#06b6d4"],
  ["Screenings", "#a3e635"],
  ["Talks", "#f43f5e"],
];
const TIMELINE_OTHER_COLOR = "#9aa2b1";

function colorForProject(project) {
  const categories = (project.categories || []).map((c) => c.toLowerCase());
  for (const [tag, color] of TIMELINE_TAG_COLORS) {
    if (categories.includes(tag.toLowerCase())) return color;
  }
  return TIMELINE_OTHER_COLOR;
}

function renderTimelineLegend() {
  const el = document.getElementById("timeline-legend");
  if (!el) return;

  const items = TIMELINE_TAG_COLORS.map(
    ([tag, color]) =>
      `<span class="timeline-legend-item"><span class="timeline-legend-swatch" style="background:${color}"></span>${escapeHtml(tag)}</span>`
  );
  items.push(
    `<span class="timeline-legend-item"><span class="timeline-legend-swatch" style="background:${TIMELINE_OTHER_COLOR}"></span>Other</span>`
  );
  el.innerHTML = items.join("");
}

function renderTimeline() {
  const el = document.getElementById("timeline");
  if (!el) return;

  renderTimelineLegend();

  const now = new Date();
  const nowIndex = (now.getFullYear() - TIMELINE_START_YEAR) * 12 + now.getMonth();

  const points = [];
  let maxIndex = nowIndex;
  state.projects.forEach((project) => {
    const idx = monthIndexOf(project.date);
    if (idx === null) return;
    if (idx > maxIndex) maxIndex = idx;
    points.push({ project, idx });
  });

  const totalMonths = Math.max(maxIndex + 3, 12);
  const totalYears = Math.ceil(totalMonths / 12);

  const byMonth = new Map();
  points.forEach((pt) => {
    if (!byMonth.has(pt.idx)) byMonth.set(pt.idx, []);
    byMonth.get(pt.idx).push(pt.project);
  });

  let maxStack = 1;
  byMonth.forEach((arr) => {
    if (arr.length > maxStack) maxStack = arr.length;
  });

  const pxPerYear = 50;
  const marginLeft = 24;
  const marginRight = 40;
  const width = Math.max(700, totalYears * pxPerYear + marginLeft + marginRight);
  const height = 70 + maxStack * 18;
  const lineY = height - 34;
  const usableWidth = width - marginLeft - marginRight;

  function xForMonth(idx) {
    return marginLeft + (idx / totalMonths) * usableWidth;
  }

  const tickEvery = totalYears > 20 ? 5 : totalYears > 10 ? 2 : 1;
  const ticks = [];
  for (let y = TIMELINE_START_YEAR; y <= TIMELINE_START_YEAR + totalYears; y += tickEvery) {
    const x = xForMonth((y - TIMELINE_START_YEAR) * 12);
    ticks.push(`<line x1="${x.toFixed(1)}" y1="${lineY - 6}" x2="${x.toFixed(1)}" y2="${lineY + 6}" class="timeline-tick"></line>`);
    ticks.push(`<text x="${x.toFixed(1)}" y="${lineY + 22}" text-anchor="middle" class="timeline-tick-label">${y}</text>`);
  }

  const dots = [];
  byMonth.forEach((projects, idx) => {
    const x = xForMonth(idx).toFixed(1);
    projects.forEach((project, i) => {
      const y = lineY - 14 - i * 16;
      const label = escapeHtml(project.title);
      const color = colorForProject(project);
      dots.push(`
        <a href="post.html?id=${encodeURIComponent(project.id)}" class="timeline-dot-link">
          <circle cx="${x}" cy="${y}" r="5" class="timeline-dot" style="--dot-color:${color}"><title>${label} — ${escapeHtml(formatPostDate(project.date))}</title></circle>
        </a>`);
    });
  });

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="timeline-svg" xmlns="http://www.w3.org/2000/svg">
      <line x1="${marginLeft}" y1="${lineY}" x2="${width - marginRight}" y2="${lineY}" class="timeline-axis"></line>
      ${ticks.join("")}
      ${dots.join("")}
    </svg>`;
}

function renderTagChecklist(container, selectedKeys) {
  container.innerHTML = "";
  state.tags.forEach((tag) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tag;
    checkbox.checked = selectedKeys.has(tag.toLowerCase());
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(tag));
    container.appendChild(label);
  });
  updateStealSupportSectionVisibility();
}

function updateStealSupportSectionVisibility() {
  const checklist = document.getElementById("post-tag-checklist");
  const section = document.getElementById("post-steal-support-section");
  if (!checklist || !section) return;
  const stealIdeaChecked = [...checklist.querySelectorAll("input[type=checkbox]")].some(
    (cb) => cb.value.toLowerCase() === "steal this idea" && cb.checked
  );
  section.hidden = !stealIdeaChecked;
}

function getCheckedTags(container) {
  return [...container.querySelectorAll("input[type=checkbox]:checked")].map((cb) => cb.value);
}

// Opens the post dialog. Pass a project to edit it in place; pass nothing to
// create a new post.
function openPostDialog(project) {
  postForm.reset();
  postGenerated.hidden = true;
  editingProjectId = project ? project.id : null;

  document.getElementById("post-dialog-title").textContent = project ? "Edit post" : "New post";
  document.getElementById("post-submit-btn").textContent = project ? "Save changes" : "Add post";

  document.getElementById("post-title").value = project ? project.title || "" : "";
  document.getElementById("post-date").value = project
    ? project.date || ""
    : new Date().toISOString().slice(0, 10);
  document.getElementById("post-link").value = project ? project.link || "" : "";
  document.getElementById("post-location").value = project ? project.location || "" : "";
  document.getElementById("post-place").value = project ? project.place || "" : "";
  document.getElementById("post-description").value = project ? project.description || "" : "";
  document.getElementById("post-tags-other").value = "";
  document.getElementById("post-featured").checked = project ? !!project.featured : false;

  const selected = new Set((project ? project.categories || [] : []).map((c) => c.toLowerCase()));
  renderTagChecklist(document.getElementById("post-tag-checklist"), selected);

  document.getElementById("post-tag-steal").checked = selected.has("all projects to steal");
  document.getElementById("post-tag-support").checked = selected.has("all projects to support");
  document.getElementById("post-steal-details").value = project ? project.stealDetails || "" : "";
  document.getElementById("post-support-details").value = project ? project.supportDetails || "" : "";
  updateStealSupportSectionVisibility();

  postDialog.showModal();
}

function openCityPinDialog(x, y) {
  pendingCityPin = { x, y };
  cityPinForm.reset();
  cityPinGenerated.hidden = true;
  cityPinDialog.showModal();
}

function openIdeaActionDialog(project, action) {
  pendingIdeaAction = { project, action };
  ideaActionForm.reset();
  document.getElementById("idea-action-title").textContent = action;
  document.getElementById("idea-action-hint").textContent = `Re: "${project.title}" — this opens your email app with a message to Rye.`;
  ideaActionDialog.showModal();
}

function bindDialogs() {
  document.getElementById("add-tag-btn").addEventListener("click", () => {
    tagForm.reset();
    tagGenerated.hidden = true;
    tagDialog.showModal();
  });

  document.getElementById("add-post-btn").addEventListener("click", () => {
    openPostDialog(null);
  });

  document.getElementById("post-tag-checklist").addEventListener("change", updateStealSupportSectionVisibility);

  document.getElementById("export-drafts-btn").addEventListener("click", () => {
    exportDrafts();
  });

  document.getElementById("media-pool-btn").addEventListener("click", () => {
    openPhotoPicker("Media pool", null);
  });

  bindPhotoPickerUpload();

  const bioLink = document.getElementById("bio-nav-link");
  if (bioLink) {
    bioLink.addEventListener("click", (e) => {
      e.preventDefault();
      const match = state.tags.find((t) => t.toLowerCase() === "bio");
      if (!match) return;
      const key = match.toLowerCase();
      if (state.activeTags.has(key)) {
        state.activeTags.delete(key);
      } else {
        state.activeTags.add(key);
      }
      state.activeSubtag = null;
      renderTagList();
      renderProjects();
      renderTagMap();
    });
  }

  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  });

  cityPinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!pendingCityPin) return;
    const name = document.getElementById("city-pin-name").value.trim();
    if (!name) return;

    setCityCoordOverride(name, pendingCityPin.x, pendingCityPin.y);

    const textarea = cityPinGenerated.querySelector("textarea");
    textarea.value = `  "${name.toLowerCase()}": { x: ${pendingCityPin.x}, y: ${pendingCityPin.y} },`;
    cityPinGenerated.hidden = false;
    textarea.focus();
    textarea.select();

    renderLocationMap();
  });

  ideaActionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!pendingIdeaAction) return;
    const { project, action } = pendingIdeaAction;

    const name = document.getElementById("idea-action-name").value.trim();
    const email = document.getElementById("idea-action-email").value.trim();
    const message = document.getElementById("idea-action-message").value.trim();

    const subject = encodeURIComponent(`${action}: ${project.title}`);
    const bodyLines = [
      `${action} — "${project.title}"`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:${IDEA_ACTION_EMAIL}?subject=${subject}&body=${body}`;
    ideaActionDialog.close();
  });

  tagForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const added = addTagToState(document.getElementById("tag-name").value);
    if (!added) return;
    renderTagList();
    renderProjects();
    renderTagMap();
    showGeneratedTags();
  });

  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("post-title").value.trim();
    if (!title) return;

    const checked = getCheckedTags(document.getElementById("post-tag-checklist"));
    const otherTags = document
      .getElementById("post-tags-other")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const categories = [...checked, ...otherTags];
    if (document.getElementById("post-tag-steal").checked) categories.push("All Projects to Steal");
    if (document.getElementById("post-tag-support").checked) categories.push("All Projects to Support");
    const dedupedCategories = [...new Set(categories)];

    const fields = {
      title,
      categories: dedupedCategories,
      date: document.getElementById("post-date").value || new Date().toISOString().slice(0, 10),
      description: document.getElementById("post-description").value.trim(),
      link: document.getElementById("post-link").value.trim(),
      location: document.getElementById("post-location").value.trim(),
      place: document.getElementById("post-place").value.trim(),
      featured: document.getElementById("post-featured").checked,
      stealDetails: document.getElementById("post-steal-details").value.trim(),
      supportDetails: document.getElementById("post-support-details").value.trim(),
    };

    categories.forEach((c) => addTagToState(c));

    if (editingProjectId) {
      updatePost(editingProjectId, fields);
      const updated = { ...state.projects.find((p) => p.id === editingProjectId), ...fields };
      state.projects = state.projects.map((p) => (p.id === editingProjectId ? updated : p));
      state.projects.sort(compareProjects);

      renderTagList();
      renderProjects();
      renderTagMap();
      showGeneratedEdit(updated);
    } else {
      const post = { id: Date.now(), image: "", images: [], ...fields };

      const drafts = loadDraftPosts();
      drafts.push(post);
      saveDraftPosts(drafts);

      state.projects.push(post);
      state.draftPostIds.add(post.id);
      state.projects.sort(compareProjects);

      renderTagList();
      renderProjects();
      renderTagMap();
      showGeneratedPost(post);
    }
  });
}

function showGeneratedTags() {
  const textarea = tagGenerated.querySelector("textarea");
  textarea.value = JSON.stringify(state.tags);
  tagGenerated.hidden = false;
  textarea.focus();
  textarea.select();
}

function showGeneratedPost(post) {
  document.getElementById("post-generated-hint").innerHTML =
    "Paste this into the <code>PROJECTS</code> array in <code>data/projects.js</code> to make it permanent for everyone:";
  const textarea = postGenerated.querySelector("textarea");
  textarea.hidden = false;
  const snippet = {
    id: post.id,
    title: post.title,
    categories: post.categories,
    date: post.date,
    description: post.description,
    link: post.link,
    image: "",
    images: [],
    location: post.location || "",
    place: post.place || "",
    featured: !!post.featured,
  };
  if (post.stealDetails) snippet.stealDetails = post.stealDetails;
  if (post.supportDetails) snippet.supportDetails = post.supportDetails;
  const lines = JSON.stringify(snippet, null, 2).split("\n");
  textarea.value = "  " + lines.join("\n  ") + ",";
  postGenerated.hidden = false;
  textarea.focus();
  textarea.select();
}

function showGeneratedEdit(project) {
  const hintEl = document.getElementById("post-generated-hint");
  const textarea = postGenerated.querySelector("textarea");

  if (state.draftPostIds.has(project.id)) {
    hintEl.textContent =
      'Saved — this draft post is updated. Use "Export my drafts & photos" whenever you\'re ready to publish everything.';
    textarea.hidden = true;
    postGenerated.hidden = false;
    return;
  }

  hintEl.innerHTML = `Paste this over the existing "<code>${escapeHtml(project.id)}</code>" entry in <code>data/projects.js</code> to make the edit permanent:`;
  textarea.hidden = false;
  const snippet = {
    id: project.id,
    title: project.title,
    categories: project.categories,
    date: project.date,
    description: project.description,
    link: project.link,
    image: project.image || "",
    images: project.images || [],
    location: project.location || "",
    place: project.place || "",
    featured: !!project.featured,
  };
  if (project.stealDetails) snippet.stealDetails = project.stealDetails;
  if (project.supportDetails) snippet.supportDetails = project.supportDetails;
  const lines = JSON.stringify(snippet, null, 2).split("\n");
  textarea.value = "  " + lines.join("\n  ") + ",";
  postGenerated.hidden = false;
  textarea.focus();
  textarea.select();
}

init();
