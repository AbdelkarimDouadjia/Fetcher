/* =================================================================
   Fetcher – Static GitHub Pages app.js
   GSAP animations · i18n · theme · reads calendar-config.json
   ================================================================= */

// -----------------------------------------------------------------
// i18n
// -----------------------------------------------------------------
const I18N = {
  fr: {
    heroBadge: "Calendrier UVSQ — GitHub Pages",
    heroLine1: "Ton emploi du temps,",
    heroLine2: "toujours à jour",
    heroSub: "Calendrier auto-actualisé depuis CELCAT. Abonne-toi une fois, reste synchronisé pour toujours.",
    loadingGroups: "Chargement de la configuration...",
    loadingModules: "Chargement des modules...",
    errorLoad: "Erreur de chargement.",
    retry: "Réessayer",
    semester: "Semestre S2 — 2025/2026",
    dateFrom: "Du",
    dateTo: "Au",
    pickerTitle: "Modules configurés",
    pickerSub: "Ces modules sont récupérés automatiquement depuis CELCAT toutes les 6 heures.",
    selectAll: "Tout sélectionner",
    deselectAll: "Tout décocher",
    examNote: "Examens, partiels et soutenances sont toujours inclus automatiquement.",
    generate: "Télécharger le calendrier (.ics)",
    generating: "Téléchargement...",
    noModules: "Aucun module configuré.",
    eventsFound: "modules configurés",
    guide: "Guide d'import",
    subscribe: "Obtenir le lien d'abonnement",
    subTitle: "Ton lien d'abonnement",
    subDesc: "Abonne-toi à ce lien dans ton appli calendrier. Il se met à jour automatiquement toutes les 6 heures via GitHub Actions.",
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
    subHostNote: "",
    orSetup: "tu veux configurer ton propre calendrier ?",
    setupTitle: "Configure ton propre calendrier",
    setupDesc: "Fork le dépôt, modifie la config avec tes modules, et tu auras ton propre calendrier auto-actualisé. 100% gratuit.",
    setupBtn: "Voir le guide de configuration",
    docsLink: "Documentation complète",
    forkBtn: "Fork & Commencer",
  },
  en: {
    heroBadge: "UVSQ Calendar — GitHub Pages",
    heroLine1: "Your schedule,",
    heroLine2: "always in sync",
    heroSub: "Auto-updating university calendar from CELCAT. Subscribe once, stay synced forever.",
    loadingGroups: "Loading configuration...",
    loadingModules: "Loading modules...",
    errorLoad: "Loading error.",
    retry: "Retry",
    semester: "Semester S2 — 2025/2026",
    dateFrom: "From",
    dateTo: "To",
    pickerTitle: "Configured modules",
    pickerSub: "These modules are fetched automatically from CELCAT every 6 hours.",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    examNote: "Exams, midterms and defenses are always included automatically.",
    generate: "Download calendar (.ics)",
    generating: "Downloading...",
    noModules: "No modules configured.",
    eventsFound: "modules configured",
    guide: "Import guide",
    subscribe: "Get subscription link",
    subTitle: "Your subscription link",
    subDesc: "Subscribe to this link in your calendar app. It auto-updates every 6 hours via GitHub Actions.",
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
    subHostNote: "",
    orSetup: "want to set up your own calendar?",
    setupTitle: "Set up your own calendar",
    setupDesc: "Fork the repo, edit the config with your modules, and you'll have your own auto-updating calendar. 100% free.",
    setupBtn: "View setup guide",
    docsLink: "Full documentation",
    forkBtn: "Fork & Get Started",
  },
};

// -----------------------------------------------------------------
// State
// -----------------------------------------------------------------
let lang = localStorage.getItem("lang") || (navigator.language.startsWith("fr") ? "fr" : "en");
let configModules = [];

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
// i18n helpers
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
  if (configModules.length) {
    const ct = $("#eventCountText");
    if (ct) ct.textContent = `${configModules.length} ${t("eventsFound")}`;
    renderModules();
  }
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
  tl.fromTo(".btn-subscribe", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }, 1.1);
  tl.fromTo(".setup-section", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, 1.2);
  tl.set("#scrollHint", { display: "none" }, .5);
}

// -----------------------------------------------------------------
// Load config: read calendar-config.json
// -----------------------------------------------------------------
async function loadConfig() {
  const status = $("#loadStatus");
  status.textContent = t("loadingGroups");
  $("#retryBtn").classList.add("hidden");

  try {
    const res = await fetch("calendar-config.json");
    if (!res.ok) throw new Error("Config not found");
    const config = await res.json();

    configModules = config.modules || [];

    // Set dates
    const sd = $("#startDate");
    const ed = $("#endDate");
    if (sd && config.startDate) sd.value = config.startDate;
    if (ed && config.endDate) ed.value = config.endDate;

    if (!configModules.length) {
      status.textContent = t("noModules");
      return;
    }

    const ct = $("#eventCountText");
    if (ct) ct.textContent = `${configModules.length} ${t("eventsFound")}`;

    renderModules();
    transitionToContent();
    setTimeout(() => {
      const mc = document.getElementById("mainContent");
      if (mc) { mc.style.opacity = "1"; mc.style.visibility = "visible"; }
    }, 2200);
  } catch (e) {
    status.textContent = t("errorLoad") + " " + e.message;
    status.style.color = "var(--error)";
    $(".pulse-ring").style.background = "var(--error)";
    $("#retryBtn").classList.remove("hidden");
  }
}

// -----------------------------------------------------------------
// Render module cards (from config, read-only display with groups)
// -----------------------------------------------------------------
function renderModules() {
  const grid = $("#moduleGrid");
  grid.innerHTML = "";

  configModules.forEach((mod) => {
    const card = document.createElement("div");
    card.className = "module-card selected";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "module-cb";
    cb.checked = true;
    cb.disabled = true;

    const info = document.createElement("div");
    info.className = "module-info";

    const safeName = mod.name || mod.code;
    const safeCode = mod.code || "";
    info.innerHTML = "";
    const codeDiv = document.createElement("div");
    codeDiv.className = "module-code";
    codeDiv.textContent = safeCode;
    const nameDiv = document.createElement("div");
    nameDiv.className = "module-name";
    nameDiv.textContent = safeName;
    nameDiv.title = safeName;
    info.appendChild(codeDiv);
    info.appendChild(nameDiv);

    const grpBadge = document.createElement("span");
    grpBadge.className = "grp-badge";
    grpBadge.textContent = "gr." + mod.tdGroup;

    card.appendChild(cb);
    card.appendChild(info);
    card.appendChild(grpBadge);
    grid.appendChild(card);
  });
}

// -----------------------------------------------------------------
// Download calendar.ics
// -----------------------------------------------------------------
function downloadCalendar() {
  const a = document.createElement("a");
  a.href = "calendar.ics";
  a.download = "calendar.ics";
  a.click();
}

// -----------------------------------------------------------------
// Show subscription URL
// -----------------------------------------------------------------
function showSubscription() {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
  const calUrl = baseUrl + "calendar.ics";

  $("#subUrl").value = calUrl;
  $("#subWebcal").href = "webcal:" + calUrl.replace(/^https?:/, "");

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
  loadConfig();
});
