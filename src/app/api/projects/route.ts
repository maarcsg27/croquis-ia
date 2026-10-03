import { db, hasDb, isUuid, noDbResponse } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/projects?ids=a,b,c  -> lista resumida de los proyectos del usuario
export async function GET(req: Request) {
  if (!hasDb()) return noDbResponse();
  const ids = (new URL(req.url).searchParams.get("ids") || "")
    .split(",")
    .filter(isUuid)
    .slice(0, 100);
  if (!ids.length) return Response.json({ projects: [] });
  const q = await db();
  const rows = await q`
    SELECT id, name, room_type, created_at, updated_at,
           data->'shapes' AS shapes, data->>'step' AS step
    FROM projects WHERE id = ANY(${ids}::uuid[]) ORDER BY updated_at DESC`;
  return Response.json({ projects: rows });
}

// POST /api/projects  -> crea un proyecto
export async function POST(req: Request) {
  if (!hasDb()) return noDbResponse();
  const body = await req.json().catch(() => ({}));
  const q = await db();
  const rows = (await q`
    INSERT INTO projects (name, room_type, data)
    VALUES (${String(body.name || "Sin título").slice(0, 120)},
            ${String(body.room_type || "Salón").slice(0, 60)},
            ${JSON.stringify(body.data || {})}::jsonb)
    RETURNING *`) as Record<string, unknown>[];
  return Response.json({ project: rows[0] });
}
