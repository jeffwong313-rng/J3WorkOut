/* J3 WorkOut — js/vacation.js
   Vacation "Carb-Eraser" circuit + vacation mode.
   Loaded as a classic <script> in index.html order; files share globals. */

/* =====================================================================
   VACATION — "Carb-Eraser" full-body circuit + vacation mode
   No gym needed. 5 exercises × 40s work / 20s rest, 60s rest after each
   round, 4 rounds (~22 min). Do it 3–4× a week while away.
   Vacation mode: set a return date — planned gym days during the trip
   don't count as missed or break your streak.
   ===================================================================== */
const VAC_WORK = 40, VAC_REST = 20, VAC_ROUND_REST = 60, VAC_ROUNDS = 4;
const VAC_BODYWEIGHT = [
  { id:'squat', exId:'bwsquat', anim:'legs-compound', muscles:['quads','glutes'], focus:'Lower Body & Calorie Burn',
    variants:{ regular:'Bodyweight Squats', jump:'Jump Squats' }, defaultVariant:'regular',
    how:'Stand with your feet shoulder-width apart. Lower your hips back and down until your thighs are parallel to the floor, then press up powerfully. If you want to maximize explosive calorie burn, add a small jump at the top (jump squats). If your knees or joints prefer low impact, stick to fast-paced bodyweight squats.',
    benefit:'Targets your glutes and quads — the largest muscle groups in your body — which burns the most energy.',
    cue:'Hips back and down, thighs parallel, drive up hard.' },
  { id:'pushup', exId:'pushup', anim:'chest', muscles:['chest','shoulders','triceps'], focus:'Upper Body Strength',
    variants:{ standard:'Push-Ups', incline:'Incline Push-Ups' }, defaultVariant:'standard',
    how:'Place your hands slightly wider than shoulder-width apart. Keep your core tight and lower your chest until it\'s a few inches from the floor, then press back up.',
    tip:'If standard push-ups are too fatiguing while eating higher carbs, or you want an easier angle, place your hands on the edge of a sturdy hotel desk or the bed frame (incline push-ups) to keep your form clean.',
    benefit:'Keeps your chest, shoulders, and triceps toned so you don\'t lose upper body strength.',
    cue:'Core tight, chest to a few inches off the floor, press up.' },
  { id:'lunge', exId:'lunge', anim:'legs-compound', muscles:['quads','glutes'], focus:'Balance & Stability',
    variants:{ only:'Alternating Reverse Lunges' }, defaultVariant:'only',
    how:'Stand tall, then take a big step backward with your right foot. Lower your hips until both knees are bent at a 90-degree angle, push off your front foot to return to standing, and switch legs.',
    benefit:'Great for unilateral (single-leg) stability and glute activation without needing heavy weights.',
    cue:'Big step back, both knees to 90°, push through the front foot, switch.' },
  { id:'dips', exId:'tricepdip', anim:'triceps', muscles:['triceps','shoulders'], focus:'Triceps & Shoulders',
    variants:{ only:'Chair Dips' }, defaultVariant:'only',
    how:'Sit on the edge of a sturdy chair or the edge of the bed. Place your hands palm-down next to your hips, slide your hips off the edge, and bend your elbows to lower your body straight down. Press back up until your arms are straight.',
    benefit:'Isolates the triceps and front shoulders using hotel furniture.',
    cue:'Hips close to the edge, lower straight down, press to straight arms.' },
  { id:'climbers', exId:'mtnclimbers', anim:'conditioning', muscles:['core','shoulders','quads'], focus:'Core & High Heart Rate',
    variants:{ only:'Mountain Climbers' }, defaultVariant:'only',
    how:'Get into a high plank position with your hands under your shoulders. Rapidly drive one knee toward your chest, then switch legs in a running motion while keeping your hips low and core tight.',
    benefit:'Acts as a cardio finisher that spikes your heart rate and melts calories at the end of every round.',
    cue:'Hands under shoulders, hips low, drive the knees fast.' }
];
// Same format, built from resistance-band moves (see js/bands.js for the demos).
const VAC_BANDS = [
  { id:'bsquat', exId:'bandsquat', anim:'legs-compound', muscles:['quads','glutes'], focus:'Legs & Glutes',
    variants:{ only:'Banded Squats' }, defaultVariant:'only',
    how:'Stand on the middle of the band, feet shoulder-width, handles at your shoulders. Sit your hips back and down, then drive up and finish tall — the band is hardest at the top.',
    tip:'No handles? Stand on a loop band and hold it at your shoulders like a front squat.',
    benefit:'Your biggest muscles do the most work, so this burns the most energy of the circuit.',
    cue:'Sit back and down, drive up, squeeze at the top.' },
  { id:'bpress', exId:'bandchestpress', anim:'chest', muscles:['chest','shoulders','triceps'], focus:'Chest & Triceps',
    variants:{ press:'Band Chest Press', pushup:'Banded Push-Ups' }, variantEx:{ pushup:'bandpushup' }, defaultVariant:'press',
    how:'Anchor the band behind you at chest height (door anchor, or wrap it around your back). Staggered stance, hands beside your chest. Press forward until your arms are nearly straight, then control the band back.',
    tip:'Door anchor: close it on the hinge side of a door that opens away from you, and tug-test it first.',
    benefit:'Keeps your pressing strength while you\'re away from a bench.',
    cue:'Elbows 45°, press out, control it back.' },
  { id:'brow', exId:'bandrow', anim:'back', muscles:['back','biceps'], focus:'Back & Biceps',
    variants:{ row:'Band Seated Rows', pulldown:'Band Lat Pulldowns' }, variantEx:{ pulldown:'bandpulldown' }, defaultVariant:'row',
    how:'Sit tall with your legs straight and the band around the soles of your feet. Pull the handles to your belly button, squeeze your shoulder blades together, then let your arms straighten with control.',
    benefit:'Balances out the pressing and keeps your posture strong after long flights and car rides.',
    cue:'Pull to your belly, squeeze your shoulder blades.' },
  { id:'brdl', exId:'bandrdl', anim:'glutes', muscles:['hamstrings','glutes'], focus:'Hamstrings & Glutes',
    variants:{ rdl:'Band Romanian Deadlifts', bridge:'Banded Glute Bridges' }, variantEx:{ bridge:'bandglutebridge' }, defaultVariant:'rdl',
    how:'Stand on the band, handles in front of your thighs, soft knees. Push your hips straight back with a flat back until you feel a hamstring stretch, then squeeze your glutes to stand tall.',
    benefit:'Works the back of your legs — the side squats miss — and protects your lower back.',
    cue:'Hips back, flat back, squeeze up.' },
  { id:'bohp', exId:'bandohp', anim:'shoulders', muscles:['shoulders','triceps'], focus:'Shoulders',
    variants:{ ohp:'Band Overhead Press', lateral:'Band Lateral Raises' }, variantEx:{ lateral:'bandlateral' }, defaultVariant:'ohp',
    how:'Stand on the band, handles at shoulder height, palms forward. Squeeze your glutes, press straight overhead, then lower to your shoulders with control.',
    benefit:'Strong, healthy shoulders — and the last move gets your heart rate back up for the next round.',
    cue:'Ribs down, press up, lower slow.' }
];
const VAC_CIRCUITS = {
  bodyweight: { emoji:'🏨', name:'Bodyweight "Carb-Eraser" circuit', short:'Bodyweight', list:VAC_BODYWEIGHT, label:'🌴 Vacation Circuit',
    sub:'No equipment at all — just you and some hotel furniture.' },
  bands:      { emoji:'🟠', name:'Resistance band circuit', short:'Bands', list:VAC_BANDS, label:'🌴 Band Circuit',
    sub:'Pack a set of bands (+ door anchor) and get real resistance for every muscle.' }
};
function vacCircuitId(){ const c = profile.vacation && profile.vacation.circuit; return VAC_CIRCUITS[c] ? c : 'bodyweight'; }
function vacList(){ return VAC_CIRCUITS[vacCircuitId()].list; }
function setVacCircuit(c){
  if(vac.started && !vac.done){ showToast('Finish or end the current circuit first'); return; }
  profile.vacation = Object.assign({}, profile.vacation, { circuit: c }); saveAll(); renderVacation();
}
function vacExId(v){ const k = vacVariant(v); return (v.variantEx && v.variantEx[k]) || v.exId; }
function vacDemo(v){
  const ex = exercises.find(e=>e.id===vacExId(v));
  const d = ex ? demoFor(ex) : null;
  return d || MOVEMENT_ANIMATIONS[v.anim] || null;
}
function vacVariant(v){ const vp = (profile.vacation && profile.vacation.variants) || {}; return vp[v.id] || v.defaultVariant; }
function vacName(v){ return v.variants[vacVariant(v)]; }
function setVacVariant(id, variant){
  profile.vacation = profile.vacation || {};
  profile.vacation.variants = Object.assign({}, profile.vacation.variants, { [id]: variant });
  saveAll(); renderVacation();
}
function vacTotalSeconds(){ const n = vacList().length; return VAC_ROUNDS * (n*VAC_WORK + (n-1)*VAC_REST) + (VAC_ROUNDS-1)*VAC_ROUND_REST; }
function buildVacPhases(){
  const phases = [];
  for(let r=1; r<=VAC_ROUNDS; r++){
    vacList().forEach((v,i,list)=>{
      phases.push({ type:'work', round:r, idx:i, dur:VAC_WORK });
      const last = i === list.length-1;
      if(!last) phases.push({ type:'rest', round:r, idx:i+1, dur:VAC_REST });
      else if(r < VAC_ROUNDS) phases.push({ type:'roundrest', round:r, idx:0, dur:VAC_ROUND_REST });
    });
  }
  return phases;
}

/* ---------------- Vacation mode (dates) ---------------- */
function onVacation(dateStr){
  const v = profile.vacation;
  return !!(v && v.until && v.from && dateStr >= v.from && dateStr <= v.until);
}
function startVacationMode(){
  const el = document.getElementById('vacUntil');
  const until = el && el.value;
  if(!until || until < todayStr()){ showToast('Pick the date you\'re back'); return; }
  const pw = document.getElementById('vacPerWeek');
  const bandsEl = document.getElementById('vacBands');
  const bands = bandsEl ? bandsEl.checked : true;
  // Pre-load the trip: circuit, Split Trainer and Freestyle all switch to what you're packing.
  profile.vacation = Object.assign({}, profile.vacation, { from: todayStr(), until, perWeek: pw ? +pw.value : 3, bands, circuit: bands ? 'bands' : 'bodyweight' });
  if(!sbLive()) sbSetup.equip = bands ? 'bands' : 'bodyweight';
  saveAll(); renderVacation(); renderDashboard(); renderCalendar();
  showToast('🌴 Vacation mode on until ' + until + (bands ? ' — workouts switched to bands' : ' — workouts switched to bodyweight'));
}
function toggleVacBands(){
  profile.vacation.bands = !profile.vacation.bands;
  profile.vacation.circuit = profile.vacation.bands ? 'bands' : 'bodyweight';
  if(!sbLive()) sbSetup.equip = profile.vacation.bands ? 'bands' : 'bodyweight';
  saveAll(); renderVacation(); renderDashboard();
}
// Equipment while travelling (null when not on vacation).
function vacEquip(){ return onVacation(todayStr()) ? (profile.vacation.bands ? ['band','bodyweight'] : ['bodyweight']) : null; }
function endVacationMode(){
  if(!profile.vacation) return;
  profile.vacation.until = addDaysToDateStr(todayStr(), -1);
  if(profile.vacation.until < profile.vacation.from) { profile.vacation.from = null; profile.vacation.until = null; }
  if(!sbLive()) sbSetup.equip = 'usual';
  saveAll(); renderVacation(); renderDashboard(); renderCalendar();
  showToast('Welcome back! Your regular plan picks up today.');
}
function vacCircuitsThisWeek(){
  const days = weekDates(todayStr());
  return activityLogs.filter(a=> a.activityId === 'vacation' && days.includes(a.date)).length;
}

/* ---------------- Guided timer ---------------- */
let vac = { phases:null, i:0, remaining:0, running:false, interval:null, done:false, started:false, completedWork:0, wakeLock:null };
let vacVoice = true;
function vacSay(text){
  if(!vacVoice || !('speechSynthesis' in window)) return;
  try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; speechSynthesis.speak(u); }catch(e){}
}
async function vacKeepAwake(on){
  try{
    if(on && 'wakeLock' in navigator && !vac.wakeLock) vac.wakeLock = await navigator.wakeLock.request('screen');
    if(!on && vac.wakeLock){ await vac.wakeLock.release(); vac.wakeLock = null; }
  }catch(e){}
}
function vacAnnounce(){
  const p = vac.phases[vac.i];
  const ex = vacList()[p.idx];
  if(p.type === 'work') vacSay(`Go! ${vacName(ex)}.`);
  else if(p.type === 'rest') vacSay(`Rest. Next up: ${vacName(ex)}.`);
  else vacSay(`Round ${p.round} done. Rest one minute. Next: ${vacName(ex)}.`);
}
function vacStart(){
  vac.phases = buildVacPhases(); vac.i = 0; vac.remaining = vac.phases[0].dur; vac.done = false; vac.started = true; vac.completedWork = 0;
  vac.startedAt = Date.now();
  vacResume(true);
}
function vacResume(first){
  if(vac.running) return;
  vac.running = true; vacKeepAwake(true);
  if(first){ playBeep(); vacAnnounce(); }
  vac.interval = setInterval(vacTick, 1000);
  renderVacation();
}
function vacPause(){ vac.running = false; clearInterval(vac.interval); vacKeepAwake(false); renderVacation(); }
function vacToggle(){ vac.running ? vacPause() : vacResume(false); }
function vacTick(){
  vac.remaining -= 1;
  if(vac.remaining === 3 && vac.phases[vac.i].type !== 'work') vacSay('3, 2, 1');
  if(vac.remaining <= 0) vacNextPhase();
  else vacUpdateLive();
}
function vacNextPhase(){
  const p = vac.phases[vac.i];
  if(p.type === 'work') vac.completedWork++;
  vac.i++;
  if(vac.i >= vac.phases.length){ vacFinish(); return; }
  vac.remaining = vac.phases[vac.i].dur;
  playBeep(); vacAnnounce();
  renderVacation();
}
function vacSkip(){ vacNextPhase(); }
function vacEndEarly(){
  if(!confirm('End the circuit now? Completed work will still be logged.')) return;
  vacFinish(true);
}
function vacFinish(early){
  clearInterval(vac.interval); vac.running = false; vacKeepAwake(false);
  vac.done = true;
  const workBlocks = vac.completedWork;
  if(workBlocks > 0){
    const minutes = Math.max(1, Math.round((Date.now() - vac.startedAt)/60000));
    const rounds = Math.floor(workBlocks / vacList().length);
    activityLogs.push({ id: uid(), date: todayStr(), activityId:'vacation', label: VAC_CIRCUITS[vacCircuitId()].label, hours: Math.round(minutes/60*100)/100,
      notes: `${rounds} of ${VAC_ROUNDS} rounds · ${workBlocks} work intervals · ${minutes} min` });
    const xp = workBlocks*5 + (rounds >= VAC_ROUNDS ? 50 : 0);
    const before = levelInfo(game.xp).lvl;
    gainXP(xp); saveGame();
    vac.lastXp = xp; vac.lastRounds = rounds; vac.lastMinutes = minutes;
    if(levelInfo(game.xp).lvl > before) setTimeout(()=> showToast(`⬆️ Level up! Level ${levelInfo(game.xp).lvl} — ${levelInfo(game.xp).title}`), 2000);
    saveAll(); checkBadges();
    vacSay(early ? 'Nice work. Circuit logged.' : 'Circuit complete! Great job.');
  } else { vac.lastXp = 0; vac.lastRounds = 0; }
  renderVacation(); renderDashboard();
}
function vacReset(){ clearInterval(vac.interval); vac = { phases:null, i:0, remaining:0, running:false, interval:null, done:false, started:false, completedWork:0, wakeLock:null }; renderVacation(); }
function vacUpdateLive(){
  const t = document.getElementById('vacTime'); if(!t) return;
  const p = vac.phases[vac.i];
  t.textContent = vac.remaining;
  const ring = document.getElementById('vacRing');
  if(ring){ const C = 2*Math.PI*80; ring.setAttribute('stroke-dasharray', C); ring.setAttribute('stroke-dashoffset', C*(1 - vac.remaining/p.dur)); }
  const tot = document.getElementById('vacTotal');
  if(tot){ const left = vac.remaining + vac.phases.slice(vac.i+1).reduce((s,x)=>s+x.dur,0); tot.textContent = Math.floor(left/60) + ':' + String(left%60).padStart(2,'0') + ' left'; }
}

/* ---------------- Rendering ---------------- */
function renderVacation(){
  const box = document.getElementById('vacationMain'); if(!box) return;
  if(vac.started && !vac.done){ box.innerHTML = vacActiveHtml(); vacUpdateLive(); return; }
  if(vac.done){ box.innerHTML = vacDoneHtml(); return; }
  box.innerHTML = vacIntroHtml();
}
function vacModeCardHtml(){
  const v = profile.vacation || {};
  const on = onVacation(todayStr());
  const perWeek = v.perWeek || 3;
  if(on){
    const done = vacCircuitsThisWeek();
    return `<div class="card vac-mode on" style="margin-bottom:16px;">
      <div class="flex-between" style="flex-wrap:wrap;gap:10px;">
        <div><h2>🌴 Vacation mode is on — back ${new Date(v.until+'T00:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</h2>
        <div class="hint" style="margin-bottom:0;">Planned gym days won't count as missed and your streak is paused, not broken. Goal: the circuit ${perWeek}× this week — <strong>${done} done</strong>. Split Trainer and Freestyle are set to <strong>${v.bands ? 'bands + bodyweight' : 'bodyweight only'}</strong>. <a href="#" onclick="toggleVacBands(); return false;">${v.bands ? 'No bands with me' : 'I have bands'}</a></div></div>
        <button class="btn ghost" style="flex:0 0 auto;" onclick="endVacationMode()">I'm back — end vacation</button>
      </div>
      <div class="adh-bar"><div style="width:${Math.min(100, Math.round(done/perWeek*100))}%"></div></div>
    </div>`;
  }
  return `<div class="card vac-mode" style="margin-bottom:16px;">
    <h2>Going on a trip?</h2>
    <div class="hint">Turn on vacation mode: your planned gym days pause (no "missed" days, streak stays safe) and the dashboard tracks this circuit instead.</div>
    <div class="row" style="flex-wrap:wrap;align-items:flex-end;">
      <div style="flex:1 1 150px;"><label>I'm back on</label><input type="date" id="vacUntil" min="${todayStr()}" value="${v.until && v.until >= todayStr() ? v.until : addDaysToDateStr(todayStr(), 7)}"></div>
      <div style="flex:1 1 120px;"><label>Circuits per week</label><select id="vacPerWeek"><option value="3"${perWeek===3?' selected':''}>3×</option><option value="4"${perWeek===4?' selected':''}>4×</option></select></div>
      <button class="btn" style="flex:0 0 auto;" onclick="startVacationMode()">🌴 Start vacation mode</button>
    </div>
    <label class="check-row"><input type="checkbox" id="vacBands" ${v.bands === false ? '' : 'checked'}> 🟠 I'm packing resistance bands — switch Split Trainer, Freestyle and the circuit to band + bodyweight moves while I'm away</label>
  </div>`;
}
function vacIntroHtml(){
  const mins = Math.round(vacTotalSeconds()/60);
  const cards = vacList().map((v,i)=>{
    const prim = [...new Set(v.muscles.flatMap(m=>FS_REGION_MAP[m]||[]))];
    const anim = vacDemo(v);
    const vex = exercises.find(e=>e.id===vacExId(v));
    const variantBtns = Object.keys(v.variants).length > 1
      ? `<div class="seg-row" style="margin-top:8px;">${Object.entries(v.variants).map(([k,label])=>`<button class="seg-btn${vacVariant(v)===k?' active':''}" onclick="setVacVariant('${v.id}','${k}')">${label}</button>`).join('')}</div>` : '';
    return `<div class="vac-ex">
      <div class="vac-ex-h"><div class="vac-num">${i+1}</div><div style="flex:1;"><div class="ex-stat-name">${vacName(v)}</div><div class="hint" style="margin:0;">${v.focus}</div></div></div>
      ${variantBtns}
      <div class="ex-stat-visuals">
        <div class="ex-stat-map">${bodyMapSvg(prim, [])}</div>
        ${anim ? `<div class="ex-stat-anim"><div class="mp-figure">${anim.svg}</div></div>` : ''}
      </div>
      <div class="vac-text"><strong>How to do it:</strong> ${v.how}</div>
      ${v.tip ? `<div class="vac-text"><strong>🏨 Hotel tip:</strong> ${v.tip}</div>` : ''}
      <div class="vac-text vac-benefit"><strong>🌴 Vacation benefit:</strong> ${v.benefit}</div>
      ${vex ? `<div style="margin-top:10px;">${videoLinkHtml(Object.assign({}, vex, { name: vacName(v) }))}</div>` : ''}
    </div>`;
  }).join('');
  return `${vacModeCardHtml()}
    <div class="card vac-hero" style="margin-bottom:16px;">
      <div class="seg-row" style="margin-bottom:12px;">${Object.entries(VAC_CIRCUITS).map(([k,c])=>`<button class="seg-btn${vacCircuitId()===k?' active':''}" onclick="setVacCircuit('${k}')"><span class="seg-emoji">${c.emoji}</span>${c.short}</button>`).join('')}</div>
      <h2>🌴 ${VAC_CIRCUITS[vacCircuitId()].name}</h2>
      <div class="hint">${VAC_CIRCUITS[vacCircuitId()].sub} No gym needed. Do this circuit <strong>3 to 4 times a week</strong> while away.${vacCircuitId()==='bands' ? ' <a href="#" onclick="switchView(\'bands\'); return false;">See every band exercise →</a>' : ''}</div>
      <div class="vac-format">
        <div><strong>${VAC_WORK}s</strong><span>work</span></div>
        <div><strong>${VAC_REST}s</strong><span>rest</span></div>
        <div><strong>${vacList().length}</strong><span>exercises</span></div>
        <div><strong>${VAC_ROUND_REST}s</strong><span>round rest</span></div>
        <div><strong>${VAC_ROUNDS}</strong><span>rounds</span></div>
        <div><strong>~${mins}</strong><span>minutes</span></div>
      </div>
      <div class="hint" style="margin-top:10px;">Complete all ${vacList().length} exercises back-to-back, then rest 60 seconds at the end of the round. The timer beeps and calls out each exercise so you can keep your phone on the floor.</div>
      <label class="check-row"><input type="checkbox" ${vacVoice?'checked':''} onchange="vacVoice=this.checked"> 🔊 Voice cues (announce each exercise)</label>
      <div class="wizard-actions"><button class="btn" onclick="vacStart()">▶ Start circuit (~${mins} min)</button></div>
    </div>
    <div class="vac-grid">${cards}</div>`;
}
function vacActiveHtml(){
  const p = vac.phases[vac.i];
  const ex = vacList()[p.idx];
  const label = p.type === 'work' ? 'WORK' : p.type === 'rest' ? 'REST — next up' : `ROUND ${p.round} DONE — rest`;
  const cls = p.type === 'work' ? 'sprint' : p.type === 'rest' ? 'rest' : 'ready';
  const color = p.type === 'work' ? 'var(--danger)' : p.type === 'rest' ? 'var(--blue)' : 'var(--warn)';
  const segs = vac.phases.filter(x=>x.type==='work').map((x,k)=>{
    const workIdxNow = vac.phases.slice(0, vac.i+1).filter(y=>y.type==='work').length - (p.type==='work'?1:0);
    const st = k < workIdxNow ? 1 : (k === workIdxNow && p.type==='work' ? 1 : .22);
    return `<div class="progress-seg${k===workIdxNow && p.type==='work'?' current':''}" style="background:${['var(--accent)','var(--blue)','var(--glute)','var(--tricep)','var(--core)'][x.idx]};opacity:${st}"></div>`;
  }).join('');
  const anim = vacDemo(ex);
  const nextWork = vac.phases.slice(vac.i+1).find(x=>x.type==='work');
  return `<div class="card">
    <div class="progress-track">${segs}</div>
    <div class="progress-label"><span class="progress-pct">Round ${p.round} / ${VAC_ROUNDS}</span> · Exercise ${p.idx+1} / ${vacList().length} · <span id="vacTotal"></span></div>
    <div class="sprint-phase-banner ${cls}">${label}</div>
    <div class="vac-live">
      <div class="sprint-ring"><svg width="180" height="180"><circle cx="90" cy="90" r="80" style="stroke:var(--border)" stroke-width="10" fill="none"/><circle id="vacRing" cx="90" cy="90" r="80" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round"/></svg><div class="time" id="vacTime">${vac.remaining}</div></div>
      <div class="vac-live-ex">
        <div class="ex-stat-name" style="font-size:20px;">${vacName(ex)}</div>
        <div class="hint" style="margin:2px 0 8px;">${ex.focus}</div>
        ${anim ? `<div class="mp-figure" style="width:110px;height:110px;color:var(--text);">${anim.svg}</div>` : ''}
        <div class="vac-cue">${ex.cue}</div>
      </div>
    </div>
    ${p.type === 'work' && nextWork ? `<div class="hint" style="text-align:center;">Then: ${vacName(vacList()[nextWork.idx])}</div>` : ''}
    <div class="wizard-actions">
      <button class="btn ghost" onclick="vacEndEarly()">End</button>
      <button class="btn secondary" onclick="vacSkip()">Skip ⏭</button>
      <button class="btn" onclick="vacToggle()">${vac.running ? '⏸ Pause' : '▶ Resume'}</button>
    </div>
  </div>`;
}
function vacDoneHtml(){
  const full = vac.lastRounds >= VAC_ROUNDS;
  return `<div class="card vac-hero">
    <h2>${vac.lastXp ? (full ? '🌴 Circuit complete!' : '🌴 Nice work!') : 'Circuit ended'}</h2>
    ${vac.lastXp ? `<div class="xp-burst"><div class="xp-big">+${vac.lastXp} XP</div><div class="hint" style="margin:0;">${vac.lastRounds} of ${VAC_ROUNDS} rounds · ${vac.lastMinutes} min${full?' · +50 full-circuit bonus':''}</div></div>
      <div class="coach-why">Logged to your history and calendar.${onVacation(todayStr()) ? ` That's <strong>${vacCircuitsThisWeek()} of ${(profile.vacation.perWeek||3)}</strong> circuits this week.` : ''} Enjoy the trip — drink water and get some sleep.</div>` : '<div class="hint">Nothing was completed, so nothing was logged.</div>'}
    <div class="wizard-actions">
      <button class="btn secondary" onclick="vacReset()">Back to circuit</button>
      <button class="btn" onclick="vacReset(); switchView('dashboard')">Dashboard</button>
    </div>
  </div>`;
}

