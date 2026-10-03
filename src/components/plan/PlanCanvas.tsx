"use client";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { catalogFor, isOpening } from "@/lib/catalog";
import {
  add,
  bbox,
  chordLength,
  closestOnSeg,
  dist,
  fixedFrame,
  fmtM,
  hitSegment,
  lerp,
  mul,
  pointInPolygon,
  segCount,
  segEnds,
  segPath,
  segPointAt,
  shapePolygon,
  snap,
  sub,
  toLocal,
  uid,
  allPoints,
} from "@/lib/geometry";
import type { FixedItem, FixedKind, FurnitureItem, ProjectData, Pt, Shape, Step } from "@/lib/types";
import { COLORS, FixedGlyph, PlanLayers, type Sel } from "./PlanLayers";

export type Tool = "select" | "wall" | "rect" | "curve" | "erase" | "pan" | "place";

export type CanvasHandle = { fit: () => void; zoom: (f: number) => void };

type Props = {
  data: ProjectData;
  step: Step;
  tool: Tool;
  setTool: (t: Tool) => void;
  sel: Sel;
  setSel: (s: Sel) => void;
  update: (fn: (d: ProjectData) => ProjectData, history?: boolean) => void;
  beginChange: () => void;
  placeKind: FixedKind | null;
  furniture: FurnitureItem[];
  focusSeg: { shapeId: string; seg: number } | null;
  onSegmentClick?: (shapeId: string, seg: number) => void;
  onZoom?: (k: number) => void;
};

type Drag =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | { kind: "vertex"; shapeId: string; index: number }
  | { kind: "shape"; shapeId: string; start: Pt; orig: Shape }
  | { kind: "bend"; shapeId: string; seg: number }
  | { kind: "fixed"; id: string; offset: Pt }
  | { kind: "furn"; id: string; offset: Pt }
  | { kind: "rect"; start: Pt }
  | null;

const MINOR = 50;

function emptyShape(points: Pt[], closed: boolean): Shape {
  const m = closed ? points.length : points.length - 1;
  return { id: uid(), points, closed, curves: Array(m).fill(null), lengths: Array(m).fill(null) };
}

export const PlanCanvas = forwardRef<CanvasHandle, Props>(function PlanCanvas(props, ref) {
  const { data, step, tool, sel, setSel, update, beginChange, placeKind, furniture } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState({ x: 120, y: 120, k: 0.8 });
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [drawing, setDrawing] = useState<Pt[]>([]);
  const [curveStage, setCurveStage] = useState<Pt[]>([]);
  const [drag, setDrag] = useState<Drag>(null);
  const [space, setSpace] = useState(false);
  const [snapHint, setSnapHint] = useState<Pt | null>(null);
  const k = view.k;
  const plan = data.planReady;

  /* ---------- tamaño y vista ---------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    const pts = [...allPoints(data.shapes), ...furniture.map((f) => ({ x: f.x, y: f.y }))];
    if (!pts.length) {
      setView({ x: size.w / 2 - 250 * 0.8, y: size.h / 2 - 200 * 0.8, k: 0.8 });
      return;
    }
    const b = bbox(pts);
    const bw = b.maxX - b.minX + 200;
    const bh = b.maxY - b.minY + 200;
    const nk = Math.min(4, Math.max(0.1, Math.min(size.w / bw, size.h / bh)));
    setView({
      k: nk,
      x: size.w / 2 - ((b.minX + b.maxX) / 2) * nk,
      y: size.h / 2 - ((b.minY + b.maxY) / 2) * nk,
    });
  }, [data.shapes, furniture, size]);

  const zoomAt = useCallback((f: number, cx?: number, cy?: number) => {
    setView((v) => {
      const nk = Math.min(8, Math.max(0.08, v.k * f));
      const mx = cx ?? size.w / 2;
      const my = cy ?? size.h / 2;
      return { k: nk, x: mx - (mx - v.x) * (nk / v.k), y: my - (my - v.y) * (nk / v.k) };
    });
  }, [size]);

  useImperativeHandle(ref, () => ({ fit, zoom: (f) => zoomAt(f) }), [fit, zoomAt]);

  // Ajustar al cargar
  const didFit = useRef(false);
  useEffect(() => {
    if (!didFit.current && size.w > 100) {
      didFit.current = true;
      fit();
    }
  }, [size, fit]);

  useEffect(() => props.onZoom?.(k), [k, props]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) > 0 && !e.shiftKey && Math.abs(e.deltaX) < 1)
        zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  /* ---------- teclado ---------- */
  const finishDrawing = useCallback(
    (closed = false) => {
      setDrawing((pts) => {
        if (pts.length >= 2) commitPolyline(pts, closed);
        return [];
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.shapes]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        setSpace(true);
        e.preventDefault();
      }
      if (e.key === "Escape") {
        if (drawing.length >= 2) finishDrawing(false);
        else setDrawing([]);
        setCurveStage([]);
        setSel(null);
      }
      if (e.key === "Enter" && drawing.length >= 2) finishDrawing(false);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [drawing, finishDrawing, setSel]);

  // Cambiar de herramienta cancela dibujos a medias
  useEffect(() => {
    setDrawing([]);
    setCurveStage([]);
  }, [tool, step]);

  /* ---------- utilidades ---------- */
  const toWorld = (e: { clientX: number; clientY: number }): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / k, y: (e.clientY - r.top - view.y) / k };
  };

  const snapPoint = (p: Pt, from: Pt | null, free: boolean, exclude?: { shapeId: string; index: number }): Pt => {
    setSnapHint(null);
    if (free) return p;
    const tol = 12 / k;
    const candidates: Pt[] = [];
    for (const s of data.shapes)
      s.points.forEach((v, i) => {
        if (!(exclude && exclude.shapeId === s.id && exclude.index === i)) candidates.push(v);
      });
    candidates.push(...drawing, ...curveStage);
    for (const v of candidates)
      if (dist(v, p) < tol) {
        setSnapHint(v);
        return v;
      }
    if (from) {
      const d = sub(p, from);
      const L = Math.hypot(d.x, d.y);
      const ang = Math.atan2(d.y, d.x);
      const step45 = Math.PI / 4;
      const n = Math.round(ang / step45) * step45;
      if (Math.abs(ang - n) < (7 * Math.PI) / 180) {
        const Ls = snap(L, 5);
        return { x: from.x + Math.cos(n) * Ls, y: from.y + Math.sin(n) * Ls };
      }
    }
    return { x: snap(p.x, 10), y: snap(p.y, 10) };
  };

  function commitPolyline(pts: Pt[], closed: boolean) {
    // Si empieza en el extremo de una forma abierta, la prolonga
    const startOn = data.shapes.find(
      (s) => !s.closed && s.points.length >= 2 && (dist(s.points[s.points.length - 1], pts[0]) < 0.5 || dist(s.points[0], pts[0]) < 0.5)
    );
    beginChange();
    if (startOn && !closed) {
      let base = startOn;
      if (dist(startOn.points[0], pts[0]) < 0.5)
        base = { ...startOn, points: [...startOn.points].reverse(), curves: [...startOn.curves].reverse(), lengths: [...startOn.lengths].reverse() };
      let newPts = [...base.points, ...pts.slice(1)];
      let isClosed = false;
      if (dist(newPts[newPts.length - 1], newPts[0]) < 0.5 && newPts.length > 3) {
        newPts = newPts.slice(0, -1);
        isClosed = true;
      }
      const m = isClosed ? newPts.length : newPts.length - 1;
      const extra = m - segCount(base);
      const merged: Shape = {
        ...base,
        points: newPts,
        closed: isClosed,
        curves: [...base.curves, ...Array(extra).fill(null)],
        lengths: [...base.lengths, ...Array(extra).fill(null)],
      };
      update((d) => ({ ...d, shapes: d.shapes.map((s) => (s.id === startOn.id ? merged : s)) }), false);
      setSel({ type: "shape", id: startOn.id });
      return;
    }
    const s = emptyShape(pts, closed);
    update((d) => ({ ...d, shapes: [...d.shapes, s] }), false);
    setSel({ type: "shape", id: s.id });
  }

  const hitFixed = (p: Pt): FixedItem | null => {
    for (let i = data.fixed.length - 1; i >= 0; i--) {
      const f = data.fixed[i];
      const fr = fixedFrame(f, data.shapes);
      const l = toLocal(p, fr.c, fr.rot);
      const cat = catalogFor(f.kind);
      const hw = f.w / 2 + 4 / k;
      const hd = cat.onWall ? data.wallThickness / 2 + (f.d || 10) + 6 / k : f.d / 2 + 4 / k;
      if (Math.abs(l.x) <= hw && Math.abs(l.y) <= hd) return f;
    }
    return null;
  };

  const hitFurn = (p: Pt): FurnitureItem | null => {
    const order = [...furniture].sort((a, b) => (a.category === "rug" ? 1 : 0) - (b.category === "rug" ? 1 : 0));
    for (const f of order) {
      const l = toLocal(p, { x: f.x, y: f.y }, f.rot);
      if (Math.abs(l.x) <= f.w / 2 + 3 / k && Math.abs(l.y) <= f.d / 2 + 3 / k) return f;
    }
    return null;
  };

  const hitVertex = (p: Pt) => {
    const tol = 9 / k;
    for (const s of data.shapes)
      for (let i = 0; i < s.points.length; i++) if (dist(s.points[i], p) < tol) return { shapeId: s.id, index: i };
    return null;
  };

  const selectedShape = sel?.type === "shape" ? data.shapes.find((s) => s.id === sel.id) : undefined;

  const hitBend = (p: Pt) => {
    if (!selectedShape) return null;
    const tol = 9 / k;
    for (let i = 0; i < segCount(selectedShape); i++)
      if (dist(segPointAt(selectedShape, i, 0.5), p) < tol) return i;
    return null;
  };

  const nearestWall = (p: Pt, tol: number) => hitSegment(data.shapes, p, tol);

  const mainPoly = () => {
    const closed = data.shapes.filter((s) => s.closed);
    return closed.length ? shapePolygon(closed[0]) : [];
  };

  const updateFurn = (id: string, patch: Partial<FurnitureItem>) =>
    update(
      (d) => ({
        ...d,
        proposals: d.proposals.map((pr) =>
          pr.id === d.activeProposalId ? { ...pr, items: pr.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : pr
        ),
      }),
      false
    );

  /* ---------- borrar segmento ---------- */
  const eraseSegment = (shapeId: string, seg: number) => {
    const s = data.shapes.find((x) => x.id === shapeId);
    if (!s) return;
    beginChange();
    update((d) => {
      const n = s.points.length;
      let shapes = d.shapes.filter((x) => x.id !== shapeId);
      let fixed = d.fixed;
      if (s.closed) {
        const pts = [...s.points.slice(seg + 1), ...s.points.slice(0, seg + 1)];
        const rot = <T,>(a: T[]) => [...a.slice(seg + 1), ...a.slice(0, seg)];
        const ns: Shape = { ...s, points: pts, closed: false, curves: rot(s.curves), lengths: rot(s.lengths) };
        shapes = [...shapes, ns];
        fixed = fixed
          .filter((f) => !(f.shapeId === shapeId && f.seg === seg))
          .map((f) => (f.shapeId === shapeId && f.seg != null ? { ...f, seg: (f.seg - (seg + 1) + n) % n } : f));
      } else {
        const A: Shape = { ...s, id: s.id, points: s.points.slice(0, seg + 1), curves: s.curves.slice(0, seg), lengths: s.lengths.slice(0, seg) };
        const B: Shape = { ...s, id: uid(), points: s.points.slice(seg + 1), curves: s.curves.slice(seg + 1), lengths: s.lengths.slice(seg + 1) };
        if (A.points.length >= 2) shapes.push(A);
        if (B.points.length >= 2) shapes.push(B);
        fixed = fixed
          .filter((f) => !(f.shapeId === shapeId && (f.seg === seg || (f.seg! < seg && A.points.length < 2) || (f.seg! > seg && B.points.length < 2))))
          .map((f) => (f.shapeId === shapeId && f.seg! > seg ? { ...f, shapeId: B.id, seg: f.seg! - (seg + 1) } : f));
      }
      return { ...d, shapes, fixed };
    }, false);
    setSel(null);
  };

  /* ---------- crear elemento fijo ---------- */
  const placeFixed = (p: Pt) => {
    if (!placeKind) return;
    const cat = catalogFor(placeKind);
    const item: FixedItem = { id: uid(), kind: placeKind, w: cat.w, d: cat.d, x: p.x, y: p.y, rot: 0, side: 1, hinge: "start" };
    if (cat.onWall) {
      const h = nearestWall(p, 150 / k);
      if (!h) return;
      const s = data.shapes.find((x) => x.id === h.shapeId)!;
      item.shapeId = h.shapeId;
      item.seg = h.seg;
      item.t = h.t;
      const fr = fixedFrame(item, data.shapes);
      const poly = mainPoly();
      const probe = add(fr.c, mul(fr.normal, 30));
      item.side = poly.length && !pointInPolygon(probe, poly) ? -1 : 1;
      const L = chordLength(s, h.seg);
      item.w = Math.min(item.w, Math.max(20, L - 10));
    } else {
      item.x = snap(p.x, 5);
      item.y = snap(p.y, 5);
    }
    beginChange();
    update((d) => ({ ...d, fixed: [...d.fixed, item] }), false);
    setSel({ type: "fixed", id: item.id });
    props.setTool("select");
  };

  /* ---------- eventos de puntero ---------- */
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toWorld(e);
    const free = e.shiftKey;
    if (e.button === 1 || e.button === 2 || space || tool === "pan") {
      setDrag({ kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y });
      return;
    }
    if (step === "sketch" && tool === "wall") {
      const last = drawing[drawing.length - 1] || null;
      const q = snapPoint(p, last, free);
      if (!drawing.length) {
        setDrawing([q]);
        return;
      }
      if (drawing.length >= 3 && dist(q, drawing[0]) < 0.5) {
        commitPolyline(drawing, true);
        setDrawing([]);
        return;
      }
      if (last && dist(q, last) < 0.5) {
        if (drawing.length >= 2) commitPolyline(drawing, false);
        setDrawing([]);
        return;
      }
      setDrawing([...drawing, q]);
      return;
    }
    if (step === "sketch" && tool === "rect") {
      setDrag({ kind: "rect", start: snapPoint(p, null, free) });
      return;
    }
    if (step === "sketch" && tool === "curve") {
      const q = snapPoint(p, curveStage[0] || null, free);
      if (curveStage.length < 2) {
        setCurveStage([...curveStage, q]);
        return;
      }
      const [a, b] = curveStage;
      const m = q;
      const c = sub(mul(m, 2), mul(add(a, b), 0.5));
      // ¿Coincide con un segmento existente? Entonces se curva ese segmento.
      beginChange();
      let matched = false;
      for (const s of data.shapes)
        for (let i = 0; i < segCount(s); i++) {
          const [sa, sb] = segEnds(s, i);
          if ((dist(sa, a) < 0.5 && dist(sb, b) < 0.5) || (dist(sa, b) < 0.5 && dist(sb, a) < 0.5)) {
            matched = true;
            update((d) => ({ ...d, shapes: d.shapes.map((x) => (x.id === s.id ? { ...x, curves: x.curves.map((cc, j) => (j === i ? c : cc)) } : x)) }), false);
          }
        }
      if (!matched) {
        const s = emptyShape([a, b], false);
        s.curves = [c];
        update((d) => ({ ...d, shapes: [...d.shapes, s] }), false);
      }
      setCurveStage([]);
      return;
    }
    if (step === "sketch" && tool === "erase") {
      const h = nearestWall(p, 10 / k);
      if (h) eraseSegment(h.shapeId, h.seg);
      return;
    }
    if (step === "fixed" && tool === "place") {
      placeFixed(p);
      return;
    }
    // --- selección ---
    if (step === "sketch") {
      const b = hitBend(p);
      if (b != null && selectedShape) {
        beginChange();
        setDrag({ kind: "bend", shapeId: selectedShape.id, seg: b });
        return;
      }
      const v = hitVertex(p);
      if (v) {
        beginChange();
        setSel({ type: "shape", id: v.shapeId });
        setDrag({ kind: "vertex", ...v });
        return;
      }
      const h = nearestWall(p, 8 / k);
      if (h) {
        const s = data.shapes.find((x) => x.id === h.shapeId)!;
        beginChange();
        setSel({ type: "shape", id: s.id });
        setDrag({ kind: "shape", shapeId: s.id, start: p, orig: s });
        return;
      }
    }
    if (step === "measure") {
      const h = nearestWall(p, 12 / k);
      if (h) {
        props.onSegmentClick?.(h.shapeId, h.seg);
        return;
      }
    }
    if (step === "fixed") {
      const f = hitFixed(p);
      if (f) {
        beginChange();
        setSel({ type: "fixed", id: f.id });
        const fr = fixedFrame(f, data.shapes);
        setDrag({ kind: "fixed", id: f.id, offset: sub(fr.c, p) });
        return;
      }
    }
    if (step === "design") {
      const f = hitFurn(p);
      if (f) {
        beginChange();
        setSel({ type: "furn", id: f.id });
        setDrag({ kind: "furn", id: f.id, offset: sub({ x: f.x, y: f.y }, p) });
        return;
      }
    }
    setSel(null);
    setDrag({ kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toWorld(e);
    const free = e.shiftKey;
    if (tool === "wall" && step === "sketch") setCursor(snapPoint(p, drawing[drawing.length - 1] || null, free));
    else if (tool === "curve" && step === "sketch") setCursor(curveStage.length === 2 ? p : snapPoint(p, curveStage[0] || null, free));
    else if (tool === "rect" && step === "sketch") setCursor(snapPoint(p, null, free));
    else setCursor(p);
    if (!drag) return;
    switch (drag.kind) {
      case "pan":
        setView((v) => ({ ...v, x: drag.vx + e.clientX - drag.sx, y: drag.vy + e.clientY - drag.sy }));
        break;
      case "vertex": {
        const q = snapPoint(p, null, free, { shapeId: drag.shapeId, index: drag.index });
        update(
          (d) => ({
            ...d,
            shapes: d.shapes.map((s) => {
              if (s.id !== drag.shapeId) return s;
              const points = s.points.map((pt, i) => (i === drag.index ? q : pt));
              const ns = { ...s, points };
              if (d.planReady) ns.lengths = s.lengths.map((l, i) => Math.round(chordLength(ns, i)));
              return ns;
            }),
          }),
          false
        );
        break;
      }
      case "shape": {
        let dv = sub(p, drag.start);
        if (!free) dv = { x: snap(dv.x, 10), y: snap(dv.y, 10) };
        update(
          (d) => ({
            ...d,
            shapes: d.shapes.map((s) =>
              s.id === drag.shapeId
                ? { ...s, points: drag.orig.points.map((q) => add(q, dv)), curves: drag.orig.curves.map((c) => (c ? add(c, dv) : c)) }
                : s
            ),
          }),
          false
        );
        break;
      }
      case "bend": {
        update(
          (d) => ({
            ...d,
            shapes: d.shapes.map((s) => {
              if (s.id !== drag.shapeId) return s;
              const [a, b] = segEnds(s, drag.seg);
              const mid = lerp(a, b, 0.5);
              const straight = dist(p, mid) < 6 / k;
              const c = straight ? null : sub(mul(p, 2), mul(add(a, b), 0.5));
              return { ...s, curves: s.curves.map((cc, j) => (j === drag.seg ? c : cc)) };
            }),
          }),
          false
        );
        break;
      }
      case "fixed": {
        const target = add(p, drag.offset);
        const f = data.fixed.find((x) => x.id === drag.id);
        if (!f) break;
        if (catalogFor(f.kind).onWall) {
          const h = nearestWall(target, 200 / k);
          if (h) update((d) => ({ ...d, fixed: d.fixed.map((x) => (x.id === f.id ? { ...x, shapeId: h.shapeId, seg: h.seg, t: h.t } : x)) }), false);
        } else {
          const q = free ? target : { x: snap(target.x, 5), y: snap(target.y, 5) };
          update((d) => ({ ...d, fixed: d.fixed.map((x) => (x.id === f.id ? { ...x, x: q.x, y: q.y } : x)) }), false);
        }
        break;
      }
      case "furn": {
        const target = add(p, drag.offset);
        const q = free ? target : { x: snap(target.x, 5), y: snap(target.y, 5) };
        updateFurn(drag.id, q);
        break;
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag?.kind === "rect") {
      const a = drag.start;
      const b = snapPoint(toWorld(e), null, e.shiftKey);
      if (Math.abs(b.x - a.x) > 20 && Math.abs(b.y - a.y) > 20) {
        const s = emptyShape(
          [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }],
          true
        );
        beginChange();
        update((d) => ({ ...d, shapes: [...d.shapes, s] }), false);
        setSel({ type: "shape", id: s.id });
        props.setTool("select");
      }
    }
    setDrag(null);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const p = toWorld(e);
    if (step === "sketch" && tool === "select" && selectedShape) {
      const b = hitBend(p);
      if (b != null) {
        beginChange();
        update((d) => ({ ...d, shapes: d.shapes.map((s) => (s.id === selectedShape.id ? { ...s, curves: s.curves.map((c, j) => (j === b ? null : c)) } : s)) }), false);
      }
    }
    if (step === "design") {
      const f = hitFurn(p);
      if (f) {
        beginChange();
        updateFurn(f.id, { rot: (f.rot + 90) % 360 });
      }
    }
  };

  /* ---------- render ---------- */
  const wx0 = -view.x / k,
    wy0 = -view.y / k,
    ww = size.w / k,
    wh = size.h / k;

  const cursorStyle =
    drag?.kind === "pan" ? "grabbing" : space || tool === "pan" ? "grab" : tool === "select" ? "default" : tool === "erase" ? "not-allowed" : "crosshair";

  // Fantasma al colocar elemento
  let ghost: React.ReactNode = null;
  if (step === "fixed" && tool === "place" && placeKind && cursor) {
    const cat = catalogFor(placeKind);
    const it: FixedItem = { id: "ghost", kind: placeKind, w: cat.w, d: cat.d, x: snap(cursor.x, 5), y: snap(cursor.y, 5), rot: 0, side: 1 };
    if (cat.onWall) {
      const h = nearestWall(cursor, 150 / k);
      if (h) {
        it.shapeId = h.shapeId;
        it.seg = h.seg;
        it.t = h.t;
        const fr = fixedFrame(it, data.shapes);
        const poly = mainPoly();
        it.side = poly.length && !pointInPolygon(add(fr.c, mul(fr.normal, 30)), poly) ? -1 : 1;
      } else it.shapeId = undefined;
    }
    if (!cat.onWall || it.shapeId) {
      const fr = fixedFrame(it, data.shapes);
      ghost = (
        <g transform={`translate(${fr.c.x} ${fr.c.y}) rotate(${fr.rot})`} opacity={0.6} style={{ pointerEvents: "none" }}>
          <FixedGlyph item={it} T={data.wallThickness} selected />
        </g>
      );
    }
  }

  const lastPt = drawing[drawing.length - 1];
  const focus = props.focusSeg ? data.shapes.find((s) => s.id === props.focusSeg!.shapeId) : null;

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-[#f6f7fb]">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        style={{ cursor: cursorStyle, touchAction: "none", display: "block" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setCursor(null)}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <pattern id="gminor" width={MINOR} height={MINOR} patternUnits="userSpaceOnUse">
            <path d={`M ${MINOR} 0 L 0 0 0 ${MINOR}`} fill="none" stroke="#e3e6ef" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </pattern>
          <pattern id="gmajor" width={MINOR * 2} height={MINOR * 2} patternUnits="userSpaceOnUse">
            <rect width={MINOR * 2} height={MINOR * 2} fill="url(#gminor)" />
            <path d={`M ${MINOR * 2} 0 L 0 0 0 ${MINOR * 2}`} fill="none" stroke="#cfd4e2" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>
          <rect x={wx0} y={wy0} width={ww} height={wh} fill={k > 0.15 ? "url(#gmajor)" : "#f6f7fb"} />
          <PlanLayers
            data={data}
            k={k}
            sel={sel}
            furniture={step === "design" || step === "products" ? furniture : []}
            showDims={plan || step === "measure" || data.shapes.some((s) => s.lengths.some(Boolean))}
          />

          {/* Resaltado de segmento enfocado (medidas) */}
          {focus && props.focusSeg && (() => {
            const [a, b] = segEnds(focus, props.focusSeg.seg);
            return <path d={segPath(a, b, focus.curves[props.focusSeg.seg])} stroke={COLORS.accent} strokeWidth={6} strokeOpacity={0.5} fill="none" vectorEffect="non-scaling-stroke" />;
          })()}

          {/* Números de pared en paso de medidas */}
          {step === "measure" &&
            data.shapes.map((s, si) =>
              Array.from({ length: segCount(s) }, (_, i) => {
                const m = segPointAt(s, i, 0.5);
                const active = props.focusSeg?.shapeId === s.id && props.focusSeg.seg === i;
                const label = data.shapes.length > 1 ? `${si + 1}.${i + 1}` : `${i + 1}`;
                return (
                  <g key={s.id + i} transform={`translate(${m.x} ${m.y})`} style={{ cursor: "pointer" }}>
                    <circle r={11 / k} fill={active ? COLORS.accent : "white"} stroke={COLORS.accent} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    <text fontSize={10 / k} textAnchor="middle" dominantBaseline="central" fill={active ? "white" : COLORS.accent} fontWeight={700} fontFamily="Inter, Arial">
                      {label}
                    </text>
                  </g>
                );
              })
            )}

          {/* Manejadores de la forma seleccionada (boceto) */}
          {step === "sketch" && selectedShape && (
            <g>
              {selectedShape.points.map((p, i) => (
                <rect key={"v" + i} x={p.x - 5 / k} y={p.y - 5 / k} width={10 / k} height={10 / k} fill="white" stroke={COLORS.accent} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              ))}
              {Array.from({ length: segCount(selectedShape) }, (_, i) => {
                const m = segPointAt(selectedShape, i, 0.5);
                return <circle key={"m" + i} cx={m.x} cy={m.y} r={5 / k} fill={selectedShape.curves[i] ? COLORS.accent : "white"} stroke={COLORS.accent} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />;
              })}
            </g>
          )}
          {step === "sketch" && !selectedShape && tool === "select" &&
            data.shapes.flatMap((s) => s.points.map((p, i) => <circle key={s.id + i} cx={p.x} cy={p.y} r={3 / k} fill={COLORS.sketch} />))}

          {/* Previsualización de pared */}
          {drawing.length > 0 && (
            <g style={{ pointerEvents: "none" }}>
              <polyline points={drawing.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={COLORS.accent} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              {cursor && lastPt && (
                <>
                  <line x1={lastPt.x} y1={lastPt.y} x2={cursor.x} y2={cursor.y} stroke={COLORS.accent} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  <LengthTag a={lastPt} b={cursor} k={k} />
                </>
              )}
              {drawing.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={(i === 0 && drawing.length >= 3 ? 7 : 4) / k} fill={i === 0 ? "white" : COLORS.accent} stroke={COLORS.accent} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          )}

          {/* Previsualización de curva */}
          {curveStage.length > 0 && cursor && (
            <g style={{ pointerEvents: "none" }}>
              {curveStage.length === 1 && <line x1={curveStage[0].x} y1={curveStage[0].y} x2={cursor.x} y2={cursor.y} stroke={COLORS.accent} strokeDasharray="6 4" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
              {curveStage.length === 2 && (
                <path d={segPath(curveStage[0], curveStage[1], sub(mul(cursor, 2), mul(add(curveStage[0], curveStage[1]), 0.5)))} stroke={COLORS.accent} strokeWidth={2.5} fill="none" vectorEffect="non-scaling-stroke" />
              )}
              {curveStage.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4 / k} fill={COLORS.accent} />
              ))}
            </g>
          )}

          {/* Previsualización de rectángulo */}
          {drag?.kind === "rect" && cursor && (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={Math.min(drag.start.x, cursor.x)}
                y={Math.min(drag.start.y, cursor.y)}
                width={Math.abs(cursor.x - drag.start.x)}
                height={Math.abs(cursor.y - drag.start.y)}
                fill="rgba(79,70,229,0.06)"
                stroke={COLORS.accent}
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
              />
              <LengthTag a={drag.start} b={{ x: cursor.x, y: drag.start.y }} k={k} />
              <LengthTag a={{ x: cursor.x, y: drag.start.y }} b={cursor} k={k} />
            </g>
          )}

          {ghost}

          {snapHint && (tool === "wall" || tool === "curve" || tool === "rect" || drag?.kind === "vertex") && (
            <circle cx={snapHint.x} cy={snapHint.y} r={9 / k} fill="none" stroke="#f59e0b" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ pointerEvents: "none" }} />
          )}
          {cursor && (tool === "wall" || tool === "curve" || tool === "rect") && step === "sketch" && (
            <circle cx={cursor.x} cy={cursor.y} r={3.5 / k} fill={COLORS.accent} style={{ pointerEvents: "none" }} />
          )}
        </g>
        <ScaleBar k={k} h={size.h} />
      </svg>
    </div>
  );
});

function LengthTag({ a, b, k }: { a: Pt; b: Pt; k: number }) {
  const L = dist(a, b);
  if (L < 5) return null;
  const m = lerp(a, b, 0.5);
  const label = "≈ " + fmtM(L);
  const w = (label.length * 6.5 + 12) / k;
  return (
    <g transform={`translate(${m.x} ${m.y - 16 / k})`}>
      <rect x={-w / 2} y={-9 / k} width={w} height={18 / k} rx={9 / k} fill={COLORS.accent} />
      <text fontSize={11 / k} fill="white" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, Arial" fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

function ScaleBar({ k, h }: { k: number; h: number }) {
  const opts = [10, 20, 50, 100, 200, 500, 1000];
  const cm = opts.find((o) => o * k >= 60) || 1000;
  const px = cm * k;
  return (
    <g transform={`translate(20 ${h - 28})`} style={{ pointerEvents: "none" }}>
      <rect x={-8} y={-18} width={px + 16} height={30} rx={8} fill="white" fillOpacity={0.85} />
      <line x1={0} y1={0} x2={px} y2={0} stroke="#334155" strokeWidth={2} />
      <line x1={0} y1={-4} x2={0} y2={4} stroke="#334155" strokeWidth={2} />
      <line x1={px} y1={-4} x2={px} y2={4} stroke="#334155" strokeWidth={2} />
      <text x={px / 2} y={-6} fontSize={10} textAnchor="middle" fill="#334155" fontFamily="Inter, Arial" fontWeight={600}>
        {cm >= 100 ? `${cm / 100} m` : `${cm} cm`}
      </text>
    </g>
  );
}

export { closestOnSeg, isOpening };
