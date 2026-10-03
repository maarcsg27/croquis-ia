"use client";
import React, { useEffect, useState } from "react";
import { FolderOpen, Plus, Trash2, Calendar, Layout, X, Loader2 } from "lucide-react";
import { listProjects, deleteProject, createProject, type ProjectSummary } from "@/lib/store";
import { ROOM_TYPES } from "@/lib/catalog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId?: string;
  onSelectProject: (id: string) => void;
  onNewProject: (id: string) => void;
};

export function ProjectsModal({ isOpen, onClose, currentProjectId, onSelectProject, onNewProject }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRoomType, setNewRoomType] = useState(ROOM_TYPES[0]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listProjects();
      setProjects(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const handleCreate = async () => {
    const id = await createProject(newName.trim() || "Nueva habitación", newRoomType);
    setCreating(false);
    setNewName("");
    onNewProject(id);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("¿Seguro que quieres eliminar este proyecto?")) {
      await deleteProject(id);
      load();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative max-w-lg w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <span>Mis Proyectos y Planos</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crear nuevo */}
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Plano / Habitación</span>
          </button>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Salón de casa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">Tipo de estancia</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
              >
                Crear Plano
              </button>
            </div>
          </div>
        )}

        {/* Lista de proyectos */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No tienes planos guardados todavía. ¡Empieza creando uno nuevo!
            </div>
          )}

          {!loading &&
            projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProject(p.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  p.id === currentProjectId
                    ? "border-indigo-500 bg-indigo-50/50 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">
                      {p.room_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString("es-ES") : "Guardado recientemente"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, p.id)}
                  title="Eliminar proyecto"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
