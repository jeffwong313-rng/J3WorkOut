/* J3 WorkOut — js/pwa.js
   Install-as-an-app support: registers the service worker (offline + installable),
   shows an "Install app" button when Chrome offers it, and gives iPhone instructions.
   Also opens a specific page from home-screen shortcuts (?view=plan etc.).
   Loaded as a classic <script> in index.html order; files share globals. */

let _installPrompt = null;
function isInstalled(){
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}
function isIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

if('serviceWorker' in navigator && location.protocol !== 'file:' && !(typeof TEST_MODE !== 'undefined' && TEST_MODE)){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();            // show our own button instead of Chrome's mini-bar
  _installPrompt = e;
  renderInstallCard();
});
window.addEventListener('appinstalled', ()=>{
  _installPrompt = null;
  showToast('📲 Installed! Open J3 WorkOut from your home screen.');
  renderInstallCard();
});
async function installApp(){
  if(!_installPrompt){ renderInstallCard(true); return; }
  _installPrompt.prompt();
  try{ await _installPrompt.userChoice; }catch(e){}
  _installPrompt = null;
  renderInstallCard();
}
function installHelpHtml(){
  if(isIOS()) return `<ol class="install-steps">
      <li>Open this page in <strong>Safari</strong> (iPhone only allows installing from Safari).</li>
      <li>Tap the <strong>Share</strong> button <span class="kbd">⬆︎</span> at the bottom.</li>
      <li>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
    </ol>`;
  return `<ol class="install-steps">
      <li>Open this page in <strong>Chrome</strong>.</li>
      <li>Tap the <strong>⋮</strong> menu (top right).</li>
      <li>Tap <strong>Install app</strong> (or <strong>Add to Home screen → Install</strong>).</li>
    </ol>`;
}
// Small card shown in Settings (and on Home once, for people who haven't installed yet).
function installCardHtml(forceHelp){
  if(isInstalled()) return `<div class="hint" style="margin:0;">✅ You're using the installed app. It works offline, and updates arrive automatically when you're online.</div>`;
  return `<div class="hint" style="margin:0 0 10px;">Install J3 WorkOut like a regular app: its own icon, full screen with no browser bars, and it opens even with no signal at the gym. Installing also protects your saved data from being cleared by the browser.</div>
    ${_installPrompt ? `<button class="btn" style="width:100%;" onclick="installApp()">📲 Install app</button>` : ''}
    ${(!_installPrompt || forceHelp) ? installHelpHtml() : ''}`;
}
function renderInstallCard(forceHelp){
  const box = document.getElementById('installBox'); if(box) box.innerHTML = installCardHtml(forceHelp);
  const home = document.getElementById('installBanner');
  if(home){
    const show = !isInstalled() && !profile.installDismissed && (_installPrompt || isIOS()) && !(typeof TEST_MODE !== 'undefined' && TEST_MODE);
    home.innerHTML = show ? `<div class="card install-banner" style="margin-bottom:16px;">
      <div class="flex-between" style="gap:10px;flex-wrap:wrap;">
        <div style="flex:1 1 220px;"><strong>📲 Put J3 WorkOut on your home screen</strong><div class="hint" style="margin:0;">Full screen, works offline, keeps your data safe.</div></div>
        <div class="row" style="flex:0 0 auto;gap:8px;">
          <button class="btn ghost" onclick="profile.installDismissed=true; saveAll(); renderInstallCard();">Not now</button>
          ${_installPrompt ? '<button class="btn" onclick="installApp()">Install</button>' : `<button class="btn" onclick="switchView('settings'); setTimeout(()=>document.getElementById('installBox').scrollIntoView({behavior:'smooth'}),100);">How?</button>`}
        </div>
      </div></div>` : '';
  }
}
// Home-screen shortcuts open straight to a page: ./?view=plan
function openViewFromUrl(){
  const v = new URLSearchParams(location.search).get('view');
  if(v && document.getElementById('view-' + v)) switchView(v);
}
