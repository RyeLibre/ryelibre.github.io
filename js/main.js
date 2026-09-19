// Data/image helpers (loadDraftTags, getImageSrc, etc.) live in js/shared.js,
// shared with post.html. Use the generated code snippet shown after adding a
// post or tag to paste it into data/projects.js or data/tags.js to publish it.

const state = {
  projects: [],
  tags: [],
  draftTagKeys: new Set(), // lowercase tag names added as drafts
  draftPostIds: new Set(),
  activeTags: new Set(), // lowercase tag names currently filtering
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
    if (state.activeTags.size === 0) return true;
    const categories = (p.categories || []).map((c) => c.toLowerCase());
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

  categoryIntroEl.hidden = false;
  categoryIntroEl.innerHTML =
    `<h2 class="category-intro-title">${escapeHtml(activeTag)}</h2>` +
    `<div class="category-intro-text">${window.marked ? marked.parse(intro) : intro}</div>`;
}

function renderMedia(project) {
  const media = document.createElement("div");
  media.className = "project-media";

  const img = document.createElement("img");
  img.src = getImageSrc(project);
  img.alt = project.title;
  img.loading = "lazy";
  media.appendChild(img);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.hidden = true;
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    resizeImageForWeb(file)
      .then((dataUrl) => {
        setImageOverride(project.id, dataUrl);
        renderProjects();
      })
      .catch((err) => alert(err.message || "Couldn't process that image."));
  });
  media.appendChild(fileInput);

  const changeBtn = document.createElement("button");
  changeBtn.type = "button";
  changeBtn.className = "change-photo-btn";
  changeBtn.textContent = "Change photo";
  changeBtn.addEventListener("click", () => fileInput.click());
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

function renderCard(project) {
  const isDraft = state.draftPostIds.has(project.id);

  const card = document.createElement("article");
  card.className = "project-card";

  card.appendChild(renderMedia(project));

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

  if (project.date || project.location) {
    const meta = document.createElement("div");
    meta.className = "project-meta";
    meta.textContent = [project.date, project.location].filter(Boolean).join(" · ");
    card.appendChild(meta);
  }

  if (project.categories && project.categories.length) {
    const tags = document.createElement("div");
    tags.className = "project-tags";
    project.categories.forEach((c) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = c;
      tags.appendChild(tag);
    });
    card.appendChild(tags);
  }

  const desc = document.createElement("div");
  desc.className = "project-description";
  desc.innerHTML = window.marked ? marked.parse(project.description || "") : (project.description || "");
  card.appendChild(desc);

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

// Rough continent silhouettes for a 1000x500 map — stylized, not surveyed.
const CONTINENT_SHAPES = [
  "90,70 150,55 210,60 250,80 275,110 280,150 260,190 230,220 200,235 175,225 150,195 120,165 100,130 85,100",
  "190,235 230,235 260,260 275,300 270,340 250,380 220,410 195,415 175,390 165,350 170,300 175,260",
  "470,70 520,60 560,70 585,90 590,115 570,135 540,145 505,140 480,125 465,100",
  "480,150 540,150 580,165 605,200 615,250 605,300 590,340 560,380 530,395 505,370 490,330 480,280 475,220 478,180",
  "590,65 650,55 720,55 780,60 830,70 880,90 920,120 930,150 910,180 880,200 850,220 820,240 800,260 780,270 750,260 720,240 700,220 680,200 650,180 620,150 600,120 590,90",
  "800,320 850,315 890,325 910,345 900,370 870,385 835,385 805,370 795,345",
];

function renderLocationMap() {
  const mapEl = document.getElementById("location-map");
  if (!mapEl) return;

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
    const coord = (typeof CITY_COORDS !== "undefined" && CITY_COORDS[key]) || null;
    if (coord) {
      pins.push({ label, count, x: coord.x, y: coord.y });
    } else {
      unmapped.push(label);
    }
  });

  const continents = CONTINENT_SHAPES.map((points) => `<polygon class="continent-shape" points="${points}"></polygon>`).join("");

  const graticuleLines = [];
  for (let x = 0; x <= 1000; x += 100) {
    graticuleLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="500" class="graticule-line"></line>`);
  }
  for (let y = 0; y <= 500; y += 100) {
    graticuleLines.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}" class="graticule-line"></line>`);
  }

  const pinEls = pins
    .map(({ label, count, x, y }) => {
      const r = 5 + Math.min(count * 2.5, 14);
      const label2 = escapeHtml(label);
      return `
        <g class="location-pin">
          <circle cx="${x}" cy="${y}" r="${r}"><title>${label2} — ${count} post${count === 1 ? "" : "s"}</title></circle>
          <text x="${x}" y="${y - r - 6}" text-anchor="middle">${label2}</text>
        </g>`;
    })
    .join("");

  const unmappedNote = unmapped.length
    ? `<p class="section-hint">Not shown on the map yet — add these to <code>data/city-coords.js</code>: ${unmapped.map(escapeHtml).join(", ")}</p>`
    : "";

  mapEl.innerHTML = `
    <svg viewBox="0 0 1000 500" class="location-map-svg" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="999" height="499" class="map-frame"></rect>
      <g class="graticule">${graticuleLines.join("")}</g>
      <g class="continents">${continents}</g>
      <g class="location-pins">${pinEls}</g>
    </svg>
    ${unmappedNote}`;

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

function renderTimeline() {
  const el = document.getElementById("timeline");
  if (!el) return;

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
      dots.push(`
        <a href="post.html?id=${encodeURIComponent(project.id)}" class="timeline-dot-link">
          <circle cx="${x}" cy="${y}" r="5" class="timeline-dot"><title>${label} — ${escapeHtml(project.date)}</title></circle>
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
  document.getElementById("post-description").value = project ? project.description || "" : "";
  document.getElementById("post-tags-other").value = "";

  const selected = new Set((project ? project.categories || [] : []).map((c) => c.toLowerCase()));
  renderTagChecklist(document.getElementById("post-tag-checklist"), selected);

  postDialog.showModal();
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

  document.getElementById("export-drafts-btn").addEventListener("click", () => {
    exportDrafts();
  });

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
      renderTagList();
      renderProjects();
      renderTagMap();
    });
  }

  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
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
    const categories = [...new Set([...checked, ...otherTags])];

    const fields = {
      title,
      categories,
      date: document.getElementById("post-date").value || new Date().toISOString().slice(0, 10),
      description: document.getElementById("post-description").value.trim(),
      link: document.getElementById("post-link").value.trim(),
      location: document.getElementById("post-location").value.trim(),
    };

    categories.forEach((c) => addTagToState(c));

    if (editingProjectId) {
      updatePost(editingProjectId, fields);
      const updated = { ...state.projects.find((p) => p.id === editingProjectId), ...fields };
      state.projects = state.projects.map((p) => (p.id === editingProjectId ? updated : p));
      state.projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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
      state.projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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
  };
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
  };
  const lines = JSON.stringify(snippet, null, 2).split("\n");
  textarea.value = "  " + lines.join("\n  ") + ",";
  postGenerated.hidden = false;
  textarea.focus();
  textarea.select();
}

init();
