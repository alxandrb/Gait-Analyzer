// Static configuration: landmark indices, skeleton topology, palette, limits.
// Nothing in here depends on the DOM or runtime state.

// MediaPipe Pose landmark indices (33-point topology)
export const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

export const LEFT_LM = new Set([11, 23, 25, 27, 29, 31]);
export const RIGHT_LM = new Set([12, 24, 26, 28, 30, 32]);

// Bone connections used for the overlay skeleton (vue de profil → torse + jambes)
export const SKELETON_PAIRS = [
  // torso
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  // left leg
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_HEEL],
  [LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX],
  [LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX],
  // right leg
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX],
  [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
];

export const KEY_POINTS = [
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
  LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE,
  LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
  LM.LEFT_HEEL, LM.RIGHT_HEEL,
  LM.LEFT_FOOT_INDEX, LM.RIGHT_FOOT_INDEX,
];

export const CONFIDENCE_LANDMARKS = [
  LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE,
  LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
];

export const COLORS = {
  left: "#ff6b1a",
  right: "#4ad6e0",
  neutral: "#888",
  grid: "#1f1f1f",
  gridLabel: "#555",
};

// Tracked joints (used as keys in state buckets and DOM maps)
export const JOINTS = ["kneeL", "kneeR", "hipL", "hipR", "ankL", "ankR"];

// Rolling window for live charts (~6 s at 40 fps)
export const MAX_HISTORY = 240;

// Cap on cumulative history kept for stats (~2 min @ 50 fps)
export const MAX_CYCLE_HISTORY = 6000;

// Cap on rawLog entries (export protection)
export const MAX_RAW_LOG = 100000;

// Minimum landmark visibility before we trust an angle / draw a bone
export const MIN_VIS_ANGLE = 0.4;
export const MIN_VIS_BONE = 0.3;
