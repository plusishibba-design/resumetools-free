// Accent color presets — used for the resume / letter document accents
// (headings em, dates, modern template stripes, page break visualizer).
// Each preset defines three coordinated shades:
//   deep:  primary accent (replaces --color-clay-deep)
//   light: secondary accent (replaces --color-clay)
//   soft:  tinted background (replaces --color-clay-soft)

export const ACCENT_PRESETS = [
  { id: 'clay',     deep: '#a8704c', light: '#d8956a', soft: '#f1d9c2' }, // default — terracotta
  { id: 'ink',      deep: '#3d3530', light: '#5a4f48', soft: '#d8d1c2' }, // monochrome — charcoal
  { id: 'navy',     deep: '#2a3654', light: '#4a5a7a', soft: '#c5cdd9' }, // editorial navy
  { id: 'forest',   deep: '#3a5a3f', light: '#6a8b6f', soft: '#c5d5c8' }, // muted forest
  { id: 'burgundy', deep: '#7a2c3a', light: '#a04555', soft: '#dcc0c5' }, // deep burgundy
  { id: 'olive',    deep: '#5a5a2a', light: '#7a7a4a', soft: '#cdcdb0' }, // olive editorial
  { id: 'plum',     deep: '#553a5e', light: '#7a5e85', soft: '#d4c5dc' }, // muted plum
];

export const DEFAULT_ACCENT_ID = 'clay';

export function getAccent(id) {
  return ACCENT_PRESETS.find((p) => p.id === id) || ACCENT_PRESETS[0];
}

// CSS variable map for the preview wrapper inline style
export function accentVars(accent) {
  return {
    '--color-clay-deep': accent.deep,
    '--color-clay': accent.light,
    '--color-clay-soft': accent.soft,
  };
}
