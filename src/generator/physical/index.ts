import Alea from 'alea';

import { PhysicalMap, Coordinates } from '../../types/map.ts';
import {
  getIndexFromProbabilityArray,
  probability,
} from '../../utils/probability.ts';
import { Grid, Point } from '../../types/grid.ts';
import { FeaturesMap, LandType } from '../../types/featuresMap.ts';
import { gauss, roundNumber } from '../../utils/math.ts';

import { generateGrid } from './grid.ts';
import { generateHeightmap } from './heightmap.ts';
import { HeightmapTemplate, heightmapTemplates } from './heightmapTemplates.ts';
import { markFeatures } from './mapFeatures.ts';
import { generateClimate } from './temperature.ts';

/**
 * Define map size and position based on template and random factor
 */
const defineMapSize = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  featuresMap: FeaturesMap,
  template: HeightmapTemplate
): Point => {
  const { features } = featuresMap;
  const { cells } = grid;

  // if land goes over map borders
  const part = cells.some(
    (c, i) => c.isNearBorder && features[i].type === LandType.LAND
  );
  // max size
  const max = part ? 80 : 100;
  // latitude shift
  const lat = () => gauss(probability(randomizer, 0.5) ? 40 : 60, 15, 25, 75);

  if (!part) {
    if (template.name === heightmapTemplates.pangea.name) {
      return [100, 50];
    }
    if (
      template.name === heightmapTemplates.shattered.name &&
      probability(randomizer, 0.7)
    ) {
      return [100, 50];
    }
    if (
      template.name === heightmapTemplates.continents.name &&
      probability(randomizer, 0.5)
    ) {
      return [100, 50];
    }
    if (
      template.name === heightmapTemplates.archipelago.name &&
      probability(randomizer, 0.35)
    ) {
      return [100, 50];
    }
    if (
      template.name === heightmapTemplates.highIsland.name &&
      probability(randomizer, 0.25)
    ) {
      return [100, 50];
    }
    if (
      template.name === heightmapTemplates.lowIsland.name &&
      probability(randomizer, 0.1)
    ) {
      return [100, 50];
    }
  }

  if (template.name === heightmapTemplates.pangea.name) {
    return [gauss(70, 20, 30, max), lat()];
  }
  if (template.name === heightmapTemplates.volcano.name) {
    return [gauss(20, 20, 10, max), lat()];
  }
  if (template.name === heightmapTemplates.mediterranean.name) {
    return [gauss(25, 30, 15, 80), lat()];
  }
  if (template.name === heightmapTemplates.peninsula.name) {
    return [gauss(15, 15, 5, 80), lat()];
  }
  if (template.name === heightmapTemplates.isthmus.name) {
    return [gauss(15, 20, 3, 80), lat()];
  }
  if (template.name === heightmapTemplates.atoll.name) {
    return [gauss(5, 10, 2, max), lat()];
  }

  // Continents, Archipelago, High Island, Low Island
  return [gauss(30, 20, 15, max), lat()];
};

export const generatePhysicalMap = (
  randomizer: ReturnType<typeof Alea>,
  options: {
    /**
     * Number of cells to generate for the physical map
     */
    cellsToGenerate: number;

    /**
     * Width of the physical map graph to display on scree.
     */
    graphWidth: number;

    /**
     * Height of the physical map graph to display on scree.
     */
    graphHeight: number;

    /**
     * Limit elevation for lakes to generates, lakes won't generate if higher than this limit.
     */
    lakeElevationLimit: number;

    /**
     * Average temperature in Celsius at the equator of the globe this map is on.
     */
    temperatureEquator: number;

    /**
     * Average temperature in Celsius at the poles of the globe this map is on.
     */
    temperaturePole: number;

    /**
     * Exponent for height generation. Cell heights are powered by this exponent to generate the physical height in km.
     */
    heightExponent: number;

    /**
     * Modifier for the water amount clouds can bring. Defines rivers and biomes generation.
     */
    precipitationModifier: number;

    /**
     * Defines the wind directions and strength for calculating precipitations and biomes. Can be left as the default
     * value.
     */
    winds?: [number, number, number, number, number, number];

    /**
     * The max number of iterations to run when filling map depressions with lakes and rivers.
     */
    resolveDepressionsSteps: number;
  }
): PhysicalMap => {
  // Generate a cell grid first, all cells are flat. This gives us a good base to start working on.
  const grid = generateGrid(randomizer, options);

  const templatesArray = Object.values(heightmapTemplates);
  const heightmapTemplate =
    templatesArray[getIndexFromProbabilityArray(randomizer, templatesArray)];
  // Apply the heightmap on the cell grid to generate terrain
  const heightmap = generateHeightmap(
    randomizer,
    grid,
    heightmapTemplate,
    options
  );

  // Start marking the base features based on the template options
  const featuresMap = markFeatures(grid, heightmap, heightmapTemplate, options);

  // Define the map size and figure out where this map fits on a globe.
  const [mapSize, mapLatitude] = defineMapSize(
    randomizer,
    grid,
    featuresMap,
    heightmapTemplate
  );

  const latitudeT = roundNumber((mapSize / 100) * 180, 1);
  const latitudeN = roundNumber(
    90 - ((180 - latitudeT) * mapLatitude) / 100,
    1
  );
  const latitudeS = roundNumber(latitudeN - latitudeT, 1);

  const longitude = roundNumber(
    Math.min(((options.graphWidth / options.graphHeight) * latitudeT) / 2, 180)
  );
  const mapCoordinates: Coordinates = {
    latitudeT,
    latitudeN,
    latitudeS,
    longitudeT: longitude * 2,
    longitudeW: -longitude,
    longitudeE: longitude,
  };

  // Generate the climate based on the map's position on the globe
  generateClimate(
    randomizer,
    grid,
    featuresMap,
    heightmap,
    mapCoordinates,
    options
  );

  return {
    grid,
    heightmap,
    featuresMap,
    coordinates: mapCoordinates,
  };
};
