"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { PlanCanvas, type Tool, type CanvasHandle } from "@/components/plan/PlanCanvas";
import { PlanSvg, type Sel } from "@/components/plan/PlanLayers";
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

export default function Home() {
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("Mi habitación");
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[0]);
  const [data, setData] = useState<ProjectData>(emptyData());
  const [step, setStep] = useState<Step>("sketch");
  const [tool, setTool] = useState<Tool>("wall");
  const [sel, setSel] = useState<Sel>(null);
  const [placeKind, setPlaceKind] = useState<FixedKind | null>(null);
  const [focusSeg, setFocusSeg] = useState<{ shapeId: string; seg: number } | null>(null);

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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 select-none">
      {/* Barra superior */}
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
        hasShapes={data.shapes.length > 0}
      />

      {/* Área principal: Lienzo interactivo + Panel lateral */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Lienzo SVG interactivo */}
        <main className="flex-1 relative h-full">
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
            }}
          />
        </main>

        {/* Panel lateral derecho del paso activo */}
        <aside className="w-80 sm:w-96 border-l border-slate-200 bg-white shadow-xl z-10 flex flex-col h-full overflow-hidden">
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
                onNext={() => setStep("design")}
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
