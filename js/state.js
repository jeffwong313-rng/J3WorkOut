/* J3 WorkOut — js/state.js
   Loaded state (profile, exercises, logs…), storage helpers, week / overload math, calorie estimates.
   Loaded as a classic <script> in index.html order; files share globals. */

// --- One-time migration: exercises saved under the old 7-category taxonomy get
// remapped to the new one so existing local data keeps working after this upgrade.
const LEGACY_CATEGORY_MAP = {
  'lower-compound':'legs-compound', 'upper-compound':'chest', 'upper-accessory':'back',
  'accessory':'shoulders', 'bodyweight':'core', 'fullbody':'fullbody', 'conditioning':'conditioning', 'activity':'activity'
};
const EXERCISE_SCHEMA_VERSION = 2;
function migrateExercises(list){
  const defaultsById = {}; DEFAULT_EXERCISES.forEach(d=> defaultsById[d.id]=d);
  const migrated = list.map(ex=>{
    const canonical = defaultsById[ex.id];
    if(canonical){
      // Known exercise: keep the user's own numbers, adopt the new taxonomy fields.
      return Object.assign({}, canonical, {
        baseline: ex.baseline, increment: ex.increment, targetSets: ex.targetSets,
        targetReps: ex.targetReps, repsAreTime: ex.repsAreTime
      });
    }
    // Unknown (user-added) exercise: best-effort remap of its old category string.
    if(!categoryDef(ex.category)){
      const mapped = LEGACY_CATEGORY_MAP[ex.category] || 'fullbody';
      return Object.assign({}, ex, { category: mapped, equipment: ex.equipment || (ex.unit==='lb' ? 'freeweight' : 'bodyweight') });
    }
    return ex;
  });
  const knownIds = new Set(migrated.map(e=>e.id));
  DEFAULT_EXERCISES.forEach(d=>{ if(!knownIds.has(d.id)) migrated.push(JSON.parse(JSON.stringify(d))); });
  return migrated;
}

let profile = loadJSON(LS_KEYS.profile, DEFAULT_PROFILE);
let exercises = loadJSON(LS_KEYS.exercises, DEFAULT_EXERCISES);
{
  const storedSchemaVersion = parseInt(localStorage.getItem(LS_PREFIX+'exschema')||'1', 10);
  if(storedSchemaVersion < EXERCISE_SCHEMA_VERSION){
    exercises = migrateExercises(exercises);
    localStorage.setItem(LS_PREFIX+'exschema', String(EXERCISE_SCHEMA_VERSION));
    save(LS_KEYS.exercises, exercises);
  }
}
// Additive: exercises introduced after the schema migration (coach update) are added once.
if(!localStorage.getItem(LS_PREFIX+'exadds_coach')){
  ['bwsquat'].forEach(id=>{ if(!exercises.some(e=>e.id===id)){ const d = DEFAULT_EXERCISES.find(x=>x.id===id); if(d) exercises.push(JSON.parse(JSON.stringify(d))); } });
  localStorage.setItem(LS_PREFIX+'exadds_coach','1');
  save(LS_KEYS.exercises, exercises);
}
let logs = loadJSON(LS_KEYS.logs, []);
let activityLogs = loadJSON(LS_KEYS.activityLogs, []); // non-lifting "I was active" entries: {id,date,activityId,label,hours,notes}
let WORKOUT_DAYS = loadJSON(LS_KEYS.workoutDays, DEFAULT_WORKOUT_DAYS); // fully editable in Settings → Workout Days
// Backfill dayLabel (the editable "Day 1" text) for anything saved before this field
// existed, so every day always has one to display and edit.
WORKOUT_DAYS.forEach((d, i)=>{ if(d.dayLabel == null) d.dayLabel = 'Day ' + (i+1); });
function saveWorkoutDays(){ save(LS_KEYS.workoutDays, WORKOUT_DAYS); }
let selectedExerciseId = exercises.length ? exercises[0].id : null;
let planPickerExpanded = true;       // Workout Plan: whether the day picker is expanded or collapsed to a strip
let calendarViewDate = (()=>{ const p = pstParts(); return new Date(p.year, p.month-1, 1); })();
let calendarSelectedDate = null;
let sprintSessions = loadJSON(LS_KEYS.sprintSessions, []); // completed (or partially-completed) HIIT sessions
let sprintInterval = null;   // countdown timer handle for the active sprint/rest phase (in-memory only)
let sprintRunning = false;
let checkins = loadJSON(LS_KEYS.checkins, []); // daily readiness check-ins: {id,date,feel,sleep,sore,readiness,dayId}

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return JSON.parse(JSON.stringify(fallback));
    return JSON.parse(raw);
  }catch(e){ return JSON.parse(JSON.stringify(fallback)); }
}
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function saveAll(){ save(LS_KEYS.profile, profile); save(LS_KEYS.exercises, exercises); save(LS_KEYS.logs, logs); save(LS_KEYS.activityLogs, activityLogs); save(LS_KEYS.workoutDays, WORKOUT_DAYS); save(LS_KEYS.sprintSessions, sprintSessions); save(LS_KEYS.checkins, checkins); }

function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._h);
  showToast._h = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---------------- Week / overload math ---------------- */

// ISO-ish week number relative to program start date. Week 1 = start date's week.
function weekNumberForDate(dateStr){
  const start = new Date(profile.startDate + 'T00:00:00');
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.floor((d - start) / (1000*60*60*24));
  return Math.max(1, Math.floor(diffDays/7) + 1);
}
function currentWeekNumber(){ return weekNumberForDate(todayStr()); }

// Climbs happen every OTHER week: weeks 1-2 = climb 0, weeks 3-4 = climb 1, weeks 5-6 = climb 2, ...
function climbCountForWeek(week){ return Math.floor((week-1)/2); }

function targetForExerciseAtWeek(ex, week){
  const climbs = climbCountForWeek(week);
  return round2(ex.baseline + climbs * ex.increment);
}
function round2(n){ return Math.round(n*100)/100; }

function weeksUntilNextClimb(){
  const w = currentWeekNumber();
  // climb happens at the start of every odd->even boundary: weeks 3,5,7...
  // find next week number where climbCount increases
  const currentClimb = climbCountForWeek(w);
  let nextWeek = w;
  while(climbCountForWeek(nextWeek) === currentClimb){ nextWeek++; }
  return nextWeek - w;
}

function fmtWeight(ex, val){
  if(ex.unit === 'reps') return val + ' reps';
  if(ex.unit === 'seconds') return val + ' sec';
  return val + ' lb';
}

/* ---------------- Calories burned (estimate) ----------------
   Standard MET formula: calories = MET × bodyweight(kg) × duration(hours).
   - MET (metabolic equivalent) is assigned per exercise category / activity.
   - Duration for a lift is estimated from its reps (work time) plus your
     current rest-timer setting between sets (see REST_SECONDS below).
   - The weight you actually lifted, relative to your own baseline for that
     move, nudges the intensity up or down slightly — lifting heavier than
     your usual baseline burns a bit more, lighter a bit less.
   This is an estimate for motivation/tracking, not a lab measurement. */
const CATEGORY_MET = {
  'lower-compound': 6, 'upper-compound': 5, 'upper-accessory': 4.5,
  'accessory': 3.5, 'bodyweight': 4, 'fullbody': 8, 'conditioning': 8
};
const ACTIVITY_MET = { basketball: 6.5, othersport: 7, vacation: 8, mobility: 2.5 }; // vacation = bodyweight HIIT-style circuit
const SECONDS_PER_REP = 3; // rough cadence for one rep, up + down

function bodyweightKg(){ return (profile.weight || 150) * 0.453592; }

function caloriesForExerciseLog(log){
  const ex = exercises.find(e=>e.id===log.exerciseId);
  if(!ex || !log.sets || !log.sets.length) return 0;
  const baseMet = CATEGORY_MET[ex.category] || 4;
  let met = baseMet;
  if(ex.unit === 'lb' && ex.baseline > 0){
    const avgWeight = log.sets.reduce((s,st)=> s + (st.weight||0), 0) / log.sets.length;
    const nudge = Math.max(-0.15, Math.min(0.3, (avgWeight / ex.baseline) - 1));
    met = baseMet * (1 + nudge);
  }
  const restSeconds = (typeof timerTotal === 'number' && timerTotal > 0) ? timerTotal : 60;
  const totalSeconds = log.sets.reduce((sum,st)=> sum + Math.max(st.reps,1) * SECONDS_PER_REP + restSeconds, 0);
  return met * bodyweightKg() * (totalSeconds / 3600);
}
function caloriesForActivityLog(a){
  const met = ACTIVITY_MET[a.activityId] || 6;
  return met * bodyweightKg() * (a.hours || 0);
}
function totalCaloriesForDate(dateStr){
  const exCals = logs.filter(l=>l.date===dateStr).reduce((s,l)=> s + caloriesForExerciseLog(l), 0);
  const actCals = activityLogs.filter(a=>a.date===dateStr).reduce((s,a)=> s + caloriesForActivityLog(a), 0);
  return exCals + actCals;
}
function fmtCalories(n){ return Math.round(n).toLocaleString() + ' cal'; }

// Consecutive days (ending today or yesterday, PT) with at least one logged workout.
function currentStreak(){
  const loggedDates = new Set([...logs.map(l=>l.date), ...activityLogs.map(a=>a.date)]);
  let streak = 0;
  let cursor = todayStr();
  if(!loggedDates.has(cursor)) cursor = addDaysToDateStr(cursor, -1);
  while(loggedDates.has(cursor)){ streak++; cursor = addDaysToDateStr(cursor, -1); }
  return streak;
}

