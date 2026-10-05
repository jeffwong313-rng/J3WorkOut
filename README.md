# J3 WorkOut

A personal workout coach that runs entirely in your browser — no account, no server, no tracking. Your data lives in the browser's local storage; export a JSON backup from **Me → Settings → Data**.

## Features
- **Coach** — answers a few questions, builds a weekly plan around the days you pick, and adjusts weights to how you feel each day (daily check-in + double progression).
- **Freestyle** — choose-your-own-adventure workouts with XP, levels, badges and an exercise collection.
- **Vacation Circuit** — guided no-gym hotel circuit with voice cues; vacation mode pauses your gym schedule.
- **Muscle database** — primary / secondary / tertiary muscles for every exercise; sore or injured areas are automatically avoided.
- **Learn** — "Did you know?" tips (anatomy, exercise research, ideas paraphrased from the Huberman Lab podcast).
- Progress records, calendar, history, warm-up, sprints and more.

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
