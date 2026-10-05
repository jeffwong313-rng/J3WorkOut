/* J3 WorkOut — js/learn.js
   "Did you know?" learning tips.
   Loaded as a classic <script> in index.html order; files share globals. */

/* =====================================================================
   LEARN — "Did you know?" tips during workouts
   Each fact is tied to a specific exercise (ex), a muscle (m), or is
   general training knowledge (g). Closing a tip marks it learned, so the
   next time you see a different one; once you've seen them all for a
   context they rotate oldest-first. Everything you've learned is listed
   in Coach → What you've learned.
   Podcast items are paraphrased summaries of ideas discussed on the
   Huberman Lab podcast (often with Dr. Andy Galpin) — not quotes.
   ===================================================================== */
const SRC_GALPIN = 'Huberman Lab · Dr. Andy Galpin';
const SRC_HUB = 'Huberman Lab';
const SRC_ANAT = 'Anatomy';
const SRC_RES = 'Exercise research';
const FACTS = [
  // ---------- Triceps ----------
  { id:'tri-3heads', m:'triceps', ex:['skullcrusher'], src:SRC_ANAT, title:'Your triceps has 3 heads',
    text:'The <strong>long</strong>, <strong>lateral</strong> and <strong>medial</strong> heads. Skull crushers train all three, and letting the bar drift slightly behind your head gives the long head extra stretch. To bias the others: <strong>pushdowns</strong> lean on the lateral & medial heads, while <strong>overhead extensions</strong> put the long head under its biggest stretch.',
    try:['ropepushdown','tricepspushdown','overheadtricepext'] },
  { id:'tri-size', m:'triceps', src:SRC_ANAT, title:'Want bigger arms? Train triceps',
    text:'The triceps make up roughly <strong>two-thirds of your upper-arm</strong> muscle — more than the biceps. If arm size is a goal, triceps work pays off the most.',
    try:['overheadtricepext','ropepushdown'] },
  { id:'tri-pushdown', ex:['tricepspushdown','ropepushdown'], src:SRC_ANAT, title:'What pushdowns miss',
    text:'With your arms at your sides, the <strong>long head</strong> (the only triceps head that crosses the shoulder) is relatively slack, so the lateral and medial heads do most of the work. Pair pushdowns with an arms-overhead exercise to cover the long head.',
    try:['overheadtricepext','skullcrusher'] },
  { id:'tri-overhead', ex:['overheadtricepext','speediancetricepext'], src:SRC_RES, title:'Why overhead extensions are special',
    text:'Raising your arms overhead stretches the triceps <strong>long head</strong>. In one study, people who did overhead extensions grew their triceps more than people doing the same work as pushdowns — training a muscle in its stretched position seems to help growth.',
    try:['ropepushdown','closegripbench'] },
  { id:'tri-compound', ex:['closegripbench','tricepdip','pushup','chestdip'], src:SRC_ANAT, title:'Pressing = triceps work too',
    text:'Every press (bench, push-ups, dips, overhead press) uses your triceps to straighten the elbow. Close-grip and dip variations shift even more of the load onto them — which is why the plan counts presses as "indirect" triceps sets.',
    try:['overheadtricepext'] },

  // ---------- Biceps ----------
  { id:'bi-heads', m:'biceps', src:SRC_ANAT, title:'"Bi"-ceps = two heads (plus a hidden third muscle)',
    text:'The <strong>long head</strong> (outer) and <strong>short head</strong> (inner) make up the biceps. Underneath sits the <strong>brachialis</strong>, which can push the biceps up and make your arm look thicker from the side. Different curls bias each one.',
    try:['inclinedbcurl','preachercurl','hammercurl'] },
  { id:'bi-incline', ex:['inclinedbcurl'], src:SRC_ANAT, title:'Incline curls stretch the long head',
    text:'Lying back lets your arms hang <strong>behind your body</strong>, which stretches the biceps long head (it crosses the shoulder). For the short head, do the opposite: arms in front, like a preacher curl.',
    try:['preachercurl','concentrationcurl'] },
  { id:'bi-preacher', ex:['preachercurl','concentrationcurl'], src:SRC_ANAT, title:'Arms in front = short-head focus',
    text:'With your upper arm in front of your body, the biceps long head is slack, so <strong>preacher and concentration curls</strong> lean on the short head. Balance them with an incline curl (long head) and hammer curl (brachialis).',
    try:['inclinedbcurl','hammercurl'] },
  { id:'bi-hammer', ex:['hammercurl','zottmancurl'], src:SRC_ANAT, title:'The thumbs-up grip changes the muscle',
    text:'A neutral (thumbs-up) grip shifts work to the <strong>brachialis</strong> and the <strong>brachioradialis</strong> (the big forearm muscle near your elbow). Great for arm thickness and grip — but it hits the biceps itself less than a palms-up curl.',
    try:['curl','inclinedbcurl'] },
  { id:'bi-supinate', ex:['curl','speediancecurl','cablecurl','barbellcurl','ezbarcurl'], m:'biceps', src:SRC_ANAT, title:'Your biceps also twists your wrist',
    text:'Besides bending the elbow, the biceps <strong>turns your palm up</strong> (supination). With dumbbells, start palms-in and rotate your pinky up as you curl to get a fuller contraction at the top.',
    try:['hammercurl'] },

  // ---------- Shoulders ----------
  { id:'sh-3heads', m:'shoulders', src:SRC_ANAT, title:'Your shoulder has 3 "heads"',
    text:'The deltoid has a <strong>front</strong>, <strong>side</strong> and <strong>rear</strong> head. Presses mostly hit the front, <strong>lateral raises</strong> hit the side (that\'s what makes shoulders look wider), and <strong>rear delt flys / face pulls</strong> hit the back.',
    try:['lateralraise','reardeltfly','facepull'] },
  { id:'sh-press', ex:['dbshoulder','speedianceshoulderpress','machineshoulderpress','ohp','militarypress','arnoldpress'], src:SRC_ANAT, title:'Your front delts are already busy',
    text:'Shoulder presses mainly train the <strong>front delts</strong> — which also work hard on every chest press. Most people need <em>more</em> side and rear delt work, not more pressing, for round, balanced shoulders.',
    try:['lateralraise','reardeltfly'] },
  { id:'sh-lateral', ex:['lateralraise','cablelateralraise','speediancelateralraise'], src:SRC_ANAT, title:'Light lateral raises are normal',
    text:'Your arm is a long lever and the side delt is a small muscle, so even strong lifters use light weights here. If you have to swing or shrug, it\'s too heavy. Cables keep tension at the bottom of the rep, where dumbbells go slack.',
    try:['cablelateralraise'] },
  { id:'sh-facepull', ex:['facepull','bandpullapart'], src:SRC_ANAT, title:'Face pulls are shoulder insurance',
    text:'They train your <strong>rear delts</strong>, upper back and the <strong>rotator cuff</strong> muscles that rotate your arm outward. That balances out all the pressing you do and helps keep your shoulders healthy and your posture upright.',
    try:['reardeltfly'] },
  { id:'sh-rear', ex:['reardeltfly'], src:SRC_ANAT, title:'The forgotten delt',
    text:'Rear delts give your shoulders a "3D" look from the side and help pull your shoulders back. Rows hit them a little, but direct work like rear delt flys or face pulls is what grows them.',
    try:['facepull'] },

  // ---------- Chest ----------
  { id:'ch-heads', m:'chest', src:SRC_ANAT, title:'Upper chest vs. lower chest',
    text:'Your pec major has an <strong>upper (clavicular)</strong> part and a larger <strong>lower (sternal)</strong> part. <strong>Incline</strong> pressing biases the upper chest; <strong>flat and decline</strong> pressing and dips lean on the lower part.',
    try:['inclinedbpress','dbbench','chestdip'] },
  { id:'ch-fly', ex:['cablefly_speed','pecdeck','dbfly','speediancefly'], src:SRC_ANAT, title:'Flys load the stretch',
    text:'Presses get hardest near the bottom and easier at lockout; flys keep your chest working through a big stretch with less triceps involvement. Cables keep tension even when your hands come together, where dumbbells go easy.',
    try:['dbbench','inclinedbpress'] },
  { id:'ch-pushup', ex:['pushup'], src:SRC_RES, title:'A push-up is a real lift',
    text:'In the top position a push-up loads roughly <strong>two-thirds of your bodyweight</strong>. Done close to failure, research shows push-ups can build the chest about as well as bench pressing a similar relative load.',
    try:['dbbench'] },
  { id:'ch-db', ex:['dbbench','chestpress_speed','inclinedbpress','speedianceinclinepress'], src:SRC_ANAT, title:'Why dumbbells (or cables) for beginners',
    text:'Each arm works on its own, so a stronger side can\'t cover for a weaker one, and you get a little more range of motion at the bottom. They\'re also easier to bail out of safely than a barbell.',
    try:['bench'] },
  { id:'ch-bench', ex:['bench','declinebench','inclinebarbell','machinechestpress'], src:SRC_ANAT, title:'Elbows at 45° protect your shoulders',
    text:'Flaring your elbows straight out to 90° jams the front of the shoulder. Tucking them to about 45° and pinching your shoulder blades together keeps the stress on your chest and triceps.',
    try:['dbbench'] },

  // ---------- Back ----------
  { id:'bk-muscles', m:'back', src:SRC_ANAT, title:'Your "back" is several muscles',
    text:'The <strong>lats</strong> (wide, they pull your arms down and back), the <strong>traps & rhomboids</strong> (mid/upper back, squeeze your shoulder blades) and the <strong>spinal erectors</strong> (lower back, keep your spine straight). Pulldowns favor the lats; rows hit the mid back more; hinges like RDLs train the erectors.',
    try:['latpull','seatedrow_speed','dbrdl'] },
  { id:'bk-lats', ex:['latpull','widegriplatpulldown','speediancepulldown','pullup','chinup','straightarmpulldown'], src:SRC_ANAT, title:'Think "elbows," not "hands"',
    text:'Your lats attach to your upper arm, not your hands. Cue yourself to drive your <strong>elbows down toward your back pockets</strong> — you\'ll feel your back working instead of mostly your biceps and forearms.',
    try:['straightarmpulldown'] },
  { id:'bk-rowangle', ex:['seatedrow_speed','cablerowwide','singlearmrow','dbbentrow','row','tbarrow','speediancebentoverrow'], src:SRC_ANAT, title:'Elbow angle changes which back muscle works',
    text:'Elbows <strong>close to your sides</strong>, pulling toward your hip = more <strong>lats</strong>. Elbows <strong>flared wide</strong>, pulling toward your chest = more <strong>upper back and rear delts</strong>. Same machine, different muscle.',
    try:['singlearmrow','cablerowwide'] },
  { id:'bk-pullup', ex:['pullup','chinup','invertedrow'], src:SRC_RES, title:'Can\'t do a pull-up yet? Go slow on the way down',
    text:'Your muscles are stronger lowering a weight than lifting it. Jumping to the top and lowering yourself over <strong>3–5 seconds</strong> (negatives) is one of the fastest ways to build up to your first real pull-up.',
    try:['latpull','invertedrow'] },

  // ---------- Quads ----------
  { id:'q-four', m:'quads', src:SRC_RES, title:'"Quad" = four muscles, and squats miss one',
    text:'Three quad muscles only cross the knee. The fourth, <strong>rectus femoris</strong>, also crosses the hip — and because your hip is bent at the bottom of a squat, squats train it surprisingly little. Research shows <strong>leg extensions</strong> fill that gap.',
    try:['legextension','gobletsquat'] },
  { id:'q-depth', ex:['gobletsquat','speediancesquat','squat','frontsquat','hacksquat','bwsquat'], src:SRC_RES, title:'Depth matters for your glutes',
    text:'In one study, people who squatted <strong>deep</strong> grew their glutes and inner thighs more than people doing half squats, while quad growth was similar. Go as deep as you can with a flat back.',
    try:['hipthrust','bulgariansplitsquat'] },
  { id:'q-legpress', ex:['legpress','speedianceleg press'], src:SRC_ANAT, title:'Foot position shifts the muscle',
    text:'Feet <strong>lower</strong> on the platform = more knee bend = more <strong>quads</strong>. Feet <strong>higher</strong> = more hip bend = more <strong>glutes and hamstrings</strong>. Same machine, different emphasis.',
    try:['legextension','hipthrust'] },
  { id:'q-single', ex:['bulgariansplitsquat','lunge','stepup','curtsylunge'], src:SRC_ANAT, title:'Why single-leg work is worth the wobble',
    text:'Your stronger leg can\'t carry the weaker one, and your <strong>glute medius</strong> (side of the hip) works hard to keep you balanced. A longer stride or slight forward lean shifts work to the glutes; a shorter stride and upright torso favor the quads.',
    try:['gobletsquat','abductor'] },
  { id:'q-ext', ex:['legextension','speedianceextension'], src:SRC_ANAT, title:'The only lift that isolates all four quads',
    text:'With your hip bent but not moving, leg extensions load the <strong>rectus femoris</strong> along with the other three quad muscles. Squats and leg presses are still your main builders — this is the finishing piece.',
    try:['gobletsquat','legpress'] },

  // ---------- Hamstrings ----------
  { id:'h-twojobs', m:'hamstrings', src:SRC_ANAT, title:'Hamstrings have two jobs',
    text:'Most of your hamstrings cross <strong>both the hip and the knee</strong>, so they extend the hip (like an <strong>RDL</strong>) and bend the knee (like a <strong>leg curl</strong>). Training both movements develops them completely — squats barely train them at all.',
    try:['dbrdl','seatedlegcurl'] },
  { id:'h-seated', ex:['seatedlegcurl'], src:SRC_RES, title:'Seated beats lying (in one study)',
    text:'Researchers had people do seated curls on one leg and lying curls on the other — the <strong>seated</strong> leg grew more. Sitting bends your hip, which puts the hamstrings on more stretch while they work.',
    try:['dbrdl'] },
  { id:'h-lying', ex:['lyinglegcurl','speediancelegcurl'], src:SRC_RES, title:'Lying curls work — but try seated too',
    text:'A study comparing them found <strong>seated leg curls grew the hamstrings more</strong> than lying curls, likely because sitting puts the hamstrings on more stretch. If your gym has one, it\'s worth a swap.',
    try:['seatedlegcurl','dbrdl'] },
  { id:'h-rdl', ex:['dbrdl','deadlift','trapbardl','sumodeadlift','rackpull'], src:SRC_ANAT, title:'RDLs train hamstrings under stretch',
    text:'As your hips push back, your hamstrings lengthen under load — a powerful growth signal. The knee barely bends, so add a <strong>leg curl</strong> to train their other job.',
    try:['seatedlegcurl','lyinglegcurl'] },

  // ---------- Glutes ----------
  { id:'gl-three', m:'glutes', src:SRC_ANAT, title:'Three glute muscles',
    text:'<strong>Glute max</strong> (the big one) drives your hips forward — hip thrusts, squats, RDLs. <strong>Glute medius & minimus</strong> sit on the side of your hip and keep your pelvis level on one leg. Train them with the <strong>abductor machine</strong> or single-leg work.',
    try:['hipthrust','abductor','bulgariansplitsquat'] },
  { id:'gl-thrust', ex:['hipthrust','speediancehipthrust','glutebridge','singlelegbridge'], src:SRC_ANAT, title:'Thrusts and squats are a team',
    text:'Hip thrusts load your glutes hardest at the <strong>top</strong> (fully squeezed). Squats and lunges load them hardest at the <strong>bottom</strong> (stretched). Doing both covers the full range.',
    try:['gobletsquat','bulgariansplitsquat'] },
  { id:'gl-abductor', ex:['abductor','cablekickback','donkeykick'], src:SRC_ANAT, title:'Side glutes protect your knees',
    text:'Your glute medius stops your knee from caving inward when you squat, run or land. Strengthening it is one of the simplest ways to make lower-body training feel more stable.',
    try:['bulgariansplitsquat'] },

  // ---------- Calves ----------
  { id:'ca-two', m:'calves', src:SRC_ANAT, title:'Two calf muscles, two positions',
    text:'The <strong>gastrocnemius</strong> (the visible "diamond") crosses the knee and works best with <strong>straight legs</strong>. The <strong>soleus</strong> underneath works more with <strong>bent knees</strong>. Standing raises → gastroc; seated raises → soleus.',
    try:['standingcalfraise','seatedcalfraise'] },
  { id:'ca-stretch', ex:['calfraise','standingcalfraise','dbcalfraise','seatedcalfraise'], src:SRC_RES, title:'Calves love the stretch',
    text:'Bouncing short reps is the classic calf mistake. Pausing 1–2 seconds at the <strong>very bottom</strong> and rising all the way up makes the same weight far more effective.',
    try:['seatedcalfraise'] },

  // ---------- Core ----------
  { id:'co-muscles', m:'core', src:SRC_ANAT, title:'Your core is more than a six-pack',
    text:'<strong>Rectus abdominis</strong> (six-pack) curls your spine; <strong>obliques</strong> rotate you and resist twisting; the deep <strong>transverse abdominis</strong> acts like a weight belt when you brace. Mix a crunch, an anti-rotation move and a bracing move.',
    try:['cablecrunch','cablewoodchopper','deadbug'] },
  { id:'co-anti', ex:['plank','sideplank','deadbug','abwheel'], src:SRC_ANAT, title:'Your core\'s main job is resisting movement',
    text:'Planks and dead bugs train your core to <strong>stop your spine from moving</strong> — exactly what it does during squats, presses and carrying groceries. That\'s why they carry over so well to everything else.',
    try:['cablecrunch'] },
  { id:'co-abs', m:'core', src:SRC_RES, title:'Abs are built in the gym, revealed in the kitchen',
    text:'Training makes your abs stronger and thicker, but whether you can <em>see</em> them depends mostly on body-fat level. You can\'t spot-reduce belly fat with crunches.',
    try:[] },

  // ---------- General: Huberman / Galpin ----------
  { id:'g-9adapt', g:true, src:SRC_GALPIN, title:'There are 9 different kinds of "fitness"',
    text:'Dr. Andy Galpin breaks training adaptations into nine: <strong>skill, speed, power, strength, muscle size, muscular endurance, anaerobic capacity, VO2 max and long-duration endurance</strong>. Each needs different training — which is why your goal changes your sets, reps and rest.' },
  { id:'g-reprange', g:true, src:SRC_GALPIN, title:'Muscle grows across a wide rep range',
    text:'A point Galpin makes on the podcast: for <strong>growth</strong>, sets from about 5 up to 30 reps can all work, <strong>as long as you finish close to failure</strong>. Effort matters more than the exact number. For <strong>strength</strong>, heavier, lower-rep work wins.' },
  { id:'g-3to5', g:true, src:SRC_GALPIN, title:'Galpin\'s "3-to-5" rule for strength',
    text:'For pure strength: <strong>3–5 exercises, 3–5 sets, 3–5 reps, 3–5 minutes of rest, 3–5 days a week</strong>. Heavy, few reps, long rest, high quality. (Beginners start with slightly higher reps to learn technique.)' },
  { id:'g-water', g:true, src:SRC_GALPIN, title:'The "Galpin equation" for hydration',
    text:'A rule of thumb from the podcast: drink roughly <strong>your bodyweight in pounds ÷ 30 = ounces of water every 15 minutes</strong> of exercise. At 185 lb that\'s about 6 oz every 15 min. Hot days or heavy sweating need more.' },
  { id:'g-cold', g:true, src:SRC_HUB, title:'Skip the ice bath right after lifting',
    text:'Huberman has explained that cold-water immersion <strong>right after strength training may blunt muscle growth</strong> by dampening the inflammation that drives adaptation. If muscle is the goal, wait several hours or do cold on a different day.' },
  { id:'g-sleep', g:true, src:SRC_HUB, title:'Sleep is where the muscle gets built',
    text:'Training is the signal; recovery is where you actually adapt — and sleep is the biggest lever. Huberman calls it the foundation of performance. Aim for <strong>7–9 hours</strong>; a bad night is exactly why your check-in adjusts the weights.' },
  { id:'g-protein', g:true, src:SRC_HUB, title:'How much protein?',
    text:'A range commonly cited by experts on the podcast for people who lift is roughly <strong>0.7–1 gram per pound of bodyweight per day</strong>, spread across meals. Most beginners eat far less than that.' },
  { id:'g-sore', g:true, src:SRC_GALPIN, title:'Soreness ≠ a good workout',
    text:'Soreness mostly reflects doing something <strong>new</strong>, not how much you\'ll grow. It fades as your body adapts even while you keep progressing. Judge workouts by whether your weights and reps go up over time.' },
  { id:'g-mindmuscle', g:true, src:SRC_HUB, title:'Mind–muscle connection is real (for growth)',
    text:'Focusing on <strong>feeling the target muscle contract</strong> increases its activation — useful for building muscle, especially on isolation exercises. For max strength, focus on moving the weight instead.' },
  { id:'g-sigh', g:true, src:SRC_HUB, title:'Calm down after training with a "physiological sigh"',
    text:'Huberman\'s go-to: <strong>two inhales through the nose</strong> (the second one short, to top off the lungs) then a <strong>long, slow exhale</strong> through the mouth. A few of these after your workout help shift your body out of "go" mode.' },
  { id:'g-zone2', g:true, src:SRC_HUB, title:'Zone 2: the cardio you can talk through',
    text:'Zone 2 is steady cardio where you can still hold a conversation (or breathe through your nose). Huberman often suggests a few hours a week — around <strong>150–200 minutes</strong> — for heart and metabolic health. Brisk walks count.' },
  { id:'g-grip', g:true, src:SRC_GALPIN, title:'Grip strength predicts more than you think',
    text:'Grip strength is one of the most-studied markers in health research — stronger grip is linked to <strong>lower risk of disease and death</strong> as we age. Rows, deadlifts and carries all build it.' },
  { id:'g-muscle-longevity', g:true, src:SRC_HUB, title:'Muscle is a longevity organ',
    text:'Strength and muscle mass are strongly linked to living longer and staying independent as you age. Muscle also soaks up blood sugar. Every session you log is an investment in your 70-year-old self.' },
  { id:'g-newbie', g:true, src:SRC_RES, title:'Why you get stronger so fast at first',
    text:'Your first few weeks of strength gains are mostly your <strong>nervous system</strong> learning to recruit muscle and coordinate the movement. Visible muscle growth follows over the next weeks and months — keep going.' },
  { id:'g-mps', g:true, src:SRC_RES, title:'Why twice a week per muscle?',
    text:'After a hard workout, muscle-building (protein synthesis) stays elevated for roughly <strong>24–48 hours</strong> in trained people. Training a muscle again every few days restarts that signal — while training it daily never lets it finish rebuilding.' },
  { id:'g-eccentric', g:true, src:SRC_RES, title:'Don\'t waste the way down',
    text:'You\'re stronger lowering a weight than lifting it, and the lowering (eccentric) phase is a big part of the growth stimulus. Controlling it over <strong>2–3 seconds</strong> gets more out of every rep and protects your joints.' },
  { id:'g-overload', g:true, src:SRC_GALPIN, title:'Progressive overload, the slow way',
    text:'Your body only adapts if the challenge keeps growing a little. Add a rep, then a small amount of weight, and repeat. Tiny jumps you can sustain for months beat big jumps that stall in weeks.' },
  { id:'g-consistency', g:true, src:SRC_GALPIN, title:'The best program is the one you\'ll do',
    text:'A recurring theme from Galpin: a "perfect" program you skip loses to a decent program you follow for a year. That\'s why your plan is built around the days you picked — and why the check-in counts consistency, not perfection.' },
  { id:'g-warmup', g:true, src:SRC_RES, title:'Skip long stretches before lifting',
    text:'Holding long static stretches right before lifting can temporarily reduce force. A <strong>dynamic warm-up</strong> — light cardio plus a couple of lighter sets of your first exercise — prepares you better. Save static stretching for after.' },
  { id:'g-rest', g:true, src:SRC_RES, title:'Short rest isn\'t "working harder"',
    text:'Studies comparing rest periods found longer rest (around <strong>2–3 minutes</strong>) between sets built more muscle than ~1 minute, because you can do more quality reps in the next set. Use your rest timer.' },
  { id:'g-brace', g:true, src:SRC_ANAT, title:'Breathe in, brace, then lift',
    text:'Before a heavy rep, take a big breath into your belly and tighten your core like you\'re about to be punched. That pressure stabilizes your spine. Exhale through the hardest part of the rep.' }
];
const FACT_BY_ID = Object.fromEntries(FACTS.map(f=>[f.id, f]));

// Muscles used to pick tips (more detailed than the plan's muscle groups).
const FACT_MUSCLE_BY_EX = {
  lyinglegcurl:['hamstrings'], seatedlegcurl:['hamstrings'], speediancelegcurl:['hamstrings'],
  dbrdl:['hamstrings','glutes'], deadlift:['hamstrings','glutes','back'], trapbardl:['hamstrings','glutes','quads'], sumodeadlift:['hamstrings','glutes'], rackpull:['back','glutes'],
  calfraise:['calves'], standingcalfraise:['calves'], dbcalfraise:['calves'], seatedcalfraise:['calves'],
  adductor:['glutes'], abductor:['glutes'], legextension:['quads'], speedianceextension:['quads'],
  bulgariansplitsquat:['quads','glutes'], lunge:['quads','glutes'], stepup:['quads','glutes'],
  closegripbench:['triceps','chest'], tricepdip:['triceps'], chestdip:['chest','triceps'], pushup:['chest','triceps'],
  facepull:['shoulders','back'], reardeltfly:['shoulders'], bandpullapart:['shoulders','back']
};
const TIP_CATEGORY_MUSCLE = { chest:'chest', back:'back', shoulders:'shoulders', biceps:'biceps', triceps:'triceps', 'legs-compound':'quads', 'legs-isolation':'quads', glutes:'glutes', core:'core' };
function exTipMuscles(ex){
  if(FACT_MUSCLE_BY_EX[ex.id]) return FACT_MUSCLE_BY_EX[ex.id];
  const m = TIP_CATEGORY_MUSCLE[ex.category];
  return m ? [m] : [];
}
function tipGroupsFor(ex){
  const muscles = exTipMuscles(ex);
  return [
    FACTS.filter(f=> f.ex && f.ex.includes(ex.id)),
    FACTS.filter(f=> f.m && muscles.includes(f.m) && !(f.ex && f.ex.includes(ex.id))),
    FACTS.filter(f=> f.g)
  ];
}
function generalTipGroups(){ return [FACTS.filter(f=>f.g)]; }

let seenFacts = loadJSON(LS_KEYS.seenFacts, []); // fact ids, oldest → newest
function tipsEnabled(){ return profile.showTips !== false; }
function markFactSeen(id){ seenFacts = seenFacts.filter(x=>x!==id).concat(id); save(LS_KEYS.seenFacts, seenFacts); }
// First unseen fact, most-specific group first. Once everything has been seen,
// rotate: show the one you saw longest ago.
function pickFact(groups, excludeId){
  for(const g of groups){
    const u = g.find(f=> !seenFacts.includes(f.id) && f.id !== excludeId);
    if(u) return u;
  }
  const all = groups.flat().filter(f=>f.id !== excludeId);
  if(!all.length) return null;
  return all.slice().sort((a,b)=> seenFacts.indexOf(a.id) - seenFacts.indexOf(b.id))[0];
}

let tipCtx = null; // { key, viewId, factId, groups, dismissed }
function hideTip(){
  const el = document.getElementById('tipPop');
  if(el){ el.classList.remove('show'); }
}
function maybeShowTip(viewId, key, groups){
  const view = document.getElementById('view-' + viewId);
  if(!view || !view.classList.contains('active')) return;
  if(!tipsEnabled()){ hideTip(); return; }
  if(tipCtx && tipCtx.key === key){
    if(tipCtx.dismissed) return;
    renderTip();
    return;
  }
  const f = pickFact(groups);
  if(!f){ hideTip(); return; }
  tipCtx = { key, viewId, factId:f.id, groups, dismissed:false };
  renderTip();
}
function renderTip(){
  const el = document.getElementById('tipPop');
  if(!el || !tipCtx) return;
  const f = FACT_BY_ID[tipCtx.factId];
  if(!f) return;
  const inPlan = id => WORKOUT_DAYS.some(d=>d.lifts.includes(id));
  const tryEx = (f.try||[]).map(id=>exercises.find(e=>e.id===id)).filter(Boolean);
  const learned = seenFacts.length;
  el.innerHTML = `<div class="tip-card" role="dialog" aria-label="Training tip">
    <div class="tip-h"><span class="tip-kicker">💡 Did you know?</span><span class="tip-src">${f.src}</span><button class="icon-btn" onclick="dismissTip()" aria-label="Close tip">✕</button></div>
    <div class="tip-title">${f.title}</div>
    <div class="tip-text">${f.text}</div>
    ${tryEx.length ? `<div class="tip-try"><div class="tip-try-h">Try these to hit the rest:</div><div class="tip-chips">${tryEx.map(ex=>`<span class="tip-chip">${iconBadge(ex,'sm')}${ex.name}${inPlan(ex.id)?' <span class="tip-inplan">✓ in your plan</span>':''}</span>`).join('')}</div></div>` : ''}
    <div class="tip-actions">
      <button class="btn ghost" onclick="tipsOff()">Turn off tips</button>
      <button class="btn secondary" onclick="nextTip()">Another tip</button>
      <button class="btn" onclick="dismissTip()">Got it</button>
    </div>
    <div class="tip-count">${learned} of ${FACTS.length} tips learned · saved in Coach → What you've learned</div>
  </div>`;
  el.classList.add('show');
}
function dismissTip(){
  if(!tipCtx) return;
  markFactSeen(tipCtx.factId);
  tipCtx.dismissed = true;
  hideTip();
  if(document.getElementById('view-coach').classList.contains('active')) renderCoach();
}
function nextTip(){
  if(!tipCtx) return;
  markFactSeen(tipCtx.factId);
  const f = pickFact(tipCtx.groups, tipCtx.factId) || pickFact(generalTipGroups(), tipCtx.factId);
  if(!f){ dismissTip(); return; }
  tipCtx.factId = f.id;
  renderTip();
}
function tipsOff(){
  profile.showTips = false; saveAll(); hideTip();
  const cb = document.getElementById('profShowTips'); if(cb) cb.checked = false;
  showToast('Tips off — turn them back on in Settings → Your Profile');
}
function teachMeSomething(){
  profile.showTips = true; saveAll();
  tipCtx = null;
  maybeShowTip('coach', 'manual|' + Date.now(), generalTipGroups().concat([FACTS]));
}
function learnedTipsHtml(){
  const seen = seenFacts.map(id=>FACT_BY_ID[id]).filter(Boolean).reverse();
  const list = seen.length
    ? seen.map(f=>`<details class="learned-item"><summary><span>${f.title}</span><span class="tip-src">${f.src}</span></summary><div class="tip-text">${f.text}</div></details>`).join('')
    : '<div class="empty" style="padding:12px 0;">Nothing yet — tips pop up during your workouts. Close one and it\'s saved here.</div>';
  return `<div class="card" style="margin-bottom:16px;">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;">
      <div><h2>What you've learned</h2><div class="hint" style="margin-bottom:0;">${seen.length} of ${FACTS.length} tips · anatomy, exercise research and ideas from the Huberman Lab podcast (paraphrased).</div></div>
      <button class="btn secondary" style="flex:0 0 auto;" onclick="teachMeSomething()">💡 Teach me something</button>
    </div>
    <div style="margin-top:10px;">${list}</div>
  </div>`;
}

