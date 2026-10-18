/* J3 WorkOut — js/splitbuilder.js
   Split Trainer: pick a weekly philosophy (Push / Pull / Legs or Upper / Lower / Cardio),
   pick today's day, then build the session one exercise at a time. Before each exercise you
   choose which muscle to hit next and pick from a few options for it; the trainer makes sure
   that by the last exercise every muscle the day calls for has been covered.
   Loaded as a classic <script> in index.html order (after muscledb.js); files share globals. */

/* ---------------- Week styles & days ---------------- */
const SB_STYLES = {
  ppl: { label:'Push / Pull / Legs', emoji:'🔁', days:['push','pull','legs'],
         sub:'Group muscles by movement. Each day hits a family of muscles that work together, so they rest together too. Great for building muscle — run it 3× or 6× a week.' },
  ulc: { label:'Upper / Lower / Cardio', emoji:'⚖️', days:['upper','lower','cardio'],
         sub:'Split the body in half, plus a dedicated conditioning day. Every muscle gets hit with fewer days in the gym, and your heart gets its own day.' }
};
const SB_DAYS = {
  push:   { title:'Push',   emoji:'🫸', category:'chest',         sub:'Chest · Shoulders · Triceps',
            required:['chest','shoulders','triceps'],             extra:['chest','shoulders','triceps'] },
  pull:   { title:'Pull',   emoji:'🫷', category:'back',          sub:'Lats · Mid-back · Rear delts · Biceps',
            required:['lats','rows','reardelts','biceps'],         extra:['lats','rows','reardelts','biceps'] },
  legs:   { title:'Legs',   emoji:'🦵', category:'legs-compound', sub:'Quads · Hamstrings · Glutes · Calves',
            required:['quads','hamstrings','glutes','calves'],     extra:['quads','hamstrings','glutes','calves','core'] },
  upper:  { title:'Upper',  emoji:'💪', category:'chest',         sub:'Chest · Back · Shoulders · Biceps · Triceps',
            required:['chest','back','shoulders','biceps','triceps'], extra:['chest','back','shoulders','biceps','triceps','reardelts'] },
  lower:  { title:'Lower',  emoji:'🦵', category:'legs-compound', sub:'Quads · Hamstrings · Glutes · Calves',
            required:['quads','hamstrings','glutes','calves'],     extra:['quads','hamstrings','glutes','calves','core'] },
  cardio: { title:'Cardio', emoji:'❤️', category:'conditioning',  sub:'Cardio machines · Jumps · Power moves · Core',
            required:['engine','plyo','power','core'],             extra:['engine','plyo','power','core'] }
};

/* ---------------- Muscle focuses (what you pick before each exercise) ----------------
   Each focus decides which exercises count for it, using the exercise category plus the
   primary muscles from the Muscle Database — so exercises you add yourself work too. */
const SB_LEG_CATS = ['legs-compound','legs-isolation','glutes'];
function sbP(ex){ return exMuscles(ex).P; }
const SB_FOCUS = {
  chest:     { label:'Chest',            why:'Presses build overall size and strength; flys isolate the squeeze.',
               match: ex => ex.category === 'chest' && sbP(ex).includes('chest') },
  shoulders: { label:'Shoulders',        why:'Overhead presses for the front delts, raises for the side delts (that\'s what makes shoulders look wide).',
               match: ex => ex.category === 'shoulders' && (sbP(ex).includes('fdelt') || sbP(ex).includes('sdelt')) },
  triceps:   { label:'Triceps',          why:'Two-thirds of your upper arm. Overhead moves stretch the long head; pushdowns and skull crushers finish it off.',
               match: ex => ex.category === 'triceps' },
  lats:      { label:'Lats (back width)', why:'Vertical pulls — pulldowns and pull-ups — build the V-taper.',
               match: ex => ex.category === 'back' && sbP(ex)[0] === 'lats' && !sbP(ex).includes('upback') },
  rows:      { label:'Mid-back (rows)',  why:'Horizontal pulls build back thickness and balance out all the pressing.',
               match: ex => ex.category === 'back' && sbP(ex).includes('upback') && sbP(ex)[0] !== 'rdelt' },
  back:      { label:'Back',             why:'One vertical or horizontal pull to balance out the pressing.',
               match: ex => SB_FOCUS.lats.match(ex) || SB_FOCUS.rows.match(ex) },
  reardelts: { label:'Rear delts',       why:'Small but important — healthy shoulders and better posture.',
               match: ex => sbP(ex)[0] === 'rdelt' },
  biceps:    { label:'Biceps',           why:'Curls with different grips and angles hit every part of the biceps.',
               match: ex => ex.category === 'biceps' },
  quads:     { label:'Quads',            why:'Squats and presses are the big hitters; extensions isolate.',
               match: ex => (SB_LEG_CATS.includes(ex.category) || ex.id === 'lunge') && sbP(ex)[0] === 'quads' },
  hamstrings:{ label:'Hamstrings',       why:'Hip hinges (RDLs, deadlifts) and leg curls — train both for strong, healthy knees.',
               match: ex => SB_LEG_CATS.includes(ex.category) && sbP(ex).includes('hams') && sbP(ex)[0] !== 'quads' },
  glutes:    { label:'Glutes',           why:'Your biggest muscle. Hip thrusts and bridges load it directly.',
               match: ex => SB_LEG_CATS.includes(ex.category) && (sbP(ex)[0] === 'glutes' || sbP(ex)[0] === 'abd') },
  calves:    { label:'Calves',           why:'Stubborn muscles — pause in the stretch at the bottom of every rep.',
               match: ex => SB_LEG_CATS.includes(ex.category) && sbP(ex)[0] === 'calves' },
  core:      { label:'Core / Abs',       why:'A strong core protects your back and makes every other lift stronger.',
               match: ex => ex.category === 'core' },
  engine:    { label:'Cardio machines',  why:'Bike, rower, treadmill, sled — big heart-rate work that\'s easy on the joints.',
               match: ex => ex.category === 'conditioning' && (ex.equipment === 'machine' || ex.equipment === 'speediance') },
  plyo:      { label:'Jumps & bodyweight cardio', why:'No equipment needed — quick bursts that build athleticism.',
               match: ex => (ex.category === 'conditioning' && ex.equipment === 'bodyweight') || ex.id === 'burpee' },
  power:     { label:'Full-body power',  why:'Swings, thrusters and presses — muscle and cardio at the same time.',
               match: ex => (ex.category === 'fullbody' && ex.id !== 'burpee') || (ex.category === 'conditioning' && ex.equipment === 'freeweight') }
};
// Focus → Freestyle muscle id, used to warn about muscles trained yesterday.
const SB_TO_FS = { chest:'chest', shoulders:'shoulders', triceps:'triceps', lats:'back', rows:'back', back:'back', reardelts:'shoulders',
  biceps:'biceps', quads:'quads', hamstrings:'hamstrings', glutes:'glutes', calves:'calves', core:'core' };
const SB_OPTIONS = 3; // how many exercise options to show per pick

/* ---------------- State ---------------- */
// sb = { style, history:[{date, style, day, exIds}], session:{date, style, day, count, picks:[{focus, exerciseId, sets}], stage, focus, options, current} }
let sb = loadJSON(LS_KEYS.split, { style:null, history:[], session:null });
let sbSetup = { style:null, day:null, count:5, equip:'usual' };
function saveSb(){ save(LS_KEYS.split, sb); }
function sbLive(){ return !!(sb.session && sb.session.date === todayStr() && sb.session.stage !== 'done'); }
function sbDone(){ return !!(sb.session && sb.session.date === todayStr() && sb.session.stage === 'done'); }

/* ---------------- Rules ---------------- */
// The prescription: follows your coach goal if you've set one up, otherwise "build muscle".
function sbRx(ex){
  const g = (coachOn() && COACH_GOALS[profile.coach.goal]) || COACH_GOALS.hypertrophy;
  if(ex.repsAreTime || ex.category === 'conditioning') return { sets: ex.targetSets || 4, reps: ex.targetReps || '40s', rest: 30 };
  if(ex.unit === 'seconds' || ex.category === 'core') return { sets: 3, reps: ex.targetReps || '12–15', rest: 45 };
  const comp = isCompoundEx(ex);
  return comp ? { sets: g.sets, reps: g.reps, rest: g.rest } : { sets: g.isoSets, reps: g.isoReps, rest: g.isoRest };
}
// 'bands' = travel mode: only resistance bands + bodyweight moves are offered.
const SB_EQUIP = { usual:{ label:'🏋️ My usual equipment' }, bands:{ label:'🟠 Bands + bodyweight' }, bodyweight:{ label:'🤸 Bodyweight only' } };
function sbEquip(s){ const mode = (s && s.equip) || sbSetup.equip; return mode === 'bands' ? ['band','bodyweight'] : mode === 'bodyweight' ? ['bodyweight'] : (coachOn() && profile.coach.equipment && profile.coach.equipment.length ? profile.coach.equipment : EQUIPMENT_TYPES.map(e=>e.id)); }
function sbUsedIds(s){ return (s || sb.session).picks.map(p=>p.exerciseId); }
// Exercises that count for a focus, for your equipment, not already used today, and not blocked by soreness.
function sbCandidates(focus, s){
  const f = SB_FOCUS[focus]; if(!f) return [];
  const used = new Set(s ? sbUsedIds(s) : []);
  const flags = todayFlags();
  return exercises.filter(ex=> f.match(ex) && sbEquip(s).includes(ex.equipment) && !used.has(ex.id) && !exConflict(ex, flags).blocked);
}
function sbCovered(s, focus){
  // "back" on Upper day is satisfied by lats or rows too, and vice-versa.
  return s.picks.some(p=> p.focus === focus || (focus === 'back' && (p.focus === 'lats' || p.focus === 'rows')));
}
// Required focuses still to do (ones with no safe option for your equipment/soreness are skipped).
function sbUncovered(s){
  return SB_DAYS[s.day].required.filter(f=> !sbCovered(s, f) && sbCandidates(f, s).length);
}
function sbSkippedRequired(s){
  return SB_DAYS[s.day].required.filter(f=> !sbCovered(s, f) && !sbCandidates(f, s).length);
}
function sbRemaining(s){ return s.count - s.picks.filter(p=>p.exerciseId && p.logged).length; }
// What you can choose next. While spare slots remain you can double up; once the slots left equal
// the muscles still owed, only those are offered — that's how the session always covers the whole day.
function sbFocusChoices(s){
  const owed = sbUncovered(s);
  const spare = sbRemaining(s) > owed.length;
  const day = SB_DAYS[s.day];
  const all = [...new Set(day.required.concat(day.extra))];
  return all.map(f=>{
    const n = sbCandidates(f, s).length;
    const isOwed = owed.includes(f);
    const allowed = n > 0 && (isOwed || spare);
    return { focus:f, owed:isOwed, done: sbCovered(s, f), allowed, available:n };
  });
}
function sbRecommendedFocus(s){ return sbUncovered(s)[0] || null; } // required list is ordered big → small muscles
// Pick a few options: a big multi-joint lift and a more targeted one when possible, varied equipment.
function sbRecommend(focus, s, exclude){
  exclude = exclude || [];
  const isNewbie = !profile.coach || profile.coach.experience === 'new';
  const scored = sbCandidates(focus, s).filter(ex=>!exclude.includes(ex.id)).map(ex=>{
    let sc = Math.random() * 2;
    sc -= exConflict(ex).score * 2;
    if(!neverDone(ex)) sc += 0.6;
    if(isNewbie) sc -= (exDifficulty(ex) - 1) * 0.8;
    return { ex, sc, comp: isCompoundEx(ex) };
  }).sort((a,b)=> b.sc - a.sc);
  const out = [];
  const take = x => { if(x && !out.includes(x)) out.push(x); };
  take(scored[0]);
  if(scored[0]) take(scored.find(x=> x.comp !== scored[0].comp));
  scored.filter(x=> !out.includes(x) && !out.some(o=>o.ex.equipment === x.ex.equipment)).forEach(x=>{ if(out.length < SB_OPTIONS) take(x); });
  scored.forEach(x=>{ if(out.length < SB_OPTIONS) take(x); });
  return out.slice(0, SB_OPTIONS).map(x=>x.ex.id);
}
// Next day in the rotation after the last one you finished in this style.
function sbNextDay(style){
  const order = SB_STYLES[style].days;
  const last = sb.history.filter(h=>h.style === style).sort((a,b)=> a.date.localeCompare(b.date)).pop();
  if(!last) return order[0];
  return order[(order.indexOf(last.day) + 1) % order.length];
}
function sbLastDone(day){
  const h = sb.history.filter(x=>x.day === day).sort((a,b)=> a.date.localeCompare(b.date)).pop();
  if(!h) return null;
  const days = Math.round((new Date(todayStr()+'T00:00:00') - new Date(h.date+'T00:00:00')) / 86400000);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago';
}

/* ---------------- Actions ---------------- */
function sbOpen(){ switchView('split'); }
function sbSetStyle(style){
  sbSetup.style = style; sbSetup.day = sbNextDay(style);
  sb.style = style; saveSb(); renderSplit();
}
function sbSetDay(day){ sbSetup.day = day; renderSplit(); }
function sbSetCount(n){ sbSetup.count = n; renderSplit(); }
function sbSetEquip(m){ sbSetup.equip = m; sbSetup.equipTouched = true; renderSplit(); }
function sbStart(){
  if(!sbSetup.style || !sbSetup.day){ showToast('Pick a week type and a day first'); return; }
  const day = SB_DAYS[sbSetup.day];
  const count = Math.max(sbSetup.count, day.required.length);
  sb.session = { date: todayStr(), style: sbSetup.style, day: sbSetup.day, count, equip: sbSetup.equip || 'usual', picks:[], stage:'focus', focus:null, options:[], current:null };
  saveSb(); renderSplit(); renderDashboard(); window.scrollTo(0,0);
}
function sbChooseFocus(focus){
  const s = sb.session;
  const choice = sbFocusChoices(s).find(c=>c.focus === focus);
  if(!choice || !choice.allowed){ showToast('Finish the muscles still owed first'); return; }
  s.focus = focus; s.options = sbRecommend(focus, s); s.stage = 'pick';
  saveSb(); renderSplit(); window.scrollTo(0,0);
}
function sbReroll(){
  const s = sb.session;
  let o = sbRecommend(s.focus, s, s.options);
  if(!o.length){ o = sbRecommend(s.focus, s); showToast('That\'s every option for your equipment — reshuffled'); }
  s.options = o; saveSb(); renderSplit();
}
function sbChooseExercise(exId){
  const s = sb.session;
  s.current = { exerciseId: exId, focus: s.focus };
  s.stage = 'doing'; wizardFeel = 'right';
  saveSb(); renderSplit(); window.scrollTo(0,0);
}
function sbBack(){
  const s = sb.session;
  if(s.stage === 'doing'){ s.stage = 'pick'; s.current = null; }
  else if(s.stage === 'pick'){ s.stage = 'focus'; s.focus = null; s.options = []; }
  saveSb(); renderSplit(); window.scrollTo(0,0);
}
function addSbSetRow(ex, weight, reps){
  const c = document.getElementById('sbSetsContainer'); if(!c) return;
  if(!ex){ ex = exercises.find(e=>e.id===sb.session.current.exerciseId); const rx = sbRx(ex); weight = suggestFor(ex, rx, todayReadiness()).weight; reps = repRange(rx.reps)[0]; }
  buildSetRow(c, ex, weight || '', reps);
}
function sbSave(){
  const s = sb.session;
  const ex = exercises.find(e=>e.id===s.current.exerciseId); if(!ex) return;
  const sets = collectSets(document.getElementById('sbSetsContainer'), ex);
  if(!sets.length){ showToast('Log at least one set'); return; }
  const rx = sbRx(ex), readiness = todayReadiness();
  const award = awardForLog(ex, sets);
  logs.push({ id: uid(), exerciseId: ex.id, date: todayStr(), sets, notes:'', dayId: 'split-' + s.day, feel: wizardFeel, readiness, band: bandStamp(ex) }); rememberBand(ex);
  updateProgressAfter(ex, sets, rx, wizardFeel, readiness);
  s.picks.push({ focus: s.current.focus, exerciseId: ex.id, sets: sets.length, logged: true, xp: award.xp, pr: award.pr });
  checkBadges();
  s.current = null; s.focus = null; s.options = []; wizardFeel = 'right';
  s.stage = sbRemaining(s) > 0 ? 'focus' : 'done';
  if(s.stage === 'done') sbRecordDay(s);
  saveAll(); saveSb();
  showToast(`✓ ${ex.name} logged · +${award.xp} XP`);
  renderSplit(); renderDashboard(); window.scrollTo(0,0);
}
function sbRecordDay(s){
  sb.history = sb.history.filter(h=> !(h.date === s.date && h.day === s.day));
  sb.history.push({ date: s.date, style: s.style, day: s.day, exIds: sbUsedIds(s) });
  if(sb.history.length > 120) sb.history = sb.history.slice(-120);
}
function sbFinishEarly(){
  const s = sb.session;
  if(s.picks.length){ s.stage = 'done'; sbRecordDay(s); saveSb(); }
  else sb.session = null;
  saveSb(); renderSplit(); renderDashboard(); window.scrollTo(0,0);
}
function sbNewSession(){ sb.session = null; saveSb(); sbSetup = { style: sb.style, day: sb.style ? sbNextDay(sb.style) : null, count:5, equip: sbSetup.equip || 'usual' }; renderSplit(); window.scrollTo(0,0); }

/* ---------------- Rendering ---------------- */
function renderSplit(){
  const box = document.getElementById('splitMain'); if(!box) return;
  if(!sbSetup.equipTouched && typeof vacEquip === 'function' && vacEquip()) sbSetup.equip = profile.vacation.bands ? 'bands' : 'bodyweight';
  if(sbSetup.style == null && sb.style){ sbSetup.style = sb.style; sbSetup.day = sbNextDay(sb.style); }
  let html;
  if(sbLive() && sb.session.stage === 'focus') html = sbFocusHtml();
  else if(sbLive() && sb.session.stage === 'pick') html = sbPickHtml();
  else if(sbLive() && sb.session.stage === 'doing') html = sbDoingHtml();
  else if(sbDone()) html = sbDoneHtml();
  else html = sbSetupHtml();
  box.innerHTML = html;
  if(sbLive() && sb.session.stage === 'doing'){
    const ex = exercises.find(e=>e.id===sb.session.current.exerciseId);
    const rx = sbRx(ex), sug = suggestFor(ex, rx, todayReadiness());
    for(let i=0;i<sug.sets;i++) addSbSetRow(ex, sug.weight, repRange(rx.reps)[0]);
    const key = 'sb|' + sb.session.date + '|' + sb.session.picks.length + '|' + ex.id;
    if(lastTimerStepKey !== key && !timerRunning){ timerTotal = rx.rest; timerRemaining = rx.rest; lastTimerStepKey = key; }
    updateTimerDisplay();
    maybeShowTip('split', key, tipGroupsFor(ex));
  } else if(document.getElementById('view-split') && document.getElementById('view-split').classList.contains('active')) {
    hideTip();
  }
  refreshWakeLock();
}
function sbFocusLabel(f){ return SB_FOCUS[f] ? SB_FOCUS[f].label : f; }

function sbSetupHtml(){
  const st = sbSetup.style;
  const styleCards = Object.entries(SB_STYLES).map(([k,v])=> optCard(st===k, `${v.emoji} ${v.label}`, v.sub, `sbSetStyle('${k}')`)).join('');
  let dayHtml = '', countHtml = '';
  if(st){
    const next = sbNextDay(st);
    const rec = recoveringMuscles();
    dayHtml = `<label style="margin-top:18px;">2. Which day are you training today?</label>
      <div class="grid cols-3 sb-days">${SB_STYLES[st].days.map(d=>{
        const D = SB_DAYS[d], last = sbLastDone(d);
        const tired = D.required.some(f=> SB_TO_FS[f] && rec.has(SB_TO_FS[f]));
        const tag = d === next ? 'Up next' : '';
        return optCard(sbSetup.day===d, `${D.emoji} ${D.title}`, `${D.sub}<br><span class="hint" style="margin:0;">${last ? 'Last done ' + last : 'Not done yet'}${tired ? ' · <span style="color:var(--warn)">some of these were trained yesterday</span>' : ''}</span>`, `sbSetDay('${d}')`, tag);
      }).join('')}</div>`;
    if(sbSetup.day){
      const D = SB_DAYS[sbSetup.day];
      const opts = [4,5,6].filter(n=> n >= D.required.length);
      if(!opts.includes(sbSetup.count)) sbSetup.count = opts.includes(5) ? 5 : opts[0];
      countHtml = `<label style="margin-top:18px;">3. What equipment do you have today?</label>
        <div class="seg-row">${Object.entries(SB_EQUIP).map(([k,v])=>`<button class="seg-btn${(sbSetup.equip||'usual')===k?' active':''}" onclick="sbSetEquip('${k}')">${v.label}</button>`).join('')}</div>
        ${onVacation(todayStr()) ? `<div class="hint" style="margin-top:6px;">🌴 You're on vacation, so this defaults to what you packed.</div>` : ''}
        ${sbSetup.equip !== 'usual' ? `<div class="hint" style="margin-top:6px;">Travel mode — every option will be a ${sbSetup.equip === 'bands' ? 'resistance-band or ' : ''}bodyweight move.${D.required.some(f=>!sbCandidates(f, null).length) ? ` No band option for: ${D.required.filter(f=>!sbCandidates(f, null).length).map(sbFocusLabel).join(', ')} — those get skipped.` : ''}</div>` : ''}
        <label style="margin-top:18px;">4. How many exercises?</label>
        <div class="seg-row">${opts.map(n=>`<button class="seg-btn${sbSetup.count===n?' active':''}" onclick="sbSetCount(${n})">${n} exercises</button>`).join('')}</div>
        <div class="coach-why"><strong>${D.emoji} ${D.title} day covers:</strong> ${D.required.map(sbFocusLabel).join(', ')}.
          You'll pick which muscle to hit before each exercise, then choose from a few options for it. By exercise ${sbSetup.count}, every one of these will be covered — ${sbSetup.count > D.required.length ? `with ${sbSetup.count - D.required.length} extra pick${sbSetup.count - D.required.length > 1 ? 's' : ''} to double up on whatever you want to focus on.` : 'one exercise each.'}</div>
        <div class="wizard-actions"><button class="btn" onclick="sbStart()">Start ${D.title} day →</button></div>`;
    }
  }
  const recent = sb.history.slice(-6).reverse();
  return `<div class="card fs-hero" style="margin-bottom:16px;">
      <h2>🧩 Split Trainer — build today's workout</h2>
      <div class="hint">Pick how you want to structure your week, then the day. Your trainer walks you through it one exercise at a time: you choose the muscle and the move, it makes sure nothing gets skipped.</div>
      <label style="margin-top:12px;">1. What type of week are you running?</label>
      <div class="grid cols-2" style="margin-top:8px;">${styleCards}</div>
      ${dayHtml}
      ${countHtml}
    </div>
    ${recent.length ? `<div class="card"><h2>Recent split days</h2>${recent.map(h=>{
      const D = SB_DAYS[h.day]; const nice = new Date(h.date+'T00:00:00').toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric' });
      const names = (h.exIds||[]).map(id=>{ const e = exercises.find(x=>x.id===id); return e ? escapeHtml(e.name) : ''; }).filter(Boolean).join(', ');
      return `<div class="sb-hist-row"><strong>${D ? D.emoji + ' ' + D.title : h.day}</strong> <span class="hint" style="margin:0;">${nice} · ${SB_STYLES[h.style] ? SB_STYLES[h.style].label : ''}</span><div class="hint" style="margin:2px 0 0;">${names}</div></div>`;
    }).join('')}</div>` : ''}`;
}

// Checklist strip shown during the session: each muscle the day owes, ticked as you go.
function sbStripHtml(){
  const s = sb.session, D = SB_DAYS[s.day];
  const done = s.picks.length;
  const pct = Math.round(done / s.count * 100);
  const skipped = sbSkippedRequired(s);
  const chips = D.required.map(f=>{
    const n = s.picks.filter(p=> p.focus === f || (f === 'back' && (p.focus === 'lats' || p.focus === 'rows'))).length;
    const cls = n ? 'sb-check done' : skipped.includes(f) ? 'sb-check skipped' : 'sb-check';
    return `<span class="${cls}">${n ? '✓' : skipped.includes(f) ? '–' : '○'} ${sbFocusLabel(f)}${n > 1 ? ' ×' + n : ''}</span>`;
  }).join('');
  const extras = [...new Set(s.picks.map(p=>p.focus).filter(f=> !D.required.includes(f) && !(D.required.includes('back') && (f==='lats'||f==='rows'))))]
    .map(f=>`<span class="sb-check done extra">✓ ${sbFocusLabel(f)}</span>`).join('');
  return `<div class="fs-strip">
    <div class="flex-between"><span><strong>${D.emoji} ${D.title} day</strong> · ${SB_STYLES[s.style].label}${s.equip==='bands' ? ' · 🟠 bands' : s.equip==='bodyweight' ? ' · 🤸 bodyweight' : ''}</span><span class="xp-pill">${done} / ${s.count}</span></div>
    <div class="adh-bar"><div style="width:${pct}%"></div></div>
    <div class="chip-row" style="margin-top:8px;">${chips}${extras}</div>
    ${skipped.length ? `<div class="hint" style="margin:6px 0 0;">– ${skipped.map(sbFocusLabel).join(', ')} skipped today: no safe option for your equipment or sore areas.</div>` : ''}
  </div>`;
}
function sbFocusHtml(){
  const s = sb.session;
  const choices = sbFocusChoices(s);
  const owed = sbUncovered(s);
  const left = sbRemaining(s);
  const rec = sbRecommendedFocus(s);
  const lockedExtras = left <= owed.length && choices.some(c=> !c.owed && c.available);
  const card = c => {
    const F = SB_FOCUS[c.focus];
    const status = c.owed ? (c.focus === rec ? '<span class="opt-tag">Trainer\'s pick</span>' : '<span class="opt-tag owed">Still needed</span>') : c.done ? '<span class="opt-tag done">Done · add more</span>' : '<span class="opt-tag">Bonus</span>';
    if(!c.allowed) return `<div class="day-card path-card disabled"><div class="day-title">${F.label}</div><div class="day-sub">${c.available ? 'Locked — finish the muscles still needed first.' : 'No options left for your equipment / sore areas.'}</div></div>`;
    return `<div class="day-card path-card${c.focus === rec ? ' highlight' : ''}" onclick="sbChooseFocus('${c.focus}')"><div class="day-title">${F.label} ${status}</div><div class="day-sub">${F.why} <span style="color:var(--text-dim)">${c.available} option${c.available!==1?'s':''}</span></div></div>`;
  };
  const sorted = choices.slice().sort((a,b)=> (b.allowed - a.allowed) || (b.owed - a.owed));
  return `<div class="card">
    ${sbStripHtml()}
    <h2>Exercise ${s.picks.length + 1} of ${s.count}: what do you want to hit?</h2>
    <div class="hint">${owed.length ? `Still needed: <strong>${owed.map(sbFocusLabel).join(', ')}</strong>. ` : 'Everything is covered — '}${left > owed.length ? `You have ${left - owed.length} spare pick${left - owed.length > 1 ? 's' : ''} to double up on anything.` : owed.length ? 'Every remaining pick goes to a muscle that\'s still needed.' : ''}${rec && s.picks.length === 0 ? ' Tip: start with the biggest muscle while you\'re fresh.' : ''}</div>
    ${lockedExtras ? '<div class="coach-why">Bonus picks are locked so the rest of the session can still cover the whole day.</div>' : ''}
    <div class="path-grid">${sorted.map(card).join('')}</div>
    <div class="wizard-actions">
      <button class="btn ghost" onclick="sbFinishEarly()">${s.picks.length ? 'Finish early' : 'Cancel'}</button>
    </div>
  </div>`;
}
function sbOptionCard(id){
  const ex = exercises.find(e=>e.id===id); if(!ex) return '';
  const rx = sbRx(ex), sg = suggestFor(ex, rx, todayReadiness());
  return `<div class="fs-option">
    ${exStatCardHtml(ex, { compact:true })}
    <div class="presc" style="margin:8px 0;">${rxLine(ex, sg.sets, rx, sg.weight)} · rest ${fmtRest(rx.rest)}</div>
    <button class="btn" style="width:100%;" onclick="sbChooseExercise('${ex.id}')">Do this one →</button>
  </div>`;
}
function sbPickHtml(){
  const s = sb.session, F = SB_FOCUS[s.focus];
  const total = sbCandidates(s.focus, s).length;
  return `<div class="card">
    ${sbStripHtml()}
    <h2>Exercise ${s.picks.length + 1} of ${s.count}: pick your ${F.label.toLowerCase()} move</h2>
    <div class="hint">${F.why} ${total > s.options.length ? `Showing ${s.options.length} of ${total} — tap "different options" to see more.` : ''}</div>
    <div class="fs-options">${s.options.map(sbOptionCard).join('')}</div>
    <div class="wizard-actions">
      <button class="btn ghost" onclick="sbBack()">← Different muscle</button>
      ${total > s.options.length ? '<button class="btn secondary" onclick="sbReroll()">↻ Show me different options</button>' : ''}
    </div>
  </div>`;
}
function sbDoingHtml(){
  const s = sb.session;
  const ex = exercises.find(e=>e.id===s.current.exerciseId);
  if(!ex){ s.stage = 'pick'; return sbPickHtml(); }
  const rx = sbRx(ex), sug = suggestFor(ex, rx, todayReadiness());
  const [lo, hi] = repRange(rx.reps);
  const last = sbRemaining(s) === 1;
  return `<div class="card">
    ${sbStripHtml()}
    ${exStatCardHtml(ex)}
    <div class="rest-timer-box">
      <div class="hdr">Rest Timer — ${fmtRest(rx.rest)} between sets</div>
      <div class="timer-wrap">
        <div class="timer-left"><div class="presets">
          ${[30,45,60,90,120,180].map(t=>`<button class="btn secondary" onclick="setTimerPreset(${t})">${t}s</button>`).join('')}
        </div></div>
        <div class="timer-right">
          <div class="timer-ring"><svg width="60" height="60"><circle cx="30" cy="30" r="24" style="stroke:var(--border)" stroke-width="5" fill="none"/><circle id="timerCircle" cx="30" cy="30" r="24" style="stroke:var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="151" stroke-dashoffset="0"/></svg><div class="time" id="timerDisplay">01:00</div></div>
          <div class="row"><button class="btn" id="timerStartBtn" onclick="toggleTimer()">Start</button><button class="btn secondary" onclick="resetTimer()">Reset</button></div>
        </div>
      </div>
    </div>
    <div class="sugg-box">
      <div class="sugg-main">Today: <strong>${rxLine(ex, sug.sets, rx, sug.weight)}</strong> · rest <strong>${fmtRest(rx.rest)}</strong></div>
      <div class="sugg-why">${neverDone(ex) ? 'First time: pick a weight you could lift ~15 times and focus on form. ' : ''}${sug.reasons.join(' ')}</div>
    </div>
    ${coachingHtml(ex)}
    <div class="hint" style="margin-bottom:8px;">Log what you actually did.${ex.unit==='lb' && !ex.repsAreTime ? ` Hit ${hi} reps on every set and the weight goes up next time.` : ''}</div>
    ${lastTimeHtml(ex)}
    <div id="sbSetsContainer"></div>
    <button class="btn secondary" onclick="addSbSetRow()" style="width:100%;margin-top:6px;">+ Add Set</button>
    <label>How did that feel?</label>
    <div class="seg-row" id="feelRow">
      <button class="seg-btn${wizardFeel==='easy'?' active':''}" data-v="easy" onclick="setWizardFeel('easy')"><span class="seg-emoji">😎</span>Too easy</button>
      <button class="seg-btn${wizardFeel==='right'?' active':''}" data-v="right" onclick="setWizardFeel('right')"><span class="seg-emoji">👌</span>Just right</button>
      <button class="seg-btn${wizardFeel==='hard'?' active':''}" data-v="hard" onclick="setWizardFeel('hard')"><span class="seg-emoji">🥵</span>Too hard</button>
    </div>
    <div class="wizard-actions">
      <button class="btn ghost" onclick="sbBack()">← Pick a different move</button>
      <button class="btn" data-save-btn onclick="sbSave()">${last ? 'Save & finish 🏁' : 'Save — pick the next one →'}</button>
    </div>
  </div>`;
}
function sbDoneHtml(){
  const s = sb.session, D = SB_DAYS[s.day];
  const total = s.picks.reduce((t,p)=>t + (p.sets||0), 0);
  const xp = s.picks.reduce((t,p)=>t + (p.xp||0), 0);
  const missed = SB_DAYS[s.day].required.filter(f=> !sbCovered(s, f));
  const next = SB_DAYS[sbNextDay(s.style)];
  return `<div class="card fs-hero">
    <h2>🏁 ${D.title} day complete!</h2>
    <div class="xp-burst"><div class="xp-big">+${xp} XP</div><div class="hint" style="margin:0;">${s.picks.length} exercises · ${total} sets</div></div>
    ${sbStripHtml()}
    <div style="margin-top:12px;">${s.picks.map((p,i)=>{ const ex = exercises.find(e=>e.id===p.exerciseId); return ex ? `<div class="sb-hist-row" style="display:flex;justify-content:space-between;gap:10px;"><span>${i+1}. ${p.pr?'📈 ':''}${escapeHtml(ex.name)}</span><span style="color:var(--text-dim)">${sbFocusLabel(p.focus)} · ${p.sets} sets</span></div>` : ''; }).join('')}</div>
    ${missed.length ? `<div class="coach-why warn">Not covered today: ${missed.map(sbFocusLabel).join(', ')}. Try to get ${missed.length > 1 ? 'them' : 'it'} in next time.</div>` : `<div class="coach-why">Every muscle on ${D.title} day covered. Next up in your ${SB_STYLES[s.style].label} rotation: <strong>${next.emoji} ${next.title}</strong>.</div>`}
    <div class="wizard-actions">
      <button class="btn secondary" onclick="sbNewSession()">Split Trainer home</button>
      <button class="btn" onclick="switchView('dashboard')">Back to Dashboard</button>
    </div>
  </div>`;
}
// Small entry card used on the Coach page and Home.
function sbEntryCardHtml(){
  if(sbLive()){
    const s = sb.session, D = SB_DAYS[s.day];
    return `<div class="card" style="margin-bottom:16px;"><div class="flex-between" style="gap:10px;flex-wrap:wrap;">
      <div><h2 style="margin-bottom:2px;">🧩 ${D.title} day in progress</h2><div class="hint" style="margin:0;">${s.picks.length} of ${s.count} exercises done · ${SB_STYLES[s.style].label}</div></div>
      <button class="btn" style="flex:0 0 auto;" onclick="sbOpen()">Continue →</button></div></div>`;
  }
  const style = sb.style ? SB_STYLES[sb.style] : null;
  const next = sb.style ? SB_DAYS[sbNextDay(sb.style)] : null;
  return `<div class="card" style="margin-bottom:16px;"><div class="flex-between" style="gap:10px;flex-wrap:wrap;">
    <div><h2 style="margin-bottom:2px;">🧩 Split Trainer</h2><div class="hint" style="margin:0;">${style ? `${style.label} · up next: <strong>${next.emoji} ${next.title}</strong>` : 'Push / Pull / Legs or Upper / Lower / Cardio — pick the muscle and the move for each exercise.'}</div></div>
    <button class="btn secondary" style="flex:0 0 auto;" onclick="sbOpen()">${style ? 'Build today →' : 'Try it →'}</button></div></div>`;
}
