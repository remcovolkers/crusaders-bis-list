// Small deterministic helpers shared by the fixtures. No randomness at import time: the same
// fixtures are produced on every run so screenshots can be diffed.

/** Fixed "now" so relative dates in the fixtures never drift. */
export const NOW = new Date('2026-10-21T17:00:00.000Z');

export const iso = (daysFromNow, hour = null, minute = 0) => {
  const d = new Date(NOW.getTime() + daysFromNow * 86400000);
  if (hour !== null) d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
};

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Offline item icon (data URI) so screenshots do not depend on the WoW CDN. A rounded tile with a
 * hue derived from the seed, a diagonal sheen and a glyph.
 */
export function icon(seed, glyph = '?') {
  const hue = hash(seed) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},62%,48%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},55%,22%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="56" height="56" rx="6" fill="url(#g)"/>` +
    `<rect x="1" y="1" width="54" height="54" rx="5" fill="none" stroke="#d4a64a" stroke-opacity=".55" stroke-width="2"/>` +
    `<text x="28" y="37" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="700" fill="#fff" fill-opacity=".9">${glyph}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Video-thumbnail style data URI for boss resources. */
export function thumb(seed, label) {
  const hue = hash(seed) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">` +
    `<rect width="320" height="180" fill="hsl(${hue},40%,18%)"/>` +
    `<circle cx="160" cy="90" r="30" fill="#000" fill-opacity=".55"/><path d="M150 72 L150 108 L180 90 Z" fill="#fff"/>` +
    `<text x="12" y="168" font-family="Arial,sans-serif" font-size="14" fill="#fff" fill-opacity=".8">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
