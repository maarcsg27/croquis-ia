"use client";
import React from "react";
import { ArrowLeft, CornerDownRight, RotateCw, Trash2, FlipHorizontal, Sliders, Check } from "lucide-react";
import { FIXED_CATALOG, catalogFor, isOpening } from "@/lib/catalog";
import type { FixedItem, FixedKind, ProjectData } from "@/lib/types";
import type { Sel } from "../plan/PlanLayers";
import type { Tool } from "../plan/PlanCanvas";

type Props = {
  data: ProjectData;
  sel: Sel;
  setSel: (s: Sel) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  placeKind: FixedKind | null;
  setPlaceKind: (k: FixedKind | null) => void;
  update: (fn: (d: ProjectData) => ProjectData, history?: boolean) => void;
  beginChange: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function FixedPanel({
  data,
  sel,
  setSel,
  tool,
  setTool,
  placeKind,
  setPlaceKind,
  update,
  beginChange,
  onPrev,
  onNext,
}: Props) {
  const selectedItem = sel?.type === "fixed" ? data.fixed.find((f) => f.id === sel.id) : null;

  const selectKindToPlace = (kind: FixedKind) => {
    setPlaceKind(kind);
    setTool("place");
  };

  const updateSelected = (patch: Partial<FixedItem>) => {
    if (!selectedItem) return;
    beginChange();
    update(
      (d) => ({
        ...d,
        fixed: d.fixed.map((f) => (f.id === selectedItem.id ? { ...f, ...patch } : f)),
      }),
      false
    );
  };

  const deleteSelected = () => {
    if (!selectedItem) return;
    beginChange();
    update((d) => ({ ...d, fixed: d.fixed.filter((f) => f.id !== selectedItem.id) }), false);
    setSel(null);
  };

  const openings = FIXED_CATALOG.filter((c) => isOpening(c.kind));
  const utilities = FIXED_CATALOG.filter((c) => c.kind === "radiator" || c.kind === "ac" || c.kind === "socket" || c.kind === "tv_socket");
  const structural = FIXED_CATALOG.filter((c) => !isOpening(c.kind) && !utilities.includes(c));

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-800">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-1">Paso 3 · Elementos Fijos</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Selecciona un elemento y haz clic sobre una pared o en el interior del plano para colocarlo.
        </p>
      </div>

      {/* Editor del elemento seleccionado */}
      {selectedItem ? (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>{catalogFor(selectedItem.kind).emoji}</span>
              <span>{selectedItem.label || catalogFor(selectedItem.kind).name}</span>
            </span>
            <button
              type="button"
              onClick={deleteSelected}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Ancho (cm)</label>
              <input
                type="number"
                value={selectedItem.w}
                onChange={(e) => updateSelected({ w: Math.max(10, Number(e.target.value) || 10) })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
              />
            </div>

            {!catalogFor(selectedItem.kind).onWall && (
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Fondo (cm)</label>
                <input
                  type="number"
                  value={selectedItem.d}
                  onChange={(e) => updateSelected({ d: Math.max(5, Number(e.target.value) || 5) })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Acciones de apertura */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-indigo-100">
            {catalogFor(selectedItem.kind).onWall ? (
              <>
                <button
                  type="button"
                  onClick={() => updateSelected({ side: selectedItem.side === 1 ? -1 : 1 })}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Invertir Lado</span>
                </button>

                {selectedItem.kind === "door" && (
                  <button
                    type="button"
                    onClick={() => updateSelected({ hinge: selectedItem.hinge === "start" ? "end" : "start" })}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cambiar Bisagra</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => updateSelected({ rot: (selectedItem.rot + 90) % 360 })}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Girar 90° ({selectedItem.rot}°)</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Catálogo para insertar */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {/* Huecos y accesos */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Puertas y Ventanas (En pared)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {openings.map((c) => {
              const isSelected = tool === "place" && placeKind === c.kind;
              return (
                <button
                  key={c.kind}
                  type="button"
                  onClick={() => selectKindToPlace(c.kind)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <div className="truncate">
                    <span className="block truncate">{c.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      {c.w} cm
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Estructurales y obra */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Estructurales / Obra fija
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {structural.map((c) => {
              const isSelected = tool === "place" && placeKind === c.kind;
              return (
                <button
                  key={c.kind}
                  type="button"
                  onClick={() => selectKindToPlace(c.kind)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <div className="truncate">
                    <span className="block truncate">{c.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      {c.w}×{c.d} cm
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instalaciones */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Instalaciones / Clima / Tomas
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {utilities.map((c) => {
              const isSelected = tool === "place" && placeKind === c.kind;
              return (
                <button
                  key={c.kind}
                  type="button"
                  onClick={() => selectKindToPlace(c.kind)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <div className="truncate">
                    <span className="block truncate">{c.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      {c.w} cm
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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
          <span>Ideas y Renders IA</span>
          <CornerDownRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
