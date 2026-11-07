// Splash intro shown on the home page: white on black, 1:1, about 50 seconds.
// Edit the words and swap the placeholder photos below (3-6 images work best).
// Add ?intro=1 to the home page URL to replay it any time.
const SPLASH_WORDS = [
  "Curation",
  "Juror",
  "Design",
  "Photography",
  "Films",
  "Exhibitions",
  "Festivals",
  "Kachin",
  "Educator",
  "Books",
  "Learning media",
  "Production",
  "Studios",
  "Sakse",
  "Projects",
  "Screenings",
  "Talks",
  "Adobe Abode",
];

// The closing recap: what I do, one line each, shown just before "How can I help?".
const SPLASH_RECAP = [
  "Curation",
  "Design",
  "Photography",
  "Filmmaking",
  "Exhibition design",
  "Educator & Advisor",
  "Learning media",
  "Production",
  "Studio / Space design",
  "Screening organizer",
  "Adobe design & construction",
];
// Photos for the splash (3-6 work best). Four are the Screenings photos; the other two
// (Freedom from Fear, Everyday Kachin) are still placeholders - swap them whenever you choose.
const SPLASH_IMAGES = [
  "images/splash/screenings-theatre-intro.jpg",
  "images/splash/screenings-outdoor-villa-night.jpg",
  "images/pool/rebels-reform-freedom-from-fear.jpg",
  "images/splash/screenings-kids-audience.jpg",
  "images/pool/everyday-kachin-print-strips-close.jpg",
  "images/splash/screenings-old-chiang-mai-cultural-center.jpg",
];

// A word listed here always appears over its own photos (cycling through them)
// instead of the next photo in the general list.
const SPLASH_WORD_IMAGES = {
  "Screenings": [
    "images/splash/screenings-theatre-intro.jpg",
    "images/splash/screenings-outdoor-villa-night.jpg",
    "images/splash/screenings-kids-audience.jpg",
    "images/splash/screenings-old-chiang-mai-cultural-center.jpg",
    "images/splash/screenings-packed-room-looking-up.jpg",
  ],
  "Educator": [
    "images/splash/educator-teaching-in-dark-room.jpg",
    "images/pool/computer-training-workshop.jpg",
    "images/pool/print-review-table-japan.jpg",
    "images/splash/educator-camera-review-bw.jpg",
  ],
  "Exhibitions": [
    "images/splash/exhibitions-moonlit-outdoor-print.jpg",
    "images/splash/exhibitions-hanging-prints-barr-sign.jpg",
    "images/splash/exhibitions-outdoor-panels-guard.jpg",
    "images/splash/exhibitions-kachin-couple-banner.jpg",
    "images/splash/exhibitions-hanbok-print-corridor.jpg",
  ],

  "Studios": [
    "images/splash/studios-gallery-stairwell-prints.jpg",
    "images/pool/studio-sakse-book-nook.jpg",
    "images/pool/studio-sakse-work-desk.jpg",
    "images/pool/studio-sakse-dinner-gallery.jpg",
    "images/pool/unorthodox-opening-night-docartsasia.jpg",
    "images/studio-sakse-ii-cnx.jpg",
    "images/pool/laiza-center-workshop-classroom.jpg",
    "images/docartsasia-laiza-rooftop-screening.jpg",
    "images/pool/life-on-the-front-line-crowd.jpg",
  ],

  "Talks": [
    "images/journalism-challenges-burma-cmu.jpg",
    "images/splash/talks-tedxbkk.jpg",
    "images/splash/talks-school-of-arts-sciences.jpg",
    "images/splash/talks-ted-interview.jpg",
    "images/splash/talks-studio-sakse-crowd.jpg",
    "images/splash/talks-asia-society-podium.jpg",
  ],

  "Festivals": [
    "images/splash/festivals-gallery-wall-visitors.jpg",
    "images/splash/festivals-wooden-pavilion-books.jpg",
    "images/splash/festivals-photobook-tables.jpg",
    "images/pool/cdaf-monks-viewing-photos.jpg",
    "images/benefit-auction.jpg",
    "images/splash/festivals-yangon-print-grid.jpg",
    "images/cdaf-2015-farmani-smiling.jpg",
  ],

};