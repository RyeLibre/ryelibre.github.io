// Owner-only: publish a post's photo changes (new photos, removals, new order)
// straight from the page by committing to the GitHub repo through the GitHub API.
// Needs a GitHub access token pasted once into "Publishing setup"; the token is
// kept only in this browser (localStorage) and is sent only to api.github.com.
(function () {
  const TOKEN_KEY = "portfolio.ghToken";
  const REPO_KEY = "portfolio.ghRepo";
  const BRANCH_KEY = "portfolio.ghBranch";
  const DEFAULT_REPO = "RyeLibre/ryelibre.github.io";
  const DEFAULT_BRANCH = "main";
  const PROJECTS_PATH = "data/projects.js";

  function store(key, value) {
    try {
      if (value == null || value === "") localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  }
  function read(key, fallback) {
    try { return localStorage.getItem(key) || fallback || ""; } catch { return fallback || ""; }
  }
  const getToken = () => read(TOKEN_KEY);
  const getRepo = () => read(REPO_KEY, DEFAULT_REPO);
  const getBranch = () => read(BRANCH_KEY, DEFAULT_BRANCH);

  // ---- GitHub API ----
  async function gh(path, options) {
    const token = getToken();
    if (!token) throw new Error("No GitHub token yet — open Publishing setup first.");
    const res = await fetch("https://api.github.com" + path, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: "Bearer " + token,
        ...(options && options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const msg = (data && data.message) || res.statusText || "request failed";
      const err = new Error(
        res.status === 401 ? "GitHub rejected the token (401). Check it in Publishing setup."
        : res.status === 403 ? "GitHub says the token can't do that (403): " + msg
        : res.status === 404 ? "GitHub can't find that (404) — check the repo name and that the token covers it."
        : "GitHub error " + res.status + ": " + msg
      );
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function bytesToBase64(bytes) {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }
  const textToBase64 = (text) => bytesToBase64(new TextEncoder().encode(text));
  function base64ToText(b64) {
    const bin = atob(b64.replace(/\s/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  const dataUrlToBase64 = (dataUrl) => dataUrl.slice(dataUrl.indexOf(",") + 1);

  async function getFile(path) {
    const data = await gh("/repos/" + getRepo() + "/contents/" + path + "?ref=" + encodeURIComponent(getBranch()));
    return { sha: data.sha, text: base64ToText(data.content) };
  }

  async function putFile(path, base64Content, message, sha) {
    const body = { message, content: base64Content, branch: getBranch() };
    if (sha) body.sha = sha;
    return gh("/repos/" + getRepo() + "/contents/" + path, { method: "PUT", body: JSON.stringify(body) });
  }

  // ---- editing data/projects.js text ----
  // Replaces one post's "images" array and returns the new source. Throws if the
  // post can't be found or the result wouldn't be valid.
  function setImagesInSource(text, postId, list) {
    const idIdx = text.indexOf('"id": "' + postId + '"');
    if (idIdx === -1) throw new Error("Couldn't find this post in data/projects.js.");
    const nextIdx = text.indexOf('"id":', idIdx + 10);
    const end = nextIdx === -1 ? text.lastIndexOf("];") : nextIdx;
    const block = text.slice(idIdx, end);
    const m = /"images":\s*\[[^\]]*\]/.exec(block);
    if (!m) throw new Error("This post has no images list to update.");
    const json = list.map((p) => JSON.stringify(p));
    const replacement =
      list.length === 0 ? '"images": []'
      : list.length <= 3 ? '"images": [' + json.join(", ") + "]"
      : '"images": [\n      ' + json.join(",\n      ") + "\n    ]";
    const newBlock = block.slice(0, m.index) + replacement + block.slice(m.index + m[0].length);
    return text.slice(0, idIdx) + newBlock + text.slice(end);
  }

  function assertValid(text, expectedPostCount) {
    let projects;
    try {
      projects = new Function(text + "\n;return PROJECTS;")();
    } catch (e) {
      throw new Error("The updated projects file didn't validate, so nothing was published.");
    }
    if (!Array.isArray(projects) || (expectedPostCount && projects.length !== expectedPostCount)) {
      throw new Error("The updated projects file changed the number of posts, so nothing was published.");
    }
    return projects;
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  // ---- what's waiting to be published for a post ----
  function describeChanges(project) {
    const overrides = (loadGalleryOverrides()[project.id] || []).length;
    const hidden = (loadHiddenGallery()[project.id] || []).length;
    const ordered = Array.isArray(loadGalleryOrder()[project.id]) && loadGalleryOrder()[project.id].length > 0;
    return { overrides, hidden, ordered, any: overrides + hidden > 0 || ordered };
  }

  // Publishes this post's new photos, removals and order. onStatus(text) reports progress.
  async function publishPostChanges(project, onStatus) {
    const say = (t) => { if (onStatus) onStatus(t); };
    const pending = loadPendingImages()[project.id];
    const inverse = {};
    if (pending) Object.keys(pending.dataUrls).forEach((p) => { inverse[pending.dataUrls[p]] = p; });

    // Final ordered list: what's visible now (existing paths, in the chosen order,
    // minus removals) followed by newly added photos.
    const visible = getVisibleDataImages(project).map((src) => inverse[src] || src);
    const newOnes = [];
    const finalList = [];
    visible.forEach((src) => {
      if (src.startsWith("data:")) newOnes.push({ dataUrl: src });
      else finalList.push(src);
    });
    (loadGalleryOverrides()[project.id] || []).forEach((dataUrl) => newOnes.push({ dataUrl }));

    const uploaded = {};
    const base = stamp();
    let n = 0;
    for (const item of newOnes) {
      n += 1;
      const path = "images/pool/" + project.id + "-" + base + "-" + n + ".jpg";
      say("Uploading photo " + n + " of " + newOnes.length + "…");
      await putFile(path, dataUrlToBase64(item.dataUrl), "Add photo to " + project.id + " (published from the site)");
      uploaded[path] = item.dataUrl;
      finalList.push(path);
    }

    say("Updating the post…");
    const expected = typeof PROJECTS !== "undefined" ? PROJECTS.length : 0;
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const file = await getFile(PROJECTS_PATH);
        const updated = setImagesInSource(file.text, project.id, finalList);
        assertValid(updated, expected);
        await putFile(
          PROJECTS_PATH,
          textToBase64(updated),
          "Update photos for " + project.id + " (published from the site)",
          file.sha
        );
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (e.status !== 409 && e.status !== 422) break; // only retry edit conflicts
      }
    }
    if (lastErr) throw lastErr;

    // Keep showing the result locally until the site finishes deploying.
    savePendingImages(project.id, { paths: finalList, dataUrls: uploaded, at: Date.now() });
    const overrides = loadGalleryOverrides();
    delete overrides[project.id];
    saveGalleryOverrides(overrides);
    unhideGalleryImages(project.id);
    saveGalleryOrder(project.id, null);
    return { photos: newOnes.length, total: finalList.length };
  }

  // ---- setup dialog ----
  function ensureDialog() {
    let dlg = document.getElementById("publish-dialog");
    if (dlg) return dlg;
    dlg = document.createElement("dialog");
    dlg.id = "publish-dialog";
    dlg.className = "dialog";
    dlg.innerHTML =
      '<form class="dialog-form" method="dialog" id="publish-form">' +
      "<h3>Publishing setup</h3>" +
      '<p class="section-hint">Lets this page publish photo changes straight to your site. The token stays in this browser only. ' +
      'Create a <strong>fine-grained</strong> token at GitHub → Settings → Developer settings → Personal access tokens, ' +
      'limited to <strong>only this repository</strong> with <strong>Contents: Read and write</strong>, and a short expiry.</p>' +
      '<label for="publish-token">GitHub token</label>' +
      '<input id="publish-token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…">' +
      '<label for="publish-repo">Repository</label>' +
      '<input id="publish-repo" type="text" autocomplete="off">' +
      '<label for="publish-branch">Branch</label>' +
      '<input id="publish-branch" type="text" autocomplete="off">' +
      '<p id="publish-status" class="section-hint"></p>' +
      '<div class="dialog-actions">' +
      '<button type="button" class="btn-secondary" id="publish-forget">Forget token</button>' +
      '<button type="button" class="btn-secondary" id="publish-test">Test</button>' +
      '<button type="button" class="btn-secondary" data-close-dialog>Close</button>' +
      '<button type="submit" class="btn-primary">Save</button>' +
      "</div></form>";
    document.body.appendChild(dlg);

    const $ = (id) => dlg.querySelector("#" + id);
    const status = (t) => { $("publish-status").textContent = t; };
    dlg.querySelector("[data-close-dialog]").addEventListener("click", () => dlg.close());
    $("publish-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const tok = $("publish-token").value.trim();
      if (tok) store(TOKEN_KEY, tok);
      store(REPO_KEY, $("publish-repo").value.trim() || DEFAULT_REPO);
      store(BRANCH_KEY, $("publish-branch").value.trim() || DEFAULT_BRANCH);
      $("publish-token").value = "";
      status("Saved." + (getToken() ? " Token is stored in this browser." : " No token yet."));
    });
    $("publish-forget").addEventListener("click", () => {
      store(TOKEN_KEY, "");
      status("Token removed from this browser.");
    });
    $("publish-test").addEventListener("click", async () => {
      const tok = $("publish-token").value.trim();
      if (tok) store(TOKEN_KEY, tok);
      store(REPO_KEY, $("publish-repo").value.trim() || DEFAULT_REPO);
      store(BRANCH_KEY, $("publish-branch").value.trim() || DEFAULT_BRANCH);
      $("publish-token").value = "";
      status("Testing…");
      try {
        const repo = await gh("/repos/" + getRepo());
        const can = repo.permissions && repo.permissions.push;
        status(can ? "Connected to " + repo.full_name + " — this token can publish." : "Connected to " + repo.full_name + ", but this token can't write. It needs Contents: Read and write.");
      } catch (e) {
        status(e.message);
      }
    });
    return dlg;
  }

  function openPublishSetup() {
    const dlg = ensureDialog();
    dlg.querySelector("#publish-token").value = "";
    dlg.querySelector("#publish-repo").value = getRepo();
    dlg.querySelector("#publish-branch").value = getBranch();
    dlg.querySelector("#publish-status").textContent = getToken()
      ? "A token is saved in this browser. Paste a new one to replace it."
      : "No token saved yet.";
    dlg.showModal();
  }

  window.publishPostChanges = publishPostChanges;
  window.describePublishChanges = describeChanges;
  window.openPublishSetup = openPublishSetup;
  window.hasPublishToken = () => !!getToken();
  window.__publishInternals = { setImagesInSource, assertValid }; // for testing

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("publish-setup-btn");
    if (btn) btn.addEventListener("click", openPublishSetup);
  });
})();
