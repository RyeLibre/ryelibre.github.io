// Splash intro shown on the home page: white on black, 1:1, about 50 seconds.
// Edit the words and swap the placeholder photos below (3-6 images work best).
// Add ?intro=1 to the home page URL to replay it any time.
const SPLASH_WORDS = [
  "Curation",
  "Juror",
  "Design",
  "Photography",
  "Films",
  null, // gap between the two groups in the stacked list
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
  "Adobe Abode",
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

};