// Stride detection — simple valley finder on the left knee flexion signal.
//
// Rationale: during the swing phase the knee flexes (angle reaches a local
// minimum around 70–110°). We look 3 frames back and require it to dip at
// least 15° below both neighbours, with a 300 ms debounce. Cadence is
// derived from the moving mean of inter-valley intervals (×2 since we
// only count one leg).

import { state } from "../state.js";
import { $ } from "../ui/dom.js";

const LOOKBACK = 7;
const DIP_THRESHOLD = 15;
const MAX_FLEXION_FOR_VALLEY = 100;
const DEBOUNCE_MS = 300;
const MAX_GAP_MS = 1500;
const SMOOTHING_WINDOW = 6;

export function detectStride(angles, now) {
  if (angles.kneeL == null) return;
  const buf = state.strideDetector;
  const hist = state.history.kneeL;
  if (hist.length < LOOKBACK) return;

  const n = hist.length;
  const c = hist[n - 4];
  const a = hist[n - 7];
  const b = hist[n - 1];
  const isValley =
    c < a - DIP_THRESHOLD &&
    c < b - DIP_THRESHOLD &&
    c < MAX_FLEXION_FOR_VALLEY;
  if (!isValley) return;

  const dt = now - buf.lastPeakTime;
  if (dt <= DEBOUNCE_MS) return;

  if (buf.lastPeakTime > 0 && dt < MAX_GAP_MS) {
    buf.lastValleys.push(dt);
    if (buf.lastValleys.length > SMOOTHING_WINDOW) buf.lastValleys.shift();
    const avgDt =
      buf.lastValleys.reduce((s, x) => s + x, 0) / buf.lastValleys.length;
    buf.cadence = (60000 / avgDt) * 2; // steps per minute (both legs)
  }
  buf.lastPeakTime = now;
  buf.strides++;

  $("v-strides").textContent = buf.strides;
  $("hud-cycle").textContent = "#" + buf.strides;
  $("hud-cad").textContent =
    (buf.cadence > 0 ? buf.cadence.toFixed(0) : "—") + " SPM";
}
