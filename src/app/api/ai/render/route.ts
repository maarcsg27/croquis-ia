import { db, hasDb, isUuid } from "@/lib/db";
import { aiError, generateImage, hasAi, noAiResponse } from "@/lib/gemini";
import type { Proposal } from "@/lib/types";
import { STYLES_ENCYCLOPEDIA } from "@/lib/knowledge";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasAi()) return noAiResponse();
  try {
    const body = (await req.json()) as {
      projectId?: string;
      roomType: string;
      wallHeight: number;
      proposal: Proposal;
      planPng: string; // base64 (sin prefijo data:)
      view?: "perspective" | "aerial";
      extra?: string;
    };
    const p = body.proposal;
    const items = p.items
      .map(
        (i) =>
          `- ${i.name} (${Math.round(i.w)}×${Math.round(i.d)} cm${i.material ? ", material: " + i.material : ""}${
            i.color ? ", color: " + i.color : ""
          })`
      )
      .join("\n");
    const viewText =
      body.view === "aerial"
        ? "Vista aérea 3D isométrica (dollhouse) en ángulo de 45°, sin techo, mostrando toda la distribución arquitectónica."
        : "Fotografía de interiores a la altura de los ojos (1,50 m), en perspectiva fotográfica angular (24mm focal), profundidad de campo cinematográfica.";

    // Obtener detalles del estilo desde la biblioteca de conocimiento
    const styleDossier =
      STYLES_ENCYCLOPEDIA[p.style] ||
      Object.values(STYLES_ENCYCLOPEDIA).find((s) => s.aliases.some((a) => a.toLowerCase().includes(p.style.toLowerCase())));

    const styleDetails = styleDossier
      ? `Materiales auténticos recomendados: ${styleDossier.materials.woods.join(", ")}, ${styleDossier.materials.textiles.join(
          ", "
        )}, ${styleDossier.materials.minerals.join(", ")}. Estrategia lumínica: ${styleDossier.lightingStrategy}.`
      : "";

    const prompt = `Genera un RENDER FOTORREALISTA de arquitectura de interiores de un/a ${body.roomType}.
La imagen adjunta es el PLANO EN PLANTA a escala exacta (vista cenital): las paredes son las líneas gruesas, las puertas tienen su arco de apertura, las ventanas están en azul claro y los muebles se indican en sus posiciones y dimensiones reales.
Respeta RIGUROSAMENTE la forma perimetral de la estancia, la posición de puertas, ventanas y elementos fijos, y la ubicación, orientación y escala de cada mueble del plano.
${viewText}
Altura libre de techo: ${body.wallHeight} cm.
Estilo decorativo: ${p.style}. ${p.summary}
${styleDetails}
Paleta cromática armónica: ${p.palette.join(", ")}.
Mobiliario a representar fielmente:
${items}
${body.extra ? "Instrucciones de diseño adicionales: " + body.extra : ""}
Iluminación bioclimática natural entrando suavemente por las ventanas (luz de día suave, sombras sutiles), complementada con iluminación cálida indirecta en 2700K. Acabados y texturas hiperrealistas (grano de madera natural, textura táctil de lino y bouclé, reflejos de piedra natural mate). Calidad de portada de Architectural Digest. No incluyas textos, cotas, marcas de agua ni personas.`;

    const img = await generateImage({
      prompt,
      images: [{ data: body.planPng, mime_type: "image/png" }],
      aspect_ratio: "16:9",
    });

    let url = `data:${img.mime_type};base64,${img.data}`;
    if (hasDb() && body.projectId && isUuid(body.projectId)) {
      try {
        const q = await db();
        const rows = (await q`
          INSERT INTO renders (project_id, proposal_id, mime, data)
          VALUES (${body.projectId}, ${p.id}, ${img.mime_type}, ${img.data})
          RETURNING id`) as { id: string }[];
        url = `/api/renders/${rows[0].id}`;
      } catch (e) {
        console.error("No se pudo guardar el render", e);
      }
    }
    return Response.json({ url });
  } catch (e) {
    return aiError(e);
  }
}
