"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { PlanCanvas, type Tool, type CanvasHandle } from "@/components/plan/PlanCanvas";
import { PlanSvg, type Sel } from "@/components/plan/PlanLayers";
import { Plan3DViewer } from "@/components/plan/Plan3DViewer";
import { SketchPanel } from "@/components/panels/SketchPanel";
import { MeasurePanel } from "@/components/panels/MeasurePanel";
import { FixedPanel } from "@/components/panels/FixedPanel";
import { DesignPanel } from "@/components/panels/DesignPanel";
import { ProductsPanel } from "@/components/panels/ProductsPanel";
import { ProjectsModal } from "@/components/ProjectsModal";
import { SettingsModal } from "@/components/SettingsModal";
import type { FixedKind, Project, ProjectData, Step } from "@/lib/types";
import { emptyData } from "@/lib/types";
import { loadProject, saveProject, createProject, isLocalId } from "@/lib/store";
import { ROOM_TYPES } from "@/lib/catalog";
import { useDevice } from "@/lib/useDevice";
import {
  Compass,
  Layout,
  Box,
  Columns,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

export default function Home() {
  const { device, isMobile, isTablet, isDesktop, isHydrated } = useDevice();

  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("Mi habitación");
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[0]);
  const [data, setData] = useState<ProjectData>(emptyData());
  const [step, setStep] = useState<Step>("sketch");
  const [tool, setTool] = useState<Tool>("wall");
  const [sel, setSel] = useState<Sel>(null);
  const [placeKind, setPlaceKind] = useState<FixedKind | null>(null);
  const [focusSeg, setFocusSeg] = useState<{ shapeId: string; seg: number } | null>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "split">("2d");

  // Estado responsivo para móvil y tablet
  const [mobileTab, setMobileTab] = useState<"canvas" | "panel">("canvas");
  const [mobileDrawerHeight, setMobileDrawerHeight] = useState<"collapsed" | "half" | "full">("collapsed");
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(true);

  // Modales
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<ProjectData[]>([]);
  const [future, setFuture] = useState<ProjectData[]>([]);

  const canvasRef = useRef<CanvasHandle>(null);
  const snapshotSvgRef = useRef<SVGSVGElement>(null);

  // Carga inicial o nuevo proyecto
  useEffect(() => {
    (async () => {
      const id = await createProject("Mi primer proyecto", ROOM_TYPES[0]);
      setProjectId(id);
      const p = await loadProject(id);
      if (p) {
        setProjectName(p.name);
        setRoomType(p.room_type);
        setData(p.data);
      }
    })();
  }, []);

  // Guardado automático con debounce
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!projectId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const currentProject: Project = {
        id: projectId,
        name: projectName,
        room_type: roomType,
        data: { ...data, step },
      };
      saveProject(currentProject);
    }, 1000);
  }, [projectId, projectName, roomType, data, step]);

  /* ---------------- Modificación de estado con historial ---------------- */
  const beginChange = useCallback(() => {
    setHistory((h) => [...h.slice(-25), JSON.parse(JSON.stringify(data))]);
    setFuture([]);
  }, [data]);

  const update = useCallback(
    (fn: (d: ProjectData) => ProjectData, pushHistory = true) => {
      if (pushHistory) beginChange();
      setData((prev) => fn(prev));
    },
    [beginChange]
  );

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [JSON.parse(JSON.stringify(data)), ...f]);
    setHistory((h) => h.slice(0, -1));
    setData(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, JSON.parse(JSON.stringify(data))]);
    setFuture((f) => f.slice(1));
    setData(next);
  };

  /* ---------------- Cambio de proyecto ---------------- */
  const switchProject = async (id: string) => {
    const p = await loadProject(id);
    if (p) {
      setProjectId(p.id);
      setProjectName(p.name);
      setRoomType(p.room_type);
      setData(p.data);
      setStep(p.data.step || "sketch");
      setHistory([]);
      setFuture([]);
      setTimeout(() => canvasRef.current?.fit(), 100);
    }
  };

  /* ---------------- Captura PNG del plano para renders IA ---------------- */
  const getPlanPng = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const svg = snapshotSvgRef.current;
      if (!svg) return reject(new Error("No SVG ref"));
      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 900;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No context"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
        resolve(base64);
      };
      img.onerror = reject;
      img.src = "data:image/svg+xml;base64," + svg64;
    });
  };

  const activeProposal = data.proposals.find((p) => p.id === data.activeProposalId) || data.proposals[0];
  const activeFurniture = activeProposal?.items || [];
  const hasShapes = data.shapes.length > 0;

  // Nombres y pasos amigables
  const stepTitles: Record<Step, string> = {
    sketch: "1. Croquis de la habitación",
    measure: "2. Medidas reales de paredes",
    fixed: "3. Puertas, ventanas y fijos",
    design: "4. Ideas y Distribución con IA",
    products: "5. Lista de compra y productos",
  };

  const nextStepMap: Record<Step, Step | null> = {
    sketch: "measure",
    measure: "fixed",
    fixed: "design",
    design: "products",
    products: null,
  };

  const prevStepMap: Record<Step, Step | null> = {
    sketch: null,
    measure: "sketch",
    fixed: "measure",
    design: "fixed",
    products: "design",
  };

  const handleGoNext = () => {
    const next = nextStepMap[step];
    if (next) {
      setStep(next);
      if (next === "sketch") setTool("wall");
      else setTool("select");
    }
  };

  const handleGoPrev = () => {
    const prev = prevStepMap[step];
    if (prev) {
      setStep(prev);
      if (prev === "sketch") setTool("wall");
      else setTool("select");
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 select-none text-slate-800">
      {/* Barra superior adaptativa */}
      <Header
        step={step}
        setStep={(s) => {
          setStep(s);
          if (s === "sketch") setTool("wall");
          else setTool("select");
        }}
        projectName={projectName}
        setProjectName={setProjectName}
        roomType={roomType}
        setRoomType={setRoomType}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onFit={() => canvasRef.current?.fit()}
        onZoomIn={() => canvasRef.current?.zoom(1.25)}
        onZoomOut={() => canvasRef.current?.zoom(0.8)}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        isCloudSaved={!isLocalId(projectId)}
        hasShapes={hasShapes}
      />

      {/* Área principal: Lienzo interactivo + Panel lateral */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Espacio de trabajo (2D, 3D o Dividido) */}
        <main
          className={`flex-1 relative h-full flex overflow-hidden ${
            isMobile && mobileTab === "panel" ? "hidden" : "flex"
          }`}
        >
          {/* Vista 2D */}
          <div
            className={`relative h-full transition-all duration-300 ${
              viewMode === "2d" ? "w-full" : viewMode === "split" && !isMobile ? "w-1/2 border-r border-slate-200" : "hidden"
            }`}
          >
            <PlanCanvas
              ref={canvasRef}
              data={data}
              step={step}
              tool={tool}
              setTool={setTool}
              sel={sel}
              setSel={setSel}
              update={update}
              beginChange={beginChange}
              placeKind={placeKind}
              furniture={activeFurniture}
              focusSeg={focusSeg}
              onSegmentClick={(shapeId, seg) => {
                setFocusSeg({ shapeId, seg });
                if (isMobile) setMobileDrawerHeight("half");
              }}
            />
          </div>

          {/* Vista 3D 360° interactiva */}
          <div
            className={`relative h-full transition-all duration-300 ${
              viewMode === "3d" ? "w-full" : viewMode === "split" && !isMobile ? "w-1/2" : "hidden"
            }`}
          >
            {hasShapes ? (
              <Plan3DViewer
                data={data}
                furniture={activeFurniture}
                selectedId={sel?.id}
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center text-xs space-y-2">
                <Box className="w-10 h-10 text-slate-600" />
                <p>Dibuja primero las paredes de tu habitación en el paso 1 para ver la vista 3D.</p>
              </div>
            )}
          </div>

          {/* Selector flotante de vista (2D / 3D 360° / Dividida) */}
          {hasShapes && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200/90">
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "2d"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>2D<span className="hidden xs:inline"> Plano</span></span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "3d"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>3D<span className="hidden xs:inline"> 360°</span></span>
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hidden sm:flex ${
                    viewMode === "split"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Dividida (2D+3D)</span>
                </button>
              )}
            </div>
          )}

          {/* Botón flotante para tablet para ocultar/mostrar panel lateral */}
          {isTablet && (
            <button
              type="button"
              onClick={() => setTabletSidebarOpen((o) => !o)}
              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>{tabletSidebarOpen ? "Ocultar Panel" : "Ver Opciones"}</span>
            </button>
          )}

          {/* Barra de acción flotante en móvil para interactuar con el panel */}
          {isMobile && (
            <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200/90">
              <button
                type="button"
                onClick={() => setMobileTab("panel")}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="truncate">Opciones: {stepTitles[step].split("·")[0]}</span>
              </button>

              {nextStepMap[step] && hasShapes && (
                <button
                  type="button"
                  onClick={handleGoNext}
                  title="Siguiente Paso"
                  className="p-2 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </main>

        {/* Panel lateral de herramientas y configuración */}
        {/* Desktop: Barra fija | Tablet: Barra colapsable | Mobile: Pantalla completa o Drawer */}
        <aside
          className={`bg-white shadow-xl z-20 flex flex-col h-full overflow-hidden transition-all duration-300 ${
            isMobile
              ? mobileTab === "panel"
                ? "fixed inset-0 top-14 w-full z-40"
                : "hidden"
              : isTablet
              ? tabletSidebarOpen
                ? "w-80 lg:w-96 border-l border-slate-200 relative"
                : "w-0 border-none hidden"
              : "w-80 lg:w-96 border-l border-slate-200 relative"
          }`}
        >
          {/* Cabecera del panel en móvil */}
          {isMobile && (
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="font-bold text-xs text-slate-800">{stepTitles[step]}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileTab("canvas")}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs active:bg-indigo-700"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Ver Plano / 3D</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {step === "sketch" && (
              <SketchPanel
                data={data}
                tool={tool}
                setTool={setTool}
                update={update}
                beginChange={beginChange}
                onNext={() => {
                  setStep("measure");
                  setTool("select");
                  if (isMobile) setMobileTab("canvas");
                }}
              />
            )}

            {step === "measure" && (
              <MeasurePanel
                data={data}
                update={update}
                beginChange={beginChange}
                onPrev={() => {
                  setStep("sketch");
                  setTool("wall");
                }}
                onNext={() => {
                  setStep("fixed");
                  setTool("select");
                  if (isMobile) setMobileTab("canvas");
                }}
                focusSeg={focusSeg}
                setFocusSeg={setFocusSeg}
              />
            )}

            {step === "fixed" && (
              <FixedPanel
                data={data}
                sel={sel}
                setSel={setSel}
                tool={tool}
                setTool={setTool}
                placeKind={placeKind}
                setPlaceKind={setPlaceKind}
                update={update}
                beginChange={beginChange}
                onPrev={() => setStep("measure")}
                onNext={() => {
                  setStep("design");
                  if (isMobile) setMobileTab("panel");
                }}
              />
            )}

            {step === "design" && (
              <DesignPanel
                data={data}
                roomType={roomType}
                projectId={projectId}
                update={update}
                beginChange={beginChange}
                sel={sel}
                setSel={setSel}
                onPrev={() => setStep("fixed")}
                onNext={() => setStep("products")}
                getPlanPng={getPlanPng}
              />
            )}

            {step === "products" && (
              <ProductsPanel
                data={data}
                update={update}
                onPrev={() => setStep("design")}
              />
            )}
          </div>
        </aside>
      </div>

      {/* SVG oculto fuera de pantalla para generar snapshots PNG para la IA */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0">
        <PlanSvg
          data={data}
          furniture={activeFurniture}
          width={1200}
          height={900}
          svgRef={snapshotSvgRef}
          showDims
          labels
        />
      </div>

      {/* Modales */}
      <ProjectsModal
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        currentProjectId={projectId}
        onSelectProject={switchProject}
        onNewProject={switchProject}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
