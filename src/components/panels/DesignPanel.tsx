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
  ListFilter,
  Check,
  LayoutGrid,
  Info,
  Maximize2,
  Leaf,
  Zap,
  BookOpen,
  Compass,
} from "lucide-react";
import { STYLES, SUGGESTION_CHIPS, FURNITURE_CATEGORIES } from "@/lib/catalog";
import type { FurnitureItem, ProjectData, Proposal } from "@/lib/types";
import { uid } from "@/lib/geometry";
import type { Sel } from "../plan/PlanLayers";
import { KnowledgeModal } from "../KnowledgeModal";

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
  const [proposalCount, setProposalCount] = useState<number>(3);
  const [selectedRenderUrl, setSelectedRenderUrl] = useState<string | null>(null);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);

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
          count: proposalCount,
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
          Diseño de interiores profesional: define tus necesidades, estilo y presupuesto para recibir propuestas de distribución y renders 3D.
        </p>
      </div>

      {/* Botón de acceso a la Base de Conocimiento */}
      <button
        type="button"
        onClick={() => setKnowledgeOpen(true)}
        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-indigo-50/90 via-violet-50/80 to-emerald-50/70 hover:from-indigo-100 hover:to-emerald-100 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 font-bold transition shadow-2xs group"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 group-hover:scale-110 transition" />
          <span>Base de Conocimiento de Interiorismo & Eficiencia</span>
        </div>
        <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 font-bold shadow-2xs">
          Ver Guía
        </span>
      </button>

      {/* Formulario de configuración del diseño */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3 text-xs">
        {/* Deseos del usuario */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1">
            ¿Qué elementos quieres añadir en esta habitación?
          </label>
          <textarea
            rows={3}
            value={data.brief}
            onChange={(e) => update((d) => ({ ...d, brief: e.target.value }))}
            placeholder="Ej: Sofá rinconero cómodo de 3 plazas, mesa de comedor para 6 personas, mueble TV con almacenaje y zona de lectura iluminada..."
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Sugerencias rápidas */}
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Elementos habituales:</span>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => addChip(chip)}
                className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-full text-[10px] text-slate-600 transition shadow-2xs"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Estilo y Presupuesto */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
          <div>
            <label className="text-[11px] text-slate-600 block mb-1 font-bold">Estilo decorativo</label>
            <select
              value={data.style}
              onChange={(e) => update((d) => ({ ...d, style: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 block mb-1 font-bold">Presupuesto orientativo</label>
            <input
              type="text"
              placeholder="Ej: 2.500 €"
              value={data.budget}
              onChange={(e) => update((d) => ({ ...d, budget: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs"
            />
          </div>
        </div>

        {/* Selector de cantidad de propuestas (de 1 a 10) */}
        <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>Número de propuestas a generar (1 a 10):</span>
            </label>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-extrabold rounded-md text-xs">
              {proposalCount} {proposalCount === 1 ? "idea" : "ideas"}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setProposalCount(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 ${
                  proposalCount === n
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Botón generar */}
        <button
          type="button"
          disabled={loadingProposals}
          onClick={generateProposals}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          {loadingProposals ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Diseñando {proposalCount} propuestas con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {data.proposals.length > 0
                  ? `Regenerar ${proposalCount} Propuestas con IA`
                  : `Generar ${proposalCount} Propuestas de Diseño`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Propuestas devueltas */}
      {data.proposals.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Barra de pestañas con scroll horizontal para todas las propuestas */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {data.proposals.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update((d) => ({ ...d, activeProposalId: p.id }))}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  p.id === activeProposal?.id
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Idea #{idx + 1}
              </button>
            ))}
          </div>

          {/* Tarjeta de la propuesta activa */}
          {activeProposal && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5 text-xs shadow-sm">
              {/* Cabecera y resumen */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{activeProposal.title}</h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-full text-[10px]">
                      {activeProposal.style}
                    </span>
                    {activeProposal.sustainabilityScore && (
                      <span
                        title="Puntuación de sostenibilidad basada en materiales naturales y diseño bioclimático"
                        className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] flex items-center gap-1"
                      >
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        <span>{activeProposal.sustainabilityScore}/10</span>
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">{activeProposal.summary}</p>
              </div>

              {/* Optimización del Espacio (Ergonomía Neufert & Circulaciones) */}
              {activeProposal.spaceOptimizationRationale && (
                <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-2.5 space-y-1">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                    <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Optimización del Espacio y Circulaciones:</span>
                  </span>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    {activeProposal.spaceOptimizationRationale}
                  </p>
                </div>
              )}

              {/* Eficiencia Energética y Confort Bioclimático */}
              {activeProposal.energyEfficiencyTips && activeProposal.energyEfficiencyTips.length > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 space-y-1">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Eficiencia Energética y Ahorro Térmico:</span>
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-emerald-900 space-y-0.5 leading-relaxed">
                    {activeProposal.energyEfficiencyTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Paleta de colores */}
              {activeProposal.palette?.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Palette className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-bold">Paleta de estilo:</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {activeProposal.palette.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs cursor-pointer hover:scale-110 transition"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tips de interiorismo y zonificación */}
              {activeProposal.tips?.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 space-y-1.5">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Claves de distribución del interiorista:</span>
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-1 leading-relaxed">
                    {activeProposal.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Renders 3D fotorrealistas */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Visualización / Render 3D</span>
                  </span>
                  <select
                    value={renderView}
                    onChange={(e) => setRenderView(e.target.value as any)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="perspective">Perspectiva Humana</option>
                    <option value="aerial">Vista Aérea Isométrica</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={loadingRender}
                  onClick={generateRender}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition shadow-2xs"
                >
                  {loadingRender ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Generando render fotorrealista con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-600" />
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
                        className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video cursor-pointer hover:shadow-md transition bg-slate-900"
                      >
                        <img src={url} alt={`Render ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition text-white">
                          <Eye className="w-4 h-4" />
                          <span className="text-[10px] font-bold">Ver Ampliado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LEYENDA Y LISTA DE ELEMENTOS DISTRIBUIDOS */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-indigo-600" />
                    <span>Elementos y Mobiliario del Plano ({activeProposal.items.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Haz clic para seleccionar</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeProposal.items.map((item) => {
                    const isSelected = sel?.type === "furn" && sel.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSel({ type: "furn", id: item.id })}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/60 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border border-black/10"
                            style={{ backgroundColor: item.color || "#64748b" }}
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-500 block">
                              {Math.round(item.w)} × {Math.round(item.d)} cm {item.material ? `· ${item.material}` : ""}
                            </span>
                            {item.notes && <span className="text-[10px] text-indigo-600 italic block">{item.notes}</span>}
                          </div>
                        </div>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFurniture(item.id);
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refinar con feedback */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  ¿Quieres sugerir cambios o adaptar esta propuesta?
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    placeholder="Ej: Mueve el sofá hacia la izquierda, pon una mesa redonda de roble..."
                    className="flex-1 px-2.5 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                    onKeyDown={(e) => e.key === "Enter" && refineProposal()}
                  />
                  <button
                    type="button"
                    disabled={loadingRefine || !refineText.trim()}
                    onClick={refineProposal}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
                  >
                    {loadingRefine ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Mueble seleccionado en el plano */}
              {selectedFurniture && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-xs">
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
                      <span className="text-[10px] text-slate-400 block font-medium">Ancho (cm)</span>
                      <input
                        type="number"
                        value={selectedFurniture.w}
                        onChange={(e) => updateFurniture(selectedFurniture.id, { w: Number(e.target.value) || 50 })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Fondo (cm)</span>
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
                    className="w-full py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold flex items-center justify-center gap-1 hover:bg-slate-100 transition"
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

      {/* Modal de Render en alta resolución */}
      {selectedRenderUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedRenderUrl(null)}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={selectedRenderUrl} alt="Render IA" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
            <div className="flex items-center justify-between p-3 text-white">
              <span className="text-xs text-slate-300">Render de interiorismo fotorrealista generado con Gemini</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedRenderUrl}
                  download="render-interiorismo-roomia.jpg"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Render</span>
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

      {/* Modal de Base de Conocimiento de Interiorismo y Sostenibilidad */}
      <KnowledgeModal
        isOpen={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
        activeStyle={data.style}
      />
    </div>
  );
}
