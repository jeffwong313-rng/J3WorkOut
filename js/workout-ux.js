/* J3 WorkOut — js/workout-ux.js
   In-workout logging that's quick with sweaty hands:
   - set rows with − / + steppers and a ✓ per set (✓ starts the rest timer and buzzes)
   - "last time" numbers so you know what to beat
   - keep the screen awake during a workout
   - Undo toasts instead of "are you sure?" pop-ups
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Set rows ---------------- */
function setStepFor(ex, field){
  if(field === 'reps') return 1;
  if(ex.unit === 'seconds') return 5;
  if(ex.unit === 'reps') return 1;
  return ex.increment > 0 ? ex.increment : 5;
}
function stepperHtml(cls, value, step, placeholder, unitLabel){
  return `<div class="stepper">
    <button type="button" class="st-btn" onclick="stepSetValue(this,-${step})" aria-label="Decrease">−</button>
    <input type="number" inputmode="decimal" step="any" class="${cls}" value="${value === '' || value == null ? '' : value}" placeholder="${placeholder}" oninput="this.closest('.set-row').dataset.touched='1'">
    <button type="button" class="st-btn" onclick="stepSetValue(this,${step})" aria-label="Increase">+</button>
    ${unitLabel ? `<span class="st-unit">${unitLabel}</span>` : ''}
  </div>`;
}
// One set row. Keeps the .set-reps / .set-weight classes the save code reads.
function buildSetRow(container, ex, weight, reps){
  if(!container) return;
  if(!container.querySelector('.set-head')){
    const head = document.createElement('div');
    head.className = 'set-head';
    const showReps = ex.unit === 'lb';
    head.innerHTML = `<span>Set</span><span>${ex.unit==='lb' ? 'Weight (lb)' : ex.unit==='seconds' ? 'Seconds' : 'Reps'}</span>${showReps ? '<span>Reps</span>' : ''}<span>Done</span>`;
    head.classList.toggle('single', !showReps);
    container.prepend(head);
  }
  const idx = container.querySelectorAll('.set-row').length + 1;
  const row = document.createElement('div');
  const showReps = ex.unit === 'lb';
  row.className = 'set-row v2' + (showReps ? '' : ' single');
  const weightLabel = ex.unit==='reps' ? 'Reps' : (ex.unit==='seconds' ? 'Sec' : 'lb');
  row.innerHTML = `
    <div class="idx">${idx}</div>
    ${stepperHtml('set-weight', weight, setStepFor(ex,'weight'), weightLabel, '')}
    ${showReps ? stepperHtml('set-reps', ex.repsAreTime ? '' : reps, 1, 'reps', '') : ''}
    <button type="button" class="set-check" onclick="toggleSetDone(this)" aria-label="Mark set done">✓</button>
    <button type="button" class="icon-btn set-del" onclick="removeSetRow(this)" aria-label="Remove set">✕</button>`;
  container.appendChild(row);
  return row;
}
function removeSetRow(btn){
  const container = btn.closest('.set-row').parentElement;
  btn.closest('.set-row').remove();
  container.querySelectorAll('.set-row').forEach((r,i)=> r.querySelector('.idx').textContent = i+1);
}
function stepSetValue(btn, delta){
  const input = btn.parentElement.querySelector('input');
  const v = parseFloat(input.value) || 0;
  input.value = Math.max(0, Math.round((v + delta)*100)/100);
  btn.closest('.set-row').dataset.touched = '1';
  buzz(8);
}
function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
function toggleSetDone(btn){
  const row = btn.closest('.set-row');
  const container = row.parentElement;
  const nowDone = !row.classList.contains('done');
  row.classList.toggle('done', nowDone);
  if(!nowDone) return;
  buzz(30);
  const rows = [...container.querySelectorAll('.set-row')];
  const next = rows.slice(rows.indexOf(row)+1).find(r=>!r.classList.contains('done'));
  if(next){
    // Carry today's numbers forward if you haven't edited the next set yourself.
    if(!next.dataset.touched){
      ['.set-weight','.set-reps'].forEach(sel=>{ const a = row.querySelector(sel), b = next.querySelector(sel); if(a && b) b.value = a.value; });
    }
    // Start the rest timer if this screen has one.
    const view = container.closest('.view');
    if(view && view.querySelector('#timerDisplay')){ resetTimer(); startTimer(); }
  } else {
    const view = container.closest('.view');
    const saveBtn = view && view.querySelector('[data-save-btn]');
    if(saveBtn){ saveBtn.classList.add('pulse'); saveBtn.scrollIntoView({ behavior:'smooth', block:'center' }); }
    showToast('All sets done 💪 — tap save');
  }
}
// Read the sets from a container. If you ticked any sets, only ticked ones count.
function collectSets(container, ex){
  if(!container) return [];
  let rows = [...container.querySelectorAll('.set-row')];
  if(rows.some(r=>r.classList.contains('done'))) rows = rows.filter(r=>r.classList.contains('done'));
  return rows.map(row=>{
    const repsEl = row.querySelector('.set-reps'), weightEl = row.querySelector('.set-weight');
    const reps = repsEl ? (parseFloat(repsEl.value)||0) : (parseFloat(weightEl.value)||0);
    const weight = repsEl ? (parseFloat(weightEl.value)||0) : (ex.unit==='lb' ? 0 : parseFloat(weightEl.value)||0);
    return { reps, weight };
  }).filter(s=> s.reps>0 || s.weight>0);
}

/* ---------------- "Last time" ---------------- */
function lastPerformance(ex){
  const prev = logs.filter(l=>l.exerciseId===ex.id && l.date < todayStr()).sort((a,b)=> b.date.localeCompare(a.date));
  return prev[0] || null;
}
function fmtSetList(ex, sets){
  if(!sets || !sets.length) return '';
  if(ex.unit !== 'lb') return sets.map(s=> fmtWeight(ex, s.weight || s.reps)).join(', ');
  const same = sets.every(s=> s.reps===sets[0].reps && s.weight===sets[0].weight);
  if(same) return `${sets.length} × ${sets[0].reps} @ ${sets[0].weight} lb`;
  return sets.map(s=> `${s.reps}×${s.weight}`).join(', ') + ' lb';
}
function lastTimeHtml(ex){
  const last = lastPerformance(ex);
  if(!last) return `<div class="last-time first">🆕 First time logging this one — today sets your baseline.</div>`;
  const when = new Date(last.date+'T00:00:00').toLocaleDateString(undefined,{ month:'short', day:'numeric' });
  const top = Math.max(...last.sets.map(s=> ex.unit==='lb' ? s.weight : (s.weight||s.reps)));
  const topReps = ex.unit==='lb' ? Math.max(...last.sets.filter(s=>s.weight===top).map(s=>s.reps)) : null;
  const beat = ex.unit==='lb' ? `beat it: ${topReps+1}+ reps at ${top} lb, or go up in weight` : `beat it: ${fmtWeight(ex, top + setStepFor(ex,'weight'))}`;
  return `<div class="last-time">📅 Last time (${when}): <strong>${fmtSetList(ex, last.sets)}</strong><span> · ${beat}</span></div>`;
}

/* ---------------- Keep the screen awake during workouts ---------------- */
let _wakeLock = null;
async function setAwake(on){
  try{
    if(on && !_wakeLock && 'wakeLock' in navigator){
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', ()=>{ _wakeLock = null; });
    } else if(!on && _wakeLock){ await _wakeLock.release(); _wakeLock = null; }
  }catch(e){ /* not supported or not allowed — fine */ }
}
function shouldStayAwake(){
  const active = document.querySelector('.view.active');
  if(!active || document.visibilityState !== 'visible') return false;
  if(active.id === 'view-plan'){ const p = loadTodayPlan(); return !!(p && p.kind === 'lift' && p.dayId && !planIsComplete(p)); }
  if(active.id === 'view-freestyle') return fsLive() && fs.stage !== 'done';
  if(active.id === 'view-vacation') return !!vac.running;
  if(active.id === 'view-warmup') return !!warmupRunning;
  if(active.id === 'view-sprints') return !!sprintRunning;
  if(active.id === 'view-mobility') return typeof mobRunning !== 'undefined' && !!mobRunning;
  return false;
}
function refreshWakeLock(){ setAwake(shouldStayAwake()); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') refreshWakeLock(); });

/* ---------------- Undo instead of "are you sure?" ---------------- */
function showUndo(msg, undoFn){
  const el = document.getElementById('undoToast');
  if(!el){ showToast(msg); return; }
  el.innerHTML = `<span>${msg}</span><button class="btn secondary" type="button">Undo</button>`;
  el.classList.add('show');
  clearTimeout(showUndo._h);
  el.querySelector('button').onclick = ()=>{ el.classList.remove('show'); clearTimeout(showUndo._h); undoFn(); showToast('Undone ↩'); };
  showUndo._h = setTimeout(()=> el.classList.remove('show'), 7000);
}
