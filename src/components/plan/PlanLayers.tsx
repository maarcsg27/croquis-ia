"use client";
import { catalogFor, isOpening } from "@/lib/catalog";
import {
  chordLength,
  fixedFrame,
  fmtM,
  norm,
  perp,
  polygonArea,
  segCount,
  segEnds,
  segPath,
  segPointAt,
  shapePath,
  shapePolygon,
  sub,
} from "@/lib/geometry";
import type { FixedItem, FurnitureItem, ProjectData, Shape } from "@/lib/types";

export type Sel =
  | { type: "shape"; id: string }
  | { type: "fixed"; id: string }
  | { type: "furn"; id: string }
  | null;

export const COLORS = {
  wall: "#334155",
  sketch: "#1e293b",
  floor: "#ffffff",
  accent: "#4f46e5",
  window: "#0ea5e9",
  fixedFill: "#e2e8f0",
  fixedStroke: "#475569",
};

const FONT = "Inter, ui-sans-serif, system-ui, Arial, sans-serif";

function signedArea(s: Shape) {
  const pts = s.points;
  let A = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i],
      q = pts[(i + 1) % pts.length];
    A += p.x * q.y - q.x * p.y;
  }
  return A / 2;
}

/* ---------------- Paredes ---------------- */
function Walls({ data, k, sel, plan, showDims }: { data: ProjectData; k: number; sel: Sel; plan: boolean; showDims: boolean }) {
  const T = data.wallThickness;
  return (
    <g>
      {/* suelo */}
      {data.shapes
        .filter((s) => s.closed)
        .map((s) => (
          <path key={"f" + s.id} d={shapePath(s)} fill={plan ? "#fafaf9" : "rgba(79,70,229,0.04)"} stroke="none" />
        ))}
      {data.shapes.map((s) => {
        const selected = sel?.type === "shape" && sel.id === s.id;
        return (
          <path
            key={s.id}
            d={shapePath(s)}
            fill="none"
            stroke={selected ? COLORS.accent : plan ? COLORS.wall : COLORS.sketch}
            strokeWidth={plan ? T : 2.5}
            vectorEffect={plan ? undefined : "non-scaling-stroke"}
            strokeLinejoin={plan ? "miter" : "round"}
            strokeLinecap={plan ? "square" : "round"}
          />
        );
      })}
      {showDims && data.shapes.map((s) => <Dims key={"d" + s.id} s={s} k={k} offset={plan ? T / 2 : 0} />)}
    </g>
  );
}

function Dims({ s, k, offset }: { s: Shape; k: number; offset: number }) {
  const orient = s.closed ? Math.sign(signedArea(s)) || 1 : 1;
  const fs = 11.5 / k;
  return (
    <g>
      {Array.from({ length: segCount(s) }, (_, i) => {
        const [a, b] = segEnds(s, i);
        const L = s.lengths[i] ?? chordLength(s, i);
        if (L < 1) return null;
        const t = norm(sub(b, a));
        // normal exterior (para formas cerradas con orientación conocida)
        const n = perp(t);
        const out = { x: -n.x * orient, y: -n.y * orient };
        const m = segPointAt(s, i, 0.5);
        const off = offset + 16 / k;
        const p = { x: m.x + out.x * off, y: m.y + out.y * off };
        let ang = (Math.atan2(t.y, t.x) * 180) / Math.PI;
        if (ang > 90) ang -= 180;
        if (ang < -90) ang += 180;
        const label = fmtM(L);
        const w = (label.length * 6.4 + 10) / k;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
            <rect x={-w / 2} y={-8 / k} width={w} height={16 / k} rx={4 / k} fill="white" fillOpacity={0.9} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fs}
              fontFamily={FONT}
              fill={s.lengths[i] ? "#0f172a" : "#64748b"}
              fontWeight={600}
            >
              {s.lengths[i] ? label : "≈ " + label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ---------------- Elementos fijos ---------------- */
export function FixedGlyph({ item, T, selected }: { item: FixedItem; T: number; selected: boolean }) {
  const w = item.w;
  const s = item.side ?? 1;
  const stroke = selected ? COLORS.accent : COLORS.fixedStroke;
  const sw = selected ? 2.5 : 1.5;
  const gap = <rect x={-w / 2} y={-T / 2 - 1} width={w} height={T + 2} fill={COLORS.floor} />;
  const jambs = (
    <>
      <line x1={-w / 2} y1={-T / 2} x2={-w / 2} y2={T / 2} stroke={COLORS.wall} strokeWidth={3} />
      <line x1={w / 2} y1={-T / 2} x2={w / 2} y2={T / 2} stroke={COLORS.wall} strokeWidth={3} />
    </>
  );
  switch (item.kind) {
    case "door": {
      const hx = item.hinge === "end" ? w / 2 : -w / 2;
      const ox = -hx;
      const sweep = (item.hinge !== "end") === (s === 1) ? 0 : 1;
      return (
        <g>
          {gap}
          {jambs}
          <line x1={hx} y1={0} x2={hx} y2={s * w} stroke={stroke} strokeWidth={sw * 1.6} vectorEffect="non-scaling-stroke" />
          <path d={`M${hx} ${s * w} A${w} ${w} 0 0 ${sweep} ${ox} 0`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        </g>
      );
    }
    case "double_door": {
      const h = w / 2;
      return (
        <g>
          {gap}
          {jambs}
          <line x1={-w / 2} y1={0} x2={-w / 2} y2={s * h} stroke={stroke} strokeWidth={sw * 1.6} vectorEffect="non-scaling-stroke" />
          <line x1={w / 2} y1={0} x2={w / 2} y2={s * h} stroke={stroke} strokeWidth={sw * 1.6} vectorEffect="non-scaling-stroke" />
          <path d={`M${-w / 2} ${s * h} A${h} ${h} 0 0 ${s === 1 ? 0 : 1} 0 0`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          <path d={`M${w / 2} ${s * h} A${h} ${h} 0 0 ${s === 1 ? 1 : 0} 0 0`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        </g>
      );
    }
    case "sliding_door":
      return (
        <g>
          {gap}
          {jambs}
          <rect x={-w / 2} y={-T / 4 - 2} width={w * 0.55} height={4} fill="white" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
          <rect x={w / 2 - w * 0.55} y={T / 4 - 2} width={w * 0.55} height={4} fill="white" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
        </g>
      );
    case "window":
    case "balcony":
      return (
        <g>
          {gap}
          <rect x={-w / 2} y={-T / 2} width={w} height={T} fill="#e0f2fe" stroke={selected ? COLORS.accent : COLORS.window} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
          <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke={COLORS.window} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {item.kind === "balcony" && (
            <>
              <line x1={0} y1={-T / 2} x2={0} y2={T / 2} stroke={COLORS.window} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <path d={`M${-w / 2} 0 A${w / 2} ${w / 2} 0 0 ${s === 1 ? 1 : 0} 0 ${s * (w / 2)}`} fill="none" stroke={COLORS.window} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </g>
      );
    case "radiator":
    case "ac": {
      const d = item.d || 12;
      const y0 = s === 1 ? T / 2 : -T / 2 - d;
      return (
        <g>
          <rect x={-w / 2} y={y0} width={w} height={d} fill="white" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
          {Array.from({ length: Math.max(1, Math.floor(w / 10)) }, (_, i) => (
            <line key={i} x1={-w / 2 + (i + 1) * (w / (Math.floor(w / 10) + 1))} y1={y0} x2={-w / 2 + (i + 1) * (w / (Math.floor(w / 10) + 1))} y2={y0 + d} stroke={stroke} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      );
    }
    case "socket":
    case "tv_socket": {
      const cy = s * (T / 2 + 7);
      return (
        <g>
          <circle cx={0} cy={cy} r={7} fill={item.kind === "tv_socket" ? "#ede9fe" : "#fef3c7"} stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
          {item.kind === "socket" ? (
            <>
              <circle cx={-2.5} cy={cy} r={1.2} fill={stroke} />
              <circle cx={2.5} cy={cy} r={1.2} fill={stroke} />
            </>
          ) : (
            <text x={0} y={cy} fontSize={6} textAnchor="middle" dominantBaseline="central" fill={stroke} fontFamily={FONT} fontWeight={700}>
              TV
            </text>
          )}
        </g>
      );
    }
    default: {
      const d = item.d;
      const base = (
        <rect x={-w / 2} y={-d / 2} width={w} height={d} fill={item.kind === "column" ? "#64748b" : COLORS.fixedFill} stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      );
      return (
        <g>
          {base}
          {item.kind === "fireplace" && (
            <rect x={-w * 0.3} y={-d / 2 + d * 0.2} width={w * 0.6} height={d * 0.6} fill="#fdba74" stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          )}
          {item.kind === "wardrobe" && (
            <>
              <line x1={-w / 2} y1={d / 2 - 4} x2={w / 2} y2={d / 2 - 4} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <line x1={-w / 2} y1={-d / 2} x2={w / 2} y2={d / 2 - 4} stroke={stroke} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
              <line x1={w / 2} y1={-d / 2} x2={-w / 2} y2={d / 2 - 4} stroke={stroke} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
            </>
          )}
          {item.kind === "kitchen" &&
            [-0.25, 0.25].map((f) => (
              <circle key={f} cx={w * f} cy={0} r={Math.min(d, w) * 0.18} fill="none" stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
          {item.kind === "stairs" &&
            Array.from({ length: Math.floor(d / 28) }, (_, i) => (
              <line key={i} x1={-w / 2} y1={-d / 2 + (i + 1) * 28} x2={w / 2} y2={-d / 2 + (i + 1) * 28} stroke={stroke} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
            ))}
          {item.kind === "shelf" &&
            Array.from({ length: Math.floor(w / 15) }, (_, i) => (
              <line key={i} x1={-w / 2 + i * 15} y1={d / 2} x2={-w / 2 + i * 15 + 15} y2={-d / 2} stroke={stroke} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
            ))}
        </g>
      );
    }
  }
}

function FixedLayer({ data, sel, k, labels }: { data: ProjectData; sel: Sel; k: number; labels: boolean }) {
  return (
    <g>
      {data.fixed.map((f) => {
        const fr = fixedFrame(f, data.shapes);
        const selected = sel?.type === "fixed" && sel.id === f.id;
        const cat = catalogFor(f.kind);
        const showLabel = labels && !cat.onWall;
        return (
          <g key={f.id}>
            <g transform={`translate(${fr.c.x} ${fr.c.y}) rotate(${fr.rot})`}>
              <FixedGlyph item={f} T={data.wallThickness} selected={selected} />
            </g>
            {showLabel && (
              <text x={fr.c.x} y={fr.c.y} fontSize={10 / k} textAnchor="middle" dominantBaseline="central" fill="#334155" fontFamily={FONT} fontWeight={600} style={{ pointerEvents: "none" }}>
                {f.label || cat.name}
              </text>
            )}
            {labels && isOpening(f.kind) && selected && (
              <text x={fr.c.x} y={fr.c.y - 14 / k} fontSize={10 / k} textAnchor="middle" fill={COLORS.accent} fontFamily={FONT} fontWeight={700}>
                {Math.round(f.w)} cm
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ---------------- Mobiliario ---------------- */
function darken(hex?: string) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "#334155";
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.55));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function FurnitureGlyph({ it, selected }: { it: FurnitureItem; selected: boolean }) {
  const { w, d } = it;
  const fill = it.color && /^#/.test(it.color) ? it.color : "#cbd5e1";
  const stroke = selected ? COLORS.accent : darken(it.color);
  const sw = selected ? 2.5 : 1.2;
  const common = { stroke, strokeWidth: sw, vectorEffect: "non-scaling-stroke" as const };
  const r = Math.min(6, w / 6, d / 6);
  switch (it.category) {
    case "rug":
      return <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={r} fill={fill} fillOpacity={0.25} {...common} strokeDasharray="6 4" />;
    case "plant":
      return (
        <g>
          <circle r={Math.min(w, d) / 2} fill="#86efac" fillOpacity={0.8} {...common} stroke={selected ? COLORS.accent : "#15803d"} />
          <circle r={Math.min(w, d) / 5} fill="#22c55e" />
        </g>
      );
    case "lamp":
      return (
        <g>
          <circle r={Math.min(w, d) / 2} fill="#fef9c3" {...common} />
          <line x1={-w / 3} y1={0} x2={w / 3} y2={0} {...common} strokeWidth={0.8} />
          <line x1={0} y1={-d / 3} x2={0} y2={d / 3} {...common} strokeWidth={0.8} />
        </g>
      );
    case "tv":
      return <rect x={-w / 2} y={-d / 2} width={w} height={Math.max(d, 4)} rx={1} fill="#1f2937" {...common} />;
    case "sofa":
    case "armchair": {
      const back = Math.min(d * 0.28, 22);
      const arm = Math.min(w * 0.12, 20);
      return (
        <g>
          <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={r} fill={fill} fillOpacity={0.75} {...common} />
          <rect x={-w / 2} y={-d / 2} width={w} height={back} rx={r} fill={fill} {...common} strokeWidth={0.8} />
          <rect x={-w / 2} y={-d / 2} width={arm} height={d} rx={r} fill={fill} {...common} strokeWidth={0.8} />
          <rect x={w / 2 - arm} y={-d / 2} width={arm} height={d} rx={r} fill={fill} {...common} strokeWidth={0.8} />
        </g>
      );
    }
    case "bed": {
      const pw = w > 120 ? w / 2 - 12 : w - 16;
      return (
        <g>
          <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={r} fill={fill} fillOpacity={0.6} {...common} />
          {(w > 120 ? [-w / 4, w / 4] : [0]).map((cx) => (
            <rect key={cx} x={cx - pw / 2} y={-d / 2 + 8} width={pw} height={22} rx={5} fill="white" {...common} strokeWidth={0.8} />
          ))}
          <line x1={-w / 2} y1={-d / 2 + d * 0.33} x2={w / 2} y2={-d / 2 + d * 0.33} {...common} strokeWidth={0.8} />
        </g>
      );
    }
    case "table":
    case "desk":
      return (
        <g>
          <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={r} fill={fill} fillOpacity={0.7} {...common} />
          <rect x={-w / 2 + 4} y={-d / 2 + 4} width={Math.max(0, w - 8)} height={Math.max(0, d - 8)} rx={r} fill="none" {...common} strokeWidth={0.6} />
        </g>
      );
    default:
      return (
        <g>
          <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={r} fill={fill} fillOpacity={0.7} {...common} />
          <line x1={-w / 2 + 3} y1={-d / 2 + 3} x2={w / 2 - 3} y2={-d / 2 + 3} {...common} strokeWidth={1.5} />
        </g>
      );
  }
}

function FurnitureLayer({ items, sel, k, labels }: { items: FurnitureItem[]; sel: Sel; k: number; labels: boolean }) {
  const order = [...items].sort((a, b) => (a.category === "rug" ? -1 : 0) - (b.category === "rug" ? -1 : 0));
  return (
    <g>
      {order.map((it) => (
        <g key={it.id} transform={`translate(${it.x} ${it.y}) rotate(${it.rot})`}>
          <FurnitureGlyph it={it} selected={sel?.type === "furn" && sel.id === it.id} />
        </g>
      ))}
      {labels &&
        order
          .filter((it) => it.category !== "rug" || true)
          .map((it) => (
            <text
              key={"l" + it.id}
              x={it.x}
              y={it.category === "rug" ? it.y + it.d / 2 - 12 / k : it.y}
              fontSize={Math.min(10.5 / k, Math.max(it.w, it.d) / 5)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0f172a"
              fontFamily={FONT}
              fontWeight={600}
              paintOrder="stroke"
              stroke="white"
              strokeWidth={3 / k}
              style={{ pointerEvents: "none" }}
            >
              {it.name}
            </text>
          ))}
    </g>
  );
}

/* ---------------- Composición ---------------- */
export function PlanLayers({
  data,
  k,
  sel = null,
  furniture = [],
  showDims = true,
  labels = true,
}: {
  data: ProjectData;
  k: number;
  sel?: Sel;
  furniture?: FurnitureItem[];
  showDims?: boolean;
  labels?: boolean;
}) {
  const plan = data.planReady;
  return (
    <g>
      <Walls data={data} k={k} sel={sel} plan={plan} showDims={false} />
      <FurnitureLayer items={furniture} sel={sel} k={k} labels={labels} />
      <FixedLayer data={data} sel={sel} k={k} labels={labels} />
      {showDims && data.shapes.map((s) => <Dims key={"d" + s.id} s={s} k={k} offset={plan ? data.wallThickness / 2 : 0} />)}
    </g>
  );
}

/** Plano estático ajustado a su contenido (miniaturas y exportación). */
export function PlanSvg({
  data,
  furniture = [],
  width = 800,
  height = 600,
  showDims = true,
  labels = true,
  svgRef,
  className,
}: {
  data: ProjectData;
  furniture?: FurnitureItem[];
  width?: number;
  height?: number;
  showDims?: boolean;
  labels?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  className?: string;
}) {
  const pts = [
    ...data.shapes.flatMap((s) => shapePolygon(s)),
    ...furniture.map((f) => ({ x: f.x, y: f.y })),
  ];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!pts.length) {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 300;
  }
  const pad = 60 + data.wallThickness;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;
  const bw = maxX - minX,
    bh = maxY - minY;
  const k = Math.min(width / bw, height / bh);
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`${minX - (width / k - bw) / 2} ${minY - (height / k - bh) / 2} ${width / k} ${height / k}`}
      className={className}
      style={{ background: "white" }}
    >
      <rect x={minX - 1e4} y={minY - 1e4} width={2e4 + bw} height={2e4 + bh} fill="white" />
      <PlanLayers data={data} k={k} furniture={furniture} showDims={showDims} labels={labels} />
    </svg>
  );
}

export const roomArea = (data: ProjectData) => {
  const closed = data.shapes.filter((s) => s.closed);
  return closed.reduce((a, s) => a + polygonArea(shapePolygon(s)), 0) / 10000;
};

export { segPath };
