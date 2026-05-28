// Thin wrapper around the MediaPipe Pose engine. The library is loaded
// via a <script> tag (UMD), so we read it off window.

export async function createPose(onResults) {
  const PoseCtor = window.Pose;
  if (!PoseCtor) throw new Error("MediaPipe Pose script not loaded");

  const pose = new PoseCtor({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  pose.onResults(onResults);
  await pose.initialize?.();
  return pose;
}
