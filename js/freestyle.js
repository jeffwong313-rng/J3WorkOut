/* J3 WorkOut — js/freestyle.js
   Freestyle (choose-your-own-adventure) + XP, levels, badges, exercise stat cards.
   Loaded as a classic <script> in index.html order; files share globals. */

/* =====================================================================
   FREESTYLE — choose-your-own-adventure workouts + gamification
   Answer a few questions → get 2 recommended exercises → after each one
   choose your path: same muscle, a neighbor muscle, something totally
   different, or "try something new". XP, levels, badges and an exercise
   collection make it a game; the same weight-progression engine and
   recovery rules keep it effective.
   ===================================================================== */

/* ---------------- Gamification: XP, levels, badges ---------------- */
let game = loadJSON(LS_KEYS.game, { xp:0, badges:[], prs:0, sessions:0, tryNew:0, maxCombo:0 });
function saveGame(){ save(LS_KEYS.game, game); }
// All XP goes through here so the monthly recap can show XP earned per month.
function gainXP(n){
  game.xp = (game.xp||0) + n;
  const k = todayStr().slice(0,7);
  game.xpByMonth = game.xpByMonth || {};
  game.xpByMonth[k] = (game.xpByMonth[k]||0) + n;
}
const XP_PER_LEVEL = 300;
const LEVEL_TITLES = ['Rookie','Apprentice','Iron Explorer','Gym Adventurer','Barbell Knight','Rep Ranger','Iron Sage','Legend'];
function levelInfo(xp){
  const lvl = Math.floor((xp||0) / XP_PER_LEVEL) + 1;
  return { lvl, title: LEVEL_TITLES[Math.min(lvl-1, LEVEL_TITLES.length-1)], into: (xp||0) % XP_PER_LEVEL, per: XP_PER_LEVEL };
}
function discoveredIds(){ return new Set(logs.map(l=>l.exerciseId).filter(id=>exercises.some(e=>e.id===id))); }
function neverDone(ex){ return !logs.some(l=>l.exerciseId===ex.id); }
function timesDone(ex){ return new Set(logs.filter(l=>l.exerciseId===ex.id).map(l=>l.date)).size; }

const BADGES = [
  { id:'first_rep',   emoji:'🥇', label:'First Rep',      desc:'Log your first exercise',                 test:()=> logs.length >= 1 },
  { id:'adventurer',  emoji:'🧭', label:'Adventurer',     desc:'Finish a Freestyle session',              test:()=> game.sessions >= 1 },
  { id:'explorer5',   emoji:'🔭', label:'Explorer',       desc:'Try 5 different exercises',               test:()=> discoveredIds().size >= 5 },
  { id:'explorer15',  emoji:'🗺️', label:'Cartographer',   desc:'Try 15 different exercises',              test:()=> discoveredIds().size >= 15 },
  { id:'explorer40',  emoji:'🏛️', label:'Collector',      desc:'Try 40 different exercises',              test:()=> discoveredIds().size >= 40 },
  { id:'brave',       emoji:'🎲', label:'Brave Soul',     desc:'Complete 3 "Try something new" picks',    test:()=> (game.tryNew||0) >= 3 },
  { id:'combo3',      emoji:'🔀', label:'Combo',          desc:'Train 3 muscle groups in one Freestyle',  test:()=> (game.maxCombo||0) >= 3 },
  { id:'pr1',         emoji:'📈', label:'New Best',       desc:'Set a personal record',                   test:()=> (game.prs||0) >= 1 },
  { id:'pr10',        emoji:'🚀', label:'PR Hunter',      desc:'Set 10 personal records',                 test:()=> (game.prs||0) >= 10 },
  { id:'allround',    emoji:'🌐', label:'All-Rounder',    desc:'Train every muscle group at least once',  test:()=> FS_MUSCLES.every(m=> logs.some(l=>{ const ex = exercises.find(e=>e.id===l.exerciseId); return ex && fsMuscleOf(ex) === m.id; })) },
  { id:'consistent',  emoji:'🔥', label:'Consistent',     desc:'Hit 5 planned sessions in a row',         test:()=> planStreak() >= 5 },
  { id:'level5',      emoji:'⚔️', label:'Barbell Knight', desc:'Reach level 5',                           test:()=> levelInfo(game.xp).lvl >= 5 }
];
function checkBadges(){
  const newly = [];
  BADGES.forEach(b=>{ if(!game.badges.includes(b.id) && b.test()){ game.badges.push(b.id); newly.push(b); } });
  if(newly.length){
    saveGame();
    setTimeout(()=> showToast('🏅 Badge unlocked: ' + newly.map(b=>b.emoji + ' ' + b.label).join(', ')), 1400);
  }
  return newly;
}
// XP for any logged exercise (structured plan, Log Workout or Freestyle). Call BEFORE pushing the log.
function awardForLog(ex, sets){
  const prev = logs.filter(l=>l.exerciseId===ex.id);
  const firstTime = prev.length === 0;
  const prevBest = prev.reduce((m,l)=> Math.max(m, ...l.sets.map(s=>s.weight||0)), 0);
  const top = Math.max(0, ...sets.map(s=>s.weight||0));
  const pr = !firstTime && top > prevBest && prevBest > 0;
  const parts = [`+${sets.length*10} sets`];
  let xp = sets.length * 10;
  if(firstTime){ xp += 50; parts.push('+50 🆕 discovery'); }
  if(pr){ xp += 25; parts.push('+25 📈 PR'); game.prs = (game.prs||0) + 1; }
  const before = levelInfo(game.xp).lvl;
  gainXP(xp);
  const after = levelInfo(game.xp);
  saveGame();
  if(after.lvl > before) setTimeout(()=> showToast(`⬆️ Level up! Level ${after.lvl} — ${after.title}`), 2600);
  return { xp, firstTime, pr, parts };
}

/* ---------------- Muscles, stats & anatomy ---------------- */
const FS_MUSCLES = [
  { id:'chest',        label:'Chest',               region:'upper', cat:'chest' },
  { id:'back',         label:'Back',                region:'upper', cat:'back' },
  { id:'shoulders',    label:'Shoulders',           region:'upper', cat:'shoulders' },
  { id:'biceps',       label:'Biceps',              region:'upper', cat:'biceps' },
  { id:'triceps',      label:'Triceps',             region:'upper', cat:'triceps' },
  { id:'quads',        label:'Quads',               region:'lower', cat:'legs-compound' },
  { id:'hamstrings',   label:'Hamstrings',          region:'lower', cat:'legs-isolation' },
  { id:'glutes',       label:'Glutes',              region:'lower', cat:'glutes' },
  { id:'calves',       label:'Calves',              region:'lower', cat:'legs-isolation' },
  { id:'core',         label:'Core / Abs',          region:'core',  cat:'core' },
  { id:'conditioning', label:'Full Body & Cardio',  region:'cardio',cat:'conditioning' }
];
const FS_REGIONS = { upper:'Upper body', lower:'Lower body', core:'Core', cardio:'Conditioning' };
function fsMuscleDef(id){ return FS_MUSCLES.find(m=>m.id===id); }
function fsMuscleOf(ex){
  if(FACT_MUSCLE_BY_EX[ex.id]) return FACT_MUSCLE_BY_EX[ex.id][0];
  if(ex.category === 'fullbody' || ex.category === 'conditioning') return 'conditioning';
  return TIP_CATEGORY_MUSCLE[ex.category] || null;
}
// Neighbors = same area of the body, chosen so the muscle you just worked gets a break.
const FS_NEIGHBORS = {
  biceps:['triceps','back'], triceps:['biceps','chest'], chest:['back','shoulders'], back:['chest','biceps'],
  shoulders:['back','triceps'], quads:['hamstrings','glutes'], hamstrings:['quads','calves'], glutes:['hamstrings','quads'],
  calves:['glutes','quads'], core:['glutes','back'], conditioning:['core','glutes']
};
const FS_WHY = {
  'biceps>triceps':'Opposite side of the arm — your biceps rest while your triceps work. A classic arm "superset".',
  'triceps>biceps':'Opposite side of the arm — your triceps rest while your biceps work.',
  'chest>back':'Push → pull. Balancing pressing with pulling keeps your shoulders healthy and posture upright.',
  'back>chest':'Pull → push. Your back recovers while your chest works.',
  'quads>hamstrings':'Front of the leg → back of the leg. Balanced legs are stronger and less injury-prone.',
  'hamstrings>quads':'Back of the leg → front of the leg.',
  'shoulders>back':'Your rear delts and upper back balance out all the pressing.',
  'biceps>back':'Rows and pulldowns still use biceps a little — a bigger muscle takes over.',
  'triceps>chest':'Pressing uses triceps too, but now your chest leads.',
  'chest>shoulders':'Same pushing family — careful, front delts already worked during chest presses.',
  'glutes>hamstrings':'Glutes and hamstrings are teammates in every hip hinge.',
  'core>glutes':'Strong glutes and core together protect your lower back.'
};
const FS_SECONDARY = {
  chest:['triceps','shoulders'], back:['biceps','forearms','traps'], shoulders:['triceps','traps'], biceps:['forearms'],
  triceps:[], quads:['glutes','core'], hamstrings:['glutes','lowerback'], glutes:['hamstrings','lowerback'], calves:[], core:[],
  conditioning:['hamstrings','calves','chest']
};
const FS_REGION_MAP = {
  chest:['chest'], back:['lats','traps'], shoulders:['shoulders'], biceps:['biceps'], triceps:['triceps'],
  quads:['quads'], hamstrings:['hamstrings'], glutes:['glutes'], calves:['calves'], core:['core'],
  conditioning:['quads','glutes','core','shoulders']
};
// Body-map regions for each database muscle.
const MUSCLE_TO_REGION = { chest:'chest', fdelt:'shoulders', sdelt:'shoulders', rdelt:'shoulders', tri:'triceps', bi:'biceps', fore:'forearms',
  lats:'lats', upback:'traps', lowback:'lowerback', abs:'core', obl:'core', hipflex:'quads', glutes:'glutes', abd:'glutes', add:'quads', quads:'quads', hams:'hamstrings', calves:'calves' };
function exAnatomy(ex){
  const m = exMuscles(ex);
  const reg = list => [...new Set(list.map(k=>MUSCLE_TO_REGION[k]).filter(Boolean))];
  const primary = reg(m.P);
  const secondary = reg(m.S).filter(r=>!primary.includes(r));
  const tertiary = reg(m.T).filter(r=>!primary.includes(r) && !secondary.includes(r));
  return { primary, secondary, tertiary, muscles: m };
}
const REGION_LABEL = { chest:'Chest', shoulders:'Shoulders', biceps:'Biceps', triceps:'Triceps', forearms:'Forearms', core:'Abs & core', traps:'Upper back / traps', lats:'Lats', lowerback:'Lower back', glutes:'Glutes', quads:'Quads', hamstrings:'Hamstrings', calves:'Calves' };

const COMPOUND_IDS = new Set(Object.values(SLOT_POOLS).filter(p=>p.compound).flatMap(p=>p.ids)
  .concat(['row','tbarrow','chestdip','pullup','chinup','closegripbench','declinebench','ohp','militarypress','rackpull','sumodeadlift','frontsquat','landminepress','uprightrow','tricepdip','speediancebentoverrow','rackpull']));
function isCompoundEx(ex){ return COMPOUND_IDS.has(ex.id) || ex.category === 'legs-compound' || ex.category === 'fullbody'; }
const HARD_IDS = new Set(['squat','deadlift','frontsquat','sumodeadlift','pullup','chinup','hanginglegraise','abwheel','turkishgetup','manmaker','devilspress','cleanandpress','burpee','boxjump','chestdip','skullcrusher','bulgariansplitsquat','vup','row','tbarrow']);
function exDifficulty(ex){
  if(HARD_IDS.has(ex.id)) return 3;
  if(ex.equipment === 'machine' || ex.equipment === 'speediance') return 1;
  if(isCompoundEx(ex) && (ex.icon === 'barbell')) return 3;
  if(isCompoundEx(ex)) return 2;
  return 1;
}
const BALANCE_IDS = new Set(['bulgariansplitsquat','lunge','stepup','curtsylunge','singlelegbridge','turkishgetup','renegaderow','singlearmrow','bearcrawl','sideplank','deadbug']);
function exStats(ex){
  const comp = isCompoundEx(ex);
  const cardio = ex.category === 'conditioning' ? 5 : ex.category === 'fullbody' ? 4 : (comp && ex.category === 'legs-compound') ? 2 : 1;
  const strength = ex.category === 'conditioning' ? 1 : comp ? (ex.icon === 'barbell' ? 5 : 4) : 2;
  const muscle = ex.category === 'conditioning' ? 2 : comp ? 4 : 4;
  let stability = BALANCE_IDS.has(ex.id) ? 5 : ex.category === 'core' ? 4 : ex.equipment === 'freeweight' ? 3 : ex.equipment === 'bodyweight' ? 3 : ex.equipment === 'speediance' ? 2 : 1;
  return { strength, muscle, stability, cardio };
}
function pips(n, max){ let h=''; for(let i=1;i<=(max||5);i++) h += `<span class="pip${i<=n?' on':''}"></span>`; return h; }

function bodyMapSvg(primary, secondary, tertiary){
  tertiary = tertiary || [];
  const fill = r => primary.includes(r) ? 'var(--accent)' : secondary.includes(r) ? 'rgba(61,220,151,.45)' : tertiary.includes(r) ? 'rgba(61,220,151,.18)' : 'var(--bg-alt)';
  const st = 'stroke="var(--border)" stroke-width="1.2"';
  const part = (r, shape) => shape.replace('/>', ` fill="${fill(r)}" ${st}><title>${REGION_LABEL[r]||r}</title></${shape.match(/^<(\w+)/)[1]}>`);
  const E = (r,cx,cy,rx,ry) => part(r, `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`);
  const R = (r,x,y,w,h,rr) => part(r, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rr}"/>`);
  const neutral = `fill="var(--bg-alt)" ${st}`;
  return `<svg class="bodymap" viewBox="0 0 220 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Muscles worked">
    <!-- FRONT -->
    <circle cx="55" cy="16" r="10" ${neutral}/><rect x="50" y="25" width="10" height="7" ${neutral}/>
    ${E('shoulders',35,40,8,7)}${E('shoulders',75,40,8,7)}
    ${E('chest',46,48,9.5,8)}${E('chest',64,48,9.5,8)}
    ${E('biceps',29,60,5,10)}${E('biceps',81,60,5,10)}
    ${E('forearms',26,82,4.5,11)}${E('forearms',84,82,4.5,11)}
    ${R('core',46,57,18,30,5)}
    ${E('quads',47,110,7.5,19)}${E('quads',63,110,7.5,19)}
    <ellipse cx="47" cy="150" rx="5" ry="15" ${neutral}/><ellipse cx="63" cy="150" rx="5" ry="15" ${neutral}/>
    <text x="55" y="184" text-anchor="middle" font-size="10" fill="var(--text-dim)" font-weight="700">FRONT</text>
    <!-- BACK -->
    <circle cx="165" cy="16" r="10" ${neutral}/>
    ${E('traps',165,32,14,6)}
    ${E('shoulders',145,40,8,7)}${E('shoulders',185,40,8,7)}
    ${E('lats',155,57,9,14)}${E('lats',175,57,9,14)}
    ${R('lowerback',157,72,16,14,4)}
    ${E('triceps',139,60,5,10)}${E('triceps',191,60,5,10)}
    ${E('forearms',136,82,4.5,11)}${E('forearms',194,82,4.5,11)}
    ${E('glutes',157,98,8.5,9)}${E('glutes',173,98,8.5,9)}
    ${E('hamstrings',157,122,6.5,15)}${E('hamstrings',173,122,6.5,15)}
    ${E('calves',157,152,5.5,13)}${E('calves',173,152,5.5,13)}
    <text x="165" y="184" text-anchor="middle" font-size="10" fill="var(--text-dim)" font-weight="700">BACK</text>
  </svg>`;
}
function exStatCardHtml(ex, opts){
  opts = opts || {};
  const an = exAnatomy(ex), s = exStats(ex), diff = exDifficulty(ex);
  const anim = MOVEMENT_ANIMATIONS[ex.category];
  const n = timesDone(ex);
  const tag = n === 0 ? '<span class="nt-badge">🆕 Never tried · +50 XP</span>' : `<span class="tried-badge">Done ${n}×</span>`;
  const diffTxt = ['','Beginner-friendly','Intermediate','Advanced — learn it light'][diff];
  return `<div class="ex-stat${opts.compact?' compact':''}">
    <div class="ex-stat-h">${iconBadge(ex)}<div style="flex:1;min-width:0;"><div class="ex-stat-name">${escapeHtml(ex.name)}</div>
      <div class="hint" style="margin:0;">${equipmentLabel(ex.equipment)} · ${diffTxt}</div></div>${tag}</div>
    <div class="ex-stat-visuals">
      <div class="ex-stat-map">${bodyMapSvg(an.primary, an.secondary, an.tertiary)}
        <div class="map-legend"><span><i style="background:var(--accent)"></i>Primary</span><span><i style="background:rgba(61,220,151,.45)"></i>Secondary</span><span><i style="background:rgba(61,220,151,.18)"></i>Tertiary</span></div></div>
      ${!opts.compact && anim ? `<div class="ex-stat-anim"><div class="mp-figure">${anim.svg}</div><div class="hint" style="margin:4px 0 0;text-align:center;">${anim.title}</div></div>` : ''}
    </div>
    ${muscleRolesHtml(ex)}
    ${(()=>{ const c = exConflict(ex); return c.hits.length ? `<div class="hint" style="margin:6px 0 0;color:var(--warn);">⚠️ Touches your ${c.hits.map(h=>`${h.level==='rest'?'resting':'sore'} ${h.label} (${h.role})`).join(', ')} — go light.</div>` : ''; })()}
    <div class="ex-stat-bars">
      <div><span>Strength</span>${pips(s.strength)}</div>
      <div><span>Muscle</span>${pips(s.muscle)}</div>
      <div><span>Balance</span>${pips(s.stability)}</div>
      <div><span>Cardio</span>${pips(s.cardio)}</div>
      <div><span>Difficulty</span>${pips(diff,3)}</div>
    </div>
  </div>`;
}

/* ---------------- Freestyle session state ---------------- */
const FS_MOODS = {
  muscle:  { emoji:'💪', label:'Build muscle',  sub:'Classic 8–12 rep sets',            rx:{ sets:3, reps:'8–12',  rest:90 } },
  strong:  { emoji:'🏋️', label:'Feel strong',   sub:'Heavier weight, fewer reps',       rx:{ sets:4, reps:'5–6',   rest:150 }, preferCompound:true },
  pump:    { emoji:'🔥', label:'Chase a pump',  sub:'Lighter, 12–20 reps, short rest',  rx:{ sets:3, reps:'12–20', rest:45 },  preferIso:true },
  sweat:   { emoji:'💦', label:'Sweat it out',  sub:'Fast pace, heart rate up',         rx:{ sets:3, reps:'12–15', rest:30 },  preferCardio:true },
  explore: { emoji:'🧭', label:'Explore',       sub:'Learn new moves, moderate weight', rx:{ sets:3, reps:'10–12', rest:75 },  preferNew:true }
};
const FS_SET_CAP = 8; // hard sets per muscle per session before nudging you to switch
let fs = loadJSON(LS_KEYS.freestyle, null);
let fsSetup = null; // in-memory answers while on the setup screen
function saveFs(){ save(LS_KEYS.freestyle, fs); }
function fsLive(){ return !!(fs && fs.date === todayStr() && fs.stage !== 'done'); }
function fsEquip(){ return (coachOn() && profile.coach.equipment && profile.coach.equipment.length) ? profile.coach.equipment : EQUIPMENT_TYPES.map(e=>e.id); }
function fsRx(ex){
  const r = Object.assign({}, FS_MOODS[(fs && fs.mood) || 'muscle'].rx);
  if(ex.repsAreTime) r.rest = Math.min(r.rest, 30);
  return r;
}
function fsExMinutes(sets, rest){ return (sets*40 + (sets-1)*rest)/60 + 1; }
function fsElapsedMin(){ return (fs.history||[]).reduce((t,h)=> t + h.mins, 0); }
function fsSetsOn(muscle){ return (fs.history||[]).filter(h=>h.muscle===muscle).reduce((t,h)=>t+h.sets, 0); }
function recoveringMuscles(){
  const y = addDaysToDateStr(todayStr(), -1);
  const set = new Set();
  logs.filter(l=>l.date === y).forEach(l=>{ const ex = exercises.find(e=>e.id===l.exerciseId); if(ex){ const m = fsMuscleOf(ex); if(m && m !== 'conditioning' && m !== 'core') set.add(m); } });
  return set;
}
function fsCandidates(muscle){
  const used = new Set((fs && fs.history || []).map(h=>h.exerciseId));
  const flags = todayFlags();
  return exercises.filter(ex=> fsMuscleOf(ex) === muscle && fsEquip().includes(ex.equipment) && !used.has(ex.id) && !exConflict(ex, flags).blocked);
}
const FS_TO_RECOVERY = { chest:'chest', back:'back', shoulders:'shoulders', biceps:'biceps', triceps:'triceps', quads:'quads', hamstrings:'hamstrings', glutes:'glutes', calves:'calves', core:'core' };
function fsMuscleFlag(m){ const g = FS_TO_RECOVERY[m]; return g ? todayFlags()[g] || null : null; }
function fsRecommend(muscle, exclude){
  exclude = exclude || [];
  const mood = FS_MOODS[fs.mood] || FS_MOODS.muscle;
  const isNewbie = !profile.coach || profile.coach.experience === 'new';
  const scored = fsCandidates(muscle).filter(ex=>!exclude.includes(ex.id)).map(ex=>{
    const comp = isCompoundEx(ex);
    let s = Math.random()*2.2;
    s -= exConflict(ex).score * 2; // prefer options that barely touch anything sore
    if(mood.preferCompound && comp) s += 3;
    if(mood.preferIso && !comp) s += 2;
    if(mood.preferCardio && (ex.category==='conditioning' || ex.category==='fullbody')) s += 3;
    if(mood.preferNew && neverDone(ex)) s += 3;
    if(!mood.preferNew && !neverDone(ex)) s += 0.6; // slight comfort bias for moves you know
    if(isNewbie) s -= (exDifficulty(ex)-1) * 1.2;
    return { ex, s, comp };
  }).sort((a,b)=> b.s - a.s);
  if(!scored.length) return [];
  const first = scored[0];
  const second = scored.slice(1).find(x=> x.comp !== first.comp) || scored[1];
  return [first, second].filter(Boolean).map(x=>x.ex.id);
}
function fsPickNew(preferMuscle){
  const used = new Set((fs && fs.history || []).map(h=>h.exerciseId));
  const isNewbie = !profile.coach || profile.coach.experience === 'new';
  const flags = todayFlags();
  let pool = exercises.filter(ex=> neverDone(ex) && !used.has(ex.id) && fsEquip().includes(ex.equipment) && fsMuscleOf(ex) && !exConflict(ex, flags).blocked);
  if(isNewbie){ const easy = pool.filter(ex=>exDifficulty(ex) <= 2); if(easy.length) pool = easy; }
  const rec = recoveringMuscles();
  const fresh = pool.filter(ex=> !rec.has(fsMuscleOf(ex)));
  if(fresh.length) pool = fresh;
  if(preferMuscle){ const pm = pool.filter(ex=>fsMuscleOf(ex)===preferMuscle); if(pm.length && Math.random() < .5) pool = pm; }
  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)].id;
}
function fsFarMuscle(current){
  const cur = fsMuscleDef(current);
  const rec = recoveringMuscles();
  const opts = FS_MUSCLES.filter(m=> m.region !== (cur && cur.region) && !rec.has(m.id) && !fsMuscleFlag(m.id) && fsCandidates(m.id).length)
    .sort((a,b)=> fsSetsOn(a.id) - fsSetsOn(b.id) || Math.random() - .5);
  return opts.length ? opts[0].id : null;
}

/* ---------------- Actions ---------------- */
function fsOpenSetup(){
  const ci = todayCheckin();
  fsSetup = { mood: (fs && fs.mood) || 'muscle', minutes: 30, energy: null, start: null, recovering: Object.assign({}, ci && ci.recovering || {}) };
  if(fs && fs.stage === 'done' && fs.date === todayStr()) fs = null;
  renderFreestyle();
  window.scrollTo(0,0);
}
function fsSetupSet(field, v){ fsSetup[field] = v; renderFreestyle(); }
function fsBegin(){
  if(!todayCheckin() && fsSetup.energy == null){ showToast('Tap how you feel first'); return; }
  if(!todayCheckin()){
    const c = { feel: fsSetup.energy, sleep:0, sore:0, id: uid(), date: todayStr(), dayId:'freestyle', recovering: Object.assign({}, fsSetup.recovering||{}) };
    if(Object.values(c.recovering).some(v=>v==='sore')) c.sore = -1;
    c.readiness = computeReadiness(c);
    checkins = checkins.filter(x=>x.date !== c.date).concat(c); saveAll();
  } else {
    const c = todayCheckin(); c.recovering = Object.assign({}, fsSetup.recovering||{}); saveAll();
  }
  let muscle = fsSetup.start;
  if(!muscle || muscle === 'surprise'){
    const rec = recoveringMuscles();
    let pool = FS_MUSCLES.filter(m=> !rec.has(m.id) && !fsMuscleFlag(m.id));
    if(fsSetup.mood === 'sweat') pool = pool.filter(m=>m.id==='conditioning'||m.region==='lower') ;
    muscle = pool.length ? pool[Math.floor(Math.random()*pool.length)].id : 'core';
  }
  fs = { date: todayStr(), mood: fsSetup.mood, minutes: fsSetup.minutes, stage:'pick', mode:'recommend', muscle, options:[], newPick:null, history:[], xp:0, newBadges:[], current:null, lastResult:null };
  fs.options = fsRecommend(muscle);
  if(!fs.options.length){ fs.mode = 'new'; fs.newPick = fsPickNew(); }
  fsSetup = null;
  saveFs(); renderFreestyle(); renderDashboard(); window.scrollTo(0,0);
}
function fsQuickTryNew(){
  if(!fsLive()){
    fs = { date: todayStr(), mood:'explore', minutes:30, stage:'pick', mode:'new', muscle:null, options:[], newPick:null, history:[], xp:0, newBadges:[], current:null, lastResult:null };
  }
  fsGoNew();
}
function fsGoMuscle(m){
  fs.muscle = m; fs.mode = 'recommend'; fs.options = fsRecommend(m); fs.stage = 'pick';
  if(!fs.options.length){ showToast('No more ' + fsMuscleDef(m).label.toLowerCase() + ' exercises for your equipment — here\'s something new instead'); fs.mode = 'new'; fs.newPick = fsPickNew(); }
  saveFs(); renderFreestyle(); window.scrollTo(0,0);
}
function fsGoNew(){
  fs.mode = 'new'; fs.newPick = fsPickNew(fs.muscle); fs.stage = 'pick';
  saveFs(); renderFreestyle(); window.scrollTo(0,0);
}
function fsReroll(){
  if(fs.mode === 'new'){ const prev = fs.newPick; let n = fsPickNew(fs.muscle); for(let i=0;i<6 && n===prev;i++) n = fsPickNew(fs.muscle); fs.newPick = n; }
  else { const prev = fs.options.slice(); let o = fsRecommend(fs.muscle, prev); if(o.length < 1) o = fsRecommend(fs.muscle); fs.options = o; }
  saveFs(); renderFreestyle();
}
function fsChoose(exId, fromNew){
  fs.current = { exerciseId: exId, fromNew: !!fromNew };
  const ex = exercises.find(e=>e.id===exId);
  if(ex) fs.muscle = fsMuscleOf(ex);
  fs.stage = 'doing'; wizardFeel = 'right';
  saveFs(); renderFreestyle(); window.scrollTo(0,0);
}
function fsBackToPick(){ fs.stage = fs.history.length ? 'path' : 'pick'; fs.current = null; saveFs(); renderFreestyle(); }
function addFsSetRow(ex, weight, reps){
  const c = document.getElementById('fsSetsContainer'); if(!c) return;
  if(!ex){ ex = exercises.find(e=>e.id===fs.current.exerciseId); const rx = fsRx(ex); weight = suggestFor(ex, rx, todayReadiness()).weight; reps = repRange(rx.reps)[0]; }
  buildSetRow(c, ex, weight||'', reps);
}
function fsSave(){
  const ex = exercises.find(e=>e.id===fs.current.exerciseId); if(!ex) return;
  const sets = collectSets(document.getElementById('fsSetsContainer'), ex);
  if(!sets.length){ showToast('Log at least one set'); return; }
  const rx = fsRx(ex), readiness = todayReadiness();
  const award = awardForLog(ex, sets);
  const muscle = fsMuscleOf(ex);
  if(!fs.history.some(h=>h.muscle===muscle) && fs.history.length){ award.xp += 15; award.parts.push('+15 🔀 new muscle combo'); gainXP(15); }
  if(fs.current.fromNew){ game.tryNew = (game.tryNew||0) + 1; }
  logs.push({ id: uid(), exerciseId: ex.id, date: todayStr(), sets, notes:'', dayId:'freestyle', feel: wizardFeel, readiness });
  updateProgressAfter(ex, sets, rx, wizardFeel, readiness);
  fs.history.push({ exerciseId: ex.id, muscle, sets: sets.length, xp: award.xp, isNew: award.firstTime, pr: award.pr, mins: fsExMinutes(sets.length, rx.rest), progress: ex.progress });
  fs.xp += award.xp;
  game.maxCombo = Math.max(game.maxCombo||0, new Set(fs.history.map(h=>h.muscle)).size);
  fs.lastResult = { name: ex.name, parts: award.parts, xp: award.xp, progress: ex.progress };
  fs.newBadges = fs.newBadges.concat(checkBadges().map(b=>b.id));
  fs.current = null; fs.stage = 'path'; wizardFeel = 'right';
  saveAll(); saveGame(); saveFs();
  renderFreestyle(); renderDashboard(); window.scrollTo(0,0);
}
function fsFinish(){
  if(fs.history.length){
    game.sessions = (game.sessions||0) + 1;
    gainXP(25); fs.xp += 25;
    fs.newBadges = fs.newBadges.concat(checkBadges().map(b=>b.id));
  }
  fs.stage = 'done'; saveGame(); saveFs(); renderFreestyle(); renderDashboard(); window.scrollTo(0,0);
}
function fsQuit(){
  if(fs && fs.history.length){ fsFinish(); return; }
  fs = null; localStorage.removeItem(LS_KEYS.freestyle); renderFreestyle();
}

/* ---------------- Rendering ---------------- */
function renderFreestyle(){
  const box = document.getElementById('freestyleMain'); if(!box) return;
  let html;
  if(fsSetup) html = fsSetupHtml();
  else if(fsLive() && fs.stage === 'pick') html = fsPickHtml();
  else if(fsLive() && fs.stage === 'doing') html = fsDoingHtml();
  else if(fsLive() && fs.stage === 'path') html = fsPathHtml();
  else if(fs && fs.date === todayStr() && fs.stage === 'done') html = fsDoneHtml();
  else html = fsHomeHtml();
  box.innerHTML = html;
  if(fsLive() && fs.stage === 'doing' && !fsSetup){
    const ex = exercises.find(e=>e.id===fs.current.exerciseId);
    const rx = fsRx(ex); const sug = suggestFor(ex, rx, todayReadiness());
    for(let i=0;i<sug.sets;i++) addFsSetRow(ex, sug.weight, repRange(rx.reps)[0]);
    const key = 'fs|' + fs.date + '|' + fs.history.length + '|' + ex.id;
    if(lastTimerStepKey !== key && !timerRunning){ timerTotal = rx.rest; timerRemaining = rx.rest; lastTimerStepKey = key; }
    updateTimerDisplay();
    maybeShowTip('freestyle', key, tipGroupsFor(ex));
  } else {
    hideTip();
  }
  refreshWakeLock();
}
function levelBarHtml(){
  const L = levelInfo(game.xp);
  return `<div class="lvl-row"><div class="lvl-badge">${L.lvl}</div>
    <div style="flex:1;"><div class="flex-between"><strong>${L.title}</strong><span class="hint" style="margin:0;">${L.into} / ${L.per} XP</span></div>
    <div class="adh-bar xp"><div style="width:${Math.round(L.into/L.per*100)}%"></div></div></div></div>`;
}
function fsHomeHtml(){
  const disc = discoveredIds();
  const avail = exercises.filter(ex=> fsMuscleOf(ex));
  const byMuscle = FS_MUSCLES.map(m=>{ const all = avail.filter(ex=>fsMuscleOf(ex)===m.id); const got = all.filter(ex=>disc.has(ex.id)).length; return `<div class="coll-row"><span>${m.label}</span><div class="adh-bar"><div style="width:${all.length?Math.round(got/all.length*100):0}%"></div></div><span class="hint" style="margin:0;">${got}/${all.length}</span></div>`; }).join('');
  const badges = BADGES.map(b=>{ const got = game.badges.includes(b.id); return `<div class="badge-tile${got?' got':''}" title="${b.desc}"><div class="badge-emoji">${got?b.emoji:'🔒'}</div><div class="badge-name">${b.label}</div><div class="badge-desc">${b.desc}</div></div>`; }).join('');
  return `<div class="card fs-hero" style="margin-bottom:16px;">
      <h2>🎲 Freestyle — choose your own adventure</h2>
      <div class="hint">No fixed plan. Tell me what you're in the mood for, pick from a couple of recommendations, then decide where to go next after every exercise. Same smart weights, same recovery rules — just more fun.</div>
      ${levelBarHtml()}
      <div class="wizard-actions">
        <button class="btn secondary" onclick="fsQuickTryNew()">🎲 Try something new</button>
        <button class="btn" onclick="fsOpenSetup()">Start an adventure →</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <h2>Exercise collection — ${disc.size} / ${avail.length} discovered</h2>
      <div class="hint">Every exercise you log for the first time is a discovery (+50 XP). How much of the map have you explored?</div>
      ${byMuscle}
    </div>
    <div class="card">
      <h2>Badges — ${game.badges.length} / ${BADGES.length}</h2>
      <div class="badge-grid">${badges}</div>
      <div class="hint" style="margin:12px 0 0;">XP: +10 per set, +50 for a first-time exercise, +25 for a personal record, +15 for adding a new muscle mid-session, +25 for finishing a Freestyle session. Applies to planned workouts too.</div>
    </div>`;
}
function fsSetupHtml(){
  const s = fsSetup, rec = recoveringMuscles();
  const needEnergy = !todayCheckin();
  const flagOf = m => { const g = FS_TO_RECOVERY[m.id]; return g && s.recovering ? s.recovering[g] : null; };
  const muscleChip = m => `<button class="chip${s.start===m.id?' active':''}${rec.has(m.id)||flagOf(m)?' recovering':''}" onclick="fsSetupSet('start','${m.id}')">${m.label}${flagOf(m)?` <span class="rec-tag">${flagOf(m)==='rest'?'resting':'sore'}</span>`:rec.has(m.id)?' <span class="rec-tag">trained yesterday</span>':''}</button>`;
  const groups = Object.entries(FS_REGIONS).map(([k,lbl])=>`<div class="fs-region"><div class="fs-region-h">${lbl}</div><div class="chip-row">${FS_MUSCLES.filter(m=>m.region===k).map(muscleChip).join('')}</div></div>`).join('');
  return `<div class="card">
    <h2>What are you in the mood for?</h2>
    <div class="grid cols-2" style="margin-top:8px;">${Object.entries(FS_MOODS).map(([k,v])=>optCard(s.mood===k, v.emoji+' '+v.label, v.sub, `fsSetupSet('mood','${k}')`)).join('')}</div>
    <label style="margin-top:16px;">How much time do you have?</label>
    <div class="seg-row">${[15,30,45,60].map(m=>`<button class="seg-btn${s.minutes===m?' active':''}" onclick="fsSetupSet('minutes',${m})">${m} min</button>`).join('')}</div>
    ${needEnergy ? `<label style="margin-top:16px;">How's your energy?</label>
      <div class="seg-row">${FEEL_OPTIONS.map(o=>`<button class="seg-btn${s.energy===o.v?' active':''}" onclick="fsSetupSet('energy',${o.v})"><span class="seg-emoji">${o.e}</span>${o.l}</button>`).join('')}</div>
      <div class="hint" style="margin-top:6px;">Sets today's weights — the better you feel, the more you'll lift.</div>`
      : `<div class="coach-why">Using today's check-in: readiness <strong>${todayCheckin().readiness}/5</strong>.</div>`}
    <label style="margin-top:16px;">Anything sore, tired or recovering?</label>
    ${recoveryPickerHtml(s.recovering || {}, 'setFsRecovery')}
    <label style="margin-top:16px;">Where do you want to start?</label>
    ${groups}
    <div class="chip-row" style="margin-top:10px;"><button class="chip${(!s.start||s.start==='surprise')?' active':''}" onclick="fsSetupSet('start','surprise')">🎲 Surprise me</button></div>
    ${rec.size ? `<div class="coach-why warn">Muscles marked "trained yesterday" are still rebuilding — they'll grow more if you give them ~48 hours. Pick something fresh if you can.</div>` : ''}
    <div class="wizard-actions">
      <button class="btn ghost" onclick="fsSetup=null; renderFreestyle();">Cancel</button>
      <button class="btn" onclick="fsBegin()">Show me options →</button>
    </div>
  </div>`;
}
function fsSessionStripHtml(){
  const used = Math.round(fsElapsedMin());
  const pct = Math.min(100, Math.round(used / fs.minutes * 100));
  const muscles = [...new Set(fs.history.map(h=>h.muscle))];
  return `<div class="fs-strip">
    <div class="flex-between"><span><strong>${FS_MOODS[fs.mood].emoji} ${FS_MOODS[fs.mood].label}</strong> · ~${used} / ${fs.minutes} min</span><span class="xp-pill">+${fs.xp} XP</span></div>
    <div class="adh-bar"><div style="width:${pct}%;${pct>=100?'background:var(--warn)':''}"></div></div>
    ${muscles.length ? `<div class="chip-row" style="margin-top:8px;">${muscles.map(m=>`<span class="map-chip">${fsMuscleDef(m)?fsMuscleDef(m).label:m} · ${fsSetsOn(m)} sets</span>`).join('')}</div>` : ''}
  </div>`;
}
function fsOptionCard(id, isNew){
  const ex = exercises.find(e=>e.id===id); if(!ex) return '';
  const rx = fsRx(ex), sg = suggestFor(ex, rx, todayReadiness());
  return `<div class="fs-option">
    ${exStatCardHtml(ex, { compact: !isNew })}
    <div class="presc" style="margin:8px 0;">${sg.sets} × ${rxRepsText(ex, rx)} @ ${fmtWeight(ex, sg.weight)} · rest ${fmtRest(rx.rest)}</div>
    <button class="btn" style="width:100%;" onclick="fsChoose('${ex.id}', ${isNew?'true':'false'})">${isNew ? 'Let\'s try it →' : 'Do this one →'}</button>
  </div>`;
}
function fsPickHtml(){
  let body;
  if(fs.mode === 'new'){
    body = fs.newPick
      ? `<h2>🎲 Try something new</h2><div class="hint">An exercise you've never logged. Start lighter than you think — the first session is about learning the movement.</div>
         ${fsOptionCard(fs.newPick, true)}
         ${coachingHtml(exercises.find(e=>e.id===fs.newPick))}`
      : `<h2>🏆 You've tried everything available!</h2><div class="hint">Every exercise for your equipment is in your collection. Pick a muscle instead.</div>`;
  } else {
    const m = fsMuscleDef(fs.muscle);
    const rec = recoveringMuscles().has(fs.muscle);
    body = `<h2>Pick your move — ${m ? m.label : ''}</h2>
      <div class="hint">Two options picked for your mood${fs.history.length ? '' : ' and energy'}. One is usually a bigger multi-muscle lift, the other more targeted.</div>
      ${rec ? `<div class="coach-why warn">You trained ${m.label.toLowerCase()} yesterday — it's fine to go light, but it'll grow more with another day of rest.</div>` : ''}
      <div class="fs-options">${fs.options.map(id=>fsOptionCard(id, false)).join('')}</div>`;
  }
  return `<div class="card">
    ${fsSessionStripHtml()}
    ${body}
    <div class="wizard-actions">
      ${fs.history.length ? '<button class="btn ghost" onclick="fs.stage=\'path\'; saveFs(); renderFreestyle();">← Back</button>' : '<button class="btn ghost" onclick="fsQuit()">Quit</button>'}
      <button class="btn secondary" onclick="fsReroll()">↻ Show me different ${fs.mode==='new'?'one':'options'}</button>
      ${fs.mode !== 'new' ? '<button class="btn secondary" onclick="fsGoNew()">🎲 Something new</button>' : (fs.muscle ? `<button class="btn secondary" onclick="fsGoMuscle('${fs.muscle}')">Back to ${fsMuscleDef(fs.muscle).label}</button>` : '')}
    </div>
  </div>`;
}
function fsDoingHtml(){
  const ex = exercises.find(e=>e.id===fs.current.exerciseId);
  if(!ex){ fs.stage = 'pick'; return fsPickHtml(); }
  const rx = fsRx(ex), sug = suggestFor(ex, rx, todayReadiness());
  const [lo, hi] = repRange(rx.reps);
  return `<div class="card">
    ${fsSessionStripHtml()}
    ${exStatCardHtml(ex)}
    <div class="rest-timer-box">
      <div class="hdr">Rest Timer — ${fmtRest(rx.rest)} for ${FS_MOODS[fs.mood].label.toLowerCase()}</div>
      <div class="timer-wrap">
        <div class="timer-left"><div class="presets">
          ${[30,45,60,90,120,180].map(s=>`<button class="btn secondary" onclick="setTimerPreset(${s})">${s}s</button>`).join('')}
        </div></div>
        <div class="timer-right">
          <div class="timer-ring"><svg width="60" height="60"><circle cx="30" cy="30" r="24" style="stroke:var(--border)" stroke-width="5" fill="none"/><circle id="timerCircle" cx="30" cy="30" r="24" style="stroke:var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="151" stroke-dashoffset="0"/></svg><div class="time" id="timerDisplay">01:00</div></div>
          <div class="row"><button class="btn" id="timerStartBtn" onclick="toggleTimer()">Start</button><button class="btn secondary" onclick="resetTimer()">Reset</button></div>
        </div>
      </div>
    </div>
    <div class="sugg-box">
      <div class="sugg-main">Today: <strong>${sug.sets} × ${rxRepsText(ex, rx)}</strong> @ <strong>${fmtWeight(ex, sug.weight)}</strong> · rest <strong>${fmtRest(rx.rest)}</strong></div>
      <div class="sugg-why">${fs.current.fromNew || neverDone(ex) ? 'First time: pick a weight you could lift ~15 times and focus on form. ' : ''}${sug.reasons.join(' ')}</div>
    </div>
    ${coachingHtml(ex)}
    <div class="hint" style="margin-bottom:8px;">Log what you actually did.${ex.unit==='lb' && !ex.repsAreTime ? ` Hit ${hi} reps on every set and the weight goes up next time.` : ''}</div>
    ${lastTimeHtml(ex)}
    <div id="fsSetsContainer"></div>
    <button class="btn secondary" onclick="addFsSetRow()" style="width:100%;margin-top:6px;">+ Add Set</button>
    <label>How did that feel?</label>
    <div class="seg-row" id="feelRow">
      <button class="seg-btn${wizardFeel==='easy'?' active':''}" data-v="easy" onclick="setWizardFeel('easy')"><span class="seg-emoji">😎</span>Too easy</button>
      <button class="seg-btn${wizardFeel==='right'?' active':''}" data-v="right" onclick="setWizardFeel('right')"><span class="seg-emoji">👌</span>Just right</button>
      <button class="seg-btn${wizardFeel==='hard'?' active':''}" data-v="hard" onclick="setWizardFeel('hard')"><span class="seg-emoji">🥵</span>Too hard</button>
    </div>
    <div class="wizard-actions">
      <button class="btn ghost" onclick="fsBackToPick()">← Pick something else</button>
      <button class="btn" data-save-btn onclick="fsSave()">Done — where next? →</button>
    </div>
  </div>`;
}
function fsPathHtml(){
  const last = fs.history[fs.history.length-1];
  const m = last.muscle, def = fsMuscleDef(m);
  const setsHere = fsSetsOn(m);
  const timeUp = fsElapsedMin() >= fs.minutes;
  const rec = recoveringMuscles();
  const choice = (emoji, title, sub, onclick, cls) => `<div class="day-card path-card${cls?' '+cls:''}" onclick="${onclick}"><div class="day-title">${emoji} ${title}</div><div class="day-sub">${sub}</div></div>`;
  const more = fsMuscleFlag(m) ? 0 : fsCandidates(m).length;
  const cards = [];
  if(more){
    cards.push(setsHere >= FS_SET_CAP
      ? choice('🔁', `More ${def.label.toLowerCase()}`, `You've done <strong>${setsHere} hard sets</strong> — benefits flatten out past roughly 6–10 per muscle in one session. More here mostly adds fatigue. Switch it up!`, `fsGoMuscle('${m}')`, 'warn')
      : choice('🔁', `Keep going: more ${def.label.toLowerCase()}`, `${setsHere} sets so far — up to ~${FS_SET_CAP} hard sets per session is still productive. Hit it from a different angle.`, `fsGoMuscle('${m}')`));
  }
  (FS_NEIGHBORS[m]||[]).forEach(n=>{
    const nd = fsMuscleDef(n); if(!nd || fsMuscleFlag(n) || !fsCandidates(n).length) return;
    const why = FS_WHY[m+'>'+n] || 'Same area of the body, different muscle — the one you just worked gets a breather.';
    cards.push(choice('↔️', `Switch to ${nd.label.toLowerCase()}`, (rec.has(n)?'<span style="color:var(--warn)">Trained yesterday — go light.</span> ':'') + why, `fsGoMuscle('${n}')`));
  });
  const far = fsFarMuscle(m);
  if(far) cards.push(choice('🔀', `Something completely different: ${fsMuscleDef(far).label.toLowerCase()}`, `${FS_REGIONS[fsMuscleDef(far).region]} — a fresh area, so you can go hard right away.`, `fsGoMuscle('${far}')`));
  cards.push(choice('🎲', 'Try something new', 'A random exercise you\'ve never done. +50 XP discovery bonus.', 'fsGoNew()'));
  cards.push(choice('🏁', 'Finish & collect XP', timeUp ? `<strong>You've hit your ${fs.minutes} minutes</strong> — great time to wrap up. +25 XP bonus.` : '+25 XP finishing bonus.', 'fsFinish()', timeUp ? 'highlight' : ''));
  const lr = fs.lastResult;
  const newB = fs.newBadges.map(id=>BADGES.find(b=>b.id===id)).filter(Boolean);
  return `<div class="card">
    ${fsSessionStripHtml()}
    ${lr ? `<div class="xp-burst"><div class="xp-big">+${lr.xp} XP</div><div class="hint" style="margin:0;">${escapeHtml(lr.name)} · ${lr.parts.join(' · ')}${lr.progress==='up' ? ' · 📈 weight goes up next time' : lr.progress==='down' ? ' · backing off a step next time' : ''}</div></div>` : ''}
    ${newB.length ? `<div class="coach-why">🏅 Unlocked: ${newB.map(b=>`<strong>${b.emoji} ${b.label}</strong>`).join(', ')}</div>` : ''}
    <h2 style="margin-top:14px;">Where to next?</h2>
    <div class="path-grid">${cards.join('')}</div>
  </div>`;
}
function fsDoneHtml(){
  const total = fs.history.reduce((t,h)=>t+h.sets,0);
  const muscles = [...new Set(fs.history.map(h=>h.muscle))];
  const newB = [...new Set(fs.newBadges)].map(id=>BADGES.find(b=>b.id===id)).filter(Boolean);
  return `<div class="card fs-hero">
    <h2>🏁 Adventure complete!</h2>
    <div class="xp-burst"><div class="xp-big">+${fs.xp} XP</div><div class="hint" style="margin:0;">${fs.history.length} exercises · ${total} sets · ${muscles.length} muscle group${muscles.length!==1?'s':''} · ${fs.history.filter(h=>h.isNew).length} new discoveries · ${fs.history.filter(h=>h.pr).length} PRs</div></div>
    ${levelBarHtml()}
    ${newB.length ? `<div class="coach-why">🏅 Badges unlocked: ${newB.map(b=>`<strong>${b.emoji} ${b.label}</strong>`).join(', ')}</div>` : ''}
    <div style="margin-top:12px;">${fs.history.map(h=>{ const ex = exercises.find(e=>e.id===h.exerciseId); return ex ? `<div class="bl-row" style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${h.isNew?'🆕 ':''}${h.pr?'📈 ':''}${escapeHtml(ex.name)}</span><span style="color:var(--text-dim)">${h.sets} sets · +${h.xp} XP</span></div>` : ''; }).join('')}</div>
    <div class="coach-why">Recovery is where it pays off: protein, water, and 7–9 hours of sleep tonight.</div>
    <div class="wizard-actions">
      <button class="btn secondary" onclick="fs=null; localStorage.removeItem(LS_KEYS.freestyle); renderFreestyle();">Freestyle home</button>
      <button class="btn" onclick="switchView('dashboard')">Back to Dashboard</button>
    </div>
  </div>`;
}

