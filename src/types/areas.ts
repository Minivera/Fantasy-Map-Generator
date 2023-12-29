import { Point } from './grid.ts';
import { BiomeIndexes } from '../data/biomes.ts';

/**
 * Flavour information about this area, which can create a story on the map. Not use for generation, but will be filled
 * as part of the political generation. For example, when a culture grows into an area, it will change the name of the
 * area and the features to match that culture's naming list. Other events may also change the flavour, like the birth
 * of a new religion.
 */
export interface AreaFlavour {
  name: string;
}

/**
 * The properties of this area, which are the properties assigned from the center cell. Things like the global biome of
 * this area, temperature, precipitation, population, and features.
 */
export interface AreaProperties {
  temperature: number;
  precipitation: number;
  height: number;
  population: number;
  biome: BiomeIndexes;

  /**
   * Array of harbors from the cells of this area. An area might have multiple cells that are considered to be natural
   * harbors.
   */
  harbor: number[];

  /**
   * Array of indexes for all the features in this area or touching this area.
   */
  features: number[];
}

/**
 * Definition for a map area. An area is a small collection of cells the identify a general physical area of the map,
 * like a riverside of an island. Areas should be roughly the same size and cover the whole map, political generation
 * will use areas rather than cells when selecting which part of the map they own.
 */
export interface Area {
  /**
   * The area's index, use to generate the color and find the area on the map.
   */
  index: number;

  /**
   * The area's flavour information, will be set once the political generation gives flavour to this area.
   */
  flavour?: AreaFlavour;

  /**
   * The properties of this area, usually set from the properties of the center cell.
   */
  properties: AreaProperties;

  /**
   * Which cells make up this area, for drawing purposes.
   */
  cells: number[];

  /**
   * Initial cell selected to generate this area, will be considered the "center" and main cell of the area.
   */
  center: number;

  /**
   * The points that make up this area's border, for drawing purposes.
   */
  border: Point[];

  /**
   * Areas adjacent to this area, to connect them for regions and other calculations.
   */
  adjacentAreas: Areas;
}

export type Areas = Area[];

/**
 * Flavour information about this region, which helps with the map's narrative. The flavour will be generated after
 * most regions have had their flavour added. We will look at the culture that owns most of this region and use
 * it as the flavour generator.
 */
export interface RegionFlavour {
  name: string;
}

/**
 * A region is a group of area that are adjacent and share common properties. This helps combine areas together to create
 * things like mountain ranges or plains.
 */
export interface Region {
  /**
   * Which areas make up this region, they should be selected pretty rigorously to make sure we don't over-extend a
   * region.
   */
  areas: Areas;

  /**
   * This region's flavour information.
   */
  flavour?: RegionFlavour;
}
