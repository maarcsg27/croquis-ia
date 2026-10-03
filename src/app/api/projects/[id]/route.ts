import { db, hasDb, isUuid, noDbResponse } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!hasDb()) return noDbResponse();
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not_found" }, { status: 404 });
  const q = await db();
  const rows = (await q`SELECT * FROM projects WHERE id = ${id}`) as Record<string, unknown>[];
  if (!rows.length) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ project: rows[0] });
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!hasDb()) return noDbResponse();
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not_found" }, { status: 404 });
  const body = await req.json();
  const q = await db();
  const rows = (await q`
    UPDATE projects SET
      name = COALESCE(${body.name ?? null}, name),
      room_type = COALESCE(${body.room_type ?? null}, room_type),
      data = COALESCE(${body.data ? JSON.stringify(body.data) : null}::jsonb, data),
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, updated_at`) as Record<string, unknown>[];
  if (!rows.length) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true, updated_at: rows[0].updated_at });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!hasDb()) return noDbResponse();
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ ok: true });
  const q = await db();
  await q`DELETE FROM projects WHERE id = ${id}`;
  return Response.json({ ok: true });
}
