// Sub-tags shown under a category's intro heading — a lighter-weight way to
// drill into a tag without adding every sub-topic to the main sidebar cloud.
// Keys should match a tag in data/tags.js (case-insensitive). Sub-tag names
// are used as ordinary post categories — tag a post with one and it'll show
// up when that sub-tag is clicked, same as any other tag.
const TAG_SUBTAGS = {
  "Design": ["Logos", "Bags", "Bikes", "Scarfs"],
  "Photography": ["Unicorn Liberation Front", "Lubecker Hutchen Archivist"],
  "Exhibitions": ["Photo works", "Curated works", "Collaborated works"],
  "Steal this idea": ["Rye's Ideas", "All Projects to Steal", "All Projects to Support"],
};

// Posts carrying a group's tag are listed below a labelled break, after the
// category's other posts, when only that category is selected.
const TAG_GROUPS = {
  "Educator": {
    tag: "Organized",
    heading: "Organized",
    note: "Workshops & events I organized and/or hosted.",
  },
};
