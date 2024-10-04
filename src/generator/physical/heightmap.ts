import Alea from 'alea';

import { Grid } from '../../types/grid.ts';

import { HeightmapTemplate } from './heightmapTemplates.ts';
import { Heightmap, HeightType } from '../../types/heightmap.ts';

const getBlobPower = (cellsCount: number) => {
  const blobPowerMap = {
    1000: 0.93,
    2000: 0.95,
    5000: 0.97,
    10000: 0.98,
    20000: 0.99,
    30000: 0.991,
    40000: 0.993,
    50000: 0.994,
    60000: 0.995,
    70000: 0.9955,
    80000: 0.996,
    90000: 0.9964,
    100000: 0.9973,
  };

  return blobPowerMap[cellsCount as keyof typeof blobPowerMap] || 0.98;
};

const getLinePower = (cellsCount: number) => {
  const linePowerMap = {
    1000: 0.75,
    2000: 0.77,
    5000: 0.79,
    10000: 0.81,
    20000: 0.82,
    30000: 0.83,
    40000: 0.84,
    50000: 0.86,
    60000: 0.87,
    70000: 0.88,
    80000: 0.91,
    90000: 0.92,
    100000: 0.93,
  };

  return linePowerMap[cellsCount as keyof typeof linePowerMap] || 0.81;
};

const fromTemplate = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  template: HeightmapTemplate,
  options: {
    cellsToGenerate: number;
    graphWidth: number;
    graphHeight: number;
  }
): Heightmap => {
  const { points } = grid;

  const blobPower = getBlobPower(options.cellsToGenerate);
  const linePower = getLinePower(options.cellsToGenerate);

  const heightmap: Heightmap = {
    heights: Array.from({ length: points.length }, () => ({
      height: 0,
      // Height types will be marked after we've defined the features, as they can lower the height
      // when we generate lakes.
      type: HeightType.OCEAN,
    })),
  };
  return template.steps.reduce((heightmap, step) => {
    return step(
      randomizer,
      grid,
      options.graphWidth,
      options.graphHeight,
      blobPower,
      linePower,
      heightmap
    );
  }, heightmap);
};

/**
 * Generates a random continent or set of continents for the map using the provided heightmap template. The template
 * describes a list of actions to take on each "pass" on the heightmap, which will generate various map features until
 * all passes are done.
 */
export const generateHeightmap = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  template: HeightmapTemplate,
  options: {
    cellsToGenerate: number;
    graphWidth: number;
    graphHeight: number;
  }
) => {
  // TODO: Add image templates
  return fromTemplate(randomizer, grid, template, options);
};
