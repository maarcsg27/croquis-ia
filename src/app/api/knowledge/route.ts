import {
  INTERIOR_DESIGN_LIBRARY,
  ENERGY_EFFICIENCY_LIBRARY,
  SPACE_OPTIMIZATION_LIBRARY,
  STYLES_ENCYCLOPEDIA,
  syncKnowledgeToDatabase,
  buildIntelligenceDossier,
} from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomType = searchParams.get("roomType") || "Salón";
  const style = searchParams.get("style") || "Nórdico";
  const sync = searchParams.get("sync") === "true";

  let syncResult = null;
  if (sync) {
    syncResult = await syncKnowledgeToDatabase();
  }

  const dossier = buildIntelligenceDossier({
    roomType,
    style,
    hasRadiator: true,
    hasWindow: true,
  });

  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    statistics: {
      interiorDesignRules: INTERIOR_DESIGN_LIBRARY.length,
      energyEfficiencyRules: ENERGY_EFFICIENCY_LIBRARY.length,
      spaceOptimizationRules: SPACE_OPTIMIZATION_LIBRARY.length,
      stylesCovered: Object.keys(STYLES_ENCYCLOPEDIA).length,
      totalRules:
        INTERIOR_DESIGN_LIBRARY.length +
        ENERGY_EFFICIENCY_LIBRARY.length +
        SPACE_OPTIMIZATION_LIBRARY.length,
    },
    sync: syncResult,
    sampleDossier: dossier,
    styles: Object.keys(STYLES_ENCYCLOPEDIA),
  });
}
