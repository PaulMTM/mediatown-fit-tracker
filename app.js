const MASTER_KEY = "mediatown_fit_tracker_real_v2";
const SETTINGS_KEY = "mediatown_fit_tracker_settings_real_v2";

const modePlans = {
  fat_loss: {
    1: { type: "Intervals + Finisher", desc: "A harder day built for fat loss and momentum.", bullets: ["40-minute treadmill intervals", "12-minute finisher", "Protein-heavy breakfast", "After-dinner walk"] },
    2: { type: "Strength + Bands", desc: "Build muscle so the fat loss looks better, not softer.", bullets: ["20 min Apple Fitness Strength", "Band squats, rows, shoulder press", "Desk reset once during the workday", "Protein-first meals"] },
    3: { type: "Intervals + Finisher", desc: "Push the pace, then recover clean.", bullets: ["40-minute treadmill intervals", "12-minute finisher", "500 ml water before meals", "After-dinner walk"] },
    4: { type: "Strength + Core", desc: "Tighten the frame.", bullets: ["Strength or core session", "Bands and planks", "Desk reset", "Clean dinner timing"] },
    5: { type: "Intervals + Finisher", desc: "Final hard push of the week.", bullets: ["40-minute treadmill intervals", "12-minute finisher", "Keep meals clean", "Walk after dinner"] },
    6: { type: "Light Cardio / Walk", desc: "Recover without turning into furniture.", bullets: ["Long walk or light treadmill", "Optional mobility", "Hydrate properly", "Controlled meals"] },
    0: { type: "Recovery / Yoga", desc: "Recovery is part of the plan.", bullets: ["Stretch or rest", "Short walk", "Hydrate", "Prep for Monday"] }
  },
  general_fitness: {
    1: { type: "Steady Cardio", desc: "A smoother cardio day with less punishment.", bullets: ["40-minute steady cardio", "Optional core work", "High-protein breakfast", "Move throughout the day"] },
    2: { type: "Strength + Bands", desc: "Build a stronger baseline.", bullets: ["20 min Apple Fitness Strength", "Band squats, rows, shoulder press", "Desk reset", "Protein-first meals"] },
    3: { type: "Walk + Mobility", desc: "Move and loosen up.", bullets: ["30–40 min brisk walk", "10 min mobility", "Hydrate", "Stay active after dinner"] },
    4: { type: "Strength + Core", desc: "Balanced, simple, effective.", bullets: ["Strength or core", "Bands and planks", "Desk reset", "Clean dinner timing"] },
    5: { type: "Cardio Mix", desc: "Good effort without going full savage.", bullets: ["40-minute cardio mix", "Optional finisher", "Keep meals clean", "Walk after dinner"] },
    6: { type: "Outdoor Walk / Light Cardio", desc: "Low friction. Just move.", bullets: ["Long walk or easy treadmill", "Optional yoga", "Hydrate", "Keep meals under control"] },
    0: { type: "Recovery", desc: "Recover and reset.", bullets: ["Stretch or rest", "Short walk", "Good sleep", "Prep for the week"] }
  }
};

const today = new Date();
const dateKey = today.toISOString().slice(0, 10);
const fields = ["breakfastTime","lunchTime","dinnerTime","cutoffTime","energy","water","steps","sleep","waist","chestFit","meals","notes"];
const checks = ["workout_done","finisher_done","desk_reset","walk_after_dinner","protein_target","stop_eating"];
let deferredPrompt = null;

function getStore(){ return JSON.parse(localStorage.getItem(MASTER_KEY) || "{}"); }
function setStore(data){ localStorage.setItem(MASTER_KEY, JSON.stringify(data)); }
function getSettings(){ return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
function setSettings(data){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); }
function getMode(){ return getSettings().mode || "fat_loss"; }
function getPlan(){ return modePlans[getMode()][today.getDay()]; }
function getDayData(key = dateKey){ return getStore()[key] || {}; }
function setDayData(key, data){ const store = getStore(); store[key] = data; setStore(store); }

function formatDate(date){
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function getLastNDates(n){
  const dates = [];
  for (let i=0;i<n;i++){ const d=new Date(); d.setDate(today.getDate()-i); dates.push(d); }
  return dates.reverse();
}
function complianceScore(day){
  if (!day || !Object.keys(day).length) return 0;
  let total = 0;
  ["workout_done","desk_reset","walk_after_dinner","protein_target","stop_eating"].forEach(k => { if (day[k]) total += 1; });
  if (day.finisher_done) total += 1;
  return Math.round((total / 6) * 100);
}
function calculateStreak(){
  const store = getStore();
  let streak = 0;
  let cursor = new Date();
  while (true){
    const key = cursor.toISOString().slice(0,10);
    if (store[key] && store[key].workout_done){ streak++; cursor.setDate(cursor.getDate()-1); }
    else break;
  }
  return streak;
}
function setScoreRing(score){
  const ring = document.getElementById("scoreRing");
  const deg = Math.max(0, Math.min(360, Math.round((score/100)*360)));
  ring.style.background = `conic-gradient(var(--accent) ${deg}deg, #EDEFF2 ${deg}deg)`;
  document.getElementById("todayScore").textContent = score;
  document.getElementById("todayScoreText").textContent = score + "%";
}
function renderModeState(){
  const mode = getMode();
  document.querySelectorAll(".mode-card").forEach(el => el.classList.toggle("active", el.dataset.mode === mode));
}
function renderPlan(){
  const plan = getPlan();
  document.getElementById("todayDate").textContent = today.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  document.getElementById("dayTypePill").textContent = plan.type;
  document.getElementById("workoutTitle").textContent = plan.type;
  document.getElementById("workoutDesc").textContent = plan.desc;
  document.getElementById("workoutBullets").innerHTML = plan.bullets.map(item => `<li>${item}</li>`).join("");
}
function renderSummary(){
  const store = getStore();
  const todayData = getDayData();
  const score = complianceScore(todayData);
  setScoreRing(score);
  document.getElementById("streakCount").textContent = calculateStreak();
  const waists = Object.entries(store).filter(([_,v]) => v.waist && !isNaN(parseFloat(v.waist))).sort((a,b) => a[0].localeCompare(b[0]));
  const waistEl = document.getElementById("waistTrend");
  if (waists.length >= 2){
    const first = parseFloat(waists[0][1].waist);
    const latest = parseFloat(waists[waists.length - 1][1].waist);
    const change = latest - first;
    waistEl.textContent = (change > 0 ? "+" : "") + change.toFixed(1) + " cm";
    waistEl.className = "metric " + (change < 0 ? "good" : change > 0 ? "bad" : "");
  } else if (waists.length === 1){
    waistEl.textContent = waists[0][1].waist + " cm";
    waistEl.className = "metric";
  } else {
    waistEl.textContent = "—";
    waistEl.className = "metric";
  }
  renderWeeklyTable();
  renderCharts();
}
function renderWeeklyTable(){
  const tbody = document.getElementById("weeklyTableBody");
  const store = getStore();
  const rows = getLastNDates(7).map(date => {
    const key = date.toISOString().slice(0,10);
    const day = store[key] || {};
    return { label: formatDate(date), plan: day.plan || "—", score: complianceScore(day) + "%", steps: day.steps || "—", waist: day.waist ? day.waist + " cm" : "—" };
  });
  tbody.innerHTML = rows.map(r => `<tr><td>${r.label}</td><td>${r.plan}</td><td>${r.score}</td><td>${r.steps}</td><td>${r.waist}</td></tr>`).join("");
}
function getChartData(field){
  const store = getStore();
  return getLastNDates(7).map(date => {
    const key = date.toISOString().slice(0,10);
    return { label: formatDate(date), value: parseFloat(store[key]?.[field]) || 0 };
  });
}
function drawLineChart(canvasId, data, opts = {}){
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height, pad = 30;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0,0,w,h);
  const values = data.map(d => d.value);
  const max = Math.max(...values, opts.minMax?.[1] ?? 0, 1);
  const min = Math.min(...values, opts.minMax?.[0] ?? max, max);
  const range = max - min || 1;
  ctx.strokeStyle = "#E8EAED";
  ctx.lineWidth = 1;
  for (let i=0;i<4;i++){
    const y = pad + ((h - pad*2)/3) * i;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w-pad, y); ctx.stroke();
  }
  ctx.strokeStyle = "#95BF47";
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((d,i) => {
    const x = pad + (i * ((w - pad*2)/(data.length-1 || 1)));
    const y = h - pad - ((d.value - min) / range) * (h - pad*2);
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.fillStyle = "#0F110F";
  data.forEach((d,i) => {
    const x = pad + (i * ((w - pad*2)/(data.length-1 || 1)));
    const y = h - pad - ((d.value - min) / range) * (h - pad*2);
    ctx.beginPath(); ctx.arc(x,y,4.5,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle = "#676B67";
  ctx.font = "12px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  data.forEach((d,i) => {
    const x = pad + (i * ((w - pad*2)/(data.length-1 || 1)));
    ctx.fillText(d.label.split(" ")[0], x - 12, h - 10);
  });
}
function renderCharts(){
  drawLineChart("stepsChart", getChartData("steps"));
  const waistData = getChartData("waist");
  const filtered = waistData.filter(d => d.value > 0);
  if (filtered.length){
    const min = Math.min(...filtered.map(d => d.value)) - 1;
    const max = Math.max(...filtered.map(d => d.value)) + 1;
    drawLineChart("waistChart", waistData, { minMax: [min, max] });
  } else drawLineChart("waistChart", waistData);
}
function applyDefaultTimes(){
  const settings = getSettings();
  ["breakfastTime","lunchTime","dinnerTime","cutoffTime"].forEach(id => {
    const el = document.getElementById(id);
    if (!el.value && settings[id]) el.value = settings[id];
  });
}
function autoSave(){
  const data = { date: dateKey, plan: getPlan().type, mode: getMode() };
  fields.forEach(id => data[id] = document.getElementById(id).value);
  document.querySelectorAll("[data-check]").forEach(el => data[el.dataset.check] = el.checked);
  setDayData(dateKey, data);
  document.getElementById("saveStatus").textContent = "Saved for " + dateKey + ".";
  renderSummary();
}
function loadToday(){
  const saved = getDayData();
  renderPlan();
  renderModeState();
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (saved[id] !== undefined) el.value = saved[id];
    el.addEventListener("input", autoSave);
    el.addEventListener("change", autoSave);
  });
  document.querySelectorAll("[data-check]").forEach(el => {
    const key = el.dataset.check;
    el.checked = !!saved[key];
    el.addEventListener("change", autoSave);
  });
  if (Object.keys(saved).length) document.getElementById("saveStatus").textContent = "Loaded saved data for " + dateKey + ".";
  else applyDefaultTimes();
}
function setupModes(){
  document.querySelectorAll(".mode-card").forEach(el => {
    el.addEventListener("click", () => {
      const settings = getSettings();
      settings.mode = el.dataset.mode;
      setSettings(settings);
      renderModeState();
      renderPlan();
      autoSave();
    });
  });
}
function setupOnboarding(){
  const settings = getSettings();
  if (!settings.onboarded) document.getElementById("onboarding").classList.add("show");
  document.getElementById("finishOnboardingBtn").addEventListener("click", () => {
    const next = {
      ...getSettings(),
      onboarded: true,
      breakfastTime: document.getElementById("obBreakfastTime").value || "8:30 AM",
      lunchTime: document.getElementById("obLunchTime").value || "12:30 PM",
      dinnerTime: document.getElementById("obDinnerTime").value || "6:00 PM",
      cutoffTime: document.getElementById("obCutoffTime").value || "8:00 PM"
    };
    setSettings(next);
    document.getElementById("onboarding").classList.remove("show");
    applyDefaultTimes();
    autoSave();
  });
}
document.getElementById("saveBtn").addEventListener("click", autoSave);
document.getElementById("saveBtnSticky").addEventListener("click", autoSave);
document.getElementById("scrollTopBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
document.getElementById("exportBtn").addEventListener("click", () => {
  const payload = { data: getStore(), settings: getSettings() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mediatown-fit-tracker-data.json";
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (imported.data) setStore(imported.data); else setStore(imported);
      if (imported.settings) setSettings(imported.settings);
      location.reload();
    } catch {
      alert("Import failed. That file is not valid tracker data.");
    }
  };
  reader.readAsText(file);
});
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear all tracker data from this browser?")) return;
  localStorage.removeItem(MASTER_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  location.reload();
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").classList.remove("hidden");
  document.getElementById("installHelp").textContent = "Install is available in this browser.";
});
document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBtn").classList.add("hidden");
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
loadToday();
setupModes();
setupOnboarding();
renderSummary();
