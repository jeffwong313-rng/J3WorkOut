/* J3 WorkOut — js/bands.js
   Resistance band training: an animated demo for every band exercise (original stick-figure
   loops — the band is drawn in orange so you can see where it's anchored and how it stretches),
   setup + coaching cues, a "watch a video" link, and the Resistance Bands page.
   Loaded as a classic <script> in index.html order (after freestyle.js, coach.js, muscledb.js). */

/* ---------------- Animated demos ----------------
   Each demo is two poses of a stick figure; the figure eases from pose A to B and back.
   Points: H head · S shoulder · P hip · E/W elbow/wrist · E2/W2 second arm · K/F knee/foot · K2/F2 second leg.
   bands: lines drawn in band color between points (A/A2 = fixed anchors like a door or post).
   loops: a mini-band loop drawn around a point (e.g. knees). */
const BAND_DEMOS = {
  bandsquat: { title:'Stand on the band, sit back and down, drive up', bands:[['F','W']],
    a:{ H:[50,13], S:[50,23], P:[50,53], K:[53,72], F:[50,92], E:[58,30], W:[56,21] },
    b:{ H:[46,28], S:[45,37], P:[36,63], K:[57,69], F:[50,92], E:[53,44], W:[51,35] } },
  bandcalfraise: { title:'Rise high onto your toes, lower slowly', bands:[['F','W']],
    a:{ H:[50,15], S:[50,25], P:[50,55], K:[50,74], F:[50,92], E:[52,39], W:[53,52] },
    b:{ H:[50,9],  S:[50,19], P:[50,49], K:[50,68], F:[50,88], E:[52,33], W:[53,46] } },
  bandlegcurl: { title:'Lying face down, curl your heel toward your glutes', anchor:'A', bands:[['A','F']],
    a:{ A:[98,90], H:[10,82], S:[18,86], P:[48,88], K:[68,90], F:[88,90], E:[14,92], W:[24,92] },
    b:{ K:[68,90], F:[60,68] } },
  bandrdl: { title:'Push your hips back, flat back, stand tall', bands:[['F','W']],
    a:{ H:[50,13], S:[50,23], P:[50,53], K:[51,72], F:[50,92], E:[51,37], W:[52,51] },
    b:{ H:[73,30], S:[66,36], P:[41,54], K:[48,72], F:[50,92], E:[66,49], W:[66,62] } },
  bandglutebridge: { title:'Drive your hips up, push knees out against the band', loops:['K'],
    a:{ H:[16,82], S:[24,85], P:[50,87], K:[64,70], F:[76,92], E:[34,89], W:[44,91] },
    b:{ P:[50,72], K:[66,66] } },
  bandlateralwalk: { title:'Half-squat, step wide, keep tension on the band', bands:[['K','K2']],
    a:{ H:[46,20], S:[46,30], P:[46,56], E:[38,42], W:[44,50], E2:[54,42], W2:[48,50], K:[40,73], F:[38,92], K2:[54,73], F2:[56,92] },
    b:{ H:[54,20], S:[54,30], P:[54,56], E:[46,42], W:[52,50], E2:[62,42], W2:[56,50], K:[46,73], F:[42,92], K2:[66,73], F2:[72,92] } },
  bandkickback: { title:'On all fours, kick your heel back and up', bands:[['W','F2']],
    a:{ H:[22,50], S:[30,57], P:[60,58], E:[30,72], W:[30,90], K:[60,90], F:[80,91], K2:[61,88], F2:[80,88] },
    b:{ K2:[82,56], F2:[97,44] } },
  bandclamshell: { title:'Lying on your side, open the top knee like a clamshell', loops:['K','K2'],
    a:{ H:[14,74], S:[24,79], P:[52,82], E:[14,86], W:[10,78], K:[66,72], F:[56,90], K2:[66,70], F2:[56,88] },
    b:{ K2:[62,54] } },
  bandchestpress: { title:'Band anchored behind you — press forward, control back', anchor:'A', bands:[['A','W']],
    a:{ A:[8,32], H:[50,13], S:[50,23], P:[50,53], E:[39,31], W:[52,30], K:[44,72], F:[40,92], K2:[56,72], F2:[61,92] },
    b:{ E:[62,25], W:[75,25] } },
  bandpushup: { title:'Band across your upper back, hands on the ends — push up', bands:[['W','S']],
    a:{ H:[85,49], S:[76,56], P:[45,73], K:[30,83], F:[14,92], E:[76,74], W:[76,92] },
    b:{ H:[86,72], S:[77,78], P:[45,85], K:[30,88], F:[14,92], E:[62,84], W:[76,92] } },
  bandfly: { title:'Arms wide, hug a big tree, squeeze your chest', anchor:'A', bands:[['A','W'],['A2','W2']],
    a:{ A:[2,28], A2:[98,28], H:[50,13], S:[50,23], P:[50,53], E:[35,26], W:[21,30], E2:[65,26], W2:[79,30], K:[44,72], F:[42,92], K2:[56,72], F2:[58,92] },
    b:{ E:[40,29], W:[48,32], E2:[60,29], W2:[52,32] } },
  bandrow: { title:'Seated, band around your feet — row to your belly', bands:[['F','W']],
    a:{ H:[40,48], S:[40,58], P:[40,86], E:[54,64], W:[68,70], K:[60,84], F:[82,88] },
    b:{ E:[29,66], W:[43,68] } },
  bandpulldown: { title:'Kneel, band anchored high — pull elbows down to your sides', anchor:'A', bands:[['A','W'],['A','W2']],
    a:{ A:[50,-6], H:[50,24], S:[50,34], P:[50,62], E:[40,20], W:[36,8], E2:[60,20], W2:[64,8], K:[44,80], F:[44,92], K2:[56,80], F2:[56,92] },
    b:{ E:[37,42], W:[36,29], E2:[63,42], W2:[64,29] } },
  bandpullapart: { title:'Arms straight, pull the band apart to your chest', bands:[['W','W2']],
    a:{ H:[50,13], S:[50,23], P:[50,53], E:[45,29], W:[42,30], E2:[55,29], W2:[58,30], K:[44,72], F:[42,92], K2:[56,72], F2:[58,92] },
    b:{ E:[37,26], W:[22,27], E2:[63,26], W2:[78,27] } },
  bandfacepull: { title:'Pull to your forehead, elbows high, squeeze back', anchor:'A', bands:[['A','W']],
    a:{ A:[96,16], H:[50,13], S:[50,23], P:[50,53], E:[63,22], W:[76,20], K:[45,72], F:[41,92], K2:[55,72], F2:[59,92] },
    b:{ E:[40,19], W:[53,13] } },
  bandohp: { title:'Stand on the band, press overhead, lower to shoulders', bands:[['F','W'],['F2','W2']],
    a:{ H:[50,13], S:[50,23], P:[50,53], E:[37,29], W:[38,18], E2:[63,29], W2:[62,18], K:[44,72], F:[42,92], K2:[56,72], F2:[58,92] },
    b:{ E:[40,10], W:[42,-2], E2:[60,10], W2:[58,-2] } },
  bandlateral: { title:'Stand on the band, raise out to the sides to shoulder height', bands:[['F','W'],['F2','W2']],
    a:{ H:[50,13], S:[50,23], P:[50,53], E:[45,37], W:[43,50], E2:[55,37], W2:[57,50], K:[44,72], F:[42,92], K2:[56,72], F2:[58,92] },
    b:{ E:[36,24], W:[23,26], E2:[64,24], W2:[77,26] } },
  bandcurl: { title:'Elbows pinned, curl up, lower slowly', bands:[['F','W']],
    a:{ H:[50,13], S:[50,23], P:[50,53], E:[52,38], W:[55,52], K:[51,72], F:[50,92] },
    b:{ W:[59,27] } },
  bandhammercurl: { title:'Thumbs up, curl, lower slowly', bands:[['F','W']],
    a:{ H:[50,13], S:[50,23], P:[50,53], E:[52,38], W:[55,52], K:[51,72], F:[50,92] },
    b:{ W:[60,29] } },
  bandtricepext: { title:'Band under your back foot — straighten your arms overhead', bands:[['F2','W']],
    a:{ H:[50,13], S:[50,23], P:[50,53], E:[53,9], W:[42,15], K:[55,72], F:[59,92], K2:[45,72], F2:[38,92] },
    b:{ W:[55,-4] } },
  bandpushdown: { title:'Band anchored high — push down to straight arms', anchor:'A', bands:[['A','W']],
    a:{ A:[84,-6], H:[50,13], S:[50,23], P:[50,53], E:[53,38], W:[64,29], K:[51,72], F:[50,92] },
    b:{ W:[57,52] } },
  bandpallof: { title:'Band pulling from the side — press straight out, don\'t rotate', anchor:'A', bands:[['A','W']],
    a:{ A:[6,34], H:[50,13], S:[50,23], P:[50,53], E:[54,35], W:[56,33], K:[45,72], F:[42,92], K2:[55,72], F2:[58,92] },
    b:{ E:[62,30], W:[75,30] } },
  bandwoodchop: { title:'Pull high-to-low across your body, rotate through your trunk', anchor:'A', bands:[['A','W']],
    a:{ A:[4,2], H:[49,13], S:[50,23], P:[50,53], E:[40,15], W:[31,7], K:[43,72], F:[40,92], K2:[57,72], F2:[60,92] },
    b:{ H:[52,15], E:[61,36], W:[70,49] } }
};
const BAND_COLOR = '#ff8a3d';
// Build the animated SVG for a demo.
function bandDemoSvg(id){
  const d = BAND_DEMOS[id]; if(!d) return '';
  const A = d.a, B = Object.assign({}, d.a, d.b);
  const dur = '2.4s';
  const anim = (attr, a, b) => a === b ? '' : `<animate attributeName="${attr}" values="${a};${b};${b};${a}" keyTimes="0;0.42;0.58;1" calcMode="spline" keySplines=".45 0 .55 1;0 0 1 1;.45 0 .55 1" dur="${dur}" repeatCount="indefinite"/>`;
  const line = (p, q, extra) => {
    if(!A[p] || !A[q]) return '';
    const [x1,y1] = A[p], [x2,y2] = A[q], [bx1,by1] = B[p], [bx2,by2] = B[q];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra||''}>${anim('x1',x1,bx1)}${anim('y1',y1,by1)}${anim('x2',x2,bx2)}${anim('y2',y2,by2)}</line>`;
  };
  const segs = [['S','P'],['S','E'],['E','W'],['S','E2'],['E2','W2'],['P','K'],['K','F'],['P','K2'],['K2','F2']];
  const body = segs.map(([p,q])=>line(p,q)).join('');
  const head = `<circle cx="${A.H[0]}" cy="${A.H[1]}" r="6.5" fill="none">${anim('cx',A.H[0],B.H[0])}${anim('cy',A.H[1],B.H[1])}</circle>`;
  const bands = (d.bands||[]).map(([p,q])=> line(p, q, ` stroke="${BAND_COLOR}" stroke-width="2.6" stroke-dasharray="0"`)).join('');
  const loops = (d.loops||[]).map(p=> `<ellipse cx="${A[p][0]}" cy="${A[p][1]}" rx="5" ry="3.2" stroke="${BAND_COLOR}" stroke-width="2.4" fill="none">${anim('cx',A[p][0],B[p][0])}${anim('cy',A[p][1],B[p][1])}</ellipse>`).join('');
  const anchors = ['A','A2'].filter(k=>A[k]).map(k=> `<rect x="${A[k][0]-3}" y="${A[k][1]-3}" width="6" height="6" rx="1.5" fill="var(--text-dim)" stroke="none"/>`).join('');
  return `<svg viewBox="0 -10 100 106" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" role="img" aria-label="${escapeHtml(d.title)}">
    <line x1="0" y1="93.5" x2="100" y2="93.5" stroke="var(--border)" stroke-width="1.5"/>${anchors}${bands}${body}${head}${loops}</svg>`;
}
// Best available demo for any exercise: its own band demo, else the category animation.
function demoFor(ex){
  if(!ex) return null;
  if(BAND_DEMOS[ex.id]) return { svg: bandDemoSvg(ex.id), title: BAND_DEMOS[ex.id].title, specific:true };
  const a = MOVEMENT_ANIMATIONS[ex.category];
  return a ? { svg:a.svg, title:a.title, specific:false } : null;
}
function videoSearchUrl(ex){
  const q = ex.name + (ex.equipment === 'band' && !/band/i.test(ex.name) ? ' resistance band' : '') + ' proper form';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
function videoLinkHtml(ex){
  return `<a class="btn secondary video-link" href="${videoSearchUrl(ex)}" target="_blank" rel="noopener">▶ Watch video demos</a>`;
}

/* ---------------- Setup & coaching cues (shown in every workout screen) ---------------- */
const BAND_COACHING = {
  bandsquat:{ setup:'Stand on the middle of the band, feet shoulder-width. Bring the handles (or loop) up to your shoulders, palms forward.', cues:['Brace your stomach, sit your hips back and down.','Go as deep as your heels stay down and back stays flat.','Drive up through your whole foot — the band is hardest at the top, so finish tall and squeeze your glutes.'], avoid:'Letting the band pull your hands forward — keep them glued to your shoulders.' },
  bandcalfraise:{ setup:'Stand on the band with the balls of your feet (on a step if you have one), handles at your sides or shoulders.', cues:['Rise as high as you can onto your toes.','Pause 1 second at the top.','Lower slowly into a full stretch.'], avoid:'Bouncing — slow reps grow calves.' },
  bandlegcurl:{ setup:'Anchor the band low (door bottom or bed leg). Lie face down with the band looped around your ankle.', cues:['Keep your hips pressed into the floor.','Curl your heel toward your glutes.','Lower over 2–3 seconds.'], avoid:'Lifting your hips to cheat the rep.' },
  bandrdl:{ setup:'Stand on the band, feet hip-width, handles hanging in front of your thighs. Soft knees.', cues:['Push your hips straight back, sliding hands down your legs.','Back flat — stop when you feel a big hamstring stretch.','Squeeze your glutes to stand up tall.'], avoid:'Rounding your back or turning it into a squat.' },
  bandglutebridge:{ setup:'Mini band just above your knees. Lie on your back, feet flat, hip-width apart.', cues:['Push your knees out against the band the whole time.','Drive through your heels and lift your hips.','Squeeze your glutes 2 seconds at the top.'], avoid:'Arching your lower back instead of squeezing your glutes.' },
  bandlateralwalk:{ setup:'Mini band above your knees or around your ankles. Feet hip-width, half-squat position.', cues:['Step sideways with control, keeping tension on the band.','Toes point forward, chest up.','Go 10–15 steps one way, then come back.'], avoid:'Letting your knees cave in or standing up tall.' },
  bandkickback:{ setup:'On hands and knees, band looped around one foot and held under both hands.', cues:['Brace your core — back stays flat like a table.','Kick your heel back and up toward the ceiling.','Squeeze the glute, lower slowly.'], avoid:'Arching your back to get the leg higher.' },
  bandclamshell:{ setup:'Mini band above your knees. Lie on your side, knees bent ~45°, feet together.', cues:['Keep your feet touching.','Open your top knee as high as you can without rolling back.','Lower slowly.'], avoid:'Rocking your hips backward to fake the range.' },
  bandchestpress:{ setup:'Anchor the band behind you at chest height (door anchor, post, or wrap around your back). Staggered stance.', cues:['Hands start beside your chest, elbows ~45° from your body.','Press straight forward until your arms are almost straight.','Control the band back — don\'t let it snap you back.'], avoid:'Shrugging your shoulders up toward your ears.' },
  bandpushup:{ setup:'Band across your upper back, an end pinned under each hand. Hands slightly wider than shoulders.', cues:['Body in one straight line, glutes squeezed.','Lower your chest to a few inches off the floor.','Press up hard — the band fights you most at the top.'], avoid:'Hips sagging. Too hard? Do it on your knees or with hands on a bed.' },
  bandfly:{ setup:'Anchor the band behind you at chest height (around a post or wrap behind your back). Arms out wide, slight elbow bend.', cues:['Lock in the slight bend in your elbows.','Bring your hands together in a big arc in front of your chest.','Squeeze your chest, return slowly.'], avoid:'Turning it into a press by bending your elbows more.' },
  bandrow:{ setup:'Sit tall, legs out straight, band wrapped around the soles of your feet.', cues:['Pull the handles to your belly button.','Squeeze your shoulder blades together.','Let your arms go straight with control.'], avoid:'Leaning way back to move the band.' },
  bandpulldown:{ setup:'Anchor the band high (top of a door). Kneel facing it, arms reaching up.', cues:['Lead with your elbows — pull them down to your sides.','Chest up, squeeze your lats at the bottom.','Let your arms rise slowly.'], avoid:'Pulling with just your hands or leaning back a lot.' },
  bandpullapart:{ setup:'Hold a band in front of you at shoulder height, arms straight.', cues:['Pull the band apart until it touches your chest.','Squeeze your shoulder blades together.','Return slowly.'], avoid:'Shrugging your shoulders up.' },
  bandfacepull:{ setup:'Anchor the band at face height. Hold it with thumbs pointing back toward you.', cues:['Pull toward your forehead with elbows high and wide.','Finish with hands beside your ears.','Pause and squeeze your upper back.'], avoid:'Elbows dropping below your shoulders.' },
  bandohp:{ setup:'Stand on the band, handles at shoulder height, palms forward. Squeeze your glutes.', cues:['Press straight up until your arms are almost locked.','Keep your ribs down — don\'t lean back.','Lower to your shoulders with control.'], avoid:'Arching your lower back to finish the rep.' },
  bandlateral:{ setup:'Stand on the band (one or both feet), handles at your sides, slight bend in your elbows.', cues:['Raise out to the sides, leading with your elbows.','Stop at shoulder height.','Lower over 2–3 seconds.'], avoid:'Swinging your body. Too hard? Stand on the band with one foot only.' },
  bandcurl:{ setup:'Stand on the band, palms forward, elbows pinned at your sides.', cues:['Curl up without your elbows drifting forward.','Squeeze at the top.','Lower slowly — fight the band on the way down.'], avoid:'Swinging your back to finish the rep.' },
  bandhammercurl:{ setup:'Stand on the band, palms facing each other (thumbs up), elbows at your sides.', cues:['Curl straight up with thumbs leading.','Squeeze at the top.','Lower slowly.'], avoid:'Elbows drifting forward.' },
  bandtricepext:{ setup:'Staggered stance, band under your back foot, hands holding the band behind your head.', cues:['Elbows point up, close to your ears.','Straighten your arms toward the ceiling.','Bend back slowly for a deep stretch.'], avoid:'Elbows flaring out wide.' },
  bandpushdown:{ setup:'Anchor the band high (top of a door). Stand close, elbows pinned at your sides.', cues:['Push down until your arms are completely straight.','Squeeze your triceps for a second.','Let your forearms rise to about 90°.'], avoid:'Elbows drifting forward or leaning your body weight into it.' },
  bandpallof:{ setup:'Anchor the band at chest height to your side. Stand sideways to it, hands at your chest, feet shoulder-width.', cues:['Brace your core and press your hands straight out.','Don\'t let the band rotate you — that\'s the whole exercise.','Hold 2 seconds, bring hands back. Switch sides.'], avoid:'Twisting toward the anchor.' },
  bandwoodchop:{ setup:'Anchor the band high to one side. Stand sideways, hands together holding the band.', cues:['Pull diagonally down across your body to the opposite hip.','Rotate through your trunk and pivot your back foot.','Return slowly. Switch sides.'], avoid:'Pulling only with your arms.' }
};
Object.assign(EXERCISE_COACHING, BAND_COACHING);
// Big multi-joint band moves count as compounds for option picking.
['bandsquat','bandrdl','bandchestpress','bandpushup','bandrow','bandpulldown','bandohp'].forEach(id=> COMPOUND_IDS.add(id));

/* ---------------- Resistance Bands page ---------------- */
const BAND_AREAS = [
  { id:'upper', label:'Upper body', cats:['chest','back','shoulders','biceps','triceps'] },
  { id:'lower', label:'Lower body & glutes', cats:['legs-compound','legs-isolation','glutes'] },
  { id:'core',  label:'Core', cats:['core'] }
];
let bandArea = 'all';
let bandOpen = null; // exercise id expanded in the library
function bandExercises(){ return exercises.filter(e=> e.equipment === 'band'); }
function setBandArea(a){ bandArea = a; renderBands(); }
function toggleBandEx(id){ bandOpen = bandOpen === id ? null : id; renderBands(); }
function bandsStartCircuit(){ setVacCircuit('bands'); switchView('vacation'); }
function bandsBuildSplit(){ sbSetup.equip = 'bands'; sbSetup.equipTouched = true; switchView('split'); }
function bandCardHtml(ex){
  const demo = demoFor(ex);
  const an = exAnatomy(ex);
  const c = EXERCISE_COACHING[ex.id];
  const open = bandOpen === ex.id;
  return `<div class="band-card${open?' open':''}">
    <div class="band-card-top" onclick="toggleBandEx('${ex.id}')">
      <div class="band-demo">${demo ? demo.svg : ''}</div>
      <div style="flex:1;min-width:0;">
        <div class="ex-stat-name">${escapeHtml(ex.name)}</div>
        <div class="hint" style="margin:2px 0 6px;">${demo ? demo.title : ''}</div>
        <div class="chip-row" style="margin:0;">${an.primary.map(r=>`<span class="map-chip prim">${REGION_LABEL[r]||r}</span>`).join('')}${an.secondary.map(r=>`<span class="map-chip">${REGION_LABEL[r]||r}</span>`).join('')}</div>
      </div>
      <span class="band-caret">${open?'▴':'▾'}</span>
    </div>
    ${open ? `<div class="band-card-body">
      <div class="ex-stat-visuals">
        <div class="ex-stat-map">${bodyMapSvg(an.primary, an.secondary, an.tertiary)}
          <div class="map-legend"><span><i style="background:var(--accent)"></i>Primary</span><span><i style="background:rgba(61,220,151,.45)"></i>Secondary</span><span><i style="background:rgba(61,220,151,.18)"></i>Tertiary</span></div></div>
        <div class="band-demo big">${demo ? demo.svg : ''}</div>
      </div>
      ${muscleRolesHtml(ex)}
      <div class="presc" style="margin:10px 0 4px;">${ex.targetSets||3} sets × ${ex.targetReps}${/\d$/.test(String(ex.targetReps)) ? ' reps' : ''}</div>
      ${c ? `<div class="coach-setup" style="margin-top:8px;"><strong>Setup:</strong> ${c.setup}</div><ol class="band-cues">${c.cues.map(x=>`<li>${x}</li>`).join('')}</ol>${c.avoid?`<div class="coach-avoid">⚠️ <strong>Avoid:</strong> ${c.avoid}</div>`:''}` : ''}
      <div class="wizard-actions">${videoLinkHtml(ex)}</div>
    </div>` : ''}
  </div>`;
}
function renderBands(){
  const box = document.getElementById('bandsMain'); if(!box) return;
  const all = bandExercises();
  const areas = BAND_AREAS.filter(a=> bandArea === 'all' || bandArea === a.id);
  const groups = areas.map(a=>{
    const list = all.filter(e=> a.cats.includes(e.category));
    return list.length ? `<div class="fs-region-h" style="margin-top:16px;">${a.label} · ${list.length}</div><div class="band-grid">${list.map(bandCardHtml).join('')}</div>` : '';
  }).join('');
  box.innerHTML = `<div class="card fs-hero" style="margin-bottom:16px;">
      <h2>🟠 Resistance Bands</h2>
      <div class="hint">A full gym that fits in your suitcase. Every move below has an animated demo (the orange line is the band), the muscles it works, setup and form cues, and a link to video demos.</div>
      <div class="band-start">
        <div class="day-card path-card" onclick="bandsStartCircuit()"><div class="day-title">🌴 Band vacation circuit</div><div class="day-sub">5 band moves, 40s on / 20s off, 4 rounds, about 22 min. Guided timer with voice cues.</div></div>
        <div class="day-card path-card" onclick="bandsBuildSplit()"><div class="day-title">🧩 Bands-only split day</div><div class="day-sub">Push / Pull / Legs or Upper / Lower with only bands and bodyweight. You pick each move.</div></div>
      </div>
      <details class="coach-box" style="margin-top:14px;">
        <summary>🎒 Band basics: which bands to pack and how to anchor them</summary>
        <div class="vac-text"><strong>Pack:</strong> a set of tube bands with handles + a door anchor (most travel kits include one), and a mini loop band for glutes and hips. Together they weigh less than a pair of shoes.</div>
        <div class="vac-text"><strong>Anchoring:</strong> close the door anchor in the hinge side of a door that opens <em>away</em> from you, then check it with a hard tug before every set. No anchor? Stand on the band, wrap it around a bed leg or a sturdy post, or loop it around your own back.</div>
        <div class="vac-text"><strong>How to progress:</strong> bands are measured in reps, not pounds. When you hit the top of the rep range on every set, move to a heavier band, stand further from the anchor, or choke up on the band.</div>
        <div class="vac-text"><strong>Tempo matters:</strong> a band is lightest at the bottom and hardest at the top, so pause at the top and lower over 2–3 seconds. That's where most of the work comes from.</div>
        <div class="vac-text"><strong>Safety:</strong> check bands for nicks or cracks before you start, and never point a stretched band at your face.</div>
      </details>
    </div>
    <div class="chip-row" style="margin-bottom:4px;">
      ${[{id:'all',label:'All'}].concat(BAND_AREAS).map(a=>`<button class="chip${bandArea===a.id?' active':''}" onclick="setBandArea('${a.id}')">${a.label}</button>`).join('')}
    </div>
    <div class="hint" style="margin:6px 0 0;">Tap any exercise for the full demo, muscle map and form cues.</div>
    ${groups || '<div class="empty">No band exercises in your library.</div>'}`;
}

/* ---------------- Band level tracking ----------------
   Bands are measured by resistance level, not pounds. Each band exercise remembers the level you
   used; when you hit the top of the rep range on every set, the next session suggests the next band up. */
const BAND_LEVELS = [
  { id:'xlight', label:'X-Light', color:'#f2d14b' },
  { id:'light',  label:'Light',   color:'#e5534b' },
  { id:'medium', label:'Medium',  color:'#3fb950' },
  { id:'heavy',  label:'Heavy',   color:'#4c8ef7' },
  { id:'xheavy', label:'X-Heavy', color:'#8b8f9c' }
];
let bandPick = {}; // exercise id → level chosen on this screen (in-memory until the set is saved)
function bandLevel(id){ return BAND_LEVELS.find(b=>b.id===id) || null; }
function isBandEx(ex){ return !!ex && ex.equipment === 'band'; }
function lastBandLog(ex){ return logs.filter(l=>l.exerciseId===ex.id && l.band).sort((a,b)=> a.date.localeCompare(b.date)).pop() || null; }
// What to use today, and why.
function bandSuggestion(ex){
  const last = lastBandLog(ex);
  if(!last) return { level: ex.bandLevel || 'light', why: ex.bandLevel ? '' : 'First time: start light and own the form.' };
  const i = BAND_LEVELS.findIndex(b=>b.id===last.band);
  const hi = repRange(ex.targetReps)[1];
  const reps = s => (s.reps || s.weight || 0);
  const topped = last.sets.length && last.sets.every(s=> reps(s) >= hi);
  const struggled = last.feel === 'hard' || last.sets.some(s=> reps(s) < repRange(ex.targetReps)[0]);
  if(topped && i < BAND_LEVELS.length-1) return { level: BAND_LEVELS[i+1].id, up:true, why:`You hit ${hi}+ reps on every set with the ${bandLevel(last.band).label} band — time to move up.` };
  if(struggled && i > 0 && last.feel === 'hard') return { level: BAND_LEVELS[i-1].id, down:true, why:`Last time felt too hard — drop one band and own the reps.` };
  return { level: last.band, why: `Same band as last time — aim for ${hi} reps on every set to earn the next one.` };
}
function bandFor(ex){ return bandPick[ex.id] || bandSuggestion(ex).level; }
function bandStamp(ex){ return isBandEx(ex) ? bandFor(ex) : undefined; }
function rememberBand(ex){ if(isBandEx(ex)){ ex.bandLevel = bandFor(ex); delete bandPick[ex.id]; } }
function setBandPick(exId, level){
  bandPick[exId] = level;
  const el = document.getElementById('bandPick-' + exId);
  const ex = exercises.find(e=>e.id===exId);
  if(el && ex) el.outerHTML = bandPickerHtml(ex);
}
function bandDot(level){ const b = bandLevel(level); return b ? `<span class="band-dot" style="background:${b.color}"></span>` : ''; }
function bandPickerHtml(ex){
  if(!isBandEx(ex)) return '';
  const sug = bandSuggestion(ex), cur = bandFor(ex);
  return `<div class="band-pick" id="bandPick-${ex.id}">
    <div class="band-pick-h">🟠 Which band? ${sug.up ? '<span class="pill met">Move up</span>' : sug.down ? '<span class="pill below">Back off</span>' : ''}</div>
    <div class="chip-row" style="margin-top:4px;">${BAND_LEVELS.map(b=>`<button type="button" class="chip band-chip${cur===b.id?' active':''}" onclick="setBandPick('${ex.id}','${b.id}')">${bandDot(b.id)}${b.label}${sug.level===b.id?' ★':''}</button>`).join('')}</div>
    ${sug.why ? `<div class="hint" style="margin:6px 0 0;">★ ${sug.why}</div>` : ''}
  </div>`;
}
