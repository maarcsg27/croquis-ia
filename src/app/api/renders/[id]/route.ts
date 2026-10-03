import { db, hasDb, isUuid } from "@/lib/db";

export const dynamic = "force-dynamic";

// Sirve una imagen de render guardada en la base de datos.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDb() || !isUuid(id)) return new Response("Not found", { status: 404 });
  const q = await db();
  const rows = (await q`SELECT mime, data FROM renders WHERE id = ${id}`) as {
    mime: string;
    data: string;
  }[];
  if (!rows.length) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(rows[0].data, "base64"), {
    headers: {
      "Content-Type": rows[0].mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
