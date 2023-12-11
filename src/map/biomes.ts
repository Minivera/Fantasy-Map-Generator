import * as d3 from 'd3-array';

import { PackedGrid } from '../types/grid.ts';
import { roundNumber } from '../utils/math.ts';
import { isLandFilter } from '../utils/graph.ts';
import { BiomeIndexes, biomesMartix } from '../data/biomes.ts';

/**
 * Calculates the general moisture level of a cell by checking how close it is to a wated feature and it's
 * precipitation level.
 */
const calculateMoisture = (grid: PackedGrid, i: number) => {
  const { cells } = grid;
  const { precipitation } = grid.cells;

  let moist = precipitation[cells.gridIndex[i]];
  if (cells.rivers[i]) {
    moist += Math.max(cells.waterFlux[i] / 20, 2);
  }

  const n = cells.adjacentCells[i]
    .filter(isLandFilter(cells))
    .map(c => precipitation[cells.gridIndex[c]])
    .concat([moist]);

  return roundNumber(4 + (d3.mean(n) as number));
};

/**
 * Checks if the moisture level, temperature, and height combine to mean the cell with these value is a
 * wetland cell or not.
 */
const isWetLand = (moisture: number, temperature: number, height: number) => {
  // near coast
  if (moisture > 40 && temperature > -2 && height < 25) {
    return true;
  }

  // off coast
  return moisture > 24 && temperature > -2 && height > 24 && height < 60;
};

/**
 * Returns the biome ID from the preconfigured biome data of the map given the moisture level, the temprature
 * and the height of the cell.
 */
const getBiomeId = (moisture: number, temperature: number, height: number) => {
  // marine biome: all water cells
  if (height < 20) {
    return BiomeIndexes.MARINE;
  }
  // permafrost biome
  if (temperature < -5) {
    return BiomeIndexes.GLACIER;
  }
  // wetland biome
  if (isWetLand(moisture, temperature, height)) {
    return BiomeIndexes.WETLAND;
  }

  // [0-4]
  const moistureBand = Math.min((moisture / 5) | 0, 4);
  // [0-25]
  const temperatureBand = Math.min(Math.max(20 - temperature, 0), 25);

  return biomesMartix[moistureBand][temperatureBand];
};

/**
 * Defines the bio of each cell by assigning it a new biome ID based on the cell's environment, such as
 * its temperature, height, or proximity with various features.
 */
export const defineBiomes = (grid: PackedGrid) => {
  const { cells } = grid;
  const { temperatures } = grid.cells;
  // biomes array
  cells.biomes = new Uint8Array(cells.indexes.length);

  for (const i of cells.indexes) {
    const temperature = temperatures[cells.gridIndex[i]];
    const height = cells.heights[i];
    const moisture = height < 20 ? 0 : calculateMoisture(grid, i);
    cells.biomes[i] = getBiomeId(moisture, temperature, height);
  }
};
