// Right-panel numeric readouts: per-joint instantaneous angle + min/avg/max,
// trunk lean, asymmetries, knee ROM.

import { state } from "../state.js";
import { JOINTS, MAX_HISTORY, MAX_CYCLE_HISTORY } from "../config.js";
import { $, DOM_MAP } from "./dom.js";

const MIN_SAMPLES_FOR_ASYM = 30;
const BAR_MIN = 30;
const BAR_MAX = 180;

const mean = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;

function pushBounded(arr, value, limit) {
  arr.push(value);
  if (arr.length > limit) arr.shift();
}

function updateAsymmetry(leftArr, rightArr, valId, subId) {
  if (leftArr.length <= MIN_SAMPLES_FOR_ASYM || rightArr.length <= MIN_SAMPLES_FOR_ASYM) return;
  const avgL = mean(leftArr);
  const avgR = mean(rightArr);
  const asym = (Math.abs(avgL - avgR) / ((avgL + avgR) / 2)) * 100;
  $(valId).innerHTML = asym.toFixed(1) + '<span class="unit">%</span>';
  $(subId).textContent = `L ${avgL.toFixed(0)}° / R ${avgR.toFixed(0)}°`;
}

export function updateMetrics(angles) {
  for (const j of JOINTS) {
    const v = angles[j];
    if (v == null) continue;

    pushBounded(state.history[j], v, MAX_HISTORY);
    pushBounded(state.cycleHistory[j], v, MAX_CYCLE_HISTORY);

    const dom = DOM_MAP[j];
    $(dom.v).innerHTML = v.toFixed(0) + '<span class="unit">°</span>';

    const pct = Math.max(0, Math.min(100, ((v - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100));
    $(dom.b).style.width = pct + "%";

    if (!state.minMax[j]) state.minMax[j] = { min: v, max: v };
    state.minMax[j].min = Math.min(state.minMax[j].min, v);
    state.minMax[j].max = Math.max(state.minMax[j].max, v);

    $(dom.min).textContent = state.minMax[j].min.toFixed(0);
    $(dom.max).textContent = state.minMax[j].max.toFixed(0);
    $(dom.avg).textContent = mean(state.cycleHistory[j]).toFixed(0);
  }

  if (angles.trunk != null) {
    $("v-trunk").innerHTML = angles.trunk.toFixed(0) + '<span class="unit">°</span>';
  }

  const { kneeL, kneeR, hipL, hipR } = state.cycleHistory;
  updateAsymmetry(kneeL, kneeR, "v-asym-knee", "v-asym-knee-sub");
  updateAsymmetry(hipL,  hipR, "v-asym-hip",  "v-asym-hip-sub");

  if (kneeL.length > MIN_SAMPLES_FOR_ASYM && kneeR.length > MIN_SAMPLES_FOR_ASYM) {
    const romL = Math.max(...kneeL) - Math.min(...kneeL);
    const romR = Math.max(...kneeR) - Math.min(...kneeR);
    $("v-rom-knee-L").innerHTML = romL.toFixed(0) + '<span class="unit">°</span>';
    $("v-rom-knee-R").innerHTML = romR.toFixed(0) + '<span class="unit">°</span>';
  }
}
