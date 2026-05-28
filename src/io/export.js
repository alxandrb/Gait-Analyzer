// CSV / JSON export of the raw per-frame log.

import { state } from "../state.js";

function download(content, name, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fmt = (v) => (v == null ? "" : v.toFixed(2));

export function exportCSV() {
  if (state.rawLog.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }
  const header = "time_s,frame,knee_L,knee_R,hip_L,hip_R,ankle_L,ankle_R,trunk\n";
  const rows = state.rawLog.map((r) => {
    const a = r.angles;
    return `${r.t.toFixed(3)},${r.f},${fmt(a.kneeL)},${fmt(a.kneeR)},${fmt(a.hipL)},${fmt(a.hipR)},${fmt(a.ankL)},${fmt(a.ankR)},${fmt(a.trunk)}`;
  });
  download(header + rows.join("\n") + "\n", "gait_data.csv", "text/csv");
}

export function exportJSON() {
  if (state.rawLog.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }
  const json = JSON.stringify(
    {
      meta: {
        generatedAt: new Date().toISOString(),
        frames: state.rawLog.length,
        strides: state.strideDetector.strides,
        cadence: state.strideDetector.cadence,
        stats: state.minMax,
      },
      data: state.rawLog,
    },
    null,
    2,
  );
  download(json, "gait_data.json", "application/json");
}
