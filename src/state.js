// Mutable runtime state — single source of truth, mutated in place.
// Modules import the same `state` object and read/write directly.
// Resetting goes through `resetState()` so we never replace the reference.

function emptyJointBuckets() {
  return { kneeL: [], kneeR: [], hipL: [], hipR: [], ankL: [], ankR: [] };
}
function emptyStrideDetector() {
  return { lastPeakTime: 0, lastValleys: [], strides: 0, cadence: 0 };
}

export const state = {
  mode: null,            // 'live' | 'video' | null
  pose: null,            // MediaPipe Pose instance
  camera: null,          // MediaPipe Camera instance (live mode only)
  running: false,        // is the pipeline actively producing frames

  frameCount: 0,
  startTime: 0,
  fpsTime: 0,
  fpsCount: 0,
  fps: 0,

  history: emptyJointBuckets(),       // rolling window for charts
  cycleHistory: emptyJointBuckets(),  // cumulative for stats / analysis
  minMax: {},                          // per-joint running min/max

  strideDetector: emptyStrideDetector(),

  rawLog: [],            // per-frame export buffer
  seeking: false,        // timeline drag in progress
};

export function resetState() {
  state.frameCount = 0;
  state.rawLog = [];
  state.minMax = {};
  state.history = emptyJointBuckets();
  state.cycleHistory = emptyJointBuckets();
  state.strideDetector = emptyStrideDetector();
  state.fpsCount = 0;
  state.fps = 0;
  state.startTime = performance.now();
  state.fpsTime = state.startTime;
}
