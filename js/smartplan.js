/* J3 WorkOut — js/smartplan.js
   A plan that adapts over time:
   - Deload weeks (default every 5th week, or on demand): fewer sets, ~10% lighter
   - Stall detection: 3 sessions with no new best → swap variation / reset lighter / keep pushing
   - 8-week refresh prompt: rebuild the plan with fresh exercise variations, weights kept
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Deload weeks ---------------- */
const DELOAD_OPTIONS = [ { v:4, l:'Every 4th week' }, { v:5, l:'Every 5th week' }, { v:6, l:'Every 6th week' }, { v:0, l:'Off' } ];
function mondayOf(dateStr){ return addDaysToDateStr(dateStr, -((weekdayOf(dateStr)+6)%7)); }
function planWeekIndex(dateStr){
  if(!coachOn()) return 0;
  const start = mondayOf(profile.coach.firstBuiltAt || profile.coach.builtAt || dateStr);
  const days = Math.round((new Date(dateStr+'T00:00:00') - new Date(start+'T00:00:00')) / 86400000);
  return Math.floor(days / 7) + 1;
}
function deloadEvery(){ return coachOn() ? (profile.coach.deloadEvery != null ? profile.coach.deloadEvery : 5) : 0; }
function isDeloadWeek(dateStr){
  if(!coachOn()) return false;
  dateStr = dateStr || todayStr();
  if(onVacation(dateStr)) return false;
  const manual = profile.coach.deloadWeekOf;
  if(manual) return manual === mondayOf(dateStr);
  const every = deloadEvery();
  return every > 0 && planWeekIndex(dateStr) % every === 0;
}
function weeksUntilDeload(){
  const every = deloadEvery(); if(!every) return null;
  const wk = planWeekIndex(todayStr());
  return (every - (wk % every)) % every;
}
function setDeloadEvery(v){ profile.coach.deloadEvery = +v; saveAll(); renderCoach(); renderDashboard(); showToast(+v ? `Deload every ${v}th week` : 'Automatic deloads off'); }
function deloadThisWeek(on){
  profile.coach.deloadWeekOf = on ? mondayOf(todayStr()) : null;
  saveAll(); renderCoach(); renderDashboard(); renderPlanView();
  showToast(on ? '🧘 Deload week on — lighter weights, fewer sets' : 'Back to normal training');
}
// Called from suggestFor(): lighten the day during a deload week.
function applyDeload(ex, w, sets, inc, reasons){
  if(!isDeloadWeek()) return { w, sets };
  const lighter = roundToInc(w * 0.9, inc);
  reasons.push('🧘 Deload week: ~10% lighter and fewer sets so your body fully recovers — you\'ll come back stronger.');
  return { w: Math.min(w, lighter), sets: Math.max(1, Math.ceil(sets * 0.6)) };
}
function deloadBannerHtml(){
  if(!isDeloadWeek()) return '';
  return `<div class="coach-why deload">🧘 <strong>Deload week.</strong> Same exercises, ~10% lighter and fewer sets. Planned recovery weeks let tendons, joints and your nervous system catch up — progress tends to jump right after. Your working weights won't drop because of it.</div>`;
}

/* ---------------- Stall detection ---------------- */
function stallInfo(exId){
  const ex = exercises.find(e=>e.id===exId); if(!ex) return null;
  if(ex.stallSnooze && ex.stallSnooze > todayStr()) return null;
  const s = strengthSeries(exId);
  if(s.length < 4) return null;
  const last3 = s.slice(-3), before = s.slice(0, -3);
  if(last3[2].date < addDaysToDateStr(todayStr(), -21)) return null; // not training it lately
  const bestBefore = Math.max(...before.map(p=>p.e1rm));
  const bestRecent = Math.max(...last3.map(p=>p.e1rm));
  if(bestRecent > bestBefore) return null;
  return { ex, since: last3[0].date, best: bestBefore, recent: bestRecent };
}
function stalledLifts(){
  const ids = coachOn() ? [...new Set(WORKOUT_DAYS.filter(d=>Object.values(profile.coach.schedule).includes(d.id)).flatMap(d=>d.lifts))] : [...new Set(logs.map(l=>l.exerciseId))];
  return ids.map(stallInfo).filter(Boolean);
}
function stallFixVariation(exId){
  const ex = exercises.find(e=>e.id===exId); if(!ex) return;
  const day = WORKOUT_DAYS.find(d=>d.lifts.includes(exId));
  const rx = day && day.rx && day.rx[exId];
  const exclude = WORKOUT_DAYS.flatMap(d=>d.lifts);
  const alt = safeAlternative(ex, rx && rx.pool, exclude, todayFlags());
  if(!alt){ showToast('No similar exercise available with your equipment — try a reset instead'); return; }
  const before = JSON.parse(JSON.stringify(WORKOUT_DAYS));
  WORKOUT_DAYS.forEach(d=>{
    if(!d.lifts.includes(exId)) return;
    d.lifts = d.lifts.map(id=> id===exId ? alt.id : id);
    if(d.rx && d.rx[exId]){ d.rx[alt.id] = d.rx[exId]; delete d.rx[exId]; }
  });
  saveWorkoutDays(); renderCoach(); renderPlanView(); renderDashboard();
  showUndo(`Swapped ${escapeHtml(ex.name)} → ${escapeHtml(alt.name)} in your plan`, ()=>{ WORKOUT_DAYS = before; saveWorkoutDays(); renderCoach(); renderPlanView(); });
}
function stallFixReset(exId){
  const ex = exercises.find(e=>e.id===exId); if(!ex) return;
  const prev = { workingWeight: ex.workingWeight, progress: ex.progress, stallSnooze: ex.stallSnooze };
  const inc = ex.increment > 0 ? ex.increment : 5;
  const base = workingWeight(ex);
  ex.workingWeight = Math.max(ex.unit==='lb' ? inc : 1, roundToInc(base * 0.9, inc));
  ex.progress = 'hold';
  ex.stallSnooze = addDaysToDateStr(todayStr(), 21);
  saveAll(); renderCoach(); renderPlanView();
  showUndo(`${escapeHtml(ex.name)}: reset to ${fmtWeight(ex, ex.workingWeight)} — build back up with perfect reps`, ()=>{ Object.assign(ex, prev); saveAll(); renderCoach(); renderPlanView(); });
}
function stallSnooze(exId){
  const ex = exercises.find(e=>e.id===exId); if(!ex) return;
  ex.stallSnooze = addDaysToDateStr(todayStr(), 14); saveAll(); renderCoach(); renderPlanView();
  showToast('OK — I\'ll check again in 2 weeks');
}
function stallCardHtml(info, compact){
  const ex = info.ex;
  return `<div class="stall-item">
    <div><strong>${escapeHtml(ex.name)}</strong> hasn't hit a new best in 3 sessions${ex.unit==='lb' ? ` (best ≈ ${Math.round(info.best)} lb est. 1RM)` : ''}.
    ${compact ? '' : '<div class="hint" style="margin:4px 0 0;">Plateaus are normal. Usually the fix is a slightly different exercise for the same muscle, or a short step back to rebuild momentum.</div>'}</div>
    <div class="stall-actions">
      <button class="btn secondary" onclick="stallFixVariation('${ex.id}')">⇄ Try a variation</button>
      <button class="btn secondary" onclick="stallFixReset('${ex.id}')">↺ Reset −10%</button>
      <button class="btn ghost" onclick="stallSnooze('${ex.id}')">Keep pushing</button>
    </div>
  </div>`;
}

/* ---------------- 8-week plan refresh ---------------- */
const REFRESH_AFTER_DAYS = 56;
function planAgeDays(){
  if(!coachOn() || !profile.coach.builtAt) return 0;
  return Math.round((new Date(todayStr()+'T00:00:00') - new Date(profile.coach.builtAt+'T00:00:00')) / 86400000);
}
function refreshDue(){
  if(!coachOn()) return false;
  if(profile.coach.refreshSnooze && profile.coach.refreshSnooze > todayStr()) return false;
  return planAgeDays() >= REFRESH_AFTER_DAYS;
}
function startPlanRefresh(){
  startCoachSetup();
  coachDraft.cycle = (profile.coach.cycle || 0) + 1; // rotates in fresh exercise variations
  coachStep = COACH_STEPS.length - 1;                 // jump straight to review — answers are pre-filled
  renderCoach();
}
function snoozeRefresh(){ profile.coach.refreshSnooze = addDaysToDateStr(todayStr(), 7); saveAll(); renderDashboard(); showToast('I\'ll remind you next week'); }
function refreshBannerHtml(){
  if(!refreshDue()) return '';
  const weeks = Math.floor(planAgeDays()/7);
  return `<div class="card refresh-banner" style="margin-bottom:16px;">
    <div class="flex-between" style="gap:10px;flex-wrap:wrap;">
      <div style="flex:1 1 240px;"><strong>🔄 You've run this plan for ${weeks} weeks — time for a refresh</strong>
      <div class="hint" style="margin:0;">Your body adapts to the same routine. A refresh keeps your answers and working weights but rotates in new exercise variations. You can change any answer first.</div></div>
      <div class="row" style="flex:0 0 auto;gap:8px;"><button class="btn ghost" onclick="snoozeRefresh()">Next week</button><button class="btn" onclick="startPlanRefresh()">Refresh plan →</button></div>
    </div>
  </div>`;
}

/* ---------------- Coach page section ---------------- */
function smartPlanSectionHtml(){
  const stalls = stalledLifts();
  const wu = weeksUntilDeload();
  const deloadNow = isDeloadWeek();
  const manual = !!profile.coach.deloadWeekOf && deloadNow;
  const age = planAgeDays();
  return `<div class="card" style="margin-bottom:16px;">
    <h2>🧠 Keeping the plan fresh</h2>
    ${deloadBannerHtml()}
    <div class="smart-grid">
      <div class="smart-cell">
        <div class="smart-h">Deload weeks</div>
        <div class="hint" style="margin:2px 0 8px;">A lighter week every few weeks lets you recover fully. ${deloadNow ? '<strong style="color:var(--core)">This week is a deload.</strong>' : wu != null ? `Next one in <strong>${wu === 0 ? 'this week' : wu + ' week' + (wu>1?'s':'')}</strong>.` : 'Automatic deloads are off.'}</div>
        <select onchange="setDeloadEvery(this.value)">${DELOAD_OPTIONS.map(o=>`<option value="${o.v}"${deloadEvery()===o.v?' selected':''}>${o.l}</option>`).join('')}</select>
        <button class="btn ${manual?'secondary':'ghost'}" style="width:100%;margin-top:8px;" onclick="deloadThisWeek(${manual?'false':'true'})">${manual ? 'End deload — train normally' : 'Feeling beat up? Deload this week'}</button>
      </div>
      <div class="smart-cell">
        <div class="smart-h">Plan age</div>
        <div class="hint" style="margin:2px 0 8px;">Built ${Math.floor(age/7)} week${Math.floor(age/7)!==1?'s':''} ago. Refreshing every ~8 weeks rotates in new variations so you keep adapting.</div>
        <button class="btn ghost" style="width:100%;" onclick="startPlanRefresh()">🔄 Refresh plan now</button>
      </div>
    </div>
    <div class="smart-h" style="margin-top:14px;">Plateau check</div>
    ${stalls.length ? stalls.map(s=>stallCardHtml(s)).join('') : '<div class="hint" style="margin:4px 0 0;">✅ No stalled lifts — everything you\'ve trained regularly is still setting new bests.</div>'}
  </div>`;
}
