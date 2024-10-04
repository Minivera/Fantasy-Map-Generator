export enum LandType {
  LAND = 'land',
  LAKE = 'lake',
  SEA = 'sea',
  OCEAN = 'ocean',
}

export enum TemperatureType {
  OCEAN = 'ocean',
  ARCTIC = 'arctic',
  OCEANIC = 'oceanic',
  CONTINENTAL = 'continental',
  SUBTROPICAL = 'subtropical',
  TROPICAL = 'tropical',
  SEMI_ARID = 'semi_arid',
  ARID = 'arid',
}

export enum WetnessType {
  WATER = 'water',
  WET = 'wet',
  NORMAL = 'normal',
  DRY = 'dry',
}

export enum VegetationType {
  JUNGLE = 'jungle',
  FOREST = 'forest',
  WOOD = 'woods',
  GRASSLANDS = 'grasslands',
  SPARSE = 'sparse',
  DESERT = 'desert',
}

/**
 * Define the features of a specific cell, like its land type, the distance to the coast, the temperature, vegetation,
 * humidity, and other daya that allows us to draw a complex map based on granular properties.
 */
export interface Feature {
  type: LandType;

  distanceToCoast: number;

  temperature: number;
  temperatureType: TemperatureType;

  precipitation: number;
  waterLevel: number;
  waterType: WetnessType;

  /**
   * The vegetation is a computed value taken from the temperature, precipitation, and water level. The dryer a place
   * is, the less vegetation it's likely to have.
   */
  vegetationType: VegetationType;
}

/**
 * Represents the features of each cell of the physical map, and feature groups intended as polygons for drawing on
 * the map.
 */
export interface FeaturesMap {
  /**
   * The feature data of each cell by their index, which contains everything needed to identify the cell's types and
   * physical features. Used to draw those features on the map.
   */
  features: Feature[];
}
