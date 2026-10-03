import type { FixedKind, FurnitureCategory } from "./types";

export type CatalogEntry = {
  kind: FixedKind;
  name: string;
  w: number;
  d: number;
  onWall: boolean; // se ancla a una pared
  emoji: string;
};

export const FIXED_CATALOG: CatalogEntry[] = [
  { kind: "door", name: "Puerta", w: 82, d: 0, onWall: true, emoji: "🚪" },
  { kind: "double_door", name: "Puerta doble", w: 140, d: 0, onWall: true, emoji: "🚪" },
  { kind: "sliding_door", name: "Puerta corredera", w: 90, d: 0, onWall: true, emoji: "↔️" },
  { kind: "window", name: "Ventana", w: 120, d: 0, onWall: true, emoji: "🪟" },
  { kind: "balcony", name: "Balconera", w: 160, d: 0, onWall: true, emoji: "🌇" },
  { kind: "radiator", name: "Radiador", w: 80, d: 12, onWall: true, emoji: "♨️" },
  { kind: "fireplace", name: "Chimenea", w: 120, d: 50, onWall: false, emoji: "🔥" },
  { kind: "wardrobe", name: "Armario empotrado", w: 180, d: 60, onWall: false, emoji: "🗄️" },
  { kind: "kitchen", name: "Encimera / cocina", w: 240, d: 62, onWall: false, emoji: "🍳" },
  { kind: "shelf", name: "Obra / estantería fija", w: 120, d: 35, onWall: false, emoji: "📚" },
  { kind: "column", name: "Pilar / columna", w: 30, d: 30, onWall: false, emoji: "⬛" },
  { kind: "stairs", name: "Escalera", w: 90, d: 280, onWall: false, emoji: "🪜" },
  { kind: "socket", name: "Enchufe", w: 12, d: 6, onWall: true, emoji: "🔌" },
  { kind: "tv_socket", name: "Toma TV / red", w: 12, d: 6, onWall: true, emoji: "📺" },
  { kind: "ac", name: "Aire acondicionado", w: 90, d: 25, onWall: true, emoji: "❄️" },
  { kind: "other", name: "Otro elemento fijo", w: 60, d: 60, onWall: false, emoji: "📦" },
];

export const catalogFor = (k: FixedKind) => FIXED_CATALOG.find((c) => c.kind === k)!;

/** Elementos que hacen hueco en la pared (puertas y ventanas). */
export const isOpening = (k: FixedKind) =>
  k === "door" || k === "double_door" || k === "sliding_door" || k === "window" || k === "balcony";

export const ROOM_TYPES = [
  "Salón-comedor",
  "Salón",
  "Comedor",
  "Dormitorio de matrimonio",
  "Dormitorio individual",
  "Dormitorio infantil",
  "Despacho",
  "Cocina",
  "Baño",
  "Recibidor",
  "Terraza",
  "Otro",
];

export const STYLES = [
  "Nórdico",
  "Moderno",
  "Minimalista",
  "Japandi",
  "Industrial",
  "Mediterráneo",
  "Boho",
  "Clásico",
  "Contemporáneo",
  "Rústico",
  "Mid-century",
];

export const SUGGESTION_CHIPS = [
  "Sofá de 3 plazas",
  "Sofá chaise longue",
  "Butaca",
  "TV de 65\"",
  "Mueble TV",
  "Mesa de comedor para 6",
  "Mesa de centro",
  "Cama de 150",
  "Cama de 90",
  "Mesitas de noche",
  "Escritorio",
  "Silla de oficina",
  "Estantería",
  "Alfombra",
  "Lámpara de pie",
  "Plantas",
  "Barra de sonido",
  "Cómoda",
  "Zona de lectura",
];

export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  "sofa",
  "armchair",
  "chair",
  "table",
  "desk",
  "bed",
  "nightstand",
  "storage",
  "shelf",
  "tv",
  "electronics",
  "rug",
  "lamp",
  "plant",
  "decor",
  "appliance",
  "other",
];
