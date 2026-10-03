import { neon } from "@neondatabase/serverless";

/**
 * Base de datos Postgres (Neon, integrada en Vercel).
 * Las tablas se crean automáticamente la primera vez.
 */
export const hasDb = () => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
let schemaReady: Promise<void> | null = null;

export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("NO_DB");
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export async function db() {
  const q = sql();
  if (!schemaReady) {
    schemaReady = (async () => {
      await q`CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL DEFAULT 'Sin título',
        room_type TEXT NOT NULL DEFAULT 'Salón',
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS renders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        proposal_id TEXT,
        mime TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE INDEX IF NOT EXISTS renders_project_idx ON renders(project_id)`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
  return q;
}

export const noDbResponse = () =>
  Response.json(
    { error: "no_db", message: "DATABASE_URL no configurada; usando almacenamiento local." },
    { status: 503 }
  );

export const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
