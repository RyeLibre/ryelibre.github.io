# Hilltop Firefight

A front-line shooting game: a Kachin Independence Army post against a Burma Army post on the next hilltop, 150–250 m across the valley. Six hilltops — Hpa Lap Bum (Tea Mountain), Alaw Bum, A Len Bum, Hkaya Bum, Lawa Yang and Yaw Yone — in 90-second rounds.

- **Play in a browser:** open `index.html` (one file, works offline — the sounds are built in).
- **Android:** `download/HilltopFirefight.apk`, built automatically by GitHub Actions from `android/` whenever the game changes. Install it by opening the file on the phone and allowing "install unknown apps" for your browser or file manager.
- **Virus scan:** every build is scanned with ClamAV using fresh signatures. The report, with the SHA-256 of the APK, is in `download/virus-scan.txt`. The build fails if anything is found.

## Controls

| | Computer | Phone |
|---|---|---|
| Shoot | Click | Tap where you want to hit |
| Aim down the sights | Hold Alt | Hold AIM |
| Duck / stand | Scroll down / up, or Space | DUCK |
| RPG | Right-click or F | RPG |
| Reload | R, or shoot the reload target | RELOAD, or tap the target |

The APK is signed with a debug key (it is meant for sideloading, not the Play Store).
