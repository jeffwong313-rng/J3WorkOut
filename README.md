# J3 WorkOut

A personal workout coach that runs entirely in your browser — no account, no server, no tracking. Your data lives in the browser's local storage; export a JSON backup from **Me → Settings → Data**.

## Features
- **Coach**: answers a few questions, builds a weekly plan around the days you pick, and adjusts weights to how you feel each day (daily check-in + double progression). Deload weeks, plateau detection and an 8-week plan refresh keep it working long-term.
- **Fast logging**: −/+ steppers, a ✓ per set that starts the rest timer, "last time" numbers to beat, screen kept awake, undo instead of pop-ups.
- **Freestyle**: choose-your-own-adventure workouts with XP, levels, badges and an exercise collection.
- **Vacation Circuit & Mobility**: guided, hands-free timers with voice cues; vacation mode pauses your gym schedule.
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
js/tools.js       rest timer, warm-up, sprints, history, calendar, progress
js/settings.js    settings, exercise library, workout days, backup/import/reset
js/coach.js       coach questionnaire, plan generator, check-ins, weight suggestions, exercise instructions
js/learn.js       "Did you know?" tips
js/freestyle.js   Freestyle mode + XP / levels / badges + exercise stat cards
js/vacation.js    Vacation circuit + vacation mode
js/muscledb.js    muscle database + recovery-aware exercise selection + spreadsheet view
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
