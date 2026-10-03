import { catalogFor } from "./catalog";
import {
  bbox,
  chordLength,
  fixedFrame,
  pointInPolygon,
  polygonArea,
  rectCorners,
  segCount,
  shapePolygon,
} from "./geometry";
import type { FurnitureItem, ProjectData, Pt } from "./types";

const r = (n: number) => Math.round(n);
const rp = (p: Pt) => [r(p.x), r(p.y)];

/** Contorno principal de la estancia (la forma cerrada de mayor área). */
export function mainPolygon(data: ProjectData): Pt[] {
  let best: Pt[] = [];
  let bestA = -1;
  for (const s of data.shapes) {
    if (!s.closed) continue;
    const poly = shapePolygon(s);
    const a = polygonArea(poly);
    if (a > bestA) {
      bestA = a;
      best = poly;
    }
  }
  return best;
}

/** Descripción compacta y precisa de la estancia para la IA. */
export function describeRoom(data: ProjectData, roomType: string) {
  const poly = mainPolygon(data);
  const b = bbox(poly.length ? poly : data.shapes.flatMap((s) => s.points));
  const walls = data.shapes.flatMap((s, si) =>
    Array.from({ length: segCount(s) }, (_, i) => {
      const a = s.points[i];
      const c = s.points[(i + 1) % s.points.length];
      return {
        wall: `${si + 1}.${i + 1}`,
        from: rp(a),
        to: rp(c),
        length_cm: r(chordLength(s, i)),
        curved: Boolean(s.curves[i]),
      };
    })
  );
  const fixed = data.fixed.map((f) => {
    const fr = fixedFrame(f, data.shapes);
    const cat = catalogFor(f.kind);
    const depth = f.d || data.wallThickness;
    return {
      type: f.label || cat.name,
      kind: f.kind,
      center: rp(fr.c),
      width_cm: r(f.w),
      depth_cm: r(depth),
      rotation_deg: r(((fr.rot % 360) + 360) % 360),
      on_wall: cat.onWall,
      corners: rectCorners(fr.c, f.w, depth, fr.rot).map(rp),
    };
  });
  return {
    room_type: roomType,
    units: "cm; eje X hacia la derecha (este), eje Y hacia abajo (sur). Vista en planta.",
    outline_polygon: poly.map(rp),
    bounding_box: { minX: r(b.minX), minY: r(b.minY), maxX: r(b.maxX), maxY: r(b.maxY) },
    area_m2: Math.round((polygonArea(poly) / 10000) * 100) / 100,
    ceiling_height_cm: data.wallHeight,
    walls,
    fixed_elements: fixed,
  };
}

/** Recoloca dentro del contorno los muebles que la IA haya dejado fuera. */
export function sanitizeItems(items: FurnitureItem[], data: ProjectData): FurnitureItem[] {
  const poly = mainPolygon(data);
  if (poly.length < 3) return items;
  const b = bbox(poly);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return items.map((it) => {
    let p = { x: it.x, y: it.y };
    for (let k = 0; k < 20 && !pointInPolygon(p, poly); k++)
      p = { x: p.x + (cx - p.x) * 0.15, y: p.y + (cy - p.y) * 0.15 };
    return { ...it, x: p.x, y: p.y };
  });
}
