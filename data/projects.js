// Your posts. Add/edit entries here — this is placeholder content, replace freely.
// `id` must be unique and stable — it's used to remember per-post photo choices
// made with the "Change photo" button, so don't change it once you've set a photo.
// `description` supports Markdown (rendered with marked.js).
// `categories` should match (case-insensitive) the hashtags in data/tags.js
// where possible, but can include any tags you want.
// `image` can be a path like "images/my-photo.jpg" — leave it "" to use an
// auto-generated placeholder image (or a photo you picked with "Change photo").
// `images` is an optional array of extra photo paths shown in the gallery on
// the post's own page (post.html?id=...).
const PROJECTS = [
  {
    "id": "kachin-highlands",
    "title": "Kachin Highlands",
    "categories": ["Kachin", "Photography"],
    "date": "2026-06",
    "description": "A photo series documenting daily life in the Kachin highlands.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "object-of-care-exhibition",
    "title": "Object of Care — Exhibition",
    "categories": ["Curation", "Design"],
    "date": "2026-04",
    "description": "Curated a small group exhibition exploring craft and repair.\n\n- Selected 14 works from 9 artists\n- Designed the wall text and layout\n- *Replace this with your own project description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "interface-sketches",
    "title": "Interface Sketches",
    "categories": ["Design"],
    "date": "2026-02",
    "description": "A set of UI/UX sketches exploring a new navigation pattern.\n\n*Replace with your own work.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "short-film-passage",
    "title": "Short Film — Passage",
    "categories": ["Film", "Kachin"],
    "date": "2025-12",
    "description": "A short documentary film, ~8 minutes.\n\n*Replace with a link to the film and your own description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "studio-notes",
    "title": "Studio Notes",
    "categories": ["Curation", "Photography"],
    "date": "2025-09",
    "description": "Behind-the-scenes photography from studio visits ahead of a curated show.\n\n*Replace with your own project description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "earthen-abode",
    "title": "Earthen Abode",
    "categories": ["Earthen Abode", "Design"],
    "date": "2026-07",
    "description": "A study of earthen/adobe building techniques and low-impact dwelling design.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "mountain-passes",
    "title": "Mountain Passes",
    "categories": ["Mountains", "Kachin", "Photography"],
    "date": "2026-05",
    "description": "A photo series shot along the mountain passes of the Kachin highlands.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "peace-work-dialogues",
    "title": "Peace-work Dialogues",
    "categories": ["Peace-work", "Kachin", "Curation"],
    "date": "2026-03",
    "description": "Notes and curated conversations from community peace-building work.\n\n*Replace this with your own project description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "unicorn-liberation-front-zine",
    "title": "Unicorn Liberation Front — Zine",
    "categories": ["Unicorn Liberation Front", "Design", "Film"],
    "date": "2025-08",
    "description": "A hand-designed zine and short film for an ongoing, gloriously absurd art project.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "lubecker-hutchen-global-archive-notes",
    "title": "Lubecker Hutchen: Global Archive Notes",
    "categories": ["lubecker hutchen global archivist", "Curation", "Exhibitions"],
    "date": "2025-05",
    "description": "Archival notes and curatorial research toward a touring exhibition.\n\n*Replace this with your own project description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "group-show-assembled",
    "title": "Group Show: Assembled",
    "categories": ["Exhibitions", "Curation", "Design"],
    "date": "2025-01",
    "description": "Co-curated and designed a group exhibition of assemblage work.\n\n*Replace this with your own project description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "facilitating-workshops",
    "title": "Facilitating Workshops",
    "categories": ["Workshops", "Peace-work"],
    "date": "2026-08",
    "description": "Notes on designing and running participatory workshops for community groups.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "reading-list-craft-care",
    "title": "Reading List: Craft & Care",
    "categories": ["Books", "Curation"],
    "date": "2026-08",
    "description": "A curated reading list on craft, repair, and care as design principles.\n\n- *Replace with your own annotated list*\n- Add links to each book",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "learning-media-roundup",
    "title": "Learning Media Roundup",
    "categories": ["Learning media", "Books", "Film"],
    "date": "2026-07",
    "description": "A roundup of books, films, and other media worth learning from.\n\n*Replace this with your own project description.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "hokkaido-fieldnotes",
    "title": "Hokkaido Fieldnotes",
    "categories": ["Hokkaido", "Photography", "Mountains"],
    "date": "2026-09",
    "description": "Draft — field notes and photos from time in Hokkaido: snow, mountains, and small-town life in the north.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "cnx-residency",
    "title": "CNX Residency",
    "categories": ["CNX", "Workshops", "Curation"],
    "date": "2026-09",
    "description": "Draft — notes from an art residency and workshop series based in Chiang Mai (CNX).\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "production-diary",
    "title": "Production Diary",
    "categories": ["Production", "Film"],
    "date": "2026-09",
    "description": "Draft — behind-the-scenes production notes: schedules, gear lists, and lessons learned on set.\n\n*Replace this with your own project description, image, and link.*",
    "link": "",
    "image": "",
    "images": []
  },
  {
    "id": "portraits-of-independence",
    "title": "Portraits of Independence",
    "categories": ["Exhibitions", "Photography", "Kachin"],
    "date": "2026-09-19",
    "description": "Portraits of Independence\nat the Nikon Salon in Shinjuku, Tokyo",
    "link": "",
    "image": "images/portraits-of-independence.jpg",
    "images": []
  },
  {
    "id": "foundry-photojournalism-workshops",
    "title": "Foundry Photojournalism Workshops",
    "categories": ["Workshops", "Photography", "CNX"],
    "date": "2026-09-19",
    "description": "Foundry Photojournalism Workshops 2012",
    "link": "",
    "image": "images/foundry-photojournalism-workshops.jpg",
    "images": []
  },
  {
    "id": "everyday-kachin",
    "title": "Everyday Kachin",
    "categories": ["Kachin", "Curation", "Exhibitions"],
    "date": "2026-09-19",
    "description": "Everyday Kachin",
    "link": "",
    "image": "images/everyday-kachin.jpg",
    "images": []
  },
  {
    "id": "ansel-adams-born-free-equal",
    "title": "Ansel Adams : Born Free & Equal",
    "categories": ["Exhibitions", "Curation"],
    "date": "2026-09-19",
    "description": "Ansel Adams : Born Free & Equal",
    "link": "",
    "image": "images/ansel-adams-born-free-equal.jpg",
    "images": []
  },
  {
    "id": "studio-sakse-cnx",
    "title": "Studio Sakse @ CNX",
    "categories": ["Design", "Studios", "Sakse"],
    "date": "2026-09-19",
    "description": "Studio Sakse @ CNX",
    "link": "",
    "image": "images/studio-sakse-cnx.jpg",
    "images": []
  }
];
