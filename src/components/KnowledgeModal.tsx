"use client";
import React, { useState } from "react";
import {
  BookOpen,
  X,
  Zap,
  Maximize2,
  Compass,
  Palette,
  CheckCircle2,
  Leaf,
  Sun,
  ShieldCheck,
  Search,
  ChevronRight,
} from "lucide-react";
import {
  INTERIOR_DESIGN_LIBRARY,
  ENERGY_EFFICIENCY_LIBRARY,
  SPACE_OPTIMIZATION_LIBRARY,
  STYLES_ENCYCLOPEDIA,
} from "@/lib/knowledge";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeStyle?: string;
};

export function KnowledgeModal({ isOpen, onClose, activeStyle = "Nórdico" }: Props) {
  const [tab, setTab] = useState<"styles" | "interior" | "energy" | "space">("styles");
  const [selectedStyleKey, setSelectedStyleKey] = useState<string>(activeStyle);
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const currentStyle =
    STYLES_ENCYCLOPEDIA[selectedStyleKey] ||
    STYLES_ENCYCLOPEDIA["Nórdico"];

  const filteredInterior = INTERIOR_DESIGN_LIBRARY.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEnergy = ENERGY_EFFICIENCY_LIBRARY.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSpace = SPACE_OPTIMIZATION_LIBRARY.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Biblioteca de Interiorismo, Eficiencia y Espacios
              </h2>
              <p className="text-[11px] text-slate-500">
                Memoria de inteligencia arquitectónica y bioclimática integrada con Google Gemini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex items-center justify-between gap-2 px-6 pt-3 pb-2 border-b border-slate-100 bg-white overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab("styles")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === "styles"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Enciclopedia de Estilos</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("space")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === "space"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Optimización de Espacios ({SPACE_OPTIMIZATION_LIBRARY.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("energy")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === "energy"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Eficiencia Energética ({ENERGY_EFFICIENCY_LIBRARY.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("interior")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === "interior"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Ergonomía Neufert ({INTERIOR_DESIGN_LIBRARY.length})</span>
            </button>
          </div>

          {/* Buscador */}
          {tab !== "styles" && (
            <div className="relative min-w-[160px] hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar regla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-slate-100 rounded-lg text-xs border border-transparent focus:bg-white focus:border-indigo-400 outline-none"
              />
            </div>
          )}
        </div>

        {/* Contenido principal scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
          {/* TAB 1: ENCICLOPEDIA DE ESTILOS */}
          {tab === "styles" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lista lateral de estilos */}
              <div className="space-y-1.5 md:border-r md:pr-4 border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Estilos de Interiorismo
                </span>
                {Object.keys(STYLES_ENCYCLOPEDIA).map((key) => {
                  const s = STYLES_ENCYCLOPEDIA[key];
                  const isSel = selectedStyleKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedStyleKey(key)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        isSel
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{s.styleName}</span>
                      <div className="flex items-center gap-1">
                        {s.palette.hexCodes.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ficha detallada del estilo */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{currentStyle.styleName}</h3>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        También conocido como: {currentStyle.aliases.join(", ")}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{currentStyle.philosophy}</p>

                  {/* Paleta canónica */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Paleta Canónica (Regla 60-30-10)
                    </span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {currentStyle.palette.hexCodes.map((hex, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          <div
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[10px] font-mono text-slate-600">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materiales canónicos */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Maderas:</span>
                      <p className="text-[11px] text-slate-800">{currentStyle.materials.woods.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Textiles:</span>
                      <p className="text-[11px] text-slate-800">{currentStyle.materials.textiles.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Metales:</span>
                      <p className="text-[11px] text-slate-800">{currentStyle.materials.metals.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Minerales/Piedra:</span>
                      <p className="text-[11px] text-slate-800">{currentStyle.materials.minerals.join(", ")}</p>
                    </div>
                  </div>

                  {/* Geometría e iluminación */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">Geometría de Mobiliario:</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{currentStyle.furnitureGeometry}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">Estrategia Lumínica:</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{currentStyle.lightingStrategy}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIMIZACIÓN DE ESPACIOS */}
          {tab === "space" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSpace.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-indigo-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{rule.title}</span>
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full shrink-0">
                      {rule.spatialGainMetric}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{rule.rule}</p>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-[10px] text-indigo-900">
                    <span className="font-bold block">Aplicación práctica:</span>
                    {rule.tacticalImplementation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: EFICIENCIA ENERGÉTICA */}
          {tab === "energy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredEnergy.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-amber-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{rule.title}</span>
                    </h4>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full shrink-0">
                      {rule.energySavingPotential}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{rule.rule}</p>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-[10px] text-amber-950">
                    <span className="font-bold block text-amber-800">Confort bioclimático:</span>
                    {rule.practicalApplication}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ERGONOMÍA NEUFERT */}
          {tab === "interior" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredInterior.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-indigo-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{rule.title}</span>
                    </h4>
                    {rule.metrics.recommended_ideal_cm && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full shrink-0">
                        {rule.metrics.recommended_ideal_cm} cm ideal
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{rule.rule}</p>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-[10px] text-slate-700">
                    <span className="font-bold block text-indigo-600">Fundamento ergonómico:</span>
                    {rule.rationale}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Biblioteca sincronizada y consultada por Google Gemini en cada propuesta</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
