function getQueryId() {
  return new URLSearchParams(window.location.search).get("id") || "";
}

function findProject(id) {
  return getAllProjects().find((p) => String(p.id) === String(id));
}

function buildTagChip(tag) {
  const a = document.createElement("a");
  a.className = "tag tag-link";
  a.href = "index.html?tag=" + encodeURIComponent(tag);
  a.textContent = tag;
  return a;
}

function buildCoverMedia(project) {
  const media = document.createElement("div");
  media.className = "project-media post-cover";

  const img = document.createElement("img");
  img.id = "post-cover-img";
  img.src = getImageSrc(project);
  img.alt = project.title;
  if (project.imagePosition) img.style.objectPosition = project.imagePosition;
  media.appendChild(img);

  const changeBtn = document.createElement("button");
  changeBtn.type = "button";
  changeBtn.className = "change-photo-btn";
  changeBtn.textContent = "Change cover photo";
  changeBtn.addEventListener("click", () => {
    openPhotoPicker("Choose a cover photo", (dataUrl) => {
      setImageOverride(project.id, dataUrl);
      renderPost();
    });
  });
  media.appendChild(changeBtn);

  return media;
}

function showInCover(fig, src) {
  const img = document.getElementById("post-cover-img");
  if (!img) return;
  img.src = src;
  img.style.objectPosition = "";
  document.querySelectorAll(".gallery-item-selectable.active-in-cover").forEach((el) => {
    el.classList.remove("active-in-cover");
  });
  fig.classList.add("active-in-cover");
  img.scrollIntoView({ behavior: "smooth", block: "center" });
}

let flashOverlay = null;
let flashTimer = null;
const FLASH_DURATION_MS = 1750; // 2500ms, reduced 30%

let flashItems = []; // [{ type: "image", src, alt } | { type: "text", content }]
let flashIndex = -1;

function ensureFlashOverlay() {
  if (flashOverlay) return flashOverlay;
  flashOverlay = document.createElement("div");
  flashOverlay.className = "flash-overlay";

  const img = document.createElement("img");
  flashOverlay.appendChild(img);

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "flash-nav flash-nav-prev";
  prevBtn.textContent = "‹";
  prevBtn.setAttribute("aria-label", "Previous");
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showFlashAt(flashIndex - 1);
  });
  flashOverlay.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "flash-nav flash-nav-next";
  nextBtn.textContent = "›";
  nextBtn.setAttribute("aria-label", "Next");
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showFlashAt(flashIndex + 1);
  });
  flashOverlay.appendChild(nextBtn);

  flashOverlay.addEventListener("click", hideFlash);
  document.body.appendChild(flashOverlay);
  return flashOverlay;
}

function hideFlash() {
  if (!flashOverlay) return;
  flashOverlay.classList.remove("visible");
  if (flashTimer) {
    clearTimeout(flashTimer);
    flashTimer = null;
  }
}

function showFlashAt(index) {
  if (flashItems.length === 0) return;
  flashIndex = (index + flashItems.length) % flashItems.length;
  const item = flashItems[flashIndex];

  const overlay = ensureFlashOverlay();
  overlay.classList.toggle("flash-overlay-text", item.type === "text");

  const img = overlay.querySelector("img");
  if (item.type === "image") {
    img.src = item.src;
    img.alt = item.alt || "";
  } else {
    img.src = "";
  }

  let textEl = overlay.querySelector(".flash-overlay-text-content");
  if (!textEl) {
    textEl = document.createElement("div");
    textEl.className = "flash-overlay-text-content";
    overlay.appendChild(textEl);
  }
  textEl.innerHTML = item.type === "text" ? (window.marked ? marked.parse(item.content || "") : item.content || "") : "";

  overlay.classList.toggle("flash-nav-hidden", flashItems.length < 2);
  overlay.classList.add("visible");
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(hideFlash, FLASH_DURATION_MS);
}

function buildGallery(project) {
  const dataImages = project.images || [];
  const overrides = loadGalleryOverrides()[project.id] || [];
  const isFlash = !!project.gallerySlideshow;

  const section = document.createElement("section");
  section.className = "post-gallery";

  if (dataImages.length === 0 && overrides.length === 0) {
    const hint = document.createElement("p");
    hint.className = "section-hint";
    hint.textContent =
      "No extra photos yet — add one below, or add paths to this post's \"images\" array in data/projects.js.";
    section.appendChild(hint);
  }

  const grid = document.createElement("div");
  grid.className = isFlash ? "gallery-grid gallery-grid-flash" : "gallery-grid";

  if (isFlash) {
    flashItems = [];
    if (project.description) {
      flashItems.push({ type: "text", content: project.description });
    }
    dataImages.forEach((src) => flashItems.push({ type: "image", src, alt: project.title }));
    overrides.forEach((src) => flashItems.push({ type: "image", src, alt: project.title }));
  }

  if (isFlash && project.description) {
    const introFig = document.createElement("figure");
    introFig.className = "gallery-item gallery-item-intro";
    introFig.textContent = "Intro";
    introFig.title = "View description";
    introFig.addEventListener("click", () => showFlashAt(0));
    grid.appendChild(introFig);
  }

  const introOffset = isFlash && project.description ? 1 : 0;

  dataImages.forEach((src, i) => {
    const fig = document.createElement("figure");
    fig.className = "gallery-item gallery-item-selectable";
    const img = document.createElement("img");
    img.src = src;
    img.alt = project.title;
    img.loading = "lazy";
    if (isFlash) {
      img.title = "View full screen";
      img.addEventListener("click", () => showFlashAt(introOffset + i));
    } else {
      img.title = "Show this photo as the cover";
      img.addEventListener("click", () => showInCover(fig, src));
    }
    fig.appendChild(img);
    grid.appendChild(fig);
  });

  overrides.forEach((src, index) => {
    const fig = document.createElement("figure");
    fig.className = "gallery-item gallery-item-selectable";

    const img = document.createElement("img");
    img.src = src;
    img.alt = project.title;
    img.loading = "lazy";
    if (isFlash) {
      img.title = "View full screen";
      img.addEventListener("click", () => showFlashAt(introOffset + dataImages.length + index));
    } else {
      img.title = "Show this photo as the cover";
      img.addEventListener("click", () => showInCover(fig, src));
    }
    fig.appendChild(img);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "reset-photo-btn gallery-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      removeGalleryImage(project.id, index);
      renderPost();
    });
    fig.appendChild(removeBtn);

    grid.appendChild(fig);
  });

  section.appendChild(grid);

  const addWrap = document.createElement("div");
  addWrap.className = "gallery-add";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-btn";
  addBtn.textContent = "+ Add photo to gallery";
  addBtn.addEventListener("click", () => {
    openPhotoPicker("Choose a photo for the gallery", (dataUrl) => {
      addGalleryImage(project.id, dataUrl);
      renderPost();
    });
  });
  addWrap.appendChild(addBtn);

  section.appendChild(addWrap);

  return section;
}

function renderNotFound(container) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "post-not-found";

  const h2 = document.createElement("h2");
  h2.textContent = "Post not found";
  wrap.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = "This post may have been removed, or the link is missing an id.";
  wrap.appendChild(p);

  const back = document.createElement("a");
  back.href = "index.html";
  back.textContent = "← Back to all posts";
  wrap.appendChild(back);

  container.appendChild(wrap);
}

function renderPost() {
  const container = document.getElementById("post-page");
  container.innerHTML = "";

  const id = getQueryId();
  const project = findProject(id);

  if (!project) {
    renderNotFound(container);
    return;
  }

  document.title = project.title + " — Rye Libre";

  const isDraft = isDraftPostId(project.id);

  const headerRow = document.createElement("div");
  headerRow.className = "project-card-header post-header-row";

  const title = document.createElement("h1");
  title.className = "post-title";
  title.textContent = project.title;
  headerRow.appendChild(title);

  if (project.featured) {
    const badge = document.createElement("span");
    badge.className = "featured-badge";
    badge.textContent = "Featured";
    headerRow.appendChild(badge);
  }

  if (isDraft) {
    const badge = document.createElement("span");
    badge.className = "draft-badge";
    badge.textContent = "Draft";
    headerRow.appendChild(badge);
  }
  container.appendChild(headerRow);

  if (!project.gallerySlideshow) {
    if (project.date || project.location || project.place) {
      const meta = document.createElement("div");
      meta.className = "project-meta";
      meta.textContent = [formatPostDate(project.date), project.location, project.place].filter(Boolean).join(" · ");
      container.appendChild(meta);
    }

    if (project.categories && project.categories.length) {
      const tags = document.createElement("div");
      tags.className = "project-tags";
      project.categories.forEach((c) => tags.appendChild(buildTagChip(c)));
      container.appendChild(tags);
    }
  }

  const editLink = document.createElement("a");
  editLink.className = "view-post-link"; // shares link styling, not an "add" affordance
  editLink.href = "index.html?edit=" + encodeURIComponent(project.id);
  editLink.textContent = "Edit this post";
  container.appendChild(editLink);

  if (!project.gallerySlideshow) {
    container.appendChild(buildCoverMedia(project));

    if (project.link) {
      const linkPara = document.createElement("p");
      const a = document.createElement("a");
      a.href = project.link;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "post-external-link";
      a.textContent = "Visit external link →";
      linkPara.appendChild(a);
      container.appendChild(linkPara);
    }

    const desc = document.createElement("div");
    desc.className = "project-description post-description";
    desc.innerHTML = window.marked ? marked.parse(project.description || "") : (project.description || "");
    container.appendChild(desc);
  }

  container.appendChild(buildGallery(project));

  if (isDraft) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-text-remove";
    removeBtn.textContent = "Remove this draft post";
    removeBtn.addEventListener("click", () => {
      removeDraftPostStorage(project.id);
      window.location.href = "index.html";
    });
    container.appendChild(removeBtn);
  }
}

function renderPostTagMap() {
  const tagMapEl = document.getElementById("tag-map");
  if (!tagMapEl) return;

  const tags = [...FEATURED_TAGS];
  const projects = getAllProjects();
  tagMapEl.innerHTML = buildTagMapSvgMarkup(tags, projects, new Set());

  tagMapEl.querySelectorAll(".tag-node").forEach((g) => {
    const tag = g.getAttribute("data-tag");
    const go = () => {
      window.location.href = "index.html?tag=" + encodeURIComponent(tag);
    };
    g.addEventListener("click", go);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });
}

renderPost();
renderPostTagMap();
bindPhotoPickerUpload();
bindDialogCloseButtons();
