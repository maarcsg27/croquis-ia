"use client";
import React, { useState } from "react";
import { Ruler, Sparkles, CheckCircle, ArrowLeft, ArrowRight, CornerDownRight, SlidersHorizontal } from "lucide-react";
import type { ProjectData, Shape } from "@/lib/types";
import { chordLength, fmtM, rebuildShapes, segCount } from "@/lib/geometry";
import { roomArea } from "../plan/PlanLayers";

type Props = {
  data: ProjectData;
  update: (fn: (d: ProjectData) => ProjectData, history?: boolean) => void;
  beginChange: () => void;
  onPrev: () => void;
  onNext: () => void;
  focusSeg: { shapeId: string; seg: number } | null;
  setFocusSeg: (seg: { shapeId: string; seg: number } | null) => void;
};

export function MeasurePanel({ data, update, beginChange, onPrev, onNext, focusSeg, setFocusSeg }: Props) {
  const [orthogonalize, setOrthogonalize] = useState(true);
  const area = roomArea(data);

  const setWallLength = (shapeId: string, segIndex: number, valCm: number | null) => {
    beginChange();
    update(
      (d) => ({
        ...d,
        shapes: d.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          const lengths = [...s.lengths];
          lengths[segIndex] = valCm && valCm > 0 ? valCm : null;
          return { ...s, lengths };
        }),
      }),
      false
    );
  };

  const applyScaleAndStraighten = () => {
    beginChange();
    const res = rebuildShapes(data.shapes, orthogonalize);
    update((d) => ({ ...d, shapes: res.shapes, planReady: true }), false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-800">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-1">Paso 2 · Medidas Reales</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Introduce las medidas reales de tus paredes en centímetros o metros. La app recalculará automáticamente la escala y las proporciones.
        </p>
      </div>

      {/* Info de la estancia */}
      <div className="grid grid-cols-2 gap-2 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs">
        <div>
          <span className="text-indigo-500 font-semibold block">Superficie estimada</span>
          <span className="text-base font-bold text-slate-800">{area > 0 ? `${area.toFixed(2)} m²` : "—"}</span>
        </div>
        <div>
          <span className="text-indigo-500 font-semibold block">Paredes dibujadas</span>
          <span className="text-base font-bold text-slate-800">
            {data.shapes.reduce((acc, s) => acc + segCount(s), 0)} tramos
          </span>
        </div>
      </div>

      {/* Lista de paredes */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center justify-between">
          <span>Medidas por tramo</span>
          <span className="text-[11px] font-normal text-slate-400">Haz clic en el plano para seleccionar</span>
        </label>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {data.shapes.map((s, si) =>
            Array.from({ length: segCount(s) }, (_, i) => {
              const currentMeasure = s.lengths[i];
              const approx = Math.round(chordLength(s, i));
              const isFocused = focusSeg?.shapeId === s.id && focusSeg.seg === i;
              const wallLabel = data.shapes.length > 1 ? `Pared ${si + 1}.${i + 1}` : `Pared ${i + 1}`;

              return (
                <div
                  key={`${s.id}-${i}`}
                  onClick={() => setFocusSeg({ shapeId: s.id, seg: i })}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isFocused
                      ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                      {si + 1 > 1 ? `${si + 1}.${i + 1}` : `${i + 1}`}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-700 block">{wallLabel}</span>
                      <span className="text-[10px] text-slate-400">Croquis: ≈ {fmtM(approx)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      placeholder={String(approx)}
                      value={currentMeasure ?? ""}
                      onChange={(e) => {
                        const v = e.target.value ? parseFloat(e.target.value) : null;
                        setWallLength(s.id, i, v);
                      }}
                      className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-right font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                    <span className="text-[11px] font-medium text-slate-400">cm</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ajustes de planta */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={orthogonalize}
              onChange={(e) => setOrthogonalize(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Enderezar ángulos rectos (90° / 45°)</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Altura de techo</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={data.wallHeight}
                onChange={(e) => update((d) => ({ ...d, wallHeight: Number(e.target.value) || 250 }))}
                className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-semibold"
              />
              <span className="text-slate-400 text-[11px]">cm</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Grosor de paredes</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={data.wallThickness}
                onChange={(e) => update((d) => ({ ...d, wallThickness: Number(e.target.value) || 15 }))}
                className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-semibold"
              />
              <span className="text-slate-400 text-[11px]">cm</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={applyScaleAndStraighten}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Convertir en Plano a Escala</span>
        </button>
      </div>

      {/* Acciones inferiores */}
      <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100 font-semibold text-xs py-3 px-3 rounded-xl border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all"
        >
          <span>Elementos Fijos</span>
          <CornerDownRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
