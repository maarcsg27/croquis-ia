/**
 * BIBLIOTECA DE CONOCIMIENTO: EFICIENCIA ENERGÉTICA Y DISEÑO BIOCLIMÁTICO INTERIOR
 * Estrategias pasivas de confort térmico, ahorro en climatización, iluminación eficiente y sostenibilidad.
 */

export interface EnergyEfficiencyRule {
  id: string;
  category: "solar_passive" | "thermal_envelope" | "hvac_optimization" | "lighting_efficiency" | "sustainable_materials" | "air_quality_biophilic";
  title: string;
  rule: string;
  energySavingPotential: string; // ej: "15-25% en calefacción", "60% en luz artificial"
  practicalApplication: string;
  rationale: string;
  tags: string[];
}

export const ENERGY_EFFICIENCY_LIBRARY: EnergyEfficiencyRule[] = [
  // --- CAPTACIÓN Y CONTROL SOLAR PASIVO ---
  {
    id: "solar_daylight_harvesting",
    category: "solar_passive",
    title: "Aprovechamiento Pasivo de la Luz Natural (Daylight Harvesting)",
    rule: "Disponer las zonas de actividad prolongada (escritorio de trabajo, rincón de lectura, zona de preparación culinaria) dentro de un radio de 2.5 metros de las ventanas principales. Mantener los antepechos y vanos libres de obstáculos altos.",
    energySavingPotential: "Hasta un 50% de reducción en consumo de iluminación artificial diurna.",
    practicalApplication: "Coloca el escritorio en perpendicular a la ventana para recibir luz natural lateral sin deslumbramiento en la pantalla ni sombras arrojadas con la mano.",
    rationale: "La luz solar directa y difusa reduce la necesidad de encender luminarias y mejora el estado de ánimo y la segregación de serotonina.",
    tags: ["luz_natural", "solar", "ahorro_electrico", "despacho"],
  },
  {
    id: "solar_orientation_thermal_management",
    category: "solar_passive",
    title: "Gestión Térmica por Orientación de Fachada",
    rule: "Tratamiento bioclimático según orientación: En orientación Sur/Oeste, instalar dobles cortinas (visillo traslúcido para luz + cortina térmica o estor screen de factor 3-5% para frenar el calor en verano). En orientación Norte, priorizar cortinajes densos con forro térmico para frenar el muro frío en invierno.",
    energySavingPotential: "Ahorro de entre 20% y 35% en climatización y aire acondicionado estival.",
    practicalApplication: "En salones orientados al Oeste, evitar colocar sofás de piel o telas oscuras pegados a la ventana donde el sol de tarde eleva la temperatura superficial por encima de 45°C.",
    rationale: "La radiación solar no filtrada a través de vidrios genera efecto invernadero descontrolado en verano y fugas de calor por radiación nocturna en invierno.",
    tags: ["orientacion", "sur", "norte", "oeste", "cortinas_termicas", "bioclimatica"],
  },

  // --- ENVOLVENTE TÉRMICA INTERIOR Y AISLAMIENTO ---
  {
    id: "thermal_rug_floor_insulation",
    category: "thermal_envelope",
    title: "Aislamiento Térmico de Suelos con Alfombras Naturales",
    rule: "En estancias con suelos cerámicos, pétreos o laminados sin suelo radiante, colocar alfombras de fibras naturales densas (lana virgen, yute, sisal) bajo las áreas de estar y cama.",
    energySavingPotential: "Reduce la pérdida de calor por transmisión en solera entre un 10% y un 15% y eleva la sensación térmica percibida en 1.5°C a 2°C.",
    practicalApplication: "Coloca una alfombra que abarque al menos las patas delanteras del sofá y la mesa de centro, o que sobrepase 60-70 cm a los lados del colchón.",
    rationale: "El suelo representa hasta un 20% de las pérdidas térmicas por contacto directo. Las bolsas de aire microscópicas de la lana actúan como un aislante pasivo continuo.",
    tags: ["alfombra", "suelo", "aislamiento", "confort_termico", "lana"],
  },
  {
    id: "thermal_curtain_layering",
    category: "thermal_envelope",
    title: "Barrera Térmica Textil en Acristalamientos",
    rule: "Emplear cortinas que cubran desde el techo hasta rozar el suelo y desborden al menos 15-20 cm cada lateral del marco de la ventana, con tejidos multicapa o forro térmico aislante.",
    energySavingPotential: "Reduce la fuga de calor nocturna por los cristales hasta en un 25%.",
    practicalApplication: "Cerrar las cortinas tupidas al caer el sol en invierno para encapsular el colchón de aire frío contra el vidrio.",
    rationale: "El vidrio frío induce corrientes de convección descendentes que enfrían la estancia aunque la calefacción esté encendida.",
    tags: ["cortinas", "ventanas", "conveccion", "frio", "calor"],
  },

  // --- OPTIMIZACIÓN DE CALEFACCIÓN Y CLIMATIZACIÓN (HVAC) ---
  {
    id: "hvac_radiator_clearance_mandatory",
    category: "hvac_optimization",
    title: "Liberación Estricta de Radiadores y Fuentes de Calor",
    rule: "NUNCA bloquear un radiador con el respaldo de un sofá, una cama o un aparador. Debe mantenerse una distancia libre frontal de al menos 30 cm a 40 cm y superior de 20 cm para permitir el ciclo de convección natural del aire.",
    energySavingPotential: "Evita un sobreconsumo de hasta un 20% en la factura de calefacción ocasionado por muebles que absorben el calor.",
    practicalApplication: "Si es imprescindible colocar un mueble frente a un radiador, este debe ser una consola abierta o banco con baldas ranuradas que dejen ascender el aire caliente.",
    rationale: "Un sofá pegado al radiador absorbe hasta el 65% de la energía emitida, bloqueando el retorno de aire fresco del suelo y obligando a la caldera a trabajar más tiempo.",
    tags: ["radiador", "calefaccion", "conveccion", "bloqueo", "ahorro"],
  },
  {
    id: "hvac_radiator_heat_reflector",
    category: "hvac_optimization",
    title: "Láminas Reflectantes Traseras en Radiadores",
    rule: "Recomendar la colocación de un panel reflectante de aluminio/espuma detrás de los radiadores anclados a muros que dan a fachada exterior.",
    energySavingPotential: "Recupera hasta el 10% del calor que normalmente se pierde transmitido a través del muro exterior.",
    practicalApplication: "Instalar una lámina fina adherida a la pared tras los radiadores exteriores para rebotar la radiación infrarroja hacia el interior de la estancia.",
    rationale: "Los radiadores calientan por igual el aire y la pared detrás de ellos; aislar esa pared dirige el flujo hacia el centro de la estancia.",
    tags: ["radiador", "reflector", "infrarrojo", "muro"],
  },
  {
    id: "hvac_air_flow_cross_ventilation",
    category: "hvac_optimization",
    title: "Disposición para Ventilación Cruzada Natural",
    rule: "Mantener los corredores visuales y físicos entre puertas y ventanas opuestas o perpendiculares sin muebles masivos que frenen el flujo de aire cuando se abren simultáneamente.",
    energySavingPotential: "Permite refrigeración pasiva nocturna en verano que sustituye el aire acondicionado durante varias horas.",
    practicalApplication: "Diseñar la distribución dejando expedita la línea directa de brisa entre la balconera y la puerta interior hacia el recibidor.",
    rationale: "La renovación del aire por tiro térmico natural evacúa el calor acumulado en las masas del edificio rápidamente y con coste cero de energía.",
    tags: ["ventilacion_cruzada", "refrigeracion_pasiva", "verano", "aire"],
  },

  // --- ILUMINACIÓN EFICIENTE Y SMART ---
  {
    id: "lighting_led_high_efficacy",
    category: "lighting_efficiency",
    title: "Iluminación LED de Alta Eficiencia (>110 lm/W)",
    rule: "Especificar luminarias LED de última generación con rendimiento igual o superior a 110 lúmenes/vatio, índice de reproducción cromática CRI >= 90 y regulación de intensidad (dimming) por zonas.",
    energySavingPotential: "Hasta un 85% de ahorro frente a halógenos y un 30% frente a fluorescentes o LEDs estándar antiguos.",
    practicalApplication: "Zonificar la iluminación para encender únicamente los puntos de tarea en uso (ej: lámpara de pie en lectura) en lugar de iluminar toda la habitación a máxima potencia.",
    rationale: "La modulación del flujo lumínico alarga la vida útil de las bombillas y ajusta el consumo eléctrico al requerimiento visual exacto.",
    tags: ["led", "eficiencia", "lumen", "dimmer", "zonificacion"],
  },

  // --- MATERIALES SOSTENIBLES Y HUELLA DE CARBONO ---
  {
    id: "materials_sustainable_wood_circular",
    category: "sustainable_materials",
    title: "Madera Sostenible Certificada (FSC / PEFC) y Economía Circular",
    rule: "Seleccionar mobiliario fabricado con maderas de gestión forestal responsable (roble, fresno, pino certificado) y tableros con certificación de emisiones clase E1 o CARB 2 (bajo formaldehído). Promover muebles modulares reparables o con piezas sustituibles.",
    energySavingPotential: "Materiales con huella de carbono negativa (la madera almacena CO2 durante toda su vida útil frente al plástico o aluminio virgen).",
    practicalApplication: "Elegir mesas y estantes de madera maciza o chapa natural aceitada con ceras vegetales en lugar de acabados sintéticos de resinas plásticas no reciclables.",
    rationale: "Reduce drásticamente la energía embebida en la fabricación y permite que el mueble dure décadas mediante lijado y reencerado.",
    tags: ["fsc", "pefc", "madera_sostenible", "circular", "durabilidad"],
  },
  {
    id: "materials_low_voc_clay_lime",
    category: "sustainable_materials",
    title: "Pinturas Transpirables al Silicato, Cal o Base Agua sin COVs",
    rule: "Revestir paredes y techos con pinturas minerales (de cal o silicato) o esmaltes acrílicos al agua con sello ecológico Ecolabel y libres de COVs (<1g/L).",
    energySavingPotential: "Regulación pasiva de la humedad relativa del aire interior entre 40% y 60%, reduciendo necesidad de deshumidificadores.",
    practicalApplication: "El uso de cal o pinturas minerales previene la formación de moho en puentes térmicos y esquinas frías de manera natural sin productos químicos tóxicos.",
    rationale: "Paredes transpirables actúan como pulmón higrotérmico, absorbiendo vapor de agua cuando hay exceso y liberándolo cuando el ambiente se reseca.",
    tags: ["pintura_ecologica", "cov", "cal", "humedad", "salud"],
  },

  // --- CALIDAD DEL AIRE Y BIOFILIA ---
  {
    id: "biophilic_air_purification",
    category: "air_quality_biophilic",
    title: "Purificación Biofílica Activa con Plantas de Interior (Estudio NASA Clean Air)",
    rule: "Integrar al menos una planta depuradora de gran formato o 2-3 medianas por cada 10-12 m² (especies recomendadas: Sansevieria trifasciata, Spathiphyllum / Lirio de paz, Epipremnum aureum / Poto, Ficus elastica, Areca palm).",
    energySavingPotential: "Mejora la calidad del aire reduciendo la necesidad de purificadores eléctricos mecánicos continuos.",
    practicalApplication: "Ubicar una Sansevieria cerca de la zona de cama (produce oxígeno y absorbe CO2 por la noche debido al metabolismo ácido de las crasuláceas).",
    rationale: "Las plantas fitorremedian compuestos orgánicos volátiles como xileno, benceno y formaldehído, a la par que amortiguan la acústica ambiental.",
    tags: ["plantas", "nasa", "sansevieria", "purificacion", "biofilia", "aire_puro"],
  },
];
