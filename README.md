# J3 WorkOut

A personal workout coach that runs entirely in your browser — no account, no server, no tracking. Your data lives in the browser's local storage; back it up from **Me → Settings → Data** — on a phone, *Save to Drive / Files* sends it straight to Google Drive or iCloud, and Home reminds you weekly.

## Features
- **Coach**: answers a few questions, builds a weekly plan around the days you pick, and adjusts weights to how you feel each day (daily check-in + double progression). Deload weeks, plateau detection and an 8-week plan refresh keep it working long-term.
- **Fast logging**: −/+ steppers, a ✓ per set that starts the rest timer, "last time" numbers to beat, screen kept awake, undo instead of pop-ups.
- **Start a Workout**: one front door — follow your plan, build a split day, or freestyle; shows anything in progress and, on vacation, the circuit first.
- **Split Trainer**: choose your week type (Push / Pull / Legs or Upper / Lower / Cardio) and today's day, then build the session one exercise at a time — pick the muscle, pick from a few moves for it. It guarantees every muscle the day calls for is covered by the last exercise, and suggests the next day in your rotation.
- **Freestyle**: choose-your-own-adventure workouts with XP, levels, badges and an exercise collection.
- **Resistance Bands**: 20+ band exercises, each with an animated demo (band shown in orange), the muscles it works, setup + form cues and a link to video demos. Tracks the band level you used (X-Light → X-Heavy) and tells you when to move up. Bands-only mode in Split Trainer for travel.
- **Vacation Circuits & Mobility**: guided, hands-free timers with voice cues — a bodyweight circuit and a resistance-band circuit; vacation mode pauses your gym schedule and switches Split Trainer, Freestyle and the circuit to what you packed (bands or bodyweight). Mobility includes a pre-workout warm-up.
- **Muscle database**: primary / secondary / tertiary muscles for every exercise; sore or injured areas are automatically avoided.
- **Progress**: personal records, strength trends (estimated 1-rep max), monthly recap, weigh-ins, measurements and on-device progress photos.
- **Daily habits**: sleep, steps and protein in 20 seconds; tip of the day from the learning library.
- Light / dark theme, adjustable text size, first-run tour.

## Project layout
```
index.html        page markup (open this to run the app)
styles.css        all styling
js/data.js        constants & seed data: exercise library, icons, animations, default days
js/state.js       saved state, storage helpers, week/overload math, calorie estimates
js/app.js         navigation, Home, guided workout wizard, Log Workout
js/tools.js       rest timer, sprints, history, calendar, progress
js/settings.js    settings, exercise library, workout days, backup/import/reset
js/coach.js       coach questionnaire, plan generator, check-ins, weight suggestions, exercise instructions
js/learn.js       "Did you know?" tips
js/freestyle.js   Freestyle mode + XP / levels / badges + exercise stat cards
js/vacation.js    Vacation circuit + vacation mode
js/muscledb.js    muscle database + recovery-aware exercise selection + spreadsheet view
js/bands.js       resistance bands: animated demos, cues, band library page
js/splitbuilder.js Split Trainer: PPL / Upper-Lower-Cardio days built one exercise at a time
js/workout-ux.js  set rows (steppers, ✓ per set), last-time numbers, wake lock, undo
js/progress.js    records, strength trend, monthly recap, body tracking & photos
js/smartplan.js   deload weeks, plateau detection, 8-week refresh
js/daily.js       daily habits, mobility routines, tip of the day
js/polish.js      theme, text size, first-run tour
js/main.js        startup
tests/index.html  automated tests
```
Files are plain scripts loaded in order by `index.html` and share globals — no build step, no dependencies.

## Running the tests
Open `tests/index.html` from the hosted site (e.g. GitHub Pages: `…/tests/`). It loads the app in a hidden frame in **test mode** (`index.html?test=1`), which stores data under a separate prefix, so tests never touch your real workout data.

Browsers block the test page from reading the app when opened straight from disk (`file://`). Locally, run a tiny server instead:
```
python3 -m http.server 8000
# then open http://localhost:8000/tests/
```
