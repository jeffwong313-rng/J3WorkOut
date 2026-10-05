/* J3 WorkOut — js/tools.js
   Rest timer, Warm Up, Sprints, History, Calendar, Progress charts.
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Rest Timer (embedded inline in the Workout Plan wizard) ---------------- */

let timerTotal = 60;
let timerRemaining = 60;
let timerInterval = null;
let timerRunning = false;
let lastTimerStepKey = null; // which workout step last auto-set the rest timer
const CIRC = 2 * Math.PI * 24; // matches the condensed 60px ring's radius

// The timer's DOM only exists while an 'exercise' wizard step is on screen, so every
// lookup here is guarded — these functions are safe to call (or keep ticking in the
// background) even when the widget currently isn't rendered.
function updateTimerDisplay(){
  // The timer widget can exist in more than one screen (guided plan + Freestyle), so update every copy.
  const m = Math.floor(timerRemaining/60).toString().padStart(2,'0');
  const s = Math.floor(timerRemaining%60).toString().padStart(2,'0');
  document.querySelectorAll('#timerDisplay').forEach(d=> d.textContent = m+':'+s);
  document.querySelectorAll('#timerCircle').forEach(circle=>{
    const frac = timerTotal>0 ? timerRemaining/timerTotal : 0;
    circle.setAttribute('stroke-dasharray', CIRC);
    circle.setAttribute('stroke-dashoffset', CIRC * (1-frac));
    circle.style.stroke = (timerRemaining<=5 && timerRemaining>0) ? 'var(--accent2)' : 'var(--accent)';
  });
  document.querySelectorAll('#timerStartBtn').forEach(btn=> btn.textContent = timerRunning ? 'Pause' : 'Start');
}
function setTimerPreset(sec){ timerTotal = sec; timerRemaining = sec; pauseTimer(); updateTimerDisplay(); }
function setTimerCustom(){
  const el = document.getElementById('customTimerInput');
  const v = el && parseInt(el.value,10);
  if(v>0){ timerTotal=v; timerRemaining=v; pauseTimer(); updateTimerDisplay(); }
}
function toggleTimer(){ timerRunning ? pauseTimer() : startTimer(); }
function startTimer(){
  if(timerRemaining<=0) return;
  timerRunning = true;
  updateTimerDisplay();
  timerInterval = setInterval(()=>{
    timerRemaining -= 1;
    if(timerRemaining<=0){
      timerRemaining = 0;
      updateTimerDisplay();
      pauseTimer();
      playBeep();
      showToast('Rest complete — go time!');
      return;
    }
    updateTimerDisplay();
  }, 1000);
}
function pauseTimer(){
  timerRunning = false;
  clearInterval(timerInterval);
  updateTimerDisplay();
}
function resetTimer(){ timerRemaining = timerTotal; pauseTimer(); updateTimerDisplay(); }

function playBeep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for(let i=0;i<3;i++){
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.15;
      o.connect(g); g.connect(ctx.destination);
      const start = ctx.currentTime + i*0.28;
      o.start(start);
      o.stop(start+0.2);
    }
  }catch(e){ /* audio not available */ }
}

/* ---------------- Warm Up — continuous 10-minute guided routine ---------------- */
const WARMUP_TOTAL_SECONDS = 600;
const WARMUP_SCHEDULE = [
  { minute:1,  name:'Arm Circles',        category:'shoulders' },
  { minute:2,  name:'Cat-Cow Stretch',    category:'back' },
  { minute:3,  name:'Jumping Jacks',      category:'conditioning' },
  { minute:4,  name:'Plank',              category:'core' },
  { minute:5,  name:'Push-Ups',           category:'chest' },
  { minute:6,  name:'Plank',              category:'core' },
  { minute:7,  name:'Push-Ups',           category:'chest' },
  { minute:8,  name:'Plank',              category:'core' },
  { minute:9,  name:'Full Body Stretch',  category:'fullbody' },
  { minute:10, name:'Cool-Down / Rest',   category:'conditioning' }
];
let warmupInterval = null;
let warmupRunning = false;
let warmupElapsed = 0; // seconds, 0–600. In-memory only (like the rest timer) — a quick, repeatable routine.

function startWarmup(){
  warmupElapsed = 0;
  warmupRunning = true;
  renderWarmupTab(); // renders the active view now that warmupRunning is true, and syncs the UI
  beginWarmupInterval();
}
function warmupToggleTimer(){
  if(warmupRunning){ warmupPauseTimer(); }
  else{ warmupRunning = true; updateWarmupUI(); beginWarmupInterval(); }
}
function beginWarmupInterval(){
  clearInterval(warmupInterval);
  warmupInterval = setInterval(()=>{
    const prevMinuteIndex = Math.floor(warmupElapsed/60);
    warmupElapsed += 1;
    if(warmupElapsed >= WARMUP_TOTAL_SECONDS){
      warmupElapsed = WARMUP_TOTAL_SECONDS;
      warmupRunning = false;
      clearInterval(warmupInterval);
      playBeep();
      renderWarmupTab();
      return;
    }
    const newMinuteIndex = Math.floor(warmupElapsed/60);
    if(newMinuteIndex !== prevMinuteIndex){
      playBeep();
      renderWarmupTab(); // new activity — full re-render swaps name/icon/segment colors
      return;
    }
    updateWarmupUI();
  }, 1000);
}
function warmupPauseTimer(){
  warmupRunning = false;
  clearInterval(warmupInterval);
  updateWarmupUI();
}
function resetWarmup(){
  warmupPauseTimer();
  warmupElapsed = 0;
  renderWarmupTab();
}
function updateWarmupUI(){
  const display = document.getElementById('warmupTimerDisplay');
  if(!display) return; // not currently on-screen
  const secondsIntoMinute = warmupElapsed % 60;
  const remainInMinute = warmupElapsed >= WARMUP_TOTAL_SECONDS ? 0 : (60 - secondsIntoMinute);
  display.textContent = Math.floor(remainInMinute/60).toString().padStart(2,'0') + ':' + Math.floor(remainInMinute%60).toString().padStart(2,'0');
  const circle = document.getElementById('warmupTimerCircle');
  if(circle){
    const CIRC = 2 * Math.PI * 80;
    const frac = remainInMinute / 60;
    circle.setAttribute('stroke-dasharray', CIRC);
    circle.setAttribute('stroke-dashoffset', CIRC * (1-frac));
  }
  const btn = document.getElementById('warmupStartBtn');
  if(btn) btn.textContent = warmupRunning ? 'Pause' : (warmupElapsed>0 ? 'Resume' : 'Start');
  const totalEl = document.getElementById('warmupTotalRemaining');
  if(totalEl){
    const totalRemain = WARMUP_TOTAL_SECONDS - warmupElapsed;
    const tm = Math.floor(totalRemain/60).toString().padStart(2,'0');
    const ts = Math.floor(totalRemain%60).toString().padStart(2,'0');
    totalEl.textContent = tm+':'+ts+' remaining';
  }
}
function renderWarmupTab(){
  const box = document.getElementById('warmupMain');
  if(!box) return;
  if(!warmupRunning && warmupElapsed<=0){
    box.innerHTML = renderWarmupSetupHtml();
  }else if(warmupElapsed >= WARMUP_TOTAL_SECONDS){
    box.innerHTML = renderWarmupCompleteHtml();
  }else{
    box.innerHTML = renderWarmupActiveHtml();
    updateWarmupUI();
  }
}
function renderWarmupSetupHtml(){
  const rows = WARMUP_SCHEDULE.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);">
    ${iconBadge({category:a.category},'sm')}<div><strong>Minute ${a.minute}</strong> <span style="color:var(--text-dim);">— ${a.name}</span></div>
  </div>`).join('');
  return `<div class="card">
    <h2>10-Minute Warm-Up</h2>
    <div class="hint">A continuous, guided warm-up — it runs straight through all 10 minutes on its own, switching activities automatically.</div>
    <button class="btn" style="width:100%;margin:10px 0 16px;" onclick="startWarmup()">▶ Start Warm-Up</button>
    <div style="font-size:11.5px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px;">Schedule</div>
    ${rows}
  </div>`;
}
function renderWarmupCompleteHtml(){
  return `<div class="card">
    <div class="sprint-phase-banner done">Warm-up complete 🎉</div>
    <div class="hint" style="text-align:center;margin-bottom:0;">Nice work — you're all warmed up and ready to train.</div>
    <button class="btn" style="width:100%;margin-top:14px;" onclick="resetWarmup()">Do It Again</button>
  </div>`;
}
function renderWarmupActiveHtml(){
  const minuteIndex = Math.floor(Math.min(warmupElapsed, WARMUP_TOTAL_SECONDS-1) / 60);
  const activity = WARMUP_SCHEDULE[minuteIndex];
  const next = WARMUP_SCHEDULE[minuteIndex+1];
  const segHtml = WARMUP_SCHEDULE.map((a,i)=>{
    const def = categoryDef(a.category);
    const cls = i<minuteIndex ? 'done' : (i===minuteIndex ? 'current' : 'upcoming');
    const opacity = cls==='upcoming' ? 0.25 : 1;
    return `<div class="progress-seg ${cls}" style="background:${def?def.color:'var(--accent)'};opacity:${opacity};"></div>`;
  }).join('');
  const pct = Math.round(((minuteIndex + (warmupElapsed%60)/60) / WARMUP_SCHEDULE.length) * 100);

  return `<div class="card">
    <div class="progress-track">${segHtml}</div>
    <div class="progress-label"><span class="progress-pct">${pct}%</span> · Minute ${minuteIndex+1} of ${WARMUP_SCHEDULE.length} · <span id="warmupTotalRemaining"></span></div>
    <div class="sprint-phase-banner ready" style="display:flex;align-items:center;justify-content:center;gap:10px;">
      ${iconBadge({category:activity.category})}<span>${activity.name}</span>
    </div>
    <div class="sprint-ring-wrap">
      <div class="sprint-ring">
        <svg width="180" height="180">
          <circle cx="90" cy="90" r="80" style="stroke:var(--border)" stroke-width="14" fill="none"/>
          <circle id="warmupTimerCircle" cx="90" cy="90" r="80" style="stroke:var(--accent)" stroke-width="14" fill="none" stroke-linecap="round"/>
        </svg>
        <div class="time" id="warmupTimerDisplay">01:00</div>
      </div>
      <div class="row" style="max-width:260px;">
        <button class="btn" id="warmupStartBtn" onclick="warmupToggleTimer()">Pause</button>
        <button class="btn secondary" onclick="resetWarmup()">Reset</button>
      </div>
    </div>
    ${next ? `<div class="hint" style="text-align:center;">Up next: <strong style="color:var(--text);">${next.name}</strong></div>` : `<div class="hint" style="text-align:center;">Last stretch!</div>`}
  </div>`;
}

/* ---------------- Sprints — HIIT stationary bike intervals ---------------- */
const SPRINT_PHASE_SECONDS = 60;

function loadSprintProgress(){ return loadJSON(LS_KEYS.sprintProgress, null); }
function saveSprintProgress(patch){
  const current = loadSprintProgress() || {};
  const next = Object.assign(current, patch);
  save(LS_KEYS.sprintProgress, next);
  return next;
}
function clearSprintProgress(){ localStorage.removeItem(LS_KEYS.sprintProgress); }

function startSprintSession(){
  const input = document.getElementById('sprintRoundsInput');
  let n = parseInt(input.value, 10);
  if(isNaN(n) || n<1) n = 1;
  if(n>10) n = 10;
  save(LS_KEYS.sprintProgress, {
    totalRounds: n, currentRound: 1, phase:'ready',
    phaseTotal: SPRINT_PHASE_SECONDS, phaseRemaining: SPRINT_PHASE_SECONDS,
    roundsData: [], date: todayStr(), startedAt: new Date().toISOString()
  });
  sprintRunning = false;
  clearInterval(sprintInterval);
  renderSprintsTab();
}
function beginNextSprintRound(){
  if(!loadSprintProgress()) return;
  saveSprintProgress({ phase:'sprint', phaseTotal:SPRINT_PHASE_SECONDS, phaseRemaining:SPRINT_PHASE_SECONDS });
  renderSprintsTab();
  sprintStartTimer(); // committing to "Start Sprint" begins the countdown immediately
}
function sprintToggleTimer(){ sprintRunning ? sprintPauseTimer() : sprintStartTimer(); }
function sprintStartTimer(){
  const progress = loadSprintProgress();
  if(!progress || progress.phaseRemaining<=0) return;
  sprintRunning = true;
  updateSprintTimerUI();
  sprintInterval = setInterval(()=>{
    const p = loadSprintProgress();
    if(!p){ clearInterval(sprintInterval); sprintRunning=false; return; }
    p.phaseRemaining -= 1;
    if(p.phaseRemaining <= 0){
      p.phaseRemaining = 0;
      save(LS_KEYS.sprintProgress, p);
      sprintPauseTimer();
      playBeep();
      sprintPhaseComplete();
      return;
    }
    save(LS_KEYS.sprintProgress, p);
    updateSprintTimerUI();
  }, 1000);
}
function sprintPauseTimer(){
  sprintRunning = false;
  clearInterval(sprintInterval);
  updateSprintTimerUI();
}
function updateSprintTimerUI(){
  const display = document.getElementById('sprintTimerDisplay');
  if(!display) return; // not currently on-screen (e.g. 'ready'/'logging' phase, or another tab)
  const progress = loadSprintProgress();
  if(!progress) return;
  const m = Math.floor(progress.phaseRemaining/60).toString().padStart(2,'0');
  const s = Math.floor(progress.phaseRemaining%60).toString().padStart(2,'0');
  display.textContent = m+':'+s;
  const circle = document.getElementById('sprintTimerCircle');
  if(circle){
    const CIRC_SPRINT = 2*Math.PI*80;
    const frac = progress.phaseTotal>0 ? progress.phaseRemaining/progress.phaseTotal : 0;
    circle.setAttribute('stroke-dasharray', CIRC_SPRINT);
    circle.setAttribute('stroke-dashoffset', CIRC_SPRINT*(1-frac));
  }
  const btn = document.getElementById('sprintStartBtn');
  if(btn) btn.textContent = sprintRunning ? 'Pause' : (progress.phaseRemaining < progress.phaseTotal ? 'Resume' : 'Start');
}
function sprintPhaseComplete(){
  const progress = loadSprintProgress();
  if(!progress) return;
  if(progress.phase === 'sprint'){
    const isLastRound = progress.currentRound >= progress.totalRounds;
    if(isLastRound){
      // No rest after the final round — just ask for its cycle count, clock-free.
      saveSprintProgress({ phase:'finish' });
      renderSprintsTab();
    }else{
      // Rest starts immediately and keeps ticking — cycles for the round just
      // finished are entered inline, right there on the rest screen.
      saveSprintProgress({ phase:'rest', phaseTotal:SPRINT_PHASE_SECONDS, phaseRemaining:SPRINT_PHASE_SECONDS });
      renderSprintsTab();
      sprintStartTimer();
    }
    return;
  }
  if(progress.phase === 'rest'){
    saveSprintProgress({ currentRound: progress.currentRound + 1, phase:'ready' });
    renderSprintsTab();
  }
}
// Called onchange from the cycle-count input shown DURING the rest countdown — saves
// immediately without touching the timer, which keeps ticking in the background.
function saveSprintCyclesInline(round){
  const progress = loadSprintProgress();
  if(!progress) return;
  const input = document.getElementById('sprintCyclesInput');
  const cycles = parseInt(input.value, 10);
  if(isNaN(cycles) || cycles < 0) return;
  const roundsData = progress.roundsData.filter(r=>r.round!==round).concat([{ round, cycles }]);
  saveSprintProgress({ roundsData });
  showToast('Round ' + round + ': ' + cycles + ' cycles saved');
}
// The final round has no rest afterward, so its cycle count is entered on a
// dedicated (clock-free) screen that finishes the whole session once submitted.
function submitFinalRoundCycles(){
  const progress = loadSprintProgress();
  if(!progress) return;
  const input = document.getElementById('sprintCyclesInput');
  const cycles = parseInt(input.value, 10);
  if(isNaN(cycles) || cycles < 0){ showToast('Enter how many cycles you completed'); return; }
  const roundsData = progress.roundsData.filter(r=>r.round!==progress.currentRound).concat([{ round: progress.currentRound, cycles }]);
  saveSprintProgress({ roundsData });
  finalizeSprintSession();
}
function skipSprintRest(){ sprintPauseTimer(); sprintPhaseComplete(); }
function finalizeSprintSession(){
  const progress = loadSprintProgress();
  if(!progress) return;
  sprintPauseTimer();
  if(progress.roundsData.length > 0){
    sprintSessions.push({ id: uid(), date: progress.date, totalRounds: progress.totalRounds, roundsData: progress.roundsData, completedAt: new Date().toISOString() });
    save(LS_KEYS.sprintSessions, sprintSessions);
  }
  saveSprintProgress({ phase:'done' });
  renderSprintsTab();
}
function endSprintSessionEarly(){
  if(!confirm('End this session now? Any rounds you\'ve already logged will be saved.')) return;
  finalizeSprintSession();
}
function newSprintSession(){
  clearSprintProgress();
  sprintPauseTimer();
  renderSprintsTab();
}
function deleteSprintSession(id){
  const idx = sprintSessions.findIndex(s=>s.id===id); const removed = sprintSessions[idx];
  showUndo('Sprint session deleted', ()=>{ sprintSessions.splice(idx, 0, removed); save(LS_KEYS.sprintSessions, sprintSessions); renderSprintsTab(); });
  sprintSessions = sprintSessions.filter(s=>s.id!==id);
  save(LS_KEYS.sprintSessions, sprintSessions);
  renderSprintsTab();
}
// Best cycles ever logged for each round position (1–10) — always a goal to chase.
function sprintRecords(){
  const records = [];
  for(let r=1; r<=10; r++){
    let best = null;
    sprintSessions.forEach(s=>{
      const rd = s.roundsData.find(x=>x.round===r);
      if(rd && (!best || rd.cycles>best.cycles)) best = { cycles: rd.cycles, date: s.date };
    });
    records.push({ round:r, best });
  }
  return records;
}

function renderSprintsTab(){
  const box = document.getElementById('sprintsMain');
  if(!box) return;
  const progress = loadSprintProgress();
  if(!progress || progress.phase==='done'){
    box.innerHTML = renderSprintSetupHtml(progress && progress.phase==='done' ? progress : null);
  }else{
    box.innerHTML = renderSprintActiveHtml(progress);
    updateSprintTimerUI();
  }
}
function renderSprintSetupHtml(justFinished){
  let html = '';
  if(justFinished){
    const records = sprintRecords();
    html += `<div class="card" style="margin-bottom:16px;">
      <h2>Session complete 🎉</h2>
      <div class="hint">Nice work — here's how each round went:</div>
      <table class="records-table">
        <thead><tr><th>Round</th><th>Cycles</th><th></th></tr></thead>
        <tbody>${justFinished.roundsData.map(rd=>{
          const rec = records.find(r=>r.round===rd.round);
          const isRecord = rec && rec.best && rec.best.cycles===rd.cycles && rec.best.date===justFinished.date;
          return `<tr><td>Round ${rd.round}</td><td class="record-cell">${rd.cycles}</td><td>${isRecord?'<span class="new-record-badge">🏆 New record</span>':''}</td></tr>`;
        }).join('')}</tbody>
      </table>
      <button class="btn" style="width:100%;margin-top:14px;" onclick="newSprintSession()">Start Another Session</button>
    </div>`;
  }
  html += `<div class="card" style="margin-bottom:16px;">
    <h2>Sprints — HIIT Bike Intervals</h2>
    <div class="hint">60 seconds all-out sprint, 60 seconds easy pace, repeat. Log how many cycles you complete each sprint and try to beat your record.</div>
    <label>Number of sprint rounds (1–10)</label>
    <input type="number" id="sprintRoundsInput" min="1" max="10" value="5">
    <button class="btn" style="width:100%;margin-top:14px;" onclick="startSprintSession()">Start Sprint Session</button>
  </div>`;

  const records = sprintRecords();
  const hasAnyRecord = records.some(r=>r.best);
  html += `<div class="card" style="margin-bottom:16px;">
    <h2>Your Records</h2>
    <div class="hint">Best cycles ever logged for each sprint round — your goal to beat.</div>
    ${hasAnyRecord ? `<table class="records-table">
      <thead><tr><th>Round</th><th>Record (cycles)</th><th>Date</th></tr></thead>
      <tbody>${records.filter(r=>r.best).map(r=>`<tr><td>Round ${r.round}</td><td class="record-cell">${r.best.cycles}</td><td style="color:var(--text-dim);font-size:12px;">${r.best.date}</td></tr>`).join('')}</tbody>
    </table>` : '<div class="empty">No sprints logged yet — start a session to set your first records.</div>'}
  </div>`;

  const recent = [...sprintSessions].sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0,10);
  html += `<div class="card">
    <h2>Session History</h2>
    ${recent.length===0 ? '<div class="empty">No sessions yet.</div>' : recent.map(s=>{
      const cyclesStr = s.roundsData.map(rd=>`R${rd.round}: ${rd.cycles}`).join(' · ');
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div class="flex-between">
          <div><strong>${s.date}</strong> <span class="badge-week">${s.totalRounds} rounds</span></div>
          <button class="icon-btn" onclick="deleteSprintSession('${s.id}')">🗑</button>
        </div>
        <div style="font-size:13px;color:var(--text-dim);margin-top:4px;">${cyclesStr}</div>
      </div>`;
    }).join('')}
  </div>`;
  return html;
}
function renderSprintActiveHtml(progress){
  const barSegs = [];
  for(let r=1; r<=progress.totalRounds; r++){
    barSegs.push({ type:'sprint' });
    if(r < progress.totalRounds) barSegs.push({ type:'rest' });
  }
  let completedSegs = (progress.currentRound-1) * 2;
  if(progress.phase==='rest' || progress.phase==='finish') completedSegs += 1;
  const segHtml = barSegs.map((seg,i)=>{
    const cls = i < completedSegs ? 'done' : (i===completedSegs ? 'current' : 'upcoming');
    const opacity = cls==='upcoming' ? 0.25 : 1;
    return `<div class="progress-seg sprint-${seg.type} ${cls}" style="opacity:${opacity};"></div>`;
  }).join('');
  const pct = Math.round((completedSegs/barSegs.length)*100);

  let inner = `<div class="progress-track">${segHtml}</div>
    <div class="progress-label"><span class="progress-pct">${pct}%</span> · Round ${progress.currentRound} of ${progress.totalRounds} · <a href="#" onclick="endSprintSessionEarly();return false;" style="color:var(--danger);">end session</a></div>`;

  if(progress.phase === 'ready'){
    inner += `<div class="sprint-phase-banner ready">Ready for Round ${progress.currentRound}?</div>
      <button class="btn" style="width:100%;background:var(--danger);" onclick="beginNextSprintRound()">🚴 Start Sprint — Round ${progress.currentRound}</button>`;
  }else if(progress.phase === 'sprint'){
    inner += `<div class="sprint-phase-banner sprint">🔥 SPRINT! Round ${progress.currentRound} of ${progress.totalRounds}</div>
      <div class="sprint-ring-wrap">
        <div class="sprint-ring">
          <svg width="180" height="180">
            <circle cx="90" cy="90" r="80" style="stroke:var(--border)" stroke-width="14" fill="none"/>
            <circle id="sprintTimerCircle" cx="90" cy="90" r="80" style="stroke:var(--danger)" stroke-width="14" fill="none" stroke-linecap="round"/>
          </svg>
          <div class="time" id="sprintTimerDisplay">01:00</div>
        </div>
        <div class="row" style="max-width:260px;">
          <button class="btn" id="sprintStartBtn" onclick="sprintToggleTimer()">Pause</button>
        </div>
      </div>
      <div class="hint" style="text-align:center;">Go all-out — as many cycles as you can. Log your count once rest starts — the clock won't stop.</div>`;
  }else if(progress.phase === 'rest'){
    const existing = progress.roundsData.find(r=>r.round===progress.currentRound);
    inner += `<div class="sprint-phase-banner rest">😮‍💨 Rest — easy pace</div>
      <div class="sprint-ring-wrap">
        <div class="sprint-ring">
          <svg width="180" height="180">
            <circle cx="90" cy="90" r="80" style="stroke:var(--border)" stroke-width="14" fill="none"/>
            <circle id="sprintTimerCircle" cx="90" cy="90" r="80" style="stroke:var(--blue)" stroke-width="14" fill="none" stroke-linecap="round"/>
          </svg>
          <div class="time" id="sprintTimerDisplay">01:00</div>
        </div>
        <div class="row" style="max-width:260px;">
          <button class="btn secondary" id="sprintStartBtn" onclick="sprintToggleTimer()">Pause</button>
          <button class="btn ghost" onclick="skipSprintRest()">Skip →</button>
        </div>
      </div>
      <label style="text-align:center;">Round ${progress.currentRound} cycles completed</label>
      <input type="number" id="sprintCyclesInput" class="sprint-cycle-input" placeholder="0" value="${existing!=null?existing.cycles:''}" onchange="saveSprintCyclesInline(${progress.currentRound})">
      <div class="hint" style="text-align:center;">Saves automatically as you type — no need to pause. Round ${progress.currentRound+1} starts after this.</div>`;
  }else if(progress.phase === 'finish'){
    const existing = progress.roundsData.find(r=>r.round===progress.currentRound);
    inner += `<div class="sprint-phase-banner ready">Round ${progress.currentRound} sprint done — final round!</div>
      <label style="text-align:center;">How many cycles did you complete?</label>
      <input type="number" id="sprintCyclesInput" class="sprint-cycle-input" placeholder="0" value="${existing!=null?existing.cycles:''}" autofocus>
      <button class="btn" style="width:100%;margin-top:14px;" onclick="submitFinalRoundCycles()">Log &amp; Finish Session</button>`;
  }
  return `<div class="card">${inner}</div>`;
}

/* ---------------- History ---------------- */

function renderHistory(){
  const filterSel = document.getElementById('historyFilter');
  const currentVal = filterSel.value;
  filterSel.innerHTML = '<option value="">All exercises</option>' + exercises.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  filterSel.value = currentVal;

  const filterId = filterSel.value;
  const exerciseItems = logs
    .filter(l=> !filterId || l.exerciseId===filterId)
    .map(l=>({ date:l.date, id:l.id, kind:'exercise', data:l }));
  // Activities (Basketball etc.) aren't tied to any exercise, so only show them when no exercise filter is active.
  const activityItems = filterId ? [] : activityLogs.map(a=>({ date:a.date, id:a.id, kind:'activity', data:a }));
  const list = [...exerciseItems, ...activityItems].sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const box = document.getElementById('historyList');
  if(list.length===0){ box.innerHTML = '<div class="empty">No sessions match.</div>'; return; }

  box.innerHTML = list.map(item=>{
    if(item.kind === 'activity'){
      const a = item.data;
      const wk = weekNumberForDate(a.date);
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div class="flex-between">
          <div style="display:flex;align-items:center;gap:10px;">${iconBadge({category:'activity'},'sm')}<div><strong>${a.label}</strong> <span class="badge-week">Wk ${wk}</span></div></div>
          <div>
            <span style="color:var(--text-dim);font-size:12px;">${a.date}</span>
            <button class="icon-btn" onclick="deleteActivityLog('${a.id}')">🗑</button>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-dim);margin-top:4px;">${a.hours} hr${a.hours!==1?'s':''} active · <span style="color:var(--activity);font-weight:700;">~${fmtCalories(caloriesForActivityLog(a))}</span></div>
        ${a.notes ? `<div style="font-size:12.5px;margin-top:4px;font-style:italic;color:var(--text-dim)">"${a.notes}"</div>` : ''}
      </div>`;
    }
    const l = item.data;
    const ex = exercises.find(e=>e.id===l.exerciseId) || {name:'Deleted exercise', unit:'lb', category:'accessory'};
    const setsStr = l.sets.map(s=> ex.unit==='lb' ? `${s.reps}×${s.weight}lb` : `${s.reps||s.weight}`).join(', ');
    const wk = weekNumberForDate(l.date);
    return `<div style="padding:10px 0;border-bottom:1px solid var(--border);">
      <div class="flex-between">
        <div style="display:flex;align-items:center;gap:10px;">${iconBadge(ex,'sm')}<div><strong>${ex.name}</strong> <span class="badge-week">Wk ${wk}</span></div></div>
        <div>
          <span style="color:var(--text-dim);font-size:12px;">${l.date}</span>
          <button class="icon-btn" onclick="deleteLog('${l.id}')">🗑</button>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-dim);margin-top:4px;">${setsStr} · <span style="color:var(--activity);font-weight:700;">~${fmtCalories(caloriesForExerciseLog(l))}</span></div>
      ${l.notes ? `<div style="font-size:12.5px;margin-top:4px;font-style:italic;color:var(--text-dim)">"${l.notes}"</div>` : ''}
    </div>`;
  }).join('');
}
function deleteLog(id){
  const idx = logs.findIndex(l=>l.id===id); const removed = logs[idx];
  logs = logs.filter(l=>l.id!==id);
  saveAll();
  renderHistory();
  renderDashboard();
  showUndo('Entry deleted', ()=>{ logs.splice(idx, 0, removed); saveAll(); renderHistory(); renderDashboard(); });
}
function deleteActivityLog(id){
  const idx = activityLogs.findIndex(a=>a.id===id); const removed = activityLogs[idx];
  activityLogs = activityLogs.filter(a=>a.id!==id);
  saveAll();
  renderHistory();
  renderDashboard();
  renderCalendar();
  showUndo('Entry deleted', ()=>{ activityLogs.splice(idx, 0, removed); saveAll(); renderHistory(); renderDashboard(); renderCalendar(); });
}

/* ---------------- Calendar (monthly progress) ---------------- */

function calendarPrevMonth(){ calendarViewDate.setMonth(calendarViewDate.getMonth()-1); renderCalendar(); }
function calendarNextMonth(){ calendarViewDate.setMonth(calendarViewDate.getMonth()+1); renderCalendar(); }

function dayColorForId(dayId){
  if(dayId === 'freestyle') return 'var(--warn)';
  const day = WORKOUT_DAYS.find(d=>d.id===dayId);
  if(!day) return 'var(--text-dim)';
  const def = categoryDef(day.category);
  return def ? def.color : 'var(--accent2)';
}

function renderCalendar(){
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  document.getElementById('calendarTitle').textContent = calendarViewDate.toLocaleDateString(undefined,{month:'long', year:'numeric'});
  document.getElementById('calendarDow').innerHTML = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div>${d}</div>`).join('');

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for(let i=0;i<startWeekday;i++) cells.push({ day: daysInPrevMonth - startWeekday + 1 + i, outside:true });
  for(let d=1; d<=daysInMonth; d++) cells.push({ day:d, outside:false, dateStr: `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` });
  let trailing = 1;
  while(cells.length % 7 !== 0) cells.push({ day: trailing++, outside:true });

  const today = todayStr();
  document.getElementById('calendarGrid').innerHTML = cells.map(c=>{
    if(c.outside) return `<div class="cal-cell outside"><div class="cal-date">${c.day}</div></div>`;
    const dayLogs = logs.filter(l=>l.date===c.dateStr);
    const dayIds = [...new Set(dayLogs.map(l=>l.dayId).filter(Boolean))];
    const hasActivity = activityLogs.some(a=>a.date===c.dateStr);
    const dots = [
      ...dayIds.map(id=>`<span class="cal-dot" style="background:${dayColorForId(id)}"></span>`),
      ...(hasActivity ? [`<span class="cal-dot" style="background:var(--activity)"></span>`] : [])
    ];
    if(dots.length===0 && dayLogs.length) dots.push('<span class="cal-dot" style="background:var(--text-dim)"></span>');
    let planCls = '';
    if(coachOn() && dayLogs.length===0 && !hasActivity){
      const st = dateStatus(c.dateStr).status;
      if(st === 'missed') planCls = 'missed';
      else if(st === 'planned' || st === 'today') planCls = 'planned';
    }
    const cls = ['cal-cell', c.dateStr===today?'today':'', c.dateStr===calendarSelectedDate?'selected':'', planCls].filter(Boolean).join(' ');
    return `<div class="${cls}" onclick="selectCalendarDay('${c.dateStr}')">
      <div class="cal-date">${c.day}</div>
      <div class="cal-dots">${dots.join('')}</div>
    </div>`;
  }).join('');

  document.getElementById('calendarLegend').innerHTML =
    WORKOUT_DAYS.map(d=>`<div class="item"><span class="cal-dot" style="background:${dayColorForId(d.id)}"></span>${d.dayLabel} — ${d.title}</div>`).join('') +
    '<div class="item"><span class="cal-dot" style="background:var(--activity)"></span>Activity (Basketball / Sport)</div>' +
    '<div class="item"><span class="cal-dot" style="background:var(--warn)"></span>Freestyle 🎲</div>' +
    '<div class="item"><span class="cal-dot" style="background:var(--text-dim)"></span>Logged (no day tag)</div>' +
    (coachOn() ? '<div class="item"><span style="width:14px;height:10px;border:1px dashed var(--accent-dim);border-radius:3px;display:inline-block;"></span>Planned</div><div class="item"><span style="width:14px;height:10px;border:1px dashed var(--danger);border-radius:3px;display:inline-block;"></span>Missed</div>' : '');

  renderCalendarStats();
  renderCalendarDetail();
}

function renderCalendarStats(){
  const box = document.getElementById('calendarStats');
  if(!box) return;
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const inMonth = dateStr => { const d = new Date(dateStr+'T00:00:00'); return d.getFullYear()===year && d.getMonth()===month; };
  const monthLogs = logs.filter(l=>inMonth(l.date));
  const monthActivity = activityLogs.filter(a=>inMonth(a.date));
  const activeDays = new Set([...monthLogs.map(l=>l.date), ...monthActivity.map(a=>a.date)]).size;
  const vol = monthLogs.reduce((s,l)=> s + l.sets.reduce((ss,st)=> ss + (st.reps*st.weight||0),0), 0);
  const activityHours = monthActivity.reduce((s,a)=> s + (a.hours||0), 0);
  const monthCalories = monthLogs.reduce((s,l)=> s + caloriesForExerciseLog(l), 0) + monthActivity.reduce((s,a)=> s + caloriesForActivityLog(a), 0);
  box.innerHTML = `
    <div class="card"><div class="stat"><div class="num accent">${activeDays}</div><div class="lbl">Active days this month</div></div></div>
    <div class="card"><div class="stat"><div class="num accent2">${monthLogs.length}</div><div class="lbl">Exercises logged</div></div></div>
    <div class="card"><div class="stat"><div class="num warn">${Math.round(vol).toLocaleString()}</div><div class="lbl">Volume this month (lb)</div></div></div>
    <div class="card"><div class="stat"><div class="num" style="color:var(--activity)">${activityHours.toLocaleString()}</div><div class="lbl">Activity hours this month</div></div></div>
    <div class="card"><div class="stat"><div class="num" style="color:var(--activity)">${Math.round(monthCalories).toLocaleString()}</div><div class="lbl">Calories this month</div></div></div>`;
}

function selectCalendarDay(dateStr){
  calendarSelectedDate = (calendarSelectedDate === dateStr) ? null : dateStr;
  renderCalendar();
}

function renderCalendarDetail(){
  const box = document.getElementById('calendarDetail');
  if(!box) return;
  if(!calendarSelectedDate){ box.innerHTML = ''; return; }
  const dayLogs = logs.filter(l=>l.date===calendarSelectedDate);
  const dayActivities = activityLogs.filter(a=>a.date===calendarSelectedDate);
  const taggedDayId = (dayLogs.find(l=>l.dayId) || {}).dayId;
  const day = WORKOUT_DAYS.find(d=>d.id===taggedDayId);
  const niceDate = new Date(calendarSelectedDate+'T00:00:00').toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'});
  let html = `<div class="card"><div class="flex-between"><h2>${niceDate}</h2>${day?`<span class="badge-week">${day.dayLabel} — ${day.title}</span>`:''}</div>`;
  if(dayLogs.length===0 && dayActivities.length===0){
    html += '<div class="empty">Nothing logged this day.</div>';
  }else{
    const dayTotalCals = dayLogs.reduce((s,l)=> s + caloriesForExerciseLog(l), 0) + dayActivities.reduce((s,a)=> s + caloriesForActivityLog(a), 0);
    html += dayLogs.map(l=>{
      const ex = exercises.find(e=>e.id===l.exerciseId) || {name:'Unknown', unit:'lb', category:'accessory'};
      const setsStr = l.sets.map(s=> ex.unit==='lb' ? `${s.reps}×${s.weight}lb` : `${s.reps||s.weight}`).join(', ');
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">${iconBadge(ex,'sm')}<div><strong>${ex.name}</strong><div style="color:var(--text-dim);">${setsStr} · <span style="color:var(--activity);font-weight:700;">~${fmtCalories(caloriesForExerciseLog(l))}</span></div></div></div>`;
    }).join('');
    html += dayActivities.map(a=>{
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">${iconBadge({category:'activity'},'sm')}<div><strong>${a.label}</strong><div style="color:var(--text-dim);">${a.hours} hr${a.hours!==1?'s':''} active · <span style="color:var(--activity);font-weight:700;">~${fmtCalories(caloriesForActivityLog(a))}</span>${a.notes?' · "'+a.notes+'"':''}</div></div></div>`;
    }).join('');
    html += `<div class="presc" style="margin-top:10px;">Estimated total: ~${fmtCalories(dayTotalCals)} burned</div>`;
  }
  html += '</div>';
  box.innerHTML = html;
}

/* ---------------- Progress / Charts ---------------- */

function allWeeksWithData(){
  const wk = currentWeekNumber();
  const weeksFromLogs = logs.map(l=>weekNumberForDate(l.date));
  const maxWeek = Math.max(wk, ...(weeksFromLogs.length?weeksFromLogs:[wk]));
  const weeks = [];
  for(let w=1; w<=maxWeek; w++) weeks.push(w);
  return weeks;
}

function renderProgress(){
  renderProgressExtras();
  const sel = document.getElementById('progressExerciseSelect');
  if(!sel){ renderProgressVolume(); return; } // old per-week chart removed in favor of the Strength trend card
  const currentVal = sel.value;
  sel.innerHTML = exercises.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  sel.value = currentVal || selectedExerciseId || (exercises[0] && exercises[0].id) || '';
  const exId = sel.value;
  const ex = exercises.find(e=>e.id===exId);
  const weeks = allWeeksWithData();

  // Line chart: target vs actual max weight, per week
  const chartBox = document.getElementById('progressChart');
  if(!ex){ chartBox.innerHTML='<div class="empty">Add an exercise first.</div>'; }
  else{
    const w = 640, h = 220, padL=40, padR=10, padT=10, padB=26;
    const points = weeks.map(week=>{
      const target = targetForExerciseAtWeek(ex, week);
      const weekLogs = logs.filter(l=>l.exerciseId===ex.id && weekNumberForDate(l.date)===week);
      const actual = weekLogs.length ? Math.max(...weekLogs.flatMap(l=>l.sets.map(s=>s.weight||0))) : null;
      return { week, target, actual };
    });
    const maxVal = Math.max(ex.baseline*1.2, ...points.map(p=>Math.max(p.target, p.actual||0)));
    const minVal = 0;
    const xFor = i => padL + (i/(Math.max(points.length-1,1))) * (w-padL-padR);
    const yFor = v => (h-padB) - ((v-minVal)/(maxVal-minVal||1)) * (h-padT-padB);

    const targetPath = points.map((p,i)=> (i===0?'M':'L') + xFor(i).toFixed(1) + ',' + yFor(p.target).toFixed(1)).join(' ');
    const actualPts = points.filter(p=>p.actual!==null);
    const actualPath = actualPts.map((p,i)=>{
      const idx = points.indexOf(p);
      return (i===0?'M':'L') + xFor(idx).toFixed(1) + ',' + yFor(p.actual).toFixed(1);
    }).join(' ');

    const gridLines = 4;
    let gridSvg = '';
    for(let g=0; g<=gridLines; g++){
      const val = maxVal * g/gridLines;
      const y = yFor(val);
      gridSvg += `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" style="stroke:var(--border)" stroke-width="1"/>`;
      gridSvg += `<text x="4" y="${y+4}" font-size="10" style="fill:var(--text-dim)">${Math.round(val)}</text>`;
    }
    const xLabels = points.map((p,i)=> `<text x="${xFor(i)}" y="${h-6}" font-size="10" style="fill:var(--text-dim)" text-anchor="middle">W${p.week}</text>`).join('');
    const actualDots = actualPts.map(p=>{
      const idx = points.indexOf(p);
      return `<circle cx="${xFor(idx)}" cy="${yFor(p.actual)}" r="4" style="fill:var(--accent2)"/>`;
    }).join('');

    chartBox.innerHTML = `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:100%;">
        ${gridSvg}
        <path d="${targetPath}" fill="none" style="stroke:var(--accent)" stroke-width="2" stroke-dasharray="5,4"/>
        <path d="${actualPath}" fill="none" style="stroke:var(--accent2)" stroke-width="2.5"/>
        ${actualDots}
        ${xLabels}
      </svg>
      <div style="display:flex;gap:16px;font-size:12px;color:var(--text-dim);margin-top:6px;">
        <div><span style="color:var(--accent);">■</span> Target (progressive overload)</div>
        <div><span style="color:var(--accent2);">■</span> Actual best logged</div>
      </div>`;
  }

  renderProgressVolume();
}
function renderProgressVolume(){
  const weeks = allWeeksWithData();
  // Bar chart: weekly total volume across all exercises
  const volBox = document.getElementById('volumeChart');
  const volByWeek = weeks.map(week=>{
    const weekLogs = logs.filter(l=>weekNumberForDate(l.date)===week);
    const vol = weekLogs.reduce((s,l)=> s + l.sets.reduce((ss,st)=> ss + (st.reps*st.weight||0),0), 0);
    return { week, vol };
  });
  const maxVol = Math.max(1, ...volByWeek.map(v=>v.vol));
  volBox.innerHTML = volByWeek.map(v=>{
    const pct = Math.max(2, (v.vol/maxVol)*100);
    return `<div class="bar-col"><div class="bar" style="height:${pct}%;" title="${Math.round(v.vol)} lb"></div><div class="bar-lbl">W${v.week}</div></div>`;
  }).join('') || '<div class="empty">No data yet.</div>';

  // Weekly breakdown table
  const tbody = document.querySelector('#weeklyTable tbody');
  tbody.innerHTML = weeks.slice().reverse().map(week=>{
    const weekLogs = logs.filter(l=>weekNumberForDate(l.date)===week);
    const weekActivity = activityLogs.filter(a=>weekNumberForDate(a.date)===week);
    if(weekLogs.length===0 && weekActivity.length===0 && week!==currentWeekNumber()) return '';
    const exIds = new Set(weekLogs.map(l=>l.exerciseId));
    const vol = weekLogs.reduce((s,l)=> s + l.sets.reduce((ss,st)=> ss + (st.reps*st.weight||0),0), 0);
    const cals = weekLogs.reduce((s,l)=> s + caloriesForExerciseLog(l), 0) + weekActivity.reduce((s,a)=> s + caloriesForActivityLog(a), 0);
    let topSetStr = '—';
    let topWeight = -1;
    weekLogs.forEach(l=>{
      const exx = exercises.find(e=>e.id===l.exerciseId);
      l.sets.forEach(s=>{
        if(s.weight>topWeight){ topWeight=s.weight; topSetStr = `${exx?exx.name:'?'} ${s.reps}×${s.weight}`; }
      });
    });
    return `<tr><td><span class="badge-week">Week ${week}</span></td><td>${weekLogs.length}</td><td>${exIds.size}</td><td>${Math.round(vol).toLocaleString()} lb</td><td>${Math.round(cals).toLocaleString()}</td><td style="font-size:12px;">${topSetStr}</td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">No data yet.</td></tr>';
}

