// Uploaded-video mode — sends each rendered frame to MediaPipe via
// requestVideoFrameCallback. While paused, the `seeked` event re-runs
// pose detection so the skeleton tracks scrubbing.

import { state } from "../state.js";
import { $, video } from "../ui/dom.js";

export async function loadVideoFile(file) {
  state.mode = "video";
  $("s-source").textContent = file.name.substring(0, 20).toUpperCase();
  $("s-status").textContent = "VIDÉO CHARGÉE";
  $("stage-empty").style.display = "none";

  const url = URL.createObjectURL(file);
  video.srcObject = null;
  video.src = url;
  video.muted = true;
  video.loop = false;

  await new Promise((res) => { video.onloadedmetadata = res; });
  $("resolution").textContent = `${video.videoWidth}×${video.videoHeight}`;
  const td = video.duration;
  const tm = Math.floor(td / 60);
  const ts = Math.floor(td % 60);
  $("t-total").textContent =
    `${String(tm).padStart(2, "0")}:${String(ts).padStart(2, "0")}`;

  state.running = true;
  await video.play();
  scheduleProcess();
}

function scheduleProcess() {
  if ("requestVideoFrameCallback" in video) {
    video.requestVideoFrameCallback(() => processVideoLoop());
  } else {
    requestAnimationFrame(processVideoLoop);
  }
}

async function processVideoLoop() {
  if (!state.running || state.mode !== "video") return;
  if (!video.paused && !video.ended) {
    await state.pose.send({ image: video });
  }
  if (!video.ended) {
    scheduleProcess();
  } else {
    $("s-status").textContent = "TERMINÉ";
  }
}

// Run another loop iteration (used by the play/pause handler when resuming).
export function resumeVideoLoop() {
  state.running = true;
  scheduleProcess();
}

// Scrub support: while the video is paused, re-run pose detection on
// each new frame the user reveals. Guarded against concurrent send()
// calls — MediaPipe doesn't queue them gracefully.
let scrubBusy = false;
let scrubPending = false;
export function attachSeekHandler() {
  video.addEventListener("seeked", async () => {
    if (state.mode !== "video" || !state.pose) return;
    if (!video.paused) return; // playback loop already covers this
    if (scrubBusy) { scrubPending = true; return; }
    scrubBusy = true;
    do {
      scrubPending = false;
      try { await state.pose.send({ image: video }); } catch {}
    } while (scrubPending);
    scrubBusy = false;
  });
}
