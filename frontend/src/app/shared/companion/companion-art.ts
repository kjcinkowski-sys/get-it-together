import { CompanionType } from '../../core/models/companion.model';

/**
 * Pure SVG art for the identity companions. `companionSvg(type, stage, strength)` returns a
 * self-contained `<svg>` string for a given growth stage (0–4). Ported from the approved
 * design mockups. Creature palettes are fixed illustrative colours; the legacy `Sprite`
 * uses the app's theme variables instead.
 *
 * Coordinates use a 0 0 100 100 viewBox (except Sprite, which is 0 0 140 150), with the
 * ground line around y = 88–91.
 */

const C = {
  trunk: '#96603a', nut: '#e0a45e', nutTip: '#c9873f',
  leaf1: '#4f9d63', leaf2: '#3f8a54', leaf3: '#5cb073',
  fur: '#e79a5c', furDark: '#c26a2c', belly: '#f7e3d0', pink: '#ec9aa8', iris: '#6cae5f',
  egg: '#eef1d6', eggEdge: '#c9d8a0', cat1: '#7cc45c', cat2: '#5aa53f', cocoon: '#7fa06a',
  gold: '#e7c65c', wing: '#ec8a3c', edge: '#3a2a1a', ink: '#2f2a26',
};

const clampStage = (s: number) => Math.max(0, Math.min(4, Math.round(s)));

const shadow = `<ellipse cx="50" cy="91" rx="20" ry="3.5" fill="#000" opacity="0.08"/>`;
const svg = (inner: string) =>
  `<svg viewBox="0 0 100 100" role="img" xmlns="http://www.w3.org/2000/svg"><title>companion</title>${inner}</svg>`;
const glowC = (cy: number) => `<circle cx="50" cy="${cy + 6}" r="33" fill="${C.gold}" opacity="0.15"/>`;
const sparkle = (x: number, y: number) =>
  `<path d="M${x} ${y - 4} l1.4 4 l4 1.4 l-4 1.4 l-1.4 4 l-1.4 -4 l-4 -1.4 l4 -1.4 z" fill="${C.gold}"/>`;
const leaf = (x: number, y: number, k: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="${3 * k}" ry="${1.8 * k}" fill="${C.leaf1}" transform="rotate(-40 ${x} ${y})"/>`;

// ---------------- TREE ----------------
function treeFace(cx: number, cy: number, s: number, sleep: boolean): string {
  if (sleep) {
    return `<path d="M${cx - 4.3 * s - 2.6 * s} ${cy} q${2.6 * s} ${2.4 * s} ${5.2 * s} 0" stroke="${C.ink}" stroke-width="${1.4 * s}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${cx + 4.3 * s - 2.6 * s} ${cy} q${2.6 * s} ${2.4 * s} ${5.2 * s} 0" stroke="${C.ink}" stroke-width="${1.4 * s}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${cx - 2.6 * s} ${cy + 5 * s} q${2.6 * s} ${2 * s} ${5.2 * s} 0" stroke="${C.ink}" stroke-width="${1.3 * s}" fill="none" stroke-linecap="round"/>`;
  }
  const g = 4.3 * s, er = 3.3 * s;
  return `<ellipse cx="${cx - g}" cy="${cy}" rx="${er}" ry="${er * 1.15}" fill="#fff"/><ellipse cx="${cx + g}" cy="${cy}" rx="${er}" ry="${er * 1.15}" fill="#fff"/>` +
    `<circle cx="${cx - g}" cy="${cy + 0.6 * s}" r="${2 * s}" fill="${C.ink}"/><circle cx="${cx + g}" cy="${cy + 0.6 * s}" r="${2 * s}" fill="${C.ink}"/>` +
    `<circle cx="${cx - g + s}" cy="${cy - s}" r="${0.85 * s}" fill="#fff"/><circle cx="${cx + g + s}" cy="${cy - s}" r="${0.85 * s}" fill="#fff"/>` +
    `<path d="M${cx - 3.6 * s} ${cy + 4.6 * s} q${3.6 * s} ${3.6 * s} ${7.2 * s} 0" stroke="${C.ink}" stroke-width="${1.5 * s}" fill="none" stroke-linecap="round"/>`;
}
function acorn(cx: number, ny: number, r: number): string {
  const capY = ny - r * 0.78, k = r / 12;
  return `<path d="M${cx - 3 * k} ${ny + r * 0.92} Q${cx} ${ny + r * 1.4} ${cx + 3 * k} ${ny + r * 0.92} Z" fill="${C.nutTip}"/>` +
    `<ellipse cx="${cx}" cy="${ny}" rx="${r}" ry="${r * 1.05}" fill="${C.nut}"/>` +
    `<path d="M${cx - r - 1} ${capY} Q${cx} ${capY - r * 0.85} ${cx + r + 1} ${capY} Q${cx + r} ${capY + r * 0.55} ${cx} ${capY + r * 0.6} Q${cx - r} ${capY + r * 0.55} ${cx - r - 1} ${capY} Z" fill="${C.trunk}"/>`;
}
const stem = (cx: number, capY: number, r: number) =>
  `<rect x="${cx - 1.4}" y="${capY - r * 0.78}" width="2.8" height="${r * 0.42}" rx="1.4" fill="${C.trunk}"/>`;
const sprout = (cx: number, topY: number) =>
  `<path d="M${cx} ${topY} q-1 -7 -7 -10 q7 -1 8 6 z" fill="${C.leaf1}"/>` +
  `<path d="M${cx} ${topY - 2} q1 -6 7 -8 q-1 6 -6 8 z" fill="${C.leaf3}"/>` +
  `<path d="M${cx} ${topY + 2} q0 -6 0 -12" stroke="${C.leaf2}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const treeArm = (x: number, y: number, d: number, w: number, k: number) =>
  `<path d="M${x} ${y} q${-6 * d} 1 ${-8 * d} -3 q-1 -3 1 -5" stroke="${C.trunk}" stroke-width="${w}" fill="none" stroke-linecap="round"/>${leaf(x - 9 * d, y - 7, k)}`;

function treeStages(): string[] {
  return [
    svg(shadow + acorn(50, 76, 12) + stem(50, 76 - 12 * 0.78, 12) + treeFace(50, 77, 1, true)),
    svg(shadow + acorn(50, 76, 12) + sprout(50, 76 - 12 * 0.78 - 3) + treeFace(50, 78, 1, false)),
    svg(shadow + `<rect x="44" y="58" width="12" height="30" rx="5" fill="${C.trunk}"/><circle cx="40" cy="46" r="12" fill="${C.leaf3}"/><circle cx="60" cy="46" r="12" fill="${C.leaf2}"/><circle cx="50" cy="40" r="16" fill="${C.leaf1}"/><path d="M44 73 q-4 0 -6 -3" stroke="${C.trunk}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M56 73 q4 0 6 -3" stroke="${C.trunk}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` + treeFace(50, 70, 1.05, false)),
    svg(shadow + `<rect x="42.5" y="54" width="15" height="34" rx="6" fill="${C.trunk}"/><circle cx="34" cy="46" r="14" fill="${C.leaf3}"/><circle cx="66" cy="46" r="14" fill="${C.leaf2}"/><circle cx="50" cy="46" r="15" fill="${C.leaf3}"/><circle cx="50" cy="32" r="17" fill="${C.leaf1}"/>` + treeArm(42.5, 70, 1, 2.8, 1) + treeArm(57.5, 70, -1, 2.8, 1) + treeFace(50, 69, 1.15, false)),
    svg(shadow + glowC(34) + `<path d="M40 88 Q38 66 43 56 L57 56 Q62 66 60 88 Z" fill="${C.trunk}"/><path d="M43 88 Q46 80 40 76 M57 88 Q54 80 60 76" stroke="${C.trunk}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="30" cy="42" r="15" fill="${C.leaf3}"/><circle cx="70" cy="42" r="15" fill="${C.leaf2}"/><circle cx="40" cy="28" r="15" fill="${C.leaf3}"/><circle cx="60" cy="28" r="15" fill="${C.leaf2}"/><circle cx="50" cy="38" r="18" fill="${C.leaf1}"/><circle cx="50" cy="22" r="15" fill="${C.leaf1}"/><path d="M42 66 q-8 -1 -11 -7 q-1 -4 1 -8" stroke="${C.trunk}" stroke-width="3.2" fill="none" stroke-linecap="round"/>${leaf(31, 50, 1.4)}<path d="M58 66 q8 -1 11 -7 q1 -4 -1 -8" stroke="${C.trunk}" stroke-width="3.2" fill="none" stroke-linecap="round"/>${leaf(69, 50, 1.4)}<ellipse cx="26" cy="52" rx="2.4" ry="3" fill="${C.nut}"/><ellipse cx="74" cy="52" rx="2.4" ry="3" fill="${C.nut}"/>` + treeFace(50, 68, 1.25, false)),
  ];
}

// ---------------- CAT (side profile) ----------------
const eyeOpen = (x: number, y: number, r: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="#fff"/><circle cx="${x}" cy="${y + r * 0.25}" r="${r * 0.72}" fill="${C.iris}"/><ellipse cx="${x}" cy="${y + r * 0.3}" rx="${r * 0.3}" ry="${r * 0.62}" fill="${C.ink}"/><circle cx="${x - r * 0.32}" cy="${y - r * 0.3}" r="${r * 0.3}" fill="#fff"/>`;
const eyeAlmond = (x: number, y: number, r: number) =>
  `<path d="M${x - r} ${y} Q${x} ${y - r * 0.95} ${x + r} ${y} Q${x} ${y + r * 0.75} ${x - r} ${y} Z" fill="#fff"/><circle cx="${x}" cy="${y - r * 0.05}" r="${r * 0.6}" fill="${C.iris}"/><ellipse cx="${x}" cy="${y}" rx="${r * 0.24}" ry="${r * 0.55}" fill="${C.ink}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#fff"/>`;
const catLeg = (x: number, ty: number, len: number, s: number) =>
  `<rect x="${x - 1.7 * s}" y="${ty}" width="${3.4 * s}" height="${len}" rx="${1.7 * s}" fill="${C.fur}"/><ellipse cx="${x}" cy="${ty + len - 0.5}" rx="${2.6 * s}" ry="${1.8 * s}" fill="${C.fur}"/>`;

interface CatOpts {
  s: number; bodyLen: number; bodyH: number; legLen: number; headR: number; tailLen: number; earH: number;
  adult?: boolean; tailUp?: boolean; sparkle?: boolean; glow?: boolean;
}
function catProfile(o: CatOpts): string {
  const s = o.s, bB = 88, bcx = 54, bcy = bB - o.legLen - o.bodyH * 0.45;
  let out = '';
  if (o.glow) out += `<circle cx="52" cy="${bcy}" r="34" fill="${C.gold}" opacity="0.14"/>`;
  out += shadow;
  out += catLeg(bcx + o.bodyLen * 0.3, bB - o.legLen, o.legLen, s) + catLeg(bcx - o.bodyLen * 0.24, bB - o.legLen, o.legLen, s);
  if (o.tailUp) out += `<path d="M${bcx + o.bodyLen * 0.48} ${bcy} q${o.tailLen * 0.7} ${-4} ${o.tailLen * 0.35} ${-o.tailLen}" fill="none" stroke="${C.fur}" stroke-width="${5 * s}" stroke-linecap="round"/>`;
  else out += `<path d="M${bcx + o.bodyLen * 0.48} ${bcy + 2} q${o.tailLen * 0.6} -1 ${o.tailLen * 0.55} ${-o.tailLen}" fill="none" stroke="${C.fur}" stroke-width="${5 * s}" stroke-linecap="round"/>`;
  out += `<ellipse cx="${bcx}" cy="${bcy}" rx="${o.bodyLen * 0.5}" ry="${o.bodyH * 0.5}" fill="${C.fur}"/>`;
  for (let i = -2; i <= 2; i++) out += `<path d="M${bcx + i * o.bodyLen * 0.16} ${bcy - o.bodyH * 0.45} l0 ${5 * s}" stroke="${C.furDark}" stroke-width="${1.4 * s}" fill="none" stroke-linecap="round"/>`;
  out += catLeg(bcx - o.bodyLen * 0.34, bB - o.legLen, o.legLen, s) + catLeg(bcx + o.bodyLen * 0.16, bB - o.legLen, o.legLen, s);
  const hx = bcx - o.bodyLen * 0.5 - o.headR * 0.4, hy = bcy - o.bodyH * 0.25;
  out += `<circle cx="${hx}" cy="${hy}" r="${o.headR}" fill="${C.fur}"/>`;
  out += `<path d="M${hx - 2 * s} ${hy - o.headR * 0.6} L${hx + s} ${hy - o.headR - 6 * s * o.earH} L${hx + 5 * s} ${hy - o.headR * 0.55} Z" fill="${C.fur}"/><path d="M${hx - 0.3 * s} ${hy - o.headR * 0.6} L${hx + 1.4 * s} ${hy - o.headR - 2 * s * o.earH} L${hx + 3.4 * s} ${hy - o.headR * 0.55} Z" fill="${C.pink}"/>`;
  out += `<circle cx="${hx - o.headR * 0.55}" cy="${hy + o.headR * 0.25}" r="${o.headR * 0.42}" fill="${C.fur}"/><circle cx="${hx - o.headR * 0.92}" cy="${hy + o.headR * 0.12}" r="${1.6 * s}" fill="${C.pink}"/>`;
  const ex = hx - o.headR * 0.05, ey = hy - o.headR * 0.05, er = 3 * s;
  out += o.adult ? eyeAlmond(ex, ey, er) : eyeOpen(ex, ey, er);
  out += `<path d="M${hx - o.headR * 0.6} ${hy + o.headR * 0.12} l${-11 * s} ${-2 * s} M${hx - o.headR * 0.6} ${hy + o.headR * 0.34} l${-11 * s} ${2 * s}" stroke="${C.furDark}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  if (o.sparkle) out += sparkle(hx, hy - o.headR - 4);
  return svg(out);
}
const catNewborn = () => svg(shadow +
  `<path d="M70 84 q9 0 8 -7" fill="none" stroke="${C.fur}" stroke-width="5" stroke-linecap="round"/>` +
  `<ellipse cx="52" cy="82" rx="20" ry="8.5" fill="${C.fur}"/>` +
  `<path d="M46 75 q2 -1 4 0 M53 74.5 q2 -1 4 0 M60 75 q2 -1 4 0" stroke="${C.furDark}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="40" cy="87" rx="4" ry="2.4" fill="${C.fur}"/>` +
  `<circle cx="33" cy="79" r="10" fill="${C.fur}"/>` +
  `<path d="M27 72 q-2 -3 1 -4 q3 1 2 4 z" fill="${C.fur}"/><path d="M37 71 q1 -3 4 -2 q1 3 -2 4 z" fill="${C.fur}"/>` +
  `<circle cx="25.5" cy="81" r="3.6" fill="${C.fur}"/>` +
  `<path d="M28 79 q2.4 2.2 4.8 0" stroke="${C.ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
  `<circle cx="23" cy="80.5" r="1.5" fill="${C.pink}"/>` +
  `<path d="M25 82 l-7 1 M25 84 l-7 2" stroke="${C.furDark}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`);

function catStages(): string[] {
  return [
    catNewborn(),
    catProfile({ s: 0.9, bodyLen: 27, bodyH: 20, legLen: 6, headR: 11, tailLen: 12, earH: 0.9 }),
    catProfile({ s: 1.0, bodyLen: 34, bodyH: 21, legLen: 10, headR: 11.3, tailLen: 16, earH: 1.1 }),
    catProfile({ s: 1.06, bodyLen: 41, bodyH: 22, legLen: 13.5, headR: 11, tailLen: 20, earH: 1.3 }),
    catProfile({ s: 1.12, bodyLen: 46, bodyH: 22, legLen: 16.5, headR: 10.8, tailLen: 25, earH: 1.5, adult: true, tailUp: true, sparkle: true, glow: true }),
  ];
}

// ---------------- BUTTERFLY ----------------
const seg = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.cat1}" stroke="${C.cat2}" stroke-width="1.4"/>`;
function butterflyStages(): string[] {
  return [
    svg(shadow + `<path d="M26 79 Q48 63 77 74 Q55 87 26 79 Z" fill="${C.leaf1}"/><path d="M31 78 Q52 75 72 76" stroke="${C.leaf2}" stroke-width="1.4" fill="none"/><ellipse cx="54" cy="70" rx="6.5" ry="8.5" fill="${C.egg}" stroke="${C.eggEdge}" stroke-width="1.5"/>`),
    svg(shadow + seg(38, 77, 8) + seg(50, 75, 8.5) + seg(62, 77, 9) + `<path d="M59 69 q-1 -5 -3 -6 M65 69 q1 -5 3 -6" stroke="${C.cat2}" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="59.5" cy="76" r="1.3" fill="${C.ink}"/><circle cx="65" cy="76" r="1.3" fill="${C.ink}"/><path d="M59.5 80 q3 2 5.5 0" stroke="${C.ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="38" cy="85" r="1.3" fill="${C.cat2}"/><circle cx="50" cy="84" r="1.3" fill="${C.cat2}"/><circle cx="62" cy="86" r="1.3" fill="${C.cat2}"/>`),
    svg(shadow + seg(28, 78, 7.5) + seg(39, 75, 8.5) + seg(50, 74, 9) + seg(61, 75, 9.5) + seg(72, 77, 10) + `<path d="M69 68 q-1 -6 -3 -7 M75 68 q1 -6 3 -7" stroke="${C.cat2}" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="69.5" cy="76" r="1.5" fill="${C.ink}"/><circle cx="75" cy="76" r="1.5" fill="${C.ink}"/><path d="M69.5 80.5 q3.2 2.3 6 0" stroke="${C.ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="30" cy="86" r="1.4" fill="${C.cat2}"/><circle cx="42" cy="85" r="1.4" fill="${C.cat2}"/><circle cx="54" cy="84" r="1.4" fill="${C.cat2}"/><circle cx="66" cy="85" r="1.4" fill="${C.cat2}"/>`),
    svg(shadow + `<rect x="48.5" y="18" width="3" height="9" rx="1.5" fill="${C.trunk}"/><line x1="50" y1="27" x2="50" y2="31" stroke="${C.eggEdge}" stroke-width="1.2"/><path d="M50 30 C39 41 41 62 50 70 C59 62 61 41 50 30 Z" fill="${C.cocoon}" stroke="${C.cat2}" stroke-width="1.5"/><circle cx="44" cy="40" r="1.5" fill="${C.gold}"/><circle cx="56" cy="40" r="1.5" fill="${C.gold}"/><circle cx="50" cy="35" r="1.5" fill="${C.gold}"/><path d="M45 52 q2 2 4 0 M51 52 q2 2 4 0" stroke="${C.edge}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`),
    svg(`<circle cx="50" cy="54" r="30" fill="${C.gold}" opacity="0.16"/><path d="M49 50 C30 30 12 44 19 57 C25 68 44 61 49 55 Z" fill="${C.wing}" stroke="${C.edge}" stroke-width="2.2"/><path d="M51 50 C70 30 88 44 81 57 C75 68 56 61 51 55 Z" fill="${C.wing}" stroke="${C.edge}" stroke-width="2.2"/><path d="M49 57 C37 59 30 68 36 76 C42 82 49 71 49 63 Z" fill="${C.wing}" stroke="${C.edge}" stroke-width="2"/><path d="M51 57 C63 59 70 68 64 76 C58 82 51 71 51 63 Z" fill="${C.wing}" stroke="${C.edge}" stroke-width="2"/><circle cx="30" cy="48" r="2.4" fill="#fff"/><circle cx="70" cy="48" r="2.4" fill="#fff"/><circle cx="40" cy="71" r="2" fill="#fff"/><circle cx="60" cy="71" r="2" fill="#fff"/><ellipse cx="50" cy="56" rx="3.4" ry="16" fill="${C.edge}"/><circle cx="50" cy="40" r="3.6" fill="${C.edge}"/><path d="M50 37 q-6 -7 -11 -5 M50 37 q6 -7 11 -5" stroke="${C.edge}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="39" cy="32" r="1.6" fill="${C.edge}"/><circle cx="61" cy="32" r="1.6" fill="${C.edge}"/>`),
  ];
}

// ---------------- SPRITE (legacy, theme-tinted) ----------------
function spriteSvg(stage: number, strength: number): string {
  const t = Math.min(1, Math.max(0, strength / 100));
  const cx = 70, ground = 128;
  const r = 16 + t * 40;
  const cy = ground - r * 0.9;
  const alpha = (0.32 + t * 0.68).toFixed(2);
  const acc = 'style="fill:var(--accent)"';
  const accStroke = 'style="stroke:var(--accent)"';
  let out = '';
  if (stage >= 4) {
    out += `<circle cx="${cx}" cy="${cy}" r="${r + 11}" fill="none" ${accStroke} stroke-opacity="0.28" stroke-width="3"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${r + 18}" fill="none" ${accStroke} stroke-opacity="0.14" stroke-width="2"/>`;
  }
  out += `<ellipse cx="${cx}" cy="${ground + 6}" rx="${r * 0.85}" ry="${4 + t * 3}" style="fill:var(--ink)" opacity="0.10"/>`;
  if (stage >= 2) {
    const ay = cy + r * 0.25, ax = r * 0.92;
    out += `<path d="M ${cx - ax} ${ay} q ${-8 - t * 6} -2 ${-10 - t * 7} 6" ${accStroke} stroke-opacity="${alpha}" stroke-width="${3 + t * 2}" fill="none" stroke-linecap="round"/>`;
    out += `<path d="M ${cx + ax} ${ay} q ${8 + t * 6} -2 ${10 + t * 7} 6" ${accStroke} stroke-opacity="${alpha}" stroke-width="${3 + t * 2}" fill="none" stroke-linecap="round"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${r}" ${acc} fill-opacity="${alpha}"/>`;
  if (stage >= 2) {
    const ly = cy - r - 2;
    out += `<path d="M ${cx} ${ly} q ${6 + t * 8} ${-8 - t * 6} 1 ${-16 - t * 10} q ${-9 - t * 4} 6 -1 ${16 + t * 10} Z" ${acc} fill-opacity="${(+alpha * 0.9).toFixed(2)}"/>`;
  }
  const eyeY = cy - r * 0.12, eyeDx = r * 0.34, eyeR = 2 + t * 3.2;
  if (stage >= 1) {
    out += `<circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR}" style="fill:var(--surface)"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR}" style="fill:var(--surface)"/>`;
    out += `<circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR * 0.55}" style="fill:var(--ink)"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR * 0.55}" style="fill:var(--ink)"/>`;
  } else {
    out += `<path d="M ${cx - eyeDx - 3} ${eyeY} q 3 3 6 0" style="stroke:var(--ink)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    out += `<path d="M ${cx + eyeDx - 3} ${eyeY} q 3 3 6 0" style="stroke:var(--ink)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  if (stage >= 1) {
    const my = cy + r * 0.28, mw = r * 0.28;
    out += `<path d="M ${cx - mw} ${my} q ${mw} ${3 + t * 4} ${mw * 2} 0" style="stroke:var(--ink)" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  }
  return `<svg viewBox="0 0 140 150" role="img" xmlns="http://www.w3.org/2000/svg"><title>companion</title>${out}</svg>`;
}

export function companionSvg(type: CompanionType, stage: number, strength = 0): string {
  const s = clampStage(stage);
  switch (type) {
    case 'Tree': return treeStages()[s];
    case 'Cat': return catStages()[s];
    case 'Butterfly': return butterflyStages()[s];
    default: return spriteSvg(s, strength);
  }
}
