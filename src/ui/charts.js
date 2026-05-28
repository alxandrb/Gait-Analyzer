// Time-series line charts for the rolling history of left/right joint angles.

import { state } from "../state.js";
import { MAX_HISTORY, COLORS } from "../config.js";
import { $ } from "./dom.js";

const REDRAW_INTERVAL_MS = 50; // ~20 fps

function drawGrid(ctx, W, H) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = (i / 4) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawAxis(ctx, W, H, mn, mx) {
  ctx.fillStyle = COLORS.gridLabel;
  ctx.font = '9px "Space Mono", monospace';
  ctx.textAlign = "right";
  for (let i = 0; i < 5; i++) {
    const val = mx - (i / 4) * (mx - mn);
    ctx.fillText(val.toFixed(0) + "°", W - 4, (i / 4) * H + 9);
  }
}

function plotLine(ctx, arr, color, W, H, mn, mx) {
  if (arr.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v == null) { started = false; continue; }
    const px = (i / (MAX_HISTORY - 1)) * (W - 30);
    const py = H - ((v - mn) / (mx - mn)) * H;
    if (!started) { ctx.moveTo(px, py); started = true; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function computeRange(leftArr, rightArr) {
  const all = [...leftArr, ...rightArr].filter((v) => v != null);
  if (all.length === 0) return null;
  let mn = Math.min(...all);
  let mx = Math.max(...all);
  const pad = (mx - mn) * 0.1 + 5;
  mn -= pad;
  mx += pad;
  if (mx - mn < 20) {
    const m = (mn + mx) / 2;
    mn = m - 15;
    mx = m + 15;
  }
  return { mn, mx };
}

function drawChart(canvasId, leftArr, rightArr) {
  const c = $(canvasId);
  const dpr = window.devicePixelRatio || 1;
  const W = c.clientWidth;
  const H = c.clientHeight;
  if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  drawGrid(ctx, W, H);
  const range = computeRange(leftArr, rightArr);
  if (!range) return;
  drawAxis(ctx, W, H, range.mn, range.mx);
  plotLine(ctx, leftArr,  COLORS.left,  W, H, range.mn, range.mx);
  plotLine(ctx, rightArr, COLORS.right, W, H, range.mn, range.mx);
}

let lastDraw = 0;
export function updateCharts() {
  const now = performance.now();
  if (now - lastDraw < REDRAW_INTERVAL_MS) return;
  lastDraw = now;
  drawChart("chart-knee",  state.history.kneeL, state.history.kneeR);
  drawChart("chart-hip",   state.history.hipL,  state.history.hipR);
  drawChart("chart-ankle", state.history.ankL,  state.history.ankR);
}
