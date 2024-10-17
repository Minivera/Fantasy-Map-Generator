/**
 * The land type defines what land is represented by this cell, which is either a special water cell or a land
 * cell.
 */
export enum LandType {
  LAND = 'land',
  LAKE = 'lake',
  SEA = 'sea',
  OCEAN = 'ocean',
}

/**
 * Represents the type #1 from the Köppen climate classification, based on temperature and precipitation
 * See: https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification
 */
export enum ClimateType {
  OCEAN = 'ocean',
  TROPICAL = 'tropical',
  DRY = 'dry',
  TEMPERATE = 'temperate',
  CONTINENTAL = 'continental',
  POLAR = 'polar',
}

/**
 * Represents the type #2 from the Köppen climate classification, based on precipitation
 * See: https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification
 */
export enum WetnessType {
  WATER = 'water',
  WET = 'wet',
  NORMAL = 'normal',
  DRY = 'dry',
}

/**
 * Unrelated to the Köppen climate classification, we estimate the level of vegetation based on precipitation,
 * temperature, and elevation, the apply some randomness through perlin noise to generate the vegetation type.
 */
export enum VegetationType {
  NONE = 'none',
  JUNGLE = 'jungle',
  FOREST = 'forest',
  WOOD = 'woods',
  GRASSLANDS = 'grasslands',
  SPARSE = 'sparse',
  DESERT = 'desert',
}

/**
 * Using the category #1 and #2 from the Köppen climate classification represented by the ClimateType and WetnessType,
 * we're able to compute the exact biome for a given cell. This will not be used for generation as a more granular
 * approach give us more flexibility. Rather, this is useful for display purposes and to help the users know what
 * kind of climate they should expect.
 *
 * We omit certain climate types from Köppen as they are either too granular for our purposes (leading to a noisy map
 * with too many biomes) or because they are based on the #3 category, which we ignore.
 */
export enum BiomeType {
  TROPICAL_RAINFOREST = 'Af',
  TROPICAL_MOONSOON = 'Am',
  TROPICAL_SAVANNA = 'As',

  HOT_DESERT = 'BWh',
  COLD_DESERT = 'BWk',
  HOT_SEMI_ARID = 'BSh',
  COLD_SEMI_ARID = 'BSk',

  MEDITERRANEAN = 'Csa',
  HUMID_SUBTROPICAL = 'Cfa',
  OCEANIC = 'Cfb',
  SUBPOLAR = 'Cfc',
  SUBTROPICAL = 'Cwa',

  HOT_CONTINENTAL = 'Dfa',
  HEMIBOREAL = 'Dfb',
  SUBARTIC = 'Dfc',

  TUNDRA = 'ET',
  ICE_CAP = 'EF',
}

/**
 * Define the features of a specific cell, like its land type, the distance to the coast, the temperature, vegetation,
 * humidity, and other daya that allows us to draw a complex map based on granular properties.
 */
export interface Feature {
  type: LandType;

  distanceToCoast: number;

  temperature: number;
  precipitation: number;
  waterLevel: number;

  climate: ClimateType;
  wetness: WetnessType;
  vegetation: VegetationType;

  biome: BiomeType;
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
