import Alea from 'alea';

import {
  HeightmapTemplate,
  heightmapTemplates,
} from '../data/heightmapTemplates.ts';
import { FeatureGroup, Grid, PackedGrid, Point } from '../types/grid.ts';
import {
  getIndexFromProbabilityArray,
  probability,
} from '../utils/probability.ts';
import { gauss, roundNumber } from '../utils/math.ts';

import { generateGrid, rankCells, reVoronoi } from './grid.ts';
import { generateHeightmap } from './heightmap.ts';
import { markFeatures, reMarkFeatures } from './features.ts';
import { Coordinates, generateClimate } from './temperature.ts';
import { generateRivers } from './rivers.ts';
import { defineLakeGroup } from './lakes.ts';
import { defineBiomes } from './biomes.ts';

export class Generator {
  private readonly seed: string;
  public readonly randomizer: ReturnType<typeof Alea>;

  constructor(seed?: string) {
    this.seed = seed ?? String(Math.floor(Math.random() * 1e9));
    this.randomizer = Alea(this.seed);
  }

  public generatePhysicalMap(options: {
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
  }) {
    // Generate a cell grid first, all cells are flat. This gives us a good base to start working on.
    const grid = generateGrid(this.randomizer, options);

    const templatesArray = Object.values(heightmapTemplates);
    const heightmapTemplate =
      templatesArray[
        getIndexFromProbabilityArray(this.randomizer, templatesArray)
      ];
    // Apply the heightmap on the cell grid to generate terrain
    grid.cells.heights = generateHeightmap(
      this.randomizer,
      grid,
      heightmapTemplate,
      options
    );

    // Start marking the base features based on the template options
    markFeatures(grid, heightmapTemplate, options);

    // Define the map size and figure out where this map fits on a globe.
    const [mapSize, mapLatitude] = this.defineMapSize(grid, heightmapTemplate);

    const latitudeT = roundNumber((mapSize / 100) * 180, 1);
    const latitudeN = roundNumber(
      90 - ((180 - latitudeT) * mapLatitude) / 100,
      1
    );
    const latitudeS = roundNumber(latitudeN - latitudeT, 1);

    const longitude = roundNumber(
      Math.min(
        ((options.graphWidth / options.graphHeight) * latitudeT) / 2,
        180
      )
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
    generateClimate(this.randomizer, grid, mapCoordinates, options);

    // Finalize the cells by running voronoi again now that we have all the physical geography in place
    const [finalCells, vertices] = reVoronoi(grid);

    // Pack all this new info in a complete packed grid with advanced types
    const packedGrid: PackedGrid = {
      ...grid,
      mapSize,
      mapLatitude,
      vertices,
      cells: finalCells,
      features: grid.features.map(feature => ({
        ...feature,
        cellsCount: 0,
        firstCell: 0,
        group: FeatureGroup.ISLE,
        vertices: [],
        area: 0,
      })),
    };

    // Redo all the features like rivers and lakes now that we have a more complete data set for each cells.
    reMarkFeatures(packedGrid, options);
    generateRivers(packedGrid, options);
    defineLakeGroup(packedGrid);

    // Define the biome for each cell now that we know everything about it's physical components
    defineBiomes(packedGrid);

    // Define the suitability and general population of the cell.
    // TODO: Right now this is considered a part of the physical geography of the map. Make more customizable.
    rankCells(packedGrid);

    return {
      ...packedGrid,
      vertices,
      cells: finalCells,
      mapSize,
      mapLatitude,
    } as PackedGrid;
  }

  /**
   * Define map size and position based on template and random factor
   * @private
   */
  private defineMapSize(grid: Grid, template: HeightmapTemplate): Point {
    // if land goes over map borders
    const part = grid.features.some(f => f.isLand && f.isBorder);
    // max size
    const max = part ? 80 : 100;
    // latitude shift
    const lat = () =>
      gauss(probability(this.randomizer, 0.5) ? 40 : 60, 15, 25, 75);

    if (!part) {
      if (template.name === heightmapTemplates.pangea.name) {
        return [100, 50];
      }
      if (
        template.name === heightmapTemplates.shattered.name &&
        probability(this.randomizer, 0.7)
      ) {
        return [100, 50];
      }
      if (
        template.name === heightmapTemplates.continents.name &&
        probability(this.randomizer, 0.5)
      ) {
        return [100, 50];
      }
      if (
        template.name === heightmapTemplates.archipelago.name &&
        probability(this.randomizer, 0.35)
      ) {
        return [100, 50];
      }
      if (
        template.name === heightmapTemplates.highIsland.name &&
        probability(this.randomizer, 0.25)
      ) {
        return [100, 50];
      }
      if (
        template.name === heightmapTemplates.lowIsland.name &&
        probability(this.randomizer, 0.1)
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
  }
}
