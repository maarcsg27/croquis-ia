import { aiError, generateJson, hasAi, noAiResponse } from "@/lib/gemini";
import type { Product, Proposal } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const schema = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string", description: "Nombre del mueble de la propuesta al que corresponde" },
          name: { type: "string", description: "Nombre comercial del producto" },
          store: { type: "string" },
          price: { type: "string", description: "Precio aproximado, p.ej. '349 €'" },
          url: { type: "string", description: "Enlace directo a la ficha del producto" },
          description: { type: "string", description: "Breve descripción con foco en materiales sostenibles, ergonomía o calidad" },
          dimensions: { type: "string" },
        },
        required: ["item", "name", "store", "url"],
      },
    },
  },
  required: ["products"],
};

export async function POST(req: Request) {
  if (!hasAi()) return noAiResponse();
  try {
    const body = (await req.json()) as { proposal: Proposal; budget?: string; country?: string };
    const p = body.proposal;
    const list = p.items
      .filter((i) => i.category !== "plant" || p.items.length < 12)
      .map(
        (i) =>
          `- ${i.name}: ${Math.round(i.w)}×${Math.round(i.d)} cm, material sugerido: ${i.material || "no especificado"}, color: ${
            i.color || ""
          } (${i.category})`
      )
      .join("\n");
    const res = await generateJson<{ products: Product[] }>({
      system:
        "Eres un personal shopper de arquitectura de interiores y diseño sostenible. Usa la búsqueda de Google para encontrar productos REALES y vigentes a la venta. Prioriza piezas con maderas certificadas sostenibles (FSC/PEFC), textiles naturales reciclables, iluminación LED de alta eficiencia y medidas ergonómicas exactas. Nunca inventes enlaces: usa solo URLs reales encontradas en la búsqueda.",
      input: `Busca productos parecidos en estilo, color, materiales y medidas para cada elemento de esta propuesta de interiorismo, a la venta online en ${
        body.country || "España"
      } (tiendas como IKEA, Leroy Merlin, Kave Home, Maisons du Monde, Zara Home, El Corte Inglés, Amazon.es, Sklum, Hannun, La Redoute o MediaMarkt/PcComponentes para electrónica/iluminación).
Estilo: ${p.style}. Presupuesto total orientativo: ${body.budget || "no indicado"}.
Elementos:
${list}

Devuelve 1 o 2 productos reales por elemento con nombre comercial, tienda, precio aproximado, enlace directo, descripción y medidas comprobadas.`,
      schema,
      tools: [{ type: "google_search" }],
    });
    const products = (res.products || []).filter((x) => /^https?:\/\//.test(x.url || ""));
    return Response.json({ products });
  } catch (e) {
    return aiError(e);
  }
}
