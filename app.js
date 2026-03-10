/* =================================================================
   UVSQ Calendar Fetcher – app.js (GitHub Pages version)
   GSAP-powered animations · i18n · theme · CELCAT fetch · download
   Identical to web/static/app.js but with:
   - Relative API paths (works when Flask runs at same origin)
   - GitHub Pages fallback when no Flask backend is available
   - Documentation link instead of guide link
   ================================================================= */

// -----------------------------------------------------------------
// Detect if running on GitHub Pages (no Flask backend)
// -----------------------------------------------------------------
const IS_STATIC = window.location.hostname.includes("github.io")
  || window.location.protocol === "file:";

// -----------------------------------------------------------------
// i18n
// -----------------------------------------------------------------
const I18N = {
  fr: {
    heroBadge: "Outil Calendrier Universitaire",
    heroLine1: "Construis ton",
    heroLine2: "emploi du temps",
    heroSub: "On détecte automatiquement tes modules depuis CELCAT. Choisis et télécharge.",
    loadingGroups: "Connexion à CELCAT...",
    loadingModules: "Chargement des modules...",
    errorLoad: "Erreur de connexion.",
    retry: "Réessayer",
    semester: "Semestre S2 — 2025/2026",
    dateFrom: "Du",
    dateTo: "Au",
    pickerTitle: "Sélectionne tes modules",
    pickerSub: "Coche ceux de ton contrat d'études et indique ton groupe de TD.",
    selectAll: "Tout sélectionner",
    deselectAll: "Tout décocher",
    examNote: "Examens, partiels et soutenances sont toujours inclus automatiquement.",
    generate: "Générer et télécharger .ics",
    generating: "Génération en cours...",
    noModules: "Aucun module trouvé.",
    selectAtLeast: "Sélectionne au moins un module.",
    selectGroup: "Choisis un groupe TD pour : ",
    eventsFound: "événements trouvés",
    guide: "Guide d'import",
    docs: "Documentation",
    subscribe: "Obtenir un lien auto-actualisé",
    subscribing: "Création du lien...",
    subTitle: "Ton lien auto-actualisé",
    subDesc: "Abonne-toi à ce lien dans ton appli calendrier. Il récupérera toujours le dernier emploi du temps depuis CELCAT.",
    copy: "Copier",
    copied: "Copié !",
    subOneClick: "Ouvrir dans l'appli Calendrier",
    subHowTo: "Comment s'abonner",
    subSteps: [
      "Google Calendar : Autres calendriers (+) → À partir de l'URL → colle le lien.",
      "iPhone / iPad : Réglages → Calendrier → Comptes → Ajouter → Autre → S'abonner → colle le lien.",
      "Outlook : Ajouter un calendrier → S'abonner sur le web → colle le lien.",
      "Ton calendrier se mettra à jour automatiquement (toutes les 12 à 24h selon l'appli)."
    ],
    subHostNote: "Note : Le lien d'abonnement nécessite un serveur public. Tu peux aussi utiliser GitHub Actions + Pages pour une solution gratuite (voir le guide).",
    orUpdate: "ou mettre à jour un fichier existant",
    updateTitle: "Mettre à jour ton calendrier",
    updateDesc: "Envoie un fichier .ics généré précédemment. On détectera tes modules et on téléchargera une version actualisée avec les derniers changements de CELCAT.",
    updateDropText: "Glisse ton fichier .ics ici ou clique pour parcourir",
    updateDropHint: "Uniquement les fichiers .ics générés par cet outil",
    updateUploading: "Analyse et mise à jour en cours...",
    updateSuccess: "Calendrier mis à jour ! Téléchargement lancé.",
    updateError: "Erreur lors de la mise à jour.",
    // GitHub Pages fallback
    staticTitle: "Serveur Flask requis",
    staticMsg: "Cette appli web a besoin du serveur Flask local pour se connecter à CELCAT. Lance-le avec :",
    staticCmd: "cd web && flask run",
    staticAlt: "Tu peux aussi utiliser GitHub Actions + Pages pour un calendrier auto-actualisé sans serveur.",
    staticDocs: "Voir le guide de configuration",
  },
  en: {
    heroBadge: "University Calendar Tool",
    heroLine1: "Build your",
    heroLine2: "perfect schedule",
    heroSub: "We auto-detect all your modules from CELCAT. Just pick and download.",
    loadingGroups: "Connecting to CELCAT...",
    loadingModules: "Loading modules...",
    errorLoad: "Connection error.",
    retry: "Retry",
    semester: "Semester S2 — 2025/2026",
    dateFrom: "From",
    dateTo: "To",
    pickerTitle: "Select your modules",
    pickerSub: "Check the ones from your study contract and set your TD group number.",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    examNote: "Exams, midterms and defenses are always included automatically.",
    generate: "Generate & download .ics",
    generating: "Generating...",
    noModules: "No modules found.",
    selectAtLeast: "Select at least one module.",
    selectGroup: "Select a TD group for: ",
    eventsFound: "events detected",
    guide: "Import guide",
    docs: "Documentation",
    subscribe: "Get auto-update link",
    subscribing: "Generating link...",
    subTitle: "Your auto-update link",
    subDesc: "Subscribe to this link in your calendar app. It will always fetch the latest schedule from CELCAT.",
    copy: "Copy",
    copied: "Copied!",
    subOneClick: "Open in Calendar app",
    subHowTo: "How to subscribe",
    subSteps: [
      "Google Calendar: Other calendars (+) → From URL → paste the link.",
      "iPhone / iPad: Settings → Calendar → Accounts → Add → Other → Subscribed → paste the link.",
      "Outlook: Add calendar → Subscribe from web → paste the link.",
      "Your calendar will auto-refresh (every 12–24h depending on the app)."
    ],
    subHostNote: "Note: The subscription link requires a public server. You can also use GitHub Actions + Pages for a free solution (see the guide).",
    orUpdate: "or update an existing file",
    updateTitle: "Update your calendar",
    updateDesc: "Upload a previously generated .ics file. We'll detect your modules and download a refreshed version with the latest changes from CELCAT.",
    updateDropText: "Drop your .ics file here or click to browse",
    updateDropHint: "Only .ics files generated by this tool",
    updateUploading: "Analyzing and updating...",
    updateSuccess: "Calendar updated! Download started.",
    updateError: "Error updating the file.",
    // GitHub Pages fallback
    staticTitle: "Flask server required",
    staticMsg: "This web app needs the local Flask server to connect to CELCAT. Start it with:",
    staticCmd: "cd web && flask run",
    staticAlt: "You can also use GitHub Actions + Pages for a free auto-updating calendar without a server.",
    staticDocs: "View setup guide",
  },
};

// -----------------------------------------------------------------
// State
// -----------------------------------------------------------------
let lang = localStorage.getItem("lang") || (navigator.language.startsWith("fr") ? "fr" : "en");
let allModules = [];
let allGroups  = [];
let totalEvents = 0;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// -----------------------------------------------------------------
// Theme
// -----------------------------------------------------------------
function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(choice) {
  localStorage.setItem("theme", choice);
  const eff = choice === "auto" ? getSystemTheme() : choice;
  document.documentElement.setAttribute("data-theme", eff);
}
function initTheme() {
  applyTheme(localStorage.getItem("theme") || "auto");
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((localStorage.getItem("theme") || "auto") === "auto") applyTheme("auto");
  });
}

// -----------------------------------------------------------------
// i18n
// -----------------------------------------------------------------
function t(key) { return (I18N[lang] || I18N.en)[key] || key; }

function setLang(l) {
  lang = l;
  localStorage.setItem("lang", l);
  $$(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === l));
  renderUI();
}

function renderUI() {
  $$("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (I18N[lang] && I18N[lang][key] && typeof I18N[lang][key] === "string") {
      el.textContent = I18N[lang][key];
    }
  });
  $$(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  if (totalEvents) {
    const ct = $("#eventCountText");
    if (ct) ct.textContent = `${totalEvents} ${t("eventsFound")}`;
  }
  const btn = $("#btnGenerate");
  if (btn && !btn.disabled) {
    const sp = btn.querySelector(".btn-generate-text");
    if (sp) sp.textContent = t("generate");
  }
  if (allModules.length) renderModules();
}

// -----------------------------------------------------------------
// GSAP entrance animation
// -----------------------------------------------------------------
function playEntrance() {
  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(".navbar", { y: 0, duration: .6, ease: "power2.out" }, 0);
  tl.fromTo(".blob-1", { x: -120, y: -80, scale: .6 }, { x: 0, y: 0, scale: 1, duration: 1.8, ease: "power1.out" }, 0);
  tl.fromTo(".blob-2", { x: 100, y: 60, scale: .5 }, { x: 0, y: 0, scale: 1, duration: 2, ease: "power1.out" }, 0.1);
  tl.fromTo(".blob-3", { x: -60, y: 100, scale: .5 }, { x: 0, y: 0, scale: 1, duration: 2.2, ease: "power1.out" }, 0.2);
  tl.fromTo(".hero-badge", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5 }, .3);
  tl.fromTo(".title-line", { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: .12, duration: .6 }, .45);
  tl.fromTo(".hero-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5 }, .75);
  tl.fromTo(".hero-loader", { opacity: 0 }, { opacity: 1, duration: .4 }, .9);

  gsap.to(".blob-1", { x: 30, y: -20, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".blob-2", { x: -25, y: 15, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".blob-3", { x: 20, y: -25, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

// -----------------------------------------------------------------
// Transition: hero → main content
// -----------------------------------------------------------------
function transitionToContent() {
  const mc = $("#mainContent");

  if (typeof gsap === "undefined") {
    const hero = $("#heroSection");
    hero.style.minHeight = "auto";
    hero.style.paddingTop = "6rem";
    hero.style.paddingBottom = "2rem";
    $(".hero-loader").style.display = "none";
    const sc = $("#scrollHint");
    if (sc) sc.style.display = "none";
    mc.style.opacity = "1";
    mc.style.visibility = "visible";
    return;
  }

  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: () => {
      mc.style.opacity = "1";
      mc.style.visibility = "visible";
      gsap.set(".module-card", { clearProps: "opacity,y" });
    }
  });

  tl.to(".hero-loader", { opacity: 0, duration: .3 }, 0);
  tl.to("#heroSection", {
    minHeight: "auto", paddingTop: "6.5rem", paddingBottom: "1.5rem",
    duration: .7, ease: "power2.inOut"
  }, .2);
  tl.to("#scrollHint", { opacity: 0, duration: .2 }, 0);
  tl.fromTo(mc, { opacity: 0, visibility: "hidden" }, { opacity: 1, visibility: "visible", duration: .5 }, .5);
  tl.fromTo("#infoBar", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, .6);
  tl.fromTo(".picker-header", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, .7);
  tl.fromTo(".module-card", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .04, duration: .35 }, .8);
  tl.fromTo(".exam-notice", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }, 1);
  tl.fromTo(".btn-generate", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }, 1.05);
  tl.set("#scrollHint", { display: "none" }, .5);
}

// -----------------------------------------------------------------
// GitHub Pages fallback: show friendly message instead of error
// -----------------------------------------------------------------
function showStaticFallback() {
  const status = $("#loadStatus");
  const loader = $(".hero-loader");
  const hero = $("#heroSection");

  // Hide the pulse ring
  const ring = $(".pulse-ring");
  if (ring) ring.style.display = "none";

  status.style.color = "var(--text-sec)";
  status.textContent = "";

  // Build fallback UI in the hero area
  const fallback = document.createElement("div");
  fallback.style.cssText = "text-align:center; margin-top:1.5rem; max-width:500px;";
  fallback.innerHTML = `
    <div style="padding:1.25rem 1.5rem; border-radius:16px; border:1px solid var(--border); background:var(--bg-glass); backdrop-filter:blur(12px); text-align:left;">
      <h3 style="font-size:1rem; font-weight:700; margin-bottom:.5rem; color:var(--accent);">${t("staticTitle")}</h3>
      <p style="font-size:.88rem; color:var(--text-sec); margin-bottom:.75rem; line-height:1.5;">${t("staticMsg")}</p>
      <code style="display:block; padding:.5rem .75rem; border-radius:8px; background:var(--bg-solid); border:1px solid var(--border2); font-family:'JetBrains Mono',monospace; font-size:.82rem; color:var(--accent); margin-bottom:1rem;">${t("staticCmd")}</code>
      <p style="font-size:.84rem; color:var(--text-dim); margin-bottom:.75rem; line-height:1.5;">${t("staticAlt")}</p>
      <a href="docs.html" style="display:inline-flex; align-items:center; gap:.4rem; padding:.55rem 1.2rem; border-radius:10px; background:var(--accent-soft); color:var(--accent); font-size:.85rem; font-weight:600; text-decoration:none; transition:all .15s;">
        ${t("staticDocs")}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 1.5h7v7"/><path d="M10.5 1.5L1.5 10.5"/></svg>
      </a>
    </div>
  `;

  loader.after(fallback);
  loader.style.display = "none";
  $("#retryBtn").classList.add("hidden");
}

// -----------------------------------------------------------------
// Fetch groups
// -----------------------------------------------------------------
async function fetchGroups() {
  const status = $("#loadStatus");
  status.textContent = t("loadingGroups");
  status.style.color = "";
  $("#retryBtn").classList.add("hidden");

  // On GitHub Pages, skip the API call entirely
  if (IS_STATIC) {
    showStaticFallback();
    return;
  }

  try {
    const res = await fetch("/api/groups");
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    allGroups = json.groups;
    await fetchModules();
  } catch (e) {
    status.textContent = t("errorLoad") + " " + e.message;
    status.style.color = "var(--error)";
    $(".pulse-ring").style.background = "var(--error)";
    $(".pulse-ring").style.setProperty("--accent", "var(--error)");
    $("#retryBtn").classList.remove("hidden");
  }
}

// -----------------------------------------------------------------
// Fetch modules
// -----------------------------------------------------------------
async function fetchModules() {
  const status = $("#loadStatus");
  status.textContent = t("loadingModules");

  const ids = allGroups.map((g) => g.id);
  if (!ids.length) {
    status.textContent = t("noModules");
    return;
  }

  try {
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ federationIds: ids }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    allModules = json.modules;
    totalEvents = json.eventCount || 0;
    const ct = $("#eventCountText");
    if (ct) ct.textContent = `${totalEvents} ${t("eventsFound")}`;
    renderModules();
    transitionToContent();
    setTimeout(() => {
      const mc = document.getElementById("mainContent");
      if (mc) { mc.style.opacity = "1"; mc.style.visibility = "visible"; }
    }, 2200);
  } catch (e) {
    status.textContent = t("errorLoad") + " " + e.message;
    status.style.color = "var(--error)";
    $("#retryBtn").classList.remove("hidden");
  }
}

// -----------------------------------------------------------------
// Render module cards
// -----------------------------------------------------------------
function renderModules() {
  const grid = $("#moduleGrid");
  grid.innerHTML = "";

  let maxGr = 4;
  allGroups.forEach((g) => {
    const m = g.text.match(/gr\.\s*(\d+)/i);
    if (m) maxGr = Math.max(maxGr, parseInt(m[1]));
  });

  allModules.forEach((mod) => {
    const card = document.createElement("div");
    card.className = "module-card";
    card.dataset.code = mod.code;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "module-cb";
    cb.dataset.code = mod.code;

    const info = document.createElement("div");
    info.className = "module-info";

    const codeDiv = document.createElement("div");
    codeDiv.className = "module-code";
    codeDiv.textContent = mod.code;
    const nameDiv = document.createElement("div");
    nameDiv.className = "module-name";
    nameDiv.textContent = mod.name;
    nameDiv.title = mod.name;
    info.appendChild(codeDiv);
    info.appendChild(nameDiv);

    const sel = document.createElement("select");
    sel.className = "grp-select";
    sel.dataset.code = mod.code;
    sel.disabled = true;
    sel.innerHTML = '<option value="">—</option>';
    for (let i = 1; i <= maxGr; i++) sel.innerHTML += `<option value="${i}">${i}</option>`;

    card.addEventListener("click", (e) => {
      if (e.target === sel || e.target === cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change"));
    });

    cb.addEventListener("change", () => {
      sel.disabled = !cb.checked;
      card.classList.toggle("selected", cb.checked);
    });

    sel.addEventListener("click", (e) => e.stopPropagation());

    card.appendChild(cb);
    card.appendChild(info);
    card.appendChild(sel);
    grid.appendChild(card);
  });
}

// -----------------------------------------------------------------
// Select / Deselect all
// -----------------------------------------------------------------
function toggleAll(state) {
  $$(".module-cb").forEach((cb) => {
    cb.checked = state;
    cb.dispatchEvent(new Event("change"));
  });
}

// -----------------------------------------------------------------
// Generate .ics
// -----------------------------------------------------------------
async function generate() {
  const btn = $("#btnGenerate");
  const errEl = $("#formError");
  errEl.textContent = "";

  const selected = [];
  let hasError = false;

  $$(".module-cb:checked").forEach((cb) => {
    const code = cb.dataset.code;
    const sel = $(`.grp-select[data-code="${code}"]`);
    const grp = sel ? sel.value : "";
    if (!grp) {
      const mod = allModules.find((m) => m.code === code);
      errEl.textContent = t("selectGroup") + (mod ? mod.name : code);
      hasError = true;
      return;
    }
    const mod = allModules.find((m) => m.code === code);
    selected.push({ code, name: mod ? mod.name : code, tdGroup: parseInt(grp) });
  });

  if (hasError) return;
  if (!selected.length) { errEl.textContent = t("selectAtLeast"); return; }

  btn.disabled = true;
  const sp = btn.querySelector(".btn-generate-text");
  if (sp) sp.textContent = t("generating");

  try {
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: $("#startDate").value,
        endDate: $("#endDate").value,
        modules: selected,
      }),
    });
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    errEl.textContent = e.message;
  } finally {
    btn.disabled = false;
    if (sp) sp.textContent = t("generate");
  }
}

// -----------------------------------------------------------------
// Upload & Update existing .ics
// -----------------------------------------------------------------
async function uploadUpdate(file) {
  const statusEl = $("#updateStatus");
  statusEl.classList.remove("hidden");
  statusEl.className = "update-status";
  statusEl.textContent = t("updateUploading");

  const form = new FormData();
  form.append("file", file);

  try {
    const resp = await fetch("/api/update", { method: "POST", body: form });
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_calendar_updated.ics";
    a.click();
    URL.revokeObjectURL(url);
    statusEl.textContent = t("updateSuccess");
    statusEl.classList.add("update-success");
  } catch (e) {
    statusEl.textContent = t("updateError") + " " + e.message;
    statusEl.classList.add("update-error");
  }
}

function initUpdateDrop() {
  const drop = $("#updateDrop");
  const input = $("#updateFile");
  if (!drop || !input) return;

  input.addEventListener("change", () => {
    if (input.files.length) uploadUpdate(input.files[0]);
  });

  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("dragover");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
    const f = e.dataTransfer.files[0];
    if (f && f.name.toLowerCase().endsWith(".ics")) {
      uploadUpdate(f);
    }
  });
}

// -----------------------------------------------------------------
// Subscribe: get auto-update URL
// -----------------------------------------------------------------
async function subscribe() {
  const btn = $("#btnSubscribe");
  const errEl = $("#formError");
  errEl.textContent = "";

  const selected = [];
  let hasError = false;

  $$("#moduleGrid .module-cb:checked").forEach((cb) => {
    const code = cb.dataset.code;
    const sel = $(`.grp-select[data-code="${code}"]`);
    const grp = sel ? sel.value : "";
    if (!grp) {
      const mod = allModules.find((m) => m.code === code);
      errEl.textContent = t("selectGroup") + (mod ? mod.name : code);
      hasError = true;
      return;
    }
    const mod = allModules.find((m) => m.code === code);
    selected.push({ code, name: mod ? mod.name : code, tdGroup: parseInt(grp) });
  });

  if (hasError) return;
  if (!selected.length) { errEl.textContent = t("selectAtLeast"); return; }

  btn.disabled = true;
  const sp = btn.querySelector(".btn-subscribe-text");
  if (sp) sp.textContent = t("subscribing");

  try {
    const resp = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: $("#startDate").value,
        endDate: $("#endDate").value,
        modules: selected,
      }),
    });
    const json = await resp.json();
    if (!json.ok) throw new Error(json.error);

    $("#subUrl").value = json.url;
    $("#subWebcal").href = json.webcal;
    const stepsEl = $("#subSteps");
    stepsEl.innerHTML = "";
    const steps = t("subSteps");
    if (Array.isArray(steps)) {
      steps.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        stepsEl.appendChild(li);
      });
    }
    $("#subResult").classList.remove("hidden");
    $("#subResult").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) {
    errEl.textContent = e.message;
  } finally {
    btn.disabled = false;
    if (sp) sp.textContent = t("subscribe");
  }
}

function copySubUrl() {
  const input = $("#subUrl");
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = $("#btnCopy");
    const span = btn.querySelector("span");
    if (span) {
      span.textContent = t("copied");
      setTimeout(() => { span.textContent = t("copy"); }, 2000);
    }
  });
}

// -----------------------------------------------------------------
// Init
// -----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("loadStatus")) return;
  initTheme();
  setLang(lang);
  playEntrance();
  fetchGroups();
  initUpdateDrop();
});
