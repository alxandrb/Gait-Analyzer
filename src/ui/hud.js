// Live HUD: FPS counter and elapsed-time / video-time readouts.

import { state } from "../state.js";
import { $, video } from "./dom.js";

const FPS_WINDOW_MS = 500;

function fmtTime(t) {
  const tm = Math.floor(t / 60);
  const ts = (t % 60).toFixed(2);
  return `${String(tm).padStart(2, "0")}:${ts.padStart(5, "0")}`;
}

export function updateFPS() {
  const now = performance.now();
  state.fpsCount++;
  if (now - state.fpsTime > FPS_WINDOW_MS) {
    state.fps = state.fpsCount / ((now - state.fpsTime) / 1000);
    state.fpsTime = now;
    state.fpsCount = 0;
    $("s-fps").textContent = state.fps.toFixed(0);
  }
  $("s-frame").textContent = String(state.frameCount).padStart(4, "0");
}

export function updateHUDTime() {
  if (state.mode === "video" && !isNaN(video.duration)) {
    const t = video.currentTime;
    $("hud-time").textContent = fmtTime(t);
    const tm = Math.floor(t / 60);
    const ts = Math.floor(t % 60);
    $("t-current").textContent =
      `${String(tm).padStart(2, "0")}:${String(ts).padStart(2, "0")}`;
    if (!state.seeking) $("seek").value = (t / video.duration) * 100;
  } else if (state.mode === "live") {
    const t = (performance.now() - state.startTime) / 1000;
    $("hud-time").textContent = fmtTime(t);
  }
}
