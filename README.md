# Portfolio Site

A basic portfolio site with a left sidebar of featured hashtags for filtering posts. Plain HTML/CSS/JS —
no build step, no dependencies to install. Post descriptions support Markdown (rendered client-side with
[marked](https://github.com/markedjs/marked)).

The sample posts in `data/projects.js` are placeholders — replace their titles, descriptions, links, and
images with your own work.

## Structure

```
index.html          Home page (header, sidebar, post grid, footer)
post.html            Single-post page (post.html?id=...) — cover photo, full text, gallery
css/style.css        Styling (auto light/dark based on OS)
js/shared.js          Data/image helpers shared by index.html and post.html
js/main.js            Renders the post grid and sidebar on index.html
js/post.js            Renders one post's detail page on post.html
data/tags.js          Featured hashtags shown in the left sidebar
data/tag-intros.js    Intro text shown above the grid when one tag is selected
data/city-coords.js   City name -> map position, used by the "Project Locations" pin map
data/projects.js      Your posts — edit this to add/change posts
```

## Adding a post

Open [`data/projects.js`](data/projects.js) and add an entry to the `PROJECTS` array:

```js
{
  "id": "post-title",
  "title": "Post Title",
  "categories": ["Design", "Film"],
  "date": "2026-01",
  "description": "Supports **Markdown** — bullet lists, `code`, links, etc.",
  "link": "https://example.com/your-work",
  "image": "",
  "images": [],
  "location": "",
  "place": "",
  "featured": false
}
```

- `id` must be unique and shouldn't change once set — it's how the site remembers which photo(s) you picked for that post (see **Post images** below). It's also the post's URL: `post.html?id=post-title`.
- `categories` matches (case-insensitively) against the hashtags in `data/tags.js`. A post can have any tags, including ones not in the sidebar — they just won't have a dedicated filter button yet.
- `date` is used for sorting (newest first); any sortable string like `"2026-01"` works. Displayed as
  "MONTH 'YY" (e.g. "MARCH '25") wherever a post's date is shown.
- `link` is an optional external URL (e.g. a live site or repo) — shown as "Visit external link" on the post's own page.
- `location` is an optional city name (e.g. `"Tokyo"`) — see **Location map** below.
- `place` is an optional venue name (e.g. `"The Nikon Salon"`) shown right after `location` — a post's
  meta line reads "MONTH 'YY · City · Place" with both filled in.
- `featured: true` moves a post to the top of "All Projects" (what a first-time visitor sees) and to
  the top of every tag view it belongs to, ahead of the normal newest-first order. Toggle it with the
  "Featured" checkbox in the "+ New post" / "Edit" dialog — it also gets a "Featured" badge on the card
  and on the post's own page.
- `image` / `images` — see **Post images** below.

## Post pages

Every post has its own page at `post.html?id=<id>` — clicking a post's title or its "View post →"
link on the home page goes there. The post page shows the cover photo, full description, an optional
external link, and a photo gallery. Each tag on the post links back to `index.html?tag=<tag>`, which
pre-filters the home page to that category.

## Post images

Every post shows a cover image. If `image` is empty, the site auto-generates a simple placeholder
(a colored tile with the post's initials, color derived from the title) so nothing looks broken. The
post's own page also has a **Gallery** section for additional photos, driven by the `images` array.

To set real photos, you have two options:
- **Permanent (shows for all visitors):** put image files in an `images/` folder in the project, then
  set `"image": "images/cover.jpg"` for the cover and/or list more paths in `"images": ["images/a.jpg", "images/b.jpg"]`
  for the gallery, in `data/projects.js`.
- **Quick local preview:** click **"Change photo"** (cover, on the home page or the post page) or
  **"+ Add photo to gallery"** (on the post page) to pick a file from your computer. It updates instantly
  and is remembered in *your browser only* (saved to `localStorage`, not to a file) — click **"Reset"**
  or **"Remove"** to undo. This is meant for previewing; it won't appear for site visitors, and
  large/many photos can hit browser storage limits. For photos everyone sees, use the permanent option
  above instead.

Either way, any photo picked through **"Change photo"** or **"+ Add photo to gallery"** is automatically
resized in your browser before saving: scaled down so neither dimension exceeds 2200px (smaller images
are left alone) and re-encoded as a high-quality JPEG (see `resizeImageForWeb` in `js/shared.js` if you
want to change the 2200px / quality numbers). Files over **10MB** are rejected upfront with a message
asking for a smaller one — browsers cap `localStorage` at just a few MB total across *all* your draft
photos combined, so this catches oversized uploads (e.g. an unedited camera photo) before they eat that
budget. If you keep hitting the storage-full alert even with photos under 10MB, you've likely saved
several images already — use the permanent `images/` folder option instead, or "Reset"/"Remove" some
existing local photos to free up space.

## Location map

Below the tag mind map is a simple pin map ("Project Locations") — set a post's `location` (a
city name) and it gets a pin, sized by how many posts share that city. It's **not real geocoding** —
there's no address lookup or precise coordinates, just a small hand-picked table in
[`data/city-coords.js`](data/city-coords.js) mapping city names to a position on the map image.

If you use a city that isn't in that table, the post still saves fine — it just won't get a pin, and
shows up in a small note under the map ("Not shown on the map yet…") so you know to add it. To add a
city, open `data/city-coords.js` and add an entry using the formula in its comments (based on the
city's real latitude/longitude).

Use the **25% / 50% / 75% / 100%** buttons above the map to zoom in where pins overlap (Asia usually
needs it most) — the map scrolls/pans within a fixed-size window at every zoom level, and jumping to
50%+ auto-centers on Asia (`MAP_ZOOM_FOCUS` in `js/main.js`) since that's normally the densest cluster.
Pins stay in the same relative spot regardless of zoom.

The map background is a real image, [`images/world-map.png`](images/world-map.png) — pins are
positioned over it with plain CSS (percentage `left`/`top`), computed in `js/main.js`
(`renderLocationMap`). To swap in a different map image, replace that file and keep the same
filename, or update the `<img src>` in `renderLocationMap` if you rename it. Since pin positions are
computed from the 1000×500 coordinate grid in `data/city-coords.js` (not from the image's actual
pixel dimensions), a very differently-shaped replacement map may need those coordinates adjusted to
line back up.

## Timeline

Below the map is a horizontal timeline plotting every post by month (day is ignored) along an axis
that always starts at **January 2000** and extends to whichever is later: today, or your
furthest-future-dated post. Click a dot to open that post. It scrolls horizontally on narrow screens.
Posts sharing the same month stack as multiple dots above that point rather than overlapping.

## Category intro text

When exactly one tag is selected, a short intro appears above the grid — a few lines about that
category. Open [`data/tag-intros.js`](data/tag-intros.js) and edit the `TAG_INTROS` object to change
it (supports Markdown, same as post descriptions). A tag with no entry there just shows the grid with
no intro — nothing breaks, so you don't need one for every tag (e.g. tags added via "+ Add tag" won't
have one until you write it).

## Adding/editing featured hashtags

Open [`data/tags.js`](data/tags.js) and edit the `FEATURED_TAGS` array — this controls exactly what shows in the left sidebar, in order. It's independent from what tags your posts actually use, so you can curate it by hand.

## Adding a post or tag from the site itself

The **"+ New post"** button (above the grid) and **"+ Add tag"** button (in the sidebar) let you add
content without touching code. Because this is a static site with no backend or database, anything
you add this way is saved as a **draft in your browser's `localStorage`** — it shows up for you
immediately (marked "Draft", with a "Remove draft" option) but isn't visible to anyone visiting the
live site.

To actually publish a draft:
1. Add it through the "+" button.
2. A box appears with a ready-to-paste code snippet — copy it (it's pre-selected).
3. Paste it into the `PROJECTS` array in `data/projects.js` (for a post) or the `FEATURED_TAGS` array
   in `data/tags.js` (for a tag).
4. Commit and push — see **Deploying to GitHub Pages** below.

Tagging a new post with a hashtag that isn't in the sidebar yet automatically adds it as a draft tag too.
Tags are picked from a checklist of everything already in use, plus an "Other tags" text field for
anything not listed yet.

### Editing an existing post

Click **"Edit"** on any post card (or **"Edit this post"** on a post's own page) to change its title,
tags, date, link, or description — this works on *every* post, including the ones already in
`data/projects.js`, not just drafts.

- Editing a **draft** post updates it directly — nothing extra to do.
- Editing a post that's **already in `data/projects.js`** saves your changes as a local overlay (same
  idea as the photo overrides) and shows a ready-to-paste code snippet — paste it over that post's
  existing entry (matched by `id`) in `data/projects.js` to make the edit permanent for everyone.

Editing a post's cover/gallery photos still happens separately, via "Change photo" — see **Post images**.

### Publishing everything at once

Doing the copy-paste above one item at a time gets tedious once you've added several drafts, edits, and
photos. Instead, click **"Export my drafts & photos"** in the sidebar — it downloads one JSON file with
every draft post, draft tag, post edit, and locally-chosen photo (cover and gallery, including photos
set on posts that already exist in `data/projects.js`). Hand that file to whoever is editing the code
(or to an AI assistant working in this project) and ask them to "bake it in" — it has everything needed
to write real entries into `data/projects.js` / `data/tags.js` and save the embedded photos as real
files under `images/`, without you re-entering anything by hand.

## Customizing

- Edit the name, tagline, and links in `index.html` (`<header class="site-header">`).
- Colors live as CSS variables at the top of `css/style.css` (`:root` for dark mode, the `@media (prefers-color-scheme: light)` block for light mode).

## Running locally

Just double-click `index.html`, or open it in a browser — no server or build step needed.
(Project data loads via a plain `<script>` tag rather than `fetch()`, so it works fine over `file://`.)

## Deploying to GitHub Pages

This repo is set up as `ryelibre.github.io` — a special repo name GitHub Pages serves automatically at
your account's root domain, no extra config needed.

1. Create an empty repo on GitHub named exactly `ryelibre.github.io`.
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/ryelibre/ryelibre.github.io.git
   git push -u origin main
   ```
3. Check **Settings → Pages** on the repo — for a `<username>.github.io` repo this is usually already
   enabled (source: `main` / `/ (root)`); if not, turn it on there.
4. Your site will be live at `https://ryelibre.github.io/` (can take a minute or two after the first push).

## License

Feel free to reuse this template for your own portfolio.
