/* J3 WorkOut — js/main.js
   Startup.
   Loaded as a classic <script> in index.html order; files share globals. */

/* ---------------- Init ---------------- */

function renderAll(){
  renderDashboard();
  renderCoach();
  renderFreestyle();
  renderVacation();
  renderBody();
  renderPlanView();
  renderLogView();
  renderWarmupTab();
  renderSprintsTab();
  renderHistory();
  renderCalendar();
  renderProgress();
  renderSettings();
}

updateTimerDisplay();
renderAll();
