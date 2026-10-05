/**
 * BIBLIOTECA DE CONOCIMIENTO: OPTIMIZACIÓN DE ESPACIOS Y MICRO-HABITÁCULOS
 * Técnicas avanzadas de aprovechamiento espacial, mobiliario transformable, zonificación y psicología visual.
 */

export interface SpaceOptimizationRule {
  id: string;
  category: "micro_spaces" | "multifunctional" | "vertical_storage" | "optical_expansion" | "circulation_zoning";
  title: string;
  rule: string;
  spatialGainMetric: string; // ej: "+1.2 m² de espacio útil", "Sensación visual +30%"
  tacticalImplementation: string;
  rationale: string;
  applicableRoomTypes: string[];
  tags: string[];
}

export const SPACE_OPTIMIZATION_LIBRARY: SpaceOptimizationRule[] = [
  // --- MICRO-ESPACIOS Y EXPANDIBILIDAD ---
  {
    id: "opt_elevated_legs_floor_continuity",
    category: "optical_expansion",
    title: "Efecto Suelo Continuo y Mobiliario con Patas Elevadas",
    rule: "En habitaciones de menos de 15 m², elegir sofás, aparadores, mesitas y camas con patas esbeltas elevadas al menos 12-18 cm del suelo, o piezas voladas/suspendidas en pared.",
    spatialGainMetric: "Incrementa la amplitud espacial percibida en un 25% a 30%.",
    tacticalImplementation: "Sustituye un sofá con faldón hasta el suelo por uno con estructura vista y patas delgadas de madera o metal; utiliza mesitas de noche voladas ancladas a la pared.",
    rationale: "El cerebro calcula las dimensiones reales de una estancia midiendo el perímetro visible del suelo. Cuanto más suelo continúe bajo los muebles, más grande se percibe la habitación.",
    applicableRoomTypes: ["Salón", "Dormitorio de matrimonio", "Dormitorio individual", "Despacho", "Recibidor"],
    tags: ["patas_elevadas", "suelo_continuo", "amplitud_visual", "espacios_pequeños"],
  },
  {
    id: "opt_mirror_light_depth_amplifier",
    category: "optical_expansion",
    title: "Espejos Estratégicos como Ventanas Virtuales",
    rule: "Ubicar un espejo de gran formato (de cuerpo entero o composición mural) perpendicular o frente a la ventana principal, o detrás de una luminaria de pie.",
    spatialGainMetric: "Duplica la luminosidad natural incidente y añade una fuga visual de profundidad infinita.",
    tacticalImplementation: "Colocar un espejo de arco o rectangular apoyado en la pared lateral respecto a la balconera para rebotar la luz natural hacia el rincón más oscuro de la estancia.",
    rationale: "Refleja el exterior (cielo, árboles o luz directa) rompiendo la sensación de confinamiento de una pared ciega sólida.",
    applicableRoomTypes: ["Salón", "Dormitorio", "Recibidor", "Comedor", "Baño"],
    tags: ["espejos", "profundidad", "reflejo", "luz_rebote"],
  },
  {
    id: "opt_lrv_light_reflectance_value",
    category: "optical_expansion",
    title: "Valor de Reflectancia Lumínica (LRV > 70%) en Paramentos",
    rule: "En habitáculos reducidos, seleccionar pinturas y revestimientos de pared con un índice LRV superior al 70% (blanco roto, lino claro, beige arena, marfil, gris perla suave) en acabado mate sedoso.",
    spatialGainMetric: "Multiplica por 1.8 el rendimiento de la luz natural difusa.",
    tacticalImplementation: "Evitar paredes oscuras en los paramentos laterales y limitar tonos de fuerte contraste únicamente a detalles menores o carpinterías finas.",
    rationale: "Los colores con alto LRV dispersan los fotones en lugar de absorberlos, difuminando las esquinas y haciendo que los límites de la habitación parezcan alejarse.",
    applicableRoomTypes: ["Salón", "Dormitorio", "Despacho", "Cocina", "Recibidor"],
    tags: ["lrv", "reflectancia", "pintura_clara", "amplitud"],
  },

  // --- MOBILIARIO MULTIFUNCIONAL Y TRANSFORMABLE ---
  {
    id: "opt_transformable_convertible_furniture",
    category: "multifunctional",
    title: "Piezas Híbridas 2-en-1 para Espacios Compactos",
    rule: "Integrar al menos una pieza con doble funcionalidad ergonómica: mesa de centro elevable con almacenaje interior y superficie de teletrabajo, canapé abatible con pistones hidráulicos, o mesa consola extensible de 45 cm a 220 cm para comedor ocasional.",
    spatialGainMetric: "Ahorro de hasta 4 m² de ocupación permanente en planta.",
    tacticalImplementation: "En un salón pequeño, una mesa de centro elevable elimina la necesidad de un escritorio voluminoso permanente si se trabaja puntualmente desde el sofá.",
    rationale: "Permite que una misma estancia sirva como sala de estar, comedor de invitados y puesto de trabajo según el momento del día sin saturar el espacio físico.",
    applicableRoomTypes: ["Salón", "Salón-comedor", "Dormitorio", "Despacho", "Otro"],
    tags: ["multifuncional", "convertible", "mesa_elevable", "canape", "ahorro_espacio"],
  },
  {
    id: "opt_modular_nesting_tables",
    category: "multifunctional",
    title: "Mesas Nido y Asientos Auxiliares Apilables / Ocultables",
    rule: "Utilizar conjuntos de mesas nido circulares u orgánicas que se recogen una debajo de otra, y pufs tapizados con almacenaje que pueden deslizarse bajo la mesa de centro o bajo una consola.",
    spatialGainMetric: "Libera 1.5 m² de superficie de tránsito cuando no hay visitas.",
    tacticalImplementation: "Despliega las 2 o 3 mesas auxiliares durante una reunión social y recógelas en un solo módulo compacto en el día a día.",
    rationale: "La flexibilidad dinámica del espacio mantiene despejadas las líneas de circulación habitual sin sacrificar la capacidad de acogida.",
    applicableRoomTypes: ["Salón", "Salón-comedor", "Dormitorio", "Terraza"],
    tags: ["mesas_nido", "puf", "modular", "flexibilidad"],
  },

  // --- ALMACENAMIENTO VERTICAL Y OCULTO ---
  {
    id: "opt_vertical_floor_to_ceiling_storage",
    category: "vertical_storage",
    title: "Aprovechamiento de la Cota Vertical (Suelo a Techo)",
    rule: "Llevar los armarios y estanterías hasta el techo (250-260 cm) rematados con tapajuntas al ras de la moldura o falso techo, pintando los frentes en el mismo color que la pared para camuflar el volumen.",
    spatialGainMetric: "Incrementa la capacidad de almacenaje en un 40% adicional sin ocupar más superficie de suelo.",
    tacticalImplementation: "Diseñar armarios con puertas lisas con uñero o apertura push-pull que se fundan visualmente con el muro como si fuera una pared arquitectónica limpia.",
    rationale: "El espacio superior entre 210 cm y el techo suele convertirse en una zona muerta acumuladora de polvo. Cerrarlo hasta el techo estiliza la altura de la habitación y proporciona almacenaje para maletas y ropa de otra temporada.",
    applicableRoomTypes: ["Dormitorio de matrimonio", "Dormitorio individual", "Recibidor", "Salón", "Despacho"],
    tags: ["almacenaje_vertical", "armario_techo", "camuflaje", "capacidad"],
  },
  {
    id: "opt_sliding_pocket_doors_gain",
    category: "circulation_zoning",
    title: "Sustitución de Puertas Batientes por Correderas Empotradas",
    rule: "Recomendar puertas correderas o embutidas en tabique (casoneto) para accesos a baños en suite, vestidores o divisorias entre salón y cocina.",
    spatialGainMetric: "Gana entre 1.0 m² y 1.5 m² de arco de barrido muerto por cada puerta modificada.",
    tacticalImplementation: "Permite adosar muebles útiles (una cómoda, zapatero o perchero) justo detrás de donde antes barría la hoja de la puerta batiente.",
    rationale: "El arco de giro de una puerta estándar de 80 cm inutiliza un cuadrante de 1 m² que de otro modo sería totalmente aprovechable.",
    applicableRoomTypes: ["Baño", "Dormitorio", "Recibidor", "Cocina"],
    tags: ["puerta_corredera", "casoneto", "barrido", "aprovechamiento"],
  },

  // --- ZONIFICACIÓN LIGERA Y SEPARADORES TRANSLÚCIDOS ---
  {
    id: "opt_translucent_light_dividers",
    category: "circulation_zoning",
    title: "Zonificación con Palillería de Madera o Vidrio Acanalado",
    rule: "Para separar funciones (ej: salón de comedor, o zona de dormir de estudio en un loft), utilizar separadores de lamas verticales de madera (palillería) o mamparas de vidrio acanalado/texturado con perfilería fina de aluminio.",
    spatialGainMetric: "Zonificación acústica y visual sin perder ni un lumen de luz natural ni construir tabiques ciegos.",
    tacticalImplementation: "Un panel de listones de roble de 90 cm de ancho separa la entrada del salón creando un recibidor íntimo sin oscurecer el pasillo.",
    rationale: "Los tabiques ciegos fragmentan y empequeñecen las viviendas. Las divisorias permeables mantienen la lectura unitaria del espacio mientras ordenan la privacidad.",
    applicableRoomTypes: ["Salón-comedor", "Recibidor", "Despacho", "Dormitorio", "Otro"],
    tags: ["palilleria", "lamas", "vidrio_acanalado", "separador_ambientes", "zonificacion"],
  },
];
