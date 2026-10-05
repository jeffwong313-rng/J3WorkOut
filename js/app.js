/* J3 WorkOut — js/app.js
   Navigation, Home dashboard, guided Workout Plan wizard, activity days, Log Workout.
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Navigation ---------------- */

// Every nav button that points at a page has data-view; group buttons just open their menu.
document.querySelectorAll('#mainNav [data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=> switchView(btn.dataset.view));
});
function closeNavGroups(){
  document.querySelectorAll('#mainNav .nav-group.open').forEach(g=>g.classList.remove('open'));
  const scrim = document.getElementById('navScrim'); if(scrim) scrim.classList.remove('show');
}
function toggleNavGroup(id){
  const g = document.querySelector(`#mainNav .nav-group[data-group="${id}"]`);
  const opening = !g.classList.contains('open');
  closeNavGroups();
  if(opening){ g.classList.add('open'); document.getElementById('navScrim').classList.add('show'); }
}
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeNavGroups(); });
function updateNavState(name){
  document.querySelectorAll('#mainNav .nav-group').forEach(g=>{
    const item = g.querySelector(`[data-view="${name}"]`);
    const top = g.querySelector('.nav-top');
    top.classList.toggle('active', !!item);
    const lbl = top.querySelector('.nav-sub-lbl');
    if(g.dataset.group !== 'home' && lbl) lbl.textContent = item ? item.querySelector('strong').textContent : '';
  });
  document.querySelectorAll('#mainNav .nav-item').forEach(b=> b.classList.toggle('active', b.dataset.view === name));
}

function switchView(name){
  hideTip(); // a tip belongs to the screen it appeared on
  closeNavGroups();
  updateNavState(name);
  setTimeout(refreshWakeLock, 0);
  window.scrollTo(0, 0);
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+name));
  if(name === 'dashboard') renderDashboard();
  if(name === 'coach') renderCoach();
  if(name === 'freestyle') renderFreestyle();
  if(name === 'vacation') renderVacation();
  if(name === 'plan') renderPlanView();
  if(name === 'log') renderLogView();
  if(name === 'warmup') renderWarmupTab();
  if(name === 'sprints') renderSprintsTab();
  if(name === 'history') renderHistory();
  if(name === 'calendar') renderCalendar();
  if(name === 'progress') renderProgress();
  if(name === 'settings') renderSettings();
}

/* ---------------- Dashboard ---------------- */

function renderDashboard(){
  document.getElementById('headerWeek').textContent = 'Week ' + currentWeekNumber();
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',timeZone:APP_TIMEZONE}) + ' PT';

  renderCoachWeekCard();
  renderTodayFocusCard();
  document.getElementById('statTotalSessions').textContent = logs.length;

  const wk = currentWeekNumber();
  const weekLogs = logs.filter(l => weekNumberForDate(l.date) === wk);
  const totalVolume = weekLogs.reduce((sum,l)=> sum + l.sets.reduce((s,set)=> s + (set.reps*set.weight||0), 0), 0);
  document.getElementById('statWeekVolume').textContent = Math.round(totalVolume).toLocaleString();

  const weekActivity = activityLogs.filter(a => weekNumberForDate(a.date) === wk);
  const weekCalories = weekLogs.reduce((s,l)=> s + caloriesForExerciseLog(l), 0) + weekActivity.reduce((s,a)=> s + caloriesForActivityLog(a), 0);
  document.getElementById('statWeekCalories').textContent = Math.round(weekCalories).toLocaleString();

  const climbIn = weeksUntilNextClimb();
  const climbLbl = document.getElementById('statNextClimb').nextElementSibling;
  if(coachOn()){
    const ci = todayCheckin();
    document.getElementById('statNextClimb').textContent = ci ? ci.readiness + '/5' : '—';
    climbLbl.textContent = ci ? 'Readiness today · ' + READINESS_INFO[ci.readiness].label : 'Readiness (check in to set)';
  } else {
    document.getElementById('statNextClimb').textContent = climbIn === 0 ? 'This week!' : ('in ' + climbIn + ' wk' + (climbIn>1?'s':''));
    climbLbl.textContent = 'Next overload climb';
  }
  document.getElementById('statStreak').textContent = currentStreak();


  const recentBox = document.getElementById('recentActivity');
  const recentItems = [
    ...logs.map(l=>({ date:l.date, id:l.id, kind:'exercise', data:l })),
    ...activityLogs.map(a=>({ date:a.date, id:a.id, kind:'activity', data:a }))
  ].sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0,6);
  if(recentItems.length===0){
    recentBox.innerHTML = '<div class="empty">No workouts logged yet — head to Train → Log a Workout (or Today’s Workout) to get started.</div>';
  }else{
    recentBox.innerHTML = recentItems.map(item=>{
      if(item.kind === 'activity'){
        const a = item.data;
        return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <div style="display:flex;align-items:center;gap:10px;">${iconBadge({category:'activity'},'sm')}<div><strong>${a.label}</strong> <span style="color:var(--text-dim)">— ${a.hours} hr${a.hours!==1?'s':''} · ~${fmtCalories(caloriesForActivityLog(a))}</span></div></div>
          <div style="color:var(--text-dim)">${a.date}</div>
        </div>`;
      }
      const l = item.data;
      const ex = exercises.find(e=>e.id===l.exerciseId) || {name:'Unknown', unit:'lb', category:'accessory'};
      const topSet = l.sets.reduce((m,s)=> s.weight>m.weight? s : m, l.sets[0]||{reps:0,weight:0});
      return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <div style="display:flex;align-items:center;gap:10px;">${iconBadge(ex,'sm')}<div><strong>${ex.name}</strong> <span style="color:var(--text-dim)">— ${l.sets.length} sets · ~${fmtCalories(caloriesForExerciseLog(l))}</span></div></div>
        <div style="color:var(--text-dim)">${topSet.reps}×${fmtWeight(ex, topSet.weight)} · ${l.date}</div>
      </div>`;
    }).join('');
  }
}

function renderTodayFocusCard(){
  const box = document.getElementById('todayFocusCard');
  if(!box) return;
  const plan = loadTodayPlan();
  const meta = currentPlanMeta(plan);
  // Coach mode: the "this week" card above already covers today's scheduled session.
  const coveredByCoach = coachOn() && (!meta || (plan.kind==='lift' && scheduledDayFor(todayStr()) && plan.dayId === scheduledDayFor(todayStr()).id));
  box.style.display = coveredByCoach ? 'none' : '';
  if(coveredByCoach) return;
  if(meta){
    const done = planIsComplete(plan);
    let statusText;
    if(plan.kind === 'activity'){
      statusText = done ? '<span style="color:var(--accent);font-weight:700;">Complete ✓</span>' : 'Not logged yet';
    }else{
      const day = WORKOUT_DAYS.find(d=>d.id===plan.dayId);
      const steps = buildSteps(day);
      statusText = done ? '<span style="color:var(--accent);font-weight:700;">Complete ✓</span>' : 'Step '+(plan.stepIndex+1)+' of '+steps.length;
    }
    box.innerHTML = `<div class="flex-between" style="flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${iconBadge({category:meta.category})}
        <div>
          <h2 style="margin-bottom:2px;">Today: ${meta.title}</h2>
          <div class="hint" style="margin-bottom:0;">${meta.subtitle} · ${statusText}</div>
        </div>
      </div>
      <button class="btn secondary" onclick="switchView('plan')">${done ? 'View' : 'Continue'}</button>
    </div>`;
  }else{
    box.innerHTML = `<h2>What are you doing today?</h2>
      <div class="hint">Pick your split day, or log an activity like Basketball, to get started.</div>
      <div class="row" style="flex-wrap:wrap;gap:8px;">
        ${WORKOUT_DAYS.map(d=>`<button class="btn secondary" style="flex:1 1 140px;" onclick="selectPlanDay('${d.id}'); switchView('plan');">${d.dayLabel} — ${d.title}</button>`).join('')}
        ${ACTIVITY_TYPES.map(a=>`<button class="btn secondary" style="flex:1 1 140px;" onclick="selectActivityDay('${a.id}'); switchView('plan');">${a.title}</button>`).join('')}
        <button class="btn secondary" style="flex:1 1 140px;" onclick="switchView('freestyle')">🎲 Freestyle</button>
        <button class="btn secondary" style="flex:1 1 140px;" onclick="switchView('vacation')">🌴 Vacation Circuit</button>
      </div>`;
  }
}

/* ---------------- Workout Plan (guided daily split) ---------------- */

function loadTodayPlan(){
  const raw = loadJSON(LS_KEYS.todayPlan, null);
  if(raw && raw.date === todayStr()) return raw;
  return null;
}
function saveTodayPlan(patch){
  const current = loadTodayPlan() || { date: todayStr(), kind:null, dayId:null, activityId:null, activityLogId:null, stepIndex:0, sessionLogIds:[] };
  const next = Object.assign(current, patch, { date: todayStr() });
  save(LS_KEYS.todayPlan, next);
  return next;
}
function buildSteps(day){
  const steps = [{ type:'warmup', data: day.warmup }];
  day.lifts.forEach(exId => steps.push({ type:'exercise', exerciseId: exId }));
  if(day.finisher) steps.push({ type:'finisher', data: day.finisher });
  if(day.cardio) steps.push({ type:'cardio', data: day.cardio });
  steps.push({ type:'complete' });
  return steps;
}
// Each step in the progress bar gets its own color — exercises use their category
// color (so the bar visibly changes as you move between different kinds of work),
// warm-up/finisher/cardio get a neutral tone.
function stepColor(step){
  if(step.type === 'exercise'){
    const ex = exercises.find(e=>e.id===step.exerciseId);
    const def = ex && categoryDef(ex.category);
    return def ? def.color : 'var(--accent)';
  }
  if(step.type === 'finisher' || step.type === 'cardio') return 'var(--activity)';
  return 'var(--text-dim)';
}

// Has the user made any progress on today's selection (so switching away should confirm)?
function planHasProgress(plan){ return !!plan && (plan.stepIndex > 0 || !!plan.activityLogId); }
function planIsSame(plan, kind, id){ return !!plan && plan.kind === kind && (kind === 'lift' ? plan.dayId === id : plan.activityId === id); }
function planIsComplete(plan){
  if(!plan) return false;
  if(plan.kind === 'activity') return !!plan.activityLogId;
  if(plan.kind === 'lift'){
    const day = WORKOUT_DAYS.find(d=>d.id===plan.dayId);
    if(!day) return false;
    return plan.stepIndex >= buildSteps(day).length - 1;
  }
  return false;
}
// Common {title, subtitle, category} shape for whatever is selected today — lift day or activity.
function currentPlanMeta(plan){
  if(!plan) return null;
  if(plan.kind === 'activity'){
    const a = ACTIVITY_TYPES.find(x=>x.id===plan.activityId);
    if(!a) return null;
    const label = (plan.activityLogId && activityLogs.find(l=>l.id===plan.activityLogId)) ? activityLogs.find(l=>l.id===plan.activityLogId).label : a.title;
    return { title: label, subtitle: a.subtitle, category: 'activity' };
  }
  if(plan.kind === 'lift'){
    const d = WORKOUT_DAYS.find(x=>x.id===plan.dayId);
    if(!d) return null;
    return { title: `${d.dayLabel} — ${d.title}`, subtitle: d.subtitle, category: d.category };
  }
  return null;
}

function offerPlanUndo(prev, msg){
  if(!planHasProgress(prev)) return;
  const snapshot = JSON.parse(JSON.stringify(prev));
  showUndo(msg, ()=>{ save(LS_KEYS.todayPlan, snapshot); planPickerExpanded = false; renderPlanView(); renderDashboard(); });
}
function selectPlanDay(dayId){
  const existing = loadTodayPlan();
  if(planHasProgress(existing) && !planIsSame(existing, 'lift', dayId)) offerPlanUndo(existing, 'Switched day — progress reset');
  saveTodayPlan({ kind:'lift', dayId, activityId:null, activityLogId:null, stepIndex:0, sessionLogIds:[] });
  planPickerExpanded = false; // the guided workout becomes the main screen once a day is picked
  renderPlanView();
  renderDashboard();
}
function selectActivityDay(activityId){
  const existing = loadTodayPlan();
  if(planHasProgress(existing) && !planIsSame(existing, 'activity', activityId)) offerPlanUndo(existing, 'Switched day — progress reset');
  saveTodayPlan({ kind:'activity', activityId, dayId:null, stepIndex:0, sessionLogIds:[], activityLogId:null });
  planPickerExpanded = false;
  renderPlanView();
  renderDashboard();
}
function changePlanDay(){
  offerPlanUndo(loadTodayPlan(), 'Day cleared — progress reset');
  saveTodayPlan({ kind:null, dayId:null, activityId:null, activityLogId:null, stepIndex:0, sessionLogIds:[] });
  planPickerExpanded = true;
  renderPlanView();
  renderDashboard();
}
function expandDayPicker(){ planPickerExpanded = true; renderPlanView(); }
function collapseDayPicker(){ planPickerExpanded = false; renderPlanView(); }
function planAdvance(){
  const plan = loadTodayPlan();
  if(!plan) return;
  saveTodayPlan({ stepIndex: plan.stepIndex + 1 });
  renderPlanView();
  renderDashboard();
}
function planBack(){
  const plan = loadTodayPlan();
  if(!plan) return;
  saveTodayPlan({ stepIndex: Math.max(0, plan.stepIndex - 1) });
  renderPlanView();
}

function renderPlanView(){
  const pickerCard = document.getElementById('dayPickerCard');
  if(!pickerCard) return;
  const plan = loadTodayPlan();
  const hasDay = !!(plan && (plan.dayId || plan.activityId));
  if(!hasDay) planPickerExpanded = true; // nothing to collapse to until something is chosen

  if(planPickerExpanded){
    pickerCard.innerHTML = `<div class="card" style="margin-bottom:16px;">
      <div class="flex-between">
        <div>
          <h2>Pick Today's Workout</h2>
          <div class="hint" style="margin-bottom:0;">Choose your split day, or log another activity like Basketball — you'll be walked through it one step at a time.</div>
        </div>
        ${hasDay ? '<button class="btn ghost" onclick="collapseDayPicker()" style="flex:0 0 auto;">Collapse ▴</button>' : ''}
      </div>
      <div class="hint" style="margin-top:14px;margin-bottom:6px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.03em;font-size:11px;">Strength Split</div>
      <div class="grid cols-2" id="dayPicker"></div>
      <div class="hint" style="margin-top:18px;margin-bottom:6px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.03em;font-size:11px;">Other Activity</div>
      <div class="grid cols-2" id="activityPicker"></div>
    </div>`;
    const schedToday = coachOn() ? scheduledDayFor(todayStr()) : null;
    document.getElementById('dayPicker').innerHTML = WORKOUT_DAYS.map(d=>{
      const selected = plan && plan.kind==='lift' && plan.dayId === d.id;
      const isSched = schedToday && schedToday.id === d.id;
      return `<div class="day-card${selected?' selected':''}" onclick="selectPlanDay('${d.id}')">${isSched && !selected ? '<div class="day-badge" style="margin:0;">📅 On your schedule today</div>' : ''}
        <div class="day-top">${iconBadge({category:d.category})}<div><div class="day-title">${d.dayLabel} — ${d.title}</div><div class="day-sub">${d.subtitle}</div></div></div>
        <div class="day-meta">${d.duration}${d.badge?' · '+d.badge:''}</div>
        ${selected ? '<div class="day-badge">Selected for today</div>' : ''}
      </div>`;
    }).join('');
    document.getElementById('activityPicker').innerHTML = ACTIVITY_TYPES.map(a=>{
      const selected = plan && plan.kind==='activity' && plan.activityId === a.id;
      return `<div class="day-card${selected?' selected':''}" onclick="selectActivityDay('${a.id}')">
        <div class="day-top">${iconBadge({category:'activity'})}<div><div class="day-title">${a.title}</div><div class="day-sub">${a.subtitle}</div></div></div>
        ${selected ? '<div class="day-badge">Selected for today</div>' : ''}
      </div>`;
    }).join('');
  } else {
    const meta = currentPlanMeta(plan);
    pickerCard.innerHTML = `<div class="card" style="margin-bottom:16px;padding:14px 18px;">
      <div class="flex-between">
        <div style="display:flex;align-items:center;gap:10px;">
          ${iconBadge({category:meta.category},'sm')}
          <div><strong>${meta.title}</strong> <span style="color:var(--text-dim);font-size:12px;">· ${meta.subtitle}</span></div>
        </div>
        <button class="btn ghost" onclick="expandDayPicker()" style="flex:0 0 auto;">Switch day ▾</button>
      </div>
    </div>`;
  }

  const detail = document.getElementById('planDetail');
  if(!detail) return;
  if(!plan || (!plan.dayId && !plan.activityId)){
    detail.innerHTML = '<div class="card"><div class="empty">Pick a day above to start today\'s guided workout.</div></div>';
    return;
  }
  if(plan.kind === 'activity'){
    renderActivityDetail(plan);
    return;
  }
  const day = WORKOUT_DAYS.find(d=>d.id===plan.dayId);
  if(!day){
    // The day was deleted or renamed away in Settings mid-session — reset gracefully.
    saveTodayPlan({ kind:null, dayId:null, activityId:null, activityLogId:null, stepIndex:0, sessionLogIds:[] });
    detail.innerHTML = '<div class="card"><div class="empty">That day no longer exists — pick another above.</div></div>';
    return;
  }
  // Coach mode: a quick readiness check-in before the first step sets today's weights.
  if(coachOn() && !todayCheckin() && plan.stepIndex === 0){
    detail.innerHTML = `<div class="card">${renderCheckinHtml(day)}</div>`;
    hideTip();
    return;
  }
  const steps = buildSteps(day);
  const idx = Math.min(plan.stepIndex, steps.length-1);
  const step = steps[idx];
  const barSteps = steps.filter(s=>s.type!=='complete'); // the "complete" screen isn't its own segment
  const pct = Math.round((Math.min(idx, barSteps.length) / barSteps.length) * 100);

  const segmentsHtml = barSteps.map((s,i)=>{
    const cls = i < idx ? 'done' : (i === idx ? 'current' : 'upcoming');
    const opacity = cls === 'upcoming' ? 0.25 : 1;
    return `<div class="progress-seg ${cls}" style="background:${stepColor(s)};opacity:${opacity};" title="Step ${i+1}"></div>`;
  }).join('');

  let inner = `<div class="progress-track">${segmentsHtml}</div>
    <div class="progress-label"><span class="progress-pct">${pct}%</span> · Step ${idx+1} of ${steps.length} · ${day.dayLabel} — ${day.title} · <a href="#" onclick="changePlanDay();return false;" style="color:var(--accent);">change day</a></div>`;

  if(step.type === 'warmup'){
    const ci = todayCheckin();
    const rinfo = ci ? READINESS_INFO[ci.readiness] : null;
    const readiness = todayReadiness();
    const briefRows = day.lifts.map(id=>{
      const si = stepExercise(plan, day, { exerciseId:id }); const ex = si.ex, rx = si.rx; if(!ex) return '';
      const orig = exercises.find(e=>e.id===id);
      if(si.skipped) return `<div class="bl-row"><span style="text-decoration:line-through;color:var(--text-dim)">${orig ? orig.name : id}</span><span style="color:var(--warn)">🛌 skipped — ${si.reason||'recovering'}</span></div>`;
      const sg = suggestFor(ex, rx, readiness);
      return `<div class="bl-row"><span>${rx.emphasis?'<span style="color:var(--warn)">★</span> ':''}${si.swapped ? `🩹 ${ex.name} <span style="color:var(--text-dim);font-size:11.5px;">(instead of ${orig?orig.name:id})</span>` : ex.name}</span><span>${sg.sets} × ${rxRepsText(ex, rx)} @ ${fmtWeight(ex, sg.weight)} · rest ${fmtRest(rx.rest)}</span></div>`;
    }).join('');
    const flags = todayFlags();
    const flagTxt = Object.entries(flags).map(([g,l])=> (l==='rest'?'🚫 ':'😣 ') + (recoveryGroup(g)?recoveryGroup(g).label.toLowerCase():g)).join(', ');
    inner += `${rinfo ? `<div class="coach-why" style="margin-top:0;margin-bottom:14px;border-left-color:${rinfo.color}"><strong style="color:${rinfo.color}">Readiness ${ci.readiness}/5 — ${rinfo.label}.</strong> ${rinfo.msg}</div>` : ''}
      <h2>Warm-up</h2>
      <div class="hint">${step.data.duration} — ${step.data.description}</div>
      <h2 style="margin-top:16px;">Today's plan <span style="color:var(--text-dim);font-weight:600;font-size:12px;">${day.duration||''}</span></h2>
      <div class="hint" style="margin-bottom:0;">Quick look so you can grab what you need and not waste time between exercises.</div>
      ${flagTxt ? `<div class="coach-why warn" style="margin-top:10px;">🩹 Protecting: <strong>${flagTxt}</strong>. Exercises that would load these as a main or helper muscle were swapped or skipped. <a href="#" onclick="redoCheckin();return false;" style="color:var(--accent);">Redo check-in</a></div>` : (ci ? `<div class="hint" style="margin-top:6px;"><a href="#" onclick="redoCheckin();return false;" style="color:var(--accent);">Something sore? Redo check-in</a></div>` : '')}
      <div class="brief-list">${briefRows}</div>
      ${effortGuideHtml()}
      <div class="wizard-actions">
        <button class="btn" onclick="planAdvance()">Warm-up done →</button>
      </div>`;
  } else if(step.type === 'exercise' && stepExercise(plan, day, step).skipped){
    const si = stepExercise(plan, day, step); const orig = exercises.find(e=>e.id===si.origId);
    inner += `<h2>🛌 Skipping ${orig ? orig.name : 'this exercise'} today</h2>
      <div class="coach-why warn">It loads your <strong>${si.reason || 'recovering muscles'}</strong>, and there's no similar exercise that avoids it with your equipment. Resting it today means it comes back stronger.</div>
      <div class="wizard-actions">
        <button class="btn ghost" onclick="planBack()">← Back</button>
        <button class="btn secondary" onclick="undoRecoverySwap('${si.origId}')">Do it anyway (light)</button>
        <button class="btn" onclick="planAdvance()">Next →</button>
      </div>`;
  } else if(step.type === 'exercise'){
    const si = stepExercise(plan, day, step);
    const ex = si.ex;
    if(!ex){ inner += '<div class="empty">Exercise missing — skipping.</div>'; planAdvance(); return; }
    const rx = si.rx;
    const swapOrig = si.swapped ? exercises.find(e=>e.id===si.origId) : null;
    const liveConflict = exConflict(ex);
    const sug = suggestFor(ex, rx, todayReadiness());
    const [repLo, repHi] = repRange(rx.reps);
    // Auto-set the rest timer to this exercise's prescribed rest (once per step, never mid-countdown).
    const timerKey = plan.date + '|' + day.id + '|' + idx;
    if(lastTimerStepKey !== timerKey && !timerRunning){ timerTotal = rx.rest; timerRemaining = rx.rest; lastTimerStepKey = timerKey; }
    const wwLabel = ex.unit==='lb' ? 'My working weight (lb)' : (ex.unit==='reps' ? 'My usual reps per set' : 'My usual hold (sec)');
    inner += `<div class="flex-between" style="gap:10px;flex-wrap:wrap;"><div style="display:flex;align-items:center;gap:12px;">${iconBadge(ex)}<div><h2 style="margin-bottom:2px;">${rx.emphasis?'<span style="color:var(--warn)">★</span> ':''}${ex.name}</h2><div class="hint" style="margin-bottom:0;">${categoryLabel(ex.category)}${rx.emphasis?' · priority muscle':''}</div></div></div>
      <button class="btn ghost" style="flex:0 0 auto;" onclick="swapCurrentExercise()" title="Machine taken or don't like it? Swap for a similar exercise.">⇄ Swap</button></div>
      ${swapOrig ? `<div class="coach-why warn">🩹 Swapped in for <strong>${swapOrig.name}</strong> today, which loads your ${si.reason}. This one trains the same area while sparing it. <a href="#" onclick="undoRecoverySwap('${si.origId}');return false;" style="color:var(--accent);">Use ${swapOrig.name} anyway</a></div>` : ''}
      ${!swapOrig && liveConflict.hits.length ? `<div class="coach-why warn">⚠️ Heads up: this uses your ${liveConflict.hits.map(h=>`${h.level==='rest'?'resting':'sore'} ${h.label} (${h.role})`).join(', ')}. Go light and stop if anything hurts.</div>` : ''}
      <div class="wizard-top-row">
        ${movementPreviewHtml(ex)}
        <div class="rest-timer-box">
          <div class="hdr">Rest Timer — between sets</div>
          <div class="timer-wrap">
            <div class="timer-left">
              <div class="presets">
                <button class="btn secondary" onclick="setTimerPreset(30)">30s</button>
                <button class="btn secondary" onclick="setTimerPreset(60)">60s</button>
                <button class="btn secondary" onclick="setTimerPreset(90)">90s</button>
                <button class="btn secondary" onclick="setTimerPreset(120)">120s</button>
                <button class="btn secondary" onclick="setTimerPreset(180)">180s</button>
              </div>
              <div class="row">
                <input type="number" id="customTimerInput" placeholder="Custom s">
                <button class="btn ghost" onclick="setTimerCustom()">Set</button>
              </div>
            </div>
            <div class="timer-right">
              <div class="timer-ring">
                <svg width="60" height="60">
                  <circle cx="30" cy="30" r="24" stroke="#2a2f3d" stroke-width="5" fill="none"/>
                  <circle id="timerCircle" cx="30" cy="30" r="24" stroke="#3ddc97" stroke-width="5" fill="none"
                    stroke-linecap="round" stroke-dasharray="151" stroke-dashoffset="0"/>
                </svg>
                <div class="time" id="timerDisplay">01:00</div>
              </div>
              <div class="row">
                <button class="btn" id="timerStartBtn" onclick="toggleTimer()">Start</button>
                <button class="btn secondary" onclick="resetTimer()">Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="sugg-box">
        <div class="sugg-main">Today: <strong>${sug.sets} × ${rxRepsText(ex, rx)}</strong> @ <strong>${fmtWeight(ex, sug.weight)}</strong> · rest <strong>${fmtRest(rx.rest)}</strong></div>
        <div class="sugg-why">${sug.reasons.join(' ')}</div>
        <div class="row ww-row"><span>${wwLabel}</span><input type="number" step="any" id="wizardWorking" value="${ex.workingWeight!=null?ex.workingWeight:''}" placeholder="${workingWeight(ex)}"><button class="btn ghost" onclick="setWorkingWeightFromWizard('${ex.id}')">Update</button></div>
      </div>
      ${coachingHtml(ex)}
      <details class="coach-box"><summary>💪 Muscles worked</summary>${muscleRolesHtml(ex)}</details>
      <div class="hint" style="margin-bottom:8px;">Log what you <strong>actually</strong> did.${ex.unit==='lb' && !ex.repsAreTime ? ` Hit <strong>${repHi} reps on every set</strong> with good form and you've earned a weight increase.` : ''} Rest timer is set to ${fmtRest(rx.rest)}.</div>
      ${lastTimeHtml(ex)}
      <div id="wizardSetsContainer"></div>
      <button class="btn secondary" onclick="addWizardSetRow()" style="width:100%;margin-top:6px;">+ Add Set</button>
      <label>How did that exercise feel?</label>
      <div class="seg-row" id="feelRow">
        <button class="seg-btn${wizardFeel==='easy'?' active':''}" data-v="easy" onclick="setWizardFeel('easy')"><span class="seg-emoji">😎</span>Too easy</button>
        <button class="seg-btn${wizardFeel==='right'?' active':''}" data-v="right" onclick="setWizardFeel('right')"><span class="seg-emoji">👌</span>Just right</button>
        <button class="seg-btn${wizardFeel==='hard'?' active':''}" data-v="hard" onclick="setWizardFeel('hard')"><span class="seg-emoji">🥵</span>Too hard</button>
      </div>
      <div class="hint" style="margin-top:6px;">Too easy = you could've done 4+ more reps. Too hard = you missed reps or form broke down.</div>
      <label class="check-row"><input type="checkbox" id="wizardSaveDefault"> Save these numbers as my new default for this exercise</label>
      <div class="wizard-actions">
        <button class="btn ghost" onclick="planBack()">← Back</button>
        <button class="btn ghost" onclick="wizardSkipExercise()">Couldn't finish — skip</button>
        <button class="btn" data-save-btn onclick="wizardSaveExercise()">Save &amp; Next →</button>
      </div>`;
  } else if(step.type === 'finisher' || step.type === 'cardio'){
    inner += `<h2>${step.data.title} <span style="color:var(--text-dim);font-weight:600;font-size:12px;">(${step.data.duration})</span></h2>
      <div class="hint">${step.data.description}</div>
      <div class="wizard-actions">
        <button class="btn ghost" onclick="planBack()">← Back</button>
        <button class="btn" onclick="planAdvance()">Done →</button>
      </div>`;
  } else if(step.type === 'complete'){
    const sessionLogs = (plan.sessionLogIds||[]).map(id=>logs.find(l=>l.id===id)).filter(Boolean);
    const totalCals = sessionLogs.reduce((s,l)=> s + caloriesForExerciseLog(l), 0);
    inner += `<h2>Workout complete 🎉</h2>
      <div class="hint">Nice work finishing ${day.dayLabel} — ${day.title}. Here's what you logged today:</div>`;
    if(sessionLogs.length===0){
      inner += '<div class="empty">No sets were logged this session.</div>';
    }else{
      inner += sessionLogs.map(l=>{
        const ex = exercises.find(e=>e.id===l.exerciseId) || {name:'Unknown', unit:'lb', category:'accessory'};
        const setsStr = l.sets.map(s=> ex.unit==='lb' ? `${s.reps}×${s.weight}lb` : `${s.reps||s.weight}`).join(', ');
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <div style="display:flex;align-items:center;gap:10px;">${iconBadge(ex,'sm')}<div><strong>${ex.name}</strong><div style="color:var(--text-dim);">${setsStr}</div></div></div>
          <div style="color:var(--activity);font-weight:700;white-space:nowrap;">~${fmtCalories(caloriesForExerciseLog(l))}</div>
        </div>`;
      }).join('');
      inner += `<div class="presc" style="margin-top:10px;">Estimated total: ~${fmtCalories(totalCals)} burned</div>`;
    }
    if(coachOn()){
      const nx = nextSessionAfter(todayStr());
      const ws = weekSummary(todayStr());
      inner += `<div class="coach-why">✅ <strong>${ws.doneCount} of ${ws.plannedCount}</strong> sessions done this week · <strong>${planStreak()}</strong> planned sessions in a row.
        ${nx ? `Next up: <strong>${WD_LONG[weekdayOf(nx.date)]} — ${nx.day.title}</strong>.` : ''}
        Recovery starts now: get protein in your next meal, drink water, and aim for 7–9 hours of sleep — that's when the muscle actually gets built.</div>`;
    }
    inner += `<div class="wizard-actions">
        <button class="btn secondary" onclick="changePlanDay()">Pick another day</button>
        <button class="btn" onclick="switchView('dashboard')">Back to Dashboard</button>
      </div>`;
  }

  detail.innerHTML = `<div class="card">${inner}</div>`;

  if(step.type === 'exercise' && document.getElementById('wizardSetsContainer')){
    const si = stepExercise(plan, day, step); const ex = si.ex;
    if(ex){
      const rx = si.rx;
      const sug = suggestFor(ex, rx, todayReadiness());
      document.getElementById('wizardSetsContainer').innerHTML = '';
      for(let i=0;i<sug.sets;i++) addWizardSetRow(ex, sug.weight, repRange(rx.reps)[0]);
    }
  }
  updateTimerDisplay(); // no-op unless this render includes the rest-timer widget

  // "Did you know?" tip tied to this exercise (or a general one during warm-up).
  if(step.type === 'exercise'){
    const tipEx = stepExercise(plan, day, step).ex;
    if(tipEx) maybeShowTip('plan', 'plan|' + plan.date + '|' + day.id + '|' + idx + '|' + tipEx.id, tipGroupsFor(tipEx));
  } else if(step.type === 'warmup' || step.type === 'finisher' || step.type === 'cardio'){
    maybeShowTip('plan', 'plan|' + plan.date + '|' + day.id + '|' + idx, generalTipGroups());
  } else {
    hideTip();
  }
  refreshWakeLock();
}

function addWizardSetRow(ex, target, repsDefault){
  const container = document.getElementById('wizardSetsContainer');
  if(!container) return;
  if(!ex){
    const plan = loadTodayPlan();
    const day = WORKOUT_DAYS.find(d=>d.id===plan.dayId);
    const steps = buildSteps(day);
    const step = steps[Math.min(plan.stepIndex, steps.length-1)];
    const si = stepExercise(plan, day, step);
    ex = si.ex;
    const rx = si.rx;
    target = suggestFor(ex, rx, todayReadiness()).weight;
    repsDefault = repRange(rx.reps)[0];
  }
  const defaultReps = ex.repsAreTime ? '' : (repsDefault != null ? repsDefault : defaultRepsValue(ex));
  buildSetRow(container, ex, target||'', defaultReps);
}
function renumberWizardSets(){
  document.querySelectorAll('#wizardSetsContainer .set-row').forEach((row,i)=>{
    row.querySelector('.idx').textContent = '#'+(i+1);
  });
}

function wizardSaveExercise(){
  const plan = loadTodayPlan();
  const day = WORKOUT_DAYS.find(d=>d.id===plan.dayId);
  const steps = buildSteps(day);
  const step = steps[Math.min(plan.stepIndex, steps.length-1)];
  const si = stepExercise(plan, day, step);
  const ex = si.ex;
  if(!ex) return;
  const sets = collectSets(document.getElementById('wizardSetsContainer'), ex);
  if(sets.length===0){ showToast('Log at least one set, or use "Couldn\'t finish"'); return; }
  const rx = si.rx;
  const readiness = todayReadiness();
  const suggested = suggestFor(ex, rx, readiness).weight;
  const award = awardForLog(ex, sets);
  const log = { id: uid(), exerciseId: ex.id, date: todayStr(), sets, notes:'', dayId: day.id, feel: wizardFeel, readiness, suggested };
  logs.push(log);
  updateProgressAfter(ex, sets, rx, wizardFeel, readiness);
  const nextMsg = ex.progress==='up' ? ' · 📈 weight goes up next time (on a good day)' : ex.progress==='down' ? ' · we\'ll back off a step next time' : '';
  wizardFeel = 'right';
  const sessionLogIds = (plan.sessionLogIds||[]).concat(log.id);
  const saveDefaultEl = document.getElementById('wizardSaveDefault');
  const savedDefault = saveDefaultEl && saveDefaultEl.checked;
  if(savedDefault) applySaveAsDefault(ex, sets);
  saveAll();
  saveTodayPlan({ stepIndex: plan.stepIndex + 1, sessionLogIds });
  checkBadges();
  showToast(ex.name + ' saved ✓ +' + award.xp + ' XP' + (award.firstTime ? ' 🆕' : '') + (award.pr ? ' 📈 PR!' : '') + (savedDefault ? ' · new default set' : nextMsg));
  renderPlanView();
  renderDashboard();
}
// Turns the numbers actually entered for a set into the exercise's new baseline
// prescription (sets/reps/weight), so next time it's suggested at this level.
function applySaveAsDefault(ex, sets){
  if(!ex || !sets.length) return;
  ex.targetSets = sets.length;
  if(ex.unit === 'lb' && sets[0].reps) ex.targetReps = sets[0].reps;
  if(sets[0].weight) ex.baseline = sets[0].weight; // for reps/seconds-unit exercises, "weight" holds that count
  if(ex.repsAreTime) ex.repsAreTime = false;
}
function wizardSkipExercise(){
  wizardFeel = 'right';
  const plan = loadTodayPlan();
  const prevIdx = plan.stepIndex;
  setTimeout(()=> showUndo('Skipped that exercise', ()=>{ saveTodayPlan({ stepIndex: prevIdx }); renderPlanView(); renderDashboard(); }), 50);
  saveTodayPlan({ stepIndex: plan.stepIndex + 1 });

  renderPlanView();
  renderDashboard();
}

/* ---------------- Activity days (Basketball / Other Sport) ---------------- */
// A simpler one-step flow: no sets/reps — just "how many hours were you active?"

function renderActivityDetail(plan){
  const detail = document.getElementById('planDetail');
  if(!detail) return;
  const activity = ACTIVITY_TYPES.find(a=>a.id===plan.activityId);
  if(!activity){ detail.innerHTML = ''; return; }

  if(plan.activityLogId){
    const log = activityLogs.find(a=>a.id===plan.activityLogId);
    if(!log){ detail.innerHTML = ''; return; }
    detail.innerHTML = `<div class="card">
      <div style="display:flex;align-items:center;gap:12px;">${iconBadge({category:'activity'})}<div><h2 style="margin-bottom:2px;">Nice work! 🎉</h2><div class="hint" style="margin-bottom:0;">Logged for today</div></div></div>
      <div class="presc" style="margin-top:10px;">${log.hours} hr${log.hours!==1?'s':''} of ${log.label}</div>
      ${log.notes ? `<div class="hint" style="margin-top:6px;font-style:italic;">"${log.notes}"</div>` : ''}
      <div class="wizard-actions">
        <button class="btn secondary" onclick="changePlanDay()">Pick another day</button>
        <button class="btn" onclick="switchView('dashboard')">Back to Dashboard</button>
      </div>
    </div>`;
    return;
  }

  detail.innerHTML = `<div class="card">
    <div style="display:flex;align-items:center;gap:12px;">${iconBadge({category:'activity'})}<div><h2 style="margin-bottom:2px;">${activity.title}</h2><div class="hint" style="margin-bottom:0;">${activity.subtitle}</div></div></div>
    ${activity.custom ? '<label>Activity name</label><input type="text" id="activityCustomName" placeholder="e.g. Tennis, Soccer, Hiking">' : ''}
    <label>Hours active</label>
    <input type="number" id="activityHours" step="0.25" min="0" placeholder="e.g. 1.5">
    <label>Notes (optional)</label>
    <textarea id="activityNotes" rows="2" placeholder="How did it go?"></textarea>
    <div class="wizard-actions">
      <button class="btn ghost" onclick="changePlanDay()">Not today</button>
      <button class="btn" onclick="saveActivityLog()">Log Activity ✓</button>
    </div>
  </div>`;
}

function saveActivityLog(){
  const plan = loadTodayPlan();
  const activity = ACTIVITY_TYPES.find(a=>a.id===plan.activityId);
  if(!activity) return;
  const hoursEl = document.getElementById('activityHours');
  const hours = parseFloat(hoursEl.value);
  if(!hours || hours <= 0){ showToast('Enter how many hours you were active'); return; }
  const customNameEl = document.getElementById('activityCustomName');
  const label = activity.custom ? ((customNameEl && customNameEl.value.trim()) || 'Other Sport') : activity.title;
  const notes = document.getElementById('activityNotes').value.trim();
  const entry = { id: uid(), date: todayStr(), activityId: activity.id, label, hours, notes };
  activityLogs.push(entry);
  saveAll();
  saveTodayPlan({ activityLogId: entry.id });
  showToast(label + ' logged — ' + hours + ' hr' + (hours!==1?'s':'') + ' ✓');
  renderPlanView();
  renderDashboard();
  renderCalendar();
  renderHistory();
}

/* ---------------- Log Workout ---------------- */

// Groups the exercise library by category (in CATEGORIES order) for any picker list.
function exercisesByCategory(list){
  const groups = CATEGORIES.map(c=>({ def:c, items: list.filter(ex=>ex.category===c.id) })).filter(g=>g.items.length);
  return groups;
}
function renderExerciseList(){
  const box = document.getElementById('exerciseList');
  const filterSel = document.getElementById('logExerciseFilter');
  if(filterSel && !filterSel.dataset.built){
    filterSel.innerHTML = '<option value="">All categories</option>' + CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
    filterSel.dataset.built = '1';
  }
  const filterCat = filterSel ? filterSel.value : '';
  const list = exercises.filter(ex=> !filterCat || ex.category===filterCat);
  const groups = exercisesByCategory(list);
  box.innerHTML = groups.map(g=>{
    const cards = g.items.map(ex=>{
      const selected = ex.id===selectedExerciseId;
      return `<div class="exercise-card${selected?' selected':''}" onclick="selectExerciseForLog('${ex.id}')">
        ${iconBadge(ex)}
        <div><div class="name">${ex.name}<span class="equip-tag">${equipmentLabel(ex.equipment)}</span></div>
        <div class="meta">baseline ${fmtWeight(ex, ex.baseline)}</div>
        <div class="presc">${prescriptionWithTime(ex)}</div></div>
      </div>`;
    }).join('');
    return `<div class="category-group-heading" style="color:${g.def.color}"><span class="category-dot" style="background:${g.def.color}"></span>${g.def.label}</div>${cards}`;
  }).join('') || '<div class="empty">No exercises in this category yet.</div>';
}
function selectExerciseForLog(id){ selectedExerciseId = id; renderLogView(); }

function renderLogView(){
  renderExerciseList();
  const ex = exercises.find(e=>e.id===selectedExerciseId);
  document.getElementById('logDate').value = todayStr();
  if(!ex){
    document.getElementById('logExerciseTitle').textContent = 'Select an exercise to begin.';
    document.getElementById('logTargetDisplay').value = '';
    document.getElementById('setsContainer').innerHTML = '';
    return;
  }
  document.getElementById('logExerciseTitle').innerHTML =
    `<div style="display:flex;align-items:center;gap:10px;">${iconBadge(ex,'sm')}<div>Logging: <strong>${ex.name}</strong><div class="presc" style="margin-top:1px;">Goal: ${prescriptionLabel(ex)}</div></div></div>${movementPreviewHtml(ex)}`;
  const wk = currentWeekNumber();
  document.getElementById('logTargetDisplay').value = (ex.workingWeight!=null && ex.workingWeight!=='')
    ? fmtWeight(ex, workingWeight(ex)) + ' (your working weight)'
    : fmtWeight(ex, targetForExerciseAtWeek(ex, wk)) + ' (Week ' + wk + ')';
  document.getElementById('logExerciseTitle').innerHTML += lastTimeHtml(ex) + coachingHtml(ex).replace('<details class="coach-box" open>','<details class="coach-box">');
  document.getElementById('setsContainer').innerHTML = '';
  const numSets = ex.targetSets || 3;
  for(let i=0;i<numSets;i++) addSetRow();
  const saveDefaultEl = document.getElementById('logSaveDefault');
  if(saveDefaultEl) saveDefaultEl.checked = false;
  maybeShowTip('log', 'log|' + ex.id, tipGroupsFor(ex));
}

function addSetRow(){
  const ex = exercises.find(e=>e.id===selectedExerciseId);
  if(!ex) return;
  const container = document.getElementById('setsContainer');
  const prev = [...container.querySelectorAll('.set-row')].pop();
  const w = prev ? prev.querySelector('.set-weight').value : workingWeight(ex);
  buildSetRow(container, ex, w, defaultRepsValue(ex));
}
function renumberSets(){
  document.querySelectorAll('#setsContainer .set-row').forEach((row,i)=>{
    row.querySelector('.idx').textContent = '#'+(i+1);
  });
}

function saveWorkoutLog(){
  const ex = exercises.find(e=>e.id===selectedExerciseId);
  if(!ex){ showToast('Pick an exercise first'); return; }
  const date = document.getElementById('logDate').value || todayStr();
  const sets = collectSets(document.getElementById('setsContainer'), ex);
  if(sets.length===0){ showToast('Add at least one set with data'); return; }
  const notes = document.getElementById('logNotes').value.trim();
  const award = awardForLog(ex, sets);
  logs.push({ id: uid(), exerciseId: ex.id, date, sets, notes });
  // Record the heaviest set as your working weight if it beats what's on file.
  const topVal = Math.max(...sets.map(st=> ex.unit==='lb' ? (st.weight||0) : (st.weight||st.reps||0)));
  if(topVal > 0 && (ex.workingWeight == null || ex.workingWeight === '' || topVal > +ex.workingWeight)) ex.workingWeight = topVal;
  const saveDefaultEl = document.getElementById('logSaveDefault');
  const savedDefault = saveDefaultEl && saveDefaultEl.checked;
  if(savedDefault) applySaveAsDefault(ex, sets);
  saveAll();
  document.getElementById('logNotes').value='';
  renderLogView();
  checkBadges();
  showToast('Workout saved ✓ +' + award.xp + ' XP' + (award.firstTime ? ' 🆕 discovery' : '') + (award.pr ? ' 📈 PR!' : '') + (savedDefault ? ' · new default set' : ''));
}

