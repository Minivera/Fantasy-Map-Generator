import { Point } from './grid.ts';

/**
 * The type of height biome of a cell, from lowest elevation to highest. This will help draw the various
 * groups of cells to represent the heights on the map in a more granular way.
 */
export enum HeightType {
  WATER = 'water',
  COASTAL = 'coastal',
  WETLANDS = 'wetlands',
  FLATLAND = 'flatland',
  PLATEAU = 'plateau',
  HILLS = 'hills',
  MOUNTAIN = 'mountain',
}

/**
 * Data for each cell's heightmap values, including their height and the type of height biome this cell is. Will also
 * store which landmass the cell is in, since this is defined by its height data.
 */
export interface CellHeightData {
  height: number;

  /**
   * Index of the landmass this cell is in. -1 is the cell is not in any landmass.
   */
  landmass: number;

  type: HeightType;
}

/**
 * Landmass information for a contiguous group of land cells. The coastline can be used for drawing the coast path, but
 * also as a polygon to find if a cell is inside a given landmass. You can assume that a landmass can be as small as
 * a single cell island, or as big as a map-wide continent.
 */
export interface Landmass {
  coastline: Point[];

  size: number;
}

/**
 * Represents the heightmap of the physical map, with each height data mapped to a specific cell of the grid.
 */
export interface Heightmap {
  /**
   * The height data of every cell in the grid, mapped to the cell's index. Loop over the cells to find every cell
   * heightmap data.
   */
  heights: CellHeightData[];

  /**
   * The landmasses created from the heighmap data, which is one or more groups of contiguous cells where the height is
   * above the sea level. Useful for drawing coastlines or detecting information about landmasses and the connected
   * oceans.
   */
  landmasses: Landmass[];
}
