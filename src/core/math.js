// Geometry: 3D joint angles + trunk lean.
//
// MediaPipe outputs landmarks in (x, y, z) normalized coordinates where
// y grows downward. z is approximate (per-frame depth, not metric). The
// angle math is the standard law-of-cosines on vectors A-B, C-B.

import { LM, MIN_VIS_ANGLE } from "../config.js";

// Angle at vertex B (in degrees), 0..180.
export function angle3D(A, B, C) {
  if (!A || !B || !C) return null;
  if (
    (A.visibility ?? 1) < MIN_VIS_ANGLE ||
    (B.visibility ?? 1) < MIN_VIS_ANGLE ||
    (C.visibility ?? 1) < MIN_VIS_ANGLE
  ) {
    return null;
  }
  const ABx = A.x - B.x, ABy = A.y - B.y, ABz = (A.z || 0) - (B.z || 0);
  const CBx = C.x - B.x, CBy = C.y - B.y, CBz = (C.z || 0) - (B.z || 0);
  const dot = ABx * CBx + ABy * CBy + ABz * CBz;
  const magAB = Math.hypot(ABx, ABy, ABz);
  const magCB = Math.hypot(CBx, CBy, CBz);
  if (magAB === 0 || magCB === 0) return null;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// Trunk forward lean: angle between hip→shoulder vector and vertical (image
// space, y down). 0° = perfectly upright, positive = leaning forward.
export function trunkLean(lm) {
  const ls = lm[LM.LEFT_SHOULDER], rs = lm[LM.RIGHT_SHOULDER];
  const lh = lm[LM.LEFT_HIP], rh = lm[LM.RIGHT_HIP];
  if (!ls || !rs || !lh || !rh) return null;
  const sx = (ls.x + rs.x) / 2, sy = (ls.y + rs.y) / 2;
  const hx = (lh.x + rh.x) / 2, hy = (lh.y + rh.y) / 2;
  const vx = sx - hx, vy = sy - hy;
  const mag = Math.hypot(vx, vy);
  if (mag === 0) return null;
  const cos = -vy / mag; // dot with vertical (0, -1)
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

export function computeAngles(lm) {
  return {
    kneeL: angle3D(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]),
    kneeR: angle3D(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]),
    hipL:  angle3D(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]),
    hipR:  angle3D(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE]),
    ankL:  angle3D(lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE], lm[LM.LEFT_FOOT_INDEX]),
    ankR:  angle3D(lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE], lm[LM.RIGHT_FOOT_INDEX]),
    trunk: trunkLean(lm),
  };
}
