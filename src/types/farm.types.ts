// Cardinal directions
export type Direction = 'north' | 'south' | 'east' | 'west';
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type Alignment = 'center' | Corner;

// Location coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Point for boundary tracing
export interface Point {
  x: number;
  y: number;
}

// Farm boundary shape
export interface FarmBoundary {
  points: Point[];
  area: number; // in acres
}

// Farming types
export type FarmingType =
  | 'single-layer'
  | 'multilayer'
  | 'livestock-only'
  | 'empty'
  | 'fallow';

export type SoilType =
  | 'red'
  | 'black'
  | 'alluvial'
  | 'clay'
  | 'sandy'
  | 'loamy'
  | 'limestone';

// Building details
export interface Building {
  id: string;
  type: 'livestock-shed' | 'storage' | 'house' | 'motor-room';
  position: Point;
  size: {
    width: number; // in cents
    height: number; // in cents
  };
  direction: Direction; // which direction it faces
  name?: string;
}

// Plant/Tree configuration
export interface PlantConfiguration {
  id: string;
  name: string;
  type: 'tree' | 'plant'; // tree for big trees, plant for small plants
  quantity: number;
  rows: number;
  columns: number;
  spacing: {
    rowSpacing: number; // in feet
    columnSpacing: number; // in feet
  };
  startFrom: Direction; // from which side to start planting
  placement?: 'grid' | 'border'; // grid for normal planting, border for around farm
  layer?: number; // for multilayer farming (1, 2, 3, etc.)
}

// Individual plant/tree instance
export interface Plant {
  id: string;
  configId: string; // reference to PlantConfiguration
  position: Point;
  layer: number;
  notes?: PlantNotes;
}

// Plant notes - for individual tree care
export interface PlantNotes {
  lastManured?: Date;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  age?: number; // in years
  notes: string[];
  diseased?: boolean;
  diseaseType?: string;
}

// Farm-level notes
export interface FarmNote {
  id: string;
  date: Date;
  type: 'fertilization' | 'irrigation' | 'weeding' | 'harvesting' | 'general';
  description: string;
  cost?: number;
  manpower?: number;
  materialsUsed?: string;
  affectsPlants?: string[]; // array of plant IDs
}

// Water sources
export interface WaterSource {
  id: string;
  type: 'well' | 'borewell' | 'tank' | 'pond';
  position: Point;
  depth?: number; // in feet
  capacity?: number; // in liters for tanks
  functional: boolean;
  notes?: string;
}

// Pipeline system
export interface Pipeline {
  id: string;
  points: Point[];
  type: 'irrigation' | 'underground';
  layer?: number; // for multilayer irrigation
  material?: 'pvc' | 'hdpe' | 'metal';
  diameter?: number; // in inches
}

// Gate valve
export interface GateValve {
  id: string;
  position: Point;
  connectedPipelines: string[]; // pipeline IDs
  status: 'open' | 'closed';
}

// Livestock
export interface Livestock {
  id: string;
  type: 'cow' | 'goat' | 'sheep' | 'chicken' | 'other';
  tag: string;
  age?: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  pregnant?: boolean;
  readyForMating?: boolean;
  notes?: string[];
  enclosureId?: string;
}

// Livestock enclosure
export interface LivestockEnclosure {
  id: string;
  type: 'net' | 'fence' | 'shed';
  boundary: Point[];
  capacity: number;
  currentCount: number;
  livestockIds: string[];
}

// Other farm elements
export interface FarmElement {
  id: string;
  type: 'electricity-post' | 'pit' | 'bee-box' | 'path';
  position: Point;
  size?: { width: number; height: number };
  points?: Point[]; // for paths
  locked?: boolean; // for edit mode
  notes?: string;
}

// Farm entry
export interface FarmEntry {
  side: Direction;
  alignment: Alignment;
  hasGate?: boolean;
}

// Road border information
export interface RoadBorder {
  sides: Direction[];
}

// Multilayer farming configuration
export interface MultilayerConfig {
  layers: number;
  plantConfigurations: PlantConfiguration[]; // each has layer property
}

// Complete farm data structure
export interface Farm {
  id: string;
  userId: string;
  name: string;
  description?: string;
  location: Coordinates;
  boundary: FarmBoundary;
  fenced: boolean;
  entry: FarmEntry;
  roadBorders: RoadBorder;

  // Farming details
  farmingType: FarmingType;
  soilType: SoilType;
  multilayerConfig?: MultilayerConfig;

  // Farm elements
  buildings: Building[];
  plantConfigurations: PlantConfiguration[];
  plants: Plant[];
  waterSources: WaterSource[];
  pipelines: Pipeline[];
  gateValves: GateValve[];
  livestock: Livestock[];
  livestockEnclosures: LivestockEnclosure[];
  otherElements: FarmElement[];

  // Notes and records
  farmNotes: FarmNote[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Farm view modes
export type FarmMode = 'view' | 'edit' | 'pipeline' | 'livestock';

// Farm view state
export interface FarmViewState {
  mode: FarmMode;
  selectedLayer: number; // for multilayer farming
  selectedElements: string[]; // IDs of selected elements
  zoom: number;
  pan: Point;
}
