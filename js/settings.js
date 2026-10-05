/* J3 WorkOut — js/settings.js
   Settings: profile, exercise library, workout days, backup / import / reset.
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Settings ---------------- */

function renderSettings(){
  renderBackupStatus();
  document.getElementById('profHeight').value = profile.height;
  document.getElementById('profWeight').value = profile.weight;
  document.getElementById('profBuild').value = profile.build;
  document.getElementById('profStartDate').value = profile.startDate;
  document.getElementById('profShowGifs').checked = profile.showGifs !== false;
  document.getElementById('profShowTips').checked = profile.showTips !== false;
  buildSettingsFilterSelectsOnce();
  renderSettingsExerciseList();
  renderWorkoutDaysSettings();
  renderMuscleDb();
}

function buildSettingsFilterSelectsOnce(){
  const catSel = document.getElementById('settingsCategoryFilter');
  if(catSel && !catSel.dataset.built){
    catSel.innerHTML = '<option value="">All categories</option>' + CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
    catSel.dataset.built = '1';
  }
  const eqSel = document.getElementById('settingsEquipmentFilter');
  if(eqSel && !eqSel.dataset.built){
    eqSel.innerHTML = '<option value="">All equipment</option>' + EQUIPMENT_TYPES.map(e=>`<option value="${e.id}">${e.label}</option>`).join('');
    eqSel.dataset.built = '1';
  }
}

let openIconPickerId = null; // which exercise row currently has its "change icon" picker expanded

function renderSettingsExerciseList(){
  const box = document.getElementById('settingsExerciseList');
  if(!box) return;
  const catFilter = document.getElementById('settingsCategoryFilter').value;
  const eqFilter = document.getElementById('settingsEquipmentFilter').value;
  const list = exercises.filter(ex => (!catFilter || ex.category===catFilter) && (!eqFilter || ex.equipment===eqFilter));
  const groups = exercisesByCategory(list);
  box.innerHTML = groups.map(g=>{
    const rows = g.items.map(renderSettingsExerciseRow).join('');
    return `<div class="category-group-heading" style="color:${g.def.color}"><span class="category-dot" style="background:${g.def.color}"></span>${g.def.label} <span style="color:var(--text-dim);font-weight:600;">(${g.items.length})</span></div>${rows}`;
  }).join('') || '<div class="empty">No exercises match these filters.</div>';
}

function renderSettingsExerciseRow(ex){
  const pickerOpen = openIconPickerId === ex.id;
  const iconGrid = pickerOpen ? `<div class="icon-picker">${PICKABLE_ICON_KEYS.map(k=>
    `<div class="icon-choice${ex.icon===k?' selected':''}" onclick="setExerciseIcon('${ex.id}','${k}')" title="${ICON_LIBRARY[k].label}">${ICON_LIBRARY[k].svg}</div>`
  ).join('')}</div>` : '';
  return `<div class="exercise-card" style="cursor:default;align-items:flex-start;flex-wrap:wrap;">
    <div onclick="toggleRowIconPicker('${ex.id}')" style="cursor:pointer;">${iconBadge(ex)}</div>
    <div style="flex:1;min-width:220px;">
      <div class="flex-between">
        <div>
          <div class="name">${ex.name}<span class="equip-tag">${equipmentLabel(ex.equipment)}</span></div>
          <div class="meta">${prescriptionWithTime(ex)}</div>
          ${exerciseTargetLineHtml(ex)}
        </div>
        <button class="icon-btn" onclick="deleteExercise('${ex.id}')">🗑</button>
      </div>
      ${iconGrid}
      <div class="row" style="margin-top:8px;">
        <select onchange="updateExerciseField('${ex.id}','category',this.value)">
          ${CATEGORIES.map(c=>`<option value="${c.id}"${c.id===ex.category?' selected':''}>${c.label}</option>`).join('')}
        </select>
        <select onchange="updateExerciseField('${ex.id}','equipment',this.value)">
          ${EQUIPMENT_TYPES.map(e=>`<option value="${e.id}"${e.id===ex.equipment?' selected':''}>${e.label}</option>`).join('')}
        </select>
      </div>
      <div class="row" style="margin-top:8px;">
        <input type="number" value="${ex.baseline}" onchange="updateExerciseField('${ex.id}','baseline',this.value)" placeholder="Baseline">
        <input type="number" value="${ex.increment}" step="0.5" onchange="updateExerciseField('${ex.id}','increment',this.value)" placeholder="Climb / 2wk">
      </div>
      <div class="row" style="margin-top:8px;">
        <input type="number" value="${ex.targetSets||4}" onchange="updateExerciseField('${ex.id}','targetSets',this.value)" placeholder="Target sets">
        <input type="text" value="${ex.targetReps!=null?ex.targetReps:''}" onchange="updateExerciseField('${ex.id}','targetReps',this.value)" placeholder="Target reps (e.g. 12–15)">
      </div>
    </div>
  </div>`;
}
// Target / working weight / best logged / status for one exercise — the "backend" numbers
// that used to fill a big table on the dashboard.
function exerciseTargetLineHtml(ex){
  const wk = currentWeekNumber();
  const target = (ex.workingWeight != null && ex.workingWeight !== '') ? workingWeight(ex) : targetForExerciseAtWeek(ex, wk);
  const exLogs = logs.filter(l=>l.exerciseId===ex.id);
  const best = exLogs.reduce((m,l)=> Math.max(m, ...l.sets.map(s=>s.weight||0)), 0);
  let pill;
  if(!exLogs.length) pill = '<span class="pill rest">Not started</span>';
  else if(best >= target) pill = '<span class="pill met">On target</span>';
  else if(best >= target*0.85) pill = '<span class="pill close">Close</span>';
  else pill = '<span class="pill below">Below target</span>';
  const tgtLabel = (ex.workingWeight != null && ex.workingWeight !== '') ? 'Working weight' : 'Target wk ' + wk;
  return `<div class="meta" style="display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;margin-top:3px;">
    <span>${tgtLabel}: <strong style="color:var(--text)">${fmtWeight(ex, target)}</strong></span>
    <span>Best: <strong style="color:var(--text)">${exLogs.length ? fmtWeight(ex, best) : '—'}</strong></span>${pill}</div>`;
}
function toggleRowIconPicker(id){
  openIconPickerId = (openIconPickerId===id) ? null : id;
  renderSettingsExerciseList();
}
function setExerciseIcon(id, iconKey){
  const ex = exercises.find(e=>e.id===id);
  if(!ex) return;
  ex.icon = iconKey;
  saveAll();
  openIconPickerId = null;
  renderSettingsExerciseList();
  renderExerciseList();
  showToast('Icon updated');
}
function updateExerciseField(id, field, value){
  const ex = exercises.find(e=>e.id===id);
  if(!ex) return;
  if(field==='category' || field==='equipment' || field==='targetReps'){
    ex[field] = value; // kept as a string — category/equipment ids, or a rep range like "12–15"
  } else {
    ex[field] = parseFloat(value) || 0;
  }
  saveAll();
  renderSettingsExerciseList();
  renderExerciseList();
  renderDashboard();
  showToast('Updated');
}
function deleteExercise(id){
  const idx = exercises.findIndex(e=>e.id===id); if(idx < 0) return;
  const removed = exercises[idx];
  const membership = WORKOUT_DAYS.map(d=>({ id:d.id, pos:d.lifts.indexOf(id) })).filter(m=>m.pos>=0);
  showUndo(`Deleted ${escapeHtml(removed.name)}`, ()=>{
    exercises.splice(idx, 0, removed);
    membership.forEach(m=>{ const d = WORKOUT_DAYS.find(x=>x.id===m.id); if(d && !d.lifts.includes(id)) d.lifts.splice(m.pos, 0, id); });
    saveAll(); renderSettingsExerciseList(); renderExerciseList(); renderWorkoutDaysSettings();
  });
  exercises = exercises.filter(e=>e.id!==id);
  WORKOUT_DAYS.forEach(d=>{ d.lifts = d.lifts.filter(exId=>exId!==id); }); // drop it from any workout day too
  saveAll();
  renderSettingsExerciseList();
  renderExerciseList();
  renderWorkoutDaysSettings();
  if(selectedExerciseId===id) selectedExerciseId = exercises[0] ? exercises[0].id : null;
}

/* ---- Workout Days — rename, add/remove days, choose which exercises fall under each ---- */
let openDayPickerId = null; // which day's exercise checklist is currently expanded

function renderWorkoutDaysSettings(){
  const box = document.getElementById('workoutDaysList');
  if(!box) return;
  box.innerHTML = WORKOUT_DAYS.map((day, i)=> renderWorkoutDayCard(day, i)).join('') || '<div class="empty">No workout days yet — add one to get started.</div>';
}
function renderWorkoutDayCard(day, index){
  const pickerOpen = openDayPickerId === day.id;
  const picker = pickerOpen ? renderDayExercisePicker(day) : '';
  return `<div class="exercise-card" style="cursor:default;flex-wrap:wrap;flex-direction:column;align-items:stretch;">
    <div class="flex-between" style="width:100%;">
      <div style="display:flex;align-items:center;gap:10px;">
        ${iconBadge({category:day.category})}
        <div>
          <input type="text" class="day-name-input" value="${day.title}" onchange="updateWorkoutDayField('${day.id}','title',this.value)" placeholder="Day name">
          <div class="meta" style="display:flex;align-items:center;gap:5px;">
            <input type="text" class="day-label-input" value="${day.dayLabel!=null?day.dayLabel:'Day '+(index+1)}" onchange="updateWorkoutDayField('${day.id}','dayLabel',this.value)" placeholder="Day 1">
            <span>· ${day.lifts.length} exercise${day.lifts.length!==1?'s':''}</span>
          </div>
        </div>
      </div>
      <button class="icon-btn" onclick="deleteWorkoutDay('${day.id}')">🗑</button>
    </div>
    <div class="row" style="margin-top:10px;">
      <input type="text" value="${day.subtitle||''}" onchange="updateWorkoutDayField('${day.id}','subtitle',this.value)" placeholder="Short description (e.g. Chest, Shoulders, Triceps)">
      <select onchange="updateWorkoutDayField('${day.id}','category',this.value)">
        ${CATEGORIES.map(c=>`<option value="${c.id}"${c.id===day.category?' selected':''}>${c.label}</option>`).join('')}
      </select>
    </div>
    <button class="btn secondary" style="width:100%;margin-top:8px;" onclick="toggleDayExercisePicker('${day.id}')">${pickerOpen?'Hide':'Choose'} exercises for this day ${pickerOpen?'▴':'▾'}</button>
    ${picker}
  </div>`;
}
function renderDayExercisePicker(day){
  const groups = exercisesByCategory(exercises);
  const body = groups.map(g=>{
    const items = g.items.map(ex=>{
      const checked = day.lifts.includes(ex.id);
      return `<label class="check-row"><input type="checkbox" ${checked?'checked':''} onchange="toggleDayExercise('${day.id}','${ex.id}',this.checked)"> ${ex.name}</label>`;
    }).join('');
    return `<div class="category-group-heading" style="color:${g.def.color}"><span class="category-dot" style="background:${g.def.color}"></span>${g.def.label}</div>${items}`;
  }).join('');
  return `<div class="day-exercise-picker">${body || '<div class="empty">No exercises in the library yet.</div>'}</div>`;
}
function toggleDayExercisePicker(id){
  openDayPickerId = (openDayPickerId===id) ? null : id;
  renderWorkoutDaysSettings();
}
function updateWorkoutDayField(id, field, value){
  const day = WORKOUT_DAYS.find(d=>d.id===id);
  if(!day) return;
  day[field] = value;
  saveWorkoutDays();
  renderWorkoutDaysSettings();
  renderPlanView();
  renderCalendar();
  showToast('Updated');
}
function toggleDayExercise(dayId, exId, checked){
  const day = WORKOUT_DAYS.find(d=>d.id===dayId);
  if(!day) return;
  if(checked){
    if(!day.lifts.includes(exId)) day.lifts.push(exId);
  }else{
    day.lifts = day.lifts.filter(id=>id!==exId);
  }
  saveWorkoutDays();
  renderWorkoutDaysSettings();
  renderPlanView(); // the progress bar's segment count updates immediately
  showToast(checked ? 'Added to day' : 'Removed from day');
}
function addWorkoutDay(){
  const day = {
    id: uid(), dayLabel:'Day '+(WORKOUT_DAYS.length+1), title:'New Day', subtitle:'', duration:'60 min', badge:null, category:'fullbody',
    warmup:{ duration:'5 min', description:'General warm-up' },
    lifts:[], finisher:null
  };
  WORKOUT_DAYS.push(day);
  saveWorkoutDays();
  openDayPickerId = day.id;
  renderWorkoutDaysSettings();
  renderPlanView();
  showToast('Day added — name it and choose its exercises');
}
function deleteWorkoutDay(id){
  if(WORKOUT_DAYS.length <= 1){ showToast('Keep at least one workout day'); return; }
  const idx = WORKOUT_DAYS.findIndex(d=>d.id===id); const removed = WORKOUT_DAYS[idx];
  WORKOUT_DAYS = WORKOUT_DAYS.filter(d=>d.id!==id);
  saveWorkoutDays();
  renderWorkoutDaysSettings();
  renderPlanView();
  renderDashboard();
  showUndo(`Deleted ${escapeHtml(removed.title)}`, ()=>{ WORKOUT_DAYS.splice(idx, 0, removed); saveWorkoutDays(); renderWorkoutDaysSettings(); renderPlanView(); renderDashboard(); });
}

/* ---- Add-new-exercise builder (name, 30-icon picker, category, equipment, prescription) ---- */
let builderIconSelected = null;

function toggleExerciseBuilder(){
  const box = document.getElementById('exerciseBuilder');
  const btn = document.getElementById('builderToggleBtn');
  const opening = box.style.display === 'none';
  box.style.display = opening ? 'block' : 'none';
  btn.textContent = opening ? 'Cancel' : '+ Add Exercise';
  if(opening) renderExerciseBuilder();
}
function renderExerciseBuilder(){
  builderIconSelected = null;
  const box = document.getElementById('exerciseBuilder');
  box.innerHTML = `
    <label>Exercise name</label>
    <input type="text" id="builderName" placeholder="e.g. Cable Woodchopper">
    <label>What's it for?</label>
    <select id="builderCategory">${CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('')}</select>
    <label>Equipment</label>
    <select id="builderEquipment">${EQUIPMENT_TYPES.map(e=>`<option value="${e.id}">${e.label}</option>`).join('')}</select>
    <label>How do you track it?</label>
    <select id="builderUnit">
      <option value="lb">Weight (lb)</option>
      <option value="reps">Reps only (bodyweight)</option>
      <option value="seconds">Timed hold (seconds)</option>
    </select>
    <label>Icon — pick one of 30</label>
    <div class="icon-picker" id="builderIconPicker">${PICKABLE_ICON_KEYS.map(k=>
      `<div class="icon-choice" onclick="selectBuilderIcon('${k}')" data-key="${k}" title="${ICON_LIBRARY[k].label}">${ICON_LIBRARY[k].svg}</div>`
    ).join('')}</div>
    <div class="row" style="margin-top:12px;">
      <div><label>Baseline</label><input type="number" id="builderBaseline" placeholder="e.g. 20"></div>
      <div><label>Climb per overload</label><input type="number" id="builderIncrement" value="2.5"></div>
    </div>
    <div class="row" style="margin-top:8px;">
      <div><label>Target sets</label><input type="number" id="builderSets" value="4"></div>
      <div><label>Target reps</label><input type="text" id="builderReps" value="12–15"></div>
    </div>
    <button class="btn" style="width:100%;margin-top:14px;" onclick="saveNewExercise()">Save Exercise</button>
  `;
}
function selectBuilderIcon(key){
  builderIconSelected = key;
  document.querySelectorAll('#builderIconPicker .icon-choice').forEach(el=>{
    el.classList.toggle('selected', el.dataset.key===key);
  });
}
function saveNewExercise(){
  const name = document.getElementById('builderName').value.trim();
  if(!name){ showToast('Enter an exercise name'); return; }
  const category = document.getElementById('builderCategory').value;
  const equipment = document.getElementById('builderEquipment').value;
  const unit = document.getElementById('builderUnit').value;
  const baseline = parseFloat(document.getElementById('builderBaseline').value) || 0;
  const increment = parseFloat(document.getElementById('builderIncrement').value) || 0;
  const targetSets = parseInt(document.getElementById('builderSets').value,10) || 4;
  const targetReps = document.getElementById('builderReps').value.trim() || '12–15';
  const ex = { id: uid(), name, category, equipment, unit, icon: builderIconSelected, baseline, increment, targetSets, targetReps };
  exercises.push(ex);
  saveAll();
  selectedExerciseId = ex.id;
  toggleExerciseBuilder();
  renderSettingsExerciseList();
  renderExerciseList();
  showToast('Exercise added ✓');
}
function saveProfile(){
  profile.height = document.getElementById('profHeight').value;
  profile.weight = parseFloat(document.getElementById('profWeight').value)||profile.weight;
  profile.build = document.getElementById('profBuild').value;
  profile.startDate = document.getElementById('profStartDate').value || profile.startDate;
  profile.showGifs = document.getElementById('profShowGifs').checked;
  profile.showTips = document.getElementById('profShowTips').checked;
  if(profile.showTips === false) hideTip();
  saveAll();
  showToast('Profile saved');
  renderDashboard();
  renderPlanView();
  renderLogView();
}

function exportData(){
  const data = { profile, exercises, logs, activityLogs, workoutDays: WORKOUT_DAYS, sprintSessions, checkins, seenFacts, game, body: bodyLogs, photos: bodyPhotos, daily: dailies, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ironlog-backup-'+todayStr()+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  localStorage.setItem(LS_KEYS.lastBackup, new Date().toISOString());
  renderBackupStatus();
  showToast('Exported');
}
function renderBackupStatus(){
  const el = document.getElementById('backupStatus');
  if(!el) return;
  const last = localStorage.getItem(LS_KEYS.lastBackup);
  if(!last){
    el.style.color = 'var(--warn)';
    el.innerHTML = '⚠️ No backup yet — your data only lives in this browser. Export a copy so a cleared cache or new device can\'t lose it.';
    return;
  }
  const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
  const when = days<=0 ? 'today' : days===1 ? 'yesterday' : days + ' days ago';
  if(days >= 7){
    el.style.color = 'var(--warn)';
    el.innerHTML = `⚠️ Last backup was ${when} — consider exporting a fresh copy.`;
  }else{
    el.style.color = 'var(--accent)';
    el.innerHTML = `✓ Last backup: ${when}.`;
  }
}
function importData(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(data.profile) profile = data.profile;
      if(data.exercises) exercises = data.exercises;
      if(data.logs) logs = data.logs;
      if(data.activityLogs) activityLogs = data.activityLogs;
      if(data.workoutDays) WORKOUT_DAYS = data.workoutDays;
      if(data.sprintSessions) sprintSessions = data.sprintSessions;
      if(data.checkins) checkins = data.checkins;
      if(data.game){ game = data.game; saveGame(); }
      if(data.body){ bodyLogs = data.body; saveBody(); }
      if(data.photos){ bodyPhotos = data.photos; savePhotos(); }
      if(data.daily){ dailies = data.daily; saveDailies(); }
      if(data.seenFacts){ seenFacts = data.seenFacts; save(LS_KEYS.seenFacts, seenFacts); }
      saveAll();
      renderAll();
      showToast('Import complete');
    }catch(e){ showToast('Invalid file'); }
  };
  reader.readAsText(file);
  evt.target.value = '';
}
function resetAllData(){
  if(!confirm('This will erase all logged workouts, exercises, and profile settings. Continue?')) return;
  localStorage.removeItem(LS_KEYS.profile);
  localStorage.removeItem(LS_KEYS.exercises);
  localStorage.removeItem(LS_KEYS.logs);
  localStorage.removeItem(LS_KEYS.todayPlan);
  localStorage.removeItem(LS_KEYS.activityLogs);
  localStorage.removeItem(LS_KEYS.workoutDays);
  localStorage.removeItem(LS_KEYS.sprintSessions);
 localStorage.removeItem(LS_KEYS.sprintProgress);
  localStorage.removeItem(LS_KEYS.checkins);
  localStorage.removeItem(LS_KEYS.prevWorkoutDays);
  checkins = [];
  localStorage.removeItem(LS_KEYS.seenFacts); seenFacts = []; tipCtx = null; hideTip();
  localStorage.removeItem(LS_KEYS.game); localStorage.removeItem(LS_KEYS.freestyle);
  localStorage.removeItem(LS_KEYS.body); localStorage.removeItem(LS_KEYS.photos); bodyLogs = []; bodyPhotos = []; localStorage.removeItem(LS_KEYS.daily); dailies = {};
  game = { xp:0, badges:[], prs:0, sessions:0, tryNew:0, maxCombo:0 }; fs = null; fsSetup = null;
  coachEditing = false; coachDraft = null;
  profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  exercises = JSON.parse(JSON.stringify(DEFAULT_EXERCISES));
  WORKOUT_DAYS = JSON.parse(JSON.stringify(DEFAULT_WORKOUT_DAYS));
  logs = [];
  activityLogs = [];
  sprintSessions = [];
  selectedExerciseId = exercises[0].id;
  saveAll();
  renderAll();
  showToast('All data reset');
}

