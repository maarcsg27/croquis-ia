import { hasDb } from "@/lib/db";
import { hasAi } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ db: hasDb(), ai: hasAi() });
}
