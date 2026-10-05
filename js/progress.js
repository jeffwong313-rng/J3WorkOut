/* J3 WorkOut — js/progress.js
   Progress you can see:
   - Personal records board (heaviest weight + best estimated 1-rep max per lift)
   - Strength trend chart (estimated 1RM per session)
   - Body tracking: weigh-ins, measurements, progress photos (stored only on this device)
   - Monthly recap
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Strength math ---------------- */
// Epley estimate of a 1-rep max. Reliable up to ~12 reps; capped at 15 so a 40-rep set doesn't inflate it.
function e1rm(weight, reps){
  if(!weight || !reps) return 0;
  const r = Math.min(reps, 15);
  return r === 1 ? weight : Math.round(weight * (1 + r/30) * 10) / 10;
}
function logBest(ex, l){
  // Best single set in a log: for weighted lifts by estimated 1RM; for reps/seconds by count.
  if(ex.unit === 'lb'){
    let best = null;
    l.sets.forEach(s=>{ const v = e1rm(s.weight, s.reps); if(!best || v > best.e1rm) best = { e1rm:v, weight:s.weight, reps:s.reps }; });
    return best;
  }
  const v = Math.max(...l.sets.map(s=> s.weight || s.reps || 0));
  return { e1rm:v, weight:v, reps:null };
}
// Per-exercise session history: one point per day (best set that day).
function strengthSeries(exId){
  const ex = exercises.find(e=>e.id===exId); if(!ex) return [];
  const byDate = {};
  logs.filter(l=>l.exerciseId===exId && l.sets && l.sets.length).forEach(l=>{
    const b = logBest(ex, l); if(!b) return;
    const top = Math.max(...l.sets.map(s=> ex.unit==='lb' ? s.weight||0 : (s.weight||s.reps||0)));
    const cur = byDate[l.date];
    if(!cur || b.e1rm > cur.e1rm) byDate[l.date] = { date:l.date, e1rm:b.e1rm, set:b, top: Math.max(top, cur ? cur.top : 0) };
    else cur.top = Math.max(cur.top, top);
  });
  return Object.values(byDate).sort((a,b)=> a.date.localeCompare(b.date));
}
// PR timeline for one exercise: every date where the heaviest weight or the best e1RM went up.
function prEvents(exId){
  const series = strengthSeries(exId);
  const out = []; let bestTop = 0, bestE = 0;
  series.forEach((p,i)=>{
    const kinds = [];
    if(i > 0 && p.top > bestTop) kinds.push('weight');
    if(i > 0 && p.e1rm > bestE) kinds.push('e1rm');
    if(kinds.length) out.push({ date:p.date, kinds, top:p.top, e1rm:p.e1rm, set:p.set });
    bestTop = Math.max(bestTop, p.top); bestE = Math.max(bestE, p.e1rm);
  });
  return out;
}
function prBoard(){
  return exercises.map(ex=>{
    const s = strengthSeries(ex.id); if(!s.length) return null;
    const best = s.reduce((a,b)=> b.e1rm > a.e1rm ? b : a);
    const heaviest = s.reduce((a,b)=> b.top > a.top ? b : a);
    const evs = prEvents(ex.id);
    const lastPr = evs.length ? evs[evs.length-1].date : s[0].date;
    return { ex, best, heaviest, sessions:s.length, lastPr, isNew: evs.length && lastPr >= addDaysToDateStr(todayStr(), -7) };
  }).filter(Boolean).sort((a,b)=> b.lastPr.localeCompare(a.lastPr) || b.sessions - a.sessions);
}

/* ---------------- Simple SVG line chart (theme-aware) ---------------- */
function lineChartSvg(series, opts){
  // series: [{ points:[{x:label, y:number}], color:'var(--accent)', dashed:bool, name }]
  opts = opts || {};
  const w = 640, h = opts.height || 220, padL = 44, padR = 12, padT = 12, padB = 28;
  const all = series.flatMap(s=>s.points.map(p=>p.y)).filter(v=>v!=null);
  if(!all.length) return '<div class="empty">No data yet.</div>';
  const n = Math.max(...series.map(s=>s.points.length));
  let lo = Math.min(...all), hi = Math.max(...all);
  if(lo === hi){ lo -= 5; hi += 5; }
  const span = hi - lo; lo = Math.max(0, lo - span*0.12); hi = hi + span*0.12;
  const xFor = i => padL + (n <= 1 ? (w-padL-padR)/2 : i/(n-1) * (w-padL-padR));
  const yFor = v => (h-padB) - (v-lo)/(hi-lo) * (h-padT-padB);
  let grid = '';
  for(let g=0; g<=4; g++){
    const v = lo + (hi-lo)*g/4, y = yFor(v);
    grid += `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" style="stroke:var(--border)" stroke-width="1"/><text x="6" y="${y+4}" font-size="11" style="fill:var(--text-dim)">${Math.round(v)}</text>`;
  }
  const labels = series[0].points;
  const every = Math.max(1, Math.ceil(labels.length / 6));
  const xl = labels.map((p,i)=> (i % every === 0 || i === labels.length-1) ? `<text x="${xFor(i)}" y="${h-8}" font-size="11" text-anchor="middle" style="fill:var(--text-dim)">${p.x}</text>` : '').join('');
  const paths = series.map(s=>{
    const pts = s.points.map((p,i)=> p.y==null ? null : [xFor(i), yFor(p.y)]).filter(Boolean);
    const d = pts.map((p,i)=> (i?'L':'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const dots = pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" style="fill:${s.color}"/>`).join('');
    return `<path d="${d}" fill="none" style="stroke:${s.color}" stroke-width="2.5" ${s.dashed?'stroke-dasharray="5,4"':''}/>${s.dashed?'':dots}`;
  }).join('');
  const legend = series.length > 1 ? `<div class="chart-legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>` : '';
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:100%;display:block;">${grid}${paths}${xl}</svg>${legend}`;
}
function shortDate(d){ return new Date(d+'T00:00:00').toLocaleDateString(undefined,{ month:'short', day:'numeric' }); }

/* ---------------- Progress page: records + trend + recap ---------------- */
let prShowAll = false;
let recapMonth = null; // 'YYYY-MM'
let trendExId = null;
function renderProgressExtras(){
  const box = document.getElementById('progressExtras'); if(!box) return;
  const board = prBoard();
  const loggedEx = board.map(r=>r.ex);
  if(!trendExId || !loggedEx.some(e=>e.id===trendExId)) trendExId = loggedEx[0] ? loggedEx[0].id : null;
  // Strength trend
  let trend = '<div class="empty">Log a lift to see your strength trend.</div>';
  if(trendExId){
    const ex = exercises.find(e=>e.id===trendExId);
    const s = strengthSeries(trendExId);
    const first = s[0], last = s[s.length-1];
    const change = last.e1rm - first.e1rm;
    const pct = first.e1rm ? Math.round(change / first.e1rm * 100) : 0;
    const series = ex.unit === 'lb'
      ? [ { name:'Estimated 1-rep max', color:'var(--accent)', points: s.map(p=>({ x:shortDate(p.date), y:p.e1rm })) },
          { name:'Heaviest set', color:'var(--accent2)', points: s.map(p=>({ x:shortDate(p.date), y:p.top })) } ]
      : [ { name: ex.unit==='seconds' ? 'Longest hold (sec)' : 'Most reps', color:'var(--accent)', points: s.map(p=>({ x:shortDate(p.date), y:p.e1rm })) } ];
    trend = `<div class="trend-stats">
        <div><strong>${ex.unit==='lb' ? Math.round(last.e1rm) + ' lb' : fmtWeight(ex, last.e1rm)}</strong><span>${ex.unit==='lb' ? 'est. 1-rep max now' : 'best now'}</span></div>
        <div><strong style="color:${change>=0?'var(--accent)':'var(--danger)'}">${change>=0?'+':''}${Math.round(change*10)/10}${ex.unit==='lb'?' lb':''}</strong><span>since ${shortDate(first.date)}${pct?` (${pct>0?'+':''}${pct}%)`:''}</span></div>
        <div><strong>${s.length}</strong><span>sessions</span></div>
      </div>
      ${lineChartSvg(series)}
      ${ex.unit==='lb' ? '<div class="hint" style="margin-top:6px;">Estimated 1-rep max = what you could probably lift once, calculated from your best set (Epley formula). You never have to test it — it just lets sets of different reps be compared.</div>' : ''}`;
  }
  // PR board
  const rows = (prShowAll ? board : board.slice(0, 8)).map(r=>{
    const ex = r.ex;
    const bestTxt = ex.unit === 'lb' ? `${r.best.set.reps} × ${r.best.set.weight} lb <span class="pr-e1rm">≈ ${Math.round(r.best.e1rm)} lb 1RM</span>` : fmtWeight(ex, r.best.e1rm);
    return `<div class="pr-row" onclick="trendExId='${ex.id}'; renderProgressExtras(); document.getElementById('trendCard').scrollIntoView({behavior:'smooth'});">
      ${iconBadge(ex,'sm')}
      <div class="pr-main"><div class="pr-name">${escapeHtml(ex.name)} ${r.isNew?'<span class="pr-new">🏆 NEW</span>':''}</div>
        <div class="hint" style="margin:0;">Heaviest ${fmtWeight(ex, r.heaviest.top)} · ${r.sessions} session${r.sessions!==1?'s':''} · last PR ${shortDate(r.lastPr)}</div></div>
      <div class="pr-best">${bestTxt}</div>
    </div>`;
  }).join('');
  box.innerHTML = `
    ${monthlyRecapHtml()}
    <div class="card" style="margin-bottom:16px;" id="trendCard">
      <div class="flex-between" style="flex-wrap:wrap;gap:8px;">
        <h2>Strength trend</h2>
        ${loggedEx.length ? `<select style="width:auto;max-width:60%;" onchange="trendExId=this.value; renderProgressExtras();">${loggedEx.map(e=>`<option value="${e.id}"${e.id===trendExId?' selected':''}>${escapeHtml(e.name)}</option>`).join('')}</select>` : ''}
      </div>
      ${trend}
    </div>
    <div class="card" style="margin-bottom:16px;">
      <h2>🏆 Personal records</h2>
      <div class="hint">Your best set for every lift you've logged. Tap one to see its trend. 🏆 NEW = a record set in the last 7 days.</div>
      ${rows || '<div class="empty">No lifts logged yet.</div>'}
      ${board.length > 8 ? `<button class="btn ghost" style="width:100%;margin-top:10px;" onclick="prShowAll=!prShowAll; renderProgressExtras();">${prShowAll ? 'Show fewer' : `Show all ${board.length}`}</button>` : ''}
    </div>`;
}

/* ---------------- Monthly recap ---------------- */
function monthKey(d){ return d.slice(0,7); }
function monthLabel(ym){ return new Date(ym+'-01T00:00:00').toLocaleDateString(undefined,{ month:'long', year:'numeric' }); }
function shiftMonth(ym, delta){ const d = new Date(ym+'-01T00:00:00'); d.setMonth(d.getMonth()+delta); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
function monthRecap(ym){
  const inM = d => d && d.slice(0,7) === ym;
  const mLogs = logs.filter(l=>inM(l.date));
  const mAct = activityLogs.filter(a=>inM(a.date));
  const mSprints = sprintSessions.filter(s=>inM(s.date));
  const days = new Set([...mLogs.map(l=>l.date), ...mAct.map(a=>a.date), ...mSprints.map(s=>s.date)]);
  const sets = mLogs.reduce((t,l)=>t+l.sets.length, 0);
  const volume = mLogs.reduce((t,l)=> t + l.sets.reduce((s,st)=> s + (st.reps*st.weight||0), 0), 0);
  // first-ever log per exercise falls in this month → discovery
  const firstDates = {};
  logs.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(l=>{ if(!firstDates[l.exerciseId]) firstDates[l.exerciseId] = l.date; });
  const discoveries = Object.entries(firstDates).filter(([id,d])=>inM(d)).map(([id])=>id);
  const prs = exercises.flatMap(ex=> prEvents(ex.id).filter(e=>inM(e.date)).map(e=>({ ex, e })));
  // consistency vs plan
  let planned = 0, hit = 0;
  if(coachOn()){
    const start = ym + '-01';
    for(let d = start; d.slice(0,7) === ym && d <= todayStr(); d = addDaysToDateStr(d, 1)){
      const st = dateStatus(d);
      if(st.status === 'done' || st.status === 'missed' || (st.status === 'today' && didTrainOn(d))){ planned++; if(st.status === 'done') hit++; }
    }
  }
  // busiest muscle groups
  const byMuscle = {};
  mLogs.forEach(l=>{ const ex = exercises.find(e=>e.id===l.exerciseId); const m = ex && fsMuscleOf(ex); if(m) byMuscle[m] = (byMuscle[m]||0) + l.sets.length; });
  const topMuscles = Object.entries(byMuscle).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([m,n])=>({ m, n }));
  const weighIns = bodyLogs.filter(b=>inM(b.date) && b.weight).sort((a,b)=>a.date.localeCompare(b.date));
  const bodyChange = weighIns.length >= 2 ? Math.round((weighIns[weighIns.length-1].weight - weighIns[0].weight)*10)/10 : null;
  const xp = (game.xpByMonth || {})[ym] || 0;
  const freestyle = new Set(mLogs.filter(l=>l.dayId==='freestyle').map(l=>l.date)).size;
  const vacation = mAct.filter(a=>a.activityId==='vacation').length;
  return { ym, days:days.size, sets, volume, discoveries, prs, planned, hit, topMuscles, bodyChange, xp, freestyle, vacation, mobility: mAct.filter(a=>a.activityId==='mobility').length };
}
function monthlyRecapHtml(){
  if(!recapMonth) recapMonth = monthKey(todayStr());
  const r = monthRecap(recapMonth);
  const isCurrent = recapMonth === monthKey(todayStr());
  const tile = (big, label, color) => `<div class="recap-tile"><strong${color?` style="color:${color}"`:''}>${big}</strong><span>${label}</span></div>`;
  const consistency = r.planned ? Math.round(r.hit / r.planned * 100) : null;
  const highlights = [];
  if(r.prs.length) highlights.push(`📈 <strong>${r.prs.length} personal record${r.prs.length>1?'s':''}</strong> — ${[...new Set(r.prs.map(p=>p.ex.name))].slice(0,3).map(escapeHtml).join(', ')}${new Set(r.prs.map(p=>p.ex.name)).size>3?'…':''}`);
  if(r.discoveries.length) highlights.push(`🆕 <strong>${r.discoveries.length} new exercise${r.discoveries.length>1?'s':''}</strong> discovered`);
  if(r.topMuscles.length) highlights.push(`💪 Most trained: ${r.topMuscles.map(t=>`${fsMuscleDef(t.m)?fsMuscleDef(t.m).label:t.m} (${t.n} sets)`).join(', ')}`);
  if(r.freestyle || r.vacation || r.mobility) highlights.push(`🎲 ${r.freestyle} Freestyle · 🌴 ${r.vacation} vacation circuit${r.vacation!==1?'s':''} · 🧘 ${r.mobility} mobility session${r.mobility!==1?'s':''}`);
  if(r.bodyChange != null) highlights.push(`⚖️ Bodyweight ${r.bodyChange>0?'+':''}${r.bodyChange} lb this month`);
  return `<div class="card recap-card" style="margin-bottom:16px;">
    <div class="flex-between">
      <button class="btn ghost" onclick="recapMonth=shiftMonth(recapMonth,-1); renderProgressExtras();" aria-label="Previous month">←</button>
      <div style="text-align:center;"><div class="hint" style="margin:0;text-transform:uppercase;letter-spacing:.06em;font-weight:800;font-size:10.5px;">${isCurrent?'Month so far':'Monthly recap'}</div><h2 style="margin:0;">${monthLabel(recapMonth)}</h2></div>
      <button class="btn ghost" onclick="recapMonth=shiftMonth(recapMonth,1); renderProgressExtras();" ${isCurrent?'disabled':''} aria-label="Next month">→</button>
    </div>
    <div class="recap-grid">
      ${tile(r.days, 'days trained')}
      ${tile(consistency!=null ? consistency+'%' : '—', 'of planned sessions', consistency!=null && consistency>=80 ? 'var(--accent)' : null)}
      ${tile(r.sets, 'sets')}
      ${tile(Math.round(r.volume).toLocaleString(), 'lb moved')}
      ${tile(r.prs.length, 'PRs', r.prs.length ? 'var(--warn)' : null)}
      ${tile('+' + r.xp, 'XP earned', 'var(--warn)')}
    </div>
    ${highlights.length ? `<div class="recap-highlights">${highlights.map(h=>`<div>${h}</div>`).join('')}</div>` : `<div class="empty" style="padding:10px 0;">Nothing logged ${isCurrent?'yet this month — today\'s a great day to start':'this month'}.</div>`}
  </div>`;
}
// Home banner during the first days of a month.
function recapBannerHtml(){
  const t = todayStr();
  if(+t.slice(8) > 5) return '';
  const prev = shiftMonth(monthKey(t), -1);
  const r = monthRecap(prev);
  if(!r.days) return '';
  if((profile.recapSeen || '') === prev) return '';
  return `<div class="card recap-banner" style="margin-bottom:16px;">
    <div class="flex-between" style="gap:10px;flex-wrap:wrap;">
      <div><strong>📆 Your ${monthLabel(prev)} recap is ready</strong><div class="hint" style="margin:0;">${r.days} days trained · ${r.prs.length} PRs · +${r.xp} XP</div></div>
      <div class="row" style="flex:0 0 auto;gap:8px;"><button class="btn ghost" onclick="profile.recapSeen='${prev}'; saveAll(); renderDashboard();">Dismiss</button>
      <button class="btn" onclick="profile.recapSeen='${prev}'; saveAll(); recapMonth='${prev}'; switchView('progress');">See recap →</button></div>
    </div>
  </div>`;
}

/* ---------------- Body: weigh-ins, measurements, photos ---------------- */
let bodyLogs = loadJSON(LS_KEYS.body, []);     // [{id,date,weight,waist,chest,arms,thighs}]
let bodyPhotos = loadJSON(LS_KEYS.photos, []); // [{id,date,data(dataURL),note}]
function saveBody(){ save(LS_KEYS.body, bodyLogs); }
function savePhotos(){
  try{ save(LS_KEYS.photos, bodyPhotos); return true; }
  catch(e){ showToast('Phone storage for photos is full — delete a few old photos first'); return false; }
}
const BODY_FIELDS = [
  { id:'weight', label:'Weight', unit:'lb', step:0.1 },
  { id:'waist',  label:'Waist',      unit:'in', step:0.25 },
  { id:'chest',  label:'Chest',      unit:'in', step:0.25 },
  { id:'arms',   label:'Arm (flexed)', unit:'in', step:0.25 },
  { id:'thighs', label:'Thigh',      unit:'in', step:0.25 }
];
let bodyChartField = 'weight';
let photoCompare = [];
function saveBodyEntry(){
  const date = document.getElementById('bodyDate').value || todayStr();
  const entry = { id: uid(), date };
  let any = false;
  BODY_FIELDS.forEach(f=>{ const v = parseFloat(document.getElementById('body_'+f.id).value); if(v > 0){ entry[f.id] = v; any = true; } });
  if(!any){ showToast('Enter at least one number'); return; }
  bodyLogs = bodyLogs.filter(b=>b.date !== date).concat(Object.assign({}, bodyLogs.find(b=>b.date===date) || {}, entry));
  bodyLogs.sort((a,b)=>a.date.localeCompare(b.date));
  if(entry.weight && date >= (bodyLogs.filter(b=>b.weight).slice(-1)[0] || {date:''}).date){ profile.weight = entry.weight; saveAll(); }
  saveBody();
  if(typeof gainXP === 'function'){ gainXP(5); saveGame(); }
  showToast('Saved ✓ +5 XP');
  renderBody();
}
function deleteBodyEntry(id){
  const idx = bodyLogs.findIndex(b=>b.id===id); const removed = bodyLogs[idx];
  bodyLogs.splice(idx,1); saveBody(); renderBody();
  showUndo('Entry deleted', ()=>{ bodyLogs.splice(idx,0,removed); saveBody(); renderBody(); });
}
function addProgressPhoto(input){
  const file = input.files && input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const img = new Image();
    img.onload = ()=>{
      // Downscale so dozens of photos fit in the browser's storage.
      const max = 520, scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width*scale); c.height = Math.round(img.height*scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.7);
      const date = document.getElementById('photoDate').value || todayStr();
      bodyPhotos.push({ id: uid(), date, data });
      bodyPhotos.sort((a,b)=>a.date.localeCompare(b.date));
      if(!savePhotos()){ bodyPhotos = bodyPhotos.filter(p=>p.data !== data); }
      else showToast('Photo saved on this device');
      renderBody();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}
function deletePhoto(id){
  const idx = bodyPhotos.findIndex(p=>p.id===id); const removed = bodyPhotos[idx];
  bodyPhotos.splice(idx,1); savePhotos(); photoCompare = photoCompare.filter(x=>x!==id); renderBody();
  showUndo('Photo deleted', ()=>{ bodyPhotos.splice(idx,0,removed); savePhotos(); renderBody(); });
}
function togglePhotoCompare(id){
  if(photoCompare.includes(id)) photoCompare = photoCompare.filter(x=>x!==id);
  else photoCompare = photoCompare.concat(id).slice(-2);
  renderBody();
}
function renderBody(){
  const box = document.getElementById('bodyMain'); if(!box) return;
  const latest = {}; BODY_FIELDS.forEach(f=>{ const e = bodyLogs.filter(b=>b[f.id]).slice(-1)[0]; latest[f.id] = e ? e[f.id] : null; });
  const f = BODY_FIELDS.find(x=>x.id===bodyChartField);
  const pts = bodyLogs.filter(b=>b[f.id]);
  const firstV = pts[0], lastV = pts[pts.length-1];
  const change = pts.length >= 2 ? Math.round((lastV[f.id] - firstV[f.id])*100)/100 : null;
  const chart = pts.length ? lineChartSvg([{ name:f.label, color:'var(--accent)', points: pts.map(p=>({ x:shortDate(p.date), y:p[f.id] })) }], { height:200 }) : '<div class="empty">No entries yet.</div>';
  const history = bodyLogs.slice().reverse().slice(0, 30).map(b=>`<tr><td>${shortDate(b.date)}</td>${BODY_FIELDS.map(x=>`<td>${b[x.id]!=null?b[x.id]:'—'}</td>`).join('')}<td><button class="icon-btn" onclick="deleteBodyEntry('${b.id}')" aria-label="Delete">🗑</button></td></tr>`).join('');
  const cmp = photoCompare.map(id=>bodyPhotos.find(p=>p.id===id)).filter(Boolean);
  box.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h2>⚖️ Log a weigh-in</h2>
      <div class="hint">Weigh yourself first thing in the morning, after the bathroom, before eating — same time each week makes the trend honest. Measurements are optional; a tape measure catches changes the scale misses (losing fat while gaining muscle).</div>
      <div class="body-form">
        <div><label>Date</label><input type="date" id="bodyDate" value="${todayStr()}"></div>
        ${BODY_FIELDS.map(x=>`<div><label>${x.label} (${x.unit})</label><input type="number" inputmode="decimal" step="${x.step}" id="body_${x.id}" placeholder="${latest[x.id]!=null?latest[x.id]:''}"></div>`).join('')}
      </div>
      <button class="btn" style="width:100%;margin-top:12px;" onclick="saveBodyEntry()">Save</button>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="flex-between" style="flex-wrap:wrap;gap:8px;">
        <h2>Trend</h2>
        <div class="seg-row" style="flex:0 1 auto;">${BODY_FIELDS.map(x=>`<button class="seg-btn${x.id===bodyChartField?' active':''}" style="min-width:0;padding:7px 9px;" onclick="bodyChartField='${x.id}'; renderBody();">${x.label.replace(' (flexed)','')}</button>`).join('')}</div>
      </div>
      ${change!=null ? `<div class="hint" style="margin-top:8px;"><strong style="color:var(--text)">${change>0?'+':''}${change} ${f.unit}</strong> since ${shortDate(firstV.date)} · latest ${lastV[f.id]} ${f.unit}</div>` : ''}
      ${chart}
      ${history ? `<div class="mdb-wrap" style="margin-top:12px;max-height:280px;"><table><thead><tr><th>Date</th>${BODY_FIELDS.map(x=>`<th>${x.label.replace(' (flexed)','')}</th>`).join('')}<th></th></tr></thead><tbody>${history}</tbody></table></div>` : ''}
    </div>
    <div class="card">
      <div class="flex-between" style="flex-wrap:wrap;gap:8px;">
        <div><h2>📸 Progress photos</h2><div class="hint" style="margin-bottom:0;">Stored only on this device (never uploaded). Same spot, lighting and pose every 2–4 weeks. Tap two photos to compare side by side.</div></div>
        <div class="row" style="flex:0 0 auto;gap:8px;align-items:center;">
          <input type="date" id="photoDate" value="${todayStr()}" style="width:auto;">
          <button class="btn" onclick="document.getElementById('photoInput').click()">+ Add photo</button>
        </div>
        <input type="file" id="photoInput" accept="image/*" style="display:none" onchange="addProgressPhoto(this)">
      </div>
      ${cmp.length === 2 ? `<div class="photo-compare">${cmp.map(p=>`<figure><img src="${p.data}" alt="Progress photo ${p.date}"><figcaption>${shortDate(p.date)}</figcaption></figure>`).join('')}</div>` : ''}
      <div class="photo-grid">${bodyPhotos.slice().reverse().map(p=>`<div class="photo-tile${photoCompare.includes(p.id)?' sel':''}">
          <img src="${p.data}" alt="Progress photo ${p.date}" onclick="togglePhotoCompare('${p.id}')">
          <div class="photo-meta"><span>${shortDate(p.date)}</span><button class="icon-btn" onclick="deletePhoto('${p.id}')" aria-label="Delete photo">🗑</button></div>
        </div>`).join('') || '<div class="empty">No photos yet.</div>'}</div>
    </div>`;
}
