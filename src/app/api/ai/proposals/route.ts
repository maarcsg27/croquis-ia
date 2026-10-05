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
    name: { type: "string", description: "Nombre específico y descriptivo del mueble/objeto en español (ej: Sofá rinconero 3 plazas, Mesa comedor roble para 6, etc.)" },
    category: { type: "string", enum: FURNITURE_CATEGORIES },
    x: { type: "number", description: "Posición centro X en cm en el plano" },
    y: { type: "number", description: "Posición centro Y en cm en el plano" },
    width: { type: "number", description: "Ancho frontal en cm (medidas reales estándar de mercado)" },
    depth: { type: "number", description: "Fondo en cm" },
    rotation: { type: "number", description: "Ángulo de orientación: 0 (frente mira hacia abajo +Y), 90 (mira hacia izquierda -X), 180 (mira hacia arriba -Y), 270 (mira hacia derecha +X)" },
    color: { type: "string", description: "Color representativo en formato hex #RRGGBB acorde a la paleta del estilo" },
    material: { type: "string", description: "Material y acabado realista (ej: Roble macizo aceitado, Lino natural beige, Metal negro mate, Cuero cognac)" },
    notes: { type: "string", description: "Función o motivo de su ubicación en la distribución" },
  },
  required: ["name", "category", "x", "y", "width", "depth", "rotation", "color"],
};

const proposalSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Título inspirador y profesional de la propuesta (ej: 'Concepto Abierto Japandi & Luz Natural', 'Salón Nórdico con Zona de Lectura', etc.)" },
    summary: { type: "string", description: "Explicación detallada de la distribución espacial, zonificación, optimización de circulaciones y armonía decorativa (3-5 frases estructuradas)." },
    style: { type: "string" },
    palette: { type: "array", items: { type: "string" }, description: "4-5 códigos de color hex armónicos con el estilo elegido" },
    estimated_budget_eur: { type: "number", description: "Estimación económica aproximada de la propuesta" },
    items: { type: "array", items: itemSchema },
    tips: { type: "array", items: { type: "string" }, description: "3-4 consejos clave de interiorista profesional para maximizar el confort y la estética de esta distribución" },
  },
  required: ["title", "summary", "style", "palette", "items", "tips"],
};

const SYSTEM = `Eres un ARQUITECTO DE INTERIORES y DISEÑADOR DE ESPACIOS de élite.
Tu misión es diseñar distribuciones en planta y propuestas de interiorismo magistrales, funcionales, ergonómicas y visualmente impactantes.

SISTEMA DE COORDENADAS:
- Plano 2D en centímetros (cm).
- Eje X hacia la derecha (Este).
- Eje Y hacia abajo (Sur).

REGLAS DE ORO DE ARQUITECTURA Y ERGONOMÍA (OBLIGATORIAS):
1. ZONIFICACIÓN Y CIRCULACIÓN:
   - Mantén pasillos de paso despejados de al menos 70 a 90 cm de anchura entre muebles y paredes.
   - Respeta escrupulosamente el barrido de apertura de todas las puertas (deja un área libre de su ancho).
   - Respeta el acceso a ventanas y balcones: nunca coloques muebles altos que tapen la luz o impidan la apertura.
   - Respeta los radiadores, chimeneas, armarios empotrados y tomas eléctricas/TV existentes.
2. DISPOSICIÓN Y ORIENTACIÓN DEL MOBILIARIO:
   - "rotation" define hacia dónde mira el frente del mueble (0 = frente hacia abajo +Y, respaldo arriba; 90 = frente hacia la izquierda -X; 180 = frente hacia arriba -Y; 270 = frente hacia la derecha +X).
   - La zona de TV debe orientarse hacia el sofá principal respetando la distancia visual adecuada y evitando reflejos directos de ventanas.
   - En dormitorios: la cama debe permitir paso cómodo a ambos lados (al menos 50-60 cm) si es de matrimonio.
3. DOMINIO ABSOLUTO DE ESTILOS DECORATIVOS:
   - Aplica con rigor los materiales, paletas cromáticas y tipología de piezas según el estilo seleccionado (Nórdico, Japandi, Minimalista, Moderno, Industrial, Mediterráneo, Boho, Clásico, Mid-Century, etc.).
4. DIVERSIDAD ENTRE PROPUESTAS:
   - Si se generan varias propuestas, cada una DEBE ofrecer una distribución espacial CLARAMENTE DISTINTA (por ejemplo: opción 1 con sofá rinconero y zona de lectura, opción 2 con distribución simétrica de dos sofás, opción 3 con énfasis en comedor amplio o espacio de trabajo integrado).
5. TODOS LOS MUEBLES DEBEN QUEDAR DENTRO DEL CONTORNO DE LA HABITACIÓN.

Responde siempre en español profesional.`;

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
    const base = `ESTANCIA Y ARQUITECTURA:
${JSON.stringify(room)}

DESEOS DEL CLIENTE:
${body.brief || "(Optimizar al máximo el espacio con el mobiliario idóneo para esta tipología de estancia)"}
Estilo decorativo: ${body.style || "Nórdico"}
Presupuesto orientativo: ${body.budget || "No indicado"}`;

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
        w: Math.max(10, Number(it.width) || 60),
        d: Math.max(10, Number(it.depth) || 60),
        rot: Math.round((Number(it.rotation) || 0) / 90) * 90,
        color: it.color || "#64748b",
        material: it.material,
        notes: it.notes,
      }));
      return {
        id: prev?.id || uid(),
        title: p.title || `Distribución ${body.style}`,
        summary: p.summary || "",
        style: p.style || body.style,
        palette: p.palette || ["#f8fafc", "#e2e8f0", "#94a3b8", "#475569"],
        estimatedBudget: p.estimated_budget_eur,
        items: sanitizeItems(items, body.data),
        tips: p.tips || [],
        renders: prev?.renders || [],
        feedbackHistory: prev ? [...(prev.feedbackHistory || []), body.feedback || ""] : [],
      };
    };

    // Modo refinamiento con feedback
    if (body.mode === "refine" && body.proposal) {
      const current = {
        title: body.proposal.title,
        summary: body.proposal.summary,
        style: body.proposal.style,
        palette: body.proposal.palette,
        items: body.proposal.items.map((i) => ({
          name: i.name, category: i.category, x: Math.round(i.x), y: Math.round(i.y),
          width: i.w, depth: i.d, rotation: i.rot, color: i.color, material: i.material, notes: i.notes,
        })),
      };
      const p = await generateJson<RawProposal>({
        system: SYSTEM,
        input: `${base}

PROPUESTA ACTUAL (con ajustes existentes):
${JSON.stringify(current)}

CAMBIOS Y SUGERENCIAS DEL CLIENTE:
${body.feedback}

Aplica con maestría las sugerencias del cliente y devuelve la propuesta completa optimizada y cohesionada.`,
        schema: proposalSchema,
      });
      return Response.json({ proposal: toProposal(p, body.proposal) });
    }

    // Cantidad de propuestas seleccionada (de 1 a 10)
    const targetCount = Math.min(10, Math.max(1, body.count || 3));

    // Si son más de 4 propuestas, generamos en 2 lotes paralelos para máxima velocidad y evitar cortes
    let rawProposals: RawProposal[] = [];

    if (targetCount <= 4) {
      const res = await generateJson<{ proposals: RawProposal[] }>({
        system: SYSTEM,
        input: `${base}

Genera exactamente ${targetCount} propuestas de distribución y diseño de interiores CLARAMENTE DIFERENTES entre sí. Cada propuesta debe explorar una solución de organización del espacio, mobiliario y zonificación única.`,
        schema: {
          type: "object",
          properties: { proposals: { type: "array", items: proposalSchema } },
          required: ["proposals"],
        },
      });
      rawProposals = res.proposals || [];
    } else {
      const batch1Count = Math.ceil(targetCount / 2);
      const batch2Count = targetCount - batch1Count;

      const [res1, res2] = await Promise.all([
        generateJson<{ proposals: RawProposal[] }>({
          system: SYSTEM,
          input: `${base}

Genera ${batch1Count} propuestas de interiorismo creativas y funcionales (Enfoques de distribución A: optimización de espacio y confort).`,
          schema: {
            type: "object",
            properties: { proposals: { type: "array", items: proposalSchema } },
            required: ["proposals"],
          },
        }),
        generateJson<{ proposals: RawProposal[] }>({
          system: SYSTEM,
          input: `${base}

Genera ${batch2Count} propuestas de interiorismo alternativas e innovadoras (Enfoques de distribución B: variantes de zonificación, orientación y mobiliario multifuncional).`,
          schema: {
            type: "object",
            properties: { proposals: { type: "array", items: proposalSchema } },
            required: ["proposals"],
          },
        }),
      ]);

      rawProposals = [...(res1.proposals || []), ...(res2.proposals || [])];
    }

    return Response.json({ proposals: rawProposals.map((p) => toProposal(p)) });
  } catch (e) {
    return aiError(e);
  }
}
