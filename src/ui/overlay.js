// Skeleton + per-joint angle labels rendered on the canvas overlay.

import {
  LM, SKELETON_PAIRS, LEFT_LM, RIGHT_LM, KEY_POINTS,
  COLORS, MIN_VIS_BONE, MIN_VIS_ANGLE,
} from "../config.js";

function boneColor(a, b) {
  if (LEFT_LM.has(a) && LEFT_LM.has(b)) return COLORS.left;
  if (RIGHT_LM.has(a) && RIGHT_LM.has(b)) return COLORS.right;
  return COLORS.neutral;
}

export function drawSkeleton(ctx, lm, w, h) {
  ctx.lineWidth = 3;
  for (const [a, b] of SKELETON_PAIRS) {
    const A = lm[a], B = lm[b];
    if (!A || !B) continue;
    if ((A.visibility ?? 1) < MIN_VIS_BONE || (B.visibility ?? 1) < MIN_VIS_BONE) continue;
    ctx.strokeStyle = boneColor(a, b);
    ctx.beginPath();
    ctx.moveTo(A.x * w, A.y * h);
    ctx.lineTo(B.x * w, B.y * h);
    ctx.stroke();
  }

  for (const i of KEY_POINTS) {
    const p = lm[i];
    if (!p || (p.visibility ?? 1) < MIN_VIS_BONE) continue;
    ctx.fillStyle = LEFT_LM.has(i) ? COLORS.left : COLORS.right;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

const ANGLE_LABELS = [
  { lm: LM.LEFT_KNEE,   key: "kneeL", color: COLORS.left  },
  { lm: LM.RIGHT_KNEE,  key: "kneeR", color: COLORS.right },
  { lm: LM.LEFT_HIP,    key: "hipL",  color: COLORS.left  },
  { lm: LM.RIGHT_HIP,   key: "hipR",  color: COLORS.right },
  { lm: LM.LEFT_ANKLE,  key: "ankL",  color: COLORS.left  },
  { lm: LM.RIGHT_ANKLE, key: "ankR",  color: COLORS.right },
];

export function drawAngleLabels(ctx, lm, angles, w, h) {
  ctx.font = 'bold 14px "Space Mono", monospace';
  ctx.textAlign = "left";
  for (const { lm: idx, key, color } of ANGLE_LABELS) {
    const p = lm[idx];
    const val = angles[key];
    if (!p || val == null || (p.visibility ?? 1) < MIN_VIS_ANGLE) continue;
    const x = p.x * w + 12;
    const y = p.y * h + 4;
    const txt = val.toFixed(0) + "°";
    const wT = ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 3, y - 13, wT + 6, 18);
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }
}
