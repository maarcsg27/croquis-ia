/**
 * SISTEMA MAESTRO DE INTELIGENCIA DE INTERIORISMO Y EFICIENCIA ENERGÉTICA
 * Motor central de memoria, consulta contextual y grounding para Google Gemini.
 */

import { INTERIOR_DESIGN_LIBRARY, type InteriorDesignRule } from "./interiorDesign";
import { ENERGY_EFFICIENCY_LIBRARY, type EnergyEfficiencyRule } from "./energyEfficiency";
import { SPACE_OPTIMIZATION_LIBRARY, type SpaceOptimizationRule } from "./spaceOptimization";
import { STYLES_ENCYCLOPEDIA, type StyleDossier } from "./stylesEncyclopedia";
import { hasDb, sql } from "@/lib/db";

export interface SpatialContextQuery {
  roomType: string;
  style: string;
  brief?: string;
  hasRadiator?: boolean;
  hasWindow?: boolean;
  hasBalcony?: boolean;
  approxAreaM2?: number;
}

export interface IntelligenceDossier {
  selectedStyle: StyleDossier;
  interiorRules: InteriorDesignRule[];
  energyRules: EnergyEfficiencyRule[];
  spaceOptimizationRules: SpaceOptimizationRule[];
  summaryChecklist: string[];
}

/**
 * Consulta contextual inteligente: selecciona las reglas y directrices
 * más pertinentes para la tipología de habitación, el estilo y las características físicas.
 */
export function buildIntelligenceDossier(ctx: SpatialContextQuery): IntelligenceDossier {
  const normStyle = ctx.style?.trim() || "Nórdico";
  const selectedStyle =
    STYLES_ENCYCLOPEDIA[normStyle] ||
    Object.values(STYLES_ENCYCLOPEDIA).find((s) => s.aliases.some((a) => a.toLowerCase().includes(normStyle.toLowerCase()))) ||
    STYLES_ENCYCLOPEDIA["Nórdico"];

  // Filtrado de reglas de diseño según estancia
  const interiorRules = INTERIOR_DESIGN_LIBRARY.filter((rule) => {
    if (ctx.roomType.toLowerCase().includes("dormitorio") && rule.tags.includes("cama")) return true;
    if (ctx.roomType.toLowerCase().includes("comedor") && rule.tags.includes("comedor")) return true;
    if (ctx.roomType.toLowerCase().includes("salón") && (rule.tags.includes("sofa") || rule.tags.includes("tv"))) return true;
    return rule.category === "ergonomics" || rule.category === "lighting" || rule.category === "composition";
  });

  // Filtrado de reglas de eficiencia energética según elementos presentes
  const energyRules = ENERGY_EFFICIENCY_LIBRARY.filter((rule) => {
    if (ctx.hasRadiator && rule.tags.includes("radiador")) return true;
    if ((ctx.hasWindow || ctx.hasBalcony) && (rule.tags.includes("luz_natural") || rule.tags.includes("cortinas"))) return true;
    return rule.category === "lighting_efficiency" || rule.category === "sustainable_materials" || rule.category === "air_quality_biophilic";
  });

  // Filtrado de reglas de optimización de espacio
  const spaceOptimizationRules = SPACE_OPTIMIZATION_LIBRARY.filter((rule) => {
    const isSmall = (ctx.approxAreaM2 || 20) <= 16;
    if (isSmall && rule.category === "optical_expansion") return true;
    if (isSmall && rule.category === "multifunctional") return true;
    return rule.applicableRoomTypes.some((t) => t.toLowerCase().includes(ctx.roomType.toLowerCase())) || rule.category === "vertical_storage";
  });

  const summaryChecklist = [
    `Circulaciones libres: 70 a 90 cm en eje principal, 45 cm frente a sofás.`,
    ctx.hasRadiator ? `ALERTA TÉRMICA: Mínimo 30 cm de separación frontal frente a radiadores para ciclo de convección eficiente.` : `Gestión térmica pasiva y ventilación cruzada natural.`,
    `Aprovechamiento lumínico: Orientar zonas de lectura/trabajo a menos de 2.5m de ventanas principales.`,
    `Fidelidad cromática 60-30-10 y materiales sostenibles acordes a ${selectedStyle.styleName}.`,
    `Iluminación en 3 capas regulables: General, Tarea y Acento (2700K cálido en descanso / 4000K en trabajo).`,
  ];

  return {
    selectedStyle,
    interiorRules,
    energyRules,
    spaceOptimizationRules,
    summaryChecklist,
  };
}

/**
 * Transforma el dossier de conocimiento en un prompt enriquecido para Google Gemini.
 */
export function formatKnowledgeForGemini(dossier: IntelligenceDossier): string {
  const { selectedStyle, interiorRules, energyRules, spaceOptimizationRules, summaryChecklist } = dossier;

  return `
=== BIBLIOTECA MAESTRA DE CONOCIMIENTO ARQUITECTÓNICO Y EFICIENCIA ENERGÉTICA (OBLIGATORIA) ===

1. ESPECIFICACIÓN CANÓNICA DEL ESTILO DECORATIVO: "${selectedStyle.styleName}"
- Filosofía: ${selectedStyle.philosophy}
- Paleta Cromática Exacta:
  * Dominante (60%): ${selectedStyle.palette.dominant.join(", ")}
  * Secundario (30%): ${selectedStyle.palette.secondary.join(", ")}
  * Acento (10%): ${selectedStyle.palette.accent.join(", ")}
  * Códigos HEX recomendados: ${selectedStyle.palette.hexCodes.join(", ")}
- Materiales canónicos:
  * Maderas: ${selectedStyle.materials.woods.join(", ")}
  * Textiles: ${selectedStyle.materials.textiles.join(", ")}
  * Metales: ${selectedStyle.materials.metals.join(", ")}
  * Piedras/Minerales: ${selectedStyle.materials.minerals.join(", ")}
- Geometría de Mobiliario: ${selectedStyle.furnitureGeometry}
- Estrategia Lumínica: ${selectedStyle.lightingStrategy}
- Elementos Excluidos/Prohibidos: ${selectedStyle.prohibitedElements.join("; ")}

2. REGLAS CRÍTICAS DE ERGONOMÍA Y DISTRIBUCIÓN ESPACIAL:
${interiorRules
  .map(
    (r) => `- [${r.title}]: ${r.rule} (Métrica recomendada: ${JSON.stringify(r.metrics)}) -> Justificación: ${r.rationale}`
  )
  .join("\n")}

3. REGLAS DE EFICIENCIA ENERGÉTICA Y CONFORT BIOCLIMÁTICO:
${energyRules
  .map(
    (r) => `- [${r.title}]: ${r.rule} | Potencial de ahorro: ${r.energySavingPotential} | Aplicación: ${r.practicalApplication}`
  )
  .join("\n")}

4. TÉCNICAS DE OPTIMIZACIÓN DE ESPACIOS Y MICRO-HABITÁCULOS:
${spaceOptimizationRules
  .map((r) => `- [${r.title}]: ${r.rule} | Ganancia: ${r.spatialGainMetric} | Clave: ${r.tacticalImplementation}`)
  .join("\n")}

5. CHECKLIST DE ARQUITECTO APLICADO A ESTA PROPUESTA:
${summaryChecklist.map((c) => `* ${c}`).join("\n")}
========================================================================================
`;
}

/**
 * Persistencia en Base de Datos Postgres:
 * Almacena o sincroniza todos los módulos de conocimiento en la tabla \`knowledge_base\`
 * para consultas SQL o analítica si la base de datos está conectada.
 */
export async function syncKnowledgeToDatabase(): Promise<{ synced: number; storage: "postgres" | "local_memory" }> {
  if (!hasDb()) {
    return {
      synced:
        INTERIOR_DESIGN_LIBRARY.length +
        ENERGY_EFFICIENCY_LIBRARY.length +
        SPACE_OPTIMIZATION_LIBRARY.length +
        Object.keys(STYLES_ENCYCLOPEDIA).length,
      storage: "local_memory",
    };
  }

  try {
    const q = sql();
    // Asegurar tabla
    await q`CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      title TEXT NOT NULL,
      content JSONB NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;

    let count = 0;

    // 1. Guardar reglas de diseño de interiores
    for (const item of INTERIOR_DESIGN_LIBRARY) {
      await q`INSERT INTO knowledge_base (id, domain, title, content, tags)
        VALUES (${item.id}, 'interior_design', ${item.title}, ${JSON.stringify(item)}::jsonb, ${item.tags})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, updated_at = now()`;
      count++;
    }

    // 2. Guardar reglas de eficiencia energética
    for (const item of ENERGY_EFFICIENCY_LIBRARY) {
      await q`INSERT INTO knowledge_base (id, domain, title, content, tags)
        VALUES (${item.id}, 'energy_efficiency', ${item.title}, ${JSON.stringify(item)}::jsonb, ${item.tags})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, updated_at = now()`;
      count++;
    }

    // 3. Guardar optimización de espacios
    for (const item of SPACE_OPTIMIZATION_LIBRARY) {
      await q`INSERT INTO knowledge_base (id, domain, title, content, tags)
        VALUES (${item.id}, 'space_optimization', ${item.title}, ${JSON.stringify(item)}::jsonb, ${item.tags})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, updated_at = now()`;
      count++;
    }

    // 4. Guardar estilos
    for (const [key, item] of Object.entries(STYLES_ENCYCLOPEDIA)) {
      const id = `style_${key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      await q`INSERT INTO knowledge_base (id, domain, title, content, tags)
        VALUES (${id}, 'styles_encyclopedia', ${item.styleName}, ${JSON.stringify(item)}::jsonb, ${[item.styleName, ...item.aliases]})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, updated_at = now()`;
      count++;
    }

    return { synced: count, storage: "postgres" };
  } catch (err) {
    console.error("Error sincronizando base de conocimiento con Postgres:", err);
    return {
      synced:
        INTERIOR_DESIGN_LIBRARY.length +
        ENERGY_EFFICIENCY_LIBRARY.length +
        SPACE_OPTIMIZATION_LIBRARY.length +
        Object.keys(STYLES_ENCYCLOPEDIA).length,
      storage: "local_memory",
    };
  }
}

export { INTERIOR_DESIGN_LIBRARY, ENERGY_EFFICIENCY_LIBRARY, SPACE_OPTIMIZATION_LIBRARY, STYLES_ENCYCLOPEDIA };
