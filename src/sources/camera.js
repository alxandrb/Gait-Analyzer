// Live camera mode — opens getUserMedia, drives MediaPipe via the
// vendor `Camera` helper.

import { state } from "../state.js";
import { $, video } from "../ui/dom.js";

export async function startCamera() {
  const CameraCtor = window.Camera;
  if (!CameraCtor) throw new Error("MediaPipe Camera script not loaded");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "environment",
    },
    audio: false,
  });
  video.srcObject = stream;
  video.src = "";
  await video.play();

  $("resolution").textContent = `${video.videoWidth}×${video.videoHeight}`;
  state.running = true;

  state.camera = new CameraCtor(video, {
    onFrame: async () => {
      if (state.running && state.mode === "live") {
        await state.pose.send({ image: video });
      }
    },
    width: video.videoWidth,
    height: video.videoHeight,
  });
  state.camera.start();
}
