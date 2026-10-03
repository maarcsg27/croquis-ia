"use client";
import React from "react";
import { MousePointer, PenTool, Square, Spline, Eraser, Hand, Trash2, Wand2, Sparkles, CornerDownRight } from "lucide-react";
import type { ProjectData, Step } from "@/lib/types";
import type { Tool } from "../plan/PlanCanvas";
import { uid } from "@/lib/geometry";

type Props = {
  data: ProjectData;
  tool: Tool;
  setTool: (t: Tool) => void;
  update: (fn: (d: ProjectData) => ProjectData, history?: boolean) => void;
  beginChange: () => void;
  onNext: () => void;
};

export function SketchPanel({ data, tool, setTool, update, beginChange, onNext }: Props) {
  const wallCount = data.shapes.reduce((acc, s) => acc + s.points.length, 0);

  const clearAll = () => {
    if (confirm("¿Seguro que quieres borrar todo el dibujo?")) {
      beginChange();
      update((d) => ({ ...d, shapes: [], fixed: [], planReady: false, proposals: [], products: [] }), false);
    }
  };

  const loadPreset = (type: "rect" | "l_shape" | "irregular") => {
    beginChange();
    if (type === "rect") {
      const s = {
        id: uid(),
        points: [
          { x: 100, y: 100 },
          { x: 500, y: 100 },
          { x: 500, y: 400 },
          { x: 100, y: 400 },
        ],
        closed: true,
        curves: [null, null, null, null],
        lengths: [400, 300, 400, 300],
      };
      update((d) => ({ ...d, shapes: [s], planReady: false }), false);
    } else if (type === "l_shape") {
      const s = {
        id: uid(),
        points: [
          { x: 100, y: 100 },
          { x: 500, y: 100 },
          { x: 500, y: 280 },
          { x: 320, y: 280 },
          { x: 320, y: 460 },
          { x: 100, y: 460 },
        ],
        closed: true,
        curves: [null, null, null, null, null, null],
        lengths: [400, 180, 180, 180, 220, 360],
      };
      update((d) => ({ ...d, shapes: [s], planReady: false }), false);
    } else if (type === "irregular") {
      const s = {
        id: uid(),
        points: [
          { x: 100, y: 100 },
          { x: 450, y: 100 },
          { x: 520, y: 350 },
          { x: 100, y: 400 },
        ],
        closed: true,
        curves: [null, { x: 520, y: 200 }, null, null],
        lengths: [350, 260, 420, 300],
      };
      update((d) => ({ ...d, shapes: [s], planReady: false }), false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-800">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-1">Paso 1 · Boceto / Croquis</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Dibuja a mano alzada o con líneas rectas la forma de la habitación. Puedes cerrar la figura uniendo el último punto con el primero.
        </p>
      </div>

      {/* Herramientas de dibujo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Herramientas</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTool("wall")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              tool === "wall"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Paredes</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("rect")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              tool === "rect"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Square className="w-4 h-4" />
            <span>Rectángulo</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("curve")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              tool === "curve"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Spline className="w-4 h-4" />
            <span>Pared curva</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("select")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              tool === "select"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>Seleccionar / Mover</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("erase")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              tool === "erase"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span>Borrar tramo</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("pan")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              tool === "pan"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>Desplazar lienzo</span>
          </button>
        </div>
      </div>

      {/* Plantillas rápidas */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Plantillas rápidas</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => loadPreset("rect")}
            className="px-2 py-2 text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-slate-600 font-medium transition"
          >
            Rectangular
          </button>
          <button
            type="button"
            onClick={() => loadPreset("l_shape")}
            className="px-2 py-2 text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-slate-600 font-medium transition"
          >
            En Forma de L
          </button>
          <button
            type="button"
            onClick={() => loadPreset("irregular")}
            className="px-2 py-2 text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-slate-600 font-medium transition"
          >
            Con Curva
          </button>
        </div>
      </div>

      {/* Consejos y atajos */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
        <p className="font-semibold text-slate-700 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Consejos para dibujar:</span>
        </p>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li>Haz clic para fijar esquinas; haz clic en el punto inicial para cerrar.</li>
          <li>Mantén <kbd className="bg-white px-1 py-0.5 rounded border border-slate-300">Shift</kbd> para dibujar libre sin auto-alineación.</li>
          <li>Usa la rueda del ratón para Zoom y botón derecho / espacio para arrastrar.</li>
        </ul>
      </div>

      {/* Acciones inferiores */}
      <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-100">
        {wallCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center justify-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 py-1 font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar todo</span>
          </button>
        )}

        <button
          type="button"
          disabled={data.shapes.length === 0}
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all"
        >
          <span>Añadir Medidas</span>
          <CornerDownRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
