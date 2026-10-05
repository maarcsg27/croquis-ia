/**
 * BIBLIOTECA DE CONOCIMIENTO: ENCICLOPEDIA PROFESIONAL DE ESTILOS DE INTERIORISMO
 * Especificaciones canónicas de materiales, paletas cromáticas, texturas, iluminación y geometría de mobiliario.
 */

export interface StyleDossier {
  styleName: string;
  aliases: string[];
  philosophy: string;
  palette: {
    dominant: string[]; // Colores primarios (60%)
    secondary: string[]; // Colores complementarios (30%)
    accent: string[]; // Toques de acento (10%)
    hexCodes: string[];
  };
  materials: {
    woods: string[];
    textiles: string[];
    metals: string[];
    minerals: string[];
  };
  furnitureGeometry: string;
  lightingStrategy: string;
  sustainableCharacteristics: string;
  prohibitedElements: string[];
}

export const STYLES_ENCYCLOPEDIA: Record<string, StyleDossier> = {
  Japandi: {
    styleName: "Japandi",
    aliases: ["Scandi-Japanese", "Zen Moderno", "Wabi-Sabi Nórdico"],
    philosophy: "Fusión magistral entre la calidez y el 'hygge' escandinavo con el minimalismo sobrio y la filosofía 'wabi-sabi' japonesa (belleza en la imperfección y sobriedad natural).",
    palette: {
      dominant: ["Blanco lino", "Arena suave", "Gris arcilla suave", "Tiza"],
      secondary: ["Roble blanco", "Madera de fresno", "Bambú natural", "Nogal claro"],
      accent: ["Negro carbón mate (sumi)", "Verde musgo profundo", "Terracota sutil"],
      hexCodes: ["#f5f2eb", "#e6dfd3", "#b8a99a", "#2b2a29", "#4f5848"],
    },
    materials: {
      woods: ["Roble natural aceitado", "Fresno claro", "Bambú", "Cedro"],
      textiles: ["Lino puro lavado", "Algodón orgánico crudo", "Yute sin teñir", "Lana bouclé suave"],
      metals: ["Hierro negro mate forjado fino", "Latón envejecido discreto"],
      minerals: ["Cerámica artesanal gres con esmalte reactivo", "Papel de arroz washi", "Piedra caliza mate"],
    },
    furnitureGeometry: "Líneas bajas y limpias (bajo centro de gravedad), esquinas redondeadas suavemente, siluetas minimalistas sin ornamentos innecesarios.",
    lightingStrategy: "Luz cálida muy suave y difusa (2400K-2700K). Lámparas escultóricas de papel de arroz (tipo Akari de Isamu Noguchi) o pantallas de lino fino.",
    sustainableCharacteristics: "Uso prioritario de maderas de bosques regenerativos, textiles sin tintes sintéticos y piezas artesanales hechas para durar toda la vida.",
    prohibitedElements: ["Colores neón o sintéticos", "Plásticos brillantes", "Metales cromados pulidos efecto espejo", "Sobrecarga de molduras clásicas"],
  },

  "Minimalismo Cálido": {
    styleName: "Minimalismo Cálido",
    aliases: ["Warm Minimalism", "Soft Minimal", "Organic Minimal"],
    philosophy: "Espacios despejados y despojados de artificios donde la riqueza proviene de la textura táctil de los materiales naturales, las curvas escultóricas y la luz rasante, huyendo de la frialdad estéril del minimalismo clínico.",
    palette: {
      dominant: ["Blanco roto / Cal", "Marfil mate", "Alabastro", "Piedra pómez"],
      secondary: ["Travertino romano", "Madera de olmo", "Beige topo"],
      accent: ["Bronce mate", "Caramelo tostado", "Gris basalto"],
      hexCodes: ["#fbf9f5", "#f1ece4", "#d9cfc1", "#8c7e6c", "#3d3835"],
    },
    materials: {
      woods: ["Roble ahumado claro", "Olmo macizo", "Nogal canaletto"],
      textiles: ["Bouclé de lana virgen", "Terciopelo de lino mate", "Gasa de algodón"],
      metals: ["Bronce cepillado", "Acero inoxidable microarenado"],
      minerals: ["Travertino sin pulir (poro abierto)", "Microcemento continuo de grano fino", "Mortero de cal a la llana"],
    },
    furnitureGeometry: "Volúmenes orgánicos curvos, sofás esculturales monolíticos, cantos redondeados suaves y almacenamiento totalmente oculto integrado en muros.",
    lightingStrategy: "Iluminación indirecta oculta en foseados perimetrales y zócalos flotantes. Luz rasante que enfatiza la textura del mortero de cal.",
    sustainableCharacteristics: "Revestimientos ecológicos de cal y arcilla que regulan la humedad ambiental, muebles sin compuestos tóxicos.",
    prohibitedElements: ["Tiradores vistos llamativos", "Mobiliario barato de aglomerado brillante", "Estampados estridentes o florales", "Cables o tecnología a la vista"],
  },

  Nórdico: {
    styleName: "Nórdico",
    aliases: ["Escandinavo", "Nordic Hygge", "Danish Design"],
    philosophy: "Funcionalismo humanista enfocado en maximizar la luminosidad durante los largos inviernos nórdicos, creando un santuario de confort ('hygge') accesible y luminoso.",
    palette: {
      dominant: ["Blanco puro luminoso (LRV > 85%)", "Gris perla", "Hielo"],
      secondary: ["Madera de pino claro", "Abedul", "Roble escandinavo"],
      accent: ["Azul empolvado", "Mostaza suave", "Gris antracita", "Rosa palo"],
      hexCodes: ["#ffffff", "#f1f3f5", "#e5e7eb", "#93c5fd", "#d97706"],
    },
    materials: {
      woods: ["Pino sueco", "Abedul laminado", "Roble claro al agua"],
      textiles: ["Mantas de punto grueso de lana", "Piel de oveja islandesa", "Algodón perchado"],
      metals: ["Aluminio lacado en blanco o gris ceniza", "Alambre de acero pintado"],
      minerals: ["Porcelana blanca mate", "Vidrio soplado transparente o ahumado suave"],
    },
    furnitureGeometry: "Diseño ergonómico funcional (herencia de Alvar Aalto y Arne Jacobsen), patas cónicas oblicuas de madera, respaldos curvos confortables.",
    lightingStrategy: "Lámparas colgantes bajas sobre la mesa de comedor para crear un círculo íntimo de luz. Múltiples fuentes de luz indirecta (2700K).",
    sustainableCharacteristics: "Maderas certificadas nórdicas con sellos ambientales PEFC, gran durabilidad y diseño desmontable en plano.",
    prohibitedElements: ["Maderas oscuras y pesadas (caoba, wengué)", "Acabados dorados barrocos", "Cortinajes pesados que tapen la luz"],
  },

  Mediterráneo: {
    styleName: "Mediterráneo",
    aliases: ["Mediterranean Modern", "Ibiza Chic", "Costa Brava Slow Living"],
    philosophy: "Elogio de la luz costera, la ventilación cruzada y la frescura de los materiales vernáculos: cal blanca, barro cocido, sombras vegetales y artesanía local.",
    palette: {
      dominant: ["Blanco encalado puro", "Arena de playa", "Yeso natural"],
      secondary: ["Terracota cocida", "Madera de olivo", "Albero"],
      accent: ["Azul cobalto o ultramar", "Verde oliva", "Ocre tostado"],
      hexCodes: ["#ffffff", "#fbf8f2", "#c47a53", "#556b2f", "#1e3a8a"],
    },
    materials: {
      woods: ["Olivo", "Pino recuperado", "Vigas de encofrado envejecidas", "Cañizo y mimbre"],
      textiles: ["Lino rústico lavado de gran gramaje", "Algodón sin blanquear", "Esparto trenzado"],
      metals: ["Hierro forjado rústico", "Cobre envejecido"],
      minerals: ["Baldosa hidráulica artesanal", "Barro cocido manual", "Toba volcánica o piedra arenisca"],
    },
    furnitureGeometry: "Bancos de obra integrados con colchonetas de lino, mesas de tablones rústicos gruesos, asientos de cuerda trenzada o enea tradicional.",
    lightingStrategy: "Juegos de luces y sombras filtradas a través de celosías de cerámica, persianas alicantinas o pantallas de esparto calado.",
    sustainableCharacteristics: "Inercia térmica pasiva mediante suelos de barro y paredes de cal que mantienen la frescura estival de forma natural.",
    prohibitedElements: ["Materiales sintéticos o plásticos brillantes", "Suelos fríos de resina epoxi", "Iluminación fría azulada > 3500K"],
  },

  Industrial: {
    styleName: "Industrial",
    aliases: ["Urban Loft", "Tribeca Industrial", "Warehouse Style"],
    philosophy: "Celebración honesta de la arquitectura estructural y el pasado fabril: muros de ladrillo visto, hormigón desencofrado, vigas de hierro IPE y grandes ventanales de cuarterones.",
    palette: {
      dominant: ["Gris hormigón", "Ladrillo rojizo envejecido", "Pizarra"],
      secondary: ["Negro hierro oxidado", "Madera de derribo oscura", "Acero corten"],
      accent: ["Cuero cognac envejecido", "Latón oxidado", "Verde botella vintage"],
      hexCodes: ["#737373", "#8b4513", "#262626", "#b45309", "#1c1917"],
    },
    materials: {
      woods: ["Traviesas de ferrocarril recuperadas", "Nogal oscuro rústico con nudos y grietas"],
      textiles: ["Cuero curtido vegetal desgastado", "Lona gruesa de algodón encerado", "Denim pesado"],
      metals: ["Acero negro laminado en caliente", "Hierro fundido", "Tuberías vistas de fontanería"],
      minerals: ["Ladrillo tosco de tejar", "Hormigón pulido", "Vidrio armado con malla metálica"],
    },
    furnitureGeometry: "Estructuras abiertas vistas de tubo cuadrado de acero, uniones con remaches visibles, ruedas de hierro fundido en mesas bajas, estanterías suspendidas.",
    lightingStrategy: "Lámparas de suspensión esmaltadas estilo fábrica, bombillas de filamento visto tipo Edison regulables en ámbar ultra cálido (2200K).",
    sustainableCharacteristics: "Máxima reutilización y 'upcycling' de materiales de demolición y mobiliario industrial histórico rehabilitado.",
    prohibitedElements: ["Telas brillantes como raso o satén", "Muebles provenzales o recargados", "Paredes pintadas en colores pastel"],
  },

  "Mid-century": {
    styleName: "Mid-century",
    aliases: ["Mid-Century Modern (MCM)", "Diseño Años 50-60", "Retro Modern"],
    philosophy: "La era dorada del diseño del siglo XX (Eames, Saarinen, Nelson): perfecta conjunción entre producción industrial exquisita, madera noble y formas orgánicas futuristas.",
    palette: {
      dominant: ["Nogal americano medio", "Teka cálida", "Gris topo"],
      secondary: ["Blanco roto", "Mostaza dorado", "Verde aguacate / oliva"],
      accent: ["Naranja mandarina quemado", "Azul cerceta / petróleo", "Latón pulido"],
      hexCodes: ["#5c3a21", "#eab308", "#155e75", "#ea580c", "#f3f4f6"],
    },
    materials: {
      woods: ["Nogal americano con veta viva", "Teka maciza", "Palisandro sostenible"],
      textiles: ["Tapicerías de lana con textura 'tweed'", "Terciopelo denso", "Cuero liso anilina"],
      metals: ["Latón dorado cepillado", "Patas 'horquilla' (hairpin legs) de acero negro"],
      minerals: ["Mármol de Carrara blanco", "Fibra de vidrio moldeada", "Vidrio tintado ámbar"],
    },
    furnitureGeometry: "Líneas fluidas y aerodinámicas, patas en aguja cónicas ('peg legs'), respaldos ergonómicos curvados de contrachapado moldeado.",
    lightingStrategy: "Lámparas icónicas tipo 'Sputnik', apliques articulados de brazo móvil (estilo Serge Mouille) y lámparas de pie de arco en latón cepillado.",
    sustainableCharacteristics: "Mobiliario de altísima durabilidad y cotización coleccionable que trasciende modas pasajeras.",
    prohibitedElements: ["Muebles rústicos sin tratar", "Acabados decapados 'shabby chic'", "Estampados psicodélicos de mala calidad"],
  },

  "Clásico Contemporáneo": {
    styleName: "Clásico Contemporáneo",
    aliases: ["Transitional", "Haussmann Modern", "Neoclásico Cálido"],
    philosophy: "Diálogo sofisticado entre la arquitectura palaciega señorial (molduras de escayola, suelos en espiga, techos altos) y mobiliario de líneas contemporáneas sobrias y refinadas.",
    palette: {
      dominant: ["Blanco nube", "Gris perla señorial", "Arena de Fontainebleau"],
      secondary: ["Roble natural en espiga (chevron)", "Nogal oscuro", "Gris antracita"],
      accent: ["Latón satinado", "Azul zafiro profundo", "Burdeos oscuro"],
      hexCodes: ["#f8fafc", "#e2e8f0", "#a1a1aa", "#b45309", "#1e1b4b"],
    },
    materials: {
      woods: ["Roble francés aceitado en espiga", "Nogal barnizado al agua semimate"],
      textiles: ["Terciopelo de seda o lino", "Jacquard geométrico sutil", "Lana de alpaca"],
      metals: ["Latón satinado o envejecido", "Hierro forjado negro estilizado"],
      minerals: ["Mármol Calacatta con veta dorada o gris", "Molduras de yeso artesanales", "Espejos con pan de oro envejecido"],
    },
    furnitureGeometry: "Siluetas simétricas, proporciones equilibradas, sofás estilo 'Chesterfield' reinterpretados o sofás rectos con cojines mullidos de pluma.",
    lightingStrategy: "Espectacular lámpara central de suspensión de diseño escultórico en latón contrastando con molduras de techo clásicas; apliques de pared bidireccionales.",
    sustainableCharacteristics: "Conservación y restauración del patrimonio arquitectónico existente y selección de materiales nobles imperecederos.",
    prohibitedElements: ["Mobiliario de plástico desechable", "Lámparas con cables colgantes desordenados", "Colores flúor estridentes"],
  },

  Biofílico: {
    styleName: "Biofílico",
    aliases: ["Biophilic Design", "Eco-Living", "Naturaleza Integrada"],
    philosophy: "Diseño centrado en la conexión innata del ser humano con los ritmos y formas de la naturaleza, utilizando vegetación viva, formas fractales y materiales 100% orgánicos.",
    palette: {
      dominant: ["Verde salvia", "Tierra mojada", "Arcilla tostada", "Piedra de río"],
      secondary: ["Madera en bruto con cantos vivos (live edge)", "Corcho", "Bambú"],
      accent: ["Amarillo polen", "Teja profundo", "Verde bosque"],
      hexCodes: ["#84a98c", "#52796f", "#354f52", "#2f3e46", "#cad2c5"],
    },
    materials: {
      woods: ["Madera recuperada o con certificación FSC con bordes naturales", "Corcho aislante"],
      textiles: ["Lino salvaje", "Cáñamo cultivado orgánicamente", "Lana virgen"],
      metals: ["Cobre no tratado (con pátina natural antimicrobiana)", "Hierro forjado"],
      minerals: ["Piedras de río redondeadas", "Jardines verticales con riego por capilaridad", "Morteros de arcilla pura"],
    },
    furnitureGeometry: "Formas orgánicas que imitan curvas biológicas (hojas, piedras de río, olas), mesas de tronco natural con cantos irregulares respetados.",
    lightingStrategy: "Luz circadiana que emula el amanecer (cálida suave), cénit (3500K brillante) y atardecer (2200K ámbar). Focos LED con espectro fotosintético para las plantas.",
    sustainableCharacteristics: "Filtro activo de contaminantes ambientales, reducción del estrés medible (bajada de cortisol) y huella de carbono neutra.",
    prohibitedElements: ["Plantas artificiales de plástico", "Superficies sintéticas no transpirables", "Muebles de melamina imitación madera"],
  },
};
