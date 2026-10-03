import type { FixedItem, Pt, Shape } from "./types";

export const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const norm = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
export const perp = (a: Pt): Pt => ({ x: -a.y, y: a.x });
export const snap = (v: number, step: number) => Math.round(v / step) * step;
export const deg = (r: number) => (r * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;

export const segCount = (s: Shape) =>
  s.closed ? s.points.length : Math.max(0, s.points.length - 1);

export function segEnds(s: Shape, i: number): [Pt, Pt] {
  return [s.points[i], s.points[(i + 1) % s.points.length]];
}

export function quadAt(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}
export function quadTangent(a: Pt, c: Pt, b: Pt, t: number): Pt {
  return norm({
    x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
    y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y),
  });
}

export function segPointAt(s: Shape, i: number, t: number): Pt {
  const [a, b] = segEnds(s, i);
  const c = s.curves[i];
  return c ? quadAt(a, c, b, t) : lerp(a, b, t);
}

export function segTangent(s: Shape, i: number, t: number): Pt {
  const [a, b] = segEnds(s, i);
  const c = s.curves[i];
  return c ? quadTangent(a, c, b, t) : norm(sub(b, a));
}

export function segLength(s: Shape, i: number): number {
  const [a, b] = segEnds(s, i);
  const c = s.curves[i];
  if (!c) return dist(a, b);
  let L = 0;
  let prev = a;
  for (let k = 1; k <= 24; k++) {
    const p = quadAt(a, c, b, k / 24);
    L += dist(prev, p);
    prev = p;
  }
  return L;
}

export const chordLength = (s: Shape, i: number) => {
  const [a, b] = segEnds(s, i);
  return dist(a, b);
};

export function closestOnLine(p: Pt, a: Pt, b: Pt) {
  const ab = sub(b, a);
  const l2 = dot(ab, ab) || 1;
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2));
  const pt = lerp(a, b, t);
  return { t, pt, d: dist(p, pt) };
}

export function closestOnSeg(s: Shape, i: number, p: Pt) {
  const [a, b] = segEnds(s, i);
  const c = s.curves[i];
  if (!c) return closestOnLine(p, a, b);
  let best = { t: 0, pt: a, d: Infinity };
  const N = 40;
  for (let k = 0; k < N; k++) {
    const p0 = quadAt(a, c, b, k / N);
    const p1 = quadAt(a, c, b, (k + 1) / N);
    const r = closestOnLine(p, p0, p1);
    if (r.d < best.d) best = { t: (k + r.t) / N, pt: r.pt, d: r.d };
  }
  return best;
}

export type SegHit = { shapeId: string; seg: number; t: number; pt: Pt; d: number };

export function hitSegment(shapes: Shape[], p: Pt, tol: number): SegHit | null {
  let best: SegHit | null = null;
  for (const s of shapes) {
    for (let i = 0; i < segCount(s); i++) {
      const r = closestOnSeg(s, i, p);
      if (r.d <= tol && (!best || r.d < best.d))
        best = { shapeId: s.id, seg: i, t: r.t, pt: r.pt, d: r.d };
    }
  }
  return best;
}

export function segPath(a: Pt, b: Pt, c?: Pt | null) {
  return c
    ? `M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`
    : `M${a.x} ${a.y} L${b.x} ${b.y}`;
}

export function shapePath(s: Shape) {
  if (s.points.length === 0) return "";
  let d = `M${s.points[0].x} ${s.points[0].y}`;
  for (let i = 0; i < segCount(s); i++) {
    const [, b] = segEnds(s, i);
    const c = s.curves[i];
    d += c ? ` Q${c.x} ${c.y} ${b.x} ${b.y}` : ` L${b.x} ${b.y}`;
  }
  if (s.closed) d += " Z";
  return d;
}

/** Polígono aproximado (curvas muestreadas). */
export function shapePolygon(s: Shape): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < segCount(s); i++) {
    const [a, b] = segEnds(s, i);
    const c = s.curves[i];
    out.push(a);
    if (c) for (let k = 1; k < 12; k++) out.push(quadAt(a, c, b, k / 12));
    if (!s.closed && i === segCount(s) - 1) out.push(b);
  }
  return out;
}

export function polygonArea(pts: Pt[]) {
  let A = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    A += p.x * q.y - q.x * p.y;
  }
  return Math.abs(A) / 2;
}

export function pointInPolygon(p: Pt, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}

export function bbox(points: Pt[]) {
  if (!points.length) return { minX: 0, minY: 0, maxX: 500, maxY: 400 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

export function allPoints(shapes: Shape[]) {
  return shapes.flatMap((s) => [...s.points, ...(s.curves.filter(Boolean) as Pt[])]);
}

function median(v: number[]) {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function snapAngle(a: number) {
  const d = deg(a);
  const n90 = Math.round(d / 90) * 90;
  if (Math.abs(d - n90) <= 15) return rad(n90);
  const n45 = Math.round(d / 45) * 45;
  if (Math.abs(d - n45) <= 10) return rad(n45);
  return a;
}

export type RebuildReport = { scale: number; closure: { shapeId: string; error: number }[] };

/**
 * Convierte el boceto en un plano a escala aplicando las medidas reales.
 * - Las paredes sin medida se escalan con la escala media de las medidas.
 * - En formas cerradas con todas las medidas, el error de cierre se reparte.
 */
export function rebuildShapes(
  shapes: Shape[],
  orthogonalize: boolean
): { shapes: Shape[]; report: RebuildReport } {
  const ratios: number[] = [];
  for (const s of shapes)
    for (let i = 0; i < segCount(s); i++) {
      const L = s.lengths[i];
      const ch = chordLength(s, i);
      if (L && L > 0 && ch > 1) ratios.push(L / ch);
    }
  const scale = ratios.length ? median(ratios) : 1;
  const report: RebuildReport = { scale, closure: [] };

  const out = shapes.map((s) => {
    const m = segCount(s);
    const n = s.points.length;
    if (n < 2) return s;
    const pts: Pt[] = [mul(s.points[0], scale)];
    const allMeasured = s.closed && s.lengths.slice(0, m).every((l) => l && l > 0);
    const lastBuilt = s.closed && !allMeasured ? m - 1 : m; // segmentos a construir
    const dirs: Pt[] = [];
    const lens: number[] = [];
    for (let i = 0; i < m; i++) {
      const [a, b] = segEnds(s, i);
      let ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (orthogonalize) ang = snapAngle(ang);
      dirs.push({ x: Math.cos(ang), y: Math.sin(ang) });
      lens.push(s.lengths[i] && s.lengths[i]! > 0 ? s.lengths[i]! : dist(a, b) * scale);
    }
    for (let i = 0; i < lastBuilt; i++) {
      const p = add(pts[i], mul(dirs[i], lens[i]));
      if (i + 1 < n) pts.push(p);
      else {
        // cierre: el último punto debería coincidir con el primero
        const err = sub(p, pts[0]);
        const e = Math.hypot(err.x, err.y);
        report.closure.push({ shapeId: s.id, error: e });
        const total = lens.reduce((x, y) => x + y, 0);
        let cum = 0;
        for (let k = 1; k < n; k++) {
          cum += lens[k - 1];
          pts[k] = sub(pts[k], mul(err, cum / total));
        }
      }
    }
    // Reproyectar puntos de control de curvas
    const curves = s.curves.map((c, i) => {
      if (!c || i >= m) return c;
      const [a, b] = segEnds(s, i);
      const L = dist(a, b) || 1;
      const t = norm(sub(b, a));
      const nn = perp(t);
      const u = dot(sub(c, a), t) / L;
      const v = dot(sub(c, a), nn) / L;
      const a2 = pts[i];
      const b2 = pts[(i + 1) % n];
      const L2 = dist(a2, b2);
      const t2 = norm(sub(b2, a2));
      const n2 = perp(t2);
      return add(a2, add(mul(t2, u * L2), mul(n2, v * L2)));
    });
    // Actualizar medidas al resultado final
    const res: Shape = { ...s, points: pts, curves };
    res.lengths = s.lengths.map((l, i) => (i < m ? Math.round(chordLength(res, i)) : l));
    return res;
  });
  return { shapes: out, report };
}

/** Posición y ángulo (grados) de un elemento anclado a pared. */
export function fixedFrame(item: FixedItem, shapes: Shape[]): { c: Pt; rot: number; normal: Pt } {
  if (item.shapeId != null && item.seg != null && item.t != null) {
    const s = shapes.find((x) => x.id === item.shapeId);
    if (s && item.seg < segCount(s)) {
      const c = segPointAt(s, item.seg, item.t);
      const tan = segTangent(s, item.seg, item.t);
      return { c, rot: deg(Math.atan2(tan.y, tan.x)), normal: perp(tan) };
    }
  }
  const r = rad(item.rot);
  return { c: { x: item.x, y: item.y }, rot: item.rot, normal: { x: -Math.sin(r), y: Math.cos(r) } };
}

/** Coordenadas locales de p respecto a un rectángulo rotado. */
export function toLocal(p: Pt, c: Pt, rotDeg: number): Pt {
  const r = rad(-rotDeg);
  const d = sub(p, c);
  return { x: d.x * Math.cos(r) - d.y * Math.sin(r), y: d.x * Math.sin(r) + d.y * Math.cos(r) };
}

export function rectCorners(c: Pt, w: number, d: number, rotDeg: number): Pt[] {
  const r = rad(rotDeg);
  const cs = Math.cos(r),
    sn = Math.sin(r);
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([x, y]) => ({ x: c.x + x * cs - y * sn, y: c.y + x * sn + y * cs }));
}

export const fmtM = (cm: number) =>
  (cm / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " m";
