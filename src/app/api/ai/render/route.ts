import { db, hasDb, isUuid } from "@/lib/db";
import { aiError, generateImage, hasAi, noAiResponse } from "@/lib/gemini";
import type { Proposal } from "@/lib/types";

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
      .map((i) => `- ${i.name} (${Math.round(i.w)}×${Math.round(i.d)} cm${i.material ? ", " + i.material : ""}${i.color ? ", color " + i.color : ""})`)
      .join("\n");
    const viewText =
      body.view === "aerial"
        ? "Vista aérea 3D isométrica (dollhouse) desde arriba en ángulo de 45°, sin techo, mostrando toda la estancia."
        : "Fotografía de interiores a la altura de los ojos (1,60 m), en perspectiva desde la esquina que mejor muestre la distribución, objetivo gran angular 24 mm.";

    const prompt = `Genera un RENDER FOTORREALISTA de interiorismo de un/a ${body.roomType}.
La imagen adjunta es el PLANO EN PLANTA a escala de la estancia (vista desde arriba): las paredes son las líneas gruesas grises, las puertas se dibujan con un arco de apertura, las ventanas en azul claro, los elementos fijos en gris y los muebles como rectángulos de color con su nombre.
Respeta FIELMENTE la forma de la estancia, la posición de puertas, ventanas y elementos fijos, y la ubicación, orientación y proporción de cada mueble del plano.
${viewText}
Altura de techo: ${body.wallHeight} cm.
Estilo: ${p.style}. ${p.summary}
Paleta de colores: ${p.palette.join(", ")}.
Mobiliario:
${items}
${body.extra ? "Indicaciones extra del usuario: " + body.extra : ""}
Iluminación natural entrando por las ventanas, materiales realistas, calidad de revista de decoración. No incluyas textos, etiquetas, cotas ni marcas de agua en la imagen.`;

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
