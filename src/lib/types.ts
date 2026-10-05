// Todas las coordenadas del "mundo" están en CENTÍMETROS.
export type Pt = { x: number; y: number };

/** Una forma es una polilínea de paredes (abierta o cerrada). */
export type Shape = {
  id: string;
  points: Pt[];
  closed: boolean;
  /** Punto de control (bezier cuadrática) por segmento, null = recta. */
  curves: (Pt | null)[];
  /** Medida real introducida por el usuario (cm) por segmento. */
  lengths: (number | null)[];
};

export type FixedKind =
  | "door"
  | "double_door"
  | "sliding_door"
  | "window"
  | "balcony"
  | "radiator"
  | "fireplace"
  | "wardrobe"
  | "column"
  | "kitchen"
  | "stairs"
  | "shelf"
  | "socket"
  | "tv_socket"
  | "ac"
  | "other";

export type FixedItem = {
  id: string;
  kind: FixedKind;
  label?: string;
  w: number; // ancho (cm)
  d: number; // fondo (cm)
  // Elementos libres
  x: number;
  y: number;
  rot: number; // grados
  // Elementos anclados a pared
  shapeId?: string;
  seg?: number;
  t?: number; // 0..1 a lo largo del segmento
  side?: 1 | -1; // lado de apertura
  hinge?: "start" | "end";
};

export type FurnitureCategory =
  | "sofa"
  | "armchair"
  | "chair"
  | "table"
  | "desk"
  | "bed"
  | "nightstand"
  | "storage"
  | "shelf"
  | "tv"
  | "electronics"
  | "rug"
  | "lamp"
  | "plant"
  | "decor"
  | "appliance"
  | "other";

export type FurnitureItem = {
  id: string;
  name: string;
  category: FurnitureCategory;
  x: number; // centro
  y: number;
  w: number;
  d: number;
  rot: number;
  color?: string;
  material?: string;
  notes?: string;
};

export type Proposal = {
  id: string;
  title: string;
  summary: string;
  style: string;
  palette: string[];
  estimatedBudget?: number;
  items: FurnitureItem[];
  tips: string[];
  renders: string[]; // URLs (o data URLs) de renders
  feedbackHistory: string[];
  spaceOptimizationRationale?: string;
  energyEfficiencyTips?: string[];
  sustainabilityScore?: number; // 1..10
  bioclimaticNotes?: string;
};

export type Product = {
  item: string;
  name: string;
  store: string;
  price?: string;
  url: string;
  description?: string;
  dimensions?: string;
};

export type Step = "sketch" | "measure" | "fixed" | "design" | "products";

export type ProjectData = {
  step: Step;
  shapes: Shape[];
  fixed: FixedItem[];
  planReady: boolean;
  wallHeight: number;
  wallThickness: number;
  brief: string;
  style: string;
  budget: string;
  proposals: Proposal[];
  activeProposalId?: string;
  chosenProposalId?: string;
  products: Product[];
};

export type Project = {
  id: string;
  name: string;
  room_type: string;
  data: ProjectData;
  created_at?: string;
  updated_at?: string;
};

export const emptyData = (): ProjectData => ({
  step: "sketch",
  shapes: [],
  fixed: [],
  planReady: false,
  wallHeight: 250,
  wallThickness: 15,
  brief: "",
  style: "Nórdico",
  budget: "",
  proposals: [],
  products: [],
});
