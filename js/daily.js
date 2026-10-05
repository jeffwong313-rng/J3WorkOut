/* J3 WorkOut — js/daily.js
   Things to do every day — including rest days:
   - Daily habits (sleep hours, steps, protein) — 20 seconds, feeds your check-in
   - Guided mobility routines with a hands-free timer
   - Tip of the day
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Daily habits ---------------- */
let dailies = loadJSON(LS_KEYS.daily, {}); // { 'YYYY-MM-DD': { sleep, steps, protein } }
function saveDailies(){ save(LS_KEYS.daily, dailies); }
function todayDaily(){ return dailies[todayStr()] || {}; }
function proteinTarget(){ const w = profile.weight || 170; return [Math.round(w*0.7), Math.round(w*1.0)]; }
function setDaily(field, value){
  const t = todayStr();
  const before = dailies[t] ? Object.keys(dailies[t]).length : 0;
  dailies[t] = Object.assign({}, dailies[t], { [field]: value });
  if(value === '' || value == null || (typeof value === 'number' && isNaN(value))) delete dailies[t][field];
  saveDailies();
  if(!before && Object.keys(dailies[t]).length){ gainXP(5); saveGame(); showToast('Habits logged ✓ +5 XP'); }
  renderHabitsCard();
}
function stepDailySleep(delta){
  const cur = todayDaily().sleep != null ? todayDaily().sleep : 7;
  setDaily('sleep', Math.max(0, Math.min(14, Math.round((cur + delta)*2)/2)));
}
function habitStreak(){
  let d = todayStr(), n = 0;
  if(!dailies[d] || !Object.keys(dailies[d]).length) d = addDaysToDateStr(d, -1);
  while(dailies[d] && Object.keys(dailies[d]).length){ n++; d = addDaysToDateStr(d, -1); }
  return n;
}
function weekAvg(field){
  const vals = [];
  for(let i=0;i<7;i++){ const d = dailies[addDaysToDateStr(todayStr(), -i)]; if(d && d[field] != null && d[field] !== '') vals.push(+d[field]); }
  return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;
}
// Pre-fill the workout check-in from last night's logged sleep.
function sleepToCheckin(){
  const s = todayDaily().sleep;
  if(s == null) return null;
  return s < 6 ? -1 : s >= 7 ? 1 : 0;
}
function habitsCardHtml(){
  const d = todayDaily();
  const [plo, phi] = proteinTarget();
  const avgSleep = weekAvg('sleep'), avgSteps = weekAvg('steps');
  const streak = habitStreak();
  const sleepNote = d.sleep == null ? '' : d.sleep < 6 ? '😴 Short night — today\'s weights will adjust.' : d.sleep >= 7 ? '✅ Solid recovery.' : '';
  return `<div class="card habits-card" style="margin-bottom:16px;">
    <div class="flex-between" style="flex-wrap:wrap;gap:6px;">
      <div><h2>📋 Daily habits</h2><div class="hint" style="margin:0;">20 seconds a day. Recovery happens outside the gym.</div></div>
      ${streak ? `<span class="xp-pill">🔥 ${streak}-day streak</span>` : ''}
    </div>
    <div class="habit-grid">
      <div class="habit">
        <div class="habit-h">😴 Sleep last night</div>
        <div class="stepper"><button type="button" class="st-btn" onclick="stepDailySleep(-0.5)">−</button>
          <input type="number" inputmode="decimal" step="0.5" value="${d.sleep != null ? d.sleep : ''}" placeholder="7" onchange="setDaily('sleep', this.value===''?null:parseFloat(this.value))">
          <button type="button" class="st-btn" onclick="stepDailySleep(0.5)">+</button></div>
        <div class="habit-sub">hours${avgSleep!=null?` · 7-day avg ${avgSleep.toFixed(1)}`:''}</div>
      </div>
      <div class="habit">
        <div class="habit-h">👟 Steps</div>
        <input type="number" inputmode="numeric" step="500" value="${d.steps != null ? d.steps : ''}" placeholder="e.g. 8000" onchange="setDaily('steps', this.value===''?null:parseInt(this.value,10))">
        <div class="habit-sub">${avgSteps!=null?`7-day avg ${Math.round(avgSteps).toLocaleString()}`:'from your phone\'s health app'}</div>
      </div>
      <div class="habit">
        <div class="habit-h">🥩 Protein goal</div>
        <div class="seg-row">
          <button type="button" class="seg-btn${d.protein===true?' active':''}" onclick="setDaily('protein', ${d.protein===true?'null':'true'})">Hit it</button>
          <button type="button" class="seg-btn${d.protein===false?' active':''}" onclick="setDaily('protein', ${d.protein===false?'null':'false'})">Missed</button>
        </div>
        <div class="habit-sub">~${plo}–${phi} g/day for you</div>
      </div>
    </div>
    ${sleepNote ? `<div class="hint" style="margin:8px 0 0;">${sleepNote}</div>` : ''}
  </div>`;
}
function renderHabitsCard(){ const el = document.getElementById('habitsCard'); if(el) el.innerHTML = habitsCardHtml(); }

/* ---------------- Mobility routines ---------------- */
const MOBILITY_ROUTINES = [
  { id:'hips', name:'Hip & glute opener', emoji:'🦵', targets:['hips','glutes','lowerback','hamstrings'],
    why:'Sitting all day tightens hip flexors and switches off glutes. This frees up your squat and takes stress off your lower back.',
    moves:[
      { n:'90/90 hip switches', s:60, cue:'Sit with both knees bent 90°, rotate side to side slowly, chest tall.' },
      { n:'World\'s greatest stretch — left', s:45, cue:'Lunge forward, hand down inside the front foot, rotate your chest and reach up.' },
      { n:'World\'s greatest stretch — right', s:45, cue:'Same on the other side. Breathe into the stretch.' },
      { n:'Hip flexor stretch — left', s:45, cue:'Half-kneel, squeeze the back glute and gently shift forward. Don\'t arch your back.' },
      { n:'Hip flexor stretch — right', s:45, cue:'Switch sides. Squeeze the glute of the down knee.' },
      { n:'Deep squat hold', s:60, cue:'Sit into a deep squat, elbows pushing knees out. Hold a doorframe if needed.' },
      { n:'Glute bridges', s:45, cue:'Feet flat, drive hips up, squeeze 2 seconds at the top.' },
      { n:'Pigeon stretch — left', s:45, cue:'Front shin across, back leg long, fold forward slowly.' },
      { n:'Pigeon stretch — right', s:45, cue:'Other side. Ease off if your knee complains.' }
    ] },
  { id:'shoulders', name:'Shoulder & posture reset', emoji:'🙆', targets:['shoulders','chest','back','triceps','biceps'],
    why:'Undo desk and phone posture, and keep your shoulders happy for pressing.',
    moves:[
      { n:'Arm circles', s:45, cue:'Small to big circles, forward then backward.' },
      { n:'Wall slides', s:60, cue:'Back and arms against a wall, slide up and down slowly, keep contact.' },
      { n:'Arm T-raises (prone or standing)', s:45, cue:'Arms out like a T, thumbs up, squeeze shoulder blades together.' },
      { n:'Doorway chest stretch', s:60, cue:'Forearms on a doorframe, step through gently until you feel your chest open.' },
      { n:'Thread the needle — left', s:45, cue:'On hands and knees, slide the left arm under your body and rotate.' },
      { n:'Thread the needle — right', s:45, cue:'Other side. Let your upper back rotate, not your hips.' },
      { n:'Cross-body shoulder stretch — left', s:30, cue:'Pull the arm across your chest, shoulder down.' },
      { n:'Cross-body shoulder stretch — right', s:30, cue:'Other arm.' }
    ] },
  { id:'back', name:'Lower-back relief', emoji:'🌿', targets:['lowerback','core','glutes','hips'],
    why:'Gentle movement and core activation — usually better for a stiff back than staying still.',
    moves:[
      { n:'Cat-cow', s:60, cue:'On hands and knees, slowly round then arch your spine with your breath.' },
      { n:'Child\'s pose', s:45, cue:'Sit back on your heels, arms long, breathe into your lower back.' },
      { n:'Bird dogs', s:60, cue:'Reach opposite arm and leg, keep hips level, alternate slowly.' },
      { n:'Open book — left', s:45, cue:'Lie on your side, knees bent, open the top arm across your body.' },
      { n:'Open book — right', s:45, cue:'Other side. Follow your hand with your eyes.' },
      { n:'Knees-to-chest rock', s:45, cue:'On your back, hug your knees and rock gently side to side.' },
      { n:'Dead bug', s:45, cue:'Low back pressed down, slowly extend opposite arm and leg.' }
    ] },
  { id:'full', name:'10-minute morning flow', emoji:'☀️', targets:[],
    why:'A quick whole-body wake-up on rest days — gets blood flowing and helps you recover faster than doing nothing.',
    moves:[
      { n:'March in place', s:60, cue:'Easy pace, swing your arms, breathe through your nose.' },
      { n:'Cat-cow', s:45, cue:'Slow spine waves with your breath.' },
      { n:'World\'s greatest stretch — left', s:45, cue:'Lunge, hand down, rotate and reach.' },
      { n:'World\'s greatest stretch — right', s:45, cue:'Other side.' },
      { n:'Bodyweight squats (slow)', s:60, cue:'3 seconds down, pause, stand. Easy effort.' },
      { n:'Wall slides', s:45, cue:'Arms against the wall, slide up and down.' },
      { n:'Hip flexor stretch — left', s:40, cue:'Half-kneel, squeeze the back glute.' },
      { n:'Hip flexor stretch — right', s:40, cue:'Other side.' },
      { n:'Glute bridges', s:45, cue:'Squeeze at the top.' },
      { n:'Child\'s pose + deep breaths', s:60, cue:'Long slow exhales — try a couple of physiological sighs.' }
    ] }
];
function routineSeconds(r){ return r.moves.reduce((t,m)=>t+m.s, 0) + (r.moves.length-1)*5; }
function suggestedRoutine(){
  const flags = Object.keys(todayFlags());
  const y = addDaysToDateStr(todayStr(), -1);
  const yMuscles = new Set(logs.filter(l=>l.date===y).map(l=>{ const ex = exercises.find(e=>e.id===l.exerciseId); return ex && fsMuscleOf(ex); }).filter(Boolean));
  let best = null, bestScore = -1;
  MOBILITY_ROUTINES.forEach(r=>{
    const score = r.targets.filter(t=>flags.includes(t)).length * 2 + r.targets.filter(t=>yMuscles.has(t) || (t==='back' && yMuscles.has('back')) || (t==='hips' && (yMuscles.has('quads')||yMuscles.has('glutes')))).length;
    if(score > bestScore){ best = r; bestScore = score; }
  });
  return bestScore > 0 ? best : MOBILITY_ROUTINES.find(r=>r.id==='full');
}
let mob = { routine:null, i:0, remaining:0, phase:'idle', interval:null, startedAt:0, done:false };
let mobRunning = false;
function mobSay(t){ if(typeof vacSay === 'function') vacSay(t); }
function mobStart(id){
  const r = MOBILITY_ROUTINES.find(x=>x.id===id); if(!r) return;
  mob = { routine:r, i:0, remaining:5, phase:'ready', interval:null, startedAt:Date.now(), done:false };
  mobSay(`Get ready. First: ${r.moves[0].n}.`);
  mobResume(); switchView('mobility'); window.scrollTo(0,0);
}
function mobResume(){ if(mobRunning) return; mobRunning = true; mob.interval = setInterval(mobTick, 1000); refreshWakeLock(); renderMobility(); }
function mobPause(){ mobRunning = false; clearInterval(mob.interval); refreshWakeLock(); renderMobility(); }
function mobTick(){
  mob.remaining--;
  if(mob.remaining <= 0) mobNext(); else mobUpdateLive();
}
function mobNext(){
  const r = mob.routine;
  if(mob.phase === 'ready' || mob.phase === 'switch'){ mob.phase = 'move'; mob.remaining = r.moves[mob.i].s; playBeep(); mobSay(r.moves[mob.i].n); }
  else {
    mob.i++;
    if(mob.i >= r.moves.length){ mobFinish(); return; }
    mob.phase = 'switch'; mob.remaining = 5; mobSay(`Next: ${r.moves[mob.i].n}`);
  }
  renderMobility();
}
function mobFinish(early){
  clearInterval(mob.interval); mobRunning = false; mob.done = true; refreshWakeLock();
  const minutes = Math.max(1, Math.round((Date.now() - mob.startedAt)/60000));
  const did = early ? mob.i : mob.routine.moves.length;
  if(did > 0){
    activityLogs.push({ id: uid(), date: todayStr(), activityId:'mobility', label:`${mob.routine.emoji} ${mob.routine.name}`, hours: Math.round(minutes/60*100)/100, notes:`${did} of ${mob.routine.moves.length} moves · ${minutes} min` });
    gainXP(20); saveGame(); saveAll(); checkBadges();
    mob.xp = 20;
    mobSay('Nice work. Mobility session logged.');
  }
  renderMobility(); renderDashboard();
}
function mobEnd(){ mobFinish(true); }
function mobReset(){ clearInterval(mob.interval); mobRunning = false; mob = { routine:null, i:0, remaining:0, phase:'idle', interval:null, startedAt:0, done:false }; renderMobility(); }
function mobUpdateLive(){
  const t = document.getElementById('mobTime'); if(t) t.textContent = mob.remaining;
  const ring = document.getElementById('mobRing');
  if(ring){ const tot = mob.phase === 'move' ? mob.routine.moves[mob.i].s : 5; const C = 2*Math.PI*80; ring.setAttribute('stroke-dasharray', C); ring.setAttribute('stroke-dashoffset', C*(1 - mob.remaining/tot)); }
}
function renderMobility(){
  const box = document.getElementById('mobilityMain'); if(!box) return;
  if(mob.routine && !mob.done){
    const r = mob.routine, m = r.moves[mob.i], next = r.moves[mob.i+1];
    const segs = r.moves.map((x,k)=>`<div class="progress-seg${k===mob.i?' current':''}" style="background:var(--core);opacity:${k<mob.i?1:k===mob.i?1:.22}"></div>`).join('');
    const label = mob.phase === 'move' ? 'MOVE' : mob.phase === 'ready' ? 'GET READY' : 'NEXT UP';
    box.innerHTML = `<div class="card">
      <div class="progress-track">${segs}</div>
      <div class="progress-label"><span class="progress-pct">${r.emoji} ${r.name}</span> · Move ${mob.i+1} / ${r.moves.length}</div>
      <div class="sprint-phase-banner ${mob.phase==='move'?'done':'ready'}">${label}</div>
      <div class="vac-live">
        <div class="sprint-ring"><svg width="180" height="180"><circle cx="90" cy="90" r="80" stroke="var(--border)" stroke-width="10" fill="none"/><circle id="mobRing" cx="90" cy="90" r="80" stroke="var(--core)" stroke-width="10" fill="none" stroke-linecap="round"/></svg><div class="time" id="mobTime">${mob.remaining}</div></div>
        <div class="vac-live-ex"><div class="ex-stat-name" style="font-size:20px;">${m.n}</div><div class="vac-cue">${m.cue}</div></div>
      </div>
      ${next ? `<div class="hint" style="text-align:center;">Then: ${next.n}</div>` : ''}
      <div class="wizard-actions">
        <button class="btn ghost" onclick="mobEnd()">End</button>
        <button class="btn secondary" onclick="mobNext()">Skip ⏭</button>
        <button class="btn" onclick="${mobRunning ? 'mobPause()' : 'mobResume()'}">${mobRunning ? '⏸ Pause' : '▶ Resume'}</button>
      </div>
    </div>`;
    mobUpdateLive();
    return;
  }
  if(mob.done){
    box.innerHTML = `<div class="card vac-hero"><h2>🧘 ${mob.routine.name} — done</h2>
      ${mob.xp ? `<div class="xp-burst"><div class="xp-big">+${mob.xp} XP</div><div class="hint" style="margin:0;">Logged to your history and calendar.</div></div>` : '<div class="hint">Nothing completed, nothing logged.</div>'}
      <div class="wizard-actions"><button class="btn secondary" onclick="mobReset()">More routines</button><button class="btn" onclick="mobReset(); switchView('dashboard')">Home</button></div></div>`;
    return;
  }
  const sug = suggestedRoutine();
  box.innerHTML = `<div class="card vac-hero" style="margin-bottom:16px;">
      <h2>🧘 Mobility</h2>
      <div class="hint">Short guided routines for rest days, mornings or after sitting all day. The timer talks you through each move, so you can put the phone down. Moving gently on a rest day usually helps you recover faster than doing nothing.</div>
    </div>
    <div class="vac-grid">${MOBILITY_ROUTINES.map(r=>`<div class="vac-ex${r.id===sug.id?' suggested':''}">
      ${r.id===sug.id ? '<div class="nt-badge" style="display:inline-block;margin-bottom:6px;">⭐ Suggested for today</div>' : ''}
      <div class="vac-ex-h"><div class="vac-num">${r.emoji}</div><div style="flex:1;"><div class="ex-stat-name">${r.name}</div><div class="hint" style="margin:0;">~${Math.round(routineSeconds(r)/60)} min · ${r.moves.length} moves</div></div></div>
      <div class="vac-text">${r.why}</div>
      <ol class="mob-list">${r.moves.map(m=>`<li>${m.n} <span>${m.s}s</span></li>`).join('')}</ol>
      <button class="btn" style="width:100%;margin-top:10px;" onclick="mobStart('${r.id}')">▶ Start</button>
    </div>`).join('')}</div>`;
}

/* ---------------- Tip of the day ---------------- */
function tipOfTheDay(){
  const pool = FACTS.filter(f=>f.g || f.m);
  const unseen = pool.filter(f=>!seenFacts.includes(f.id));
  const list = unseen.length ? unseen : pool;
  const t = todayStr(); let h = 0; for(const c of t) h = (h*31 + c.charCodeAt(0)) >>> 0;
  if(profile.tipSkip && profile.tipSkip.date === t){ h += profile.tipSkip.n; }
  return list[h % list.length];
}
function tipCardHtml(){
  if(!tipsEnabled()) return '';
  const f = tipOfTheDay(); if(!f) return '';
  const learned = seenFacts.includes(f.id);
  return `<div class="card tip-day" style="margin-bottom:16px;">
    <div class="tip-h"><span class="tip-kicker">💡 Tip of the day</span><span class="tip-src">${f.src}</span></div>
    <div class="tip-title">${f.title}</div>
    <div class="tip-text">${f.text}</div>
    <div class="tip-actions">
      <button class="btn ghost" onclick="nextTipOfDay()">Another</button>
      <button class="btn ${learned?'secondary':''}" onclick="markFactSeen('${f.id}'); renderDashboard(); showToast('Saved to What you\\'ve learned');">${learned ? '✓ Learned' : 'Got it'}</button>
    </div>
  </div>`;
}
function nextTipOfDay(){
  const f = tipOfTheDay(); if(f) markFactSeen(f.id);
  const t = todayStr();
  profile.tipSkip = { date:t, n: (profile.tipSkip && profile.tipSkip.date===t ? profile.tipSkip.n : 0) + 1 };
  saveAll(); renderDashboard();
}
