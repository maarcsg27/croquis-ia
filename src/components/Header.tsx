"use client";
import React, { useState } from "react";
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
  ChevronDown,
  Smartphone,
  Tablet,
  Laptop,
  Check,
} from "lucide-react";
import type { Step } from "@/lib/types";
import { ROOM_TYPES } from "@/lib/catalog";
import { useDevice } from "@/lib/useDevice";

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

const STEPS: { key: Step; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "sketch", label: "1. Croquis", shortLabel: "1. Croquis", icon: PenTool },
  { key: "measure", label: "2. Medidas", shortLabel: "2. Medidas", icon: Ruler },
  { key: "fixed", label: "3. Fijos y Obra", shortLabel: "3. Fijos", icon: Boxes },
  { key: "design", label: "4. Distribución IA", shortLabel: "4. Diseño IA", icon: Sparkles },
  { key: "products", label: "5. Productos", shortLabel: "5. Compras", icon: ShoppingBag },
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
  const { device, isMobile, isTablet, isDesktop } = useDevice();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentStepObj = STEPS.find((s) => s.key === step) || STEPS[0];
  const StepIcon = currentStepObj.icon;

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none z-30 shrink-0">
      {/* Izquierda: Logo y nombre de proyecto */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm sm:text-base shadow-sm">
            📐
          </div>
          <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight hidden xs:inline">
            ROOM<span className="text-indigo-600">IA</span>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden md:block" />

        {/* Nombre y tipo de estancia */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="font-bold text-xs sm:text-sm text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white px-1.5 sm:px-2 py-1 rounded-lg border border-transparent focus:border-slate-300 transition focus:outline-none max-w-[90px] xs:max-w-[120px] sm:max-w-[160px] truncate"
            placeholder="Habitación"
            title={projectName}
          />

          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden lg:block"
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Centro: Wizard de pasos adaptativo */}
      {/* Versión Desktop / Tablet amplia */}
      <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl gap-0.5 max-w-xl">
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
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-indigo-600 shadow-xs"
                  : isAccessible
                  ? "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  : "text-slate-400 opacity-40 cursor-not-allowed"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{s.label}</span>
              <span className="xl:hidden">{s.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Versión Mobile: Selector desplegable de pasos compacto */}
      <div className="md:hidden relative">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs active:bg-indigo-100 transition"
        >
          <StepIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="max-w-[85px] xs:max-w-[110px] truncate">{currentStepObj.shortLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pasos del Diseño
              </div>
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.key;
                const isAccessible = idx === 0 || hasShapes;

                return (
                  <button
                    key={s.key}
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => {
                      setStep(s.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : isAccessible
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{s.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Derecha: Deshacer, Zoom, Guardado y Ajustes */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Deshacer / Rehacer */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Deshacer"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rehacer"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom (Tablet / Desktop) */}
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={onZoomOut}
            title="Alejar"
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
            title="Acercar"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicador de dispositivo detectado */}
        <div
          title={`Dispositivo detectado automáticamente: ${
            isMobile ? "Móvil / Smartphone" : isTablet ? "Tablet / iPad" : "Ordenador / Portátil"
          }`}
          className="hidden xl:flex items-center gap-1 text-[11px] font-semibold text-slate-500 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
        >
          {isMobile ? (
            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
          ) : isTablet ? (
            <Tablet className="w-3.5 h-3.5 text-indigo-500" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span className="capitalize">{device}</span>
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
          title="Mis Proyectos"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Proyectos</span>
        </button>

        {/* Configuración */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Configuración"
          className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
