"use client";
import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  ShoppingBag,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  Download,
  Palette,
  Lightbulb,
} from "lucide-react";
import { STYLES, SUGGESTION_CHIPS, FURNITURE_CATEGORIES } from "@/lib/catalog";
import type { FurnitureItem, ProjectData, Proposal } from "@/lib/types";
import { uid } from "@/lib/geometry";
import type { Sel } from "../plan/PlanLayers";

type Props = {
  data: ProjectData;
  roomType: string;
  projectId?: string;
  update: (fn: (d: ProjectData) => ProjectData, history?: boolean) => void;
  beginChange: () => void;
  sel: Sel;
  setSel: (s: Sel) => void;
  onPrev: () => void;
  onNext: () => void;
  getPlanPng: () => Promise<string>;
};

export function DesignPanel({
  data,
  roomType,
  projectId,
  update,
  beginChange,
  sel,
  setSel,
  onPrev,
  onNext,
  getPlanPng,
}: Props) {
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);
  const [loadingRefine, setLoadingRefine] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [renderView, setRenderView] = useState<"perspective" | "aerial">("perspective");
  const [activeTab, setActiveTab] = useState<"proposals" | "custom" | "renders">("proposals");
  const [selectedRenderUrl, setSelectedRenderUrl] = useState<string | null>(null);

  const activeProposal = data.proposals.find((p) => p.id === data.activeProposalId) || data.proposals[0];
  const selectedFurniture = sel?.type === "furn" ? activeProposal?.items.find((i) => i.id === sel.id) : null;

  const addChip = (text: string) => {
    const current = data.brief ? data.brief.trim() : "";
    if (!current.includes(text)) {
      const next = current ? `${current}, ${text.toLowerCase()}` : text;
      update((d) => ({ ...d, brief: next }));
    }
  };

  /* ---------------- Generar propuestas con IA ---------------- */
  const generateProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await fetch("/api/ai/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType,
          data,
          brief: data.brief,
          style: data.style,
          budget: data.budget,
          count: 3,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error generando propuestas");
      if (json.proposals && json.proposals.length > 0) {
        beginChange();
        update((d) => ({
          ...d,
          proposals: json.proposals,
          activeProposalId: json.proposals[0].id,
        }));
      }
    } catch (e: any) {
      alert(e.message || "Error de conexión con la IA");
    } finally {
      setLoadingProposals(false);
    }
  };

  /* ---------------- Refinar con feedback ---------------- */
  const refineProposal = async () => {
    if (!refineText.trim() || !activeProposal) return;
    setLoadingRefine(true);
    try {
      const res = await fetch("/api/ai/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType,
          data,
          brief: data.brief,
          style: data.style,
          budget: data.budget,
          mode: "refine",
          proposal: activeProposal,
          feedback: refineText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al refinar la propuesta");
      if (json.proposal) {
        beginChange();
        update((d) => ({
          ...d,
          proposals: d.proposals.map((p) => (p.id === activeProposal.id ? json.proposal : p)),
        }));
        setRefineText("");
      }
    } catch (e: any) {
      alert(e.message || "Error de conexión con la IA");
    } finally {
      setLoadingRefine(false);
    }
  };

  /* ---------------- Generar render fotorrealista ---------------- */
  const generateRender = async () => {
    if (!activeProposal) return;
    setLoadingRender(true);
    try {
      const planPng = await getPlanPng();
      const res = await fetch("/api/ai/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roomType,
          wallHeight: data.wallHeight,
          proposal: activeProposal,
          planPng,
          view: renderView,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error generando el render");
      if (json.url) {
        beginChange();
        update((d) => ({
          ...d,
          proposals: d.proposals.map((p) =>
            p.id === activeProposal.id ? { ...p, renders: [json.url, ...(p.renders || [])] } : p
          ),
        }));
        setSelectedRenderUrl(json.url);
      }
    } catch (e: any) {
      alert(e.message || "Error al crear el render");
    } finally {
      setLoadingRender(false);
    }
  };

  /* ---------------- Muebles manuales ---------------- */
  const addManualFurniture = (cat: (typeof FURNITURE_CATEGORIES)[number]) => {
    if (!activeProposal) return;
    const item: FurnitureItem = {
      id: uid(),
      name: cat === "sofa" ? "Sofá 3 plazas" : cat === "table" ? "Mesa" : cat === "bed" ? "Cama" : "Nuevo mueble",
      category: cat,
      x: 250,
      y: 200,
      w: cat === "sofa" ? 210 : cat === "bed" ? 160 : 100,
      d: cat === "sofa" ? 90 : cat === "bed" ? 200 : 80,
      rot: 0,
      color: activeProposal.palette?.[0] || "#64748b",
    };
    beginChange();
    update((d) => ({
      ...d,
      proposals: d.proposals.map((p) =>
        p.id === activeProposal.id ? { ...p, items: [...p.items, item] } : p
      ),
    }));
    setSel({ type: "furn", id: item.id });
  };

  const deleteFurniture = (id: string) => {
    if (!activeProposal) return;
    beginChange();
    update((d) => ({
      ...d,
      proposals: d.proposals.map((p) =>
        p.id === activeProposal.id ? { ...p, items: p.items.filter((i) => i.id !== id) } : p
      ),
    }));
    setSel(null);
  };

  const updateFurniture = (id: string, patch: Partial<FurnitureItem>) => {
    if (!activeProposal) return;
    beginChange();
    update((d) => ({
      ...d,
      proposals: d.proposals.map((p) =>
        p.id === activeProposal.id ? { ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : p
      ),
    }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-800">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-1">Paso 4 · Ideas y Distribución</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Indica tus preferencias y la IA generará propuestas de distribución en plano 2D y renders fotorrealistas.
        </p>
      </div>

      {/* Formulario de deseos del usuario */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
            ¿Qué quieres añadir en este espacio?
          </label>
          <textarea
            rows={3}
            value={data.brief}
            onChange={(e) => update((d) => ({ ...d, brief: e.target.value }))}
            placeholder="Ej: Sofá cómodo de 3 plazas, mesa de comedor extensible para 6, zona de TV y mueble de almacenaje..."
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Sugerencias rápidas */}
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Sugerencias habituales:</span>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => addChip(chip)}
                className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-full text-[10px] text-slate-600 transition"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Estilo y Presupuesto */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1 font-medium">Estilo decorativo</label>
            <select
              value={data.style}
              onChange={(e) => update((d) => ({ ...d, style: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1 font-medium">Presupuesto orientativo</label>
            <input
              type="text"
              placeholder="Ej: 2.500 €"
              value={data.budget}
              onChange={(e) => update((d) => ({ ...d, budget: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* Botón generar */}
        <button
          type="button"
          disabled={loadingProposals}
          onClick={generateProposals}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          {loadingProposals ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Diseñando con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{data.proposals.length ? "Regenerar Propuestas" : "Generar Propuestas con IA"}</span>
            </>
          )}
        </button>
      </div>

      {/* Propuestas devueltas */}
      {data.proposals.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Pestañas de propuestas */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {data.proposals.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update((d) => ({ ...d, activeProposalId: p.id }))}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  p.id === activeProposal?.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Idea #{idx + 1}
              </button>
            ))}
          </div>

          {/* Tarjeta de la propuesta activa */}
          {activeProposal && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 text-xs shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{activeProposal.title}</h4>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-semibold rounded-full text-[10px]">
                    {activeProposal.style}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{activeProposal.summary}</p>
              </div>

              {/* Paleta de colores */}
              {activeProposal.palette?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-400 font-semibold">Paleta:</span>
                  <div className="flex items-center gap-1">
                    {activeProposal.palette.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tips de interiorismo */}
              {activeProposal.tips?.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2 space-y-1">
                  <span className="font-semibold text-amber-900 flex items-center gap-1 text-[11px]">
                    <Lightbulb className="w-3 h-3 text-amber-600" />
                    <span>Consejos de distribución:</span>
                  </span>
                  <ul className="list-disc list-inside text-[10px] text-amber-800 space-y-0.5">
                    {activeProposal.tips.slice(0, 2).map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generar render fotorrealista */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Renders 3D fotorrealistas</span>
                  </span>
                  <select
                    value={renderView}
                    onChange={(e) => setRenderView(e.target.value as any)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
                  >
                    <option value="perspective">Perspectiva (Ojos)</option>
                    <option value="aerial">Vista Aérea 3D</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={loadingRender}
                  onClick={generateRender}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition"
                >
                  {loadingRender ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generando render fotorrealista...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Generar Render de esta Idea</span>
                    </>
                  )}
                </button>

                {/* Galería de renders generados */}
                {activeProposal.renders?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {activeProposal.renders.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedRenderUrl(url)}
                        className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-video cursor-pointer hover:shadow-md transition"
                      >
                        <img src={url} alt={`Render ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refinar con feedback */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  ¿Quieres cambiar algo de esta propuesta?
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    placeholder="Ej: Pon una mesa redonda, mueve el sofá a la derecha..."
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === "Enter" && refineProposal()}
                  />
                  <button
                    type="button"
                    disabled={loadingRefine || !refineText.trim()}
                    onClick={refineProposal}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    {loadingRefine ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Mueble seleccionado en el plano */}
              {selectedFurniture && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{selectedFurniture.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteFurniture(selectedFurniture.id)}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Ancho</span>
                      <input
                        type="number"
                        value={selectedFurniture.w}
                        onChange={(e) => updateFurniture(selectedFurniture.id, { w: Number(e.target.value) || 50 })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fondo</span>
                      <input
                        type="number"
                        value={selectedFurniture.d}
                        onChange={(e) => updateFurniture(selectedFurniture.id, { d: Number(e.target.value) || 50 })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFurniture(selectedFurniture.id, { rot: (selectedFurniture.rot + 90) % 360 })}
                    className="w-full py-1 bg-white border border-slate-200 rounded text-slate-700 font-semibold flex items-center justify-center gap-1"
                  >
                    <RotateCw className="w-3 h-3 text-indigo-600" />
                    <span>Girar 90° ({selectedFurniture.rot}°)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Render en grande */}
      {selectedRenderUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedRenderUrl(null)}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={selectedRenderUrl} alt="Render IA" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
            <div className="flex items-center justify-between p-3 text-white">
              <span className="text-xs text-slate-300">Render fotorrealista generado con Gemini</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedRenderUrl}
                  download="render-interiorismo.jpg"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedRenderUrl(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          disabled={!activeProposal}
          onClick={() => {
            update((d) => ({ ...d, chosenProposalId: activeProposal?.id }));
            onNext();
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Elegir y Buscar Productos</span>
        </button>
      </div>
    </div>
  );
}
