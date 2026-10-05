/* J3 WorkOut — js/muscledb.js
   Muscle database (primary / secondary / tertiary) + recovery-aware selection + spreadsheet view.
   Loaded as a classic <script> in index.html order; files share globals. */

/* =====================================================================
   MUSCLE DATABASE — primary / secondary / tertiary involvement
   The "backend" table behind recovery-aware suggestions.
     Primary   = main mover            (load 1.0)
     Secondary = assists the movement  (load 0.5)
     Tertiary  = stabilizes / minor    (load 0.25)
   Defaults live in MUSCLE_DB below; edits made in Settings → Muscle
   Database are stored on the exercise itself (ex.muscles) and win.
   Format: 'P:muscle,muscle|S:...|T:...'
   ===================================================================== */
const MUSCLES = {
  chest:  { label:'Chest',              short:'Chest' },
  fdelt:  { label:'Front delts',        short:'Front delt' },
  sdelt:  { label:'Side delts',         short:'Side delt' },
  rdelt:  { label:'Rear delts',         short:'Rear delt' },
  tri:    { label:'Triceps',            short:'Triceps' },
  bi:     { label:'Biceps',             short:'Biceps' },
  fore:   { label:'Forearms & grip',    short:'Forearms' },
  lats:   { label:'Lats',               short:'Lats' },
  upback: { label:'Upper back & traps', short:'Upper back' },
  lowback:{ label:'Lower back',         short:'Low back' },
  abs:    { label:'Abs',                short:'Abs' },
  obl:    { label:'Obliques',           short:'Obliques' },
  hipflex:{ label:'Hip flexors',        short:'Hip flexors' },
  glutes: { label:'Glutes',             short:'Glutes' },
  abd:    { label:'Outer hip (glute med)', short:'Outer hip' },
  add:    { label:'Inner thigh (adductors)', short:'Adductors' },
  quads:  { label:'Quads',              short:'Quads' },
  hams:   { label:'Hamstrings',         short:'Hamstrings' },
  calves: { label:'Calves',             short:'Calves' }
};
const MUSCLE_KEYS = Object.keys(MUSCLES);
const ROLE_LOAD = { P:1, S:0.5, T:0.25 };
const ROLE_LABEL = { P:'Primary', S:'Secondary', T:'Tertiary' };

const MUSCLE_DB = {
  // Legs — compound
  squat:'P:quads,glutes|S:add,lowback,hams|T:abs,calves',
  deadlift:'P:hams,glutes,lowback|S:quads,upback,fore,lats|T:abs,add',
  legpress:'P:quads,glutes|S:add,hams|T:calves',
  gobletsquat:'P:quads,glutes|S:add,abs|T:upback,fore',
  frontsquat:'P:quads|S:glutes,abs,upback|T:add,lowback',
  sumodeadlift:'P:glutes,hams,add|S:quads,lowback,upback|T:fore,abs',
  trapbardl:'P:quads,glutes,hams|S:lowback,upback,fore|T:abs,lats',
  speediancesquat:'P:quads,glutes|S:add,hams|T:abs,lowback',
  bulgariansplitsquat:'P:quads,glutes|S:add,hams,abd|T:abs,calves',
  hacksquat:'P:quads|S:glutes,add|T:hams,calves',
  'speedianceleg press':'P:quads,glutes|S:add,hams|T:calves',
  bwsquat:'P:quads,glutes|S:add|T:hams,calves,abs',
  stepup:'P:quads,glutes|S:hams,abd|T:calves,abs',
  lunge:'P:quads,glutes|S:hams,add|T:calves,abs',
  // Legs — isolation
  calfraise:'P:calves', standingcalfraise:'P:calves', dbcalfraise:'P:calves|T:fore', seatedcalfraise:'P:calves',
  legextension:'P:quads', speedianceextension:'P:quads',
  lyinglegcurl:'P:hams|T:calves', seatedlegcurl:'P:hams|T:calves', speediancelegcurl:'P:hams|T:calves',
  adductor:'P:add', abductor:'P:abd|S:glutes',
  // Glutes
  dbrdl:'P:hams,glutes|S:lowback|T:fore,upback',
  hipthrust:'P:glutes|S:hams|T:quads,add,abs', speediancehipthrust:'P:glutes|S:hams|T:quads,add,abs',
  glutebridge:'P:glutes|S:hams|T:abs',
  cablekickback:'P:glutes|S:hams|T:lowback', speedianceglutekickback:'P:glutes|S:hams|T:lowback',
  curtsylunge:'P:glutes,quads|S:abd,add|T:calves',
  singlelegbridge:'P:glutes|S:hams|T:abd,abs',
  sumosquat:'P:quads,glutes,add|S:hams|T:fore,abs',
  donkeykick:'P:glutes|S:hams|T:abs',
  // Chest
  bench:'P:chest|S:tri,fdelt|T:upback',
  pushup:'P:chest|S:tri,fdelt|T:abs',
  chestpress_speed:'P:chest|S:tri,fdelt', machinechestpress:'P:chest|S:tri,fdelt',
  dbbench:'P:chest|S:tri,fdelt|T:fore',
  cablefly_speed:'P:chest|S:fdelt|T:bi', pecdeck:'P:chest|S:fdelt', dbfly:'P:chest|S:fdelt|T:bi', speediancefly:'P:chest|S:fdelt|T:bi',
  inclinedbpress:'P:chest,fdelt|S:tri|T:upback', inclinebarbell:'P:chest,fdelt|S:tri|T:upback', speedianceinclinepress:'P:chest,fdelt|S:tri',
  declinebench:'P:chest|S:tri|T:fdelt',
  chestdip:'P:chest,tri|S:fdelt|T:abs',
  landminepress:'P:fdelt,chest|S:tri|T:abs,obl',
  // Back
  row:'P:lats,upback|S:bi,rdelt,lowback|T:fore,hams',
  latpull:'P:lats|S:bi,upback|T:rdelt,fore', speediancepulldown:'P:lats|S:bi,upback|T:rdelt,fore', widegriplatpulldown:'P:lats|S:bi,upback|T:rdelt,fore',
  dbbentrow:'P:lats,upback|S:bi,rdelt|T:fore,lowback',
  facepull:'P:rdelt,upback|T:bi',
  pullup:'P:lats|S:bi,upback|T:fore,abs',
  chinup:'P:lats,bi|S:upback|T:fore,abs',
  tbarrow:'P:upback,lats|S:bi,rdelt,lowback|T:fore,hams',
  singlearmrow:'P:lats|S:upback,bi,rdelt|T:fore,obl',
  cablerowwide:'P:upback,rdelt|S:lats,bi|T:fore',
  seatedrow_speed:'P:lats,upback|S:bi,rdelt|T:fore',
  straightarmpulldown:'P:lats|S:tri|T:abs',
  speediancebentoverrow:'P:lats,upback|S:bi,rdelt,lowback|T:fore',
  invertedrow:'P:upback,lats|S:bi,rdelt|T:abs,glutes',
  rackpull:'P:upback,glutes,lowback|S:hams,fore,lats|T:quads',
  bandpullapart:'P:rdelt,upback',
  // Shoulders
  ohp:'P:fdelt|S:tri,sdelt,upback|T:abs,lowback', militarypress:'P:fdelt|S:tri,sdelt,upback|T:abs,lowback',
  dbshoulder:'P:fdelt|S:tri,sdelt|T:upback', speedianceshoulderpress:'P:fdelt|S:tri,sdelt|T:upback', machineshoulderpress:'P:fdelt|S:tri,sdelt',
  arnoldpress:'P:fdelt,sdelt|S:tri|T:upback',
  lateralraise:'P:sdelt|S:upback|T:fdelt', cablelateralraise:'P:sdelt|S:upback|T:fdelt', speediancelateralraise:'P:sdelt|S:upback|T:fdelt',
  frontraise:'P:fdelt|S:sdelt|T:chest',
  reardeltfly:'P:rdelt|S:upback',
  uprightrow:'P:sdelt,upback|S:fdelt,bi|T:fore',
  // Biceps
  curl:'P:bi|S:fore', barbellcurl:'P:bi|S:fore|T:fdelt', preachercurl:'P:bi|S:fore', concentrationcurl:'P:bi|S:fore',
  cablecurl:'P:bi|S:fore', speediancecurl:'P:bi|S:fore', inclinedbcurl:'P:bi|S:fore', ezbarcurl:'P:bi|S:fore',
  hammercurl:'P:bi,fore', zottmancurl:'P:bi,fore',
  // Triceps
  tricepspushdown:'P:tri', ropepushdown:'P:tri', skullcrusher:'P:tri|T:lats',
  overheadtricepext:'P:tri|T:abs', speediancetricepext:'P:tri|T:abs',
  tricepkickback:'P:tri|T:rdelt', speedianceTricepkickback:'P:tri|T:rdelt',
  closegripbench:'P:tri,chest|S:fdelt',
  tricepdip:'P:tri|S:fdelt,chest',
  // Core
  plank:'P:abs|S:obl|T:glutes,fdelt',
  russiantwist:'P:obl|S:abs|T:hipflex',
  hanginglegraise:'P:abs,hipflex|S:obl|T:fore,lats',
  cablewoodchopper:'P:obl|S:abs|T:fdelt,glutes', speediancewoodchopper:'P:obl|S:abs|T:fdelt,glutes',
  abwheel:'P:abs|S:lats,obl|T:tri,hipflex',
  bicyclecrunch:'P:abs,obl|S:hipflex',
  sideplank:'P:obl|S:abs,abd|T:sdelt',
  vup:'P:abs|S:hipflex|T:obl',
  cablecrunch:'P:abs|S:obl',
  deadbug:'P:abs|S:hipflex,obl',
  // Full body
  squattopress:'P:quads,fdelt|S:glutes,tri|T:abs,upback',
  renegaderow:'P:lats,abs|S:upback,bi,obl|T:tri,chest',
  cleanandpress:'P:glutes,hams,fdelt|S:quads,upback,tri,lowback|T:fore,abs,calves',
  thruster:'P:quads,fdelt|S:glutes,tri|T:abs,upback', speedthruster:'P:quads,fdelt|S:glutes,tri|T:abs,upback',
  manmaker:'P:chest,lats,quads|S:fdelt,tri,glutes,abs|T:bi,upback',
  turkishgetup:'P:abs,fdelt|S:obl,glutes,tri|T:quads,upback',
  wallball:'P:quads,fdelt|S:glutes,tri|T:abs',
  devilspress:'P:glutes,hams,fdelt|S:chest,tri,quads|T:abs,upback',
  bearcrawl:'P:abs,fdelt|S:quads,tri|T:hipflex',
  burpee:'P:quads,chest|S:glutes,tri,fdelt|T:abs,calves',
  plateoverhead:'P:glutes,fdelt|S:hams,quads,upback|T:abs',
  // Conditioning
  kbswing:'P:glutes,hams|S:lowback,abs|T:fdelt,fore',
  mtnclimbers:'P:abs,hipflex|S:fdelt,quads|T:tri',
  jumprope:'P:calves|S:quads|T:fdelt,fore',
  treadmillsprint:'P:quads,glutes|S:hams,calves|T:hipflex,abs',
  rowmachinecal:'P:lats,quads|S:upback,glutes,hams|T:bi,abs',
  assaultbike:'P:quads|S:glutes,fdelt,hams|T:tri,lats',
  battleropes:'P:fdelt|S:abs,fore|T:sdelt',
  boxjump:'P:quads,glutes|S:calves,hams',
  sledpush:'P:quads,glutes|S:calves,fdelt|T:tri',
  highknees:'P:hipflex,quads|S:calves|T:abs',
  jumpingjacks:'P:calves|S:abd,add,sdelt',
  speedianceconditioning:'P:quads|S:glutes,fdelt|T:abs'
};
// Fallback for exercises with no entry (e.g. ones you added yourself).
const CATEGORY_DEFAULT_MUSCLES = {
  'legs-compound':'P:quads,glutes|S:hams,add|T:abs', 'legs-isolation':'P:quads', glutes:'P:glutes|S:hams',
  chest:'P:chest|S:tri,fdelt', back:'P:lats,upback|S:bi,rdelt', shoulders:'P:fdelt,sdelt|S:tri', biceps:'P:bi|S:fore',
  triceps:'P:tri', core:'P:abs|S:obl', fullbody:'P:quads,glutes,fdelt|S:abs,chest,lats', conditioning:'P:quads|S:glutes,calves|T:abs'
};
function parseMuscleSpec(spec){
  const out = { P:[], S:[], T:[] };
  String(spec||'').split('|').forEach(part=>{
    const m = part.match(/^([PST]):(.*)$/); if(!m) return;
    out[m[1]] = m[2].split(',').map(x=>x.trim()).filter(x=>MUSCLES[x]);
  });
  return out;
}
function specFromMuscles(m){ return ['P','S','T'].filter(r=>m[r] && m[r].length).map(r=>r+':'+m[r].join(',')).join('|'); }
function exMuscles(ex){
  if(ex.muscles && (ex.muscles.P||ex.muscles.S||ex.muscles.T)) return { P:ex.muscles.P||[], S:ex.muscles.S||[], T:ex.muscles.T||[] };
  return parseMuscleSpec(MUSCLE_DB[ex.id] || CATEGORY_DEFAULT_MUSCLES[ex.category] || '');
}
function exMuscleSource(ex){ return ex.muscles ? 'edited' : (MUSCLE_DB[ex.id] ? 'database' : 'estimated'); }
// How hard an exercise loads a single muscle: 1 / 0.5 / 0.25 / 0.
function muscleLoad(ex, muscle){
  const m = exMuscles(ex);
  return m.P.includes(muscle) ? 1 : m.S.includes(muscle) ? 0.5 : m.T.includes(muscle) ? 0.25 : 0;
}

/* ---------------- Recovery groups (what you tap when something's sore) ---------------- */
const RECOVERY_GROUPS = [
  { id:'chest',      label:'Chest',              muscles:['chest'] },
  { id:'shoulders',  label:'Shoulders',          muscles:['fdelt','sdelt','rdelt'] },
  { id:'back',       label:'Upper back / lats',  muscles:['lats','upback'] },
  { id:'lowerback',  label:'Lower back',         muscles:['lowback'] },
  { id:'biceps',     label:'Biceps',             muscles:['bi'] },
  { id:'triceps',    label:'Triceps',            muscles:['tri'] },
  { id:'forearms',   label:'Forearms / wrists',  muscles:['fore'] },
  { id:'core',       label:'Core / abs',         muscles:['abs','obl'] },
  { id:'hips',       label:'Hips / groin',       muscles:['hipflex','add','abd'] },
  { id:'glutes',     label:'Glutes',             muscles:['glutes'] },
  { id:'quads',      label:'Quads / knees',      muscles:['quads'] },
  { id:'hamstrings', label:'Hamstrings',         muscles:['hams'] },
  { id:'calves',     label:'Calves / ankles',    muscles:['calves'] }
];
function recoveryGroup(id){ return RECOVERY_GROUPS.find(g=>g.id===id); }
function groupLoad(ex, groupId){
  const g = recoveryGroup(groupId); if(!g) return 0;
  return Math.max(0, ...g.muscles.map(m=>muscleLoad(ex, m)));
}
// Today's flags: from the check-in ('sore' or 'rest') plus long-term protected areas ('sore' level).
function todayFlags(){
  const flags = {};
  ((profile.coach && profile.coach.protect) || []).forEach(g=> flags[g] = 'sore');
  const c = todayCheckin();
  if(c && c.recovering) Object.entries(c.recovering).forEach(([g,lvl])=>{ if(lvl === 'rest' || !flags[g]) flags[g] = lvl; });
  return flags;
}
// Does an exercise clash with the flags? sore → avoid as primary or secondary; rest → avoid entirely.
function exConflict(ex, flags){
  flags = flags || todayFlags();
  const hits = [];
  Object.entries(flags).forEach(([g,lvl])=>{
    const load = groupLoad(ex, g);
    if(!load) return;
    const blocked = lvl === 'rest' ? load > 0 : load >= 0.5;
    hits.push({ group:g, label: recoveryGroup(g) ? recoveryGroup(g).label.toLowerCase() : g, level:lvl, load, blocked,
      role: load >= 1 ? 'primary' : load >= 0.5 ? 'secondary' : 'tertiary' });
  });
  return { blocked: hits.some(h=>h.blocked), hits, score: hits.reduce((s,h)=> s + h.load * (h.level==='rest'?2:1), 0) };
}
function conflictText(c){
  const b = c.hits.filter(h=>h.blocked);
  return b.map(h=>`${h.level==='rest'?'resting':'sore'} ${h.label} (${h.role})`).join(', ');
}
// Find a safe replacement: same slot pool first, then same muscle family, lowest overlap with flags.
function safeAlternative(ex, rxPool, exclude, flags){
  flags = flags || todayFlags();
  const equip = (coachOn() && profile.coach.equipment && profile.coach.equipment.length) ? profile.coach.equipment : EQUIPMENT_TYPES.map(e=>e.id);
  const fam = typeof fsMuscleOf === 'function' ? fsMuscleOf(ex) : null;
  const pools = [];
  if(rxPool && SLOT_POOLS[rxPool]) pools.push(SLOT_POOLS[rxPool].ids.map(id=>exercises.find(e=>e.id===id)).filter(Boolean));
  if(fam) pools.push(exercises.filter(e=>fsMuscleOf(e)===fam));
  for(const pool of pools){
    const ok = pool.filter(e=> e.id!==ex.id && !exclude.includes(e.id) && equip.includes(e.equipment) && !exConflict(e, flags).blocked)
      .sort((a,b)=> exConflict(a, flags).score - exConflict(b, flags).score);
    if(ok.length) return ok[0];
  }
  return null;
}

/* ---------------- Recovery picker (chips: off → sore → rest) ---------------- */
function recoveryPickerHtml(state, setter){
  return `<div class="chip-row">${RECOVERY_GROUPS.map(g=>{
    const lvl = state[g.id];
    return `<button class="chip rec-chip${lvl?' lvl-'+lvl:''}" onclick="${setter}('${g.id}')">${lvl==='rest'?'🚫 ':lvl==='sore'?'😣 ':''}${g.label}</button>`;
  }).join('')}</div>
  <div class="hint" style="margin-top:6px;">Tap once = <strong>😣 sore</strong> (I'll avoid exercises where it's a main or helper muscle). Tap twice = <strong>🚫 rest / injured</strong> (avoid anything that uses it). Tap again to clear.</div>`;
}
function cycleLevel(cur){ return !cur ? 'sore' : cur === 'sore' ? 'rest' : null; }
function setCheckinRecovery(g){
  checkinDraft.recovering = checkinDraft.recovering || {};
  const n = cycleLevel(checkinDraft.recovering[g]);
  if(n) checkinDraft.recovering[g] = n; else delete checkinDraft.recovering[g];
  renderPlanView();
}
function setFsRecovery(g){
  fsSetup.recovering = fsSetup.recovering || {};
  const n = cycleLevel(fsSetup.recovering[g]);
  if(n) fsSetup.recovering[g] = n; else delete fsSetup.recovering[g];
  renderFreestyle();
}
function coachToggleProtect(g){
  coachDraft.protect = coachDraft.protect || [];
  coachToggle('protect', g);
}

/* ---------------- Plan: today's recovery swaps ---------------- */
// After check-in, swap (or skip) any exercise in today's workout that clashes with a sore/resting area.
function computeRecoverySwaps(day){
  const flags = todayFlags();
  const swaps = {}, skips = [], reasons = {};
  if(!Object.keys(flags).length) return { swaps, skips, reasons };
  const inDay = day.lifts.slice();
  day.lifts.forEach(id=>{
    const ex = exercises.find(e=>e.id===id); if(!ex) return;
    const c = exConflict(ex, flags);
    if(!c.blocked) return;
    const rx = day.rx && day.rx[id];
    const alt = safeAlternative(ex, rx && rx.pool, inDay.concat(Object.values(swaps)), flags);
    reasons[id] = conflictText(c);
    if(alt) swaps[id] = alt.id; else skips.push(id);
  });
  return { swaps, skips, reasons };
}
function stepExercise(plan, day, step){
  const origId = step.exerciseId;
  const swapId = plan && plan.swaps && plan.swaps[origId];
  const ex = exercises.find(e=>e.id===(swapId || origId));
  const r = day && day.rx && day.rx[origId];
  const rx = r ? r : (ex ? rxFor(ex, day) : null);
  return { ex, rx, origId, swapped: !!swapId, skipped: !!(plan && plan.skips && plan.skips.includes(origId)),
    reason: plan && plan.swapReasons ? plan.swapReasons[origId] : null };
}
function undoRecoverySwap(origId){
  const plan = loadTodayPlan(); if(!plan) return;
  const swaps = Object.assign({}, plan.swaps); delete swaps[origId];
  const skips = (plan.skips||[]).filter(x=>x!==origId);
  saveTodayPlan({ swaps, skips });
  renderPlanView(); showToast('Using the original exercise — go light and stop if it hurts');
}
function redoCheckin(){
  checkins = checkins.filter(c=>c.date !== todayStr()); saveAll();
  saveTodayPlan({ stepIndex:0, swaps:{}, skips:[], swapReasons:{} });
  renderPlanView();
}

/* ---------------- Settings: spreadsheet view ---------------- */
let mdbFilter = { q:'', muscle:'', role:'' };
let mdbEditing = null; // exercise id being edited
let mdbDraft = null;   // {muscle: 'P'|'S'|'T'}
function mdbTag(m, r){ return `<span class="mtag r-${r}" title="${ROLE_LABEL[r]} · ${MUSCLES[m].label}">${MUSCLES[m].short}</span>`; }
function renderMuscleDb(){
  const box = document.getElementById('muscleDbBox'); if(!box) return;
  const q = mdbFilter.q.toLowerCase();
  const rows = exercises.filter(ex=>{
    if(q && !ex.name.toLowerCase().includes(q)) return false;
    if(mdbFilter.muscle){
      const m = exMuscles(ex);
      const roles = mdbFilter.role ? [mdbFilter.role] : ['P','S','T'];
      if(!roles.some(r=> m[r].includes(mdbFilter.muscle))) return false;
    }
    return true;
  });
  const body = rows.map(ex=>{
    const m = exMuscles(ex), src = exMuscleSource(ex);
    const editing = mdbEditing === ex.id;
    const row = `<tr class="${editing?'editing':''}">
      <td class="mdb-name"><div style="display:flex;align-items:center;gap:8px;">${iconBadge(ex,'sm')}<span>${escapeHtml(ex.name)}</span></div></td>
      <td>${categoryLabel(ex.category)}</td><td>${equipmentLabel(ex.equipment)}</td>
      <td>${m.P.map(x=>mdbTag(x,'P')).join('') || '—'}</td>
      <td>${m.S.map(x=>mdbTag(x,'S')).join('') || '—'}</td>
      <td>${m.T.map(x=>mdbTag(x,'T')).join('') || '—'}</td>
      <td><span class="mdb-src src-${src}">${src}</span></td>
      <td><button class="icon-btn" onclick="mdbEdit('${ex.id}')" title="Edit muscles">✎</button></td>
    </tr>`;
    if(!editing) return row;
    const chips = MUSCLE_KEYS.map(k=>{ const r = mdbDraft[k]; return `<button class="chip mdb-chip${r?' r-'+r:''}" onclick="mdbCycle('${k}')">${r?r+' · ':''}${MUSCLES[k].label}</button>`; }).join('');
    return row + `<tr class="mdb-editor"><td colspan="8">
      <div class="hint" style="margin-bottom:6px;">Tap a muscle to cycle: <strong>P</strong>rimary → <strong>S</strong>econdary → <strong>T</strong>ertiary → off.</div>
      <div class="chip-row">${chips}</div>
      <div class="wizard-actions">
        ${ex.muscles ? `<button class="btn ghost" onclick="mdbReset('${ex.id}')">Reset to default</button>` : ''}
        <button class="btn secondary" onclick="mdbEditing=null; renderMuscleDb();">Cancel</button>
        <button class="btn" onclick="mdbSave('${ex.id}')">Save</button>
      </div></td></tr>`;
  }).join('');
  box.innerHTML = `
    <div class="row" style="flex-wrap:wrap;gap:8px;">
      <input type="text" placeholder="Search exercises…" value="${escapeHtml(mdbFilter.q)}" oninput="mdbFilter.q=this.value; clearTimeout(window._mdbT); window._mdbT=setTimeout(renderMuscleDbKeepFocus,200);" id="mdbSearch" style="flex:2 1 180px;">
      <select onchange="mdbFilter.muscle=this.value; renderMuscleDb();" style="flex:1 1 150px;"><option value="">Any muscle</option>${MUSCLE_KEYS.map(k=>`<option value="${k}"${mdbFilter.muscle===k?' selected':''}>${MUSCLES[k].label}</option>`).join('')}</select>
      <select onchange="mdbFilter.role=this.value; renderMuscleDb();" style="flex:1 1 120px;"><option value="">Any role</option>${['P','S','T'].map(r=>`<option value="${r}"${mdbFilter.role===r?' selected':''}>${ROLE_LABEL[r]}</option>`).join('')}</select>
      <button class="btn secondary" style="flex:0 0 auto;" onclick="exportMuscleDbCsv()">⬇ CSV</button>
    </div>
    <div class="hint" style="margin:8px 0;">${rows.length} of ${exercises.length} exercises</div>
    <div class="mdb-wrap"><table class="mdb-table">
      <thead><tr><th>Exercise</th><th>Category</th><th>Equipment</th><th>Primary (100%)</th><th>Secondary (50%)</th><th>Tertiary (25%)</th><th>Source</th><th></th></tr></thead>
      <tbody>${body || '<tr><td colspan="8" class="empty">No exercises match.</td></tr>'}</tbody>
    </table></div>`;
}
function renderMuscleDbKeepFocus(){
  renderMuscleDb();
  const el = document.getElementById('mdbSearch');
  if(el){ el.focus(); const v = el.value; el.setSelectionRange(v.length, v.length); }
}
function mdbEdit(id){
  const ex = exercises.find(e=>e.id===id); if(!ex) return;
  if(mdbEditing === id){ mdbEditing = null; renderMuscleDb(); return; }
  const m = exMuscles(ex);
  mdbDraft = {}; ['P','S','T'].forEach(r=> m[r].forEach(k=> mdbDraft[k] = r));
  mdbEditing = id; renderMuscleDb();
}
function mdbCycle(k){
  const order = [undefined,'P','S','T'];
  const i = order.indexOf(mdbDraft[k]);
  const n = order[(i+1) % order.length];
  if(n) mdbDraft[k] = n; else delete mdbDraft[k];
  renderMuscleDb();
}
function mdbSave(id){
  const ex = exercises.find(e=>e.id===id); if(!ex) return;
  const m = { P:[], S:[], T:[] };
  Object.entries(mdbDraft).forEach(([k,r])=> m[r].push(k));
  if(!m.P.length){ showToast('Pick at least one primary muscle'); return; }
  ex.muscles = m; saveAll();
  mdbEditing = null; renderMuscleDb(); showToast('Muscles saved for ' + ex.name);
}
function mdbReset(id){
  const ex = exercises.find(e=>e.id===id); if(!ex) return;
  delete ex.muscles; saveAll(); mdbEditing = null; renderMuscleDb(); showToast('Reset to default');
}
function exportMuscleDbCsv(){
  const esc = v => `"${String(v).replace(/"/g,'""')}"`;
  const lines = [['Exercise','ID','Category','Equipment','Primary','Secondary','Tertiary','Source'].map(esc).join(',')];
  exercises.forEach(ex=>{
    const m = exMuscles(ex);
    lines.push([ex.name, ex.id, categoryLabel(ex.category), equipmentLabel(ex.equipment),
      m.P.map(k=>MUSCLES[k].label).join('; '), m.S.map(k=>MUSCLES[k].label).join('; '), m.T.map(k=>MUSCLES[k].label).join('; '), exMuscleSource(ex)].map(esc).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'ironlog-muscle-database-' + todayStr() + '.csv';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('Muscle database exported');
}
// Short "Primary / Secondary / Tertiary" line for cards.
function muscleRolesHtml(ex){
  const m = exMuscles(ex);
  const part = (r, cls) => m[r].length ? `<div class="mroles-row"><span class="mroles-lbl">${ROLE_LABEL[r]}</span>${m[r].map(k=>mdbTag(k,r)).join('')}</div>` : '';
  return `<div class="mroles">${part('P')}${part('S')}${part('T')}</div>`;
}

