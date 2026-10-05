/* J3 WorkOut — js/data.js
   Constants & seed data: storage keys, time zone helpers, categories, icons, movement animations, the exercise library and default workout days.
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------------------------------------------------
   IRON LOG — Workout Tracker
   All data in localStorage. No external dependencies.
--------------------------------------------------------- */

// Test mode (index.html?test=1, used by tests/index.html) stores everything under a separate
// prefix so automated tests can never touch your real data.
const TEST_MODE = /[?&]test=1/.test(location.search);
const LS_PREFIX = TEST_MODE ? 'ironlogtest_' : 'ironlog_';
const LS_KEYS = { profile:'ironlog_profile', exercises:'ironlog_exercises', logs:'ironlog_logs', todayPlan:'ironlog_todayplan', lastBackup:'ironlog_lastbackup', activityLogs:'ironlog_activitylogs', workoutDays:'ironlog_workoutdays', sprintSessions:'ironlog_sprintsessions', sprintProgress:'ironlog_sprintprogress', checkins:'ironlog_checkins', prevWorkoutDays:'ironlog_workoutdays_prev', seenFacts:'ironlog_seenfacts', game:'ironlog_game', freestyle:'ironlog_freestyle', body:'ironlog_body', photos:'ironlog_photos' };
Object.keys(LS_KEYS).forEach(k=> LS_KEYS[k] = LS_KEYS[k].replace(/^ironlog_/, LS_PREFIX));

// --- Pacific Time pinning ---------------------------------------------------
// Every "today", timestamp, and calendar view in this app is anchored to
// Pacific Time (America/Los_Angeles — auto-adjusts for PDT/PST), regardless of
// what timezone the device itself is set to. Declared before DEFAULT_PROFILE
// below since it calls todayStr(), which depends on this.
const APP_TIMEZONE = 'America/Los_Angeles';
function pstParts(){
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE, year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }).formatToParts(new Date());
  const get = t => parts.find(p=>p.type===t).value;
  return { year:+get('year'), month:+get('month'), day:+get('day'), hour:+(get('hour')==='24'?'0':get('hour')), minute:+get('minute'), second:+get('second') };
}
function todayStr(){ const p = pstParts(); return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`; }
// Add/subtract whole days from a YYYY-MM-DD string, staying purely in calendar-date
// arithmetic (no timezone conversion), so it's safe to use anywhere.
function addDaysToDateStr(dateStr, delta){
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const DEFAULT_PROFILE = {
  height: "5'5\"",
  weight: 185,
  build: 'lean',
  startDate: todayStr(),
  showGifs: true // show the movement animation preview while logging/doing an exercise
};

/* ---------------- Categories, equipment & icons (full customization) ---------------- */
// "What it's for" — the muscle-group / movement dropdown. Each has a badge color and
// a default icon (used when an exercise doesn't have its own icon chosen).
const CATEGORIES = [
  { id:'legs-compound',  label:'Legs — Compound',      color:'var(--accent)',  defaultIcon:'legs' },
  { id:'legs-isolation', label:'Legs — Isolation',     color:'var(--legiso)',  defaultIcon:'calf' },
  { id:'glutes',         label:'Glutes',               color:'var(--glute)',   defaultIcon:'glutes' },
  { id:'chest',          label:'Chest',                color:'var(--blue)',    defaultIcon:'chest' },
  { id:'back',           label:'Back',                 color:'var(--purple)',  defaultIcon:'back' },
  { id:'shoulders',      label:'Shoulders',            color:'var(--accent2)', defaultIcon:'shoulders' },
  { id:'biceps',         label:'Biceps',               color:'var(--warn)',    defaultIcon:'biceps' },
  { id:'triceps',        label:'Triceps',              color:'var(--tricep)',  defaultIcon:'triceps' },
  { id:'core',           label:'Core / Abs',           color:'var(--core)',    defaultIcon:'core' },
  { id:'fullbody',       label:'Full Body',            color:'#ff8a5c',        defaultIcon:'fullbody' },
  { id:'conditioning',   label:'Conditioning / Cardio',color:'#4fd1c5',        defaultIcon:'stopwatch' }
];
// How it's loaded — Speediance, free weights, machines, or bodyweight-only.
const EQUIPMENT_TYPES = [
  { id:'speediance', label:'Speediance' },
  { id:'freeweight',  label:'Free Weight' },
  { id:'machine',     label:'Machine / Cable' },
  { id:'bodyweight',  label:'Bodyweight' }
];
function categoryDef(catId){ return CATEGORIES.find(c=>c.id===catId); }
function categoryLabel(catId){ const c = categoryDef(catId); return c ? c.label : (catId==='activity' ? 'Activity' : catId); }
function equipmentLabel(eqId){ const e = EQUIPMENT_TYPES.find(x=>x.id===eqId); return e ? e.label : ''; }

// 30 icon glyphs to choose from when building an exercise, plus one reserved 'activity'
// icon used only for Basketball/Other Sport day types (not offered in the exercise picker).
const ICON_LIBRARY = {
  legs:       { label:'Legs',            svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v5l-3 13"/><path d="M14 3v5l3 13"/><path d="M9 12h6"/></svg>` },
  calf:       { label:'Calf',            svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v8l-2 10"/><path d="M14 3v8l2 10"/><path d="M6 21h4M14 21h4"/></svg>` },
  glutes:     { label:'Glutes',          svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17c2-7 6-10 8-10s6 3 8 10"/><path d="M4 17h16"/></svg>` },
  chest:      { label:'Chest',           svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c-3 0-5.5 2-6.5 5-1.2 4 1 9.5 6.5 11.5 5.5-2 7.7-7.5 6.5-11.5-1-3-3.5-5-6.5-5z"/></svg>` },
  back:       { label:'Back',            svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v7"/><path d="M9 6l3-3 3 3"/><path d="M7 21l5-8 5 8"/></svg>` },
  shoulders:  { label:'Shoulders',       svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="9" r="3"/><circle cx="18" cy="9" r="3"/><path d="M6 12v8M18 12v8"/></svg>` },
  biceps:     { label:'Biceps',          svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c-1-7 1-12 6-12 3 0 3.5 3 1 4.5-3 1.8-1.5 5.5 3 5"/><circle cx="16" cy="8" r="2"/></svg>` },
  triceps:    { label:'Triceps',         svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7l7 7-7 7"/><path d="M12 14h7"/></svg>` },
  core:       { label:'Core',            svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="4" width="10" height="16" rx="3"/><path d="M7 9.5h10M7 14.5h10M12 4v16"/></svg>` },
  fullbody:   { label:'Full Body',       svg:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2 3 14h7l-1 8 11-14h-8l1-6z"/></svg>` },
  stopwatch:  { label:'Timed',           svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 13V8M9 3h6M12 3v1.5"/></svg>` },
  barbell:    { label:'Barbell',         svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M5 8v8M19 8v8"/><path d="M2 9.5v5M22 9.5v5"/></svg>` },
  dumbbell:   { label:'Dumbbell',        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9v6M18 9v6"/><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/><path d="M7 12h10"/></svg>` },
  kettlebell: { label:'Kettlebell',      svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9 9.5a3 3 0 0 1 6 0V11H9V9.5z"/></svg>` },
  plate:      { label:'Plate',           svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>` },
  bench:      { label:'Bench',           svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18"/><path d="M6 6v6M18 6v6"/><rect x="8" y="14" width="8" height="3" rx="1"/><path d="M9 17v3M15 17v3"/></svg>` },
  rack:       { label:'Rack / Machine',  svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18M19 3v18M5 9h14"/><path d="M3 21h4M17 21h4"/></svg>` },
  pulley:     { label:'Cable Pulley',    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v9"/><path d="M8 20l4-5 4 5"/></svg>` },
  pulldown:   { label:'Pulldown',        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="M9 7l3 3 3-3"/><path d="M5 17h14"/><path d="M7 17v4M17 17v4"/></svg>` },
  pullupbar:  { label:'Pull-Up Bar',     svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M9 5v3M15 5v3"/><circle cx="12" cy="11" r="1.5"/><path d="M12 12.5v4"/><path d="M12 14l-3 3M12 14l3 3"/></svg>` },
  dipbars:    { label:'Dip Bars',        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16"/><path d="M4 9h4M16 9h4"/></svg>` },
  rowmachine: { label:'Rowing Machine',  svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19h20"/><rect x="4" y="15" width="4" height="4" rx="1"/><path d="M8 17h9"/><path d="M17 13l3 4"/></svg>` },
  treadmill:  { label:'Treadmill',       svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="17" width="15" height="3" rx="1"/><path d="M17 17l3-7"/><circle cx="10" cy="6" r="1.6"/><path d="M10 7.5v4l-2.5 4.5M10 11.5l3 3"/></svg>` },
  bike:       { label:'Bike',            svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l5-9h4l3 9"/><path d="M11 8h-3"/></svg>` },
  jumprope:   { label:'Jump Rope',       svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1.6"/><path d="M12 6.5v5l-3 6"/><path d="M12 11.5l3 6"/><path d="M4 10c2-6 6-8 8-8s6 2 8 8"/></svg>` },
  medball:    { label:'Medicine Ball',   svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/></svg>` },
  band:       { label:'Resistance Band', svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><path d="M5.5 12c3-5 6 5 9 0s3-5 4.5-5"/></svg>` },
  ropes:      { label:'Battle Ropes',    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="3" cy="12" r="1.4"/><path d="M4 8c5 2 5 6 9 8s5 2 8-1"/><path d="M4 16c5-2 5-6 9-8s5-2 8 1"/></svg>` },
  boxjump:    { label:'Box Jump',        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="12" width="11" height="8"/><path d="M19 10V3"/><path d="M16 6l3-3 3 3"/></svg>` },
  speediance: { label:'Speediance',      svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="20" rx="1"/><path d="M9 8H3M15 8h6M9 15H3M15 15h6"/></svg>` },
  activity:   { label:'Activity',        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.7 5.7c2.8 3.5 2.8 9.1 0 12.6M18.3 5.7c-2.8 3.5-2.8 9.1 0 12.6"/></svg>` }
};
// The 30 keys offered in the "pick an icon" picker (everything except the reserved 'activity' one).
const PICKABLE_ICON_KEYS = Object.keys(ICON_LIBRARY).filter(k=>k!=='activity');

function iconBadge(ex, size){
  const cat = ex.category;
  const def = categoryDef(cat);
  const key = ex.icon || (def ? def.defaultIcon : 'activity');
  const info = ICON_LIBRARY[key] || ICON_LIBRARY['legs'];
  const cls = 'ex-icon cat-' + cat + (size==='sm' ? ' sm' : '');
  const label = def ? def.label : 'Activity';
  return `<div class="${cls}" title="${label}">${info.svg}</div>`;
}
function prescriptionLabel(ex){
  if(ex.repsAreTime) return `${ex.targetSets||4} rounds × ${ex.targetReps} work`;
  if(ex.unit === 'seconds') return `${ex.targetSets||3} sets × hold`;
  return `${ex.targetSets||3} sets × ${ex.targetReps||10} reps`;
}
// Best-guess numeric reps to pre-fill a set row with. Returns '' when the
// exercise is a timed circuit move (e.g. "40s work") where a rep count doesn't apply.
function defaultRepsValue(ex){
  if(!ex) return 10;
  if(ex.repsAreTime) return '';
  const n = parseInt(String(ex.targetReps), 10);
  return isNaN(n) ? 10 : n;
}
// Rough time-to-complete an exercise as prescribed. Assumes ~12–15 reps and 4 sets
// where an exercise doesn't specify otherwise, ~3s per rep, plus your current rest
// timer setting between sets.
function estimatedMinutes(ex){
  const sets = ex.targetSets || 4;
  let reps = parseInt(String(ex.targetReps), 10);
  if(isNaN(reps)) reps = 13; // midpoint of the assumed 12–15 rep range
  const restSeconds = (typeof timerTotal === 'number' && timerTotal > 0) ? timerTotal : 60;
  const totalSeconds = sets * (reps * 3 + restSeconds);
  return Math.max(1, Math.round(totalSeconds / 60));
}
function fmtMinutes(ex){ return '~' + estimatedMinutes(ex) + ' min'; }
function prescriptionWithTime(ex){ return prescriptionLabel(ex) + ' · ' + fmtMinutes(ex); }

/* ---------------- Movement preview animations ----------------
   Real exercise-demo GIFs are copyrighted footage from fitness sites, and this app makes
   no external requests — so instead, each category gets a small original animated stick-
   figure illustration (a simple 2-pose loop, the same trick real form-check GIFs use) that
   shows the basic movement pattern. Toggle on/off in Settings → Your Profile. */
const MOVEMENT_ANIMATIONS = {
  'legs-compound': { title:'Squat down, drive back up', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.ll-fig{transform-box:fill-box;transform-origin:50% 100%;animation:llsquat 1.4s ease-in-out infinite;}@keyframes llsquat{0%,100%{transform:scaleY(1);}50%{transform:scaleY(.72);}}</style><g class="ll-fig"><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="32" y2="42"/><line x1="50" y1="30" x2="68" y2="42"/></g></svg>` },
  'legs-isolation': { title:'Extend, then lower with control', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.li-shin{transform-box:fill-box;transform-origin:0% 0%;animation:liext 1.4s ease-in-out infinite;}@keyframes liext{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-35deg);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><g class="li-shin" style="transform-origin:50px 58px;"><line x1="50" y1="58" x2="64" y2="90"/></g><line x1="50" y1="30" x2="32" y2="42"/><line x1="50" y1="30" x2="68" y2="42"/></svg>` },
  'glutes': { title:'Drive your hips up, squeeze at the top', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.gl-fig{animation:glhip 1.2s ease-in-out infinite;}@keyframes glhip{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}</style><g class="gl-fig"><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="32" y2="42"/><line x1="50" y1="30" x2="68" y2="42"/></g></svg>` },
  'chest': { title:'Lower to your chest, press back up', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.ch-bar{transform-box:fill-box;transform-origin:50% 50%;animation:chpress 1.4s ease-in-out infinite;}@keyframes chpress{0%,100%{transform:translateY(0);}50%{transform:translateY(14px);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="34" y2="40"/><line x1="50" y1="30" x2="66" y2="40"/><g class="ch-bar"><line x1="20" y1="40" x2="80" y2="40" stroke-width="5"/><circle cx="20" cy="40" r="5" fill="currentColor"/><circle cx="80" cy="40" r="5" fill="currentColor"/></g></svg>` },
  'back': { title:'Pull the handle to your body, control it back', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.bk-handle{transform-box:fill-box;animation:bkrow 1.4s ease-in-out infinite;}@keyframes bkrow{0%,100%{transform:translateX(0);}50%{transform:translateX(-28px);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="34" x2="80" y2="34"/><g class="bk-handle"><circle cx="80" cy="34" r="5" fill="currentColor"/></g></svg>` },
  'shoulders': { title:'Press straight overhead, lower with control', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.sh-bar{transform-box:fill-box;animation:shpress 1.4s ease-in-out infinite;}@keyframes shpress{0%,100%{transform:translateY(0);}50%{transform:translateY(-26px);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><g class="sh-bar"><line x1="30" y1="40" x2="70" y2="40" stroke-width="5"/><circle cx="30" cy="40" r="5" fill="currentColor"/><circle cx="70" cy="40" r="5" fill="currentColor"/></g></svg>` },
  'biceps': { title:'Curl up slowly, squeeze, lower with control', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.bi-fore{transform-box:fill-box;transform-origin:0% 0%;animation:bicurl 1.3s ease-in-out infinite;}@keyframes bicurl{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-110deg);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="68" y2="48"/><g class="bi-fore" style="transform-origin:68px 48px;"><line x1="68" y1="48" x2="80" y2="66"/><circle cx="80" cy="66" r="4" fill="currentColor"/></g></svg>` },
  'triceps': { title:'Extend fully, then bend back with control', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.tr-fore{transform-box:fill-box;transform-origin:0% 0%;animation:triext 1.3s ease-in-out infinite;}@keyframes triext{0%,100%{transform:rotate(70deg);}50%{transform:rotate(0deg);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="60" y2="20"/><g class="tr-fore" style="transform-origin:60px 20px;"><line x1="60" y1="20" x2="60" y2="40"/><circle cx="60" cy="40" r="4" fill="currentColor"/></g></svg>` },
  'core': { title:'Crunch up, lower with control', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.co-fig{transform-box:fill-box;transform-origin:50% 0%;animation:cocrunch 1.3s ease-in-out infinite;}@keyframes cocrunch{0%,100%{transform:scaleY(1);}50%{transform:scaleY(.82);}}</style><g class="co-fig"><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="32" y2="42"/><line x1="50" y1="30" x2="68" y2="42"/></g></svg>` },
  'fullbody': { title:'Explosive full-body movement', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.fb-fig{animation:fbjump 1s ease-in-out infinite;}@keyframes fbjump{0%,100%{transform:translateY(0);}50%{transform:translateY(-16px);}}</style><g class="fb-fig"><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><line x1="50" y1="58" x2="36" y2="90"/><line x1="50" y1="58" x2="64" y2="90"/><line x1="50" y1="30" x2="30" y2="20"/><line x1="50" y1="30" x2="70" y2="20"/></g></svg>` },
  'conditioning': { title:'Keep a steady, sustained pace', svg:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><style>.cn-l1{transform-box:fill-box;transform-origin:0% 0%;animation:cnl1 .6s steps(2) infinite;}.cn-l2{transform-box:fill-box;transform-origin:0% 0%;animation:cnl2 .6s steps(2) infinite;}@keyframes cnl1{0%{transform:rotate(20deg);}50%{transform:rotate(-20deg);}100%{transform:rotate(20deg);}}@keyframes cnl2{0%{transform:rotate(-20deg);}50%{transform:rotate(20deg);}100%{transform:rotate(-20deg);}}</style><circle cx="50" cy="16" r="7" fill="none"/><line x1="50" y1="23" x2="50" y2="58"/><g class="cn-l1" style="transform-origin:50px 58px;"><line x1="50" y1="58" x2="36" y2="90"/></g><g class="cn-l2" style="transform-origin:50px 58px;"><line x1="50" y1="58" x2="64" y2="90"/></g><line x1="50" y1="30" x2="32" y2="42"/><line x1="50" y1="30" x2="68" y2="42"/></svg>` }
};
function movementPreviewHtml(ex){
  if(profile.showGifs === false) return '';
  const anim = MOVEMENT_ANIMATIONS[ex.category];
  if(!anim) return '';
  return `<div class="movement-preview">
    <div class="mp-figure">${anim.svg}</div>
    <div class="mp-label"><strong>How it's done</strong>${anim.title} — a simple looping illustration, not real footage. Turn this off anytime in Settings.</div>
  </div>`;
}

// Baseline weights calibrated for a BEGINNER lifter. Unless otherwise noted, new
// library entries default to 4 sets × 12–15 reps (per your own workout-day exercises
// keep whatever specific scheme they were built with).
const DEFAULT_EXERCISES = [
  // ================= LEGS — COMPOUND =================
  { id:'squat',         name:'Barbell Back Squat',        category:'legs-compound', equipment:'freeweight', icon:'barbell',   baseline:45, increment:5,  unit:'lb', targetSets:3, targetReps:10 },
  { id:'deadlift',      name:'Deadlift',                  category:'legs-compound', equipment:'freeweight', icon:'barbell',   baseline:65, increment:5,  unit:'lb', targetSets:3, targetReps:10 },
  { id:'legpress',      name:'Leg Press',                 category:'legs-compound', equipment:'machine',    icon:'rack',      baseline:90, increment:10, unit:'lb', targetSets:3, targetReps:10 },
  { id:'gobletsquat',   name:'Goblet / Speediance Squat',           category:'legs-compound', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'8–10' },
  { id:'frontsquat',    name:'Front Squat',               category:'legs-compound', equipment:'freeweight', icon:'barbell',   baseline:35, increment:5,  unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'sumodeadlift',  name:'Sumo Deadlift',              category:'legs-compound', equipment:'freeweight', icon:'barbell',   baseline:65, increment:5,  unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'trapbardl',     name:'Trap Bar Deadlift',          category:'legs-compound', equipment:'freeweight', icon:'barbell',   baseline:65, increment:5,  unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancesquat', name:'Speediance Squat',         category:'legs-compound', equipment:'speediance', icon:'speediance', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'bulgariansplitsquat', name:'Bulgarian Split Squat', category:'legs-compound', equipment:'freeweight', icon:'dumbbell',  baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'hacksquat',     name:'Hack Squat',                 category:'legs-compound', equipment:'machine',    icon:'rack',      baseline:90, increment:10, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedianceleg press', name:'Speediance Leg Press', category:'legs-compound', equipment:'speediance', icon:'speediance', baseline:40, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'bwsquat',       name:'Bodyweight Squat',           category:'legs-compound', equipment:'bodyweight', icon:'legs',      baseline:12, increment:2,  unit:'reps', targetSets:3, targetReps:'12–20' },
  { id:'stepup',        name:'Dumbbell Step-Up',           category:'legs-compound', equipment:'freeweight', icon:'dumbbell',  baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= LEGS — ISOLATION =================
  { id:'calfraise',     name:'Calf Raises',                category:'legs-isolation', equipment:'freeweight', icon:'calf', baseline:20, increment:5, unit:'lb', targetSets:3, targetReps:15 },
  { id:'legextension',  name:'Leg Extension',              category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'lyinglegcurl',  name:'Lying Leg Curl',             category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'seatedlegcurl', name:'Seated Leg Curl',            category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedianceextension', name:'Speediance Leg Extension', category:'legs-isolation', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancelegcurl', name:'Speediance Leg Curl',    category:'legs-isolation', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'seatedcalfraise', name:'Seated Calf Raise',        category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'standingcalfraise', name:'Standing Calf Raise',    category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'dbcalfraise',   name:'Dumbbell Calf Raise',        category:'legs-isolation', equipment:'freeweight', icon:'dumbbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'adductor',      name:'Hip Adductor Machine',       category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'abductor',      name:'Hip Abductor Machine',       category:'legs-isolation', equipment:'machine',    icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= GLUTES =================
  { id:'dbrdl',         name:'Dumbbell Romanian Deadlift', category:'glutes', equipment:'freeweight', icon:'dumbbell', baseline:20, increment:5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'hipthrust',     name:'Barbell Hip Thrust',         category:'glutes', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'glutebridge',   name:'Barbell Glute Bridge',       category:'glutes', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'cablekickback', name:'Cable Glute Kickback',       category:'glutes', equipment:'machine',    icon:'pulley', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedianceglutekickback', name:'Speediance Glute Kickback', category:'glutes', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'curtsylunge',   name:'Curtsy Lunge',               category:'glutes', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'singlelegbridge', name:'Single-Leg Glute Bridge',  category:'glutes', equipment:'bodyweight', icon:'glutes', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'sumosquat',     name:'Dumbbell Sumo Squat',        category:'glutes', equipment:'freeweight', icon:'dumbbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancehipthrust', name:'Speediance Hip Thrust', category:'glutes', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'donkeykick',    name:'Donkey Kick',                category:'glutes', equipment:'bodyweight', icon:'glutes', baseline:12, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },

  // ================= CHEST =================
  { id:'bench',         name:'Barbell Bench Press',        category:'chest', equipment:'freeweight', icon:'bench', baseline:45, increment:5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'pushup',        name:'Push-Up',                    category:'chest', equipment:'bodyweight', icon:'chest', baseline:10, increment:2, unit:'reps', targetSets:3, targetReps:10 },
  { id:'chestpress_speed', name:'Speediance Chest Press',  category:'chest', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'8–10' },
  { id:'cablefly_speed',   name:'Speediance Cable Fly',    category:'chest', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:3, targetReps:'12–15' },
  { id:'inclinedbpress',   name:'Incline Dumbbell Press',  category:'chest', equipment:'freeweight', icon:'dumbbell', baseline:15, increment:2.5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'inclinebarbell',  name:'Incline Barbell Bench Press', category:'chest', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'declinebench',    name:'Decline Bench Press',      category:'chest', equipment:'freeweight', icon:'bench', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'dbbench',         name:'Dumbbell Bench Press',     category:'chest', equipment:'freeweight', icon:'dumbbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'dbfly',           name:'Dumbbell Fly',             category:'chest', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedianceinclinepress', name:'Speediance Incline Press', category:'chest', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'machinechestpress', name:'Machine Chest Press',    category:'chest', equipment:'machine', icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'pecdeck',          name:'Pec Deck Fly',            category:'chest', equipment:'machine', icon:'rack', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'chestdip',         name:'Chest Dip',               category:'chest', equipment:'bodyweight', icon:'dipbars', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'landminepress',    name:'Landmine Press',          category:'chest', equipment:'freeweight', icon:'barbell', baseline:25, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancefly',    name:'Speediance Fly',          category:'chest', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= BACK =================
  { id:'row',            name:'Barbell Row',               category:'back', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'latpull',        name:'Speediance Lat Pulldown',   category:'back', equipment:'speediance', icon:'speediance', baseline:40, increment:5, unit:'lb', targetSets:4, targetReps:'8–10' },
  { id:'seatedrow_speed',name:'Speediance Seated Row',     category:'back', equipment:'speediance', icon:'speediance', baseline:30, increment:5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'dbbentrow',      name:'Dumbbell Bent-Over Row',    category:'back', equipment:'freeweight', icon:'dumbbell', baseline:15, increment:2.5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'facepull',       name:'Face Pulls',                category:'back', equipment:'machine', icon:'pulley', baseline:15, increment:2.5, unit:'lb', targetSets:3, targetReps:15 },
  { id:'pullup',         name:'Pull-Up',                   category:'back', equipment:'bodyweight', icon:'pullupbar', baseline:5, increment:1, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'chinup',         name:'Chin-Up',                   category:'back', equipment:'bodyweight', icon:'pullupbar', baseline:5, increment:1, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'tbarrow',        name:'T-Bar Row',                 category:'back', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'singlearmrow',   name:'Single-Arm Dumbbell Row',   category:'back', equipment:'freeweight', icon:'dumbbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancepulldown', name:'Speediance Pulldown',   category:'back', equipment:'speediance', icon:'speediance', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'cablerowwide',   name:'Cable Row (Wide Grip)',     category:'back', equipment:'machine', icon:'pulley', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'straightarmpulldown', name:'Straight-Arm Pulldown', category:'back', equipment:'machine', icon:'pulldown', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'widegriplatpulldown', name:'Wide-Grip Lat Pulldown', category:'back', equipment:'machine', icon:'pulldown', baseline:40, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancebentoverrow', name:'Speediance Bent-Over Row', category:'back', equipment:'speediance', icon:'speediance', baseline:20, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'invertedrow',    name:'Inverted Row',              category:'back', equipment:'bodyweight', icon:'pullupbar', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'rackpull',       name:'Rack Pull',                 category:'back', equipment:'freeweight', icon:'barbell', baseline:65, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'bandpullapart',  name:'Band Pull-Apart',           category:'back', equipment:'machine', icon:'band', baseline:5, increment:1, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= SHOULDERS =================
  { id:'ohp',            name:'Overhead Press',            category:'shoulders', equipment:'freeweight', icon:'barbell', baseline:35, increment:2.5, unit:'lb', targetSets:3, targetReps:10 },
  { id:'dbshoulder',     name:'Dumbbell Shoulder Press',   category:'shoulders', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:3, targetReps:'8–10' },
  { id:'lateralraise',   name:'Lateral Raises',            category:'shoulders', equipment:'freeweight', icon:'dumbbell', baseline:5, increment:2.5, unit:'lb', targetSets:3, targetReps:'12–15' },
  { id:'arnoldpress',    name:'Arnold Press',              category:'shoulders', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'militarypress',  name:'Military Press',            category:'shoulders', equipment:'freeweight', icon:'barbell', baseline:35, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedianceshoulderpress', name:'Speediance Shoulder Press', category:'shoulders', equipment:'speediance', icon:'speediance', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'frontraise',     name:'Front Raise',               category:'shoulders', equipment:'freeweight', icon:'dumbbell', baseline:5, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'reardeltfly',    name:'Rear Delt Fly',             category:'shoulders', equipment:'freeweight', icon:'dumbbell', baseline:5, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'uprightrow',     name:'Upright Row',               category:'shoulders', equipment:'freeweight', icon:'barbell', baseline:30, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancelateralraise', name:'Speediance Lateral Raise', category:'shoulders', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'machineshoulderpress', name:'Machine Shoulder Press', category:'shoulders', equipment:'machine', icon:'rack', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'cablelateralraise', name:'Cable Lateral Raise',    category:'shoulders', equipment:'machine', icon:'pulley', baseline:5, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= BICEPS =================
  { id:'curl',           name:'Dumbbell Bicep Curl',       category:'biceps', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:3, targetReps:12 },
  { id:'hammercurl',     name:'Hammer Curl',               category:'biceps', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:3, targetReps:12 },
  { id:'barbellcurl',    name:'Barbell Curl',              category:'biceps', equipment:'freeweight', icon:'barbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'preachercurl',   name:'Preacher Curl',             category:'biceps', equipment:'freeweight', icon:'barbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'concentrationcurl', name:'Concentration Curl',     category:'biceps', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'cablecurl',      name:'Cable Curl',                category:'biceps', equipment:'machine', icon:'pulley', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancecurl', name:'Speediance Bicep Curl',     category:'biceps', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'inclinedbcurl',  name:'Incline Dumbbell Curl',     category:'biceps', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'zottmancurl',    name:'Zottman Curl',              category:'biceps', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'ezbarcurl',      name:'EZ-Bar Curl',               category:'biceps', equipment:'freeweight', icon:'barbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= TRICEPS =================
  { id:'tricepspushdown', name:'Cable Triceps Pushdown',   category:'triceps', equipment:'machine', icon:'pulley', baseline:15, increment:5, unit:'lb', targetSets:3, targetReps:12 },
  { id:'skullcrusher',    name:'Skull Crusher',            category:'triceps', equipment:'freeweight', icon:'barbell', baseline:20, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'closegripbench',  name:'Close-Grip Bench Press',   category:'triceps', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'overheadtricepext', name:'Overhead Tricep Extension', category:'triceps', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancetricepext', name:'Speediance Tricep Extension', category:'triceps', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'tricepkickback',  name:'Tricep Kickback',          category:'triceps', equipment:'freeweight', icon:'dumbbell', baseline:5, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'tricepdip',       name:'Tricep Dip',               category:'triceps', equipment:'bodyweight', icon:'dipbars', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'ropepushdown',    name:'Rope Pushdown',            category:'triceps', equipment:'machine', icon:'pulley', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedianceTricepkickback', name:'Speediance Tricep Kickback', category:'triceps', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= CORE / ABS =================
  { id:'plank',          name:'Plank Hold',                category:'core', equipment:'bodyweight', icon:'core', baseline:20, increment:10, unit:'seconds', targetSets:3, targetReps:10 },
  { id:'russiantwist',   name:'Russian Twist',             category:'core', equipment:'bodyweight', icon:'medball', baseline:12, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'hanginglegraise', name:'Hanging Leg Raise',        category:'core', equipment:'bodyweight', icon:'pullupbar', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'cablewoodchopper', name:'Cable Woodchopper',       category:'core', equipment:'machine', icon:'pulley', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speediancewoodchopper', name:'Speediance Woodchopper', category:'core', equipment:'speediance', icon:'speediance', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'abwheel',        name:'Ab Wheel Rollout',          category:'core', equipment:'bodyweight', icon:'core', baseline:8, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'bicyclecrunch',  name:'Bicycle Crunch',            category:'core', equipment:'bodyweight', icon:'core', baseline:15, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'sideplank',      name:'Side Plank',                category:'core', equipment:'bodyweight', icon:'core', baseline:20, increment:10, unit:'seconds', targetSets:4, targetReps:'12–15' },
  { id:'vup',            name:'V-Up',                      category:'core', equipment:'bodyweight', icon:'core', baseline:12, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'cablecrunch',    name:'Cable Crunch',              category:'core', equipment:'machine', icon:'pulley', baseline:30, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'deadbug',        name:'Dead Bug',                  category:'core', equipment:'bodyweight', icon:'core', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },

  // ================= FULL BODY =================
  { id:'squattopress',   name:'Speediance Squat-to-Press',  category:'fullbody', equipment:'speediance', icon:'speediance', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'40s', repsAreTime:true },
  { id:'renegaderow',    name:'Dumbbell Renegade Row',      category:'fullbody', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'40s', repsAreTime:true },
  { id:'lunge',          name:'Speediance Cable Lunge / Walking Lunge', category:'fullbody', equipment:'speediance', icon:'speediance', baseline:10, increment:2.5, unit:'lb', targetSets:3, targetReps:'12/leg' },
  { id:'cleanandpress',  name:'Clean and Press',            category:'fullbody', equipment:'freeweight', icon:'barbell', baseline:45, increment:5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'thruster',       name:'Dumbbell Thruster',          category:'fullbody', equipment:'freeweight', icon:'dumbbell', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'manmaker',       name:'Man Maker',                  category:'fullbody', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'speedthruster',  name:'Speediance Thruster',         category:'fullbody', equipment:'speediance', icon:'speediance', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'turkishgetup',   name:'Turkish Get-Up',              category:'fullbody', equipment:'freeweight', icon:'kettlebell', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'wallball',       name:'Wall Ball',                   category:'fullbody', equipment:'freeweight', icon:'medball', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'devilspress',    name:'Devil\'s Press',              category:'fullbody', equipment:'freeweight', icon:'dumbbell', baseline:10, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },
  { id:'bearcrawl',      name:'Bear Crawl',                  category:'fullbody', equipment:'bodyweight', icon:'fullbody', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'12–15' },
  { id:'burpee',         name:'Burpee',                      category:'fullbody', equipment:'bodyweight', icon:'fullbody', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'plateoverhead',  name:'Plate Ground-to-Overhead',    category:'fullbody', equipment:'freeweight', icon:'plate', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'12–15' },

  // ================= CONDITIONING / CARDIO =================
  { id:'kbswing',        name:'Kettlebell / Dumbbell Swing', category:'conditioning', equipment:'freeweight', icon:'kettlebell', baseline:15, increment:2.5, unit:'lb', targetSets:4, targetReps:'40s', repsAreTime:true },
  { id:'mtnclimbers',    name:'Mountain Climbers',           category:'conditioning', equipment:'bodyweight', icon:'fullbody', baseline:0, increment:0, unit:'reps', targetSets:4, targetReps:'40s', repsAreTime:true },
  { id:'jumprope',       name:'Jump Rope',                   category:'conditioning', equipment:'bodyweight', icon:'jumprope', baseline:60, increment:15, unit:'seconds', targetSets:4, targetReps:'12–15' },
  { id:'rowmachinecal',  name:'Rowing Machine Interval',     category:'conditioning', equipment:'machine', icon:'rowmachine', baseline:60, increment:15, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'assaultbike',    name:'Assault Bike Sprint',         category:'conditioning', equipment:'machine', icon:'bike', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'treadmillsprint',name:'Treadmill Sprint',            category:'conditioning', equipment:'machine', icon:'treadmill', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'battleropes',    name:'Battle Ropes',                category:'conditioning', equipment:'machine', icon:'ropes', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'boxjump',        name:'Box Jump',                    category:'conditioning', equipment:'bodyweight', icon:'boxjump', baseline:10, increment:2, unit:'reps', targetSets:4, targetReps:'12–15' },
  { id:'sledpush',       name:'Sled Push',                   category:'conditioning', equipment:'machine', icon:'rack', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'highknees',      name:'High Knees',                  category:'conditioning', equipment:'bodyweight', icon:'stopwatch', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'jumpingjacks',   name:'Jumping Jacks',               category:'conditioning', equipment:'bodyweight', icon:'stopwatch', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true },
  { id:'speedianceconditioning', name:'Speediance Conditioning Circuit', category:'conditioning', equipment:'speediance', icon:'speediance', baseline:30, increment:10, unit:'seconds', targetSets:4, targetReps:'30s', repsAreTime:true }
];

/* ---------------- Workout split — fully customizable in Settings ----------------
   DEFAULT_WORKOUT_DAYS is only the seed data. The live WORKOUT_DAYS list (loaded
   below, after LS_KEYS/loadJSON exist) is what's actually read and edited — so
   renaming a day, changing its exercises, or adding/removing whole days persists. */
const DEFAULT_WORKOUT_DAYS = [
  {
    id:'push', dayLabel:'Day 1', title:'Push', subtitle:'Chest, Shoulders, Triceps', duration:'60 min', badge:'Non-activity day', category:'chest',
    warmup:{ duration:'5 min', description:'Arm circles, band pull-aparts, light ramp-up sets' },
    lifts:['chestpress_speed','dbshoulder','cablefly_speed','inclinedbpress','lateralraise','tricepspushdown'],
    finisher:{ title:'Finisher', duration:'15 min', description:'Fast-paced circuit — push-ups, jump squats, mountain climbers (40s work / 20s rest)' }
  },
  {
    id:'pull', dayLabel:'Day 2', title:'Pull', subtitle:'Back, Biceps', duration:'60 min', badge:null, category:'back',
    warmup:{ duration:'5 min', description:'General warm-up' },
    lifts:['latpull','seatedrow_speed','dbbentrow','facepull','curl','hammercurl'],
    finisher:{ title:'Finisher', duration:'15 min', description:'Kettlebell/dumbbell swings, jump rope, or mountain climbers' }
  },
  {
    id:'legs', dayLabel:'Day 3', title:'Legs', subtitle:'Quads, Hamstrings, Glutes, Calves', duration:'60 min', badge:null, category:'legs-compound',
    warmup:{ duration:'5 min', description:'Bodyweight squats, leg swings' },
    lifts:['gobletsquat','dbrdl','lunge','calfraise'],
    finisher:{ title:'Finisher', duration:'15 min', description:'Incline walk, bike, or jump rope' }
  },
  {
    id:'fullbody', dayLabel:'Day 4', title:'Full Body', subtitle:'Full Body + Conditioning', duration:'60 min', badge:null, category:'fullbody',
    warmup:{ duration:'5 min', description:'General warm-up' },
    circuitTitle:'Circuit × 4 rounds (40s work / 20s rest)',
    lifts:['squattopress','renegaderow','kbswing','mtnclimbers'],
    finisher:{ title:'Core Finisher', duration:'10 min', description:'Plank variations' },
    cardio:{ title:'Steady-State Cardio', duration:'10–15 min', description:'Walk or bike' }
  }
];

// Non-lifting "I was active today" options — logged as hours, not sets/reps.
const ACTIVITY_TYPES = [
  { id:'basketball', title:'Basketball', subtitle:'Pickup, league, or shooting around', category:'activity', custom:false },
  { id:'othersport',  title:'Other Sport', subtitle:'Tennis, soccer, swimming, hiking…', category:'activity', custom:true }
];

