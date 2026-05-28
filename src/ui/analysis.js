// Analysis panel — heuristic running-form coaching.
//
// Repères biomécaniques (course à pied, vue de profil) :
//   - Cadence cible : 170–185 SPM (Heiderscheit et al.)
//   - Inclinaison du tronc : 5–10° depuis les chevilles
//   - Flexion max du genou en phase oscillante : 80–110° (angle min)
//   - Extension du genou à la poussée : 160–175° (angle max)
//   - Amplitude (ROM) du genou : 55–80°
//   - Amplitude de la hanche : 35–55°
//   - Asymétrie L/R acceptable : <5 % (warn 5–10 %, bad >10 %)
//
// Seuils indicatifs : MediaPipe 2D introduit du bruit, cinétique
// dépendante de l'allure et de la morphologie.

import { state } from "../state.js";
import { $ } from "./dom.js";
import { HELP_CONTENT } from "./help.js";

// HTML escape helpers (les conseils sont en dur dans le code, mais le
// contenu d'aide passe par <pre> et <li> → autant rester safe).
const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

const MIN_SAMPLES = 60;          // ~2 s @ 30 fps before producing a verdict
const REDRAW_INTERVAL_MS = 750;
const SEVERITY_RANK = { good: 0, warn: 1, bad: 2 };
const ICON = { good: "✓", warn: "!", bad: "✗" };
const SEV_POINTS = { good: 100, warn: 60, bad: 20 };

const mean = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;
const havePair = (a, b) =>
  state.cycleHistory[a].length > MIN_SAMPLES &&
  state.cycleHistory[b].length > MIN_SAMPLES;

// ---------------------------------------------------------------- rules
// Each rule is `(state) => diagnostic | null`. Diagnostic shape:
//   { sev, title, advice, meas, unit }

function ruleCadence() {
  const { strides, cadence: cad } = state.strideDetector;
  if (strides < 3 || cad <= 0) return null;
  let sev, advice;
  if (cad >= 170 && cad <= 185) {
    sev = "good";
    advice = "Cadence dans la zone optimale — limite l'impact au sol et le risque de blessure.";
  } else if (cad >= 160 && cad < 170) {
    sev = "warn";
    advice = "Cadence un peu basse. Vise +5 % progressivement (métronome ou musique à 175 BPM) pour réduire l'overstriding.";
  } else if (cad > 185 && cad <= 195) {
    sev = "warn";
    advice = "Cadence élevée — vérifie que tu ne raccourcis pas la foulée par crispation ; respire profondément.";
  } else if (cad < 160) {
    sev = "bad";
    advice = "Cadence trop basse : foulées probablement trop longues, attaque talon marquée. Augmente la fréquence de pas par paliers.";
  } else {
    sev = "bad";
    advice = "Cadence très élevée — possible compensation (douleur, mauvais appui). Filme-toi à allure facile et compare.";
  }
  return { id: "cadence", sev, title: "Cadence", advice, meas: cad.toFixed(0), unit: "SPM" };
}

function ruleTrunkLean() {
  if (state.frameCount <= MIN_SAMPLES) return null;
  const tail = state.rawLog.slice(-Math.min(180, state.rawLog.length));
  const vals = tail.map((r) => r.angles.trunk).filter((v) => v != null);
  if (vals.length <= 30) return null;
  const trunkAvg = mean(vals);

  let sev, advice;
  if (trunkAvg >= 4 && trunkAvg <= 12) {
    sev = "good";
    advice = "Bonne inclinaison du tronc — tu utilises la gravité pour avancer sans casser au niveau de la taille.";
  } else if (trunkAvg < 4) {
    sev = "warn";
    advice = "Tronc trop vertical. Penche-toi légèrement depuis les chevilles (pas le ventre), comme si tu allais tomber en avant.";
  } else if (trunkAvg <= 18) {
    sev = "warn";
    advice = "Inclinaison un peu marquée. Vérifie que tu ne casses pas au bassin — l'inclinaison doit venir des chevilles.";
  } else {
    sev = "bad";
    advice = "Tronc trop incliné / cassure au niveau de la taille. Engage les abdos, ouvre la poitrine, regarde 15–20 m devant.";
  }
  return { id: "trunk", sev, title: "Inclinaison du tronc", advice, meas: trunkAvg.toFixed(0), unit: "°" };
}

function ruleKneeSwingFlexion() {
  if (!havePair("kneeL", "kneeR")) return null;
  const minAvg = (Math.min(...state.cycleHistory.kneeL) + Math.min(...state.cycleHistory.kneeR)) / 2;
  let sev, advice;
  if (minAvg >= 70 && minAvg <= 115) {
    sev = "good";
    advice = "Bon retour de talon en phase oscillante — la jambe se replie correctement, économie d'énergie.";
  } else if (minAvg > 115 && minAvg <= 135) {
    sev = "warn";
    advice = "Talon insuffisamment relevé. Cherche à laisser la jambe se replier passivement (« retour du talon vers la fesse »).";
  } else if (minAvg < 70) {
    sev = "warn";
    advice = "Repli du genou très marqué — typique des sprinteurs ; en endurance ça coûte cher.";
  } else {
    sev = "bad";
    advice = "Jambe quasi tendue en phase oscillante : grosse perte d'efficacité, foulée raide. Travaille des éducatifs type « talons-fesses ».";
  }
  return { id: "kneeSwing", sev, title: "Flexion genou (oscillation)", advice, meas: minAvg.toFixed(0), unit: "°" };
}

function ruleKneeRom() {
  if (!havePair("kneeL", "kneeR")) return null;
  const { kneeL, kneeR } = state.cycleHistory;
  const romAvg = ((Math.max(...kneeL) - Math.min(...kneeL)) + (Math.max(...kneeR) - Math.min(...kneeR))) / 2;
  let sev, advice;
  if (romAvg >= 55 && romAvg <= 85) {
    sev = "good";
    advice = "Amplitude de genou cohérente avec une foulée dynamique.";
  } else if (romAvg >= 40 && romAvg < 55) {
    sev = "warn";
    advice = "Amplitude un peu courte — foulée potentiellement trop trottinée. Pousse plus longtemps au sol.";
  } else if (romAvg > 85 && romAvg <= 110) {
    sev = "warn";
    advice = "Amplitude élevée — tu es dans un registre sprint / bondissement, coûteux en endurance.";
  } else if (romAvg < 40) {
    sev = "bad";
    advice = "Très faible amplitude au genou : foulée très raide, peu de propulsion. Vérifie souplesse ischios et mobilité hanche.";
  } else {
    sev = "bad";
    advice = "Amplitude exagérée (>110°) : geste de sprinteur pur. À allure d'endurance, c'est très énergivore — relâche le repli.";
  }
  return { id: "kneeRom", sev, title: "Amplitude du genou (ROM)", advice, meas: romAvg.toFixed(0), unit: "°" };
}

function ruleHipRom() {
  if (!havePair("hipL", "hipR")) return null;
  const { hipL, hipR } = state.cycleHistory;
  const romAvg = ((Math.max(...hipL) - Math.min(...hipL)) + (Math.max(...hipR) - Math.min(...hipR))) / 2;
  let sev, advice;
  if (romAvg >= 30 && romAvg <= 55) {
    sev = "good";
    advice = "Bonne ouverture de hanche — moteur principal de la course actif.";
  } else if (romAvg >= 20 && romAvg < 30) {
    sev = "warn";
    advice = "Manque d'extension de hanche. Souvent dû à des psoas/fléchisseurs raides (position assise prolongée). Mobilité + fentes.";
  } else if (romAvg > 55 && romAvg <= 70) {
    sev = "warn";
    advice = "Amplitude de hanche élevée — vérifie que tu ne sur-tires pas la jambe arrière (peut indiquer une avancée excessive du pied avant).";
  } else if (romAvg < 20) {
    sev = "bad";
    advice = "Hanches très verrouillées : tu cours « avec les genoux ». Travaille mobilité hanche + renfo fessiers (pont, hip thrust).";
  } else {
    sev = "bad";
    advice = "Amplitude de hanche très élevée (>70°) : foulée probablement trop ample, sur-utilisation des fléchisseurs. Augmente la cadence.";
  }
  return { id: "hipRom", sev, title: "Amplitude des hanches", advice, meas: romAvg.toFixed(0), unit: "°" };
}

function ruleKneeAsymmetry() {
  if (!havePair("kneeL", "kneeR")) return null;
  const avgL = mean(state.cycleHistory.kneeL);
  const avgR = mean(state.cycleHistory.kneeR);
  const asym = (Math.abs(avgL - avgR) / ((avgL + avgR) / 2)) * 100;
  const dominant = avgL < avgR ? "gauche" : "droit";
  let sev, advice;
  if (asym < 5) {
    sev = "good";
    advice = "Genoux symétriques — pas de signal d'alarme côté équilibre L/R.";
  } else if (asym < 10) {
    sev = "warn";
    advice = `Asymétrie modérée (genou ${dominant} plus fléchi). Travaille en unilatéral (split squats) pour réduire l'écart.`;
  } else {
    sev = "bad";
    advice = `Forte asymétrie (genou ${dominant} dominant). Possible compensation ou douleur ; consulte si persistant.`;
  }
  return { id: "kneeAsym", sev, title: "Symétrie L/R des genoux", advice, meas: asym.toFixed(1), unit: "%" };
}

function ruleHipAsymmetry() {
  if (!havePair("hipL", "hipR")) return null;
  const avgL = mean(state.cycleHistory.hipL);
  const avgR = mean(state.cycleHistory.hipR);
  const asym = (Math.abs(avgL - avgR) / ((avgL + avgR) / 2)) * 100;
  let sev, advice;
  if (asym < 5) {
    sev = "good";
    advice = "Hanches équilibrées en moyenne.";
  } else if (asym < 10) {
    sev = "warn";
    advice = "Asymétrie de hanche modérée — souvent liée à un fessier moyen plus faible d'un côté.";
  } else {
    sev = "bad";
    advice = "Asymétrie marquée — surveille bassin/hanche, renforce le gainage latéral (planche latérale, clamshell).";
  }
  return { id: "hipAsym", sev, title: "Symétrie L/R des hanches", advice, meas: asym.toFixed(1), unit: "%" };
}

const RULES = [
  ruleCadence,
  ruleTrunkLean,
  ruleKneeSwingFlexion,
  ruleKneeRom,
  ruleHipRom,
  ruleKneeAsymmetry,
  ruleHipAsymmetry,
];

export function buildDiagnostics() {
  return RULES.map((rule) => rule()).filter(Boolean);
}

// ---------------------------------------------------------------- render

function scoreLabel(score) {
  if (score >= 85) return { lbl: "EXCELLENT", color: "var(--good)" };
  if (score >= 70) return { lbl: "CORRECT", color: "var(--good)" };
  if (score >= 55) return { lbl: "À AMÉLIORER", color: "var(--warn)" };
  return { lbl: "TECHNIQUE À RETRAVAILLER", color: "var(--bad)" };
}

export function renderAnalysis(diags) {
  const list = $("diag-list");
  if (diags.length === 0) {
    const isVideo = state.mode === "video";
    const msg = isVideo
      ? "ANALYSE DISPONIBLE EN FIN DE LECTURE"
      : "ANALYSE EN COURS — LAISSEZ TOURNER QUELQUES FOULÉES";
    const lbl = isVideo ? "EN ATTENTE FIN DE VIDÉO" : "EN ATTENTE DE DONNÉES";
    list.innerHTML = `<div class="diag-empty">${msg}</div>`;
    $("a-score").innerHTML = '—<span class="unit">/100</span>';
    $("a-score-lbl").textContent = lbl;
    $("a-score").style.color = "";
    $("a-score-lbl").style.color = "";
    return;
  }

  const score = Math.round(
    diags.map((d) => SEV_POINTS[d.sev]).reduce((s, x) => s + x, 0) / diags.length,
  );
  const { lbl, color } = scoreLabel(score);
  $("a-score").innerHTML = score + '<span class="unit">/100</span>';
  $("a-score-lbl").textContent = lbl;
  $("a-score").style.color = color;
  $("a-score-lbl").style.color = color;

  diags.sort((a, b) => SEVERITY_RANK[b.sev] - SEVERITY_RANK[a.sev]);
  list.innerHTML = diags.map(renderDiagItem).join("");
}

function renderDiagItem(d) {
  const help = HELP_CONTENT[d.id];
  const helpBtn = help
    ? `<button class="help-btn" data-help="${d.id}" aria-label="Plus d'infos">?</button>`
    : "";
  const helpBlock = help
    ? `<div class="diag-help" id="help-${d.id}" hidden>
         <pre class="diag-schema">${esc(help.schema.trim())}</pre>
         <ul class="diag-tips">${help.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
       </div>`
    : "";
  return `
    <div class="diag ${d.sev}">
      <div class="diag-row">
        <div class="icon">${ICON[d.sev]}</div>
        <div class="body">
          <div class="title">${esc(d.title)}${helpBtn}</div>
          <div class="advice">${esc(d.advice)}</div>
        </div>
        <div class="meas">${esc(d.meas)}<span class="unit">${esc(d.unit)}</span></div>
      </div>
      ${helpBlock}
    </div>`;
}

// One-time event delegation : un clic sur un bouton ? ouvre/ferme la section
// d'aide correspondante. À appeler depuis main.js après le boot.
export function attachHelpHandler() {
  $("diag-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".help-btn");
    if (!btn) return;
    const id = btn.dataset.help;
    const block = $("help-" + id);
    if (!block) return;
    const isOpen = !block.hasAttribute("hidden");
    if (isOpen) {
      block.setAttribute("hidden", "");
      btn.textContent = "?";
    } else {
      block.removeAttribute("hidden");
      btn.textContent = "×";
    }
  });
}

let lastAnalysis = 0;
export function updateAnalysis() {
  // En mode vidéo, le diagnostic est différé jusqu'à la fin de lecture
  // (cf. main.js → `video.ended`). Cela évite la double-comptabilisation
  // si l'utilisateur scrubbe la timeline avant la fin.
  if (state.mode === "video") return;
  const now = performance.now();
  if (now - lastAnalysis < REDRAW_INTERVAL_MS) return;
  lastAnalysis = now;
  renderAnalysis(buildDiagnostics());
}

// Déclenché une fois en fin de vidéo : produit le diagnostic complet sur
// l'ensemble des frames accumulées depuis le dernier reset.
export function runFinalAnalysis() {
  renderAnalysis(buildDiagnostics());
}
