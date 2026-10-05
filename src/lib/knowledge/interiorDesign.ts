/**
 * BIBLIOTECA DE CONOCIMIENTO: ARQUITECTURA DE INTERIORES Y DISEÑO PROFESIONAL
 * Estándares internacionales de ergonomía, antropometría, proporciones y composición.
 */

export interface InteriorDesignRule {
  id: string;
  category: "composition" | "ergonomics" | "lighting" | "color_psychology" | "acoustics";
  title: string;
  rule: string;
  metrics: {
    recommended_min_cm?: number;
    recommended_ideal_cm?: number;
    recommended_max_cm?: number;
    ratio?: string;
    kelvin?: number;
    lux?: number;
  };
  rationale: string;
  tags: string[];
}

export const INTERIOR_DESIGN_LIBRARY: InteriorDesignRule[] = [
  // --- COMPOSICIÓN Y PROPORCIÓN ---
  {
    id: "comp_golden_ratio",
    category: "composition",
    title: "Proporción Áurea y Escala Visual (1:1.618)",
    rule: "Divide los espacios y agrupaciones de mobiliario en ratios de 60% (zona dominante) y 40% (zona secundaria o vacíos de respiración).",
    metrics: { ratio: "60/40 (1.618)" },
    rationale: "Crea una cadencia armónica natural percibida intuitivamente por el cerebro como equilibrada y relajante.",
    tags: ["proporcion", "composicion", "equilibrio", "escala"],
  },
  {
    id: "comp_focal_point",
    category: "composition",
    title: "Punto Focal Arquitectónico Primario",
    rule: "Cada estancia debe tener un único punto focal predominante (gran ventanal con vistas, chimenea, pared de acento o composición de estantería integrada). El mobiliario principal debe orientarse en triangulación hacia este punto sin obstruir la vista frontal.",
    metrics: { recommended_ideal_cm: 250 },
    rationale: "Evita el caos visual y da una jerarquía clara de orientación a quien entra en el habitáculo.",
    tags: ["focal_point", "orientacion", "jerarquia"],
  },
  {
    id: "comp_visual_weight",
    category: "composition",
    title: "Equilibrio de Peso Visual y Gravedad",
    rule: "Distribuye piezas pesadas y sólidas (sofás oscuros, aparadores macizos) cerca de paredes estructurales de fondo, compensándolas en el lado opuesto con piezas de peso visual liviano (butacas con patas estilizadas, mesas con tapas de vidrio o tonos claros).",
    metrics: {},
    rationale: "Evita la sensación de que una habitación 'se inclina' o se siente claustrofóbica hacia un flanco.",
    tags: ["peso_visual", "balance", "armonia"],
  },

  // --- ERGONOMÍA Y ANTROPOMETRÍA (NEUFERT & PANERO) ---
  {
    id: "ergo_main_circulation",
    category: "ergonomics",
    title: "Circulación Principal Primaria",
    rule: "El eje de paso principal de la habitación debe mantener un ancho libre mínimo de 80 cm a 90 cm en todo su recorrido, libre de esquinas de mesas o aristas de alfombras.",
    metrics: { recommended_min_cm: 75, recommended_ideal_cm: 90, recommended_max_cm: 120 },
    rationale: "Permite el cruce simultáneo o el paso cómodo de personas con objetos o ropa sin rozar el mobiliario.",
    tags: ["circulacion", "pasillos", "ergonomia", "neufert"],
  },
  {
    id: "ergo_secondary_circulation",
    category: "ergonomics",
    title: "Circulaciones Secundarias y Entre Muebles",
    rule: "La distancia mínima entre el frente de un sofá y la mesa de centro debe ser de 40 cm a 45 cm. Entre la mesa de centro y el mueble de TV o aparador debe dejarse al menos 60 cm a 80 cm.",
    metrics: { recommended_min_cm: 40, recommended_ideal_cm: 45, recommended_max_cm: 50 },
    rationale: "Permite estirar las piernas y acceder fácilmente al sofá manteniendo la mesa de centro al alcance de la mano sin tener que levantarse.",
    tags: ["sofa", "mesa_centro", "distancias", "estar"],
  },
  {
    id: "ergo_dining_clearance",
    category: "ergonomics",
    title: "Área Perimetral de Comedor",
    rule: "Deja entre 80 cm y 90 cm libres desde el borde de la mesa de comedor hasta la pared o mueble más cercano para permitir sentarse y levantarse. Si hay paso de circulación detrás de una persona sentada, eleva a 105-120 cm.",
    metrics: { recommended_min_cm: 75, recommended_ideal_cm: 90, recommended_max_cm: 120 },
    rationale: "Garantiza que una silla ocupada (que consume unos 50 cm de fondo) no bloquee el paso ni golpee paredes.",
    tags: ["comedor", "mesa", "sillas", "circulacion"],
  },
  {
    id: "ergo_bedroom_lateral",
    category: "ergonomics",
    title: "Paso Lateral y Frontal de Cama",
    rule: "En dormitorios dobles o matrimoniales, deja un espacio libre a cada lado de la cama de al menos 60 cm (mínimo absoluto 50 cm) para paso, apertura de cajones de mesita y hacer la cama con comodidad.",
    metrics: { recommended_min_cm: 50, recommended_ideal_cm: 65, recommended_max_cm: 90 },
    rationale: "Evita que un ocupante tenga que saltar sobre el otro y permite la limpieza ergonómica del lecho.",
    tags: ["cama", "dormitorio", "mesitas", "holgura"],
  },
  {
    id: "ergo_wardrobe_clearance",
    category: "ergonomics",
    title: "Zona de Despliegue de Armarios",
    rule: "Frente a armarios de puertas batientes, reserva al menos 90 cm a 100 cm libres (ancho de hoja batiente + espacio corporal de quien se viste). Para armarios de puertas correderas, 70 cm es suficiente.",
    metrics: { recommended_min_cm: 70, recommended_ideal_cm: 95, recommended_max_cm: 120 },
    rationale: "Facilita la visibilidad total del ropero y el cambio de ropa sin tropezar.",
    tags: ["armario", "vestidor", "puertas", "ergonomia"],
  },
  {
    id: "ergo_tv_viewing_distance",
    category: "ergonomics",
    title: "Ratio Distancia de Visión TV (4K UHD)",
    rule: "Para pantallas 4K UHD, la distancia óptima entre sofá y pantalla es de 1.2 a 1.6 veces la diagonal de la pantalla (ej: 55\" = 1.7m a 2.2m; 65\" = 2.0m a 2.6m; 75\" = 2.3m a 3.0m). La altura del centro de la pantalla debe quedar al nivel de los ojos sentado (100-110 cm del suelo).",
    metrics: { recommended_min_cm: 180, recommended_ideal_cm: 240, recommended_max_cm: 350 },
    rationale: "Previene fatiga ocular, dolor cervical y aprovecha la resolución sin apreciar pixelado.",
    tags: ["tv", "audiovisual", "distancia_optica", "ergonomia"],
  },

  // --- ARQUITECTURA DE ILUMINACIÓN POR CAPAS ---
  {
    id: "light_layering_three_levels",
    category: "lighting",
    title: "Las Tres Capas Fundamentales de Iluminación",
    rule: "Toda estancia bien diseñada debe combinar tres capas independientes regulables: 1. Iluminación General difusa (plafón, foseado perimetral o riel), 2. Iluminación de Tarea puntual (flexo de lectura, bajo mueble de cocina, aplique de mesita), 3. Iluminación de Acento/Atmósfera (tiras LED indirectas, lámparas de sobremesa con luz cálida de 2700K).",
    metrics: { kelvin: 2700, lux: 200 },
    rationale: "Permite transformar la estancia desde un modo activo y funcional hasta un modo acogedor de descanso vespertino.",
    tags: ["iluminacion", "capas", "luz_calida", "confort"],
  },
  {
    id: "light_color_temperature_strategy",
    category: "lighting",
    title: "Estrategia de Temperatura de Color (Kelvin)",
    rule: "Zonas de descanso (dormitorios, salones): 2500K - 2700K (blanco muy cálido, induce melatonina). Zonas comunes y comedores: 3000K (blanco cálido suave). Zonas de trabajo activo, cocinas y baños: 4000K (blanco neutro, máxima agudeza visual). Nunca mezclar temperaturas dispares en el mismo campo visual.",
    metrics: { kelvin: 2700 },
    rationale: "Sincroniza el espacio con los ritmos circadianos humanos y la función de la estancia.",
    tags: ["kelvin", "circadiano", "color_temperatura", "bienestar"],
  },

  // --- PSICOLOGÍA DEL COLOR Y TEXTURAS ---
  {
    id: "color_rule_60_30_10",
    category: "color_psychology",
    title: "Regla Cromática Interiorista 60-30-10",
    rule: "Aplica los colores en tres proporciones: 60% Color Dominante (paredes principales, techos, suelo o gran alfombra), 30% Color Secundario (tapicería de sofás, cortinajes, mobiliario principal de madera), 10% Color de Acento (cojines, cuadros, lámparas decorativas, jarrones).",
    metrics: { ratio: "60:30:10" },
    rationale: "Garantiza una armonía visual rica sin saturar ni convertir el espacio en un ambiente monótono o estridente.",
    tags: ["color", "paleta", "textil", "decoracion"],
  },
  {
    id: "acoustics_soft_surface_ratio",
    category: "acoustics",
    title: "Ratio Acústico y Confort Sonoro",
    rule: "En habitaciones con suelos duros (cerámica, microcemento o parqué), al menos un 35% de la superficie debe estar cubierta por materiales fonoabsorbentes (alfombras de pelo denso, cortinas tupidas de lino/terciopelo, sofás tapizados, paneles alistonados de madera con fieltro acústico).",
    metrics: { ratio: ">=35% absorbente" },
    rationale: "Elimina el eco metálico y la reverberación molesta, creando una sensación instantánea de serenidad y privacidad.",
    tags: ["acustica", "insonorizacion", "reverberacion", "confort"],
  },
];
