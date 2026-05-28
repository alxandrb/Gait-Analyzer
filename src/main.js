// Entry point — wires DOM events, the MediaPipe pipeline, and the UI panels.
//
// Pipeline per frame (called inside onResults):
//   1. resize the overlay canvas to match the video
//   2. draw the skeleton + per-joint angle labels
//   3. compute joint angles, push into history + cumulative buckets
//   4. update right-panel readouts, charts, analysis panel
//   5. detect strides (cadence), update HUD
//   6. append a raw-log entry for CSV/JSON export
//
// Modules are deferred and side-effect-free aside from main.js, which
// touches the DOM once on load.

import { state, resetState } from "./state.js";
import { CONFIDENCE_LANDMARKS, MAX_RAW_LOG } from "./config.js";
import { computeAngles } from "./core/math.js";
import { createPose } from "./core/pose.js";
import { detectStride } from "./core/stride.js";
import { $, video, overlay, overlayCtx as ctx } from "./ui/dom.js";
import { drawSkeleton, drawAngleLabels } from "./ui/overlay.js";
import { updateMetrics } from "./ui/metrics.js";
import { updateCharts } from "./ui/charts.js";
import { updateFPS, updateHUDTime } from "./ui/hud.js";
import { updateAnalysis, renderAnalysis, runFinalAnalysis, attachHelpHandler } from "./ui/analysis.js";
import { startCamera } from "./sources/camera.js";
import { loadVideoFile, resumeVideoLoop, attachSeekHandler } from "./sources/video.js";
import { exportCSV, exportJSON } from "./io/export.js";

// -------------------------------------------------------------- pipeline

function onResults(results) {
  const w = video.videoWidth || results.image?.width || 1280;
  const h = video.videoHeight || results.image?.height || 720;
  if (overlay.width !== w) {
    overlay.width = w;
    overlay.height = h;
  }
  ctx.clearRect(0, 0, w, h);

  if (!results.poseLandmarks) {
    $("hud-conf").textContent = "N/A";
    return;
  }

  const lm = results.poseLandmarks;
  drawSkeleton(ctx, lm, w, h);

  const angles = computeAngles(lm);
  drawAngleLabels(ctx, lm, angles, w, h);

  updateMetrics(angles);
  updateCharts();
  updateAnalysis();

  const conf =
    CONFIDENCE_LANDMARKS.reduce((s, i) => s + (lm[i]?.visibility ?? 0), 0) /
    CONFIDENCE_LANDMARKS.length;
  $("hud-conf").textContent = (conf * 100).toFixed(0) + "%";

  detectStride(angles, performance.now());

  if (state.running && state.rawLog.length < MAX_RAW_LOG) {
    state.rawLog.push({
      t: (performance.now() - state.startTime) / 1000,
      f: state.frameCount,
      angles,
      landmarks: lm.map((p) => ({
        x: +p.x.toFixed(4),
        y: +p.y.toFixed(4),
        z: +(p.z ?? 0).toFixed(4),
        v: +(p.visibility ?? 0).toFixed(3),
      })),
    });
  }

  state.frameCount++;
  updateFPS();
  updateHUDTime();
}

// ------------------------------------------------------------- lifecycle

function resetAll() {
  resetState();
  $("v-strides").textContent = "0";
  $("hud-cycle").textContent = "—";
  $("hud-cad").textContent = "— SPM";
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  renderAnalysis([]);
}

function stopAll() {
  state.running = false;
  if (state.camera) {
    try { state.camera.stop(); } catch {}
    state.camera = null;
  }
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }
  video.pause();
  video.src = "";
  $("s-status").classList.remove("live");
  $("s-status").textContent = "ARRÊTÉ";
}

async function handleCamera() {
  stopAll();
  resetAll();
  state.mode = "live";
  $("s-source").textContent = "CAMÉRA";
  $("s-status").innerHTML = '<span class="live">LIVE</span>';
  $("s-status").classList.add("live");
  $("stage-empty").style.display = "none";
  try {
    await startCamera();
    $("btn-stop").disabled = false;
    $("btn-reset").disabled = false;
    $("btn-playpause").disabled = true;
    $("seek").disabled = true;
  } catch (e) {
    alert("Impossible d'accéder à la caméra : " + e.message);
    $("s-status").textContent = "ERREUR";
  }
}

async function handleFile(file) {
  stopAll();
  resetAll();
  await loadVideoFile(file);
  // state.mode est désormais "video" → on rafraîchit le placeholder
  // pour signaler que l'analyse arrivera en fin de lecture.
  renderAnalysis([]);
  $("btn-stop").disabled = false;
  $("btn-reset").disabled = false;
  $("btn-playpause").disabled = false;
  $("seek").disabled = false;
}

// ----------------------------------------------------------------- events

function wireEvents() {
  $("btn-camera").addEventListener("click", handleCamera);

  $("file-input").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  });

  $("btn-stop").addEventListener("click", () => {
    stopAll();
    $("btn-stop").disabled = true;
    $("btn-playpause").disabled = true;
    $("seek").disabled = true;
  });

  $("btn-reset").addEventListener("click", resetAll);

  $("btn-playpause").addEventListener("click", () => {
    if (video.paused) {
      video.play();
      $("btn-playpause").textContent = "⏸ PAUSE";
      if (state.mode === "video") resumeVideoLoop();
    } else {
      video.pause();
      $("btn-playpause").textContent = "▶ PLAY";
    }
  });

  $("seek").addEventListener("input", (e) => {
    state.seeking = true;
    if (!isNaN(video.duration)) {
      video.currentTime = (e.target.value / 100) * video.duration;
    }
  });
  $("seek").addEventListener("change", () => { state.seeking = false; });

  // En fin de vidéo : on calcule le diagnostic une seule fois sur
  // l'ensemble des frames accumulées.
  video.addEventListener("ended", () => {
    if (state.mode === "video") runFinalAnalysis();
  });

  attachSeekHandler();

  $("btn-export-csv").addEventListener("click", exportCSV);
  $("btn-export-json").addEventListener("click", exportJSON);
}

// -------------------------------------------------------------------- init

async function init() {
  wireEvents();
  attachHelpHandler();
  state.pose = await createPose(onResults);
  $("loading").classList.add("hidden");
}

init();
