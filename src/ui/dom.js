// Centralised DOM access. Modules import the singletons they need rather
// than re-querying. Modules are loaded with `defer`, so the DOM is ready
// by the time this file evaluates.

export const $ = (id) => document.getElementById(id);

export const video = $("video");
export const overlay = $("overlay");
export const overlayCtx = overlay.getContext("2d");

// Per-joint DOM identifier map for the right-hand "ANGLES INSTANTANÉS" panel.
export const DOM_MAP = {
  kneeL: { v: "v-knee-L", b: "b-knee-L", min: "min-knee-L", max: "max-knee-L", avg: "avg-knee-L" },
  kneeR: { v: "v-knee-R", b: "b-knee-R", min: "min-knee-R", max: "max-knee-R", avg: "avg-knee-R" },
  hipL:  { v: "v-hip-L",  b: "b-hip-L",  min: "min-hip-L",  max: "max-hip-L",  avg: "avg-hip-L"  },
  hipR:  { v: "v-hip-R",  b: "b-hip-R",  min: "min-hip-R",  max: "max-hip-R",  avg: "avg-hip-R"  },
  ankL:  { v: "v-ank-L",  b: "b-ank-L",  min: "min-ank-L",  max: "max-ank-L",  avg: "avg-ank-L"  },
  ankR:  { v: "v-ank-R",  b: "b-ank-R",  min: "min-ank-R",  max: "max-ank-R",  avg: "avg-ank-R"  },
};

export function setText(id, txt) { $(id).textContent = txt; }
export function setHTML(id, html) { $(id).innerHTML = html; }
