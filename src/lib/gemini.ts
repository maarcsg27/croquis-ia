import { GoogleGenAI } from "@google/genai";

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

export const hasAi = () => Boolean(process.env.GEMINI_API_KEY);

let _ai: GoogleGenAI | null = null;
export function ai() {
  if (!process.env.GEMINI_API_KEY) throw new Error("NO_AI");
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

export const noAiResponse = () =>
  Response.json(
    {
      error: "no_ai",
      message:
        "Falta la variable GEMINI_API_KEY. Añádela en Vercel (Settings → Environment Variables) o en .env.local.",
    },
    { status: 503 }
  );

/* eslint-disable @typescript-eslint/no-explicit-any */
type Interaction = {
  output_text?: string;
  output_image?: { data?: string; mime_type?: string };
  steps?: any[];
};

function textOf(it: Interaction): string {
  if (it.output_text) return it.output_text;
  const parts: string[] = [];
  for (const s of it.steps || [])
    if (s.type === "model_output") for (const c of s.content || []) if (c.type === "text") parts.push(c.text);
  return parts.join("");
}

/** Extrae JSON aunque venga envuelto en ```json ... ``` o con texto alrededor. */
export function parseJsonLoose<T>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) return JSON.parse(fence[1]);
    const start = text.search(/[[{]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("La IA no devolvió JSON válido");
  }
}

export async function generateJson<T>(opts: {
  system: string;
  input: string | any[];
  schema: Record<string, unknown>;
  tools?: any[];
  model?: string;
}): Promise<T> {
  const req: any = {
    model: opts.model || TEXT_MODEL,
    system_instruction: opts.system,
    input: opts.input,
    response_format: { type: "text", mime_type: "application/json", schema: opts.schema },
  };
  if (opts.tools) req.tools = opts.tools;
  const it = (await ai().interactions.create(req)) as Interaction;
  return parseJsonLoose<T>(textOf(it));
}

export async function generateImage(opts: {
  prompt: string;
  images?: { data: string; mime_type: string }[];
  aspect_ratio?: string;
}): Promise<{ data: string; mime_type: string }> {
  const input: any[] = [{ type: "text", text: opts.prompt }];
  for (const im of opts.images || []) input.push({ type: "image", data: im.data, mime_type: im.mime_type });
  const req: any = {
    model: IMAGE_MODEL,
    input,
    response_modalities: ["image"],
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: opts.aspect_ratio || "16:9",
      image_size: "1K",
    },
  };
  const it = (await ai().interactions.create(req)) as Interaction;
  let img = it.output_image;
  if (!img?.data)
    for (const s of it.steps || [])
      if (s.type === "model_output") for (const c of s.content || []) if (c.type === "image" && c.data) img = c;
  if (!img?.data) throw new Error("La IA no devolvió ninguna imagen: " + textOf(it).slice(0, 200));
  return { data: img.data, mime_type: img.mime_type || "image/jpeg" };
}

export function aiError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[AI]", e);
  return Response.json({ error: "ai_error", message: msg }, { status: 500 });
}
