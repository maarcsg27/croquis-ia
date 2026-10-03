"use client";
import { emptyData, type Project, type ProjectData } from "./types";

/**
 * Capa de almacenamiento del cliente.
 * Usa la base de datos (API) y, si no está configurada, cae a localStorage.
 */
const IDS_KEY = "roomia:ids";
const LOCAL_KEY = (id: string) => `roomia:project:${id}`;

export const isLocalId = (id: string) => id.startsWith("local-");

export function myIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(IDS_KEY) || "[]");
  } catch {
    return [];
  }
}
function setIds(ids: string[]) {
  localStorage.setItem(IDS_KEY, JSON.stringify([...new Set(ids)]));
}

export type ProjectSummary = {
  id: string;
  name: string;
  room_type: string;
  updated_at?: string;
  step?: string;
  shapes?: ProjectData["shapes"];
};

export async function listProjects(): Promise<ProjectSummary[]> {
  const ids = myIds();
  const local: ProjectSummary[] = ids
    .filter(isLocalId)
    .map((id) => {
      try {
        const p = JSON.parse(localStorage.getItem(LOCAL_KEY(id)) || "null") as Project | null;
        return p && { id, name: p.name, room_type: p.room_type, updated_at: p.updated_at, step: p.data.step, shapes: p.data.shapes };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ProjectSummary[];
  const remoteIds = ids.filter((i) => !isLocalId(i));
  let remote: ProjectSummary[] = [];
  if (remoteIds.length) {
    try {
      const r = await fetch(`/api/projects?ids=${remoteIds.join(",")}`);
      if (r.ok) remote = (await r.json()).projects;
    } catch {}
  }
  return [...remote, ...local].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
}

export async function createProject(name: string, room_type: string): Promise<string> {
  const data = emptyData();
  try {
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, room_type, data }),
    });
    if (r.ok) {
      const { project } = await r.json();
      setIds([project.id, ...myIds()]);
      return project.id;
    }
  } catch {}
  const id = "local-" + crypto.randomUUID();
  const p: Project = { id, name, room_type, data, updated_at: new Date().toISOString() };
  localStorage.setItem(LOCAL_KEY(id), JSON.stringify(p));
  setIds([id, ...myIds()]);
  return id;
}

export async function loadProject(id: string): Promise<Project | null> {
  if (isLocalId(id)) {
    const raw = localStorage.getItem(LOCAL_KEY(id));
    return raw ? (JSON.parse(raw) as Project) : null;
  }
  const r = await fetch(`/api/projects/${id}`);
  if (!r.ok) return null;
  const { project } = await r.json();
  if (!myIds().includes(id)) setIds([id, ...myIds()]);
  return { ...project, data: { ...emptyData(), ...project.data } };
}

export async function saveProject(p: Project): Promise<boolean> {
  if (isLocalId(p.id)) {
    try {
      localStorage.setItem(LOCAL_KEY(p.id), JSON.stringify({ ...p, updated_at: new Date().toISOString() }));
      return true;
    } catch {
      return false;
    }
  }
  const r = await fetch(`/api/projects/${p.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: p.name, room_type: p.room_type, data: p.data }),
  });
  return r.ok;
}

export async function deleteProject(id: string) {
  setIds(myIds().filter((x) => x !== id));
  if (isLocalId(id)) localStorage.removeItem(LOCAL_KEY(id));
  else await fetch(`/api/projects/${id}`, { method: "DELETE" }).catch(() => {});
}
