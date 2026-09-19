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

  const draftPosts = loadDraftPosts();
  state.projects = [...PROJECTS, ...draftPosts];
  draftPosts.forEach((p) => state.draftPostIds.add(p.id));
  state.projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const queryTag = new URLSearchParams(window.location.search).get("tag");
  if (queryTag) {
    const match = state.tags.find((t) => t.toLowerCase() === queryTag.toLowerCase());
    if (match) state.activeTags.add(match.toLowerCase());
  }

  renderTagList();
  renderProjects();
  renderTagMap();
  bindDialogs();
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

  const allBtn = makeTagButton("All Posts", state.activeTags.size === 0);
  allBtn.addEventListener("click", () => {
    state.activeTags.clear();
    renderTagList();
    renderProjects();
    renderTagMap();
  });
  tagListEl.appendChild(allBtn);

  state.tags.forEach((tag) => {
    const key = tag.toLowerCase();
    const row = document.createElement("div");
    row.className = "tag-row";

    const btn = makeTagButton("#" + tag, state.activeTags.has(key));
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
    `<h2 class="category-intro-title">#${escapeHtml(activeTag)}</h2>` +
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

  if (project.date) {
    const meta = document.createElement("div");
    meta.className = "project-meta";
    meta.textContent = project.date;
    card.appendChild(meta);
  }

  if (project.categories && project.categories.length) {
    const tags = document.createElement("div");
    tags.className = "project-tags";
    project.categories.forEach((c) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "#" + c;
      tags.appendChild(tag);
    });
    card.appendChild(tags);
  }

  const desc = document.createElement("div");
  desc.className = "project-description";
  desc.innerHTML = window.marked ? marked.parse(project.description || "") : (project.description || "");
  card.appendChild(desc);

  const viewLink = document.createElement("a");
  viewLink.className = "view-post-link";
  viewLink.href = "post.html?id=" + encodeURIComponent(project.id);
  viewLink.textContent = "View post →";
  card.appendChild(viewLink);

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
}

function bindDialogs() {
  document.getElementById("add-tag-btn").addEventListener("click", () => {
    tagForm.reset();
    tagGenerated.hidden = true;
    tagDialog.showModal();
  });

  document.getElementById("add-post-btn").addEventListener("click", () => {
    postForm.reset();
    document.getElementById("post-date").value = new Date().toISOString().slice(0, 10);
    postGenerated.hidden = true;
    postDialog.showModal();
  });

  document.getElementById("export-drafts-btn").addEventListener("click", () => {
    exportDrafts();
  });

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

    const categories = document
      .getElementById("post-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const post = {
      id: Date.now(),
      title,
      categories,
      date: document.getElementById("post-date").value || new Date().toISOString().slice(0, 10),
      description: document.getElementById("post-description").value.trim(),
      link: document.getElementById("post-link").value.trim(),
      image: "",
    };

    categories.forEach((c) => addTagToState(c));

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
  const textarea = postGenerated.querySelector("textarea");
  const snippet = {
    id: post.id,
    title: post.title,
    categories: post.categories,
    date: post.date,
    description: post.description,
    link: post.link,
    image: "",
  };
  const lines = JSON.stringify(snippet, null, 2).split("\n");
  textarea.value = "  " + lines.join("\n  ") + ",";
  postGenerated.hidden = false;
  textarea.focus();
  textarea.select();
}

init();
