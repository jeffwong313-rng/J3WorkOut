/* J3 WorkOut — js/polish.js
   Appearance (light / dark / auto theme, text size) and the first-run tour.
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Theme & text size ---------------- */
const TEXT_SIZES = { normal:1, large:1.1, xl:1.22 };
const _darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function resolvedTheme(){
  const t = profile.theme || 'dark';
  if(t === 'auto') return _darkQuery && !_darkQuery.matches ? 'light' : 'dark';
  return t;
}
function applyAppearance(){
  const root = document.documentElement;
  const theme = resolvedTheme();
  root.dataset.theme = theme;
  root.style.zoom = TEXT_SIZES[profile.textSize || 'normal'] || 1;
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', theme === 'light' ? '#f4f5f8' : '#0f1115');
}
if(_darkQuery && _darkQuery.addEventListener) _darkQuery.addEventListener('change', ()=>{ if(profile.theme === 'auto') applyAppearance(); });
function setTheme(t){ profile.theme = t; saveAll(); applyAppearance(); renderAppearanceSettings(); }
function setTextSize(s){ profile.textSize = s; saveAll(); applyAppearance(); renderAppearanceSettings(); }
function renderAppearanceSettings(){
  const box = document.getElementById('appearanceBox'); if(!box) return;
  const t = profile.theme || 'dark', z = profile.textSize || 'normal';
  const seg = (items, cur, fn) => `<div class="seg-row">${items.map(([v,l])=>`<button type="button" class="seg-btn${cur===v?' active':''}" onclick="${fn}('${v}')">${l}</button>`).join('')}</div>`;
  box.innerHTML = `
    <label>Theme</label>${seg([['dark','🌙 Dark'],['light','☀️ Light'],['auto','🌓 Match phone']], t, 'setTheme')}
    <label>Text size</label>${seg([['normal','A'],['large','A+'],['xl','A++']], z, 'setTextSize')}
    <div class="hint" style="margin-top:8px;">Light mode is easier to read in bright gyms; larger text helps mid-set.</div>
    <button class="btn secondary" style="width:100%;margin-top:12px;" onclick="startTour()">🧭 Show the app tour again</button>`;
}

/* ---------------- First-run tour ---------------- */
const TOUR_STEPS = [
  { target:null, title:'Welcome to J3 WorkOut 👋', body:'Your pocket personal trainer. A 30-second tour of where everything lives — you can replay it anytime from Me → Settings.' },
  { target:'[data-group="home"]', title:'🏠 Home', body:'Your day at a glance: this week\'s plan, today\'s workout (or rest-day ideas), daily habits and a tip of the day. Start here every day.' },
  { target:'[data-group="train"]', title:'🏋️ Train', body:'Today\'s guided workout, 🎲 Freestyle when you want to mix it up, 🌴 the no-gym Vacation circuit, 🧘 mobility, warm-up and sprints.' },
  { target:'[data-group="track"]', title:'📈 Track', body:'Personal records, strength trends, your monthly recap, body weight & progress photos, calendar and full history.' },
  { target:'[data-group="me"]', title:'👤 Me', body:'Your plan, working weights and tips you\'ve learned — plus settings, the muscle database and backups. Export a backup every week or two!' },
  { target:null, title:'One habit to start', body:'Open the app, check in (10 seconds), and do what Home tells you. The plan adjusts to you — consistency does the rest.', final:true }
];
let tourIdx = -1;
function startTour(){ tourIdx = 0; switchView('dashboard'); setTimeout(renderTour, 60); }
function endTour(){
  tourIdx = -1; profile.tourDone = true; saveAll();
  const el = document.getElementById('tourLayer'); if(el) el.innerHTML = '';
  document.body.classList.remove('touring');
}
function tourNext(){ tourIdx++; if(tourIdx >= TOUR_STEPS.length){ endTour(); return; } renderTour(); }
function tourBack(){ tourIdx = Math.max(0, tourIdx-1); renderTour(); }
function renderTour(){
  const layer = document.getElementById('tourLayer'); if(!layer || tourIdx < 0) return;
  document.body.classList.add('touring');
  layer.style.zoom = 1 / (parseFloat(document.documentElement.style.zoom) || 1); // keep the overlay at normal scale
  const step = TOUR_STEPS[tourIdx];
  let spot = '', cardStyle = 'left:50%;top:50%;transform:translate(-50%,-50%);';
  if(step.target){
    const t = document.querySelector('#mainNav ' + step.target);
    if(t){
      // The tour layer cancels the page's text-size zoom (see below), so on-screen rects can be used as-is.
      const r = t.getBoundingClientRect();
      const x = r.left, y = r.top, w = r.width, h = r.height;
      spot = `<div class="tour-spot" style="left:${x-4}px;top:${y-4}px;width:${w+8}px;height:${h+8}px;"></div>`;
      cardStyle = `left:50%;top:${(y + h + 18)}px;transform:translateX(-50%);`;
    }
  }
  const noCoach = step.final && !coachOn();
  layer.innerHTML = `${spot || '<div class="tour-dim"></div>'}
    <div class="tour-card" style="${cardStyle}" role="dialog" aria-label="App tour">
      <div class="tour-dots">${TOUR_STEPS.map((_,i)=>`<span class="${i===tourIdx?'on':''}"></span>`).join('')}</div>
      <h2>${step.title}</h2>
      <div class="tour-body">${step.body}</div>
      <div class="wizard-actions">
        ${tourIdx === 0 ? '<button class="btn ghost" onclick="endTour()">Skip</button>' : '<button class="btn ghost" onclick="tourBack()">← Back</button>'}
        ${noCoach ? '<button class="btn" onclick="endTour(); startCoachSetup();">Build my plan →</button>' : `<button class="btn" onclick="tourNext()">${step.final ? 'Let\'s go 💪' : 'Next →'}</button>`}
      </div>
    </div>`;
}
window.addEventListener('resize', ()=>{ if(tourIdx >= 0) renderTour(); });
function maybeStartTour(){
  if(profile.tourDone || (typeof TEST_MODE !== 'undefined' && TEST_MODE)) return;
  // Existing users who already have data skip the auto tour (they can replay it from Settings).
  if(logs.length || coachOn()){ profile.tourDone = true; saveAll(); return; }
  setTimeout(startTour, 500);
}
