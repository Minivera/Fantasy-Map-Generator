/**
 * The type of height biome of a cell, from lowest elevation to highest. This will help draw the various
 * groups of cells to represent the heights on the map in a more granular way.
 */
export enum HeightType {
  OCEAN = 'ocean',
  COASTAL = 'coastal',
  WETLANDS = 'wetlands',
  FLATLAND = 'flatland',
  PLATEAU = 'plateau',
  HILLS = 'hills',
  MOUNTAIN = 'mountain',
}

/**
 * Data for each cell's heightmap values, including their height and the type of height biome this cell is.
 */
export interface CellHeightData {
  height: number;

  type: HeightType;
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
}
