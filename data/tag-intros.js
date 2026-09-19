// Intro text shown above the post grid when a single tag is selected.
// Keys should match a tag in data/tags.js (matching is case-insensitive).
// A tag with no entry here just won't show an intro — that's fine.
// `description` supports Markdown, same as post descriptions.
const TAG_INTROS = {
  "Kachin":
    "Kachin State sits in the far north of Myanmar, bordered by China and India — a place of highland forests, jade mines, and a long history of conflict and resilience.\n\nThis tag gathers the documentary, photography, and community work rooted in that region: portraits of daily life, landscapes, and the people navigating displacement and return.\n\n*Replace this intro with your own description of the Kachin category.*",

  "Curation":
    "Curating is the quiet work of choosing, arranging, and giving context — deciding what belongs next to what, and why.\n\nPosts under this tag cover exhibitions organized, collections studied, and the behind-the-scenes decisions that shape how work gets shown to an audience.\n\n*Replace this intro with your own description of the Curation category.*",

  "Design":
    "Design here means the practical craft of making things usable and legible — interfaces, layouts, objects, and systems.\n\nExpect sketches, prototypes, and finished work spanning digital products, print, and physical design, along with notes on the process behind each.\n\n*Replace this intro with your own description of the Design category.*",

  "Photography":
    "A photograph is a small argument about what's worth looking at.\n\nThis tag collects photo series and single images — portraits, landscapes, and documentary work — shot across different projects and places over the years.\n\n*Replace this intro with your own description of the Photography category.*",

  "Film":
    "Moving image work, from short documentaries to experimental clips and zine-adjacent films.\n\nPosts here include finished films, behind-the-scenes notes, and the occasional unfinished cut worth sharing anyway.\n\n*Replace this intro with your own description of the Film category.*",

  "Earthen Abode":
    "Earthen Abode follows experiments in building with earth — adobe, cob, rammed earth — as a low-impact alternative to conventional construction.\n\nPosts cover material tests, small structures, and the reasoning behind building this way.\n\n*Replace this intro with your own description of the Earthen Abode category.*",

  "Mountains":
    "Mountains show up again and again in this work — as subject, as backdrop, and as the terrain that shapes how people live.\n\nThis tag gathers posts shot or set in mountainous places, from high passes to the villages tucked beneath them.\n\n*Replace this intro with your own description of the Mountains category.*",

  "Peace-work":
    "Peace-work covers community-facing projects focused on dialogue, reconciliation, and de-escalation in places shaped by conflict.\n\nExpect facilitation notes, workshop recaps, and reflections from work that doesn't always produce something photographable — but matters anyway.\n\n*Replace this intro with your own description of the Peace-work category.*",

  "Unicorn Liberation Front":
    "The Unicorn Liberation Front is an ongoing, gloriously absurd art project — equal parts zine, performance, and inside joke that got out of hand.\n\nThis tag is where the sillier, more experimental work lives, on purpose.\n\n*Replace this intro with your own description of the Unicorn Liberation Front category.*",

  "Lubecker Hutchen Archivist":
    "An ongoing archival project tracing a specific thread across collections worldwide — part research, part obsession.\n\nPosts here document findings, dead ends, and the slow accumulation of a personal archive.\n\n*Replace this intro with your own description of this category.*",

  "Exhibitions":
    "A running record of exhibitions — curated, designed, or exhibited in — from small pop-ups to larger group shows.\n\nEach post usually covers the concept, the install, and a few lessons learned along the way.\n\n*Replace this intro with your own description of the Exhibitions category.*",

  "Workshops":
    "Notes from workshops facilitated or attended — the format, what worked, what didn't, and what to change next time.\n\nThis tag is as much a working log as a portfolio section.\n\n*Replace this intro with your own description of the Workshops category.*",

  "Books":
    "A running, opinionated reading list — books that shaped a project, changed an opinion, or just wouldn't leave me alone.\n\nEntries here are short and annotated rather than full reviews.\n\n*Replace this intro with your own description of the Books category.*",

  "Learning media":
    "Beyond books: documentaries, courses, podcasts, and other media that taught me something worth keeping.\n\nThis tag rounds up recommendations alongside notes on why each one mattered.\n\n*Replace this intro with your own description of the Learning media category.*",

  "Hokkaido":
    "Draft — Hokkaido is Japan's northernmost island: mountains, snow, and a slower pace than the mainland cities.\n\nThis tag will gather photos and notes from time spent there — landscapes, small towns, and whatever else the trip turns up.\n\n*Replace this intro with your own description of the Hokkaido category.*",

  "CNX":
    "Draft — CNX is the airport code for Chiang Mai, Thailand, and shorthand here for work based there.\n\nExpect residency notes, workshops, and collaborations that came out of time in the city.\n\n*Replace this intro with your own description of the CNX category.*",

  "Production":
    "Draft — the practical, unglamorous side of making things: schedules, gear, budgets, and the decisions made on set or in the studio.\n\nThis tag is a working log more than a highlight reel.\n\n*Replace this intro with your own description of the Production category.*",

  "Bio":
    "The background material — who's behind this site, how to reach them, and the paper trail that goes with the work.\n\nExpect a bio, artist statement, CV, education, press, and the influences that shaped the practice.\n\n*Replace this intro with your own description of the Bio category.*",

  "Studios":
    "A look inside the physical spaces work gets made in — studio setups, shared spaces, and the occasional collaborator's corner.\n\nThis tag covers the room more than the finished work: layout, light, tools, and the small decisions that shape how a space gets used.\n\n*Replace this intro with your own description of the Studios category.*",

  "Sakse":
    "Sakse is a specific studio/collective this practice runs through — its own name, its own thread running across several other tags.\n\nPosts here are anything made under, with, or because of Sakse.\n\n*Replace this intro with your own description of the Sakse category.*",

  "Recognitions":
    "Draft — a running list of grants, awards, and other recognition for the work, kept mostly so it doesn't have to be reconstructed from memory later.\n\nExpect short entries rather than full write-ups.\n\n*Replace this intro with your own description of the Recognitions category.*",

  "Printmaking":
    "Work made by cutting, carving, and pressing rather than drawing straight onto a surface — block prints, stamps, and anything else that leaves an impression.\n\nThis tag covers the process as much as the finished print.\n\n*Replace this intro with your own description of the Printmaking category.*",

  "Screenings":
    "A record of films and video work that got shown somewhere — festivals, one-off screenings, or informal viewings.\n\nExpect notes on the event itself alongside the work that screened.\n\n*Replace this intro with your own description of the Screenings category.*",

  "Steal this idea":
    "Half-finished ideas and open prompts, posted on purpose so someone else might run with them.\n\nNothing here is precious — take it, change it, make it better.\n\n*Replace this intro with your own description of the Steal this idea category.*",

  "Adobe Abode":
    "A close relative of Earthen Abode — more experiments in earth-based building, kept as its own thread.\n\n*Replace this intro with your own description of the Adobe Abode category.*",

  "Scripts":
    "Writing meant to be performed or filmed rather than read straight through — screenplays, treatments, and story outlines.\n\nExpect works in progress more often than finished drafts.\n\n*Replace this intro with your own description of the Scripts category.*",

  "Talks":
    "Notes and recordings from talks given or attended — conferences, panels, and the odd stage that wasn't expected.\n\nExpect a mix of prep notes and after-the-fact reflection.\n\n*Replace this intro with your own description of the Talks category.*",
};
