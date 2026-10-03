import { FURNITURE_CATEGORIES } from "@/lib/catalog";
import { aiError, generateJson, hasAi, noAiResponse } from "@/lib/gemini";
import { uid } from "@/lib/geometry";
import { describeRoom, sanitizeItems } from "@/lib/room";
import type { FurnitureItem, ProjectData, Proposal } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const itemSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Nombre del mueble/objeto en español" },
    category: { type: "string", enum: FURNITURE_CATEGORIES },
    x: { type: "number", description: "Centro X en cm" },
    y: { type: "number", description: "Centro Y en cm" },
    width: { type: "number", description: "Ancho en cm (lado frontal)" },
    depth: { type: "number", description: "Fondo en cm" },
    rotation: { type: "number", description: "0, 90, 180 o 270" },
    color: { type: "string", description: "Color principal en hex #RRGGBB" },
    material: { type: "string" },
    notes: { type: "string" },
  },
  required: ["name", "category", "x", "y", "width", "depth", "rotation", "color"],
};

const proposalSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string", description: "2-4 frases explicando la distribución" },
    style: { type: "string" },
    palette: { type: "array", items: { type: "string" }, description: "3-5 colores hex" },
    estimated_budget_eur: { type: "number" },
    items: { type: "array", items: itemSchema },
    tips: { type: "array", items: { type: "string" } },
  },
  required: ["title", "summary", "style", "palette", "items", "tips"],
};

const SYSTEM = `Eres un interiorista profesional y experto en distribución de espacios.
Trabajas sobre un plano en planta con coordenadas en centímetros (X hacia la derecha, Y hacia abajo).
Reglas de colocación OBLIGATORIAS:
- Todos los muebles deben quedar completamente DENTRO del contorno (outline_polygon) y sin solaparse entre sí ni con los elementos fijos.
- "rotation" indica hacia dónde mira el FRENTE del mueble: 0 = la parte trasera (respaldo, cabecero) queda arriba (norte, -Y) y el frente mira hacia +Y; 90 = trasera a la derecha (este)... sigue en sentido horario. Un sofá pegado a la pared superior tiene rotation 0; pegado a la pared izquierda, rotation 270.
- "width" es la medida del lado frontal y "depth" el fondo, en cm, con medidas reales de mercado.
- Respeta el barrido de las puertas (deja libre un cuadrado de su ancho delante), no tapes ventanas con muebles altos, no tapes radiadores, chimeneas ni armarios.
- Deja pasos de 70-90 cm. Coloca la TV frente al sofá y evita reflejos de ventanas cuando sea posible.
- Usa los enchufes y tomas de TV existentes como referencia para electrónica.
- Incluye TODOS los elementos que pide el usuario y puedes añadir complementos (alfombra, lámparas, plantas) si encajan.
Responde siempre en español.`;

export async function POST(req: Request) {
  if (!hasAi()) return noAiResponse();
  try {
    const body = (await req.json()) as {
      roomType: string;
      data: ProjectData;
      brief: string;
      style: string;
      budget?: string;
      mode?: "new" | "refine";
      proposal?: Proposal;
      feedback?: string;
      count?: number;
    };
    const room = describeRoom(body.data, body.roomType);
    const base = `ESTANCIA:\n${JSON.stringify(room)}\n\nLO QUE QUIERE EL USUARIO:\n${body.brief || "(sin especificar, propone lo típico para este tipo de estancia)"}\nEstilo preferido: ${body.style}\nPresupuesto: ${body.budget || "no indicado"}`;

    type RawProposal = {
      title: string;
      summary: string;
      style: string;
      palette: string[];
      estimated_budget_eur?: number;
      items: { name: string; category: string; x: number; y: number; width: number; depth: number; rotation: number; color: string; material?: string; notes?: string }[];
      tips: string[];
    };

    const toProposal = (p: RawProposal, prev?: Proposal): Proposal => {
      const items: FurnitureItem[] = (p.items || []).map((it) => ({
        id: uid(),
        name: it.name,
        category: (FURNITURE_CATEGORIES as string[]).includes(it.category)
          ? (it.category as FurnitureItem["category"])
          : "other",
        x: Number(it.x) || 0,
        y: Number(it.y) || 0,
        w: Math.max(5, Number(it.width) || 50),
        d: Math.max(5, Number(it.depth) || 50),
        rot: Math.round((Number(it.rotation) || 0) / 90) * 90,
        color: it.color,
        material: it.material,
        notes: it.notes,
      }));
      return {
        id: prev?.id || uid(),
        title: p.title,
        summary: p.summary,
        style: p.style,
        palette: p.palette || [],
        estimatedBudget: p.estimated_budget_eur,
        items: sanitizeItems(items, body.data),
        tips: p.tips || [],
        renders: [],
        feedbackHistory: prev ? [...(prev.feedbackHistory || []), body.feedback || ""] : [],
      };
    };

    if (body.mode === "refine" && body.proposal) {
      const current = {
        title: body.proposal.title,
        summary: body.proposal.summary,
        style: body.proposal.style,
        palette: body.proposal.palette,
        items: body.proposal.items.map((i) => ({
          name: i.name, category: i.category, x: Math.round(i.x), y: Math.round(i.y),
          width: i.w, depth: i.d, rotation: i.rot, color: i.color, material: i.material,
        })),
      };
      const p = await generateJson<RawProposal>({
        system: SYSTEM,
        input: `${base}\n\nPROPUESTA ACTUAL (puede incluir ajustes manuales del usuario, respétalos salvo que pida lo contrario):\n${JSON.stringify(current)}\n\nCAMBIOS QUE PIDE EL USUARIO:\n${body.feedback}\n\nDevuelve la propuesta revisada completa aplicando los cambios.`,
        schema: proposalSchema,
      });
      return Response.json({ proposal: toProposal(p, body.proposal) });
    }

    const count = Math.min(4, Math.max(1, body.count || 3));
    const res = await generateJson<{ proposals: RawProposal[] }>({
      system: SYSTEM,
      input: `${base}\n\nGenera ${count} propuestas de distribución CLARAMENTE DIFERENTES entre sí (distinta organización del espacio y matices de estilo).`,
      schema: {
        type: "object",
        properties: { proposals: { type: "array", items: proposalSchema } },
        required: ["proposals"],
      },
    });
    return Response.json({ proposals: (res.proposals || []).map((p) => toProposal(p)) });
  } catch (e) {
    return aiError(e);
  }
}
