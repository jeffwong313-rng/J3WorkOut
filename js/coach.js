/* J3 WorkOut — js/coach.js
   Coach mode: questionnaire, program generator, schedule, check-ins, weight suggestions, exercise instructions.
   Loaded as a classic <script> in index.html order; files share globals. */

/* =====================================================================
   COACH MODE — the "personal trainer" layer
   - Onboarding questionnaire (goal, priority muscles, how to train them,
     how many days + which weekdays, session length, equipment), with the
     training implications of every answer shown as you pick it.
   - Program generator: picks a split that fits your days (rotating muscle
     groups when days are back-to-back), chooses exercises for your
     equipment, sets/reps/rest from your goal, trims to your time budget.
   - Weekly schedule + daily check-in (readiness) + consistency tracking.
   - Readiness-based weight suggestions: the better you feel, the more
     you lift; double progression decides when you've "earned" a jump.
   Principles are paraphrased from ideas discussed on the Huberman Lab
   podcast, including episodes with exercise physiologist Dr. Andy Galpin.
   ===================================================================== */

const WEEK_ORDER = [1,2,3,4,5,6,0]; // Monday-first display order
const WD_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WD_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function weekdayOf(dateStr){ return new Date(dateStr+'T00:00:00').getDay(); }
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function coachOn(){ return !!(profile.coach && profile.coach.schedule && Object.keys(profile.coach.schedule).length); }
function clampNum(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
function fmtRest(sec){ sec = Math.round(sec||0); if(sec < 60) return sec + 's'; const m = Math.floor(sec/60), s = sec%60; return m + ':' + String(s).padStart(2,'0'); }
function repRange(r){
  const nums = String(r==null?'':r).match(/\d+/g);
  if(!nums) return [10,10];
  const lo = +nums[0], hi = +(nums[1] || nums[0]);
  return [Math.min(lo,hi), Math.max(lo,hi)];
}

/* ---------------- Questionnaire answer options ---------------- */
const COACH_GOALS = {
  hypertrophy: {
    label:'Build muscle', emoji:'💪', blurb:'Get visibly bigger, more defined muscles.',
    sets:3, isoSets:3, reps:'8–12', isoReps:'10–15', rest:120, isoRest:75, rir:'1–2',
    implication:'Moderate weights for <strong>8–12 reps</strong>, taken close to failure — stop each set with about <strong>1–2 good reps left in the tank</strong>. Aim for roughly <strong>10–20 hard sets per muscle per week</strong>, with each muscle trained about <strong>twice a week</strong>. Rest <strong>~2 min</strong> on big lifts so every set is high quality — shorter rest just means fewer good reps, not more growth.'
  },
  strength: {
    label:'Get stronger', emoji:'🏋️', blurb:'Lift heavier weights; build real-world strength.',
    sets:4, isoSets:2, reps:'5–6', isoReps:'8–12', rest:150, isoRest:75, rir:'2',
    implication:'Based on Dr. Andy Galpin\'s "3-to-5" idea for strength: <strong>a few big lifts, 3–5 sets, low reps, long rest</strong>. As a beginner we use <strong>5–6 reps</strong> (not 3) so technique stays solid. Rest <strong>2–3 min</strong> — strength comes from quality, not from being out of breath. Sessions feel less "pumpy," but your numbers climb fastest.'
  },
  general: {
    label:'Get fit & healthy', emoji:'❤️', blurb:'Feel better, move better, build a base.',
    sets:2, isoSets:2, reps:'10–12', isoReps:'12–15', rest:75, isoRest:60, rir:'2–3',
    implication:'<strong>2–3 sets of 10–15 reps</strong> across the whole body, stopping a few reps short of failure. As a beginner this still builds muscle and strength. Pair it with some cardio (walking, the Sprints tab) — Huberman\'s "foundational fitness" idea is a weekly mix of strength, steady cardio and a little high intensity.'
  },
  fatloss: {
    label:'Lose fat, keep muscle', emoji:'🔥', blurb:'Lean out without losing what you\'ve built.',
    sets:3, isoSets:2, reps:'10–12', isoReps:'12–15', rest:60, isoRest:45, rir:'1–2', finisher:true,
    implication:'Keep lifting with real effort — that\'s the signal that tells your body to <strong>keep muscle while you\'re eating less</strong>. Shorter rest (<strong>45–60s</strong>) and an <strong>8-minute conditioning finisher</strong> add calorie burn. Honest note: most fat loss comes from nutrition — training protects your muscle while you lose it.'
  }
};
const COACH_EXPERIENCE = {
  new:         { label:'Brand new', sub:'Never trained, or 1+ year off', setAdj:0, floor:8,
                 implication:'Great news: beginners grow fastest, and almost any consistent plan works. We start <strong>lighter than you think</strong>, focus on learning each movement, and keep volume at the low end (~8–12 sets per muscle per week). Your first job is <strong>showing up</strong> — the weights will climb on their own.' },
  some:        { label:'Some experience', sub:'Under a year, on and off', setAdj:0, floor:10,
                 implication:'You know your way around, but consistency is the unlock. Moderate volume (~10–16 sets per muscle per week) with steady, small weight increases.' },
  experienced: { label:'Consistent 1+ year', sub:'Training regularly for a while', setAdj:1, floor:12,
                 implication:'You need a bit more stimulus to keep progressing — an extra set on the big lifts and ~12–20 sets per muscle per week.' }
};
const COACH_MUSCLES = [
  { id:'chest',     label:'Chest' },
  { id:'back',      label:'Back' },
  { id:'shoulders', label:'Shoulders' },
  { id:'biceps',    label:'Biceps' },
  { id:'triceps',   label:'Triceps' },
  { id:'quads',     label:'Quads / front of legs' },
  { id:'glutes',    label:'Glutes & hamstrings' },
  { id:'calves',    label:'Calves' },
  { id:'core',      label:'Core / abs' }
];
function muscleLabel(id){ const m = COACH_MUSCLES.find(x=>x.id===id); return m ? m.label : id; }
const COACH_TARGET_MODES = {
  twice: { label:'About twice a week', tag:'Recommended',
    implication:'Each priority muscle gets a fresh growth signal roughly <strong>every 3–4 days</strong>, with <strong>48–72 hours</strong> to recover and rebuild in between. This is the sweet spot for most people — enough frequency to keep growing, enough rest to actually grow. We\'ll also add an extra set to these muscles.' },
  once:  { label:'Once a week, high volume', tag:'Tight schedules',
    implication:'All the priority work lands in one session. That works for maintaining a muscle or if your schedule is tight, but the muscle only gets <strong>one growth signal per week</strong>, the later sets in a long session get sloppy, and you\'ll be sorer. Expect slower progress than twice a week.' },
  daily: { label:'As often as possible', tag:'Not recommended',
    implication:'It sounds like more = faster, but <strong>muscles grow while you recover, not while you train</strong>. Hit the same muscle on back-to-back days and it never finishes rebuilding, so it can\'t grow — and joint/tendon irritation goes up. If you pick this, I\'ll add the muscle to as many workouts as possible but <strong>automatically skip it any day after it was just trained</strong> (it needs ~48 hours).' }
};
const COACH_MINUTES = {
  30: 'Just the essentials: ~3–4 exercises, big movements first. Totally enough to make progress as a beginner.',
  45: 'The beginner sweet spot: ~4–6 exercises including some arm/shoulder isolation work.',
  60: 'Room for ~6–7 exercises and full rest periods. Huberman often suggests keeping hard lifting sessions to about an hour — after that, quality tends to drop.',
  75: 'Plenty of time. We still cap the hard work so quality stays high; extra time goes to proper rest between sets.'
};
const COACH_WARMUP = '5 min easy cardio (bike, brisk walk, jump rope) until you\'re lightly warm. Then on your first exercise do 2 light ramp-up sets: ~50% of today\'s weight × 8 reps, then ~75% × 4 reps. Save long static stretches for after the workout.';
const FATLOSS_FINISHER = { title:'Conditioning Finisher', duration:'8 min', description:'8 rounds of 40s hard / 20s easy on a bike, rower, jump rope, or brisk incline walk. Hard but controlled — you should be breathing heavily, not sloppy. This is the "little bit of high intensity" in your week.' };

/* ---------------- Exercise pools for each "slot" in a workout ----------------
   Earlier ids are preferred (beginner-friendly / easier to learn first). The
   generator picks the first one that matches your equipment. */
const SLOT_POOLS = {
  squat:        { muscle:'quads',     compound:true,  secondary:['glutes'],             ids:['gobletsquat','legpress','speediancesquat','hacksquat','squat','bwsquat'] },
  lunge:        { muscle:'quads',     compound:true,  secondary:['glutes'],             ids:['bulgariansplitsquat','lunge','stepup','curtsylunge','bwsquat'] },
  hinge:        { muscle:'glutes',    compound:true,  secondary:['back'],               ids:['dbrdl','trapbardl','deadlift','singlelegbridge'] },
  glute:        { muscle:'glutes',    compound:true,  secondary:[],                     ids:['hipthrust','speediancehipthrust','glutebridge','singlelegbridge','cablekickback'] },
  chestPress:   { muscle:'chest',     compound:true,  secondary:['triceps','shoulders'], ids:['dbbench','chestpress_speed','machinechestpress','bench','pushup'] },
  inclinePress: { muscle:'chest',     compound:true,  secondary:['shoulders','triceps'], ids:['inclinedbpress','speedianceinclinepress','inclinebarbell','pushup'] },
  shoulderPress:{ muscle:'shoulders', compound:true,  secondary:['triceps'],            ids:['dbshoulder','speedianceshoulderpress','machineshoulderpress','ohp','arnoldpress'] },
  pulldown:     { muscle:'back',      compound:true,  secondary:['biceps'],             ids:['latpull','widegriplatpulldown','speediancepulldown','pullup','invertedrow'] },
  row:          { muscle:'back',      compound:true,  secondary:['biceps'],             ids:['seatedrow_speed','cablerowwide','singlearmrow','dbbentrow','row','invertedrow'] },
  chestFly:     { muscle:'chest',     compound:false, secondary:[],                     ids:['cablefly_speed','pecdeck','dbfly','speediancefly','pushup'] },
  lateral:      { muscle:'shoulders', compound:false, secondary:[],                     ids:['lateralraise','cablelateralraise','speediancelateralraise'] },
  rearDelt:     { muscle:'shoulders', compound:false, secondary:['back'],               ids:['facepull','reardeltfly','bandpullapart'] },
  biceps:       { muscle:'biceps',    compound:false, secondary:[],                     ids:['curl','speediancecurl','cablecurl','hammercurl','inclinedbcurl','ezbarcurl'] },
  triceps:      { muscle:'triceps',   compound:false, secondary:[],                     ids:['tricepspushdown','ropepushdown','speediancetricepext','overheadtricepext','tricepdip'] },
  quadIso:      { muscle:'quads',     compound:false, secondary:[],                     ids:['legextension','speedianceextension','bulgariansplitsquat','bwsquat'] },
  hamCurl:      { muscle:'glutes',    compound:false, secondary:[],                     ids:['lyinglegcurl','seatedlegcurl','speediancelegcurl','dbrdl','singlelegbridge'] },
  calves:       { muscle:'calves',    compound:false, secondary:[],                     ids:['standingcalfraise','dbcalfraise','calfraise','seatedcalfraise'] },
  core:         { muscle:'core',      compound:false, secondary:[],                     ids:['deadbug','plank','cablecrunch','speediancewoodchopper','hanginglegraise','abwheel'] }
};
// Extra "priority" exercise added for a target muscle.
const EMPHASIS_POOL = { chest:'chestFly', back:'row', shoulders:'lateral', biceps:'biceps', triceps:'triceps', quads:'quadIso', glutes:'glute', calves:'calves', core:'core' };
// Best-guess muscle for exercises that weren't placed by the generator (user-added).
const CATEGORY_TO_MUSCLE = { chest:'chest', back:'back', shoulders:'shoulders', biceps:'biceps', triceps:'triceps', 'legs-compound':'quads', 'legs-isolation':'quads', glutes:'glutes', core:'core' };

const DAY_TEMPLATES = {
  fullA:  { title:'Full Body A', subtitle:'Squat, press, row + arms',         category:'fullbody',      variant:0, slots:['squat','chestPress','row','lateral','biceps','triceps','core'] },
  fullB:  { title:'Full Body B', subtitle:'Hinge, pulldown, incline + legs',  category:'fullbody',      variant:1, slots:['hinge','pulldown','inclinePress','lunge','rearDelt','triceps','biceps','calves'] },
  fullC:  { title:'Full Body C', subtitle:'Glutes, overhead press, row',      category:'fullbody',      variant:2, slots:['glute','shoulderPress','row','squat','chestFly','hamCurl','core'] },
  upperA: { title:'Upper A',     subtitle:'Chest, back, shoulders, arms',     category:'chest',         variant:0, slots:['chestPress','row','shoulderPress','pulldown','lateral','biceps','triceps'] },
  upperB: { title:'Upper B',     subtitle:'Back, chest, rear delts, arms',    category:'back',          variant:1, slots:['pulldown','inclinePress','row','chestFly','rearDelt','triceps','biceps'] },
  lowerA: { title:'Lower A',     subtitle:'Quads, glutes, hamstrings, calves',category:'legs-compound', variant:0, slots:['squat','hinge','quadIso','hamCurl','calves','core'] },
  lowerB: { title:'Lower B',     subtitle:'Glutes, hamstrings, quads, calves',category:'glutes',        variant:1, slots:['hinge','lunge','glute','hamCurl','calves','core'] },
  push:   { title:'Push',        subtitle:'Chest, shoulders, triceps',        category:'chest',         variant:0, slots:['chestPress','shoulderPress','inclinePress','lateral','chestFly','triceps'] },
  pull:   { title:'Pull',        subtitle:'Back, rear delts, biceps, core',   category:'back',          variant:0, slots:['pulldown','row','rearDelt','biceps','core'] },
  legs:   { title:'Legs',        subtitle:'Quads, glutes, hamstrings, calves',category:'legs-compound', variant:0, slots:['squat','hinge','lunge','quadIso','hamCurl','calves'] },
  pushB:  { title:'Push B',      subtitle:'Chest, shoulders, triceps',        category:'chest',         variant:1, slots:['inclinePress','shoulderPress','chestPress','lateral','chestFly','triceps'] },
  pullB:  { title:'Pull B',      subtitle:'Back, rear delts, biceps, core',   category:'back',          variant:1, slots:['row','pulldown','rearDelt','biceps','core'] },
  legsB:  { title:'Legs B',      subtitle:'Glutes, hamstrings, quads, calves',category:'glutes',        variant:1, slots:['hinge','squat','glute','hamCurl','calves'] }
};
const SPLIT_OPTIONS = {
  2: [ { name:'Full Body A / B', t:['fullA','fullB'] } ],
  3: [ { name:'Full Body A / B / C', t:['fullA','fullB','fullC'] },
       { name:'Push / Pull / Legs',  t:['push','pull','legs'] },
       { name:'Upper / Lower / Full Body', t:['upperA','lowerA','fullC'] } ],
  4: [ { name:'Upper / Lower', t:['upperA','lowerA','upperB','lowerB'] } ],
  5: [ { name:'Upper / Lower + Push / Pull / Legs', t:['upperA','lowerA','push','pull','legs'] } ],
  6: [ { name:'Push / Pull / Legs ×2', t:['push','pull','legs','pushB','pullB','legsB'] } ]
};

function tplMuscles(key){ return new Set(DAY_TEMPLATES[key].slots.map(s=>SLOT_POOLS[s].muscle)); }
// Days from weekday a to the next weekday b (1–7).
function gapDays(a, b){ return ((WEEK_ORDER.indexOf(b) - WEEK_ORDER.indexOf(a)) + 7) % 7 || 7; }
function permutations(arr){
  if(arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x,i)=>{ permutations(arr.slice(0,i).concat(arr.slice(i+1))).forEach(p=> out.push([x].concat(p))); });
  return out;
}
function scoreArrangement(days, keys){
  let penalty = 0;
  if(days.length > 1){
    days.forEach((d,i)=>{
      const j = (i+1) % days.length;
      if(gapDays(d, days[j]) === 1){
        const A = tplMuscles(keys[i]), B = tplMuscles(keys[j]);
        penalty += [...A].filter(m=>B.has(m)).length;
      }
    });
  }
  const freq = {};
  keys.forEach(k=> tplMuscles(k).forEach(m=> freq[m] = (freq[m]||0) + 1));
  const bonus = Object.values(freq).filter(f=>f>=2).length;
  return bonus - penalty*2;
}
function hasBackToBack(days){ return days.length > 1 && days.some((d,i)=> gapDays(d, days[(i+1)%days.length]) === 1); }
function chooseSplit(daysIn){
  const days = WEEK_ORDER.filter(d=>daysIn.includes(d));
  const options = SPLIT_OPTIONS[days.length];
  if(!options) return null;
  let best = null;
  options.forEach((opt, oi)=>{
    permutations(opt.t).forEach(p=>{
      const s = scoreArrangement(days, p) - oi*0.01; // tie-break: earlier option preferred
      if(!best || s > best.score) best = { score:s, name:opt.name, templates:p };
    });
  });
  best.days = days;
  best.why = hasBackToBack(days)
    ? 'Some of your days are back-to-back, so the plan <strong>rotates muscle groups</strong> — no muscle gets hammered two days in a row, and each one still gets its 48+ hours to recover.'
    : 'Your days are spaced out, so each session can train more of the body and every muscle still gets 48+ hours to recover before you hit it again.';
  return best;
}

let _buildCycle = 0;  // increases with each 8-week refresh to rotate in exercise variations
let _buildProtect = {}; // areas to protect while the program generator picks exercises
function pickExercise(poolKey, variant, used, equip){
  const pool = SLOT_POOLS[poolKey];
  const lookup = id => exercises.find(e=>e.id===id);
  let list = pool.ids.map(lookup).filter(ex=> ex && equip.includes(ex.equipment) && !used.has(ex.id) && !exConflict(ex, _buildProtect).blocked);
  if(!list.length) list = pool.ids.map(lookup).filter(ex=> ex && ex.equipment==='bodyweight' && !used.has(ex.id) && !exConflict(ex, _buildProtect).blocked);
  if(!list.length) return null;
  // Keep the big lifts the same so you practice them (they rotate each plan refresh); vary the small ones.
  const v = pool.compound ? (_buildCycle % 2) : ((variant||0) + _buildCycle);
  return list[v % list.length];
}

function buildProgram(a){
  const goal = COACH_GOALS[a.goal] || COACH_GOALS.hypertrophy;
  const exp = COACH_EXPERIENCE[a.experience] || COACH_EXPERIENCE.new;
  _buildProtect = {}; (a.protect||[]).forEach(g=> _buildProtect[g] = 'sore');
  _buildCycle = a.cycle || 0;
  const split = chooseSplit(a.days);
  if(!split) return null;
  const days = split.days;
  const equip = (a.equipment && a.equipment.length) ? a.equipment : ['bodyweight'];
  const targets = a.targets || [];
  const notes = [];
  const prevGap = days.map((d,i)=> days.length>1 ? gapDays(days[(i-1+days.length)%days.length], d) : 7);

  const built = days.map((wd,i)=>{
    const tpl = DAY_TEMPLATES[split.templates[i]];
    return { wd, tplKey: split.templates[i], tpl, slots: tpl.slots.map(p=>({ pool:p, extra:false, bonusSets:0 })) };
  });
  const trains = (b, m) => b.slots.some(s=> SLOT_POOLS[s.pool].muscle === m);

  targets.forEach(m=>{
    const label = muscleLabel(m).toLowerCase();
    if(a.targetMode === 'once'){
      const first = built.find(b=>trains(b,m)) || built[0];
      first.slots.push({ pool:EMPHASIS_POOL[m], extra:true, bonusSets:1 });
      notes.push(`Your extra ${label} work is concentrated on ${WD_LONG[first.wd]}.`);
    } else if(a.targetMode === 'daily'){
      built.forEach((b,i)=>{
        const prev = built[(i-1+built.length)%built.length];
        if(built.length>1 && prevGap[i]===1 && trains(prev, m)){
          notes.push(`Skipped extra ${label} on ${WD_LONG[b.wd]} — it was trained the day before and needs ~48 h to recover.`);
          return;
        }
        if(!b.slots.some(s=> SLOT_POOLS[s.pool].muscle===m && !SLOT_POOLS[s.pool].compound)){
          b.slots.push({ pool:EMPHASIS_POOL[m], extra:true, bonusSets:0 });
        }
      });
    } else { // twice a week (default)
      built.forEach(b=> b.slots.forEach(s=>{ if(SLOT_POOLS[s.pool].muscle===m) s.bonusSets = 1; }));
      let hitting = built.filter(b=>trains(b,m)).length;
      built.forEach((b,i)=>{
        if(hitting >= 2 || trains(b,m)) return;
        const prev = built[(i-1+built.length)%built.length];
        const next = built[(i+1)%built.length];
        const nextGap = built.length>1 ? prevGap[(i+1)%built.length] : 7;
        if((prevGap[i]===1 && trains(prev,m)) || (nextGap===1 && trains(next,m))) return;
        b.slots.push({ pool:EMPHASIS_POOL[m], extra:true, bonusSets:0 });
        hitting++;
      });
    }
  });

  const budget = (a.minutes||45) - 5 - (goal.finisher ? 8 : 0);
  const isT = s => targets.includes(SLOT_POOLS[s.pool].muscle);
  const rxOf = s => {
    const p = SLOT_POOLS[s.pool];
    let sets = (p.compound ? goal.sets + exp.setAdj : goal.isoSets) + (s.bonusSets||0);
    if(s.extra && a.targetMode === 'daily') sets = 2;
    sets = clampNum(sets, 2, p.compound ? 5 : 4);
    return { sets, reps: p.compound ? goal.reps : goal.isoReps, rest: p.compound ? goal.rest : goal.isoRest };
  };
  // ~40 s of work per set, rest between sets (not after the last), ~1 min to set up each exercise.
  const minutesFor = list => list.reduce((t,s)=>{ const r = rxOf(s); return t + (r.sets*40 + (r.sets-1)*r.rest)/60 + 1; }, 0);

  const programDays = built.map(b=>{
    // Big compound lifts first (when you're freshest), priority muscles first within each group.
    let slots = b.slots.map((s,idx)=>Object.assign({}, s, {idx}));
    slots.sort((x,y)=> (SLOT_POOLS[x.pool].compound?0:1) - (SLOT_POOLS[y.pool].compound?0:1) || (isT(x)?0:1) - (isT(y)?0:1) || x.idx - y.idx);
    // Trim to the time budget — drop non-priority accessories from the end first.
    // Trim to the time budget. Drop, in order: a non-priority exercise whose muscle is already
    // covered by another exercise that day → any non-priority exercise → the last one.
    const covered = (list, j) => list.some((x,i)=> i!==j && SLOT_POOLS[x.pool].muscle === SLOT_POOLS[list[j].pool].muscle);
    while(slots.length > 3 && minutesFor(slots) > budget){
      let k = -1;
      for(let j=slots.length-1; j>=0 && k<0; j--){ if(!isT(slots[j]) && covered(slots, j)) k = j; }
      for(let j=slots.length-1; j>=0 && k<0; j--){ if(!isT(slots[j])) k = j; }
      if(k < 0) k = slots.length - 1;
      slots.splice(k, 1);
    }
    const used = new Set(), lifts = [], rx = {};
    slots.forEach(s=>{
      const ex = pickExercise(s.pool, b.tpl.variant, used, equip);
      if(!ex) return;
      used.add(ex.id); lifts.push(ex.id);
      rx[ex.id] = Object.assign(rxOf(s), { pool:s.pool, emphasis:isT(s) });
    });
    const total = Math.round(5 + minutesFor(slots) + (goal.finisher ? 8 : 0));
    return {
      id:'coach-'+b.wd+'-'+b.tplKey, dayLabel:WD_SHORT[b.wd], weekday:b.wd,
      title:b.tpl.title, subtitle:b.tpl.subtitle, duration:'~'+total+' min', badge:null, category:b.tpl.category,
      coachGenerated:true, warmup:{ duration:'5 min', description:COACH_WARMUP },
      lifts, rx, finisher: goal.finisher ? Object.assign({}, FATLOSS_FINISHER) : null
    };
  });

  // Make sure priority muscles get at least the minimum weekly volume for your level.
  targets.forEach(m=>{
    const map = muscleMap(programDays);
    if(map[m].direct >= exp.floor) return;
    programDays.forEach(d=> d.lifts.forEach(id=>{
      const r = d.rx[id];
      if(SLOT_POOLS[r.pool].muscle === m) r.sets = Math.min(r.sets + 1, SLOT_POOLS[r.pool].compound ? 5 : 4);
    }));
  });

  return { split, days: programDays, notes };
}

// Weekly hard sets + frequency per muscle. Direct sets count fully; compound
// lifts also count half a set for the helper muscles (e.g. bench → triceps).
function muscleMap(days){
  const m = {};
  COACH_MUSCLES.forEach(x=> m[x.id] = { direct:0, indirect:0, days:[] });
  days.forEach(d=> (d.lifts||[]).forEach(id=>{
    const r = d.rx && d.rx[id];
    let muscle, sets, secondary = [];
    if(r && SLOT_POOLS[r.pool]){ muscle = SLOT_POOLS[r.pool].muscle; sets = r.sets; secondary = SLOT_POOLS[r.pool].secondary||[]; }
    else { const ex = exercises.find(e=>e.id===id); if(!ex) return; muscle = CATEGORY_TO_MUSCLE[ex.category]; sets = ex.targetSets||3; }
    if(!muscle || !m[muscle]) return;
    m[muscle].direct += sets;
    const wd = d.weekday != null ? d.weekday : null;
    if(wd != null && !m[muscle].days.includes(wd)) m[muscle].days.push(wd);
    secondary.forEach(s=>{ if(m[s]) m[s].indirect += sets*0.5; });
  }));
  return m;
}

/* ---------------- Schedule, check-ins & consistency ---------------- */
function scheduledDayFor(dateStr){
  if(!coachOn()) return null;
  const id = profile.coach.schedule[weekdayOf(dateStr)];
  return id ? (WORKOUT_DAYS.find(d=>d.id===id) || null) : null;
}
function didTrainOn(dateStr){ return logs.some(l=>l.date===dateStr) || activityLogs.some(a=>a.date===dateStr) || sprintSessions.some(s=>s.date===dateStr); }
function weekDates(refDate){
  const offset = (weekdayOf(refDate) + 6) % 7; // days since Monday
  const mon = addDaysToDateStr(refDate, -offset);
  return [0,1,2,3,4,5,6].map(k=> addDaysToDateStr(mon, k));
}
function dateStatus(d){
  const today = todayStr();
  const planned = scheduledDayFor(d);
  const counted = coachOn() && d >= (profile.coach.builtAt || today);
  const trained = didTrainOn(d);
  if(trained) return { date:d, planned, status: planned ? 'done' : 'bonus' };
  if(planned && onVacation(d)) return { date:d, planned, status:'vacation' };
  if(planned && d < today) return { date:d, planned, status: counted ? 'missed' : 'pre' };
  if(planned && d === today) return { date:d, planned, status:'today' };
  if(planned) return { date:d, planned, status:'planned' };
  return { date:d, planned:null, status:'rest' };
}
function weekSummary(ref){
  const cells = weekDates(ref).map(dateStatus);
  const built = profile.coach.builtAt || todayStr();
  const plannedCount = cells.filter(c=>c.planned && c.date >= built && c.status !== 'vacation').length;
  const doneCount = Math.min(plannedCount || cells.length, cells.filter(c=>c.status==='done' || c.status==='bonus').length);
  const missed = cells.filter(c=>c.status==='missed');
  const bonus = cells.filter(c=>c.status==='bonus').length;
  return { cells, plannedCount, doneCount, missed, bonus };
}
// Planned sessions completed in a row (rest days never break it).
function planStreak(){
  if(!coachOn()) return 0;
  const built = profile.coach.builtAt || todayStr();
  let d = todayStr(), streak = 0;
  for(let i=0; i<400 && d >= built; i++, d = addDaysToDateStr(d,-1)){
    if(!scheduledDayFor(d) || (onVacation(d) && !didTrainOn(d))) continue; // vacation days pause the streak
    if(didTrainOn(d)) streak++;
    else if(d === todayStr()) continue;
    else break;
  }
  return streak;
}
function nextSessionAfter(dateStr){
  for(let k=1; k<=7; k++){ const d = addDaysToDateStr(dateStr, k); const day = scheduledDayFor(d); if(day) return { date:d, day }; }
  return null;
}
function todayCheckin(){ return checkins.find(c=>c.date===todayStr()) || null; }
function todayReadiness(){ const c = todayCheckin(); return c ? c.readiness : 3; }

const FEEL_OPTIONS = [
  { v:1, e:'😫', l:'Rough' }, { v:2, e:'😕', l:'Meh' }, { v:3, e:'😐', l:'OK' }, { v:4, e:'🙂', l:'Good' }, { v:5, e:'💪', l:'Great' }
];
const SLEEP_OPTIONS = [ { v:-1, l:'Poor (<6 h)' }, { v:0, l:'OK' }, { v:1, l:'Great (7–9 h)' } ];
const SORE_OPTIONS  = [ { v:-1, l:'Very sore' }, { v:0, l:'A little' }, { v:1, l:'Not at all' } ];
const READINESS_INFO = {
  5: { label:'Primed',  color:'var(--accent)',  msg:'You feel great — today\'s lifts get a small weight bump. Keep form clean; only keep the extra weight if every rep looks good.' },
  4: { label:'Good',    color:'var(--accent)',  msg:'Good to go. Weights go up on any lift where you hit all your reps last time.' },
  3: { label:'Steady',  color:'var(--warn)',    msg:'Solid day. Hold your weights and own every rep — earned increases wait for a day you feel Good or better.' },
  2: { label:'Low',     color:'var(--accent2)', msg:'Lower energy: same weights, one fewer set per exercise. Showing up is the win today.' },
  1: { label:'Recover', color:'var(--danger)',  msg:'Rough day: ~10% lighter and one fewer set, focus on technique. If you feel sick or truly wrecked, a walk and an early night beats forcing it.' }
};
let checkinDraft = { feel:null, sleep:0, sore:0, recovering:{} };
function computeReadiness(c){
  let score = c.feel;
  // Marking a muscle sore/resting counts as "very sore" unless the soreness question already says so.
  const flagged = c.recovering && Object.keys(c.recovering).length;
  if(c.sleep === -1) score -= 1; else if(c.sleep === 1) score += 0.5;
  if(c.sore === -1 || (flagged && c.sore === 0)) score -= 1;
  return clampNum(Math.round(score), 1, 5);
}
function setCheckin(field, v){ checkinDraft[field] = v; renderPlanView(); }
function submitCheckin(skip){
  if(!skip && checkinDraft.feel == null){ showToast('Tap how you feel first'); return; }
  const c = skip ? { feel:3, sleep:0, sore:0, skipped:true, recovering:{} } : Object.assign({}, checkinDraft, { recovering: Object.assign({}, checkinDraft.recovering||{}) });
  if(!skip && Object.values(c.recovering).some(v=>v==='sore') && c.sore === 0) c.sore = -1; // flagged soreness counts toward readiness
  c.readiness = computeReadiness(c);
  c.id = uid(); c.date = todayStr();
  const plan = loadTodayPlan(); c.dayId = plan && plan.dayId || null;
  checkins = checkins.filter(x=>x.date !== c.date).concat(c);
  saveAll();
  checkinDraft = { feel:null, sleep:0, sore:0, recovering:{} };
  // Swap/skip anything in today's workout that would load a sore or resting area.
  const planDay = plan && plan.kind === 'lift' ? WORKOUT_DAYS.find(d=>d.id===plan.dayId) : null;
  if(planDay){
    const rs = computeRecoverySwaps(planDay);
    saveTodayPlan({ swaps: rs.swaps, skips: rs.skips, swapReasons: rs.reasons });
    const n = Object.keys(rs.swaps).length + rs.skips.length;
    if(n) setTimeout(()=> showToast(`🩹 Adjusted ${n} exercise${n>1?'s':''} to protect what's sore`), 1500);
  }
  showToast(skip ? 'Check-in skipped — using normal weights' : 'Checked in ✓ Readiness ' + c.readiness + '/5');
  renderPlanView(); renderDashboard();
}
function renderCheckinHtml(day){
  const name = profile.coach && profile.coach.name ? ', ' + escapeHtml(profile.coach.name) : '';
  const seg = (field, opts) => `<div class="seg-row">${opts.map(o=>`<button class="seg-btn${checkinDraft[field]===o.v?' active':''}" onclick="setCheckin('${field}',${o.v})">${o.e?`<span class="seg-emoji">${o.e}</span>`:''}${o.l}</button>`).join('')}</div>`;
  let preview = '';
  if(checkinDraft.feel != null){
    const r = computeReadiness(checkinDraft), info = READINESS_INFO[r];
    preview = `<div class="coach-why" style="border-left-color:${info.color}"><strong style="color:${info.color}">Readiness ${r}/5 — ${info.label}.</strong> ${info.msg}</div>`;
  }
  return `<div style="display:flex;align-items:center;gap:12px;">${iconBadge({category:day.category})}<div><h2 style="margin-bottom:2px;">Check in${name}</h2><div class="hint" style="margin-bottom:0;">${day.dayLabel} — ${day.title} · ${day.duration||''}</div></div></div>
    <div class="hint" style="margin-top:12px;">10 seconds. Your answers set today's weights — <strong>the better you feel, the more you'll lift</strong>. Adjusting to how you feel (coaches call it autoregulation) beats forcing a fixed number on a bad day.</div>
    <label>How do you feel going into this workout?</label>${seg('feel', FEEL_OPTIONS)}
    <label>Sleep last night</label>${seg('sleep', SLEEP_OPTIONS)}
    <label>Soreness in today's muscles</label>${seg('sore', SORE_OPTIONS)}
    <label>Anything sore, tired or recovering? <span style="font-weight:500;">(optional)</span></label>
    ${recoveryPickerHtml(checkinDraft.recovering || {}, 'setCheckinRecovery')}
    ${preview}
    <div class="wizard-actions">
      <button class="btn ghost" onclick="submitCheckin(true)">Skip check-in</button>
      <button class="btn" onclick="submitCheckin()">Lock it in & start →</button>
    </div>`;
}

function startScheduledWorkout(dayId){
  const plan = loadTodayPlan();
  if(!(plan && plan.kind==='lift' && plan.dayId===dayId)) selectPlanDay(dayId);
  switchView('plan');
}

/* ---------------- Weight suggestions (readiness + double progression) ---------------- */
function roundToInc(w, inc){ const step = inc > 0 ? inc : 1; return Math.round(w/step)*step; }
function workingWeight(ex){
  if(ex.workingWeight != null && ex.workingWeight !== '' && !isNaN(+ex.workingWeight)) return +ex.workingWeight;
  return targetForExerciseAtWeek(ex, currentWeekNumber());
}
function rxFor(ex, day){
  const r = day && day.rx && day.rx[ex.id];
  return r ? r : { sets: ex.targetSets || 3, reps: ex.targetReps != null ? ex.targetReps : 10, rest: 90 };
}
function rxRepsText(ex, rx){
  if(ex.repsAreTime) return `${ex.targetReps} work`;
  if(ex.unit === 'seconds') return 'hold';
  if(ex.unit === 'reps') return 'reps';
  return `${rx.reps} reps`;
}
function suggestFor(ex, rx, readiness){
  const base = workingWeight(ex);
  const inc = ex.increment > 0 ? ex.increment : (ex.unit === 'lb' ? 5 : 1);
  const r = readiness || 3;
  const earned = ex.progress === 'up';
  let w = base, sets = rx.sets, reasons = [];
  const step = n => fmtWeight(ex, round2(n*inc)).replace(/^/, '+');
  reasons.push(ex.workingWeight != null && ex.workingWeight !== ''
    ? `Your working weight is ${fmtWeight(ex, base)}.`
    : `Starter weight — if it's clearly too light or heavy, update your working weight below.`);
  if(ex.progress === 'down'){ w = base - inc; reasons.push('Last time felt too hard, so we start one step lighter.'); }
  if(r >= 5){
    let n = earned ? 2 : 1;
    if(n === 2 && 2*inc > Math.max(inc, base*0.1)) n = 1; // keep jumps sensible on light weights
    w += n*inc;
    reasons.push(earned ? `You hit all your reps last time and feel great → ${step(n)}.` : `You feel great → ${step(1)}. Keep it only if form stays clean.`);
  } else if(r === 4){
    if(earned){ w += inc; reasons.push(`Feeling good and you earned it last time → ${step(1)}.`); }
    else reasons.push('Feeling good — same weight. Hit the top of the rep range on every set to earn an increase.');
  } else if(r === 3){
    reasons.push(earned ? 'You earned a jump last time, but you\'re feeling just OK — hold today and take it on a better day.' : 'Feeling OK — hold steady and own every rep.');
  } else if(r === 2){
    sets = Math.max(1, sets - 1);
    reasons.push('Low energy → same weight, one fewer set.');
  } else {
    sets = Math.max(1, sets - 1);
    let lighter = roundToInc(w*0.9, inc); if(lighter >= w) lighter = w - inc;
    w = lighter;
    reasons.push('Rough day → about 10% lighter and one fewer set. Technique day.');
  }
  const dl = applyDeload(ex, w, sets, inc, reasons); w = dl.w; sets = dl.sets;
  w = round2(Math.max(ex.unit === 'lb' ? 0 : 1, w));
  return { weight:w, sets, reasons, base };
}
// Called after you finish an exercise: decides next time's direction.
function updateProgressAfter(ex, sets, rx, feel, readiness){
  if(!sets.length) return;
  const vals = sets.map(s=> ex.unit === 'lb' ? (s.weight||0) : (s.weight||s.reps||0));
  const top = Math.max(...vals);
  const [lo, hi] = repRange(rx.reps);
  let flag = 'hold';
  if(ex.unit === 'lb' && !ex.repsAreTime){
    const allTop = sets.every(s=> s.reps >= hi);
    if(feel === 'hard') flag = 'down';
    else if(feel === 'easy' || allTop) flag = 'up';
    else if(sets.some(s=> s.reps > 0 && s.reps < lo)) flag = 'hold';
  } else {
    if(feel === 'hard') flag = 'down';
    else if(feel === 'easy') flag = 'up';
  }
  const prev = (ex.workingWeight != null && ex.workingWeight !== '') ? +ex.workingWeight : null;
  // On a "rough day" you lifted lighter on purpose — don't let that lower your working weight.
  if(top > 0){
    if(prev != null && top < prev && flag !== 'down' && (readiness <= 2 || isDeloadWeek())) { /* lighter on purpose — keep prev */ }
    else ex.workingWeight = top;
  }
  ex.progress = flag; ex.lastFeel = feel; ex.lastDone = todayStr();
}

/* ---------------- Exercise instructions ("how to do it") ---------------- */
const CUE_SQUAT = { setup:'Feet about shoulder-width, toes turned out slightly. Hold the weight at your chest (or set up on the machine/handles).', cues:['Brace your stomach like you\'re about to get poked — keep that tension the whole rep.','Sit down and back between your heels; knees travel in the same direction as your toes.','Go as deep as you can while your back stays flat and heels stay down, then drive up through your whole foot.'], avoid:'Knees caving in, heels lifting, or rounding your lower back at the bottom.' };
const CUE_LEGPRESS = { setup:'Back flat on the pad, feet shoulder-width in the middle of the platform.', cues:['Lower with control until knees are around 90° (or as deep as your lower back stays on the pad).','Push through your whole foot, not just your toes.','Stop just short of locking your knees at the top.'], avoid:'Your hips rolling up off the seat at the bottom — that\'s too deep for now.' };
const CUE_SPLITSQUAT = { setup:'Back foot up on a bench, front foot about 2 feet forward, weights at your sides.', cues:['Drop your back knee straight down toward the floor.','Keep most of your weight on the front foot; front knee may travel over the toes.','Push through the front heel to stand. Do all reps on one leg, then switch.'], avoid:'Front foot too close to the bench (heel lifts, knee pain). Use a wall for balance at first.' };
const CUE_LUNGE = { setup:'Stand tall, weights at your sides (or Speediance handles).', cues:['Step forward and lower until both knees are about 90°.','Torso tall, front knee tracking over your toes.','Push through the front heel to come back up.'], avoid:'Short choppy steps — they turn it into a knee exercise.' };
const CUE_RDL = { setup:'Stand tall holding the weight in front of your thighs, knees softly bent.', cues:['Push your hips straight back like you\'re closing a car door with your butt.','Keep the weight sliding close to your legs and your back flat.','Stop when you feel a strong hamstring stretch (usually around mid-shin), then squeeze your glutes to stand up.'], avoid:'Rounding your back to reach lower — the range comes from your hips, not your spine.' };
const CUE_DEADLIFT = { setup:'Bar over the middle of your feet, shins close, hands just outside your legs.', cues:['Flat back, chest up; pull the slack out of the bar and brace before it moves.','Push the floor away — bar stays in contact with your legs.','Stand tall at the top; don\'t lean back.'], avoid:'Rounding your lower back or jerking the bar off the floor. This one is technique-first — stay light until it feels automatic.' };
const CUE_HIPTHRUST = { setup:'Upper back on the edge of a bench, weight across your hips (use a pad), feet flat and about shoulder-width.', cues:['Tuck your chin and keep ribs down.','Drive through your heels until hips are level with knees and shoulders — shins vertical at the top.','Squeeze your glutes hard for 1 second at the top, lower with control.'], avoid:'Arching your lower back to get "higher" — the movement is at the hips.' };
const CUE_LEGCURL = { setup:'Adjust the pad so it sits just above your heels; knees line up with the machine\'s pivot.', cues:['Curl as far as you can and squeeze your hamstrings.','Lower slowly — about 3 seconds.','Keep your hips pressed down / back into the pad.'], avoid:'Hips lifting or swinging the weight up.' };
const CUE_LEGEXT = { setup:'Back against the pad, knees lined up with the machine\'s pivot, pad on the front of your ankles.', cues:['Straighten your legs fully and squeeze your quads for a second.','Lower slowly, about 2–3 seconds.','Hold the handles to keep your hips down.'], avoid:'Kicking the weight up with momentum.' };
const CUE_CALF = { setup:'Balls of your feet on the edge of a step or platform, heels free.', cues:['Lower your heels as far as you can and pause 1–2 seconds in the stretch.','Rise as high as possible onto your big toe.','Pause at the top, then lower slowly.'], avoid:'Fast bouncing reps — calves respond to full range and pauses.' };
const CUE_BENCH = { setup:'Lie with eyes under the bar/handles, squeeze shoulder blades together and down, feet planted.', cues:['Lower to your mid-chest with elbows about 45° from your body.','Touch lightly — no bouncing — then press up and slightly back.','Keep your butt and shoulder blades on the bench.'], avoid:'Elbows flared straight out to the sides. With a barbell, use a spotter or safety pins.' };
const CUE_DBBENCH = { setup:'Sit with dumbbells on your thighs, lie back and kick them up to your chest. Shoulder blades pinched together.', cues:['Lower until the dumbbells are beside your chest, elbows about 45° from your body.','Press up, bringing the dumbbells slightly together over your chest.','Control the lowering — about 2 seconds.'], avoid:'Dropping elbows far below the bench or letting the weights drift toward your face.' };
const CUE_INCLINE = { setup:'Bench at a low incline (about 30°). Shoulder blades pinched together and down.', cues:['Lower to your upper chest, elbows about 45° from your body.','Press up and slightly back.','Control the lowering for about 2 seconds.'], avoid:'Bench set too steep — it turns into a shoulder press.' };
const CUE_PUSHUP = { setup:'Hands slightly wider than shoulders, body in one straight line from head to heels.', cues:['Squeeze glutes and brace your stomach.','Lower until your chest is about an inch from the floor, elbows about 45°.','Press back up as one unit.'], avoid:'Hips sagging. Can\'t do full reps yet? Put your hands on a bench — that counts.' };
const CUE_FLY = { setup:'Arms out to the sides with a slight bend in the elbows — lock that bend in.', cues:['Bring your hands together in a big arc, like hugging a tree.','Squeeze your chest at the end.','Open back up until you feel a stretch across your chest, not your shoulders.'], avoid:'Turning it into a press by bending your elbows more, or going too heavy.' };
const CUE_PULLDOWN = { setup:'Grip a little wider than shoulders, thighs locked under the pad.', cues:['Lead with your elbows: drive them down to your sides, toward your back pockets.','Bring the bar/handles to your upper chest with a slight lean back.','Let your arms fully straighten at the top for a good stretch.'], avoid:'Swinging your body to move the weight or pulling behind your neck.' };
const CUE_SEATEDROW = { setup:'Sit tall, feet braced, slight bend in your knees.', cues:['Pull the handle toward your belly button.','Squeeze your shoulder blades together at the end.','Let your arms stretch forward on the way back, but keep your spine tall.'], avoid:'Rocking your torso back and forth to move the weight.' };
const CUE_DBROW = { setup:'One hand and knee on a bench, back flat, dumbbell hanging under your shoulder.', cues:['Pull the dumbbell toward your hip (not your shoulder).','Squeeze your back at the top for a second.','Lower to a full stretch.'], avoid:'Twisting your torso open to lift heavier.' };
const CUE_BBROW = { setup:'Hinge forward to about 45° with a flat back, bar hanging at arm\'s length.', cues:['Pull the bar to your lower ribs.','Squeeze shoulder blades together.','Lower under control.'], avoid:'Standing up taller each rep to cheat the weight up.' };
const CUE_FACEPULL = { setup:'Rope at about face height. Grab with thumbs pointing toward you.', cues:['Pull toward your forehead with elbows high and wide.','Finish with hands beside your ears, like a double-biceps pose.','Return slowly. Light weight — this is for shoulder health and posture.'], avoid:'Leaning back or going heavy.' };
const CUE_REARDELT = { setup:'Hinge forward with a flat back, light dumbbells hanging under your chest.', cues:['Raise the weights out to the sides with soft elbows.','Squeeze the backs of your shoulders at the top.','Lower slowly.'], avoid:'Shrugging or swinging. Use light weight.' };
const CUE_OHP = { setup:'Weights at shoulder height, palms forward, glutes squeezed and stomach braced.', cues:['Press straight up until your arms are almost locked, biceps beside your ears.','Lower to about chin level.','Keep your ribs down the whole time.'], avoid:'Arching your lower back to push the weight up.' };
const CUE_LATERAL = { setup:'Stand tall with a slight forward lean, soft elbows, light weights at your sides.', cues:['Raise out to the sides, leading with your elbows, until arms are about parallel to the floor.','Pause for a moment at the top.','Lower over 2–3 seconds.'], avoid:'Shrugging your shoulders up or swinging. This is a light-weight exercise for everyone.' };
const CUE_CURL = { setup:'Stand tall, elbows pinned at your sides.', cues:['Curl the weight up without your elbows moving forward.','Squeeze your biceps for a second at the top.','Lower all the way down over 2–3 seconds — the lowering builds muscle too.'], avoid:'Swinging your body or cutting the bottom of the rep short.' };
const CUE_PUSHDOWN = { setup:'Stand close to the cable, slight forward lean, elbows pinned at your sides.', cues:['Push down until your arms are completely straight; squeeze.','Let your forearms come back up to about 90°.','Only your forearms move — elbows stay put.'], avoid:'Elbows flaring or leaning your bodyweight onto the bar.' };
const CUE_OHEXT = { setup:'Hold the weight overhead with both hands, elbows pointing forward near your ears.', cues:['Lower behind your head until you feel a deep stretch in the back of your arms.','Extend back up to straight arms.','Keep your elbows from flaring out.'], avoid:'Arching your lower back — brace your stomach.' };
const CUE_DIP = { setup:'Hands on a bench behind you (or parallel bars), legs out in front.', cues:['Lower until elbows reach about 90°.','Keep your back close to the bench.','Press up to straight arms.'], avoid:'Going so deep your shoulders hurt — stop at 90°.' };
const CUE_DEADBUG = { setup:'Lie on your back, arms pointing at the ceiling, knees bent at 90° over your hips.', cues:['Press your lower back flat into the floor.','Slowly reach one arm back and the opposite leg out, exhaling.','Return and switch sides. Slow is the point.'], avoid:'Your lower back lifting off the floor — shorten the reach if it does.' };
const CUE_PLANK = { setup:'Forearms under your shoulders, body straight from head to heels.', cues:['Squeeze your glutes and brace like you\'re about to be punched.','Breathe slowly while holding the tension.','Stop the set when your hips start to sag.'], avoid:'Hips piked up high or sagging down.' };
const CUE_CABLECRUNCH = { setup:'Kneel facing the cable, rope held beside your head.', cues:['Curl your ribs toward your hips — round your spine.','Squeeze your abs at the bottom.','Return slowly.'], avoid:'Just bending at the hips — the movement is your spine curling.' };

const EXERCISE_COACHING = {
  gobletsquat:CUE_SQUAT, speediancesquat:CUE_SQUAT, frontsquat:CUE_SQUAT, bwsquat:CUE_SQUAT, sumosquat:CUE_SQUAT,
  squat:{ setup:'Bar on your upper back (not your neck), hands just outside shoulders, feet shoulder-width.', cues:CUE_SQUAT.cues, avoid:'Adding weight before the movement feels automatic. Use safety pins in the rack.' },
  legpress:CUE_LEGPRESS, hacksquat:CUE_LEGPRESS, 'speedianceleg press':CUE_LEGPRESS,
  bulgariansplitsquat:CUE_SPLITSQUAT, lunge:CUE_LUNGE, curtsylunge:CUE_LUNGE,
  stepup:{ setup:'Box or bench about knee height, weights at your sides.', cues:['Put your whole foot on the box.','Push through that heel to stand up — don\'t push off the back foot.','Lower slowly.'], avoid:'Box too high (knee way above hip).' },
  dbrdl:CUE_RDL, deadlift:CUE_DEADLIFT, trapbardl:CUE_DEADLIFT, sumodeadlift:CUE_DEADLIFT, rackpull:CUE_DEADLIFT,
  hipthrust:CUE_HIPTHRUST, speediancehipthrust:CUE_HIPTHRUST,
  glutebridge:{ setup:'Lie on your back, knees bent, feet flat, weight across your hips.', cues:CUE_HIPTHRUST.cues.slice(0,1).concat(['Drive hips up until your body is a straight line from knees to shoulders.','Squeeze glutes for 1 second, lower slowly.']), avoid:CUE_HIPTHRUST.avoid },
  singlelegbridge:{ setup:'Lie on your back, one foot flat, the other leg straight in the air.', cues:['Drive through the planted heel to lift your hips.','Keep hips level — don\'t let one side drop.','Squeeze at the top, lower slowly.'], avoid:'Pushing through your toes instead of your heel.' },
  cablekickback:{ setup:'Ankle strap on, hold the machine, slight forward lean.', cues:['Kick the leg back and slightly up, squeezing your glute.','Keep your lower back still.','Return slowly.'], avoid:'Arching your back to kick higher.' },
  lyinglegcurl:CUE_LEGCURL, seatedlegcurl:CUE_LEGCURL, speediancelegcurl:CUE_LEGCURL,
  legextension:CUE_LEGEXT, speedianceextension:CUE_LEGEXT,
  calfraise:CUE_CALF, standingcalfraise:CUE_CALF, dbcalfraise:CUE_CALF, seatedcalfraise:CUE_CALF,
  bench:CUE_BENCH, declinebench:CUE_BENCH, closegripbench:CUE_BENCH,
  dbbench:CUE_DBBENCH, chestpress_speed:CUE_DBBENCH, machinechestpress:CUE_DBBENCH,
  inclinedbpress:CUE_INCLINE, speedianceinclinepress:CUE_INCLINE, inclinebarbell:CUE_INCLINE,
  pushup:CUE_PUSHUP,
  cablefly_speed:CUE_FLY, pecdeck:CUE_FLY, dbfly:CUE_FLY, speediancefly:CUE_FLY,
  latpull:CUE_PULLDOWN, widegriplatpulldown:CUE_PULLDOWN, speediancepulldown:CUE_PULLDOWN,
  pullup:{ setup:'Hang from the bar, hands a bit wider than shoulders.', cues:['Pull your shoulder blades down first, then drive your elbows to your sides.','Chin over the bar.','Lower all the way to straight arms.'], avoid:'Kipping/swinging. Can\'t do one yet? Use an assisted machine or a band, or do slow 5-second lowerings.' },
  invertedrow:{ setup:'Lie under a bar set at waist height, grab it, body straight.', cues:['Pull your chest to the bar.','Squeeze shoulder blades together.','Lower to straight arms. Bend your knees to make it easier.'], avoid:'Hips sagging.' },
  seatedrow_speed:CUE_SEATEDROW, cablerowwide:CUE_SEATEDROW,
  singlearmrow:CUE_DBROW, dbbentrow:CUE_DBROW,
  row:CUE_BBROW, tbarrow:CUE_BBROW, speediancebentoverrow:CUE_BBROW,
  facepull:CUE_FACEPULL, reardeltfly:CUE_REARDELT,
  bandpullapart:{ setup:'Hold a band in front of you at shoulder height, arms straight.', cues:['Pull the band apart until it touches your chest.','Squeeze your shoulder blades together.','Return slowly.'], avoid:'Shrugging up toward your ears.' },
  dbshoulder:CUE_OHP, speedianceshoulderpress:CUE_OHP, machineshoulderpress:CUE_OHP, ohp:CUE_OHP, militarypress:CUE_OHP, arnoldpress:CUE_OHP,
  lateralraise:CUE_LATERAL, cablelateralraise:CUE_LATERAL, speediancelateralraise:CUE_LATERAL,
  curl:CUE_CURL, speediancecurl:CUE_CURL, cablecurl:CUE_CURL, hammercurl:CUE_CURL, inclinedbcurl:CUE_CURL, barbellcurl:CUE_CURL, ezbarcurl:CUE_CURL, preachercurl:CUE_CURL, concentrationcurl:CUE_CURL, zottmancurl:CUE_CURL,
  tricepspushdown:CUE_PUSHDOWN, ropepushdown:CUE_PUSHDOWN,
  speediancetricepext:CUE_OHEXT, overheadtricepext:CUE_OHEXT, skullcrusher:CUE_OHEXT,
  tricepdip:CUE_DIP,
  deadbug:CUE_DEADBUG, plank:CUE_PLANK, sideplank:CUE_PLANK, cablecrunch:CUE_CABLECRUNCH,
  hanginglegraise:{ setup:'Hang from a bar (or use a captain\'s chair).', cues:['Curl your knees up toward your chest by tilting your pelvis.','Lower slowly without swinging.','Straighten the legs only when bent-knee reps are easy.'], avoid:'Swinging — pause at the bottom of every rep.' },
  abwheel:{ setup:'Kneel with the wheel under your shoulders.', cues:['Brace hard and roll out only as far as your lower back stays flat.','Pull back with your abs, not your hips.','Start with short rollouts.'], avoid:'Lower back sagging — that\'s too far.' },
  speediancewoodchopper:{ setup:'Stand side-on to the cable, feet wide, arms straight.', cues:['Rotate through your torso and hips to pull the handle diagonally across your body.','Keep arms mostly straight.','Return slowly.'], avoid:'Pulling with your arms only.' },
  cablewoodchopper:{ setup:'Stand side-on to the cable, feet wide, arms straight.', cues:['Rotate through your torso and hips to pull the handle diagonally across your body.','Keep arms mostly straight.','Return slowly.'], avoid:'Pulling with your arms only.' }
};
const CATEGORY_COACHING = {
  'legs-compound': CUE_SQUAT, 'legs-isolation': CUE_LEGEXT, glutes: CUE_HIPTHRUST, chest: CUE_DBBENCH, back: CUE_SEATEDROW,
  shoulders: CUE_OHP, biceps: CUE_CURL, triceps: CUE_PUSHDOWN, core: CUE_PLANK,
  fullbody: { setup:'Clear space around you and pick a weight you can move with good form while tired.', cues:['Move with control, not just speed.','Breathe — exhale on the hard part.','Stop the round if form breaks down.'], avoid:'Sacrificing form to beat the clock.' },
  conditioning: { setup:'Have water nearby; warm up first.', cues:['Work hard but controlled during the "on" period.','Recover fully-ish during the "off" period.','Keep the same pace across rounds — don\'t blow up in round 1.'], avoid:'Going all-out in the first round and fading.' }
};
function coachingHtml(ex){
  const c = EXERCISE_COACHING[ex.id] || CATEGORY_COACHING[ex.category];
  if(!c) return '';
  const specific = !!EXERCISE_COACHING[ex.id];
  return `<details class="coach-box" open>
    <summary>📋 How to do it${specific?'':' (general tips)'}</summary>
    ${c.setup?`<div class="coach-setup"><strong>Setup:</strong> ${c.setup}</div>`:''}
    <ol>${c.cues.map(x=>`<li>${x}</li>`).join('')}</ol>
    ${c.avoid?`<div class="coach-avoid">⚠️ <strong>Avoid:</strong> ${c.avoid}</div>`:''}
  </details>`;
}
function effortGuideHtml(){
  const goal = coachOn() ? COACH_GOALS[profile.coach.goal] : null;
  const rir = goal ? goal.rir : '1–3';
  return `<div class="coach-why">
    <strong>How hard should a set feel?</strong> End each set with about <strong>${rir} good reps left in the tank</strong> — the last couple of reps should be slow and hard, but your form never breaks. Lower every rep under control (~2–3 seconds), then lift with intent.
  </div>`;
}

/* ---------------- Swap an exercise (machine busy / don't like it) ---------------- */
function swapCurrentExercise(){
  const plan = loadTodayPlan();
  const day = plan && WORKOUT_DAYS.find(d=>d.id===plan.dayId);
  if(!day) return;
  const steps = buildSteps(day);
  const step = steps[Math.min(plan.stepIndex, steps.length-1)];
  const oldId = step.exerciseId;
  const oldEx = exercises.find(e=>e.id===oldId);
  if(!oldEx) return;
  if(plan.swaps && plan.swaps[oldId]){ const sw = Object.assign({}, plan.swaps); delete sw[oldId]; saveTodayPlan({ swaps: sw }); }
  const flagsNow = todayFlags();
  const r = day.rx && day.rx[oldId];
  const equip = coachOn() && profile.coach.equipment && profile.coach.equipment.length ? profile.coach.equipment : EQUIPMENT_TYPES.map(e=>e.id);
  const order = (r && SLOT_POOLS[r.pool]) ? SLOT_POOLS[r.pool].ids : exercises.filter(e=>e.category===oldEx.category).map(e=>e.id);
  const start = Math.max(0, order.indexOf(oldId));
  let newId = null;
  for(let k=1; k<=order.length; k++){
    const id = order[(start + k) % order.length];
    if(id === oldId || day.lifts.includes(id)) continue;
    const ex = exercises.find(e=>e.id===id);
    if(ex && equip.includes(ex.equipment) && !exConflict(ex, flagsNow).blocked){ newId = id; break; }
  }
  if(!newId){ showToast('No alternative available with your equipment'); return; }
  day.lifts = day.lifts.map(id=> id===oldId ? newId : id);
  if(day.rx && day.rx[oldId]){ day.rx[newId] = day.rx[oldId]; delete day.rx[oldId]; }
  saveWorkoutDays();
  wizardFeel = 'right';
  renderPlanView();
  showToast('Swapped to ' + exercises.find(e=>e.id===newId).name + ' — saved to your plan');
}
function setWorkingWeightFromWizard(exId){
  const el = document.getElementById('wizardWorking');
  const ex = exercises.find(e=>e.id===exId);
  if(!el || !ex) return;
  const v = parseFloat(el.value);
  if(isNaN(v) || v < 0){ showToast('Enter a number'); return; }
  ex.workingWeight = v; ex.progress = 'hold';
  saveAll(); renderPlanView(); renderDashboard();
  showToast('Working weight saved: ' + fmtWeight(ex, v));
}
function setWorkingWeight(exId, value){
  const ex = exercises.find(e=>e.id===exId);
  if(!ex) return;
  if(value === '' || value == null){ delete ex.workingWeight; }
  else { const v = parseFloat(value); if(isNaN(v)) return; ex.workingWeight = v; }
  ex.progress = 'hold';
  saveAll(); renderDashboard();
  showToast('Saved ' + ex.name + (ex.workingWeight!=null ? ': ' + fmtWeight(ex, ex.workingWeight) : ''));
}
let wizardFeel = 'right';
function setWizardFeel(v){
  wizardFeel = v;
  document.querySelectorAll('#feelRow .seg-btn').forEach(b=> b.classList.toggle('active', b.dataset.v === v));
}

/* ---------------- Dashboard: this week + today ---------------- */
function weekStripHtml(){
  const ws = weekSummary(todayStr());
  const today = todayStr();
  const icon = { done:'✓', bonus:'✓', missed:'✕', today:'●', planned:'', rest:'', pre:'', vacation:'🌴' };
  return `<div class="wk-strip">${ws.cells.map(c=>{
    const dnum = +c.date.slice(8);
    const title = c.status==='vacation' ? 'Vacation' : c.planned ? escapeHtml(c.planned.title) : (c.status==='bonus' ? 'Extra' : 'Rest');
    return `<div class="wk-cell st-${c.status}${c.date===today?' is-today':''}" title="${title}">
      <div class="wk-dow">${WD_SHORT[weekdayOf(c.date)]}</div>
      <div class="wk-num">${dnum}</div>
      <div class="wk-mark">${icon[c.status]||''}</div>
      <div class="wk-title">${title}</div>
    </div>`;
  }).join('')}</div>`;
}
function renderCoachWeekCard(){
  const box = document.getElementById('coachWeekCard');
  if(!box) return;
  if(!coachOn()){
    box.innerHTML = `<div class="card coach-cta">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px;">
        <div style="flex:1 1 280px;">
          <h2>👋 Let's build your plan — like a personal trainer would</h2>
          <div class="hint" style="margin-bottom:0;">7 quick questions: your goal, which muscles matter most to you, how many days you can train and which days. You'll see what each choice means for your results, then get a weekly schedule with instructions and smart weights.</div>
        </div>
        <button class="btn" onclick="startCoachSetup()" style="flex:0 0 auto;">Start (2 min) →</button>
      </div>
    </div>`;
    return;
  }
  const c = profile.coach;
  const today = todayStr();
  const ws = weekSummary(today);
  const streak = planStreak();
  const day = scheduledDayFor(today);
  const ci = todayCheckin();
  const trained = didTrainOn(today);
  const plan = loadTodayPlan();
  const next = nextSessionAfter(today);
  const nextTxt = next ? `Next: <strong>${WD_LONG[weekdayOf(next.date)]} — ${escapeHtml(next.day.title)}</strong>` : '';
  let todayHtml;
  if(onVacation(today)){
    const done = vacCircuitsThisWeek(), goal = (profile.vacation.perWeek||3);
    const didToday = activityLogs.some(a=>a.activityId==='vacation' && a.date===today);
    todayHtml = `<div class="today-row"><div><div style="font-weight:800;font-size:15px;">🌴 Vacation mode — ${done} of ${goal} circuits this week</div>
      <div class="hint" style="margin:0;">${didToday ? 'Today\'s circuit is done ✓ Enjoy your trip.' : 'No gym needed: ~22 min, bodyweight + hotel furniture. Gym days are paused until ' + profile.vacation.until + '.'}</div></div>
      ${didToday ? '' : `<button class="btn" onclick="switchView('vacation')">Start circuit →</button>`}</div>`;
  } else if(day && !(trained && planIsComplete(plan))){
    const inProgress = plan && plan.kind==='lift' && plan.dayId===day.id && plan.stepIndex>0;
    const r = ci ? READINESS_INFO[ci.readiness] : null;
    todayHtml = `<div class="today-row">
      <div style="display:flex;align-items:center;gap:12px;">${iconBadge({category:day.category})}
        <div><div style="font-weight:800;font-size:15px;">Today: ${escapeHtml(day.title)}</div>
        <div class="hint" style="margin:0;">${escapeHtml(day.subtitle||'')} · ${day.lifts.length} exercises · ${day.duration||''}${r?` · <span style="color:${r.color};font-weight:700;">Readiness ${ci.readiness}/5</span>`:''}</div></div>
      </div>
      <div class="row" style="flex:0 0 auto;gap:8px;"><button class="btn ghost" onclick="switchView('freestyle')" title="Not feeling the plan today? Go freestyle.">🎲 Freestyle</button>
      <button class="btn" onclick="startScheduledWorkout('${day.id}')">${inProgress ? 'Continue workout →' : (ci ? 'Start workout →' : 'Check in & start →')}</button></div>
    </div>`;
  } else if(day){
    todayHtml = `<div class="today-row"><div><div style="font-weight:800;font-size:15px;color:var(--accent);">Today's session is done ✓</div>
      <div class="hint" style="margin:0;">Now the growth happens: protein with your next meal, water, and 7–9 hours of sleep tonight. ${nextTxt}</div></div></div>`;
  } else {
    const missed = ws.missed.filter(m=>m.date < today);
    const madeUp = ws.bonus;
    const owed = missed.length - madeUp;
    if(owed > 0 && !trained){
      const m = missed[missed.length-1];
      todayHtml = `<div class="today-row"><div><div style="font-weight:800;font-size:15px;">Rest day — but you missed ${WD_LONG[weekdayOf(m.date)]}'s ${escapeHtml(m.planned.title)}</div>
        <div class="hint" style="margin:0;">Today's a free day, so you can make it up now without cramming. Don't double up on a training day — just pick the plan back up. ${nextTxt}</div></div>
        <button class="btn secondary" onclick="startScheduledWorkout('${m.planned.id}')">Make it up today →</button></div>`;
    } else {
      todayHtml = `<div class="today-row"><div><div style="font-weight:800;font-size:15px;">Rest day 😌</div>
        <div class="hint" style="margin:0;">Muscles grow on rest days. Optional: a 20–40 min easy walk or bike (you can still talk = Zone 2). ${nextTxt}</div></div>
        <button class="btn ghost" onclick="switchView('freestyle')" title="Feel like moving anyway? Freestyle picks muscles that aren't recovering.">🎲 Freestyle</button></div>`;
    }
  }
  const pct = ws.plannedCount ? Math.round(ws.doneCount/ws.plannedCount*100) : 0;
  box.innerHTML = `<div class="card">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;">
      <div><h2>${c.name ? 'Hey ' + escapeHtml(c.name) + ' — ' : ''}this week</h2>
      <div class="hint" style="margin-bottom:0;">${escapeHtml(c.splitName||'')} · ${COACH_GOALS[c.goal]?COACH_GOALS[c.goal].label:''}</div></div>
      <div style="display:flex;gap:18px;">
        <div class="stat" style="text-align:right;"><div class="num accent" style="font-size:20px;">${ws.doneCount}/${ws.plannedCount}</div><div class="lbl">sessions this week</div></div>
        <div class="stat" style="text-align:right;"><div class="num warn" style="font-size:20px;">${streak}</div><div class="lbl">planned sessions in a row 🔥</div></div>
      </div>
    </div>
    <div class="adh-bar"><div style="width:${pct}%"></div></div>
    ${isDeloadWeek() ? '<div class="hint" style="margin:8px 0 0;color:var(--core);font-weight:700;">🧘 Deload week — lighter weights, fewer sets. Recovery is part of the plan.</div>' : ''}
    ${weekStripHtml()}
    <div class="hint" style="margin:-4px 0 10px;cursor:pointer;" onclick="switchView('freestyle')">⭐ Level ${levelInfo(game.xp).lvl} ${levelInfo(game.xp).title} · ${game.xp} XP · ${game.badges.length} badges · ${discoveredIds().size} exercises discovered →</div>
    ${todayHtml}
  </div>`;
}

/* ---------------- Coach tab: questionnaire + program view ---------------- */
let coachEditing = false, coachStep = 0, coachDraft = null;
const COACH_STEPS = ['about','goal','targets','mode','days','time','review'];
const ALL_EQUIPMENT = ['speediance','freeweight','machine','bodyweight'];
function defaultCoachDraft(){
  const c = profile.coach || {};
  return { name:c.name||'', experience:c.experience||'new', goal:c.goal||null, targets:(c.targets||[]).slice(),
    targetMode:c.targetMode||'twice', days:(c.days||[]).slice(), minutes:c.minutes||45,
    equipment:(c.equipment||ALL_EQUIPMENT).slice(), bodyweight: profile.weight||'', protect:(c.protect||[]).slice(), cycle: c.cycle || 0 };
}
function startCoachSetup(){ coachDraft = defaultCoachDraft(); coachStep = 0; coachEditing = true; switchView('coach'); window.scrollTo(0,0); }
function cancelCoachSetup(){ coachEditing = false; coachDraft = null; renderCoach(); }
function coachSet(field, value){ coachDraft[field] = value; renderCoach(); }
function coachToggle(field, value){
  const arr = coachDraft[field];
  const i = arr.indexOf(value);
  if(i >= 0) arr.splice(i,1); else arr.push(value);
  renderCoach();
}
function coachNav(delta){
  const key = COACH_STEPS[coachStep];
  if(delta > 0){
    if(key === 'goal' && !coachDraft.goal){ showToast('Pick a goal'); return; }
    if(key === 'days' && (coachDraft.days.length < 2 || coachDraft.days.length > 6)){ showToast('Pick 2–6 training days'); return; }
    if(key === 'time' && !coachDraft.equipment.length){ showToast('Pick at least one equipment type'); return; }
  }
  coachStep = clampNum(coachStep + delta, 0, COACH_STEPS.length-1);
  renderCoach();
  window.scrollTo(0,0);
}
function optCard(selected, title, sub, onclick, tag){
  return `<div class="day-card opt-card${selected?' selected':''}" onclick="${onclick}">
    <div class="day-title">${title}${tag?` <span class="opt-tag">${tag}</span>`:''}</div>
    ${sub?`<div class="day-sub">${sub}</div>`:''}
  </div>`;
}
function renderCoach(){
  const box = document.getElementById('coachMain');
  if(!box) return;
  if(coachEditing || !coachOn()){
    if(!coachDraft) coachDraft = defaultCoachDraft();
    box.innerHTML = renderCoachQuestionnaire();
  } else {
    box.innerHTML = renderCoachProgramHtml();
  }
}
function renderCoachQuestionnaire(){
  const d = coachDraft, key = COACH_STEPS[coachStep];
  const seg = COACH_STEPS.map((k,i)=>`<div class="progress-seg${i===coachStep?' current':''}" style="background:var(--accent);opacity:${i<=coachStep?1:.25}"></div>`).join('');
  let body = '';
  if(key === 'about'){
    const e = COACH_EXPERIENCE[d.experience];
    body = `<h2>Let's set you up like a personal trainer would</h2>
      <div class="hint">A good trainer asks before they program. Every answer below shows what it means for your training.</div>
      <div class="grid cols-2">
        <div><label>What should I call you? (optional)</label><input type="text" value="${escapeHtml(d.name)}" placeholder="e.g. Jeff" onchange="coachDraft.name=this.value"></div>
        <div><label>Bodyweight (lb) — for calorie estimates</label><input type="number" value="${escapeHtml(d.bodyweight)}" onchange="coachDraft.bodyweight=this.value"></div>
      </div>
      <label>How much lifting experience do you have?</label>
      <div class="grid cols-3">${Object.entries(COACH_EXPERIENCE).map(([k,v])=>optCard(d.experience===k, v.label, v.sub, `coachSet('experience','${k}')`)).join('')}</div>
      <div class="coach-why"><strong>What this means:</strong> ${e.implication}</div>
      <label style="margin-top:16px;">Any areas to protect long-term? <span style="font-weight:500;">(old injury, cranky joint — optional)</span></label>
      <div class="chip-row">${RECOVERY_GROUPS.map(g=>`<button class="chip rec-chip${(d.protect||[]).includes(g.id)?' lvl-sore':''}" onclick="coachToggleProtect('${g.id}')">${(d.protect||[]).includes(g.id)?'🩹 ':''}${g.label}</button>`).join('')}</div>
      ${(d.protect||[]).length ? `<div class="coach-why warn">Your plan will skip exercises that use your <strong>${d.protect.map(g=>recoveryGroup(g).label.toLowerCase()).join(', ')}</strong> as a main or helper muscle (based on the muscle database in Settings). For real injuries, check with a doctor or physical therapist too.</div>` : ''}`;
  } else if(key === 'goal'){
    const g = d.goal && COACH_GOALS[d.goal];
    body = `<h2>What's your main goal?</h2>
      <div class="hint">Pick the one that matters most right now. Your goal decides how heavy, how many reps, and how long you rest — Dr. Andy Galpin's point is that different goals need genuinely different training.</div>
      <div class="grid cols-2">${Object.entries(COACH_GOALS).map(([k,v])=>optCard(d.goal===k, v.emoji+' '+v.label, v.blurb, `coachSet('goal','${k}')`)).join('')}</div>
      ${g ? `<div class="coach-why"><strong>What this means:</strong> ${g.implication}</div>` : '<div class="coach-why">Tap a goal to see how it changes your training.</div>'}`;
  } else if(key === 'targets'){
    const n = d.targets.length;
    const list = d.targets.map(t=>muscleLabel(t).toLowerCase()).join(', ');
    const why = n === 0
      ? 'No priorities = <strong>balanced training</strong>: every muscle trained evenly. Honestly the best default for a true beginner.'
      : (n <= 3
        ? `We'll train <strong>${list}</strong> early in each workout while you're freshest, and give ${n>1?'them':'it'} extra weekly sets. Everything else still gets trained — skipping muscles leads to imbalances and injuries.`
        : `<span style="color:var(--warn)">Prioritizing ${n} muscles is close to prioritizing none</span> — your time and recovery are limited, so extra volume gets spread thin. Consider picking your top 2–3.`);
    body = `<h2>Which muscles matter most to you?</h2>
      <div class="hint">Optional — pick up to 3 to emphasize. Leave empty for a balanced plan.</div>
      <div class="chip-row">${COACH_MUSCLES.map(m=>`<button class="chip${d.targets.includes(m.id)?' active':''}" onclick="coachToggle('targets','${m.id}')">${m.label}</button>`).join('')}</div>
      <div class="coach-why${n>3?' warn':''}"><strong>What this means:</strong> ${why}</div>`;
  } else if(key === 'mode'){
    const list = d.targets.map(t=>muscleLabel(t).toLowerCase()).join(', ');
    const m = COACH_TARGET_MODES[d.targetMode];
    body = `<h2>How do you want to train ${d.targets.length ? list : 'your muscles'}?</h2>
      <div class="coach-why"><strong>The key idea:</strong> a workout is the <em>signal</em> to grow — the actual building happens over the next ~48–72 hours of rest, food and sleep. Example: curling your biceps 7 days a week. Each session tells the muscle to grow, but you never give it the days it needs to finish rebuilding — so you get tired, not bigger.</div>
      ${d.targets.length ? `
        <div class="grid cols-3" style="margin-top:14px;">${Object.entries(COACH_TARGET_MODES).map(([k,v])=>optCard(d.targetMode===k, v.label, '', `coachSet('targetMode','${k}')`, v.tag)).join('')}</div>
        <div class="coach-why${d.targetMode==='daily'?' warn':''}"><strong>What this means:</strong> ${m.implication}</div>`
        : `<div class="hint" style="margin-top:14px;">You didn't pick priority muscles, so every muscle is trained about twice a week by default. Tap Next.</div>`}`;
  } else if(key === 'days'){
    const n = d.days.length;
    let analysis, cls = '';
    if(n < 2){ analysis = 'Pick at least <strong>2 days</strong>. One session a week can maintain, but two or more is where real progress starts.'; cls = ' warn'; }
    else if(n > 6){ analysis = 'Keep at least <strong>1 full rest day</strong>. Training 7 days doesn\'t speed things up — recovery is when you actually adapt.'; cls = ' warn'; }
    else {
      const sp = chooseSplit(d.days);
      const mapping = sp.days.map((wd,i)=>`<span class="map-chip"><strong>${WD_SHORT[wd]}</strong> ${DAY_TEMPLATES[sp.templates[i]].title}</span>`).join('');
      const freqNote = n === 2 ? 'Two full-body days hit every muscle twice a week — a very effective beginner setup.'
        : n === 3 ? 'Three days is the classic beginner sweet spot.'
        : n === 4 ? 'Four days lets each session focus on half the body, so you get more quality work per muscle.'
        : n === 5 ? 'Five days is a lot for a beginner — great if you love it, but sleep and food need to keep up.'
        : 'Six days is advanced-level frequency. Make sure sleep is solid; if you start feeling run-down, drop to 4.';
      analysis = `Your plan: <strong>${sp.name}</strong>. ${sp.why}<div class="map-row">${mapping}</div><div style="margin-top:8px;">${freqNote}</div>`;
    }
    body = `<h2>How many days, and which days, can you train?</h2>
      <div class="hint">Tap the days that realistically work every week. A plan you can stick to beats a "perfect" plan you skip — consistency is the #1 driver of results.</div>
      <div class="wd-row">${WEEK_ORDER.map(wd=>`<button class="wd-toggle${d.days.includes(wd)?' active':''}" onclick="coachToggle('days',${wd})">${WD_SHORT[wd]}</button>`).join('')}</div>
      <div class="hint" style="margin-top:8px;">${n} day${n!==1?'s':''} per week</div>
      <div class="coach-why${cls}"><strong>What this means:</strong> ${analysis}</div>`;
  } else if(key === 'time'){
    let preview = '';
    if(d.goal && d.days.length >= 2 && d.days.length <= 6 && d.equipment.length){
      const prog = buildProgram(d);
      const counts = prog.days.map(x=>x.lifts.length);
      preview = ` → about <strong>${Math.min(...counts)}${Math.max(...counts)!==Math.min(...counts)?'–'+Math.max(...counts):''} exercises</strong> per session for your goal.`;
    }
    body = `<h2>How long is each session, and what equipment do you have?</h2>
      <label>Time per workout (including a 5-min warm-up)</label>
      <div class="grid cols-4">${Object.keys(COACH_MINUTES).map(m=>optCard(+d.minutes===+m, m+' min', '', `coachSet('minutes',${m})`)).join('')}</div>
      <div class="coach-why"><strong>What this means:</strong> ${COACH_MINUTES[d.minutes]}${preview} No filler — the plan is trimmed to fit, dropping minor accessories before anything that matters.</div>
      <label style="margin-top:16px;">Equipment you can use</label>
      <div class="chip-row">${EQUIPMENT_TYPES.map(e=>`<button class="chip${d.equipment.includes(e.id)?' active':''}" onclick="coachToggle('equipment','${e.id}')">${e.label}</button>`).join('')}</div>
      <div class="hint" style="margin-top:8px;">Only exercises you can actually do get picked. Busy machine at the gym? You'll be able to swap an exercise mid-workout.</div>`;
  } else if(key === 'review'){
    const prog = buildProgram(d);
    const g = COACH_GOALS[d.goal];
    body = `<h2>Here's your plan${d.name ? ', ' + escapeHtml(d.name) : ''}</h2>
      <div class="hint">${g.emoji} ${g.label} · ${prog.split.name} · ${d.days.length} days/week · ~${d.minutes} min${d.targets.length ? ' · priority: ' + d.targets.map(muscleLabel).join(', ') : ''}</div>
      ${programWeekGridHtml(prog.days)}
      ${prog.notes.length ? `<div class="coach-why">${prog.notes.map(escapeHtml).join('<br>')}</div>` : ''}
      <div class="coach-why">Building this plan replaces the days in Settings → Workout Days. Your logged history stays, and your current days are saved so you can restore them.</div>`;
  }
  const isLast = key === 'review';
  return `<div class="card">
    <div class="progress-track">${seg}</div>
    <div class="progress-label">Step ${coachStep+1} of ${COACH_STEPS.length}${coachOn() ? ' · <a href="#" onclick="cancelCoachSetup();return false;" style="color:var(--accent);">cancel</a>' : ''}</div>
    ${body}
    <div class="wizard-actions">
      ${coachStep > 0 ? '<button class="btn ghost" onclick="coachNav(-1)">← Back</button>' : ''}
      ${isLast ? '<button class="btn" onclick="applyCoachPlan()">Build my plan 💪</button>' : '<button class="btn" onclick="coachNav(1)">Next →</button>'}
    </div>
  </div>`;
}
function programWeekGridHtml(days){
  const byWd = {}; days.forEach(d=> byWd[d.weekday] = d);
  return `<div class="plan-week">${WEEK_ORDER.map(wd=>{
    const d = byWd[wd];
    if(!d) return `<div class="plan-day rest"><div class="plan-day-h">${WD_SHORT[wd]}</div><div class="plan-day-t">Rest</div><div class="hint" style="margin:0;">Recover. Optional easy walk.</div></div>`;
    return `<div class="plan-day"><div class="plan-day-h">${WD_SHORT[wd]} <span style="color:var(--text-dim);font-weight:600;">${d.duration}</span></div>
      <div class="plan-day-t">${escapeHtml(d.title)}</div>
      <ul>${d.lifts.map(id=>{ const ex = exercises.find(e=>e.id===id); if(!ex) return ''; const r = rxFor(ex, d); return `<li>${r.emphasis?'<span title="Priority muscle" style="color:var(--warn)">★</span> ':''}${escapeHtml(ex.name)} <span class="plan-rx">${r.sets}×${rxRepsText(ex, r).replace(' reps','')}</span></li>`; }).join('')}</ul>
      ${d.finisher ? `<div class="hint" style="margin:4px 0 0;">+ ${d.finisher.title} (${d.finisher.duration})</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}
function applyCoachPlan(){
  const a = coachDraft;
  const result = buildProgram(a);
  if(!result){ showToast('Pick 2–6 days'); return; }
  const hasCustom = WORKOUT_DAYS.some(d=>!d.coachGenerated);
  if(hasCustom) save(LS_KEYS.prevWorkoutDays, WORKOUT_DAYS);
  WORKOUT_DAYS = result.days;
  const bw = parseFloat(a.bodyweight); if(bw > 0) profile.weight = bw;
  const prevBuilt = profile.coach && profile.coach.builtAt;
  profile.coach = {
    name:(a.name||'').trim(), experience:a.experience, goal:a.goal, targets:a.targets.slice(), targetMode:a.targetMode,
    days:a.days.slice(), minutes:+a.minutes, equipment:a.equipment.slice(), protect:(a.protect||[]).slice(),
    schedule:Object.fromEntries(result.days.map(d=>[d.weekday, d.id])),
    splitName:result.split.name, notes:result.notes, builtAt: todayStr(), cycle: a.cycle || 0,
    deloadEvery: profile.coach && profile.coach.deloadEvery != null ? profile.coach.deloadEvery : 5, firstBuiltAt: (profile.coach && profile.coach.firstBuiltAt) || prevBuilt || todayStr()
  };
  saveAll();
  coachEditing = false; coachDraft = null;
  renderAll();
  switchView('coach');
  window.scrollTo(0,0);
  showToast('Your plan is ready 💪');
}
function restorePrevWorkoutDays(){
  const prev = loadJSON(LS_KEYS.prevWorkoutDays, null);
  if(!prev || !prev.length) return;
  if(!confirm('Restore your previous Workout Days and turn off the coach schedule? (You can rebuild the plan anytime.)')) return;
  WORKOUT_DAYS = prev;
  if(profile.coach) profile.coach.schedule = {};
  localStorage.removeItem(LS_KEYS.prevWorkoutDays);
  saveAll(); renderAll(); showToast('Previous days restored');
}
function renderCoachProgramHtml(){
  const c = profile.coach;
  const g = COACH_GOALS[c.goal] || COACH_GOALS.hypertrophy;
  const days = WORKOUT_DAYS.filter(d=> Object.values(c.schedule).includes(d.id)).map(d=>{
    const wd = +Object.keys(c.schedule).find(k=>c.schedule[k]===d.id);
    return Object.assign({}, d, { weekday: wd });
  });
  const map = muscleMap(days);
  const floor = (COACH_EXPERIENCE[c.experience]||COACH_EXPERIENCE.new).floor;
  const sortedDays = WEEK_ORDER.filter(wd=> c.schedule[wd]);
  const backToBack = m => { const ds = WEEK_ORDER.filter(wd=>m.days.includes(wd)); return ds.length>1 && ds.some((d,i)=> gapDays(d, ds[(i+1)%ds.length])===1); };
  const mapRows = COACH_MUSCLES.map(m=>{
    const x = map[m.id];
    const eff = x.direct + x.indirect;
    let pill;
    if(x.direct === 0 && x.indirect === 0) pill = '<span class="pill below">Not trained</span>';
    else if(backToBack(x) && x.direct > 0) pill = '<span class="pill close">Back-to-back days</span>';
    else if(eff < floor*0.75) pill = '<span class="pill close">Light</span>';
    else if(eff > 22) pill = '<span class="pill below">Very high</span>';
    else pill = '<span class="pill met">Growth zone</span>';
    return `<tr><td>${c.targets.includes(m.id)?'<span style="color:var(--warn)">★</span> ':''}${m.label}</td><td><strong>${x.direct}</strong>${x.indirect?` <span style="color:var(--text-dim)">+${x.indirect} indirect</span>`:''}</td><td>${x.days.length}×/wk</td><td>${pill}</td></tr>`;
  }).join('');
  const programIds = [...new Set(days.flatMap(d=>d.lifts))];
  const weightRows = programIds.map(id=>{
    const ex = exercises.find(e=>e.id===id); if(!ex) return '';
    const d = days.find(x=>x.lifts.includes(id)); const r = rxFor(ex, d);
    const unitLbl = ex.unit==='lb' ? 'lb' : (ex.unit==='reps' ? 'reps' : 'sec');
    const status = ex.progress==='up' ? '<span class="pill met">Ready to go up</span>' : ex.progress==='down' ? '<span class="pill below">Back off</span>' : (ex.lastDone ? '<span class="pill close">Hold</span>' : '<span class="pill rest">New</span>');
    return `<div class="ww-item">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px;">${iconBadge(ex,'sm')}<div><div style="font-weight:700;font-size:13.5px;">${escapeHtml(ex.name)}</div><div class="hint" style="margin:0;">${r.sets} × ${rxRepsText(ex, r)}${ex.lastDone?' · last done '+ex.lastDone:''}</div></div></div>
      ${status}
      <div class="ww-input"><input type="number" step="any" value="${ex.workingWeight!=null?ex.workingWeight:''}" placeholder="${workingWeight(ex)}" onchange="setWorkingWeight('${ex.id}', this.value)"><span>${unitLbl}</span></div>
    </div>`;
  }).join('');
  const prev = loadJSON(LS_KEYS.prevWorkoutDays, null);
  return `
    <div class="card" style="margin-bottom:16px;">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;">
        <div><h2>${c.name ? escapeHtml(c.name) + '\'s plan' : 'Your plan'}: ${escapeHtml(c.splitName||'')}</h2>
        <div class="hint" style="margin-bottom:0;">${g.emoji} ${g.label} · ${sortedDays.map(wd=>WD_SHORT[wd]).join(', ')} · ~${c.minutes} min · ${COACH_EXPERIENCE[c.experience]?COACH_EXPERIENCE[c.experience].label.toLowerCase():''}${c.targets.length?' · ★ priority: '+c.targets.map(muscleLabel).join(', '):''}</div></div>
        <div class="row" style="flex:0 0 auto;gap:8px;">
          <button class="btn secondary" onclick="startCoachSetup()">Edit answers</button>
        </div>
      </div>
      <div class="coach-why"><strong>How your training works:</strong> ${g.implication}</div>
      ${(c.notes||[]).length ? `<div class="coach-why warn">${c.notes.map(escapeHtml).join('<br>')}</div>` : ''}
    </div>

    ${smartPlanSectionHtml()}

    <div class="card" style="margin-bottom:16px;">
      <h2>Your week</h2>
      <div class="hint">Big compound lifts come first, while you're fresh. ★ = priority muscle. Tweak exercises anytime in Settings → Workout Days.</div>
      ${programWeekGridHtml(days)}
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h2>My working weights</h2>
      <div class="hint">Enter what you can lift for the prescribed reps with good form, leaving 1–2 reps in the tank. <strong>Not sure? Leave it blank</strong> — use the starter weight, and the app learns from what you log. After each exercise you'll rate it (too easy / just right / too hard); together with your daily check-in that decides whether the weight goes up, holds, or backs off.</div>
      ${weightRows || '<div class="empty">No exercises in your plan yet.</div>'}
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h2>Muscle check — weekly sets &amp; frequency</h2>
      <div class="hint">Hard sets per muscle per week. Research discussed by Huberman and Galpin points to roughly <strong>10–20 hard sets</strong> per muscle per week for growth (beginners respond well to the lower end), spread over <strong>~2 sessions</strong>. "Indirect" = half-credit from big lifts that also work that muscle (e.g. bench press → triceps).</div>
      <table><thead><tr><th>Muscle</th><th>Sets / week</th><th>Frequency</th><th>Status</th></tr></thead><tbody>${mapRows}</tbody></table>
    </div>

    ${learnedTipsHtml()}

    <div class="card" style="margin-bottom:16px;">
      <h2>Coach's principles</h2>
      <div class="principles">
        <div><strong>1. Consistency beats perfection.</strong> The plan you actually follow wins. Missing a day? Just do the next one — don't cram two into one.</div>
        <div><strong>2. Progressive overload.</strong> Add a little weight or a rep over time. Small, steady jumps add up fast.</div>
        <div><strong>3. Muscles grow during recovery.</strong> Give each muscle ~48–72 h before training it hard again. That's why we don't hit the same muscle on back-to-back days.</div>
        <div><strong>4. Effort matters.</strong> Most sets should end 1–3 reps short of failure, with clean form. Easy sets don't send a strong signal; grinding ugly reps just adds injury risk.</div>
        <div><strong>5. Rest between sets.</strong> 1.5–3 min for big lifts. Rushing rest means fewer quality reps — not "more work."</div>
        <div><strong>6. Keep sessions focused.</strong> About an hour of hard work is plenty. Quality drops after that.</div>
        <div><strong>7. Sleep is the #1 recovery tool.</strong> 7–9 hours. Bad night? That's what the check-in is for — the plan adjusts.</div>
        <div><strong>8. Mix in cardio.</strong> A weekly blend of lifting, easy Zone 2 (walks, bike) and a little high-intensity work (the Sprints tab) covers your bases.</div>
      </div>
      <div class="hint" style="margin-top:12px;margin-bottom:0;">Paraphrased from ideas discussed on the Huberman Lab podcast, including episodes with exercise physiologist Dr. Andy Galpin. General guidance, not medical advice — check with a doctor before starting if you have health concerns or injuries.</div>
    </div>

    ${prev && prev.length ? `<div class="card"><h2>Previous workout days</h2><div class="hint">Your old split (${prev.map(d=>escapeHtml(d.title)).join(', ')}) is saved.</div><button class="btn secondary" onclick="restorePrevWorkoutDays()">Restore old days</button></div>` : ''}`;
}

