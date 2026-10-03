"use client";
import React from "react";
import {
  PenTool,
  Ruler,
  Boxes,
  Sparkles,
  ShoppingBag,
  Undo2,
  Redo2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  Settings,
  Cloud,
  HardDrive,
  Save,
} from "lucide-react";
import type { Step } from "@/lib/types";
import { ROOM_TYPES } from "@/lib/catalog";

type Props = {
  step: Step;
  setStep: (s: Step) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  roomType: string;
  setRoomType: (type: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenProjects: () => void;
  onOpenSettings: () => void;
  isCloudSaved: boolean;
  hasShapes: boolean;
};

const STEPS: { key: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "sketch", label: "1. Croquis", icon: PenTool },
  { key: "measure", label: "2. Medidas", icon: Ruler },
  { key: "fixed", label: "3. Fijos y Obra", icon: Boxes },
  { key: "design", label: "4. Distribución IA", icon: Sparkles },
  { key: "products", label: "5. Productos", icon: ShoppingBag },
];

export function Header({
  step,
  setStep,
  projectName,
  setProjectName,
  roomType,
  setRoomType,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFit,
  onZoomIn,
  onZoomOut,
  onOpenProjects,
  onOpenSettings,
  isCloudSaved,
  hasShapes,
}: Props) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between gap-4 select-none z-20">
      {/* Izquierda: Logo y nombre de proyecto */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-base shadow-sm">
            📐
          </div>
          <span className="font-extrabold text-slate-800 text-base tracking-tight hidden sm:inline">
            ROOM<span className="text-indigo-600">IA</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Nombre y tipo de estancia */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="font-bold text-xs sm:text-sm text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white px-2 py-1 rounded-lg border border-transparent focus:border-slate-300 transition focus:outline-none max-w-[130px] sm:max-w-[180px]"
            placeholder="Mi habitación"
          />

          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden md:block"
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Centro: Wizard de pasos */}
      <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl gap-0.5 max-w-xl">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          const isAccessible = idx === 0 || hasShapes;

          return (
            <button
              key={s.key}
              type="button"
              disabled={!isAccessible}
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-indigo-600 shadow-xs"
                  : isAccessible
                  ? "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  : "text-slate-400 opacity-40 cursor-not-allowed"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{s.label}</span>
              <span className="lg:hidden">{idx + 1}</span>
            </button>
          );
        })}
      </nav>

      {/* Derecha: Deshacer, Zoom, Guardado y Ajustes */}
      <div className="flex items-center gap-1.5">
        {/* Deshacer / Rehacer */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rehacer (Ctrl+Y)"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={onZoomOut}
            title="Alejar (-)"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onFit}
            title="Ajustar al centro"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            title="Acercar (+)"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Estado Guardado */}
        <div
          title={isCloudSaved ? "Guardado en Neon Postgres" : "Guardado en navegador"}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hidden md:flex"
        >
          {isCloudSaved ? <Cloud className="w-3.5 h-3.5 text-indigo-500" /> : <HardDrive className="w-3.5 h-3.5 text-slate-400" />}
          <span>{isCloudSaved ? "Nube" : "Local"}</span>
        </div>

        {/* Proyectos */}
        <button
          type="button"
          onClick={onOpenProjects}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Proyectos</span>
        </button>

        {/* Configuración */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Configuración"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
